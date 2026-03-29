// entities/Player.js
import BaseEntity from './BaseEntity.js';
import Skill from './Skill.js';
import { ENTITY_SIZE_CONFIG, CHARACTER_ASSET_CONFIG } from '../config/assets.js';
import { SKILL_CONFIG } from '../config/skill.js';
import { CHARACTER_CONFIG, DEFAULT_CHARACTER_KEY, getCharacterConfig } from '../config/characters/characters.js';
import { LOOT_CONFIG } from '../config/loot.js';
import MotionTrailEffect from './effects/MotionTrailEffect.js';
import { playSfx } from '../utils/audioSettings.js';

const selectAnimationName = (config) => {
    if (!config?.animations) return 'idle';
    if (config.animations.idle) return 'idle';
    const keys = Object.keys(config.animations);
    return keys.length ? keys[0] : 'idle';
};

const buildFrameKey = (assetKey, animName, frameIndex = 0) => `${assetKey}_${animName}_${frameIndex}`;
const DEFAULT_CHARACTER_HP = 10000;
const DEFAULT_CHARACTER_ARMOR = 1;
const MAX_ACTIVE_SKILLS = 6;
const TARGET_VIEW_MARGIN = 100;

export default class Player extends BaseEntity {
    constructor(scene, x, y, characterKey = DEFAULT_CHARACTER_KEY) {
        const requestedKey = characterKey ?? DEFAULT_CHARACTER_KEY;
        const resolvedKey = CHARACTER_CONFIG[requestedKey] ? requestedKey : DEFAULT_CHARACTER_KEY;
        const characterConfig = getCharacterConfig(resolvedKey);
        const characterAssetConfig = CHARACTER_ASSET_CONFIG[resolvedKey] ?? CHARACTER_ASSET_CONFIG[characterConfig?.assetKey ?? resolvedKey] ?? {};
        const assetKey = characterConfig?.assetKey ?? resolvedKey;
        const animName = selectAnimationName(characterAssetConfig);
        const initialTexture = characterAssetConfig?.atlas?.key ?? buildFrameKey(assetKey, animName, 0);
        const initialFrame = characterAssetConfig?.atlas
            ? (characterAssetConfig.animations?.move?.frames?.[0] ?? characterAssetConfig.animations?.idle?.frames?.[0])
            : undefined;
        super(scene, x, y, initialTexture, initialFrame);
        this.speed = 200;
        this.maxHealth = characterConfig?.hp ?? DEFAULT_CHARACTER_HP;
        this.health = this.maxHealth;
        this.armor = characterConfig?.armor ?? DEFAULT_CHARACTER_ARMOR;
        this.displayedHealth = this.health;
        this.level = 1;
        this.currentXP = 0;
        this.xpToNextLevel = 100;
        this.displayedXP = 0;
        this.gold = 0;
        this.keys = scene.input.keyboard.addKeys('W,S,A,D,UP,DOWN,LEFT,RIGHT');
        this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.healthBarWidth = 160;
        this.healthBarHeight = 10;
        this.lastDamageTime = -Infinity;
        this.damageCooldown = 300;
        this.damageMultiplier = 1;
        this.bonusMaxHealthFlat = 0;
        this.bonusMaxHealthPercent = 0;
        this.bonusArmor = 0;
        this.bonusSpeedFlat = 0;
        this.bonusSpeedPercent = 0;
        this.globalCritChanceBonus = 0;
        this.xpGainMultiplier = 1;
        this.lootMagnetRadiusMultiplier = 1;
        this.healthRegenPerSecond = 0;
        this.regenAccumulator = 0;
        this.temporaryShield = 0;
        this.maxTemporaryShield = 0;
        this.shieldGainOnLevelUp = 0;
        this.shieldRegenAmount = 0;
        this.shieldRegenIntervalMs = 30000;
        this.shieldRegenTimer = 0;
        this.globalProjectileSpeedMultiplier = 1;
        this.globalSkillAreaMultiplier = 1;
        this.globalSkillDurationOffsetMs = 0;
        this.skillDamageBonusPercent = {};
        this.skillDamageFlatBonus = {};
        this.skillCooldownOffsets = {};
        this.skillAreaMultipliers = {};
        this.skillProjectileSpeedMultipliers = {};
        this.skillExplosionRadiusMultipliers = {};
        this.skillStunDurationMultipliers = {};
        this.skillEffectDurationBonuses = {};
        this.skillKnockbackCountBonuses = {};
        this.skillRuntimeConfigOverrides = {};
        this.hiddenPassiveEvolutionKeys = new Set();

        this.readyAnimated = false;

        // Skill cooldown
        this.skillCooldownOffset = 0;
        this.lastSkillCastTimes = {};
        this.isCastingSkill = false;
        this.attackAnimationDuration = 0;
        this.skillObjectCounts = {};
        this.skillObjectCount = 1;
        this.wasMovingLastFrame = false;
        this.lastMoveDirection = new Phaser.Math.Vector2(1, 0);
        this.activeSingleOrbitSkill = null;

        this.setCharacter(resolvedKey);
        this.motionTrailEffect = new MotionTrailEffect(scene, this);

        this.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => {
            this.ensurePhysicsSize();
            this.ensureVisibleState();
            this.setState('move');
        });
    }

    ensureVisibleState() {
        this.setVisible(true);
        this.setActive(true);
        this.setAlpha(1);
        this.setBlendMode(Phaser.BlendModes.NORMAL);
        this.setDepth(1000);
    }

    ensurePhysicsSize() {
        if (!this.body || this.readyAnimated) return;
        this.body.setSize(this.targetWidth, this.targetHeight);
        this.readyAnimated = true;
        this.setState('idle');
    }

    castBasicSpell() {
        const skillTypes = this.getActiveSkillKeys();
        let castedAnySkill = false;
        let latestCastReset = 0;
        skillTypes.forEach((skillType) => {
            const castDuration = this.castConfiguredSkill(skillType);
            if (castDuration > 0) {
                castedAnySkill = true;
                latestCastReset = Math.max(latestCastReset, castDuration, 500);
            }
        });
        if (!castedAnySkill || !this.scene?.time) return;
        this.isCastingSkill = true;
        this.scene.time.delayedCall(latestCastReset, () => {
            this.isCastingSkill = false;
        });
    }

    castConfiguredSkill(skillType) {
        if (!this.scene?.time) return 0;
        const now = this.scene.time.now;
        const attackDuration = this.attackAnimationDuration || 400;
        const skillCooldown = Math.max(this.getSkillCooldown(skillType), attackDuration);
        const lastCast = this.lastSkillCastTimes[skillType] ?? -Infinity;
        if (now - lastCast < skillCooldown) return 0;

        const count = this.getSkillObjectCount(skillType);
        const movementDirection = this.lastMoveDirection.clone();
        if (movementDirection.lengthSq() === 0) {
            movementDirection.set(this.flipX ? -1 : 1, 0);
        }
        const skillDefinition = this.getSkillConfig(skillType) ?? {};
        const alignWithMovement = skillDefinition.alignWithMovement ?? false;
        const baseAlignAngle = alignWithMovement
            ? Math.atan2(this.lastMoveDirection.y, this.lastMoveDirection.x)
            : 0;
        const dropFromSky = skillDefinition.dropFromSky ?? false;
        const skyHeight = skillDefinition.skyHeight ?? 400;
        let dropTargets = [];
        if (dropFromSky) {
            dropTargets = (this.scene?.enemies?.getChildren?.() ?? [])
                .filter(enemy => this.isEnemyWithinTargetView(enemy))
                .sort((a, b) => {
                    const distA = Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y);
                    const distB = Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y);
                    return distA - distB;
                });
        }
        const autoAim = skillDefinition.autoAim ?? false;
        const autoAimDistinctTargets = skillDefinition.autoAimDistinctTargets ?? false;
        const autoAimDelay = skillDefinition.autoAimBurstInterval ?? 70;
        const objectSpawnInterval = Math.max(0, skillDefinition.objectSpawnInterval ?? 0);
        const autoAimFanAngle = skillDefinition.autoAimFanAngle ?? 0;
        const autoAimSpawnRadius = skillDefinition.autoAimSpawnRadius ?? 0;
        const autoAimTargets = autoAim
            ? this.getAutoAimTargets(autoAimDistinctTargets ? count : 1)
            : [];
        const autoAimTarget = autoAimTargets[0] ?? null;

        const spawnSkillObject = (index) => {
            const skill = new Skill(this.scene, this, skillType);
            const angle = (Math.PI * 2 / count) * index;
            if (!autoAim) {
                skill.customAngle = angle;
            }
            skill.cast();
            if (skill.category === 'projectile') {
                const projectileTarget = autoAimDistinctTargets
                    ? (autoAimTargets[index % autoAimTargets.length] ?? autoAimTarget)
                    : autoAimTarget;
                if (autoAim && projectileTarget) {
                    const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, projectileTarget.x, projectileTarget.y);
                    const spreadStep = count > 1 ? autoAimFanAngle / (count - 1) : 0;
                    const angleOffset = count > 1 ? -autoAimFanAngle / 2 + spreadStep * index : 0;
                    const projectileAngle = targetAngle + angleOffset;
                    const spawnX = this.x + Math.cos(projectileAngle) * autoAimSpawnRadius;
                    const spawnY = this.y + Math.sin(projectileAngle) * autoAimSpawnRadius;
                    skill.autoAimTarget = projectileTarget;
                    skill.x = spawnX;
                    skill.y = spawnY;
                    skill.startX = spawnX;
                    skill.startY = spawnY;
                    skill.direction.set(
                        projectileTarget.x - spawnX,
                        projectileTarget.y - spawnY
                    ).normalize();
                    skill.setRotation(projectileAngle);
                    skill.setFlipX(false);
                } else {
                    let dx = Math.cos(angle);
                    let dy = Math.sin(angle);
                    if (alignWithMovement) {
                        const rotatedAngle = baseAlignAngle + angle;
                        dx = Math.cos(rotatedAngle);
                        dy = Math.sin(rotatedAngle);
                    }
                    let spawnX = this.x + dx * 16;
                    let spawnY = this.y + dy * 16;
                    if (dropFromSky) {
                        const target = dropTargets[index % dropTargets.length] ?? dropTargets[dropTargets.length - 1] ?? null;
                        const horizontalSpread = Math.random() * 32 - 16;
                        if (target) {
                            spawnX = target.x + horizontalSpread;
                            spawnY = target.y - skyHeight;
                            skill.dropTarget = target;
                        } else {
                            spawnX = this.x + horizontalSpread;
                            spawnY = this.y - skyHeight;
                            skill.dropTarget = null;
                        }
                        skill.dropXOffset = horizontalSpread;
                        dx = 0;
                        dy = 1;
                    }
                    skill.x = spawnX;
                    skill.y = spawnY;
                    skill.startX = skill.x;
                    skill.startY = skill.y;
                    skill.direction.set(dx, dy).normalize();
                    if (dropFromSky) {
                        skill.setRotation(Math.PI / 2);
                    } else {
                        skill.setRotation(Math.atan2(dy, dx));
                    }
                    skill.setFlipX(false);
                }
            } else if (!skill.isAura) {
                skill.x = this.x + Math.cos(angle) * 16;
                skill.y = this.y + Math.sin(angle) * 16;
            } else {
                skill.x = this.x;
                skill.y = this.y;
            }
            this.scene.skills.add(skill);
            return skill;
        };

        const spawnAll = () => {
            for (let i = 0; i < count; i += 1) {
                const spawnDelay = autoAim && autoAimTarget
                    ? i * autoAimDelay
                    : i * objectSpawnInterval;
                if (spawnDelay > 0 && this.scene?.time) {
                    this.scene.time.delayedCall(spawnDelay, () => spawnSkillObject(i));
                } else if (autoAim && autoAimTarget && this.scene?.time) {
                    this.scene.time.delayedCall(i * autoAimDelay, () => spawnSkillObject(i));
                } else {
                    spawnSkillObject(i);
                }
            }
        };

        if (skillDefinition.category === 'orbit' && count === 1) {
            if (this.activeSingleOrbitSkill && this.activeSingleOrbitSkill.active) {
                return 0;
            }
            this.activeSingleOrbitSkill = spawnSkillObject(0);
            if (this.activeSingleOrbitSkill) {
                this.activeSingleOrbitSkill.once('destroy', () => {
                    if (this.activeSingleOrbitSkill === this.activeSingleOrbitSkill) {
                        this.activeSingleOrbitSkill = null;
                    }
                });
            }
        } else {
            spawnAll();
        }

        this.lastSkillCastTimes[skillType] = now;
        return attackDuration;
    }


    update(time, delta) {
        if (this.isDead) return;

        this.ensureVisibleState();
        // Handle input
        let inputX = 0;
        let inputY = 0;

        if (this.keys.A.isDown || this.keys.LEFT.isDown) inputX -= 1;
        if (this.keys.D.isDown || this.keys.RIGHT.isDown) inputX += 1;
        if (this.keys.W.isDown || this.keys.UP.isDown) inputY -= 1;
        if (this.keys.S.isDown || this.keys.DOWN.isDown) inputY += 1;

        const touchInput = this.scene?.getTouchMoveVector?.() ?? { x: 0, y: 0, magnitude: 0, active: false };
        if (touchInput.active && touchInput.magnitude > 0) {
            inputX = touchInput.x * touchInput.magnitude;
            inputY = touchInput.y * touchInput.magnitude;
        }

        const movementInput = new Phaser.Math.Vector2(inputX, inputY);
        if (movementInput.lengthSq() > 1) {
            movementInput.normalize();
        }

        const velocityX = movementInput.x * this.speed;
        const velocityY = movementInput.y * this.speed;

        this.setVelocity(velocityX, velocityY);

        // Flip sprite based on horizontal movement direction
        if (velocityX < 0) {
            this.setFlipX(true); // facing left
        } else if (velocityX > 0) {
            this.setFlipX(false); // facing right
        }

        // Determine state priority based on casting versus movement
        const isMoving = velocityX !== 0 || velocityY !== 0;
        if (isMoving) {
            const movementVec = new Phaser.Math.Vector2(velocityX, velocityY);
            if (movementVec.lengthSq() > 0) {
                movementVec.normalize();
                this.lastMoveDirection.copy(movementVec);
            }
        }
        const attackAnimKey = `${this.type}_attack`;
        const hasAttackAnim = this.scene.anims.exists(attackAnimKey);
        if (this.isCastingSkill && hasAttackAnim) {
            this.setState('attack');
        } else if (isMoving) {
            this.setState('move');
        } else {
            this.setState('idle');
        }

        this.ensurePhysicsSize();

        // Check for manual input (still works) and auto-cast whenever cooldown allows
        if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
            this.castBasicSpell();
        }
        this.castBasicSpell();

        // if not yet set animation, play idle as fallback
        if (!this.anims.currentAnim && this.state !== 'dead') {
            this.setState('idle');
        }

        this.smoothHealthBar(delta);
        this.motionTrailEffect?.update(time, delta);
        this.smoothExpBar(delta);
        this.updateRegeneration(delta);
        this.updateShieldRegeneration(delta);
        this.attractLoot(delta);
        super.update(time, delta);
        this.wasMovingLastFrame = isMoving;
    }

    updateRegeneration(delta) {
        const regenPerSecond = this.healthRegenPerSecond ?? 0;
        if (!regenPerSecond || regenPerSecond <= 0 || this.isDead) return;
        this.regenAccumulator += (regenPerSecond * delta) / 1000;
        const healAmount = Math.floor(this.regenAccumulator);
        if (healAmount <= 0) return;
        this.regenAccumulator -= healAmount;
        this.heal(healAmount);
    }

    updateShieldRegeneration(delta) {
        const shieldRegenAmount = this.shieldRegenAmount ?? 0;
        const shieldRegenIntervalMs = this.shieldRegenIntervalMs ?? 0;
        if (!shieldRegenAmount || shieldRegenAmount <= 0 || !shieldRegenIntervalMs || shieldRegenIntervalMs <= 0 || this.isDead) {
            return;
        }
        this.shieldRegenTimer += delta;
        while (this.shieldRegenTimer >= shieldRegenIntervalMs) {
            this.shieldRegenTimer -= shieldRegenIntervalMs;
            this.recoverShield(shieldRegenAmount);
        }
    }

    attractLoot(delta) {
        const scene = this.scene;
        if (!scene) return;
        const lootSystem = scene.lootSystem;
        if (!lootSystem) return;
        const group = lootSystem.itemGroup;
        if (!group || !group.getChildren) return;
        const radius = (LOOT_CONFIG.magnetRadius ?? 0) * (this.lootMagnetRadiusMultiplier ?? 1);
        const speed = LOOT_CONFIG.magnetSpeed ?? 0;
        const threshold = LOOT_CONFIG.magnetThreshold ?? 0;
        if (radius <= 0 || speed <= 0) return;
        const items = group.getChildren();
        for (const item of items) {
            if (!item || !item.active || item.collected) continue;
            item.isMagnetized = false;
            const dist = Phaser.Math.Distance.Between(this.x, this.y, item.x, item.y);
            if (dist > radius) continue;
            if (dist <= threshold) {
                if (item.body) {
                    item.body.setVelocity(0, 0);
                }
                item.isMagnetized = true;
                if (!item.collected && typeof item.collect === 'function') {
                    item.collect(this);
                }
                continue;
            }
            if (scene.physics && item.body) {
                const angleToPlayer = Phaser.Math.Angle.Between(item.x, item.y, this.x, this.y);
                const vx = Math.cos(angleToPlayer) * speed;
                const vy = Math.sin(angleToPlayer) * speed;
                item.body.setVelocity(vx, vy);
                item.isMagnetized = true;
            }
        }
    }

    getAutoAimTarget() {
        return this.getAutoAimTargets(1)[0] ?? null;
    }

    getAutoAimTargets(count = 1) {
        if (!this.scene || !this.scene.enemies) return null;
        const enemies = this.scene.enemies.getChildren?.() ?? [];
        const activeEnemies = enemies.filter(enemy => this.isEnemyWithinTargetView(enemy));
        if (!activeEnemies.length) return [];

        const preferredEnemies = activeEnemies.filter(enemy => !enemy.isHacked);
        const fallbackEnemies = preferredEnemies.length ? preferredEnemies : activeEnemies;
        fallbackEnemies.sort((a, b) => Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y)
            - Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y));
        return fallbackEnemies.slice(0, Math.max(1, count));
    }

    isEnemyWithinTargetView(enemy, margin = TARGET_VIEW_MARGIN) {
        if (!enemy?.active || !this.scene?.cameras?.main) return false;
        const view = this.scene.cameras.main.worldView;
        return enemy.x >= view.left - margin
            && enemy.x <= view.right + margin
            && enemy.y >= view.top - margin
            && enemy.y <= view.bottom + margin;
    }

    aimProjectileAtTarget(skill, target) {
        if (!skill || !target) return;
        const dx = target.x - skill.x;
        const dy = target.y - skill.y;
        const dir = new Phaser.Math.Vector2(dx, dy);
        if (dir.lengthSq() === 0) {
            dir.set(1, 0);
        }
        dir.normalize();
        skill.direction.copy(dir);
        skill.setRotation(Math.atan2(dir.y, dir.x));
    }

    takeDamage(amount) {
        if (!this.scene) return;
        const now = this.scene.time.now;
        const last = this.lastDamageTime ?? -Infinity;
        if (now - last < this.damageCooldown) {
            return;
        }
        this.lastDamageTime = now;
        if (this.isDead) return;
        const mitigatedDamage = Math.max(1, Math.round((amount ?? 0) - (this.armor ?? DEFAULT_CHARACTER_ARMOR)));
        let remainingDamage = mitigatedDamage;
        if (this.temporaryShield > 0) {
            const absorbedDamage = Math.min(this.temporaryShield, remainingDamage);
            this.temporaryShield -= absorbedDamage;
            remainingDamage -= absorbedDamage;
        }
        if (remainingDamage > 0) {
            this.health = Phaser.Math.Clamp(this.health - remainingDamage, 0, this.maxHealth);
        }
        this.updateHealthBarUI();
        if (this.health <= 0) {
            this.isDead = true;
            this.setState('dead');
            this.setVelocity(0, 0);
            this.emit('player-dead');
            if (this.scene) {
                this.scene.events.emit('player-dead');
            }
        }
    }

    heal(amount) {
        if (typeof amount !== 'number' || amount <= 0) return;
        this.health = Phaser.Math.Clamp(this.health + amount, 0, this.maxHealth);
        this.updateHealthBarUI();
    }

    addXP(amount) {
        if (typeof amount !== 'number' || amount <= 0) return;
        const effectiveAmount = Math.max(1, Math.round(amount * (this.xpGainMultiplier ?? 1)));
        this.currentXP += effectiveAmount;
        while (this.currentXP >= this.xpToNextLevel) {
            this.currentXP -= this.xpToNextLevel;
            this.level += 1;
            this.xpToNextLevel = Math.ceil(this.xpToNextLevel * 1.3);
            this.onLevelUp();
        }
    }

    addGold(amount) {
        if (typeof amount !== 'number' || amount <= 0) return;
        this.gold += amount;
        this.updateGoldText();
    }

    onLevelUp() {
        const scene = this.scene;
        if (!scene) return;
        if ((this.shieldGainOnLevelUp ?? 0) > 0) {
            this.grantShield(this.shieldGainOnLevelUp);
        }
        playSfx(scene, 'sfx_levelup', { volume: 0.4 });
        const camera = scene.cameras && scene.cameras.main;
        if (camera) {
            camera.shake(220, 0.01, true);
        }
        const time = scene.time;
        if (time) {
            const originalScale = time.timeScale || 1;
            time.timeScale = 0.5;
            time.delayedCall(300, () => {
                if (time && time.timeScale !== originalScale) {
                    time.timeScale = originalScale;
                }
            });
        }
        this.playLevelUpEffect(this.x, this.y);
        if (scene.queueLevelUp) {
            scene.queueLevelUp();
        }
    }

    playLevelUpEffect(x, y) {
        const scene = this.scene;
        if (!scene) return;
        const heightOffset = this.baseHeight ? this.baseHeight * 0.6 : 30;
        const glow = scene.add.circle(x, y - heightOffset, 10, 0xffd966, 0.6);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({
            targets: glow,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 420,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                glow.destroy();
            }
        });

        const text = scene.add.text(x, y - heightOffset - 20, 'LEVEL UP', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffe066',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        scene.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            scale: 1.1,
            duration: 700,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                text.destroy();
            }
        });
    }

    applyCardEffect(cardConfig) {
        if (!cardConfig) return;
        const effects = Array.isArray(cardConfig.effects)
            ? cardConfig.effects
            : (cardConfig.effect ? [cardConfig.effect] : []);
        effects.forEach((effect) => this.applyEffect(effect));
    }

    applyEffect(effect) {
        if (!effect || typeof effect !== 'object') return;
        switch (effect.type) {
            case 'maxHealth': {
                const previousMaxHealth = this.maxHealth;
                const previousHealth = this.health;
                this.bonusMaxHealthFlat += effect.value ?? 0;
                this.updateHealthFromCharacterConfig();
                const gainedHealth = Math.max(0, this.maxHealth - previousMaxHealth);
                this.health = Math.min(this.maxHealth, previousHealth + gainedHealth);
                this.displayedHealth = this.health;
                break;
            }
            case 'maxHealthPercent': {
                const previousMaxHealth = this.maxHealth;
                const previousHealth = this.health;
                this.bonusMaxHealthPercent += effect.value ?? 0;
                this.updateHealthFromCharacterConfig();
                const gainedHealth = Math.max(0, this.maxHealth - previousMaxHealth);
                this.health = Math.min(this.maxHealth, previousHealth + gainedHealth);
                this.displayedHealth = this.health;
                break;
            }
            case 'speed':
                this.bonusSpeedFlat += effect.value ?? 0;
                this.updateSpeedFromConfig();
                break;
            case 'speedPercent':
                this.bonusSpeedPercent += effect.value ?? 0;
                this.updateSpeedFromConfig();
                break;
            case 'armor':
                this.bonusArmor += effect.value ?? 0;
                this.updateArmorFromConfig();
                break;
            case 'heal':
                this.heal(effect.value ?? 0);
                break;
            case 'skillCooldown':
                this.skillCooldownOffset += effect.value ?? 0;
                break;
            case 'allSkillDurationMs':
                this.globalSkillDurationOffsetMs += effect.value ?? 0;
                break;
            case 'skillCooldownFor':
                this.addSkillCooldownOffset(effect.skillKey, effect.value ?? 0);
                break;
            case 'damage':
                this.damageMultiplier = (this.damageMultiplier ?? 1) * (1 + (effect.value ?? 0));
                break;
            case 'skillDamagePercent':
                this.addSkillDamagePercent(effect.skillKey, effect.value ?? 0);
                break;
            case 'skillDamageFlat':
                this.addSkillDamageFlat(effect.skillKey, effect.value ?? 0);
                break;
            case 'skillObject':
                if (effect.skillKey) {
                    this.incrementSkillObjectCountForSkill(effect.skillKey, effect.value ?? 0);
                } else {
                    this.incrementSkillObjectCount(effect.value ?? 0);
                }
                break;
            case 'allSkillObjects':
                this.incrementAllSkillObjectCounts(effect.value ?? 0);
                break;
            case 'skillUnlock':
                this.unlockSkill(effect.skillKey);
                break;
            case 'unlockSkillOrElse':
                if (!this.hasSkill(effect.skillKey)) {
                    this.unlockSkill(effect.skillKey);
                } else {
                    (effect.elseEffects ?? []).forEach((nestedEffect) => this.applyEffect(nestedEffect));
                }
                break;
            case 'projectileSpeedPercent':
                this.globalProjectileSpeedMultiplier *= (1 + (effect.value ?? 0));
                break;
            case 'skillProjectileSpeedPercent':
                this.addSkillProjectileSpeedPercent(effect.skillKey, effect.value ?? 0);
                break;
            case 'skillExplosionRadiusPercent':
                this.addSkillExplosionRadiusPercent(effect.skillKey, effect.value ?? 0);
                break;
            case 'xpGainPercent':
                this.xpGainMultiplier *= (1 + (effect.value ?? 0));
                break;
            case 'healthRegenPerSecond':
                this.healthRegenPerSecond += effect.value ?? 0;
                break;
            case 'lootMagnetRadiusPercent':
                this.lootMagnetRadiusMultiplier *= (1 + (effect.value ?? 0));
                break;
            case 'shieldGrant':
                this.grantShield(effect.value ?? 0);
                break;
            case 'shieldOnLevelUp':
                this.shieldGainOnLevelUp += effect.value ?? 0;
                break;
            case 'shieldRegen':
                this.shieldRegenAmount += effect.value ?? 0;
                if (typeof effect.intervalMs === 'number' && effect.intervalMs > 0) {
                    this.shieldRegenIntervalMs = effect.intervalMs;
                }
                break;
            case 'skillAreaPercent':
                this.addSkillAreaPercent(effect.skillKey, effect.value ?? 0);
                break;
            case 'allSkillAreaPercent':
                this.globalSkillAreaMultiplier *= (1 + (effect.value ?? 0));
                break;
            case 'skillStunDurationPercent':
                this.addSkillStunDurationPercent(effect.skillKey, effect.value ?? 0);
                break;
            case 'skillEffectDurationMs':
                this.addSkillEffectDurationMs(effect.skillKey, effect.value ?? 0);
                break;
            case 'skillKnockbackCount':
                this.addSkillKnockbackCount(effect.skillKey, effect.value ?? 0);
                break;
            case 'skillConfigOverride':
                this.addSkillRuntimeConfigOverride(effect.skillKey, effect.overrides ?? {});
                break;
            case 'critChance':
                this.globalCritChanceBonus += effect.value ?? 0;
                break;
            default:
        }
    }

    getActiveSkillKey() {
        return this.scene?.activeSkillKey || 'thunder';
    }

    getSkillConfig(skillKey) {
        const baseConfig = SKILL_CONFIG[skillKey] ?? {};
        const runtimeOverride = this.skillRuntimeConfigOverrides[skillKey] ?? {};
        const resolvedConfig = {
            ...baseConfig,
            ...runtimeOverride
        };
        if (skillKey === 'sky_fall' && this.characterKey !== 'lumina') {
            resolvedConfig.explosionOnHit = false;
            resolvedConfig.explosionRadius = 0;
            resolvedConfig.explosionDamageMultiplier = 0;
            resolvedConfig.explosionKnockbackMultiplier = 0;
            resolvedConfig.behaviors = Array.isArray(resolvedConfig.behaviors)
                ? resolvedConfig.behaviors.filter((entry) => entry?.type !== 'explosionOnHit')
                : resolvedConfig.behaviors;
        }
        return resolvedConfig;
    }

    getActiveSkillKeys() {
        const activeSkillKeys = this.scene?.activeSkillKeys;
        if (Array.isArray(activeSkillKeys) && activeSkillKeys.length) {
            return activeSkillKeys;
        }
        return [this.getActiveSkillKey()];
    }

    getSkillObjectCount(skillKey) {
        const defaultCount = this.getSkillConfig(skillKey)?.defaultObjects ?? 1;
        return this.skillObjectCounts[skillKey] ?? defaultCount;
    }

    getSkillObjectMaxCount(skillKey) {
        const skillConfig = this.getSkillConfig(skillKey) ?? {};
        if (skillConfig.multipleObject === false) return 1;
        return skillConfig.maxObjects ?? 8;
    }

    setSkillObjectCount(skillKey, value) {
        const maxCount = this.getSkillObjectMaxCount(skillKey);
        this.skillObjectCounts[skillKey] = Math.max(1, Math.min(maxCount, value));
    }

    incrementSkillObjectCount(increment) {
        const activeSkillKey = this.getActiveSkillKey();
        const currentSkill = SKILL_CONFIG[activeSkillKey] || {};
        if (currentSkill.multipleObject === false) return false;
        const current = this.getSkillObjectCount(activeSkillKey);
        const max = this.getSkillObjectMaxCount(activeSkillKey);
        if (current >= max) return false;
        const newCount = Math.min(current + increment, max);
        this.setSkillObjectCount(activeSkillKey, newCount);
        return newCount !== current;
    }

    incrementSkillObjectCountForSkill(skillKey, increment) {
        const currentSkill = SKILL_CONFIG[skillKey] || {};
        if (!currentSkill || currentSkill.multipleObject === false) return false;
        const current = this.getSkillObjectCount(skillKey);
        const max = this.getSkillObjectMaxCount(skillKey);
        if (current >= max) return false;
        const newCount = Math.min(current + increment, max);
        this.setSkillObjectCount(skillKey, newCount);
        return newCount !== current;
    }

    incrementAllSkillObjectCounts(increment) {
        let changed = false;
        this.getActiveSkillKeys().forEach((skillKey) => {
            changed = this.incrementSkillObjectCountForSkill(skillKey, increment) || changed;
        });
        return changed;
    }

    hasSkill(skillKey) {
        return Array.isArray(this.scene?.activeSkillKeys) && this.scene.activeSkillKeys.includes(skillKey);
    }

    unlockSkill(skillKey) {
        if (!skillKey || !SKILL_CONFIG[skillKey]) return false;
        const currentSkills = Array.isArray(this.scene?.activeSkillKeys) ? [...this.scene.activeSkillKeys] : [];
        if (currentSkills.includes(skillKey)) return false;
        if (currentSkills.length >= MAX_ACTIVE_SKILLS) return false;
        currentSkills.push(skillKey);
        this.scene.activeSkillKeys = currentSkills;
        this.skillObjectCounts[skillKey] = this.getSkillConfig(skillKey)?.defaultObjects ?? 1;
        if (this.scene?.skillInputs?.[skillKey]) {
            this.scene.skillInputs[skillKey].checked = true;
        }
        return true;
    }

    getDefaultSkillKey() {
        return this.runtimeDefaultSkillKey ?? this.characterConfig?.defaultSkill ?? 'thunder';
    }

    hasPassiveEvolution(passiveKey) {
        return this.hiddenPassiveEvolutionKeys.has(passiveKey);
    }

    activateHiddenPassiveEvolution(passiveKey, passiveConfig = {}) {
        if (!passiveKey || this.hiddenPassiveEvolutionKeys.has(passiveKey)) return false;
        this.hiddenPassiveEvolutionKeys.add(passiveKey);
        const effects = Array.isArray(passiveConfig.effects) ? passiveConfig.effects : [];
        effects.forEach((effect) => this.applyEffect(effect));
        return true;
    }

    replaceSkill(sourceSkillKey, evolvedSkillKey) {
        if (!sourceSkillKey || !evolvedSkillKey || !SKILL_CONFIG[evolvedSkillKey] || !this.scene) return false;
        const currentSkills = Array.isArray(this.scene.activeSkillKeys) ? [...this.scene.activeSkillKeys] : [];
        const sourceIndex = currentSkills.indexOf(sourceSkillKey);
        if (sourceIndex === -1) return false;

        if (currentSkills.includes(evolvedSkillKey)) {
            currentSkills.splice(sourceIndex, 1);
        } else {
            currentSkills[sourceIndex] = evolvedSkillKey;
        }

        this.migrateSkillRuntimeState(sourceSkillKey, evolvedSkillKey);
        this.scene.activeSkillKeys = Array.from(new Set(currentSkills));
        if (this.scene.activeSkillKey === sourceSkillKey || !this.scene.activeSkillKeys.includes(this.scene.activeSkillKey)) {
            this.scene.activeSkillKey = evolvedSkillKey;
        }
        if (this.getDefaultSkillKey() === sourceSkillKey) {
            this.runtimeDefaultSkillKey = evolvedSkillKey;
        }
        Object.entries(this.scene.skillInputs ?? {}).forEach(([key, input]) => {
            input.checked = this.scene.activeSkillKeys.includes(key);
        });
        return true;
    }

    migrateSkillRuntimeState(sourceSkillKey, evolvedSkillKey) {
        const multiplicativeStores = [
            'skillDamageBonusPercent',
            'skillAreaMultipliers',
            'skillProjectileSpeedMultipliers',
            'skillExplosionRadiusMultipliers',
            'skillStunDurationMultipliers'
        ];
        const additiveStores = [
            'skillDamageFlatBonus',
            'skillCooldownOffsets',
            'skillEffectDurationBonuses',
            'skillKnockbackCountBonuses',
            'lastSkillCastTimes'
        ];

        multiplicativeStores.forEach((storeKey) => {
            const store = this[storeKey];
            if (!store || store[sourceSkillKey] === undefined) return;
            store[evolvedSkillKey] = store[evolvedSkillKey] ?? store[sourceSkillKey];
            delete store[sourceSkillKey];
        });

        additiveStores.forEach((storeKey) => {
            const store = this[storeKey];
            if (!store || store[sourceSkillKey] === undefined) return;
            store[evolvedSkillKey] = (store[evolvedSkillKey] ?? 0) + store[sourceSkillKey];
            delete store[sourceSkillKey];
        });

        if (this.skillObjectCounts[sourceSkillKey] !== undefined) {
            const nextCount = Math.min(
                this.skillObjectCounts[sourceSkillKey],
                this.getSkillObjectMaxCount(evolvedSkillKey)
            );
            this.skillObjectCounts[evolvedSkillKey] = Math.max(1, nextCount);
            delete this.skillObjectCounts[sourceSkillKey];
        }

        if (this.skillRuntimeConfigOverrides[sourceSkillKey] !== undefined) {
            this.skillRuntimeConfigOverrides[evolvedSkillKey] = {
                ...(this.skillRuntimeConfigOverrides[evolvedSkillKey] ?? {}),
                ...this.skillRuntimeConfigOverrides[sourceSkillKey]
            };
            delete this.skillRuntimeConfigOverrides[sourceSkillKey];
        }
    }

    setSkillRuntimeOverrides(skillKey, overrides = {}) {
        if (!skillKey) return;
        this.skillRuntimeConfigOverrides[skillKey] = {
            ...(this.skillRuntimeConfigOverrides[skillKey] ?? {}),
            ...overrides
        };
    }

    addSkillRuntimeConfigOverride(skillKey, overrides = {}) {
        if (!skillKey || !overrides || typeof overrides !== 'object') return;
        this.setSkillRuntimeOverrides(skillKey, overrides);
    }

    resolveAttackAnimationDuration() {
        if (!this.scene) return 0;
        const animKey = `${this.assetKey}_attack`;
        const anim = this.scene.anims.get(animKey);
        return anim?.duration ?? 400;
    }

    getSkillCooldown(skillKey) {
        const baseCooldown = this.getSkillConfig(skillKey)?.cooldown ?? 1000;
        const adjusted = baseCooldown + this.skillCooldownOffset + (this.skillCooldownOffsets[skillKey] ?? 0);
        return Math.max(200, adjusted);
    }

    getSkillDuration(skillKey) {
        const baseDuration = this.getSkillConfig(skillKey)?.duration ?? 500;
        return Math.max(1, baseDuration + (this.globalSkillDurationOffsetMs ?? 0));
    }

    addSkillDamagePercent(skillKey, value) {
        if (!skillKey) return;
        this.skillDamageBonusPercent[skillKey] = (this.skillDamageBonusPercent[skillKey] ?? 1) * (1 + value);
    }

    addSkillDamageFlat(skillKey, value) {
        if (!skillKey) return;
        this.skillDamageFlatBonus[skillKey] = (this.skillDamageFlatBonus[skillKey] ?? 0) + value;
    }

    addSkillCooldownOffset(skillKey, value) {
        if (!skillKey) return;
        this.skillCooldownOffsets[skillKey] = (this.skillCooldownOffsets[skillKey] ?? 0) + value;
    }

    addSkillAreaPercent(skillKey, value) {
        if (!skillKey) return;
        this.skillAreaMultipliers[skillKey] = (this.skillAreaMultipliers[skillKey] ?? 1) * (1 + value);
    }

    addSkillProjectileSpeedPercent(skillKey, value) {
        if (!skillKey) return;
        this.skillProjectileSpeedMultipliers[skillKey] = (this.skillProjectileSpeedMultipliers[skillKey] ?? 1) * (1 + value);
    }

    addSkillExplosionRadiusPercent(skillKey, value) {
        if (!skillKey) return;
        this.skillExplosionRadiusMultipliers[skillKey] = (this.skillExplosionRadiusMultipliers[skillKey] ?? 1) * (1 + value);
    }

    addSkillStunDurationPercent(skillKey, value) {
        if (!skillKey) return;
        this.skillStunDurationMultipliers[skillKey] = (this.skillStunDurationMultipliers[skillKey] ?? 1) * (1 + value);
    }

    addSkillEffectDurationMs(skillKey, value) {
        if (!skillKey) return;
        this.skillEffectDurationBonuses[skillKey] = (this.skillEffectDurationBonuses[skillKey] ?? 0) + value;
    }

    addSkillKnockbackCount(skillKey, value) {
        if (!skillKey) return;
        this.skillKnockbackCountBonuses[skillKey] = (this.skillKnockbackCountBonuses[skillKey] ?? 0) + value;
    }

    grantShield(value) {
        if (!value || value <= 0) return;
        this.maxTemporaryShield += value;
        this.temporaryShield = Math.min(this.maxTemporaryShield, this.temporaryShield + value);
    }

    recoverShield(value) {
        if (!value || value <= 0 || (this.maxTemporaryShield ?? 0) <= 0) return;
        this.temporaryShield = Math.min(this.maxTemporaryShield, this.temporaryShield + value);
    }

    getSkillDamageMultiplier(skillKey) {
        return this.skillDamageBonusPercent[skillKey] ?? 1;
    }

    getSkillDamageFlatBonus(skillKey) {
        return this.skillDamageFlatBonus[skillKey] ?? 0;
    }

    getSkillProjectileSpeedMultiplier(skillKey) {
        return (this.skillProjectileSpeedMultipliers[skillKey] ?? 1) * (this.globalProjectileSpeedMultiplier ?? 1);
    }

    getSkillExplosionRadiusMultiplier(skillKey) {
        return this.skillExplosionRadiusMultipliers[skillKey] ?? 1;
    }

    getSkillAreaMultiplier(skillKey) {
        const skillConfig = this.getSkillConfig(skillKey) ?? {};
        const category = skillConfig.category ?? 'area';
        const supportsGlobalArea = category === 'projectile' || category === 'orbit' || category === 'area' || category === 'aura';
        const skillMultiplier = this.skillAreaMultipliers[skillKey] ?? 1;
        return skillMultiplier * (supportsGlobalArea ? (this.globalSkillAreaMultiplier ?? 1) : 1);
    }

    getSkillStunDurationMultiplier(skillKey) {
        return this.skillStunDurationMultipliers[skillKey] ?? 1;
    }

    getSkillEffectDurationBonus(skillKey) {
        return this.skillEffectDurationBonuses[skillKey] ?? 0;
    }

    getSkillKnockbackCountBonus(skillKey) {
        return this.skillKnockbackCountBonuses[skillKey] ?? 0;
    }

    getSkillCritChanceBonus() {
        return this.globalCritChanceBonus ?? 0;
    }

    resolveAttackAnimationDuration() {
        if (!this.scene) return 400;
        const animKey = `${this.assetKey}_attack`;
        const anim = this.scene.anims.get(animKey);
        return anim?.duration ?? 400;
    }

    setCharacter(characterKey) {
        const requestedKey = characterKey ?? DEFAULT_CHARACTER_KEY;
        const resolvedKey = CHARACTER_CONFIG[requestedKey] ? requestedKey : DEFAULT_CHARACTER_KEY;
        const config = getCharacterConfig(resolvedKey);
        const assetKey = config?.assetKey ?? resolvedKey;
        const defaultSkill = config.defaultSkill ?? 'thunder';
        if (this.characterKey === resolvedKey) {
            this.characterConfig = config;
            this.runtimeDefaultSkillKey = this.runtimeDefaultSkillKey ?? defaultSkill;
            this.updateHealthFromCharacterConfig();
            this.updateArmorFromConfig();
            this.updateSpeedFromConfig();
            return this.runtimeDefaultSkillKey;
        }
        this.characterKey = resolvedKey;
        this.characterConfig = config;
        this.assetKey = assetKey;
        this.type = assetKey;
        const charSize = config.size ?? ENTITY_SIZE_CONFIG[assetKey] ?? { width: 42, height: 48 };
        this.targetWidth = charSize.width;
        this.targetHeight = charSize.height;
        this.baseWidth = charSize.width;
        this.baseHeight = charSize.height;
        const characterAssetConfig = CHARACTER_ASSET_CONFIG[assetKey] ?? CHARACTER_ASSET_CONFIG[resolvedKey] ?? {};
        if (characterAssetConfig.atlas) {
            const frameName = characterAssetConfig.animations?.move?.frames?.[0] ?? characterAssetConfig.animations?.idle?.frames?.[0];
            this.setTexture(characterAssetConfig.atlas.key, frameName);
        } else {
            const animName = selectAnimationName(config);
            const frameKey = buildFrameKey(assetKey, animName, 0);
            const textureKey = this.scene?.textures?.exists(frameKey) ? frameKey : `${assetKey}_${animName}`;
            this.setTexture(textureKey);
        }
        this.setDisplaySize(this.baseWidth, this.baseHeight);
        if (this.body) {
            this.body.setSize(this.targetWidth, this.targetHeight);
        }
        this.readyAnimated = false;
        this.state = null;
        this.previousState = null;
        this.setState('idle');
        const defaultSkillObjectCount = this.getSkillConfig(defaultSkill)?.defaultObjects ?? 1;
        this.skillObjectCounts = { [defaultSkill]: defaultSkillObjectCount };
        this.skillObjectCount = defaultSkillObjectCount;
        this.runtimeDefaultSkillKey = defaultSkill;
        this.isCastingSkill = false;
        this.attackAnimationDuration = this.resolveAttackAnimationDuration();
        this.idleFrameIndex = config?.idleFrameIndex ?? this.idleFrameIndex;
        this.updateHealthFromCharacterConfig();
        this.updateArmorFromConfig();
        this.updateSpeedFromConfig();
        return defaultSkill;
    }

    updateHealthFromCharacterConfig() {
        const baseMaxHealth = this.characterConfig?.hp ?? DEFAULT_CHARACTER_HP;
        const nextMaxHealth = Math.max(
            1,
            Math.round((baseMaxHealth * (1 + (this.bonusMaxHealthPercent ?? 0))) + (this.bonusMaxHealthFlat ?? 0))
        );
        const previousMaxHealth = Math.max(this.maxHealth ?? nextMaxHealth, 1);
        const healthRatio = Phaser.Math.Clamp((this.health ?? nextMaxHealth) / previousMaxHealth, 0, 1);
        this.maxHealth = nextMaxHealth;
        this.health = Math.round(this.maxHealth * healthRatio);
        this.displayedHealth = this.health;
    }

    updateSpeedFromConfig() {
        const baseSpeed = this.characterConfig?.speed ?? 200;
        this.speed = Math.max(1, Math.round((baseSpeed * (1 + (this.bonusSpeedPercent ?? 0))) + (this.bonusSpeedFlat ?? 0)));
    }

    updateArmorFromConfig() {
        this.armor = (this.characterConfig?.armor ?? DEFAULT_CHARACTER_ARMOR) + (this.bonusArmor ?? 0);
    }

    createHealthBarUI() {
        this.destroyHealthBarUI();
    }

    createExpBarUI() {
        this.destroyExpBarUI();
    }

    updateHealthBarUI() {
        return;
    }

    updateGoldText() {
        return;
    }

    getDisplayedDamage() {
        if (!this.scene) return 0;
        const skillKey = this.scene.activeSkillKey ?? 'thunder';
        const baseDamage = this.getSkillConfig(skillKey)?.damage ?? 0;
        const multiplier = this.damageMultiplier ?? 1;
        return Math.round(baseDamage * multiplier);
    }

    updateExpBarUI() {
        return;
    }

    smoothExpBar(delta) {
        const lerpAmount = Phaser.Math.Clamp(delta * 0.01, 0, 1);
        this.displayedXP = Phaser.Math.Linear(this.displayedXP, this.currentXP, lerpAmount);
        if (Math.abs(this.displayedXP - this.currentXP) < 0.1) {
            this.displayedXP = this.currentXP;
        }
    }

    destroyExpBarUI() {
        return;
    }

    destroyHealthBarUI() {
        return;
    }

    smoothHealthBar(delta) {
        const lerpAmount = Phaser.Math.Clamp(delta * 0.01, 0, 1);
        this.displayedHealth = Phaser.Math.Linear(this.displayedHealth, this.health, lerpAmount);
        if (Math.abs(this.displayedHealth - this.health) < 0.01) {
            this.displayedHealth = this.health;
        }
    }

    destroy(fromScene) {
        this.motionTrailEffect?.destroy();
        this.motionTrailEffect = null;
        this.destroyHealthBarUI();
        this.destroyExpBarUI();
        super.destroy(fromScene);
    }
}
