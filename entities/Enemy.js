import BaseEntity from './BaseEntity.js';
import { ENEMIES } from '../config/enemies.js';

const HITBOX_DISTANCE = 100;
const REPELL_FORCE = 220;
const ENEMY_SIZE_MULTIPLIER = 2;

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
        this.knockbackVelocity = new Phaser.Math.Vector2(0, 0);
        this.knockbackTimer = 0;
        this.knockbackDragFactor = 0.92;
        this.knockbackVelocity = new Phaser.Math.Vector2(0, 0);
        this.knockbackTimer = 0;
        this.attackCooldown = enemyConfig.attackCooldown ?? 600;
        this.attackRange = enemyConfig.attackRange ?? 32;

        this.setVisible(false);
        this.setScale(1);
        this.setDisplaySize(this.displaySize.width, this.displaySize.height);
        this.baseWidth = this.displaySize.width;
        this.baseHeight = this.displaySize.height;
        this.enforceHitboxSize();

        this.separation = new Phaser.Math.Vector2(0, 0);
        this.on(Phaser.Animations.Events.ANIMATION_UPDATE, this.handleAnimationUpdate, this);
        this.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => {
            this.setState('move');
            this.anims.play(`${type}_move`, true);
            this.scene?.time?.delayedCall(16, () => {
                this.setVisible(true);
            });
        });
    }

    update(time, delta, player, allEnemies) {
        if (!this.scene) return;
        if (this.isStunned) {
            this.body.setVelocity(0, 0);
        } else if (this.knockbackTimer > 0) {
            this.body.velocity.scale(this.knockbackDragFactor);
            this.knockbackTimer -= delta;
            if (this.knockbackTimer <= 0) {
                this.knockbackTimer = 0;
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
        this.enforceHitboxSize();
    }

    takeDamage(amount, force = 0, direction = null, source = null, options = {}, skillConfig = null) {
        if (this.isDead || typeof amount !== 'number' || amount <= 0) return;
        const actualDamage = Math.min(amount, this.health);
        this.health = Phaser.Math.Clamp(this.health - actualDamage, 0, this.maxHealth);
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
        if (this.health <= 0) {
            this.handleDeath(source);
        }
        if (skillConfig?.knockbackTakeDamage && !options?.fromChainDamage && direction) {
            this.scene?.applyKnockbackDamage?.(this, skillConfig, direction);
        }
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

    syncBodySize() {
        // Keep the hitbox size authoritative even when BaseEntity tries to sync
        this.enforceHitboxSize();
    }

    handleAnimationUpdate() {
        // Phaser replaces display size with frame dimensions on every animation tick.
        // Enforce the renderer size without touching the physics body.
        this.setScale(1);
        this.setDisplaySize(this.displaySize.width, this.displaySize.height);
    }

    applyStun(duration, tint = 0x000000) {
        if (!duration || this.isStunned) return;
        this.isStunned = true;
        this.stunTint = tint;
        this.setTint(tint);
        if (this.body) {
            this.body.setVelocity(0, 0);
        }
        if (this.anims.currentAnim && !this.anims.isPaused) {
            this.anims.pause();
        }
        this.scene?.time?.delayedCall(duration, () => {
            this.isStunned = false;
            this.clearTint();
            if (this.anims.currentAnim && this.anims.isPaused) {
                this.anims.resume();
            }
        });
    }

    flashDamageTint() {
        if (!this.scene) return;
        if (this.damageTintTimer) {
            this.damageTintTimer.remove(false);
        }
        this.setTint(0xff0000);
        this.damageTintTimer = this.scene.time.delayedCall(120, () => {
            this.clearTint();
        });
    }
}
