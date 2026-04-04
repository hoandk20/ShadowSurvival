import { getFinalBossRoundConfig } from '../../config/finalBosses.js';
import Enemy from '../Enemy.js';

const GIANT_ROCK_DEATH_ANIMATION_MS = 1000;
const GIANT_ROCK_DEATH_HOLD_MS = 3000;
const GIANT_ROCK_DEATH_SEQUENCE_MS = GIANT_ROCK_DEATH_ANIMATION_MS + GIANT_ROCK_DEATH_HOLD_MS;
const GIANT_ROCK_ROCK_FALL_HEIGHT = 180;
const GIANT_ROCK_ROCK_FALL_DELAY_MS = 1000;
const GIANT_ROCK_ROCK_FALL_DURATION_MS = 420;
const GIANT_ROCK_ROCK_FALL_RADIUS = 34;
const GIANT_ROCK_DASH_HIT_KNOCKBACK_SPEED = 360;
const GIANT_ROCK_DASH_HIT_KNOCKBACK_DURATION_MS = 630;
const GIANT_ROCK_DASH_HIT_KNOCKBACK_DRAG = 0.97;
const GIANT_ROCK_ROUND2_ATTACK_ANIMATION_MS = 1000;
const GIANT_ROCK_ROUND2_COLUMN_DELAY_MS = 1000;
const GIANT_ROCK_ROUND2_COLUMN_DAMAGE_RATIO = 0.8;
const GIANT_ROCK_ROUND2_COLUMN_RADIUS = 32;
const GIANT_ROCK_ROUND2_COLUMN_LIFETIME_MS = 700;
const GIANT_ROCK_ROUND2_COLUMN_WARNING_MS = 900;
const GIANT_ROCK_ROUND2_COLUMN_KNOCKBACK_SPEED = 180;
const GIANT_ROCK_ROUND2_COLUMN_KNOCKBACK_DURATION_MS = 220;
const GIANT_ROCK_ROUND2_COLUMN_KNOCKBACK_DRAG = 0.9;

