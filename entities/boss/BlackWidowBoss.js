import { getFinalBossRoundConfig } from '../../config/finalBosses.js';
import Enemy from '../Enemy.js';

const BLACK_WIDOW_DEATH_ANIMATION_MS = 1000;
const BLACK_WIDOW_DEATH_HOLD_MS = 3000;
const BLACK_WIDOW_DEATH_SEQUENCE_MS = BLACK_WIDOW_DEATH_ANIMATION_MS + BLACK_WIDOW_DEATH_HOLD_MS;
const BLACK_WIDOW_ATTACK_RANGE = 280;
const BLACK_WIDOW_DASH_WARNING_TIME_MS = 800;
const BLACK_WIDOW_DASH_DAMAGE_RADIUS = 26;
const BLACK_WIDOW_DASH_PATTERN_COUNT_ROUND1 = 3;
const BLACK_WIDOW_DASH_PATTERN_COUNT_MIN = 3;
const BLACK_WIDOW_DASH_PATTERN_COUNT_MAX = 5;
const BLACK_WIDOW_DASH_STAGGER_MS = 80;
const BLACK_WIDOW_DASH_WARNING_ALPHA = 0.22;
const BLACK_WIDOW_DASH_WARNING_STROKE_ALPHA = 0.46;
const BLACK_WIDOW_DASH_WARNING_WIDTH = BLACK_WIDOW_DASH_DAMAGE_RADIUS * 2;
const BLACK_WIDOW_DASH_SPEED_PX_PER_SEC = 2000;
const BLACK_WIDOW_ROUND2_DASH_SPEED_PX_PER_SEC = 5000;
const BLACK_WIDOW_DASH_PLAYER_TARGET_SPREAD_X = 120;
const BLACK_WIDOW_DASH_PLAYER_TARGET_SPREAD_Y = 90;
const BLACK_WIDOW_DASH_EVADE_DURATION_MS = 1000;
const BLACK_WIDOW_DASH_JUMP_EXIT_DURATION_MS = 220;
const BLACK_WIDOW_DASH_RETURN_DURATION_MS = 220;
const BLACK_WIDOW_HAND_ATTACK_DELAY_MS = 1000;
const BLACK_WIDOW_HAND_ATTACK_ANIMATION_LEAD_MS = 200;
const BLACK_WIDOW_HAND_ATTACK_RADIUS = 120;
const BLACK_WIDOW_HAND_WARNING_RADIUS = 148;
const BLACK_WIDOW_HAND_ATTACK_ARC = Phaser.Math.DegToRad(91);
const BLACK_WIDOW_HAND_WARNING_ALPHA = 0.2;
const BLACK_WIDOW_HAND_WARNING_COLOR = 0xff8a8a;
const BLACK_WIDOW_HAND_APPROACH_DISTANCE = 96;
const BLACK_WIDOW_HAND_ROUND1_APPROACH_SPEED_MULTIPLIER = 2.2;
const BLACK_WIDOW_HAND_ROUND1_APPROACH_STOP_EARLY_MS = 260;
const BLACK_WIDOW_HAND_SWEEP_DURATION_MS = 180;
const BLACK_WIDOW_HAND_SHAKE_DURATION_MS = 120;
const BLACK_WIDOW_HAND_SHAKE_INTENSITY = 0.0045;
const BLACK_WIDOW_SUMMON_COUNT = 10;
const BLACK_WIDOW_BEAM_DURATION_MS = 2000;
const BLACK_WIDOW_BEAM_TICK_MS = 140;
const BLACK_WIDOW_BEAM_WIDTH = 40;
const BLACK_WIDOW_BEAM_LENGTH = 460;
const BLACK_WIDOW_BEAM_ARC_DEGREES = 120;
const BLACK_WIDOW_BEAM_DAMAGE_RATIO = 0.5;

