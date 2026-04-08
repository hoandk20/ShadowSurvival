import BaseEntity from './BaseEntity.js';
import { ENEMIES } from '../config/enemies.js';
import { ENEMY_BASE_STATS, getEnemyStats } from '../config/stats.js';
import { getStatusEffectConfig } from '../config/statusEffects.js';
import { getChestTypeConfig, rollChestType } from '../config/chests.js';
import { getFinalBossConfig, getFinalBossRoundConfig } from '../config/finalBosses.js';
import MotionTrailEffect from './effects/MotionTrailEffect.js';
import { cleanupZigzagDash, isZigzagDashing, maybeStartZigzagDash, updateZigzagDash } from '../systems/enemyBehaviors/zigzagDash.js';
import { tryRangedAttack, performBurstRangedAttack, performPoisonTrapAttack, performBurnTrapAttack } from '../systems/enemyBehaviors/rangedAttacks.js';
import { beginSniperAttack, destroySniperTelegraph as destroySniperTelegraphBehavior, spawnSniperTelegraph as spawnSniperTelegraphBehavior } from '../systems/enemyBehaviors/sniperAttack.js';
import {
    destroyDashAttackTelegraph as destroyDashAttackTelegraphBehavior,
    didDashPathIntersectPlayer as didDashPathIntersectPlayerBehavior,
    finishDashAttack as finishDashAttackBehavior,
    onDashAttackHitPlayer as onDashAttackHitPlayerBehavior,
    performDashAttack as performDashAttackBehavior,
    setDashMapCollisionEnabled as setDashMapCollisionEnabledBehavior,
    shootBackFan as shootBackFanBehavior,
    spawnBullet as spawnBulletBehavior,
    spawnDashAttackTelegraph as spawnDashAttackTelegraphBehavior,
    updateDashAttack as updateDashAttackBehavior,
    updateDashBackFanAttack as updateDashBackFanAttackBehavior
} from '../systems/enemyBehaviors/dashLunge.js';
import {
    getMeleeAttackDistance as getMeleeAttackDistanceBehavior,
    getMeleeEngageTargetId as getMeleeEngageTargetIdBehavior,
    hasSatisfiedMeleeEngageDelay as hasSatisfiedMeleeEngageDelayBehavior,
    performMeleeAttack as performMeleeAttackBehavior,
    resetMeleeEngageDelay as resetMeleeEngageDelayBehavior,
    tryAttackPlayer as tryAttackPlayerBehavior
} from '../systems/enemyBehaviors/meleeAttack.js';

const HITBOX_DISTANCE = 30;
const REPELL_FORCE = 220;
const ENEMY_SIZE_MULTIPLIER = 2;
const SEPARATION_UPDATE_INTERVAL_MS = 50;
const MAX_SEPARATION_NEIGHBORS = 6;
const STATUS_ICON_ATLAS_KEY = 'status_effect_icons';
const ATTACK_SQUASH_SCALE_X = 1.03;
const ATTACK_SQUASH_SCALE_Y = 0.72;
const ATTACK_BOUNCE_SCALE_X = 0.98;
const ATTACK_BOUNCE_SCALE_Y = 1.08;
const ATTACK_SQUASH_DURATION_MS = 70;
const ATTACK_BOUNCE_DURATION_MS = 105;
const DASH_LUNGE_STYLES = new Set(['dash_lunge', 'dash_lunge_bullet_trail', 'dash_lunge_back_fan']);
const DEFAULT_MELEE_ATTACK_CONFIG = Object.freeze({
    engageDelayMs: 90,
    windupMs: 110,
    recoveryMs: 120,
    rangePadding: 6,
    hitConfirmPadding: 18,
    dashSpeed: 280,
    dashDistance: 120,
    dashOvershootDistance: 100
});