export default class GiantRockBoss extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'giant_rock');
        this.round2ColumnTimer = null;
    }

    isRound2RandomAttackPhase() {
        return this.isFinalBoss && this.finalBossRoundIndex === 1;
    }

    restoreRound2AttackStyle() {
        if (!this.isRound2RandomAttackPhase()) return;
        this.attackStyle = 'giant_rock_stone_columns';
    }

    beginFinalBossDeathSequence(source = null) {
        if (!this.isFinalBoss) {
            return super.beginFinalBossDeathSequence(source);
        }
        if (this.isDeathSequenceActive) {
            const hasNextRound = Boolean(getFinalBossRoundConfig(this.finalBossKey, this.finalBossRoundIndex + 1));
            return { phaseChanged: hasNextRound };
        }

        const nextRoundIndex = this.finalBossRoundIndex + 1;
        const hasNextRound = Boolean(getFinalBossRoundConfig(this.finalBossKey, nextRoundIndex));
        this.isDeathSequenceActive = true;
        this.isDead = true;
        this.round2ColumnTimer?.remove?.(false);
        this.round2ColumnTimer = null;
        this.pendingDeathSource = source ?? this.pendingDeathSource ?? null;
        this.health = 0;
        this.refreshHealthText();
        this.stopCombatForDeathSequence();
        this.playDeathAnimation();
        this.deathSequenceTimer?.remove?.(false);
        this.deathSequenceTimer = this.scene?.time?.delayedCall(GIANT_ROCK_DEATH_SEQUENCE_MS, () => {
            this.deathSequenceTimer = null;
            if (!this.active) return;
            this.isDeathSequenceActive = false;
            if (hasNextRound) {
                this.reviveFromDeathSequence();
                this.tryAdvanceFinalBossRound();
                this.forceReturnToMoveAnimation();
                return;
            }
            this.playDeathEffect();
            this.finishDeath(this.pendingDeathSource ?? null);
        });
        return { phaseChanged: hasNextRound };
    }

    handleDeath(source = null) {
        if (this.deathExplosionResolved) return;
        if (this.deathExplosionPrimed) return;
        if (this.isDead && !this.explodeOnDead) return;
        this.round2ColumnTimer?.remove?.(false);
        this.round2ColumnTimer = null;
        if (this.beginFinalBossDeathSequence(source)) return;
        super.handleDeath(source);
    }

    tryAttackPlayer(targetPlayer, time) {
        if (this.isRound2RandomAttackPhase() && !this.isAttacking) {
            this.attackStyle = Phaser.Math.Between(0, 1) === 0
                ? 'dash_lunge'
                : 'giant_rock_stone_columns';
        }
        if (this.attackStyle !== 'giant_rock_stone_columns') {
            const didStartAttack = super.tryAttackPlayer(targetPlayer, time);
            if (!didStartAttack) {
                this.restoreRound2AttackStyle();
            }
            return didStartAttack;
        }
        if (this.explodeOnDead?.triggerOnPlayerContact) return false;
        if (this.combatType !== 'melee' || !targetPlayer?.active || targetPlayer?.isDead) return false;
        if (this.isAttacking) return false;
        if ((time - this.lastAttackTime) < this.attackCooldown) return false;
        const dx = targetPlayer.x - this.x;
        const dy = targetPlayer.y - this.y;
        const attackDistance = this.getMeleeAttackDistance(targetPlayer);
        if ((dx * dx) + (dy * dy) > attackDistance * attackDistance) return false;

        this.lastAttackTime = time;
        this.isAttacking = true;
        this.playAttackSquashBounce();
        this.resetMeleeEngageDelay();
        this.body?.setVelocity(0, 0);
        this.setFlipX(dx < 0);
        this.playRound2AttackAnimation();
        this.pendingAttackTimer?.remove?.(false);
        this.pendingAttackTimer = this.scene?.time?.delayedCall(this.meleeAttackConfig.windupMs ?? GIANT_ROCK_ROUND2_ATTACK_ANIMATION_MS, () => {
            this.pendingAttackTimer = null;
            this.performMeleeAttack(targetPlayer);
        });
        return true;
    }

    performMeleeAttack(targetPlayer) {
        if (this.attackStyle !== 'giant_rock_stone_columns') {
            super.performMeleeAttack(targetPlayer);
            return;
        }
        if (!this.active) return;
        this.round2ColumnTimer?.remove?.(false);
        this.round2ColumnTimer = this.scene?.time?.delayedCall(GIANT_ROCK_ROUND2_COLUMN_DELAY_MS, () => {
            this.round2ColumnTimer = null;
            if (!this.active) return;
            const columnTarget = targetPlayer?.active && !targetPlayer?.isDead
                ? targetPlayer
                : (this.scene?.getNearestPlayerTarget?.(this.x, this.y) ?? null);
            if (columnTarget) {
                this.spawnRound2StoneColumns(columnTarget);
            }
            const recoveryMs = Math.max(0, this.meleeAttackConfig.recoveryMs ?? 0);
            if (recoveryMs > 0) {
                    this.scene?.time?.delayedCall(recoveryMs, () => {
                        if (!this.active) return;
                        this.isAttacking = false;
                        this.restoreRound2AttackStyle();
                        this.forceReturnToMoveAnimation();
                    });
                } else {
                    this.isAttacking = false;
                    this.restoreRound2AttackStyle();
                    this.forceReturnToMoveAnimation();
                }
            });
    }

    beginDashWindupAnimation() {
        this.holdAnimationPaused = true;
        this.forceReturnToMoveAnimation();
        if (this.anims?.currentAnim?.key === `${this.type}_move` && !this.anims.isPaused) {
            this.anims.pause();
        }
    }

    resumeDashJumpAnimation() {
        this.holdAnimationPaused = false;
        const jumpAnimKey = `${this.type}_jump`;
        if (!this.scene?.anims?.exists(jumpAnimKey)) {
            this.setState('attack');
            return;
        }
        this.state = 'jump';
        this.anims.play(jumpAnimKey, true);
    }

    onDashAttackHitPlayer(targetPlayer) {
        this.dashAttackHitResolved = true;
        targetPlayer.takeDamage?.(this.damage ?? 10, this, { fromEnemyAttack: true });
        this.applyGiantRockDashHitKnockback(targetPlayer);
        this.spawnMeleeAttackImpact(targetPlayer);
        this.finishDashAttack();
        return true;
    }

    finishDashAttack() {
        this.holdAnimationPaused = false;
        this.restoreRound2AttackStyle();
        this.scene?.cameras?.main?.shake?.(110, 0.003);
        this.spawnGiantRockFallAtTrackedPlayer();
        super.finishDashAttack();
    }

    spawnGiantRockFallAtTrackedPlayer() {
        if (!this.scene?.add || !this.scene?.tweens) return;
        const targetPlayer = this.dashAttackTrackedPlayer;
        if (!targetPlayer?.active || targetPlayer?.isDead) return;

        const impactX = targetPlayer.x;
        const impactY = targetPlayer.y;
        const telegraph = this.scene.add.circle(impactX, impactY, GIANT_ROCK_ROCK_FALL_RADIUS, 0x000000, 0.28)
            .setDepth((this.depth ?? 20) + 2);
        telegraph.setStrokeStyle(2, 0x1a1a1a, 0.9);

        this.scene.tweens.add({
            targets: telegraph,
            alpha: { from: 0.16, to: 0.3 },
            scale: { from: 0.72, to: 0.92 },
            duration: GIANT_ROCK_ROCK_FALL_DELAY_MS,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (!telegraph.active) return;
                const rock = this.scene.add.sprite(
                    impactX,
                    impactY - GIANT_ROCK_ROCK_FALL_HEIGHT,
                    'giant_rock_atlas',
                    'image_18.png'
                )
                    .setDepth((this.depth ?? 20) + 4)
                    .setScale(0.85);

                this.scene.tweens.add({
                    targets: telegraph,
                    alpha: { from: 0.3, to: 0.42 },
                    scale: { from: 0.92, to: 1.05 },
                    duration: GIANT_ROCK_ROCK_FALL_DURATION_MS,
                    ease: 'Sine.easeIn'
                });

                this.scene.tweens.add({
                    targets: rock,
                    y: impactY,
                    scaleX: 1,
                    scaleY: 1,
                    duration: GIANT_ROCK_ROCK_FALL_DURATION_MS,
                    ease: 'Quad.easeIn',
                    onComplete: () => {
                        telegraph.destroy();
                        this.resolveGiantRockFallImpact(impactX, impactY);
                        this.scene?.cameras?.main?.shake?.(120, 0.0035);
                        this.scene?.skillBehaviorPipeline?.effects?.spawnExplosion?.(impactX, impactY, (this.depth ?? 20) + 3, {
                            coreRadius: 6,
                            outerRadius: 14,
                            ringRadius: 24,
                            coreColor: 0xffe3b0,
                            outerColor: 0x9b7a54,
                            ringColor: 0x6b4c34,
                            emberColor: 0xc7b199,
                            emberCount: 6
                        });
                        rock.destroy();
                    }
                });
            }
        });
    }

    resolveGiantRockFallImpact(x, y) {
        const players = this.scene?.getActivePlayers?.() ?? [];
        const radiusSq = GIANT_ROCK_ROCK_FALL_RADIUS * GIANT_ROCK_ROCK_FALL_RADIUS;
        players.forEach((player) => {
            if (!player?.active || player?.isDead) return;
            const dx = player.x - x;
            const dy = player.y - y;
            if (((dx * dx) + (dy * dy)) > radiusSq) return;
            player.takeDamage?.(Math.max(1, Math.round((this.damage ?? 10) * 0.8)), this, {
                fromEnemyAttack: true,
                fromRockFall: true
            });
        });
    }

    applyGiantRockDashHitKnockback(targetPlayer) {
        if (!targetPlayer?.active || targetPlayer?.isDead) return;
        const knockbackDirection = new Phaser.Math.Vector2(
            this.dashAttackDirection?.x ?? (targetPlayer.x - this.x),
            this.dashAttackDirection?.y ?? (targetPlayer.y - this.y)
        );
        if (knockbackDirection.lengthSq() === 0) {
            knockbackDirection.set(targetPlayer.x >= this.x ? 1 : -1, 0);
        } else {
            knockbackDirection.normalize();
        }
        targetPlayer.applyExternalKnockback?.(
            knockbackDirection,
            GIANT_ROCK_DASH_HIT_KNOCKBACK_SPEED,
            GIANT_ROCK_DASH_HIT_KNOCKBACK_DURATION_MS,
            GIANT_ROCK_DASH_HIT_KNOCKBACK_DRAG
        );
    }

    playRound2AttackAnimation() {
        const attackAnimKey = `${this.type}_attack`;
        if (!this.scene?.anims?.exists(attackAnimKey)) {
            this.setState('attack');
            return;
        }
        this.state = 'attack';
        this.anims.timeScale = 0.4;
        this.anims.play(attackAnimKey, true);
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (_sprite, animation) => {
            if (animation.key !== attackAnimKey) return;
            this.anims.timeScale = 1;
        });
    }

    spawnRound2StoneColumns(targetPlayer) {
        const count = Phaser.Math.Between(3, 5);
        const positions = this.buildStoneColumnPositions(targetPlayer, count);
        this.scene?.cameras?.main?.shake?.(110, 0.003);
        positions.forEach(({ x, y }) => this.spawnStoneColumnWarning(x, y));
    }

    buildStoneColumnPositions(targetPlayer, count) {
        const positions = [{ x: targetPlayer.x, y: targetPlayer.y }];
        while (positions.length < count) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(42, 96);
            positions.push({
                x: targetPlayer.x + Math.cos(angle) * distance,
                y: targetPlayer.y + Math.sin(angle) * distance
            });
        }
        return positions;
    }

    spawnStoneColumnAt(x, y) {
        const column = this.scene?.add?.sprite?.(x, y, 'giant_rock_atlas', 'image_13.png');
        if (!column) return;
        column.setDepth((this.depth ?? 20) + 4);
        column.setScale(0.95);
        column.play?.('giant_rock_stone');
        this.resolveStoneColumnImpact(x, y);
        this.scene?.time?.delayedCall(GIANT_ROCK_ROUND2_COLUMN_LIFETIME_MS, () => {
            column.destroy();
        });
    }

    spawnStoneColumnWarning(x, y) {
        if (!this.scene?.add || !this.scene?.tweens) {
            this.spawnStoneColumnAt(x, y);
            return;
        }
        const warning = this.scene.add.circle(x, y, GIANT_ROCK_ROUND2_COLUMN_RADIUS, 0x6b0f0f, 0.14)
            .setDepth((this.depth ?? 20) + 2);
        warning.setStrokeStyle(2, 0xff6a6a, 0.32);

        this.scene.tweens.add({
            targets: warning,
            alpha: { from: 0.14, to: 0.28 },
            scale: { from: 0.72, to: 1.04 },
            duration: GIANT_ROCK_ROUND2_COLUMN_WARNING_MS,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                warning.destroy();
                if (!this.active) return;
                this.spawnStoneColumnAt(x, y);
            }
        });
    }

    resolveStoneColumnImpact(x, y) {
        const players = this.scene?.getActivePlayers?.() ?? [];
        const radiusSq = GIANT_ROCK_ROUND2_COLUMN_RADIUS * GIANT_ROCK_ROUND2_COLUMN_RADIUS;
        const damage = Math.max(1, Math.round((this.damage ?? 10) * GIANT_ROCK_ROUND2_COLUMN_DAMAGE_RATIO));
        players.forEach((player) => {
            if (!player?.active || player?.isDead) return;
            const dx = player.x - x;
            const dy = player.y - y;
            if (((dx * dx) + (dy * dy)) > radiusSq) return;
            player.takeDamage?.(damage, this, {
                fromEnemyAttack: true,
                fromRockColumn: true
            });
            const knockbackDirection = new Phaser.Math.Vector2(dx, dy);
            if (knockbackDirection.lengthSq() === 0) {
                knockbackDirection.set(player.x >= x ? 1 : -1, 0);
            } else {
                knockbackDirection.normalize();
            }
            player.applyExternalKnockback?.(
                knockbackDirection,
                GIANT_ROCK_ROUND2_COLUMN_KNOCKBACK_SPEED,
                GIANT_ROCK_ROUND2_COLUMN_KNOCKBACK_DURATION_MS,
                GIANT_ROCK_ROUND2_COLUMN_KNOCKBACK_DRAG
            );
        });
    }
}
