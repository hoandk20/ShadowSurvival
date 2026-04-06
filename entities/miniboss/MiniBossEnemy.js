import Enemy from '../Enemy.js';

const AILEN_MINIBOSS_SUMMON_CHANCE = 0.35;
const AILEN_MINIBOSS_SUMMON_MAX_ACTIVE = 4;
const AILEN_MINIBOSS_SUMMON_COUNT_PER_CAST = 2;
const AILEN_MINIBOSS_SUMMON_DISTANCE_MIN = 70;
const AILEN_MINIBOSS_SUMMON_DISTANCE_MAX = 130;
const AILEN_MINIBOSS_PROJECTILE_RADIUS = 10;

export default class MiniBossEnemy extends Enemy {
    constructor(scene, x, y, type) {
        super(scene, x, y, type);
        this.isMiniBoss = true;

        if (this.type === 'ailen') {
            // Make the sniper shot feel like a miniboss threat (visual + hitbox).
            this.rangedAttackConfig = {
                ...(this.rangedAttackConfig ?? {}),
                projectileRadius: Math.max(
                    AILEN_MINIBOSS_PROJECTILE_RADIUS,
                    this.rangedAttackConfig?.projectileRadius ?? 0
                )
            };
        }
    }

    tryRangedAttack(targetPlayer, time) {
        if (this.type === 'ailen' && this.shouldUseAilenMiniBossSummon()) {
            if (!targetPlayer?.active || targetPlayer?.isDead) return false;
            if ((time - this.lastRangedAttackTime) < this.attackCooldown) return false;
            const dx = targetPlayer.x - this.x;
            const dy = targetPlayer.y - this.y;
            const preferredRange = Math.max(0, this.rangedAttackConfig?.preferredRange ?? 0);
            const attackDistance = Math.max(this.attackRange ?? 0, preferredRange + 20, 40);
            if ((dx * dx) + (dy * dy) > attackDistance * attackDistance) return false;
            this.lastRangedAttackTime = time;
            this.playAttackSquashBounce();
            this.performAilenMiniBossSummon();
            return true;
        }
        return super.tryRangedAttack(targetPlayer, time);
    }

    shouldUseAilenMiniBossSummon() {
        if (this.type !== 'ailen') return false;
        if (Math.random() >= AILEN_MINIBOSS_SUMMON_CHANCE) return false;
        return this.getActiveAilenMiniBossBomberCount() < AILEN_MINIBOSS_SUMMON_MAX_ACTIVE;
    }

    performAilenMiniBossSummon() {
        this.isAttacking = true;
        this.body?.setVelocity?.(0, 0);
        this.pendingAttackTimer?.remove?.(false);
        this.pendingAttackTimer = this.scene?.time?.delayedCall(this.rangedAttackConfig?.sniperWindupMs ?? 650, () => {
            this.pendingAttackTimer = null;
            if (!this.active) return;
            const activeBomberCount = this.getActiveAilenMiniBossBomberCount();
            const summonCount = Math.max(0, Math.min(
                AILEN_MINIBOSS_SUMMON_COUNT_PER_CAST,
                AILEN_MINIBOSS_SUMMON_MAX_ACTIVE - activeBomberCount
            ));
            for (let index = 0; index < summonCount; index += 1) {
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                const distance = Phaser.Math.Between(
                    AILEN_MINIBOSS_SUMMON_DISTANCE_MIN,
                    AILEN_MINIBOSS_SUMMON_DISTANCE_MAX
                );
                const x = this.x + Math.cos(angle) * distance;
                const y = this.y + Math.sin(angle) * distance;
                const summonedEnemy = this.scene?.spawnEnemyAtPosition?.(x, y, 'bomber', {
                    countsTowardWave: false,
                    ignoreSpawnCap: true
                });
                if (summonedEnemy) {
                    summonedEnemy.ailenMiniBossOwner = this;
                }
            }
            const recoveryMs = Math.max(0, this.rangedAttackConfig?.sniperRecoveryMs ?? 160);
            this.scene?.time?.delayedCall(recoveryMs, () => {
                if (!this.active) return;
                this.isAttacking = false;
            });
        });
    }

    getActiveAilenMiniBossBomberCount() {
        const enemies = this.scene?.enemies?.getChildren?.() ?? [];
        return enemies.filter((enemy) => (
            enemy?.active
            && !enemy?.isDead
            && enemy?.ailenMiniBossOwner === this
        )).length;
    }
}