export default class BlackWidowBoss extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'black_widow');
        this.attackStyle = 'black_widow_cycle';
        this.behavior = 'chase';
        this.pendingWidowSkill = null;
        this.handAttackApproachActive = false;
        this.activeBeamGraphics = null;
        this.activeBeamTimer = null;
        this.skillCooldownUntil = 0;
        this.activeDashAttackId = 0;
        this.activeBeamAttackId = 0;
        this.isDashEvading = false;
        this.dashReturnPosition = null;
    }

    takeDamage(amount, force = 0, direction = null, source = null, options = {}, skillConfig = null) {
        if (this.isDashEvading) {
            return {
                healthDamage: 0,
                absorbedDamage: 0,
                didKill: false
            };
        }
        return super.takeDamage(amount, force, direction, source, options, skillConfig);
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
        this.pendingDeathSource = source ?? this.pendingDeathSource ?? null;
        this.health = 0;
        this.refreshHealthText();
        this.stopCombatForDeathSequence();
        this.playWidowAnimation('die');
        this.deathSequenceTimer?.remove?.(false);
        this.deathSequenceTimer = this.scene?.time?.delayedCall(BLACK_WIDOW_DEATH_SEQUENCE_MS, () => {
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
        if (this.deathExplosionResolved || this.deathExplosionPrimed) return;
        if (this.isDead && !this.explodeOnDead) return;
        if (this.beginFinalBossDeathSequence(source)) return;
        super.handleDeath(source);
    }

    cleanupEffectTimers() {
        super.cleanupEffectTimers();
        this.clearBeamVisual();
    }

    updateMeleeBehavior(targetPlayer, time) {
        if (!targetPlayer?.active || targetPlayer?.isDead) {
            this.body?.setVelocity?.(0, 0);
            return;
        }
        const dx = targetPlayer.x - this.x;
        const dy = targetPlayer.y - this.y;
        const distanceSq = (dx * dx) + (dy * dy);
        const attackDistance = Math.max(this.attackRange ?? 0, BLACK_WIDOW_ATTACK_RANGE);
        const effectiveSpeed = this.getStatusAdjustedSpeed?.(this.speed) ?? this.speed;

        if (this.handAttackApproachActive && this.pendingWidowSkill === 'hand_attack') {
            const handAttackDistanceSq = BLACK_WIDOW_HAND_APPROACH_DISTANCE * BLACK_WIDOW_HAND_APPROACH_DISTANCE;
            if (distanceSq <= handAttackDistanceSq) {
                this.handAttackApproachActive = false;
                this.startHandAttackWindup(targetPlayer);
                return;
            }
            const angle = Math.atan2(dy, dx);
            const vx = Math.cos(angle) * effectiveSpeed * BLACK_WIDOW_HAND_ROUND1_APPROACH_SPEED_MULTIPLIER;
            const vy = Math.sin(angle) * effectiveSpeed * BLACK_WIDOW_HAND_ROUND1_APPROACH_SPEED_MULTIPLIER;
            this.body?.setVelocity?.(vx, vy);
            this.setFlipX(vx < 0);
            this.playWidowAnimation('move');
            return;
        }

        if (this.isAttacking) {
            this.body?.setVelocity?.(0, 0);
            this.setFlipX(dx < 0);
            return;
        }

        if (time < this.skillCooldownUntil) {
            this.body?.setVelocity?.(0, 0);
            this.setFlipX(dx < 0);
            this.playWidowAnimation('idle');
            return;
        }

        if (distanceSq <= attackDistance * attackDistance) {
            this.body?.setVelocity?.(0, 0);
            this.setFlipX(dx < 0);
            this.tryAttackPlayer(targetPlayer, time);
            return;
        }

        const angle = Math.atan2(dy, dx);
        const vx = Math.cos(angle) * effectiveSpeed;
        const vy = Math.sin(angle) * effectiveSpeed;
        this.body?.setVelocity?.(vx, vy);
        this.setFlipX(vx < 0);
    }

    tryAttackPlayer(targetPlayer, time) {
        if (!targetPlayer?.active || targetPlayer?.isDead) return false;
        if (this.isAttacking) return false;
        if (time < this.skillCooldownUntil) return false;

        const isRoundOne = this.finalBossRoundIndex <= 0;
        const skillRoll = Math.random();
        if (isRoundOne) {
            this.pendingWidowSkill = skillRoll < 0.5 ? 'dash' : 'hand_attack';
        } else if (skillRoll < 0.34) {
            this.pendingWidowSkill = 'dash';
        } else if (skillRoll < 0.67) {
            this.pendingWidowSkill = 'summon';
        } else if (skillRoll < 0.84) {
            this.pendingWidowSkill = 'beam';
        } else {
            this.pendingWidowSkill = 'hand_attack';
        }

        this.body?.setVelocity?.(0, 0);
        this.setFlipX((targetPlayer.x - this.x) < 0);

        if (this.pendingWidowSkill === 'dash') {
            this.isAttacking = true;
            this.performDashStorm();
            return true;
        }
        if (this.pendingWidowSkill === 'summon') {
            this.isAttacking = true;
            this.performSummon();
            return true;
        }
        if (this.pendingWidowSkill === 'beam') {
            this.isAttacking = true;
            this.performBeamAttack(targetPlayer);
            return true;
        }
        const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, targetPlayer.x, targetPlayer.y);
        if (isRoundOne && distanceToTarget > BLACK_WIDOW_HAND_APPROACH_DISTANCE) {
            this.handAttackApproachActive = true;
            return true;
        }
        this.startHandAttackWindup(targetPlayer);
        return true;
    }

    performDashStorm() {
        const patterns = this.buildDashPatterns();
        this.activeDashAttackId += 1;
        this.dashReturnPosition = { x: this.x, y: this.y };
        this.playWidowAnimation('jump');
        this.body?.setVelocity?.(0, 0);
        this.isDashEvading = true;
        const escapePoint = this.getDashEscapePoint();
        this.scene?.tweens?.add({
            targets: this,
            x: escapePoint.x,
            y: escapePoint.y,
            duration: BLACK_WIDOW_DASH_JUMP_EXIT_DURATION_MS,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                if (!this.active) return;
                this.setVisible(false);
                if (this.body) {
                    this.body.enable = false;
                }
            }
        });
        this.scene?.time?.delayedCall(BLACK_WIDOW_DASH_EVADE_DURATION_MS, () => {
            if (!this.active) return;
            const warnings = patterns.map((pattern) => this.spawnDashWarning(pattern));
            this.scene?.time?.delayedCall(BLACK_WIDOW_DASH_WARNING_TIME_MS, () => {
                warnings.forEach((warning) => warning?.destroy?.());
                if (!this.active) return;
                this.isDashEvading = false;
                if (this.body) {
                    this.body.enable = true;
                }
                this.runDashPatternSequence(patterns, 0);
            });
        });
    }

    runDashPatternSequence(patterns, index = 0) {
        if (!this.active) return;
        if (!Array.isArray(patterns) || index >= patterns.length) {
            this.returnAfterDashStorm();
            return;
        }
        const pattern = patterns[index];
        this.runSingleDashPattern(pattern, () => {
            if (!this.active) return;
            this.scene?.time?.delayedCall(BLACK_WIDOW_DASH_STAGGER_MS, () => {
                if (!this.active) return;
                this.runDashPatternSequence(patterns, index + 1);
            });
        });
    }

    returnAfterDashStorm() {
        const returnPosition = this.dashReturnPosition;
        this.dashReturnPosition = null;
        if (!returnPosition) {
            this.startSkillCooldown();
            this.isAttacking = false;
            this.pendingWidowSkill = null;
            this.forceReturnToMoveAnimation();
            return;
        }
        this.setVisible(true);
        if (this.body) {
            this.body.enable = true;
        }
        this.scene?.tweens?.add({
            targets: this,
            x: returnPosition.x,
            y: returnPosition.y,
            duration: BLACK_WIDOW_DASH_RETURN_DURATION_MS,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                if (!this.active) return;
                this.startSkillCooldown();
                this.isAttacking = false;
                this.pendingWidowSkill = null;
                this.forceReturnToMoveAnimation();
            }
        });
    }

    runSingleDashPattern(pattern, onComplete = null) {
        const travel = new Phaser.Math.Vector2(pattern.endX - pattern.startX, pattern.endY - pattern.startY);
        const entryOffset = Math.max(60, (this.displayWidth ?? 0) * 0.6, (this.displayHeight ?? 0) * 0.6);
        const dashSpeed = this.finalBossRoundIndex >= 1
            ? BLACK_WIDOW_ROUND2_DASH_SPEED_PX_PER_SEC
            : BLACK_WIDOW_DASH_SPEED_PX_PER_SEC;
        if (travel.lengthSq() > 0) {
            travel.normalize();
        } else {
            travel.set(0, 1);
        }
        const actualStartX = pattern.startX - (travel.x * entryOffset);
        const actualStartY = pattern.startY - (travel.y * entryOffset);
        const actualEndX = pattern.endX + (travel.x * entryOffset);
        const actualEndY = pattern.endY + (travel.y * entryOffset);
        this.setPosition(
            actualStartX,
            actualStartY
        );
        this.setVisible(true);
        if (this.body) {
            this.body.enable = true;
        }
        this.playWidowAnimation('fall');
        const distance = Phaser.Math.Distance.Between(actualStartX, actualStartY, actualEndX, actualEndY);
        const duration = Math.max(80, Math.round((distance / dashSpeed) * 1000));
        this.scene?.cameras?.main?.shake?.(80, 0.003);
        this.scene?.tweens?.add({
            targets: this,
            x: actualEndX,
            y: actualEndY,
            duration,
            ease: 'Linear',
            onUpdate: () => {
                this.resolveDashDamage(actualStartX, actualStartY, actualEndX, actualEndY);
            },
            onComplete: () => {
                if (!this.active) return;
                onComplete?.();
            }
        });
    }

    buildDashPatterns() {
        const bounds = this.getAttackBounds();
        if (!bounds) return [];
        const isRoundOne = this.finalBossRoundIndex <= 0;
        const count = isRoundOne
            ? BLACK_WIDOW_DASH_PATTERN_COUNT_ROUND1
            : Phaser.Math.Between(BLACK_WIDOW_DASH_PATTERN_COUNT_MIN, BLACK_WIDOW_DASH_PATTERN_COUNT_MAX);
        const patterns = [];
        const targetPlayer = (this.scene?.getActivePlayers?.() ?? []).find((player) => player?.active && !player?.isDead) ?? null;
        const anchorX = targetPlayer?.x ?? ((bounds.left + bounds.right) * 0.5);
        const anchorY = targetPlayer?.y ?? ((bounds.top + bounds.bottom) * 0.5);
        for (let index = 0; index < count; index += 1) {
            const centerPoint = {
                x: Phaser.Math.Clamp(
                    anchorX + Phaser.Math.Between(-BLACK_WIDOW_DASH_PLAYER_TARGET_SPREAD_X, BLACK_WIDOW_DASH_PLAYER_TARGET_SPREAD_X),
                    bounds.left + 20,
                    bounds.right - 20
                ),
                y: Phaser.Math.Clamp(
                    anchorY + Phaser.Math.Between(-BLACK_WIDOW_DASH_PLAYER_TARGET_SPREAD_Y, BLACK_WIDOW_DASH_PLAYER_TARGET_SPREAD_Y),
                    bounds.top + 20,
                    bounds.bottom - 20
                )
            };
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const direction = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
            const startPoint = this.projectDashPointToBounds(bounds, centerPoint, direction.clone().negate());
            const endPoint = this.projectDashPointToBounds(bounds, centerPoint, direction);
            patterns.push({
                startX: startPoint.x,
                startY: startPoint.y,
                endX: endPoint.x,
                endY: endPoint.y
            });
        }
        return Phaser.Utils.Array.Shuffle(patterns);
    }

    projectDashPointToBounds(bounds, centerPoint, direction) {
        const safeDirection = direction.lengthSq() > 0
            ? direction.normalize()
            : new Phaser.Math.Vector2(1, 0);
        const candidates = [];
        if (Math.abs(safeDirection.x) > 0.0001) {
            const targetX = safeDirection.x > 0 ? bounds.right : bounds.left;
            const t = (targetX - centerPoint.x) / safeDirection.x;
            const y = centerPoint.y + (safeDirection.y * t);
            if (t >= 0 && y >= bounds.top && y <= bounds.bottom) {
                candidates.push({ t, x: targetX, y });
            }
        }
        if (Math.abs(safeDirection.y) > 0.0001) {
            const targetY = safeDirection.y > 0 ? bounds.bottom : bounds.top;
            const t = (targetY - centerPoint.y) / safeDirection.y;
            const x = centerPoint.x + (safeDirection.x * t);
            if (t >= 0 && x >= bounds.left && x <= bounds.right) {
                candidates.push({ t, x, y: targetY });
            }
        }
        if (candidates.length <= 0) {
            return { x: centerPoint.x, y: centerPoint.y };
        }
        candidates.sort((a, b) => a.t - b.t);
        return { x: candidates[0].x, y: candidates[0].y };
    }

    getDashEscapePoint() {
        const bounds = this.getAttackBounds();
        if (!bounds) {
            return { x: this.x, y: this.y - 220 };
        }
        const centerX = (bounds.left + bounds.right) * 0.5;
        const escapeY = bounds.top - Math.max(140, this.displayHeight ?? 0, 120);
        return { x: centerX, y: escapeY };
    }

    spawnDashWarning(pattern) {
        if (!this.scene?.add?.graphics) return null;
        const warning = this.scene.add.graphics().setDepth((this.depth ?? 20) + 4);
        warning.lineStyle(BLACK_WIDOW_DASH_WARNING_WIDTH, 0xff8a8a, BLACK_WIDOW_DASH_WARNING_ALPHA);
        warning.beginPath();
        warning.moveTo(pattern.startX, pattern.startY);
        warning.lineTo(pattern.endX, pattern.endY);
        warning.strokePath();
        this.scene?.tweens?.add({
            targets: warning,
            alpha: { from: 0.35, to: 0.85 },
            duration: BLACK_WIDOW_DASH_WARNING_TIME_MS,
            yoyo: true,
            repeat: -1
        });
        return warning;
    }

    resolveDashDamage(startX, startY, endX, endY) {
        const players = this.scene?.getActivePlayers?.() ?? [];
        const damage = Math.max(1, Math.round(this.damage ?? 10));
        const dashAttackId = this.activeDashAttackId;
        players.forEach((player) => {
            if (!player?.active || player?.isDead) return;
            if (!this.isPointNearLine(player.x, player.y, startX, startY, endX, endY, BLACK_WIDOW_DASH_DAMAGE_RADIUS)) return;
            if (player.__blackWidowDashAttackId === dashAttackId) return;
            player.__blackWidowDashAttackId = dashAttackId;
            player.takeDamage?.(damage, this, { fromEnemyAttack: true, fromBlackWidowDash: true });
            const dir = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
            if (dir.lengthSq() > 0) {
                dir.normalize();
                player.applyExternalKnockback?.(dir, 280, 180, 0.9);
            }
        });
    }

    startHandAttackWindup(targetPlayer) {
        this.isAttacking = true;
        this.handAttackApproachActive = false;
        this.performHandAttack(targetPlayer);
    }

    performHandAttack(targetPlayer) {
        const isRoundOne = this.finalBossRoundIndex <= 0;
        const targetPoint = new Phaser.Math.Vector2(targetPlayer.x, targetPlayer.y);
        const warning = this.spawnHandAttackWarning(targetPoint);
        const angle = Math.atan2(targetPoint.y - this.y, targetPoint.x - this.x);
        const distanceToTarget = Phaser.Math.Distance.Between(this.x, this.y, targetPoint.x, targetPoint.y);
        const shouldApproach = isRoundOne && distanceToTarget > BLACK_WIDOW_HAND_APPROACH_DISTANCE;
        const moveSpeedMultiplier = shouldApproach
            ? BLACK_WIDOW_HAND_ROUND1_APPROACH_SPEED_MULTIPLIER
            : 1.4;
        const stopEarlyMs = shouldApproach
            ? BLACK_WIDOW_HAND_ROUND1_APPROACH_STOP_EARLY_MS
            : 220;
        this.body?.setVelocity?.(Math.cos(angle) * (this.speed * moveSpeedMultiplier), Math.sin(angle) * (this.speed * moveSpeedMultiplier));
        this.scene?.time?.delayedCall(Math.max(0, BLACK_WIDOW_HAND_ATTACK_DELAY_MS - stopEarlyMs), () => {
            this.body?.setVelocity?.(0, 0);
        });
        this.scene?.time?.delayedCall(
            Math.max(0, BLACK_WIDOW_HAND_ATTACK_DELAY_MS - BLACK_WIDOW_HAND_ATTACK_ANIMATION_LEAD_MS),
            () => {
                if (!this.active) return;
                this.playWidowAnimation('hand_attack');
            }
        );
        this.scene?.time?.delayedCall(BLACK_WIDOW_HAND_ATTACK_DELAY_MS, () => {
            warning?.destroy?.();
            if (!this.active) return;
            this.spawnHandAttackSweep(targetPoint);
            this.scene?.cameras?.main?.shake?.(BLACK_WIDOW_HAND_SHAKE_DURATION_MS, BLACK_WIDOW_HAND_SHAKE_INTENSITY);
            this.resolveHandAttackDamage(targetPoint);
            this.scene?.time?.delayedCall(220, () => {
                if (!this.active) return;
                this.startSkillCooldown();
                this.isAttacking = false;
                this.pendingWidowSkill = null;
                this.handAttackApproachActive = false;
                this.forceReturnToMoveAnimation();
            });
        });
    }

    spawnHandAttackWarning(targetPoint) {
        if (!this.scene?.add?.graphics) return null;
        const warning = this.scene.add.graphics().setDepth((this.depth ?? 20) + 4);
        const angle = Math.atan2(targetPoint.y - this.y, targetPoint.x - this.x);
        warning.fillStyle(BLACK_WIDOW_HAND_WARNING_COLOR, BLACK_WIDOW_HAND_WARNING_ALPHA);
        warning.slice(this.x, this.y, BLACK_WIDOW_HAND_WARNING_RADIUS, angle - (BLACK_WIDOW_HAND_ATTACK_ARC / 2), angle + (BLACK_WIDOW_HAND_ATTACK_ARC / 2), false);
        warning.fillPath();
        warning.lineStyle(2, BLACK_WIDOW_HAND_WARNING_COLOR, 0.5);
        warning.slice(this.x, this.y, BLACK_WIDOW_HAND_WARNING_RADIUS, angle - (BLACK_WIDOW_HAND_ATTACK_ARC / 2), angle + (BLACK_WIDOW_HAND_ATTACK_ARC / 2), false);
        warning.strokePath();
        return warning;
    }

    spawnHandAttackSweep(targetPoint) {
        if (!this.scene?.add?.graphics || !this.scene?.tweens) return;
        const sweep = this.scene.add.graphics().setDepth((this.depth ?? 20) + 6);
        const angle = Math.atan2(targetPoint.y - this.y, targetPoint.x - this.x);
        const startAngle = angle - (BLACK_WIDOW_HAND_ATTACK_ARC * 0.5);
        const endAngle = angle + (BLACK_WIDOW_HAND_ATTACK_ARC * 0.5);
        sweep.fillStyle(0xff5478, 0.32);
        sweep.slice(
            this.x,
            this.y,
            BLACK_WIDOW_HAND_ATTACK_RADIUS,
            startAngle,
            endAngle,
            false
        );
        sweep.fillPath();
        sweep.fillStyle(0xffb3c1, 0.2);
        sweep.slice(
            this.x,
            this.y,
            BLACK_WIDOW_HAND_ATTACK_RADIUS * 0.72,
            startAngle,
            endAngle,
            false
        );
        sweep.fillPath();
        sweep.lineStyle(2, 0xff6f8f, 0.85);
        sweep.beginPath();
        sweep.moveTo(this.x, this.y);
        sweep.lineTo(
            this.x + Math.cos(angle) * BLACK_WIDOW_HAND_ATTACK_RADIUS,
            this.y + Math.sin(angle) * BLACK_WIDOW_HAND_ATTACK_RADIUS
        );
        sweep.strokePath();
        this.scene.tweens.add({
            targets: sweep,
            alpha: 0,
            duration: BLACK_WIDOW_HAND_SWEEP_DURATION_MS,
            ease: 'Cubic.easeOut',
            onComplete: () => sweep.destroy()
        });
    }

    resolveHandAttackDamage(targetPoint) {
        const players = this.scene?.getActivePlayers?.() ?? [];
        const damage = Math.max(1, Math.round((this.damage ?? 10) * 1.1));
        const facing = new Phaser.Math.Vector2(targetPoint.x - this.x, targetPoint.y - this.y);
        if (facing.lengthSq() === 0) facing.set(this.flipX ? -1 : 1, 0);
        facing.normalize();
        players.forEach((player) => {
            if (!player?.active || player?.isDead) return;
            const offset = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
            if (offset.lengthSq() > (BLACK_WIDOW_HAND_ATTACK_RADIUS * BLACK_WIDOW_HAND_ATTACK_RADIUS)) return;
            if (offset.lengthSq() > 0) offset.normalize();
            const dot = Phaser.Math.Clamp(facing.dot(offset), -1, 1);
            const angleDiff = Math.acos(dot);
            if (angleDiff > (BLACK_WIDOW_HAND_ATTACK_ARC * 0.5)) return;
            player.takeDamage?.(damage, this, { fromEnemyAttack: true, fromBlackWidowHand: true });
            const knockbackDirection = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
            if (knockbackDirection.lengthSq() > 0) {
                knockbackDirection.normalize();
                player.applyExternalKnockback?.(knockbackDirection, 320, 180, 0.9);
            }
        });
    }

    performSummon() {
        this.playWidowAnimation('summon');
        this.body?.setVelocity?.(0, 0);
        this.scene?.time?.delayedCall(this.meleeAttackConfig.windupMs ?? 1000, () => {
            if (!this.active) return;
            const activeSummonCount = this.getActiveWidowSummonCount();
            const summonCount = Math.max(0, BLACK_WIDOW_SUMMON_COUNT - activeSummonCount);
            for (let index = 0; index < summonCount; index += 1) {
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                const distance = Phaser.Math.Between(80, 150);
                const x = this.x + Math.cos(angle) * distance;
                const y = this.y + Math.sin(angle) * distance;
                const summonedEnemy = this.scene?.spawnEnemyAtPosition?.(x, y, 'widow', {
                    countsTowardWave: false,
                    ignoreSpawnCap: true
                });
                if (summonedEnemy) {
                    summonedEnemy.blackWidowBossOwner = this;
                }
            }
            this.startSkillCooldown();
            this.isAttacking = false;
            this.pendingWidowSkill = null;
            this.forceReturnToMoveAnimation();
        });
    }

    getActiveWidowSummonCount() {
        const enemies = this.scene?.enemies?.getChildren?.() ?? [];
        return enemies.filter((enemy) => (
            enemy?.active
            && !enemy?.isDead
            && enemy?.blackWidowBossOwner === this
        )).length;
    }

    performBeamAttack(targetPlayer) {
        this.playWidowAnimation('windup');
        const targetAngle = Math.atan2(targetPlayer.y - this.y, targetPlayer.x - this.x);
        const halfSweep = Phaser.Math.DegToRad(BLACK_WIDOW_BEAM_ARC_DEGREES * 0.5);
        this.scene?.time?.delayedCall(this.meleeAttackConfig.windupMs ?? 1000, () => {
            if (!this.active) return;
            this.playWidowAnimation('shield');
            this.startBeamSweep(targetAngle - halfSweep, targetAngle + halfSweep);
        });
    }

    startBeamSweep(startAngle, endAngle) {
        this.clearBeamVisual();
        const graphics = this.scene?.add?.graphics?.().setDepth((this.depth ?? 20) + 5);
        if (!graphics) return;
        this.activeBeamAttackId += 1;
        this.activeBeamGraphics = graphics;
        let elapsed = 0;
        let damageTickElapsed = 0;
        this.activeBeamTimer = this.scene?.time?.addEvent?.({
            delay: 16,
            loop: true,
            callback: () => {
                if (!this.active || !this.activeBeamGraphics?.active) {
                    this.clearBeamVisual();
                    return;
                }
                elapsed += 16;
                damageTickElapsed += 16;
                const progress = Phaser.Math.Clamp(elapsed / BLACK_WIDOW_BEAM_DURATION_MS, 0, 1);
                const angle = Phaser.Math.Linear(startAngle, endAngle, progress);
                graphics.clear();
                graphics.lineStyle(BLACK_WIDOW_BEAM_WIDTH, 0xff5b7d, 0.3);
                graphics.beginPath();
                graphics.moveTo(this.x, this.y);
                graphics.lineTo(this.x + Math.cos(angle) * BLACK_WIDOW_BEAM_LENGTH, this.y + Math.sin(angle) * BLACK_WIDOW_BEAM_LENGTH);
                graphics.strokePath();
                graphics.lineStyle(BLACK_WIDOW_BEAM_WIDTH * 0.5, 0xff9db2, 0.42);
                graphics.beginPath();
                graphics.moveTo(this.x, this.y);
                graphics.lineTo(this.x + Math.cos(angle) * BLACK_WIDOW_BEAM_LENGTH, this.y + Math.sin(angle) * BLACK_WIDOW_BEAM_LENGTH);
                graphics.strokePath();
                graphics.lineStyle(6, 0xffeef3, 0.9);
                graphics.beginPath();
                graphics.moveTo(this.x, this.y);
                graphics.lineTo(this.x + Math.cos(angle) * BLACK_WIDOW_BEAM_LENGTH, this.y + Math.sin(angle) * BLACK_WIDOW_BEAM_LENGTH);
                graphics.strokePath();
                if (damageTickElapsed >= BLACK_WIDOW_BEAM_TICK_MS) {
                    damageTickElapsed = 0;
                    this.resolveBeamDamage(angle);
                }
                if (progress >= 1) {
                    this.clearBeamVisual();
                    this.startSkillCooldown();
                    this.isAttacking = false;
                    this.pendingWidowSkill = null;
                    this.forceReturnToMoveAnimation();
                }
            }
        }) ?? null;
    }

    startSkillCooldown() {
        const now = this.scene?.time?.now ?? 0;
        this.skillCooldownUntil = now + Math.max(0, this.attackCooldown ?? 0);
    }

    resolveBeamDamage(angle) {
        const players = this.scene?.getActivePlayers?.() ?? [];
        const damage = Math.max(1, Math.round((this.damage ?? 10) * BLACK_WIDOW_BEAM_DAMAGE_RATIO));
        const beamEndX = this.x + Math.cos(angle) * BLACK_WIDOW_BEAM_LENGTH;
        const beamEndY = this.y + Math.sin(angle) * BLACK_WIDOW_BEAM_LENGTH;
        const beamAttackId = this.activeBeamAttackId;
        players.forEach((player) => {
            if (!player?.active || player?.isDead) return;
            if (!this.isPointNearLine(player.x, player.y, this.x, this.y, beamEndX, beamEndY, BLACK_WIDOW_BEAM_WIDTH * 0.5)) return;
            if (player.__blackWidowBeamAttackId === beamAttackId) return;
            player.__blackWidowBeamAttackId = beamAttackId;
            player.takeDamage?.(damage, this, { fromEnemyAttack: true, fromBlackWidowBeam: true });
            const knockbackDirection = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
            if (knockbackDirection.lengthSq() > 0) {
                knockbackDirection.normalize();
                player.applyExternalKnockback?.(knockbackDirection, 300, 180, 0.9);
            }
        });
    }

    clearBeamVisual() {
        this.activeBeamTimer?.remove?.(false);
        this.activeBeamTimer = null;
        this.activeBeamGraphics?.destroy?.();
        this.activeBeamGraphics = null;
    }

    getAttackBounds() {
        const cameraView = this.scene?.cameras?.main?.worldView;
        const worldBounds = this.scene?.physics?.world?.bounds;
        const left = cameraView?.x ?? worldBounds?.x ?? (this.x - 320);
        const top = cameraView?.y ?? worldBounds?.y ?? (this.y - 180);
        const width = cameraView?.width ?? worldBounds?.width ?? 640;
        const height = cameraView?.height ?? worldBounds?.height ?? 360;
        return { left, top, right: left + width, bottom: top + height };
    }

    isPointNearLine(pointX, pointY, startX, startY, endX, endY, radius) {
        const lineDx = endX - startX;
        const lineDy = endY - startY;
        const lineLengthSq = (lineDx * lineDx) + (lineDy * lineDy);
        if (lineLengthSq <= 0) {
            return Phaser.Math.Distance.Between(pointX, pointY, startX, startY) <= radius;
        }
        const projection = Phaser.Math.Clamp(
            (((pointX - startX) * lineDx) + ((pointY - startY) * lineDy)) / lineLengthSq,
            0,
            1
        );
        const closestX = startX + (lineDx * projection);
        const closestY = startY + (lineDy * projection);
        return Phaser.Math.Distance.Between(pointX, pointY, closestX, closestY) <= radius;
    }

    playWidowAnimation(state) {
        const key = `${this.type}_${state}`;
        this.state = state;
        if (this.scene?.anims?.exists(key)) {
            this.anims.play(key, true);
            return;
        }
        this.setState(state);
    }

    playDeathAnimation() {
        this.playWidowAnimation('die');
    }
}