export default class Enemy extends BaseEntity {
    constructor(scene, x, y, type) {
        super(scene, x, y, `${type}_move`, type);
        scene.physics.add.existing(this);
        this.enemyType = type;
        this.behaviorState = {};
        this.body.setImmovable(false);
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(0);

        const enemyConfig = ENEMIES[type] ?? {};
        this.enemyConfig = enemyConfig;
        const enemyStats = getEnemyStats(enemyConfig);
        this.speed = enemyStats.moveSpeed ?? ENEMY_BASE_STATS.moveSpeed;
        const rawDisplay = enemyConfig.displaySize || { width: 34, height: 50 };
        const rawHitbox = enemyConfig.hitboxSize || { width: HITBOX_DISTANCE, height: HITBOX_DISTANCE };
        this.baseDisplaySize = { width: rawDisplay.width, height: rawDisplay.height };
        this.baseHitboxSize = { width: rawHitbox.width, height: rawHitbox.height };
        this.displaySize = {
            width: rawDisplay.width,
            height: rawDisplay.height
        };
        this.hitboxSize = {
            width: rawHitbox.width,
            height: rawHitbox.height
        };
        this.maxHealth = enemyStats.maxHealth ?? ENEMY_BASE_STATS.maxHealth;
        this.health = this.maxHealth;
        this.damage = enemyStats.damage ?? ENEMY_BASE_STATS.damage;
        this.armor = enemyStats.armor ?? ENEMY_BASE_STATS.armor;
        this.effectResist = enemyStats.effectResist ?? ENEMY_BASE_STATS.effectResist;
        this.knockbackResist = enemyStats.knockbackResist ?? ENEMY_BASE_STATS.knockbackResist;
        this.stunResist = enemyStats.stunResist ?? ENEMY_BASE_STATS.stunResist;
        this.isStunned = false;
        this.damageTintTimer = null;
        this.stunTimer = null;
        this.knockbackVelocity = new Phaser.Math.Vector2(0, 0);
        this.knockbackTimer = 0;
        // Default knockback damping. Closer to 1 = decays slower (pushes farther).
        this.knockbackDragFactor = 0.97;
        this.knockbackVelocity = new Phaser.Math.Vector2(0, 0);
        this.knockbackTimer = 0;
        this.attackCooldown = enemyStats.attackCooldown ?? ENEMY_BASE_STATS.attackCooldown;
        this.attackRange = enemyStats.attackRange ?? ENEMY_BASE_STATS.attackRange;
        this.behavior = enemyConfig.behavior ?? 'chase';
        this.combatType = enemyConfig.combatType ?? (this.behavior === 'ranged' ? 'ranged' : 'melee');
        this.attackStyle = enemyConfig.attackStyle ?? (this.combatType === 'ranged' ? 'projectile_bolt' : 'contact_strike');
        this.rangedAttackConfig = enemyConfig.rangedAttack ?? null;
        this.meleeAttackConfig = {
            ...DEFAULT_MELEE_ATTACK_CONFIG,
            ...(enemyConfig.meleeAttack ?? {})
        };
        this.baseMeleeAttackConfig = { ...this.meleeAttackConfig };
        this.dashTelegraphWidth = Math.max(2, enemyConfig.dashTelegraphWidth ?? 6);
        this.dashTelegraphAlpha = Phaser.Math.Clamp(enemyConfig.dashTelegraphAlpha ?? 0.18, 0.05, 1);
        this.lastRangedAttackTime = -Infinity;
        this.lastAttackTime = -Infinity;
        this.isAttacking = false;
        this.pendingAttackTimer = null;
        this.meleeEngageStartedAt = -Infinity;
        this.meleeEngageTargetId = null;
        this.isDashAttacking = false;
        this.dashAttackTargetPoint = null;
        this.dashAttackDirection = new Phaser.Math.Vector2(0, 0);
        this.dashAttackLastPosition = new Phaser.Math.Vector2(x, y);
        this.dashAttackRemainingDistance = 0;
        this.dashAttackHitResolved = false;
        this.dashAttackTrackedPlayer = null;
        this.dashBackFanElapsedMs = 0;
        this.dashBackFanShotTimerMs = 0;
        this.dashAttackTelegraph = null;
        this.dashAttackTelegraphTween = null;
        this.attackSquashTween = null;
        this.attackBounceTween = null;
        this.sniperTelegraph = null;
        this.sniperTelegraphTween = null;
        this.attackVisualScale = { x: 1, y: 1 };
        this.stuckTimer = 0;
        this.ghostTimer = 0;
        this.ghostDuration = enemyStats.ghostDuration ?? ENEMY_BASE_STATS.ghostDuration;
        this.lastSafePosition = new Phaser.Math.Vector2(x, y);
        this.lastPosition = new Phaser.Math.Vector2(x, y);
        this.motionTrailEffect = null;
        this.scaleSize = enemyStats.scale ?? ENEMY_BASE_STATS.scale;
        this.baseStats = null;
        this.currentStats = null;
        this.pendingDeathSource = null;
        this.chestDropSpawned = false;
        this.explodeOnDead = enemyConfig.explodeOnDead ? {
            moveSpeedMultiplier: Math.max(1, enemyConfig.explodeOnDead.moveSpeedMultiplier ?? 1.4),
            delayMs: Math.max(0, enemyConfig.explodeOnDead.delayMs ?? 500),
            damage: Math.max(0, enemyConfig.explodeOnDead.damage ?? 50),
            radius: Math.max(12, enemyConfig.explodeOnDead.radius ?? 52),
            triggerOnPlayerContact: enemyConfig.explodeOnDead.triggerOnPlayerContact !== false,
            contactRadius: Math.max(8, enemyConfig.explodeOnDead.contactRadius ?? 18)
        } : null;
        if (this.explodeOnDead) {
            this.speed = Math.round(this.speed * this.explodeOnDead.moveSpeedMultiplier);
        }
        this.deathExplosionPrimed = false;
        this.deathExplosionResolved = false;
        this.deathExplosionTimer = 0;
        this.deathSequenceTimer = null;
        this.isDeathSequenceActive = false;
        this.contactExplosionStartedAt = null;
        this.isBoss = Boolean(enemyConfig.isBoss);
        this.isMiniBoss = Boolean(enemyConfig.isMiniBoss);
        this.finalBossKey = enemyConfig.finalBossKey ?? null;
        this.finalBossConfig = getFinalBossConfig(this.finalBossKey);
        this.finalBossRoundIndex = 0;
        this.isFinalBoss = Boolean(this.finalBossConfig);
        this.statusEffectTint = null;
        this.healthText = null;
        this.showHealthText = false;
        this.separationTimer = Phaser.Math.Between(0, SEPARATION_UPDATE_INTERVAL_MS);
        this.statusEffectIndicators = [];
        this.ignoreMapCollisionDuringDash = false;
        this.blockFreezeVisual = null;
        this.blockFreezeVisualTween = null;
        this.blockFreezeArmorBonus = 0;

        this.setVisible(false);
        this.setScale(1);
        this.setDepth(20);
        this.applyVisualDisplaySize();
        this.baseWidth = this.displaySize.width;
        this.baseHeight = this.displaySize.height;
        this.enforceHitboxSize();
        this.captureBaseStats();
        if (this.isFinalBoss) {
            this.isBoss = true;
            this.applyFinalBossRound(0, { preserveHealthRatio: false, emitEvent: false });
            this.captureBaseStats();
        }
        this.syncCollisionBodyTraits();
        this.scene?.statusEffectSystem?.attach?.(this, { entityType: 'enemy' });

        this.separation = new Phaser.Math.Vector2(0, 0);
        this.on(Phaser.Animations.Events.ANIMATION_UPDATE, this.handleAnimationUpdate, this);
        this.once(Phaser.GameObjects.Events.DESTROY, this.cleanupEffectTimers, this);
        this.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => {
            this.setState('move');
            this.anims.play(`${type}_move`, true);
            this.scene?.time?.delayedCall(16, () => {
                if (!this.active || !this.scene) return;
                this.setVisible(true);
                // Visual clarity: keep bosses brightest, regular enemies slightly dimmer than the player.
                if (this.isBoss || this.isMiniBoss || this.isFinalBoss) {
                    this.setAlpha(1);
                } else {
                    this.setAlpha(0.85);
                }
            });
        });
    }

    syncCollisionBodyTraits() {
        if (!this.body) return;
        const isHeavyEnemy = Boolean(this.isBoss || this.isMiniBoss || this.isFinalBoss);
        this.body.setImmovable?.(isHeavyEnemy);
        this.body.setPushable?.(!isHeavyEnemy);
    }

    update(time, delta, players, allEnemies) {
        if (!this.scene || !this.active) return;
        if (this.deathExplosionPrimed) {
            this.updateDeathExplosion(delta);
            this.updateHealthTextPosition();
            this.updateStuckMemory();
            return;
        }
        if (this.isDeathSequenceActive) {
            if (this.body) {
                this.body.setVelocity(0, 0);
            }
            this.updateHealthTextPosition();
            this.updateStuckMemory();
            return;
        }
        this.updateContactExplosionFuse(time);
        this.statusEffects?.update?.(delta);
        if (!this.scene || !this.active || !this.body) return;
        const targetPlayer = this.scene?.getNearestPlayerTarget?.(this.x, this.y) ?? (Array.isArray(players) ? players[0] : players);
        this.motionTrailEffect?.update(time, delta);
        if (this.anims?.currentAnim) {
            if (this.isStunned && !this.anims.isPaused) {
                this.anims.pause();
            } else if (!this.isStunned && this.anims.isPaused && !this.stunTimer && this.holdAnimationPaused !== true) {
                this.anims.resume();
            }
        }
        if (this.ghostTimer > 0) {
            this.ghostTimer -= delta;
            if (this.ghostTimer <= 0) {
                this.endGhostMode();
            }
        }
        if (this.isStunned) {
            this.body.setVelocity(0, 0);
        } else if (this.knockbackTimer > 0) {
            this.body.velocity.scale(this.knockbackDragFactor);
            this.knockbackTimer -= delta;
            if (this.knockbackTimer <= 0) {
                this.knockbackTimer = 0;
                this.body.setVelocity(0, 0);
                if (this.pendingDeathSource) {
                    this.handleDeath(this.pendingDeathSource);
                    return;
                }
            }
        } else if (isZigzagDashing(this)) {
            updateZigzagDash(this, targetPlayer, time);
        } else if (this.isDashAttacking) {
            this.updateDashAttack(targetPlayer);
        } else if (targetPlayer) {
            if (this.combatType === 'ranged') {
                this.updateRangedBehavior(targetPlayer, time);
            } else {
                this.updateMeleeBehavior(targetPlayer, time);
            }
        }
        this.separationTimer += delta;
        if (this.separationTimer >= SEPARATION_UPDATE_INTERVAL_MS) {
            this.separationTimer %= SEPARATION_UPDATE_INTERVAL_MS;
            this.applySeparation(allEnemies);
        }
        this.handleStuckInWall(targetPlayer, delta);
        // Keep sniper telegraph anchored after all movement / separation adjustments.
        if (this.sniperTelegraph?.active && typeof this.sniperTelegraph.__redraw === 'function') {
            this.sniperTelegraph.__redraw();
        }
        this.enforceHitboxSize();
        this.updateHealthTextPosition();
        this.updateStuckMemory();
    }

    takeDamage(amount, force = 0, direction = null, source = null, options = {}, skillConfig = null) {
        if (this.isDead || typeof amount !== 'number' || amount <= 0) return null;
        const amountWithCritFrozenBonus = this.applyCritBonusAgainstFrozen(amount, source, options);
        const incomingDamageContext = this.statusEffects?.beforeDamageTaken?.({
            amount: amountWithCritFrozenBonus,
            source,
            options,
            skillConfig,
            force,
            direction,
            attackTags: options?.attackTags ?? [],
            isCritical: options?.isCritical ?? false
        }) ?? { amount: amountWithCritFrozenBonus, absorbedDamage: 0 };
        const resolvedAmount = Math.max(0, incomingDamageContext.amount ?? amountWithCritFrozenBonus);
        const ignoreArmor = options?.ignoreArmor === true;
        const armorValue = Math.max(0, this.armor ?? 0);
        const armorPiercePercent = ignoreArmor ? 1 : this.resolveArmorPiercePercent(source, options);
        const piercedArmor = armorValue * armorPiercePercent;
        const effectiveArmor = ignoreArmor ? 0 : Math.max(0, armorValue - piercedArmor);
        const mitigatedAmount = Math.max(0, Math.round(resolvedAmount - effectiveArmor));
        // Global minimum damage dealt to enemies so high-armor targets still take chip damage.
        const MIN_DAMAGE_TO_ENEMY = 2;
        const actualDamage = Math.min(Math.max(MIN_DAMAGE_TO_ENEMY, mitigatedAmount), this.health);
        this.health = Phaser.Math.Clamp(this.health - actualDamage, 0, this.maxHealth);
        this.refreshHealthText();
        this.pendingDeathSource = null;
        if (!this.isStunned) {
            this.flashDamageTint();
        }
        const ignoreKnockbackWhileDashLocked = this.isDashLungeStyle()
            && (this.isDashAttacking || this.isAttacking || Boolean(this.dashAttackTargetPoint));
        if (!ignoreKnockbackWhileDashLocked && force && direction && direction.lengthSq() > 0 && this.body) {
            const speedMultiplier = skillConfig?.knockbackSpeedMultiplier ?? 1;
            let knockbackForce = force * (this.knockbackResist ?? 1) * speedMultiplier;
            const maxKnockbackSpeed = skillConfig?.maxKnockbackSpeed;
            if (typeof maxKnockbackSpeed === 'number') {
                knockbackForce = Math.min(knockbackForce, maxKnockbackSpeed);
            }
            this.knockbackVelocity.set(direction.x * knockbackForce, direction.y * knockbackForce);
            // Default knockback: longer + less damping for a clearer pushback feel.
            this.knockbackTimer = skillConfig?.knockbackDragDuration ?? 320;
            this.knockbackDragFactor = skillConfig?.knockbackDragFactor ?? 0.97;
            this.body.velocity.copy(this.knockbackVelocity);
        }
        if (this.health <= 0) {
            const finalBossDeathSequence = this.beginFinalBossDeathSequence(source);
            if (finalBossDeathSequence) {
                if (!finalBossDeathSequence.phaseChanged) {
                    this.spawnDeathChest(source);
                }
                return {
                    healthDamage: actualDamage,
                    absorbedDamage: incomingDamageContext.absorbedDamage ?? 0,
                    didKill: !finalBossDeathSequence.phaseChanged,
                    phaseChanged: finalBossDeathSequence.phaseChanged
                };
            }
            this.spawnDeathChest(source);
            const shouldDelayDeathForKnockback = Boolean(
                skillConfig?.knockbackTakeDamage
                && force > 0
                && direction
                && this.knockbackTimer > 0
            );
            if (shouldDelayDeathForKnockback) {
                this.pendingDeathSource = source;
            } else {
                this.handleDeath(source);
            }
        }
        if (skillConfig?.knockbackTakeDamage && !options?.fromChainDamage && direction) {
            this.scene?.applyKnockbackDamage?.(this, skillConfig, direction);
        }
        return {
            healthDamage: actualDamage,
            absorbedDamage: incomingDamageContext.absorbedDamage ?? 0,
            didKill: this.health <= 0
        };
    }

    getCurrentFinalBossRoundConfig() {
        if (!this.isFinalBoss) return null;
        return getFinalBossRoundConfig(this.finalBossKey, this.finalBossRoundIndex);
    }

    applyFinalBossRound(roundIndex = 0, options = {}) {
        if (!this.isFinalBoss) return false;
        const roundConfig = getFinalBossRoundConfig(this.finalBossKey, roundIndex);
        if (!roundConfig) return false;
        this.finalBossRoundIndex = roundIndex;
        this.applyRuntimeStats({
            maxHealth: roundConfig.maxHealth ?? this.maxHealth,
            damage: roundConfig.damage ?? this.damage,
            speed: roundConfig.speed ?? this.speed,
            scale: roundConfig.scale ?? this.scaleSize ?? 1,
            armor: roundConfig.armor ?? this.armor,
            effectResist: roundConfig.effectResist ?? this.effectResist,
            attackCooldown: roundConfig.attackCooldown ?? this.attackCooldown,
            attackRange: roundConfig.attackRange ?? this.attackRange,
            knockbackResist: roundConfig.knockbackResist ?? this.knockbackResist,
            stunResist: roundConfig.stunResist ?? this.stunResist,
            ghostDuration: roundConfig.ghostDuration ?? this.ghostDuration
        }, {
            preserveHealthRatio: options.preserveHealthRatio === true
        });
        this.behavior = roundConfig.behavior ?? this.behavior;
        this.combatType = roundConfig.combatType ?? this.combatType;
        this.attackStyle = roundConfig.attackStyle ?? this.attackStyle;
        this.meleeAttackConfig = {
            ...DEFAULT_MELEE_ATTACK_CONFIG,
            ...this.baseMeleeAttackConfig,
            ...(roundConfig.meleeAttack ?? {})
        };
        this.dashTelegraphWidth = Math.max(2, roundConfig.dashTelegraphWidth ?? this.enemyConfig?.dashTelegraphWidth ?? 6);
        this.dashTelegraphAlpha = Phaser.Math.Clamp(
            roundConfig.dashTelegraphAlpha ?? this.enemyConfig?.dashTelegraphAlpha ?? 0.18,
            0.05,
            1
        );
        this.setAlpha(1);
        if (options.emitEvent !== false) {
            this.scene?.events?.emit('boss-round-changed', {
                boss: this,
                roundIndex: this.finalBossRoundIndex,
                roundNumber: this.finalBossRoundIndex + 1,
                roundConfig
            });
        }
        return true;
    }

    tryAdvanceFinalBossRound() {
        if (!this.isFinalBoss) return false;
        const nextRoundIndex = this.finalBossRoundIndex + 1;
        const nextRoundConfig = getFinalBossRoundConfig(this.finalBossKey, nextRoundIndex);
        if (!nextRoundConfig) return false;
        this.isDead = false;
        this.pendingDeathSource = null;
        this.knockbackTimer = 0;
        this.knockbackVelocity.set(0, 0);
        this.body?.setVelocity?.(0, 0);
        this.isAttacking = false;
        this.isDashAttacking = false;
        this.dashAttackTargetPoint = null;
        this.destroyDashAttackTelegraph();
        this.applyFinalBossRound(nextRoundIndex, { preserveHealthRatio: false, emitEvent: true });
        this.scene?.cameras?.main?.shake?.(180, 0.004);
        this.scene?.skillBehaviorPipeline?.effects?.spawnExplosion?.(this.x, this.y, (this.depth ?? 20) + 2, {
            coreRadius: 10,
            outerRadius: 22,
            ringRadius: 38,
            coreColor: 0xfff0c7,
            outerColor: 0xd87a49,
            ringColor: 0x7a2d17,
            emberColor: 0xffc572,
            emberCount: 10
        });
        return true;
    }

    beginFinalBossDeathSequence(source = null) {
        return this.tryAdvanceFinalBossRound()
            ? { phaseChanged: true }
            : null;
    }

    getBossHudInfo() {
        if (!this.isBoss) return null;
        const finalBossConfig = this.finalBossConfig;
        const roundConfig = this.getCurrentFinalBossRoundConfig();
        return {
            key: finalBossConfig?.key ?? this.type,
            name: finalBossConfig?.hudName ?? finalBossConfig?.name ?? ENEMIES[this.type]?.name ?? this.type,
            health: Math.max(0, this.health ?? 0),
            maxHealth: Math.max(1, this.maxHealth ?? 1),
            roundIndex: this.finalBossRoundIndex,
            roundNumber: this.finalBossRoundIndex + 1,
            totalRounds: finalBossConfig?.rounds?.length ?? 1,
            barColor: finalBossConfig?.barColor ?? 0xd24e3b,
            barGlowColor: finalBossConfig?.barGlowColor ?? 0xffdca8,
            barFrameColor: finalBossConfig?.barFrameColor ?? 0x26110d,
            roundName: roundConfig?.name ?? null
        };
    }

    spawnDeathChest(source = null) {
        if (this.chestDropSpawned || !this.scene?.lootSystem) return null;
        this.pendingDeathSource = source ?? this.pendingDeathSource ?? null;
        const chestType = rollChestType({ isBoss: Boolean(this.isBoss || this.isMiniBoss) });
        const chestConfig = getChestTypeConfig(chestType);
        if (!chestConfig?.itemKey) return null;
        this.chestDropSpawned = true;
        const chestAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const chestRadius = Phaser.Math.Between(24, 38);
        const chestItem = this.scene.lootSystem.spawnItem(
            chestConfig.itemKey,
            this.x + Math.cos(chestAngle) * chestRadius,
            this.y + Math.sin(chestAngle) * chestRadius,
            1,
            {
                ...(this.scene.lootSystem.resolveLootOwnership?.(this) ?? {}),
                spawnBurstFromX: this.x,
                spawnBurstFromY: this.y
            }
        );
        if (!chestItem) return null;
        chestItem.setDepth?.(24);
        return chestItem;
    }

    updateDeathExplosion(delta) {
        if (!this.deathExplosionPrimed || this.deathExplosionResolved) return;
        if (this.body) {
            this.body.setVelocity(0, 0);
        }
        this.deathExplosionTimer -= delta;
        if (this.explodeOnDead?.triggerOnPlayerContact && this.isPlayerTouchingDeathExplosion()) {
            this.triggerDeathExplosion('contact');
            return;
        }
        if (this.deathExplosionTimer <= 0) {
            this.triggerDeathExplosion('timer');
        }
    }

    updateContactExplosionFuse(time) {
        if (!this.explodeOnDead?.triggerOnPlayerContact || this.isDead || this.deathExplosionResolved || this.deathExplosionPrimed) {
            this.contactExplosionStartedAt = null;
            return;
        }
        if (!Number.isFinite(this.contactExplosionStartedAt)) {
            return;
        }
        if ((time - this.contactExplosionStartedAt) >= (this.explodeOnDead?.delayMs ?? 500)) {
            this.triggerDeathExplosion('contact_fuse');
        }
    }

    isPlayerTouchingDeathExplosion() {
        const players = this.scene?.getActivePlayers?.() ?? [];
        const contactRadius = this.explodeOnDead?.contactRadius ?? 18;
        const radiusSq = contactRadius * contactRadius;
        return players.some((player) => {
            if (!player?.active || player?.isDead) return false;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            return ((dx * dx) + (dy * dy)) <= radiusSq;
        });
    }

    triggerDeathExplosion(reason = 'timer') {
        if (this.deathExplosionResolved) return;
        this.deathExplosionResolved = true;
        this.deathExplosionPrimed = false;
        this.contactExplosionStartedAt = null;
        this.isDead = true;

        const explosionConfig = this.explodeOnDead ?? {};
        const radius = Math.max(12, explosionConfig.radius ?? 52);
        const damage = Math.max(0, explosionConfig.damage ?? 50);
        const players = this.scene?.getActivePlayers?.() ?? [];
        const radiusSq = radius * radius;
        this.health = 0;
        this.spawnDeathChest(this.pendingDeathSource ?? null);

        players.forEach((player) => {
            if (!player?.active || player?.isDead) return;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            if (((dx * dx) + (dy * dy)) > radiusSq) return;
            player.takeDamage?.(damage, this, {
                fromEnemyAttack: true,
                fromEnemyExplosion: true,
                deathExplosionReason: reason
            });
        });

        this.scene?.skillBehaviorPipeline?.effects?.spawnExplosion?.(this.x, this.y, (this.depth ?? 20) + 2, {
            coreRadius: 8,
            outerRadius: 16,
            ringRadius: radius,
            coreColor: 0xfff2b3,
            outerColor: 0xff8c42,
            ringColor: 0xff5a36,
            emberColor: 0xffd27a,
            emberCount: 12,
            emberDistance: { min: 8, max: Math.max(21, Math.round(radius * 0.7)) },
            emberDuration: { min: 160, max: 280 }
        });

        this.finishDeath(this.pendingDeathSource ?? null);
    }

    resolveArmorPiercePercent(source = null, options = {}) {
        const ownerPlayer = source?.owner
            ?? source?.supporter?.owner
            ?? (options?.ownerPlayerId ? this.scene?.getPlayerById?.(options.ownerPlayerId) : null)
            ?? null;
        const rawValue = ownerPlayer?.armorPierce ?? 0;
        return Phaser.Math.Clamp(rawValue, 0, 1);
    }

    applyCritBonusAgainstFrozen(amount, source = null, options = {}) {
        const baseAmount = Math.max(0, Number(amount) || 0);
        if (baseAmount <= 0 || options?.isCritical !== true) return baseAmount;
        if (!this.statusEffects?.hasEffect?.('freeze')) return baseAmount;
        const ownerPlayer = source?.owner
            ?? source?.supporter?.owner
            ?? (options?.ownerPlayerId ? this.scene?.getPlayerById?.(options.ownerPlayerId) : null)
            ?? null;
        const ownerRunState = ownerPlayer
            ? this.scene?.getRunStateForPlayer?.(ownerPlayer)
            : null;
        const bonusRatio = Object.values(ownerRunState?.shopEffectBonuses ?? {}).reduce((total, itemBonuses) => {
            const freezeBonuses = itemBonuses?.freeze;
            if (!freezeBonuses || typeof freezeBonuses !== 'object') return total;
            return total + Math.max(0, Number(freezeBonuses.bonusCritDamageToFrozen) || 0);
        }, 0);
        if (bonusRatio <= 0) return baseAmount;
        return Math.max(0, Math.round(baseAmount * (1 + bonusRatio)));
    }

    isDashLungeStyle() {
        return DASH_LUNGE_STYLES.has(this.attackStyle);
    }

    updateRangedBehavior(targetPlayer, time) {
        const config = this.rangedAttackConfig ?? {};
        const preferredRange = Math.max(40, config.preferredRange ?? this.attackRange ?? 160);
        const keepDistanceRatio = Phaser.Math.Clamp(config.keepDistanceRatio ?? 0.72, 0.3, 0.95);
        const retreatRange = preferredRange * keepDistanceRatio;
        const dx = targetPlayer.x - this.x;
        const dy = targetPlayer.y - this.y;
        const distanceSq = (dx * dx) + (dy * dy);
        const preferredRangeSq = preferredRange * preferredRange;
        const retreatRangeSq = retreatRange * retreatRange;
        const effectiveSpeed = this.getStatusAdjustedSpeed?.(this.speed) ?? this.speed;

        if (this.isAttacking) {
            this.body.setVelocity(0, 0);
            this.setFlipX(dx < 0);
            return;
        }

        if (distanceSq > preferredRangeSq) {
            const angle = Math.atan2(dy, dx);
            const vx = Math.cos(angle) * effectiveSpeed;
            const vy = Math.sin(angle) * effectiveSpeed;
            this.body.setVelocity(vx, vy);
            this.setFlipX(vx < 0);
            return;
        }

        if (distanceSq < retreatRangeSq) {
            const angle = Math.atan2(-dy, -dx);
            const vx = Math.cos(angle) * effectiveSpeed;
            const vy = Math.sin(angle) * effectiveSpeed;
            this.body.setVelocity(vx, vy);
            this.setFlipX(vx < 0);
        } else {
            this.body.setVelocity(0, 0);
            this.setFlipX(dx < 0);
        }

        this.tryRangedAttack(targetPlayer, time);
    }

    updateMeleeBehavior(targetPlayer, time) {
        if (this.explodeOnDead?.triggerOnPlayerContact) {
            const dx = targetPlayer.x - this.x;
            const dy = targetPlayer.y - this.y;
            const effectiveSpeed = this.getStatusAdjustedSpeed?.(this.speed) ?? this.speed;
            const angle = Math.atan2(dy, dx);
            const vx = Math.cos(angle) * effectiveSpeed;
            const vy = Math.sin(angle) * effectiveSpeed;
            this.body.setVelocity(vx, vy);
            this.setFlipX(vx < 0);
            return;
        }
        const dx = targetPlayer.x - this.x;
        const dy = targetPlayer.y - this.y;
        const attackDistance = this.getMeleeAttackDistance(targetPlayer);
        const effectiveSpeed = this.getStatusAdjustedSpeed?.(this.speed) ?? this.speed;
        const distanceSq = (dx * dx) + (dy * dy);

        // Optional evasive zigzag before engaging (for melee units like moth_woman).
        if (maybeStartZigzagDash(this, targetPlayer, time, distanceSq)) return;

        if (this.isAttacking) {
            if (!this.isDashAttacking) {
                this.body.setVelocity(0, 0);
                this.setFlipX(dx < 0);
            }
            return;
        }

        if (distanceSq <= attackDistance * attackDistance) {
            this.body.setVelocity(0, 0);
            this.setFlipX(dx < 0);
            if (this.hasSatisfiedMeleeEngageDelay(targetPlayer, time)) {
                this.tryAttackPlayer(targetPlayer, time);
            }
            return;
        }

        this.resetMeleeEngageDelay();

        const angle = Math.atan2(dy, dx);
        const vx = Math.cos(angle) * effectiveSpeed;
        const vy = Math.sin(angle) * effectiveSpeed;
        this.body.setVelocity(vx, vy);
        this.setFlipX(vx < 0);
    }

    tryRangedAttack(targetPlayer, time) {
        return tryRangedAttack(this, targetPlayer, time);
    }

    performBurstRangedAttack(targetPlayer) {
        return performBurstRangedAttack(this, targetPlayer);
    }

    performPoisonTrapAttack(targetPlayer) {
        return performPoisonTrapAttack(this, targetPlayer);
    }

    performBurnTrapAttack(targetPlayer) {
        return performBurnTrapAttack(this, targetPlayer);
    }

    beginSniperAttack(targetPlayer) {
        return beginSniperAttack(this, targetPlayer);
    }

    spawnSniperMuzzleFlash(direction) {
        if (!this.scene?.add || !this.scene?.tweens || !direction) return;
        const color = this.rangedAttackConfig?.projectileColor ?? 0x8fd7ff;
        const glowColor = this.rangedAttackConfig?.projectileGlowColor ?? 0xe3f6ff;
        const flashX = this.x + (direction.x * 12);
        const flashY = this.y + (direction.y * 12);
        const flashAngle = Math.atan2(direction.y, direction.x);

        const beam = this.scene.add.rectangle(flashX, flashY, 34, 4, color, 0.85)
            .setRotation(flashAngle)
            .setDepth((this.depth ?? 20) + 6);
        const core = this.scene.add.rectangle(flashX, flashY, 18, 2, 0xffffff, 0.95)
            .setRotation(flashAngle)
            .setDepth((this.depth ?? 20) + 7);
        const burst = this.scene.add.circle(flashX, flashY, 8, glowColor, 0.38)
            .setDepth((this.depth ?? 20) + 5);

        this.scene.tweens.add({
            targets: [beam, core, burst],
            alpha: 0,
            scaleX: { from: 1, to: 1.35 },
            scaleY: { from: 1, to: 0.7 },
            duration: 90,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                beam.destroy();
                core.destroy();
                burst.destroy();
            }
        });
    }

    spawnSniperTelegraph(targetX, targetY) {
        return spawnSniperTelegraphBehavior(this, targetX, targetY);
    }

    destroySniperTelegraph() {
        return destroySniperTelegraphBehavior(this);
    }

    getMeleeAttackDistance(targetPlayer = null) {
        return getMeleeAttackDistanceBehavior(this, targetPlayer);
    }

    getMeleeEngageTargetId(targetPlayer = null) {
        return getMeleeEngageTargetIdBehavior(this, targetPlayer);
    }

    resetMeleeEngageDelay() {
        return resetMeleeEngageDelayBehavior(this);
    }

    hasSatisfiedMeleeEngageDelay(targetPlayer, time) {
        return hasSatisfiedMeleeEngageDelayBehavior(this, targetPlayer, time);
    }

    handlePlayerContact(player, time) {
        if (this.isDead) return false;
        if (this.explodeOnDead?.triggerOnPlayerContact) {
            if (!Number.isFinite(this.contactExplosionStartedAt)) {
                this.contactExplosionStartedAt = time;
            }
            return false;
        }
        if (this.combatType !== 'melee') return false;
        if (this.isDashLungeStyle()) {
            if (this.isDashAttacking && !this.dashAttackHitResolved && player?.active && !player?.isDead) {
                this.dashAttackHitResolved = true;
                player.takeDamage?.(this.damage ?? 10, this, { fromEnemyAttack: true });
                this.spawnMeleeAttackImpact(player);
                return true;
            }
            if (this.isAttacking) return false;
        }
        if (!this.hasSatisfiedMeleeEngageDelay(player, time)) return false;
        return this.tryAttackPlayer(player, time);
    }

    tryAttackPlayer(targetPlayer, time) {
        return tryAttackPlayerBehavior(this, targetPlayer, time);
    }

    performMeleeAttack(targetPlayer) {
        return performMeleeAttackBehavior(this, targetPlayer);
    }

    performDashAttack(targetPlayer) {
        return performDashAttackBehavior(this, targetPlayer);
    }

    updateDashAttack(targetPlayer = null) {
        return updateDashAttackBehavior(this, targetPlayer);
    }

    didDashPathIntersectPlayer(startX, startY, endX, endY, targetPlayer) {
        return didDashPathIntersectPlayerBehavior(this, startX, startY, endX, endY, targetPlayer);
    }

    onDashAttackHitPlayer(targetPlayer) {
        return onDashAttackHitPlayerBehavior(this, targetPlayer);
    }

    finishDashAttack() {
        return finishDashAttackBehavior(this);
    }

    setDashMapCollisionEnabled(enabled = true) {
        return setDashMapCollisionEnabledBehavior(this, enabled);
    }

    getMeleeAttackEffectConfig() {
        switch (this.attackStyle) {
            case 'contact_slash':
                return {
                    glowColors: [0x1f0f0f, 0x4a1414, 0x8c2f2f, 0xffc8a8],
                    rayLineColor: 0xff8a6c,
                    sparkTints: [0xff8a6c, 0xffc8a8, 0xffe6d6]
                };
            case 'contact_bite':
                return {
                    glowColors: [0x0d120d, 0x1e331d, 0x406b3f, 0xb7f0b2],
                    rayLineColor: 0xaef2a0,
                    sparkTints: [0x91df82, 0xc8f7b8]
                };
            case 'contact_smash':
                return {
                    glowColors: [0x121212, 0x2b2b2b, 0x666666, 0xe6dccf],
                    rayLineColor: 0xd8c2a0,
                    sparkTints: [0x9e8b73, 0xd8c2a0, 0xf0e2cc]
                };
            case 'dash_lunge':
            case 'dash_lunge_bullet_trail':
            case 'dash_lunge_back_fan':
                return {
                    glowColors: [0x180606, 0x4a0f0f, 0x9e1f1f, 0xff8a8a],
                    rayLineColor: 0xff4d4d,
                    sparkTints: [0xff4d4d, 0xff8a8a, 0xffc2c2]
                };
            default:
                return {
                    glowColors: [0x101010, 0x2a1f1a, 0x684230, 0xf2d2b0],
                    rayLineColor: 0xe8b17f,
                    sparkTints: [0xc98f5f, 0xe8b17f, 0xffe4c4]
                };
        }
    }

    spawnMeleeAttackTelegraph() {
        const telegraphTarget = { x: this.x, y: this.y, depth: (this.depth ?? 20) + 1 };
        this.scene?.playerHitEffect?.spawn?.(telegraphTarget, {
            ...this.getMeleeAttackEffectConfig(),
            sparkCount: 6,
            sparkScale: { min: 0.08, max: 0.15 },
            sparkDuration: { min: 90, max: 140 },
            rayLengthStart: 1,
            rayLengthEnd: 2
        });
    }

    spawnDashAttackTelegraph(targetPoint) {
        return spawnDashAttackTelegraphBehavior(this, targetPoint);
    }

    destroyDashAttackTelegraph() {
        return destroyDashAttackTelegraphBehavior(this);
    }

    spawnMeleeAttackImpact(targetPlayer) {
        this.scene?.playerHitEffect?.spawn?.(targetPlayer, {
            ...this.getMeleeAttackEffectConfig(),
            sparkCount: 10,
            sparkScale: { min: 0.12, max: 0.22 },
            sparkDuration: { min: 120, max: 220 }
        });
    }

    enforceHitboxSize() {
        if (!this.body) return;
        this.body.setSize(this.hitboxSize.width, this.hitboxSize.height);
        this.body.setOffset(
            -(this.hitboxSize.width - this.displaySize.width) / 2,
            -(this.hitboxSize.height - this.displaySize.height) / 2
        );

    }

    handleDeath(source = null) {
        if (this.deathExplosionResolved) return;
        if (this.deathExplosionPrimed) return;
        if (this.isDead && !this.explodeOnDead) return;
        this.isDead = true;
        this.setState('dead');
        this.playDeathEffect();
        this.motionTrailEffect?.destroy?.();
        this.motionTrailEffect = null;
        this.scene?.mapManager?.removeObjectCollisions?.(this);

        if (this.explodeOnDead) {
            this.pendingDeathSource = source ?? this.pendingDeathSource ?? null;
            this.deathExplosionPrimed = true;
            this.deathExplosionTimer = Math.max(0, this.explodeOnDead.delayMs ?? 500);
            if (this.body) {
                this.body.stop();
                this.body.enable = false;
            }
            this.setAlpha(0.78);
            return;
        }

        this.finishDeath(source);
    }

    finishDeath(source = null) {
        this.setDashMapCollisionEnabled(true);
        this.deathSequenceTimer?.remove?.(false);
        this.deathSequenceTimer = null;
        this.isDeathSequenceActive = false;
        if (this.body) {
            this.body.stop();
            this.body.enable = false;
        }
        this.statusEffects?.notifyKill?.({
            target: this,
            source,
            ownerPlayerId: source?.ownerPlayerId ?? source?.playerId ?? null
        });
        if (this.scene?.lootSystem) {
            this.pendingDeathSource = source ?? this.pendingDeathSource ?? null;
            this.scene.lootSystem.spawnLoot(this.type, this.x, this.y, this);
        }
        this.scene?.events?.emit('enemy-dead', { enemy: this, source });
        this.destroy();
    }

    playDeathEffect() {
        const effectRunner = this.scene?.skillBehaviorPipeline?.effects;
        const sizeFactor = Math.max(this.scaleSize ?? 1, (this.displayWidth ?? this.baseWidth ?? 32) / 48);
        if (effectRunner?.spawnAshDissolve) {
            effectRunner.spawnAshDissolve(this, (this.depth ?? 20) + 1, {
                duration: 340,
                riseDistance: 12,
                driftX: 4,
                particleCount: 11,
                particleSpreadX: Math.round(18 * sizeFactor),
                particleSize: {
                    min: 2,
                    max: 4
                },
                particleRise: {
                    min: 9,
                    max: 22
                },
                minAlpha: 0.64,
                glowRadius: Math.round(16 * sizeFactor),
                glowAlpha: 0.2,
                spiritScale: 0.78,
                spiritAlpha: 0.5,
                spiritColor: 0xe3ddd2
            });
        }
    }

    stopCombatForDeathSequence() {
        this.setDashMapCollisionEnabled(true);
        this.setState('dead');
        this.body?.stop?.();
        if (this.body) {
            this.body.enable = false;
        }
        this.pendingAttackTimer?.remove?.(false);
        this.pendingAttackTimer = null;
        this.isAttacking = false;
        this.isDashAttacking = false;
        this.dashAttackTargetPoint = null;
        this.dashAttackRemainingDistance = 0;
        this.knockbackTimer = 0;
        this.knockbackVelocity.set(0, 0);
        this.resetMeleeEngageDelay();
        this.destroyDashAttackTelegraph();
        this.motionTrailEffect?.destroy?.();
        this.motionTrailEffect = null;
        this.scene?.mapManager?.removeObjectCollisions?.(this);
    }

    reviveFromDeathSequence() {
        this.isDead = false;
        this.pendingDeathSource = null;
        this.pendingAttackTimer?.remove?.(false);
        this.pendingAttackTimer = null;
        this.isAttacking = false;
        this.isDashAttacking = false;
        this.dashAttackTargetPoint = null;
        this.dashAttackRemainingDistance = 0;
        this.knockbackTimer = 0;
        this.knockbackVelocity.set(0, 0);
        // Bosses stay bright for readability.
        this.setAlpha(1);
        if (this.body) {
            this.body.enable = true;
            this.body.setVelocity(0, 0);
        }
        this.scene?.mapManager?.enableObjectCollisions?.(this);
    }

    playDeathAnimation() {
        const deathAnimKey = `${this.type}_die`;
        this.state = 'dead';
        if (this.scene?.anims?.exists(deathAnimKey)) {
            this.anims.play(deathAnimKey, true);
            return;
        }
        this.setState('dead');
    }

    beginDashWindupAnimation() {
        this.setState('attack');
    }

    resumeDashJumpAnimation() {
        this.setState('attack');
    }

    forceReturnToMoveAnimation() {
        if (this.isDead || this.isDeathSequenceActive) {
            return;
        }
        this.state = 'move';
        const moveAnimKey = `${this.type}_move`;
        if (this.scene?.anims?.exists(moveAnimKey)) {
            this.anims.play(moveAnimKey, true);
            return;
        }
        this.setState('move');
    }

    applySeparation(enemies) {
        if (this.isDashAttacking) return;
        if (!Array.isArray(enemies) || enemies.length < 2) return;
        this.separation.set(0, 0);
        let neighbors = 0;
        const temp = new Phaser.Math.Vector2(0, 0);
        const candidates = this.getNearbySeparationCandidates(enemies);
        for (const other of candidates) {
            if (!other || other === this) continue;
            if (other.isDashAttacking) continue;
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distSq = (dx * dx) + (dy * dy);
            if (distSq <= 0 || distSq >= (HITBOX_DISTANCE * HITBOX_DISTANCE)) continue;
            const dist = Math.sqrt(distSq);
            if (dist <= 0 || dist >= HITBOX_DISTANCE) continue;
            temp.set(dx, dy).normalize();
            const strength = (HITBOX_DISTANCE - dist) / HITBOX_DISTANCE;
            this.separation.add(temp.scale(strength));
            neighbors += 1;
            if (neighbors >= MAX_SEPARATION_NEIGHBORS) break;
        }
        if (neighbors === 0) return;
        this.separation.scale(REPELL_FORCE / neighbors);
        this.body.velocity.x += this.separation.x;
        this.body.velocity.y += this.separation.y;
    }

    getNearbySeparationCandidates(enemies) {
        const scene = this.scene;
        if (scene?.physics?.overlapCirc) {
            const bodies = scene.physics.overlapCirc(this.x, this.y, HITBOX_DISTANCE, true, true);
            if (Array.isArray(bodies) && bodies.length) {
                return bodies
                    .map((body) => body?.gameObject)
                    .filter((enemy, index, array) => (
                        enemy
                        && enemy !== this
                        && enemy.active
                        && array.indexOf(enemy) === index
                    ));
            }
        }

        const minX = this.x - HITBOX_DISTANCE;
        const maxX = this.x + HITBOX_DISTANCE;
        const minY = this.y - HITBOX_DISTANCE;
        const maxY = this.y + HITBOX_DISTANCE;
        const nearby = [];
        for (const other of enemies) {
            if (!other || other === this || !other.active) continue;
            if (other.x < minX || other.x > maxX || other.y < minY || other.y > maxY) continue;
            nearby.push(other);
            if (nearby.length >= MAX_SEPARATION_NEIGHBORS) break;
        }
        return nearby;
    }

    handleStuckInWall(player, delta) {
        if (!this.body) return;
        if (this.ghostTimer > 0) {
            this.stuckTimer = 0;
            return;
        }
        const blocked = this.body.blocked || {};
        const touching = this.body.touching || {};
        const isBlocked = Boolean(
            blocked.left || blocked.right || blocked.up || blocked.down ||
            touching.left || touching.right || touching.up || touching.down
        );
        const moving = Math.abs(this.body.velocity.x) + Math.abs(this.body.velocity.y) > 6;
        const movedDistance = Phaser.Math.Distance.Between(this.x, this.y, this.lastPosition.x, this.lastPosition.y);

        if (isBlocked && moving && movedDistance < 0.5) {
            this.stuckTimer += delta;
        } else {
            this.stuckTimer = 0;
            this.lastSafePosition.set(this.x, this.y);
        }

        if (this.stuckTimer < 1500) return;

        this.startGhostMode();
        const escape = new Phaser.Math.Vector2(0, 0);
        if (player) {
            escape.set(this.x - player.x, this.y - player.y);
        }
        if (escape.lengthSq() === 0) {
            escape.set(Phaser.Math.FloatBetween(-1, 1), Phaser.Math.FloatBetween(-1, 1));
        }

        escape.normalize();
        const ghostSpeed = Math.max(this.speed * 1.15, 60);
        this.body.setVelocity(escape.x * ghostSpeed, escape.y * ghostSpeed);
        this.setFlipX(this.body.velocity.x < 0);
        this.stuckTimer = 0;
    }

    updateStuckMemory() {
        if (!this.body) return;
        this.lastPosition.set(this.x, this.y);
    }

    startGhostMode() {
        if (this.ghostTimer > 0) return;
        this.ghostTimer = this.ghostDuration;
        this.scene?.mapManager?.removeObjectCollisions?.(this);
        if (this.body) {
            this.body.checkCollision.none = true;
        }
    }

    endGhostMode() {
        this.ghostTimer = 0;
        if (this.body) {
            this.body.checkCollision.none = false;
        }
        this.scene?.mapManager?.enableObjectCollisions?.(this);
    }

    syncBodySize() {
        // Keep the hitbox size authoritative even when BaseEntity tries to sync
        this.enforceHitboxSize();
    }

    captureBaseStats() {
        this.baseStats = {
            maxHealth: this.maxHealth,
            damage: this.damage,
            speed: this.speed,
            scale: this.scaleSize ?? 1,
            armor: this.armor ?? 0,
            effectResist: this.effectResist ?? 0,
            attackCooldown: this.attackCooldown ?? ENEMY_BASE_STATS.attackCooldown,
            attackRange: this.attackRange ?? ENEMY_BASE_STATS.attackRange,
            knockbackResist: this.knockbackResist ?? 1,
            stunResist: this.stunResist ?? 1,
            ghostDuration: this.ghostDuration ?? ENEMY_BASE_STATS.ghostDuration
        };
        this.currentStats = { ...this.baseStats };
    }

    applyRuntimeStats(nextStats = {}, options = {}) {
        const preserveHealthRatio = options.preserveHealthRatio !== false;
        const previousMaxHealth = Math.max(this.maxHealth ?? 1, 1);
        const healthRatio = preserveHealthRatio
            ? Phaser.Math.Clamp((this.health ?? previousMaxHealth) / previousMaxHealth, 0, 1)
            : 1;
        const resolvedStats = {
            maxHealth: Math.max(1, Math.round(nextStats.maxHealth ?? this.maxHealth ?? 1)),
            damage: nextStats.damage ?? this.damage ?? 0,
            speed: nextStats.speed ?? this.speed ?? 0,
            scale: nextStats.scale ?? this.scaleSize ?? 1,
            armor: nextStats.armor ?? this.armor ?? 0,
            effectResist: nextStats.effectResist ?? this.effectResist ?? 0,
            attackCooldown: nextStats.attackCooldown ?? this.attackCooldown ?? ENEMY_BASE_STATS.attackCooldown,
            attackRange: nextStats.attackRange ?? this.attackRange ?? ENEMY_BASE_STATS.attackRange,
            knockbackResist: nextStats.knockbackResist ?? this.knockbackResist ?? 1,
            stunResist: nextStats.stunResist ?? this.stunResist ?? 1,
            ghostDuration: nextStats.ghostDuration ?? this.ghostDuration ?? ENEMY_BASE_STATS.ghostDuration
        };

        this.currentStats = { ...resolvedStats };
        this.maxHealth = resolvedStats.maxHealth;
        this.health = preserveHealthRatio
            ? Math.round(this.maxHealth * healthRatio)
            : this.maxHealth;
        this.damage = resolvedStats.damage;
        this.speed = resolvedStats.speed;
        this.scaleSize = resolvedStats.scale;
        this.armor = resolvedStats.armor;
        this.effectResist = resolvedStats.effectResist;
        this.attackCooldown = resolvedStats.attackCooldown;
        this.attackRange = resolvedStats.attackRange;
        this.knockbackResist = resolvedStats.knockbackResist;
        this.stunResist = resolvedStats.stunResist;
        this.ghostDuration = resolvedStats.ghostDuration;
        this.displaySize = {
            width: Math.max(2, Math.round(this.baseDisplaySize.width * this.scaleSize)),
            height: Math.max(2, Math.round(this.baseDisplaySize.height * this.scaleSize))
        };
        this.hitboxSize = {
            width: Math.max(2, Math.round(this.baseHitboxSize.width * this.scaleSize)),
            height: Math.max(2, Math.round(this.baseHitboxSize.height * this.scaleSize))
        };
        this.baseWidth = this.displaySize.width;
        this.baseHeight = this.displaySize.height;
        this.applyVisualDisplaySize();
        this.enforceHitboxSize();
        this.refreshHealthText();
        this.updateHealthTextPosition();
    }

    enableMotionTrail(config = {}) {
        if (this.motionTrailEffect) {
            this.motionTrailEffect.destroy();
        }
        this.motionTrailEffect = new MotionTrailEffect(this.scene, this, config);
        return this.motionTrailEffect;
    }

    disableMotionTrail() {
        this.motionTrailEffect?.destroy?.();
        this.motionTrailEffect = null;
    }

    applyVisualDisplaySize() {
        this.setDisplaySize(
            this.displaySize.width * (this.attackVisualScale?.x ?? 1),
            this.displaySize.height * (this.attackVisualScale?.y ?? 1)
        );
    }

    updateDashBackFanAttack() {
        return updateDashBackFanAttackBehavior(this);
    }

    shootBackFan() {
        return shootBackFanBehavior(this);
    }

    spawnBullet(x, y, dirX, dirY, options = {}) {
        return spawnBulletBehavior(this, x, y, dirX, dirY, options);
    }

    playAttackSquashBounce() {
        if (!this.scene?.tweens || !this.active) return;
        this.attackSquashTween?.stop?.();
        this.attackBounceTween?.stop?.();
        this.attackVisualScale.x = 1;
        this.attackVisualScale.y = 1;
        this.applyVisualDisplaySize();
        this.attackSquashTween = this.scene.tweens.add({
            targets: this.attackVisualScale,
            x: ATTACK_SQUASH_SCALE_X,
            y: ATTACK_SQUASH_SCALE_Y,
            duration: ATTACK_SQUASH_DURATION_MS,
            ease: 'Quad.easeOut',
            onUpdate: () => {
                if (this.active) {
                    this.applyVisualDisplaySize();
                }
            },
            onComplete: () => {
                this.attackSquashTween = null;
                if (!this.active || !this.scene?.tweens) return;
                this.attackBounceTween = this.scene.tweens.add({
                    targets: this.attackVisualScale,
                    x: ATTACK_BOUNCE_SCALE_X,
                    y: ATTACK_BOUNCE_SCALE_Y,
                    duration: ATTACK_BOUNCE_DURATION_MS,
                    ease: 'Back.easeOut',
                    yoyo: true,
                    onUpdate: () => {
                        if (this.active) {
                            this.applyVisualDisplaySize();
                        }
                    },
                    onComplete: () => {
                        this.attackBounceTween = null;
                        if (this.active) {
                            this.attackVisualScale.x = 1;
                            this.attackVisualScale.y = 1;
                            this.applyVisualDisplaySize();
                        }
                    }
                });
            }
        });
    }

    handleAnimationUpdate() {
        // Phaser replaces display size with frame dimensions on every animation tick.
        // Enforce the renderer size without touching the physics body.
        this.applyVisualDisplaySize();
    }

    cleanupEffectTimers() {
        this.damageTintTimer?.remove?.(false);
        this.damageTintTimer = null;
        this.stunTimer?.remove?.(false);
        this.stunTimer = null;
        this.pendingAttackTimer?.remove?.(false);
        this.pendingAttackTimer = null;
        this.destroySniperTelegraph();
        this.destroyDashAttackTelegraph();
        cleanupZigzagDash(this);
        this.attackSquashTween?.stop?.();
        this.attackSquashTween = null;
        this.attackBounceTween?.stop?.();
        this.attackBounceTween = null;
        this.dashBackFanElapsedMs = 0;
        this.dashBackFanShotTimerMs = 0;
        this.statusEffects?.destroy?.();
        this.statusEffects = null;
        this.healthText?.destroy?.();
        this.healthText = null;
        this.destroyStatusEffectIndicators();
        this.destroyBlockFreezeVisual();
        this.setBlockFreezeArmorBonus(0);
    }

    setHealthVisible(visible) {
        this.showHealthText = Boolean(visible);
        if (!this.scene) return;
        if (!this.showHealthText) {
            this.healthText?.destroy?.();
            this.healthText = null;
            return;
        }
        if (!this.healthText) {
            this.healthText = this.scene.add.text(this.x, this.y, '', {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5, 1).setDepth(1200);
        }
        this.refreshHealthText();
        this.updateHealthTextPosition();
    }

    refreshHealthText() {
        if (!this.healthText) return;
        this.healthText.setText(`${Math.max(0, Math.round(this.health ?? 0))}/${Math.max(1, Math.round(this.maxHealth ?? 1))}`);
    }

    updateHealthTextPosition() {
        const offsetY = Math.max(this.displaySize?.height ?? this.height ?? 0, this.hitboxSize?.height ?? 0) * 0.5 + 8;
        if (this.healthText) {
            this.healthText.setPosition(this.x, this.y - offsetY);
        }
        this.updateBlockFreezeVisualPosition();
        this.updateStatusEffectIndicatorPosition();
    }

    applyStun(duration, tint = 0x000000) {
        if (!duration || !this.active || !this.scene) return null;
        const effectiveDuration = Math.max(1, Math.round(duration * Math.max(0, this.stunResist ?? 1)));
        this.stunTint = tint;
        return this.applyStatusEffect?.('freeze', {
            durationMs: effectiveDuration,
            mode: 'stun',
            slowMultiplier: 0,
            tags: ['ice', 'freeze']
        }) ?? null;
    }

    flashDamageTint() {
        if (!this.scene || !this.active) return;
        if (this.damageTintTimer) {
            this.damageTintTimer.remove(false);
        }
        this.setTint(0xff0000);
        this.damageTintTimer = this.scene.time.delayedCall(120, () => {
            if (!this.active || !this.scene) return;
            this.restorePersistentTint();
            this.damageTintTimer = null;
        });
    }

    applyStatusHighlight(tint) {
        this.statusEffectTint = typeof tint === 'number' ? tint : null;
        if (!this.damageTintTimer) {
            this.restorePersistentTint();
        }
    }

    clearStatusHighlight() {
        if (this.statusEffectTint == null) return;
        this.statusEffectTint = null;
        if (!this.damageTintTimer) {
            this.restorePersistentTint();
        }
    }

    setBlockFreezeVisual(active) {
        if (!this.scene) return;
        const shouldShow = Boolean(active);
        if (!shouldShow) {
            this.destroyBlockFreezeVisual();
            return;
        }
        if (!this.blockFreezeVisual || !this.blockFreezeVisual.active) {
            const radius = Math.max(18, Math.round(Math.max(
                this.displaySize?.width ?? this.width ?? 0,
                this.displaySize?.height ?? this.height ?? 0
            ) * 0.4));
            this.blockFreezeVisual = this.scene.add.circle(this.x, this.y, radius, 0xffffff, 0.08)
                .setStrokeStyle(2, 0xffffff, 0.35)
                .setDepth(Math.max(1, (this.depth ?? 20) - 1));
            this.blockFreezeVisualTween = this.scene.tweens.add({
                targets: this.blockFreezeVisual,
                alpha: { from: 0.18, to: 0.34 },
                scaleX: { from: 0.9, to: 1.08 },
                scaleY: { from: 0.9, to: 1.08 },
                duration: 480,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        this.updateBlockFreezeVisualPosition();
    }

    updateBlockFreezeVisualPosition() {
        if (!this.blockFreezeVisual?.active) return;
        this.blockFreezeVisual.setPosition(this.x, this.y);
    }

    destroyBlockFreezeVisual() {
        this.blockFreezeVisualTween?.stop?.();
        this.blockFreezeVisualTween = null;
        this.blockFreezeVisual?.destroy?.();
        this.blockFreezeVisual = null;
    }

    setBlockFreezeArmorBonus(amount = 0) {
        const nextBonus = Math.max(0, Math.round(amount || 0));
        const previousBonus = Math.max(0, Math.round(this.blockFreezeArmorBonus || 0));
        if (nextBonus === previousBonus) return;
        this.armor = Math.max(0, (this.armor ?? 0) - previousBonus + nextBonus);
        this.blockFreezeArmorBonus = nextBonus;
        if (this.currentStats) {
            this.currentStats.armor = this.armor;
        }
    }

    createStatusEffectIndicator(entry) {
        const cfg = getStatusEffectConfig(entry.key) ?? {};
        const textureKey = cfg.iconTextureKey ?? STATUS_ICON_ATLAS_KEY;
        const frame = cfg.iconFrame ?? null;
        if (!this.scene?.textures?.exists(textureKey)) {
            return null;
        }
        if (textureKey === STATUS_ICON_ATLAS_KEY && !frame) return null;
        const icon = this.scene.add.image(this.x, this.y, textureKey, frame ?? undefined)
            .setDepth(1210)
            .setDisplaySize(8, 8);
        const stackText = this.scene.add.text(this.x, this.y, '', {
            fontSize: '4px',
            fontFamily: '"Press Start 2P", "PixelFont", monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            resolution: 2
        }).setOrigin(1, 1).setDepth(1211);
        return {
            key: entry.key,
            icon,
            stackText
        };
    }

    destroyStatusEffectIndicators() {
        this.statusEffectIndicators.forEach((indicator) => {
            indicator.icon?.destroy?.();
            indicator.stackText?.destroy?.();
        });
        this.statusEffectIndicators = [];
    }

    syncStatusEffectIndicators(entries = []) {
        if (!this.scene) return;
        const validEntries = entries.filter((entry) => {
            const cfg = getStatusEffectConfig(entry.key) ?? {};
            return Boolean(cfg.iconTextureKey || cfg.iconFrame);
        });
        for (let index = this.statusEffectIndicators.length - 1; index >= validEntries.length; index -= 1) {
            const indicator = this.statusEffectIndicators[index];
            indicator?.icon?.destroy?.();
            indicator?.stackText?.destroy?.();
            this.statusEffectIndicators.splice(index, 1);
        }
        validEntries.forEach((entry, index) => {
            let indicator = this.statusEffectIndicators[index];
            if (!indicator || indicator.key !== entry.key) {
                indicator?.icon?.destroy?.();
                indicator?.stackText?.destroy?.();
                indicator = this.createStatusEffectIndicator(entry);
                if (!indicator) return;
                this.statusEffectIndicators[index] = indicator;
            }
            indicator.key = entry.key;
            const cfg = getStatusEffectConfig(entry.key) ?? {};
            const textureKey = cfg.iconTextureKey ?? STATUS_ICON_ATLAS_KEY;
            if (textureKey === STATUS_ICON_ATLAS_KEY) {
                indicator.icon.setTexture(textureKey, cfg.iconFrame).setVisible(true);
            } else {
                indicator.icon.setTexture(textureKey).setVisible(true);
            }
            const shouldShowStack = Boolean(getStatusEffectConfig(entry.key)?.showStack);
            indicator.stackText
                .setVisible(shouldShowStack)
                .setText(shouldShowStack ? `${Math.max(1, Math.round(entry.stackCount ?? 1))}` : '');
        });
        this.statusEffectIndicators = this.statusEffectIndicators.filter(Boolean);
        this.updateStatusEffectIndicatorPosition();
    }

    updateStatusEffectIndicatorPosition() {
        if (!this.statusEffectIndicators.length) return;
        const baseOffsetY = Math.max(this.displaySize?.height ?? this.height ?? 0, this.hitboxSize?.height ?? 0) * 0.5
            + (this.healthText ? 20 : 8);
        const spacing = 10;
        const startX = this.x - ((this.statusEffectIndicators.length - 1) * spacing) / 2;
        const y = this.y - baseOffsetY;
        this.statusEffectIndicators.forEach((indicator, index) => {
            const iconX = startX + (index * spacing);
            indicator.icon?.setPosition(iconX, y);
            indicator.stackText?.setPosition(iconX + 4, y + 4);
        });
    }

    restorePersistentTint() {
        if (this.stunTimer) {
            this.setTint(this.stunTint ?? 0x000000);
            return;
        }
        if (this.statusEffectTint != null) {
            this.setTint(this.statusEffectTint);
            return;
        }
        this.clearTint();
    }

    destroy(fromScene) {
        this.deathSequenceTimer?.remove?.(false);
        this.deathSequenceTimer = null;
        if (this.deathExplosionResolved) {
            return super.destroy(fromScene);
        }
        if (this.active && !this.isDead && (this.health ?? 1) <= 0) {
            this.handleDeath(this.pendingDeathSource ?? null);
            return this;
        }
        return super.destroy(fromScene);
    }
}
