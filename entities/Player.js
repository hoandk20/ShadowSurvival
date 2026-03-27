// entities/Player.js
import BaseEntity from './BaseEntity.js';
import Skill from './Skill.js';
import { ENTITY_SIZE_CONFIG } from '../config/assets.js';
import { SKILL_CONFIG } from '../config/skill.js';
import { CHARACTER_CONFIG, DEFAULT_CHARACTER_KEY, getCharacterConfig } from '../config/characters/characters.js';
import { LOOT_CONFIG } from '../config/loot.js';
import MotionTrailEffect from './effects/MotionTrailEffect.js';

const selectAnimationName = (config) => {
    if (!config?.animations) return 'idle';
    if (config.animations.idle) return 'idle';
    const keys = Object.keys(config.animations);
    return keys.length ? keys[0] : 'idle';
};

const buildFrameKey = (assetKey, animName, frameIndex = 0) => `${assetKey}_${animName}_${frameIndex}`;

export default class Player extends BaseEntity {
    constructor(scene, x, y, characterKey = DEFAULT_CHARACTER_KEY) {
        const requestedKey = characterKey ?? DEFAULT_CHARACTER_KEY;
        const resolvedKey = CHARACTER_CONFIG[requestedKey] ? requestedKey : DEFAULT_CHARACTER_KEY;
        const characterConfig = getCharacterConfig(resolvedKey);
        const assetKey = characterConfig?.assetKey ?? resolvedKey;
        const animName = selectAnimationName(characterConfig);
        const initialTexture = characterConfig?.atlas?.key ?? buildFrameKey(assetKey, animName, 0);
        const initialFrame = characterConfig?.atlas
            ? (characterConfig.animations?.move?.frames?.[0] ?? characterConfig.animations?.idle?.frames?.[0])
            : undefined;
        super(scene, x, y, initialTexture, initialFrame);
        this.speed = 200;
        this.maxHealth = 10000;
        this.health = this.maxHealth;
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
        this.lastDamageTime = 0;
        this.damageCooldown = 300;
        this.damageMultiplier = 1;

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
        const skillType = this.scene?.activeSkillKey || 'thunder';
        if (this.isCastingSkill) return;
        const now = this.scene.time.now;
        const attackDuration = this.attackAnimationDuration || 400;
        const skillCooldown = Math.max(this.getSkillCooldown(skillType), attackDuration);
        const lastCast = this.lastSkillCastTimes[skillType] ?? -Infinity;
        if (now - lastCast < skillCooldown) return;

        // Create and cast skill
        const activeSkillKey = this.getActiveSkillKey();
        const count = this.getSkillObjectCount(activeSkillKey);
        const movementDirection = this.lastMoveDirection.clone();
        if (movementDirection.lengthSq() === 0) {
            movementDirection.set(this.flipX ? -1 : 1, 0);
        }
        const skillDefinition = SKILL_CONFIG[skillType] ?? {};
        const alignWithMovement = skillDefinition.alignWithMovement ?? false;
        const baseAlignAngle = alignWithMovement
            ? Math.atan2(this.lastMoveDirection.y, this.lastMoveDirection.x)
            : 0;
        const dropFromSky = skillDefinition.dropFromSky ?? false;
        const skyHeight = skillDefinition.skyHeight ?? 400;
        let dropTargets = [];
        if (dropFromSky) {
            dropTargets = (this.scene?.enemies?.getChildren?.() ?? [])
                .filter(enemy => enemy && enemy.active)
                .sort((a, b) => {
                    const distA = Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y);
                    const distB = Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y);
                    return distA - distB;
                });
        }
        const autoAim = skillDefinition.autoAim ?? false;
        const autoAimDelay = skillDefinition.autoAimBurstInterval ?? 70;
        const autoAimTarget = autoAim ? this.getAutoAimTarget() : null;

        const spawnSkillObject = (index) => {
            const skill = new Skill(this.scene, this, skillType);
            const angle = (Math.PI * 2 / count) * index;
            if (!autoAim) {
                skill.customAngle = angle;
            }
            skill.cast();
            if (skill.category === 'projectile') {
                if (autoAim && autoAimTarget) {
                    skill.autoAimTarget = autoAimTarget;
                    skill.x = this.x;
                    skill.y = this.y;
                    skill.startX = this.x;
                    skill.startY = this.y;
                    this.aimProjectileAtTarget(skill, autoAimTarget);
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
                if (autoAim && autoAimTarget && this.scene?.time) {
                    this.scene.time.delayedCall(i * autoAimDelay, () => spawnSkillObject(i));
                } else {
                    spawnSkillObject(i);
                }
            }
        };

        if (skillDefinition.category === 'orbit' && count === 1) {
            if (this.activeSingleOrbitSkill && this.activeSingleOrbitSkill.active) {
                return;
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
        this.isCastingSkill = true;
        this.scene.time.delayedCall(attackDuration, () => {
            this.isCastingSkill = false;
        });
        this.isCastingSkill = true;

        // Reset casting flag after skill duration
        this.scene.time.delayedCall(500, () => {
            this.isCastingSkill = false;
        });
    }


    update(time, delta) {
        if (this.isDead) return;

        this.ensureVisibleState();
        // Handle input
        let velocityX = 0;
        let velocityY = 0;

        if (this.keys.A.isDown || this.keys.LEFT.isDown) velocityX = -this.speed;
        if (this.keys.D.isDown || this.keys.RIGHT.isDown) velocityX = this.speed;
        if (this.keys.W.isDown || this.keys.UP.isDown) velocityY = -this.speed;
        if (this.keys.S.isDown || this.keys.DOWN.isDown) velocityY = this.speed;

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
        this.attractLoot(delta);
        super.update(time, delta);
        this.wasMovingLastFrame = isMoving;
    }

    attractLoot(delta) {
        const scene = this.scene;
        if (!scene) return;
        const lootSystem = scene.lootSystem;
        if (!lootSystem) return;
        const group = lootSystem.itemGroup;
        if (!group || !group.getChildren) return;
        const radius = LOOT_CONFIG.magnetRadius ?? 0;
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
        if (!this.scene || !this.scene.enemies) return null;
        const enemies = this.scene.enemies.getChildren?.() ?? [];
        const activeEnemies = enemies.filter(enemy => enemy && enemy.active);
        if (!activeEnemies.length) return null;
        activeEnemies.sort((a, b) => Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y)
            - Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y));
        return activeEnemies[0];
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
        const last = this.lastDamageTime || 0;
        const diff = now - last;
        if (now - last < this.damageCooldown) {
            return;
        }
        this.lastDamageTime = now;
        if (this.isDead) return;
        this.health = Phaser.Math.Clamp(this.health - amount, 0, this.maxHealth);
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
        this.currentXP += amount;
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
        if (!cardConfig || !cardConfig.effect) return;
        const effect = cardConfig.effect;
        switch (effect.type) {
            case 'maxHealth':
                this.maxHealth += effect.value;
                this.health = Math.min(this.health + effect.value, this.maxHealth);
                break;
            case 'speed':
                this.speed += effect.value;
                break;
            case 'heal':
                this.health = Math.min(this.health + effect.value, this.maxHealth);
                break;
            case 'skillCooldown':
                this.skillCooldownOffset += effect.value;
                break;
            case 'damage':
                this.damageMultiplier = (this.damageMultiplier ?? 1) * (1 + effect.value);
                break;
            case 'skillObject':
                this.incrementSkillObjectCount(effect.value);
                break;
            default:
        }
    }

    getActiveSkillKey() {
        return this.scene?.activeSkillKey || 'thunder';
    }

    getSkillObjectCount(skillKey) {
        return this.skillObjectCounts[skillKey] ?? 1;
    }

    getSkillObjectMaxCount(skillKey) {
        const skillConfig = SKILL_CONFIG[skillKey] ?? {};
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

    getDefaultSkillKey() {
        return this.characterConfig?.defaultSkill ?? 'thunder';
    }

    resolveAttackAnimationDuration() {
        if (!this.scene) return 0;
        const animKey = `${this.assetKey}_attack`;
        const anim = this.scene.anims.get(animKey);
        return anim?.duration ?? 400;
    }

    getSkillCooldown(skillKey) {
        const baseCooldown = SKILL_CONFIG[skillKey]?.cooldown ?? 1000;
        const adjusted = baseCooldown + this.skillCooldownOffset;
        return Math.max(200, adjusted);
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
            this.updateSpeedFromConfig();
            return defaultSkill;
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
        if (config.atlas) {
            const frameName = config.animations?.move?.frames?.[0] ?? config.animations?.idle?.frames?.[0];
            this.setTexture(config.atlas.key, frameName);
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
        this.skillObjectCounts = { [defaultSkill]: 1 };
        this.skillObjectCount = 1;
        this.isCastingSkill = false;
        this.attackAnimationDuration = this.resolveAttackAnimationDuration();
        this.idleFrameIndex = config?.idleFrameIndex ?? this.idleFrameIndex;
        this.updateSpeedFromConfig();
        return defaultSkill;
    }

    updateSpeedFromConfig() {
        this.speed = this.characterConfig?.speed ?? 200;
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
        const baseDamage = SKILL_CONFIG[skillKey]?.damage ?? 0;
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
