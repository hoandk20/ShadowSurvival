import BaseEntity from './BaseEntity.js';
import { ENEMIES } from '../config/enemies.js';
import MotionTrailEffect from './effects/MotionTrailEffect.js';
import EnemyAuraEffect from './effects/EnemyAuraEffect.js';

const HITBOX_DISTANCE = 30;
const REPELL_FORCE = 220;
const ENEMY_SIZE_MULTIPLIER = 2;
const DEFAULT_HACK_TINT = 0x59ff8b;

export default class Enemy extends BaseEntity {
    constructor(scene, x, y, type) {
        super(scene, x, y, `${type}_move`, type);
        scene.physics.add.existing(this);
        this.body.setImmovable(false);
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(0);

        const enemyConfig = ENEMIES[type] ?? {};
        this.speed = enemyConfig.speed ?? 110;
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
        this.maxHealth = enemyConfig.health ?? 100;
        this.health = this.maxHealth;
        this.damage = enemyConfig.damage ?? 10;
        this.knockbackResist = enemyConfig.knockbackResist ?? 1;
        this.isStunned = false;
        this.damageTintTimer = null;
        this.stunTimer = null;
        this.knockbackVelocity = new Phaser.Math.Vector2(0, 0);
        this.knockbackTimer = 0;
        this.knockbackDragFactor = 0.92;
        this.knockbackVelocity = new Phaser.Math.Vector2(0, 0);
        this.knockbackTimer = 0;
        this.attackCooldown = enemyConfig.attackCooldown ?? 600;
        this.attackRange = enemyConfig.attackRange ?? 32;
        this.stuckTimer = 0;
        this.ghostTimer = 0;
        this.ghostDuration = enemyConfig.ghostDuration ?? 900;
        this.eliteTint = null;
        this.lastSafePosition = new Phaser.Math.Vector2(x, y);
        this.lastPosition = new Phaser.Math.Vector2(x, y);
        this.motionTrailEffect = null;
        this.auraEffect = null;
        this.scaleSize = 1;
        this.baseStats = null;
        this.currentStats = null;
        this.stageEliteState = null;
        this.pendingDeathSource = null;
        this.isHacked = false;
        this.hackTimer = 0;
        this.hackTint = DEFAULT_HACK_TINT;
        this.pendingHackDeath = false;
        this.hackSource = null;
        this.lastHackAttackTime = -Infinity;
        this.hackedTarget = null;

        this.setVisible(false);
        this.setScale(1);
        this.setDepth(20);
        this.setDisplaySize(this.displaySize.width, this.displaySize.height);
        this.baseWidth = this.displaySize.width;
        this.baseHeight = this.displaySize.height;
        this.enforceHitboxSize();
        this.captureBaseStats();

        this.separation = new Phaser.Math.Vector2(0, 0);
        this.on(Phaser.Animations.Events.ANIMATION_UPDATE, this.handleAnimationUpdate, this);
        this.once(Phaser.GameObjects.Events.DESTROY, this.cleanupEffectTimers, this);
        this.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => {
            this.setState('move');
            this.anims.play(`${type}_move`, true);
            this.scene?.time?.delayedCall(16, () => {
                if (!this.active || !this.scene) return;
                this.setVisible(true);
            });
        });
    }

    update(time, delta, player, allEnemies) {
        if (!this.scene) return;
        this.motionTrailEffect?.update(time, delta);
        this.auraEffect?.update(time, delta);
        if (this.hackTimer > 0) {
            this.hackTimer -= delta;
            if (this.hackTimer <= 0) {
                const shouldDieAfterHack = this.pendingHackDeath;
                this.endHackMode();
                if (shouldDieAfterHack) {
                    this.handleDeath(this.hackSource);
                    return;
                }
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
        } else if (this.isHacked) {
            const targetEnemy = this.getHackTarget(allEnemies);
            this.hackedTarget = targetEnemy;
            if (targetEnemy) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, targetEnemy.x, targetEnemy.y);
                const vx = Math.cos(angle) * this.speed;
                const vy = Math.sin(angle) * this.speed;
                this.body.setVelocity(vx, vy);
                this.setFlipX(vx < 0);
                this.tryHackAttack(targetEnemy, time);
            } else {
                this.body.setVelocity(0, 0);
            }
        } else if (player) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            const vx = Math.cos(angle) * this.speed;
            const vy = Math.sin(angle) * this.speed;
            this.body.setVelocity(vx, vy);
            this.setFlipX(vx < 0);
        }
        this.applySeparation(allEnemies);
        this.handleStuckInWall(player, delta);
        this.enforceHitboxSize();
        this.updateStuckMemory();
    }

    takeDamage(amount, force = 0, direction = null, source = null, options = {}, skillConfig = null) {
        if (this.isDead || typeof amount !== 'number' || amount <= 0) return;
        const actualDamage = Math.min(amount, this.health);
        this.health = Phaser.Math.Clamp(this.health - actualDamage, 0, this.maxHealth);
        this.pendingDeathSource = null;
        const canBeHacked = Boolean(skillConfig?.appliesHack && !this.isElite);
        if (!this.isStunned) {
            this.flashDamageTint();
        }
        if (force && direction && direction.lengthSq() > 0 && this.body) {
            const knockbackForce = force * (this.knockbackResist ?? 1);
            this.knockbackVelocity.set(direction.x * knockbackForce, direction.y * knockbackForce);
            this.knockbackTimer = skillConfig?.knockbackDragDuration ?? 220;
            this.knockbackDragFactor = skillConfig?.knockbackDragFactor ?? 0.92;
            this.body.velocity.copy(this.knockbackVelocity);
        }
        if (canBeHacked) {
            const rawHackTint = skillConfig?.hackTint ?? DEFAULT_HACK_TINT;
            const hackTint = typeof rawHackTint === 'string'
                ? Phaser.Display.Color.HexStringToColor(rawHackTint).color
                : rawHackTint;
            this.applyHack(skillConfig?.hackDuration ?? 20000, hackTint, {
                source,
                lethalTrigger: this.health <= 0
            });
        }
        if (this.health <= 0) {
            if (this.isHacked && this.pendingHackDeath) {
                return;
            }
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
    }

    applyHack(duration = 20000, tint = DEFAULT_HACK_TINT, options = {}) {
        if (this.isDead || this.isElite) return false;
        this.isHacked = true;
        this.hackTimer = Math.max(this.hackTimer, duration);
        this.hackTint = tint ?? DEFAULT_HACK_TINT;
        this.hackSource = options?.source ?? this.hackSource;
        if (options?.lethalTrigger) {
            this.pendingHackDeath = true;
            this.health = Math.max(1, this.health);
        }
        this.restorePersistentTint();
        return true;
    }

    endHackMode() {
        this.isHacked = false;
        this.hackTimer = 0;
        this.hackedTarget = null;
        this.pendingHackDeath = false;
        this.restorePersistentTint();
    }

    getHackTarget(allEnemies) {
        if (!Array.isArray(allEnemies)) return null;
        const candidates = allEnemies.filter((enemy) => (
            enemy
            && enemy !== this
            && enemy.active
            && !enemy.isDead
            && !enemy.isHacked
        ));
        const pool = candidates.length ? candidates : allEnemies.filter((enemy) => (
            enemy
            && enemy !== this
            && enemy.active
            && !enemy.isDead
        ));
        let nearest = null;
        let minDist = Number.POSITIVE_INFINITY;
        for (const enemy of pool) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    tryHackAttack(target, time) {
        if (!target || !target.active || target.isDead) return;
        if ((time - this.lastHackAttackTime) < this.attackCooldown) return;
        const ownRadius = Math.max(this.hitboxSize?.width ?? 0, this.hitboxSize?.height ?? 0) * 0.5;
        const targetRadius = Math.max(target.hitboxSize?.width ?? 0, target.hitboxSize?.height ?? 0) * 0.5;
        const attackDistance = Math.max(this.attackRange ?? 0, ownRadius + targetRadius);
        const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
        if (distance > attackDistance) return;
        this.lastHackAttackTime = time;
        target.takeDamage(this.damage ?? 10, 0, null, this, { fromHack: true }, null);
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
        if (this.isDead) return;
        this.isDead = true;
        this.setState('dead');
        this.motionTrailEffect?.destroy?.();
        this.motionTrailEffect = null;
        this.auraEffect?.destroy?.();
        this.auraEffect = null;
        this.scene?.mapManager?.removeObjectCollisions?.(this);
        if (this.body) {
            this.body.stop();
            this.body.enable = false;
        }
        this.scene?.events?.emit('enemy-dead', { enemy: this, source });
        if (this.scene?.lootSystem) {
            this.scene.lootSystem.spawnLoot(this.type, this.x, this.y);
        }
        this.destroy();
    }

    applySeparation(enemies) {
        if (!Array.isArray(enemies) || enemies.length < 2) return;
        this.separation.set(0, 0);
        let neighbors = 0;
        const temp = new Phaser.Math.Vector2(0, 0);
        for (const other of enemies) {
            if (!other || other === this) continue;
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.hypot(dx, dy);
            if (dist <= 0 || dist >= HITBOX_DISTANCE) continue;
            temp.set(dx, dy).normalize();
            const strength = (HITBOX_DISTANCE - dist) / HITBOX_DISTANCE;
            this.separation.add(temp.scale(strength));
            neighbors += 1;
        }
        if (neighbors === 0) return;
        this.separation.scale(REPELL_FORCE / neighbors);
        this.body.velocity.x += this.separation.x;
        this.body.velocity.y += this.separation.y;
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

        if (this.stuckTimer < 3000) return;

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
            knockbackResist: this.knockbackResist ?? 1
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
            knockbackResist: nextStats.knockbackResist ?? this.knockbackResist ?? 1
        };

        this.currentStats = { ...resolvedStats };
        this.maxHealth = resolvedStats.maxHealth;
        this.health = preserveHealthRatio
            ? Math.round(this.maxHealth * healthRatio)
            : this.maxHealth;
        this.damage = resolvedStats.damage;
        this.speed = resolvedStats.speed;
        this.scaleSize = resolvedStats.scale;
        this.knockbackResist = resolvedStats.knockbackResist;
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
        this.setDisplaySize(this.displaySize.width, this.displaySize.height);
        this.enforceHitboxSize();
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

    enableAuraEffect(config = {}) {
        this.auraEffect?.destroy?.();
        const radius = config.radius ?? Math.max(this.displaySize.width, this.displaySize.height) * 0.9;
        this.auraEffect = new EnemyAuraEffect(this.scene, this, {
            radius,
            ...config
        });
        return this.auraEffect;
    }

    disableAuraEffect() {
        this.auraEffect?.destroy?.();
        this.auraEffect = null;
    }

    handleAnimationUpdate() {
        // Phaser replaces display size with frame dimensions on every animation tick.
        // Enforce the renderer size without touching the physics body.
        this.setScale(1);
        this.setDisplaySize(this.displaySize.width, this.displaySize.height);
    }

    cleanupEffectTimers() {
        this.damageTintTimer?.remove?.(false);
        this.damageTintTimer = null;
        this.stunTimer?.remove?.(false);
        this.stunTimer = null;
    }

    applyStun(duration, tint = 0x000000) {
        if (!duration || this.isStunned || !this.active || !this.scene) return;
        this.isStunned = true;
        this.stunTint = tint;
        this.setTint(tint);
        if (this.body) {
            this.body.setVelocity(0, 0);
        }
        if (this.anims?.currentAnim && !this.anims.isPaused) {
            this.anims.pause();
        }
        this.stunTimer?.remove?.(false);
        this.stunTimer = this.scene.time.delayedCall(duration, () => {
            if (!this.active || !this.scene) return;
            this.isStunned = false;
            this.restorePersistentTint();
            if (this.anims?.currentAnim && this.anims.isPaused) {
                this.anims.resume();
            }
            this.stunTimer = null;
        });
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

    restorePersistentTint() {
        if (this.isHacked) {
            this.setTint(this.hackTint ?? DEFAULT_HACK_TINT);
            return;
        }
        if (this.isElite) {
            this.setTint(this.eliteTint ?? 0xffcc00);
            return;
        }
        this.clearTint();
    }
}
