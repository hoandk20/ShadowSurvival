import { getFinalBossRoundConfig } from '../../config/finalBosses.js';
import Enemy from '../Enemy.js';

const PLANT_BOSS_DEATH_ANIMATION_MS = 1000;
const PLANT_BOSS_DEATH_HOLD_MS = 3000;
const PLANT_BOSS_DEATH_SEQUENCE_MS = PLANT_BOSS_DEATH_ANIMATION_MS + PLANT_BOSS_DEATH_HOLD_MS;
const PLANT_BOSS_ATTACK_RANGE = 280;
const PLANT_BOSS_SUMMON_DISTANCE_MIN = 80;
const PLANT_BOSS_SUMMON_DISTANCE_MAX = 150;
const PLANT_BOSS_MELEE_SUMMON_COUNT = 10;
const PLANT_BOSS_RANGED_SUMMON_COUNT = 5;
const PLANT_BOSS_RETREAT_CHECK_MS = 5000;
const PLANT_BOSS_RETREAT_TRIGGER_DISTANCE = 130;
const PLANT_BOSS_RETREAT_DISTANCE = 150;
const PLANT_BOSS_RETREAT_ARRIVE_DISTANCE = 12;
const PLANT_BOSS_RETREAT_ANGLE_STEP = Math.PI / 8;
const PLANT_BOSS_RETREAT_ANGLE_ATTEMPTS = 16;
const PLANT_BOSS_MOVEMENT_COLLISION_SAMPLES = 3;
const PLANT_BOSS_BLOCK_EDGE_CHECK_DISTANCE = 44;
const PLANT_BOSS_BLOCK_EDGE_ESCAPE_DISTANCE = 120;
const PLANT_BOSS_VINE_PRIORITY_SUMMON_THRESHOLD = 5;
const PLANT_BOSS_VINE_PRIORITY_CHANCE = 0.8;
const PLANT_BOSS_VINE_DAMAGE_RATIO = 0.9;
const PLANT_BOSS_VINE_WARNING_TIME_MS = 850;
const PLANT_BOSS_VINE_STRIKE_FADE_MS = 220;
const PLANT_BOSS_VINE_WIDTH = 18;
const PLANT_BOSS_VINE_DISPLAY_HEIGHT = 38;
const PLANT_BOSS_ROUND1_VINE_PATTERN_COUNT = 3;
const PLANT_BOSS_VINE_PATTERN_COUNT_MIN = 4;
const PLANT_BOSS_VINE_PATTERN_COUNT_MAX = 6;
const PLANT_BOSS_VINE_PATTERN_OVERLAP_SPREAD = 0.22;
const PLANT_BOSS_VINE_STRIKE_STAGGER_MS = 140;
const PLANT_BOSS_VINE_DIAGONAL_SWEEP_MIN = 90;
const PLANT_BOSS_VINE_DIAGONAL_SWEEP_MAX = 220;
const PLANT_BOSS_VINE_VERTICAL_TILT_MAX = 120;
const PLANT_BOSS_VINE_WARNING_COLOR = 0xff8a8a;
const PLANT_BOSS_VINE_WARNING_ALPHA = 0.22;
const PLANT_BOSS_VINE_WARNING_STROKE_ALPHA = 0.42;
const PLANT_BOSS_VINE_WARNING_LINE_WIDTH = PLANT_BOSS_VINE_WIDTH * 2;
const PLANT_BOSS_VINE_CURVE_SWAY = 28;
const PLANT_BOSS_VINE_CAMERA_SHAKE_MS = 160;
const PLANT_BOSS_VINE_CAMERA_SHAKE_INTENSITY = 0.004;
const PLANT_BOSS_VINE_KNOCKBACK_SPEED = 260;
const PLANT_BOSS_VINE_KNOCKBACK_DURATION_MS = 260;
const PLANT_BOSS_VINE_KNOCKBACK_DRAG = 0.9;
const PLANT_BOSS_VINE_POISON_DURATION_MS = 3000;
const PLANT_BOSS_VINE_POISON_DAMAGE_PER_TICK = 6;

export default class PlantBoss extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'plant');
        this.attackStyle = 'plant_boss_cycle';
        this.behavior = 'chase';
        this.retreatTargetPoint = null;
        this.lastRetreatCheckTime = -Infinity;
        this.pendingPlantSkill = null;
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
        this.playDeathAnimation();
        this.deathSequenceTimer?.remove?.(false);
        this.deathSequenceTimer = this.scene?.time?.delayedCall(PLANT_BOSS_DEATH_SEQUENCE_MS, () => {
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
        if (this.beginFinalBossDeathSequence(source)) return;
        super.handleDeath(source);
    }

    updateMeleeBehavior(targetPlayer, time) {
        if (!targetPlayer?.active || targetPlayer?.isDead) {
            this.body?.setVelocity?.(0, 0);
            return;
        }
        const dx = targetPlayer.x - this.x;
        const dy = targetPlayer.y - this.y;
        const distanceSq = (dx * dx) + (dy * dy);
        const attackDistance = Math.max(this.attackRange ?? 0, PLANT_BOSS_ATTACK_RANGE);
        const effectiveSpeed = this.getStatusAdjustedSpeed?.(this.speed) ?? this.speed;
        const distance = Math.sqrt(distanceSq);

        if (this.isAttacking) {
            this.body?.setVelocity?.(0, 0);
            this.setFlipX(dx < 0);
            return;
        }

        if ((time - this.lastRetreatCheckTime) >= PLANT_BOSS_RETREAT_CHECK_MS) {
            this.lastRetreatCheckTime = time;
            if (this.startEscapeFromNearbyBlock()) {
                // Prioritize stepping away from blocked tiles before normal spacing logic.
            } else if (distance <= PLANT_BOSS_RETREAT_TRIGGER_DISTANCE) {
                this.startRetreatFromTarget(targetPlayer);
            }
        }

        if (this.updateRetreatMovement(effectiveSpeed)) {
            return;
        }

        if (distanceSq <= attackDistance * attackDistance) {
            this.body?.setVelocity?.(0, 0);
            this.setFlipX(dx < 0);
            this.tryAttackPlayer(targetPlayer, time);
            return;
        }

        const movement = this.resolvePlantMovementVelocity(dx, dy, effectiveSpeed);
        const vx = movement.x;
        const vy = movement.y;
        this.body?.setVelocity?.(vx, vy);
        this.setFlipX(vx < 0);
    }

    tryAttackPlayer(targetPlayer, time) {
        if (!targetPlayer?.active || targetPlayer?.isDead) return false;
        if (this.isAttacking) return false;
        if ((time - this.lastAttackTime) < this.attackCooldown) return false;

        const isRoundOne = this.finalBossRoundIndex <= 0;
        const totalActiveSummons = this.getTotalActivePlantSummonCount();
        const shouldPrioritizeVine = totalActiveSummons > PLANT_BOSS_VINE_PRIORITY_SUMMON_THRESHOLD
            && Math.random() < PLANT_BOSS_VINE_PRIORITY_CHANCE;
        const useSummonSkill = !shouldPrioritizeVine && Phaser.Math.Between(0, 1) === 0;
        if (useSummonSkill) {
            this.pendingPlantSkill = isRoundOne
                ? 'summon_melee'
                : (Phaser.Math.Between(0, 1) === 0 ? 'summon_melee' : 'summon_ranged');
        } else {
            this.pendingPlantSkill = 'attack';
        }

        this.lastAttackTime = time;
        this.isAttacking = true;
        this.body?.setVelocity?.(0, 0);
        this.setFlipX((targetPlayer.x - this.x) < 0);
        this.playPlantAnimation(useSummonSkill ? 'summon' : 'attack');
        this.pendingAttackTimer?.remove?.(false);
        this.pendingAttackTimer = this.scene?.time?.delayedCall(this.meleeAttackConfig.windupMs ?? 1200, () => {
            this.pendingAttackTimer = null;
            this.performPlantBossAction(targetPlayer);
        });
        return true;
    }

    performPlantBossAction(targetPlayer) {
        if (!this.active) return;
        if (this.pendingPlantSkill === 'summon_melee') {
            this.spawnPlantMinions(['plant_melee_minion'], PLANT_BOSS_MELEE_SUMMON_COUNT, 'melee');
        } else if (this.pendingPlantSkill === 'summon_ranged') {
            this.spawnPlantMinions(['plant_ranged_minion'], PLANT_BOSS_RANGED_SUMMON_COUNT, 'ranged');
        } else {
            this.performVineAttack(targetPlayer);
        }

        const recoveryMs = Math.max(0, this.meleeAttackConfig.recoveryMs ?? 0);
        this.scene?.time?.delayedCall(recoveryMs, () => {
            if (!this.active) return;
            this.isAttacking = false;
            this.pendingPlantSkill = null;
            this.forceReturnToMoveAnimation();
        });
    }

    spawnPlantMinions(enemyTypes = [], maxCount = 0, summonType = 'generic') {
        const spawnTypes = enemyTypes.filter(Boolean);
        if (!spawnTypes.length || maxCount <= 0) return;
        const activeSummonCount = this.getActivePlantSummonCount(summonType);
        const spawnCount = Math.max(0, maxCount - activeSummonCount);
        if (spawnCount <= 0) return;
        for (let index = 0; index < spawnCount; index += 1) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(PLANT_BOSS_SUMMON_DISTANCE_MIN, PLANT_BOSS_SUMMON_DISTANCE_MAX);
            const enemyType = spawnTypes[index % spawnTypes.length];
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;
            const summonedEnemy = this.scene?.spawnEnemyAtPosition?.(x, y, enemyType, {
                countsTowardWave: false,
                ignoreSpawnCap: true,
                chestSpawned: true,
                chestSpawnHighlightTint: 0x8ed36a
            });
            if (summonedEnemy) {
                summonedEnemy.plantBossOwner = this;
                summonedEnemy.plantBossSummonType = summonType;
            }
        }
    }

    getActivePlantSummonCount(summonType = 'generic') {
        const enemies = this.scene?.enemies?.getChildren?.() ?? [];
        return enemies.filter((enemy) => {
            return enemy?.active
                && !enemy?.isDead
                && enemy?.plantBossOwner === this
                && enemy?.plantBossSummonType === summonType;
        }).length;
    }

    getTotalActivePlantSummonCount() {
        return this.getActivePlantSummonCount('melee') + this.getActivePlantSummonCount('ranged');
    }

    performVineAttack(targetPlayer) {
        if (!this.scene?.add || !this.scene?.tweens) return;
        const vinePatterns = this.buildVineAttackPatterns();
        if (!vinePatterns.length) return;
        vinePatterns.forEach((pattern, index) => {
            const warning = this.spawnVineWarning(pattern);
            const delayMs = PLANT_BOSS_VINE_WARNING_TIME_MS + (index * PLANT_BOSS_VINE_STRIKE_STAGGER_MS);
            this.scene?.time?.delayedCall(delayMs, () => {
                warning?.destroy?.();
                if (!this.active) return;
                if (index === 0) {
                    this.scene?.cameras?.main?.shake?.(
                        PLANT_BOSS_VINE_CAMERA_SHAKE_MS,
                        PLANT_BOSS_VINE_CAMERA_SHAKE_INTENSITY
                    );
                }
                this.spawnVineStrike(pattern);
                this.resolveVineDamage(pattern.startX, pattern.startY, pattern.endX, pattern.endY);
            });
        });
    }

    buildVineAttackPatterns() {
        const bounds = this.getPlantAttackBounds();
        if (!bounds) return [];
        const isRoundOne = this.finalBossRoundIndex <= 0;
        const patternCount = isRoundOne
            ? PLANT_BOSS_ROUND1_VINE_PATTERN_COUNT
            : Phaser.Math.Between(PLANT_BOSS_VINE_PATTERN_COUNT_MIN, PLANT_BOSS_VINE_PATTERN_COUNT_MAX);
        const patterns = [];
        const centerY = (bounds.top + bounds.bottom) * 0.5;
        const centerX = (bounds.left + bounds.right) * 0.5;
        const verticalSpread = (bounds.bottom - bounds.top) * PLANT_BOSS_VINE_PATTERN_OVERLAP_SPREAD;
        const horizontalSpread = (bounds.right - bounds.left) * PLANT_BOSS_VINE_PATTERN_OVERLAP_SPREAD;
        for (let index = 0; index < patternCount; index += 1) {
            const useDiagonal = Phaser.Math.Between(0, 1) === 0;
            if (useDiagonal) {
                const yOffset = Phaser.Math.Clamp(
                    centerY + Phaser.Math.FloatBetween(-verticalSpread, verticalSpread),
                    bounds.top,
                    bounds.bottom
                );
                const sweep = Phaser.Math.Between(PLANT_BOSS_VINE_DIAGONAL_SWEEP_MIN, PLANT_BOSS_VINE_DIAGONAL_SWEEP_MAX);
                patterns.push({
                    startX: bounds.right,
                    startY: Phaser.Math.Clamp(yOffset - sweep, bounds.top, bounds.bottom),
                    endX: bounds.left,
                    endY: Phaser.Math.Clamp(yOffset + sweep, bounds.top, bounds.bottom)
                });
            } else {
                const xOffset = Phaser.Math.Clamp(
                    centerX + Phaser.Math.FloatBetween(-horizontalSpread, horizontalSpread),
                    bounds.left,
                    bounds.right
                );
                const tilt = Phaser.Math.Between(-PLANT_BOSS_VINE_VERTICAL_TILT_MAX, PLANT_BOSS_VINE_VERTICAL_TILT_MAX);
                patterns.push({
                    startX: Phaser.Math.Clamp(xOffset + tilt, bounds.left, bounds.right),
                    startY: bounds.top,
                    endX: Phaser.Math.Clamp(xOffset - tilt, bounds.left, bounds.right),
                    endY: bounds.bottom
                });
            }
        }
        return Phaser.Utils.Array.Shuffle(patterns);
    }

    getPlantAttackBounds() {
        const cameraView = this.scene?.cameras?.main?.worldView;
        const worldBounds = this.scene?.physics?.world?.bounds;
        const left = cameraView?.x ?? worldBounds?.x ?? (this.x - 320);
        const top = cameraView?.y ?? worldBounds?.y ?? (this.y - 180);
        const width = cameraView?.width ?? worldBounds?.width ?? 640;
        const height = cameraView?.height ?? worldBounds?.height ?? 360;
        return {
            left,
            top,
            right: left + width,
            bottom: top + height
        };
    }

    spawnVineWarning(pattern) {
        if (!this.scene?.add?.graphics) return null;
        const warning = this.scene.add.graphics().setDepth((this.depth ?? 20) + 4);
        warning.lineStyle(PLANT_BOSS_VINE_WARNING_LINE_WIDTH, PLANT_BOSS_VINE_WARNING_COLOR, PLANT_BOSS_VINE_WARNING_ALPHA);
        warning.beginPath();
        warning.moveTo(pattern.startX, pattern.startY);
        warning.lineTo(pattern.endX, pattern.endY);
        warning.strokePath();
        this.scene?.tweens?.add({
            targets: warning,
            alpha: { from: 0.35, to: 0.85 },
            duration: PLANT_BOSS_VINE_WARNING_TIME_MS,
            yoyo: true,
            repeat: -1
        });
        return warning;
    }

    spawnVineStrike(pattern) {
        const totalLength = Phaser.Math.Distance.Between(pattern.startX, pattern.startY, pattern.endX, pattern.endY);
        const vineContainer = this.scene.add.container(pattern.startX, pattern.startY)
            .setDepth((this.depth ?? 20) + 5)
            .setAlpha(0.98);
        const segmentCount = Math.max(2, Math.ceil(totalLength / 36));
        const vineSegments = Array.from({ length: segmentCount }, () => {
            const segment = this.scene.add.image(0, 0, 'plant_vine')
                .setOrigin(0, 0.5)
                .setVisible(false);
            vineContainer.add(segment);
            return segment;
        });
        const points = this.buildVineCurvePoints(pattern.startX, pattern.startY, pattern.endX, pattern.endY, totalLength, segmentCount);
        for (let index = 0; index < vineSegments.length; index += 1) {
            const segment = vineSegments[index];
            const point = points[index];
            const nextPoint = points[index + 1];
            if (!point || !nextPoint) {
                segment.setVisible(false);
                continue;
            }
            const dx = nextPoint.x - point.x;
            const dy = nextPoint.y - point.y;
            const segmentLength = Math.max(1, Math.sqrt((dx * dx) + (dy * dy)));
            segment
                .setVisible(true)
                .setPosition(point.x - pattern.startX, point.y - pattern.startY)
                .setRotation(Math.atan2(dy, dx))
                .setDisplaySize(segmentLength, PLANT_BOSS_VINE_DISPLAY_HEIGHT);
        }
        this.scene?.tweens?.add({
            targets: vineContainer,
            alpha: 0,
            duration: PLANT_BOSS_VINE_STRIKE_FADE_MS,
            onComplete: () => vineContainer.destroy()
        });
    }

    buildVineCurvePoints(startX, startY, endX, endY, currentLength, segmentCount) {
        const direction = new Phaser.Math.Vector2(endX - startX, endY - startY);
        if (direction.lengthSq() === 0) {
            return [new Phaser.Math.Vector2(startX, startY), new Phaser.Math.Vector2(endX, endY)];
        }
        direction.normalize();
        const clampedEndX = startX + (direction.x * currentLength);
        const clampedEndY = startY + (direction.y * currentLength);
        const perpendicular = new Phaser.Math.Vector2(-direction.y, direction.x);
        const swayStrength = Math.min(PLANT_BOSS_VINE_CURVE_SWAY, currentLength * 0.18);
        const swayDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
        const controlX = startX + ((clampedEndX - startX) * 0.5) + (perpendicular.x * swayStrength * swayDirection);
        const controlY = startY + ((clampedEndY - startY) * 0.5) + (perpendicular.y * swayStrength * swayDirection);
        const curve = new Phaser.Curves.QuadraticBezier(
            new Phaser.Math.Vector2(startX, startY),
            new Phaser.Math.Vector2(controlX, controlY),
            new Phaser.Math.Vector2(clampedEndX, clampedEndY)
        );
        return curve.getPoints(segmentCount);
    }

    resolveVineDamage(startX, startY, endX, endY) {
        const players = this.scene?.getActivePlayers?.() ?? [];
        const damage = Math.max(1, Math.round((this.damage ?? 10) * PLANT_BOSS_VINE_DAMAGE_RATIO));
        players.forEach((player) => {
            if (!player?.active || player?.isDead) return;
            if (!this.isPointNearLine(player.x, player.y, startX, startY, endX, endY, PLANT_BOSS_VINE_WIDTH)) return;
            player.takeDamage?.(damage, this, {
                fromEnemyAttack: true,
                fromPlantVine: true
            });
            player.applyStatusEffect?.('poison', {
                source: this,
                durationMs: PLANT_BOSS_VINE_POISON_DURATION_MS,
                damagePerTick: PLANT_BOSS_VINE_POISON_DAMAGE_PER_TICK,
                tags: ['poison', 'plant_vine']
            });
            const knockbackDirection = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
            if (knockbackDirection.lengthSq() === 0) {
                knockbackDirection.set(player.x >= this.x ? 1 : -1, 0);
            } else {
                knockbackDirection.normalize();
            }
            player.applyExternalKnockback?.(
                knockbackDirection,
                PLANT_BOSS_VINE_KNOCKBACK_SPEED,
                PLANT_BOSS_VINE_KNOCKBACK_DURATION_MS,
                PLANT_BOSS_VINE_KNOCKBACK_DRAG
            );
        });
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

    startRetreatFromTarget(targetPlayer) {
        const retreatDirection = new Phaser.Math.Vector2(this.x - targetPlayer.x, this.y - targetPlayer.y);
        if (retreatDirection.lengthSq() === 0) {
            retreatDirection.set(this.flipX ? -1 : 1, 0);
        } else {
            retreatDirection.normalize();
        }
        const targetPoint = this.findValidRetreatPoint(retreatDirection);
        this.retreatTargetPoint = targetPoint;
    }

    startEscapeFromNearbyBlock() {
        const escapeDirection = this.getNearbyBlockEscapeDirection();
        if (!escapeDirection) return false;
        const targetPoint = this.findValidRetreatPoint(escapeDirection, PLANT_BOSS_BLOCK_EDGE_ESCAPE_DISTANCE);
        if (!targetPoint) return false;
        this.retreatTargetPoint = targetPoint;
        return true;
    }

    getNearbyBlockEscapeDirection() {
        const sampleDistance = Math.max(
            PLANT_BOSS_BLOCK_EDGE_CHECK_DISTANCE,
            this.body?.halfWidth ?? 0,
            this.body?.halfHeight ?? 0,
            20
        );
        const samples = [
            new Phaser.Math.Vector2(1, 0),
            new Phaser.Math.Vector2(-1, 0),
            new Phaser.Math.Vector2(0, 1),
            new Phaser.Math.Vector2(0, -1),
            new Phaser.Math.Vector2(1, 1).normalize(),
            new Phaser.Math.Vector2(-1, 1).normalize(),
            new Phaser.Math.Vector2(1, -1).normalize(),
            new Phaser.Math.Vector2(-1, -1).normalize()
        ];
        const escapeDirection = new Phaser.Math.Vector2(0, 0);
        let foundBlockedSide = false;

        samples.forEach((sample) => {
            const sampleX = this.x + (sample.x * sampleDistance);
            const sampleY = this.y + (sample.y * sampleDistance);
            if (!this.isPlantPointBlocked(sampleX, sampleY)) return;
            foundBlockedSide = true;
            escapeDirection.subtract(sample);
        });

        if (!foundBlockedSide || escapeDirection.lengthSq() === 0) {
            return null;
        }
        return escapeDirection.normalize();
    }

    updateRetreatMovement(effectiveSpeed) {
        if (!this.retreatTargetPoint) return false;
        const dx = this.retreatTargetPoint.x - this.x;
        const dy = this.retreatTargetPoint.y - this.y;
        const distanceSq = (dx * dx) + (dy * dy);
        if (distanceSq <= (PLANT_BOSS_RETREAT_ARRIVE_DISTANCE * PLANT_BOSS_RETREAT_ARRIVE_DISTANCE)) {
            this.retreatTargetPoint = null;
            this.body?.setVelocity?.(0, 0);
            return false;
        }
        const movement = this.resolvePlantMovementVelocity(dx, dy, effectiveSpeed);
        const vx = movement.x;
        const vy = movement.y;
        if (vx === 0 && vy === 0) {
            this.retreatTargetPoint = null;
            this.body?.setVelocity?.(0, 0);
            return false;
        }
        this.body?.setVelocity?.(vx, vy);
        this.setFlipX(vx < 0);
        return true;
    }

    findValidRetreatPoint(baseDirection, retreatDistance = PLANT_BOSS_RETREAT_DISTANCE) {
        const normalizedDirection = new Phaser.Math.Vector2(baseDirection.x, baseDirection.y);
        if (normalizedDirection.lengthSq() === 0) {
            normalizedDirection.set(this.flipX ? -1 : 1, 0);
        } else {
            normalizedDirection.normalize();
        }

        for (let attempt = 0; attempt <= PLANT_BOSS_RETREAT_ANGLE_ATTEMPTS; attempt += 1) {
            const offsets = attempt === 0 ? [0] : [attempt * PLANT_BOSS_RETREAT_ANGLE_STEP, -attempt * PLANT_BOSS_RETREAT_ANGLE_STEP];
            for (const angleOffset of offsets) {
                const direction = normalizedDirection.clone().rotate(angleOffset);
                const candidateX = this.x + (direction.x * retreatDistance);
                const candidateY = this.y + (direction.y * retreatDistance);
                if (!this.isPlantPointBlocked(candidateX, candidateY)) {
                    return new Phaser.Math.Vector2(candidateX, candidateY);
                }
            }
        }

        return null;
    }

    resolvePlantMovementVelocity(dx, dy, speed) {
        const direction = new Phaser.Math.Vector2(dx, dy);
        if (direction.lengthSq() === 0 || speed <= 0) {
            return new Phaser.Math.Vector2(0, 0);
        }
        direction.normalize();
        if (!this.isPlantMovementBlocked(direction, speed)) {
            return direction.scale(speed);
        }

        for (let attempt = 1; attempt <= PLANT_BOSS_RETREAT_ANGLE_ATTEMPTS; attempt += 1) {
            const positiveDirection = direction.clone().rotate(attempt * PLANT_BOSS_RETREAT_ANGLE_STEP);
            if (!this.isPlantMovementBlocked(positiveDirection, speed)) {
                return positiveDirection.scale(speed);
            }
            const negativeDirection = direction.clone().rotate(-attempt * PLANT_BOSS_RETREAT_ANGLE_STEP);
            if (!this.isPlantMovementBlocked(negativeDirection, speed)) {
                return negativeDirection.scale(speed);
            }
        }

        return new Phaser.Math.Vector2(0, 0);
    }

    isPlantMovementBlocked(direction, speed) {
        const distance = Math.max(
            speed * 0.2,
            this.body?.halfWidth ?? 0,
            this.body?.halfHeight ?? 0,
            20
        );
        for (let sample = 1; sample <= PLANT_BOSS_MOVEMENT_COLLISION_SAMPLES; sample += 1) {
            const ratio = sample / PLANT_BOSS_MOVEMENT_COLLISION_SAMPLES;
            const sampleX = this.x + (direction.x * distance * ratio);
            const sampleY = this.y + (direction.y * distance * ratio);
            if (this.isPlantPointBlocked(sampleX, sampleY)) {
                return true;
            }
        }
        return false;
    }

    isPlantPointBlocked(worldX, worldY) {
        return this.scene?.mapManager?.isCollidableAtWorldXY?.(worldX, worldY) === true;
    }

    playPlantAnimation(state) {
        const key = `${this.type}_${state}`;
        this.state = state;
        if (this.scene?.anims?.exists(key)) {
            this.anims.play(key, true);
            return;
        }
        this.setState(state);
    }

    playDeathAnimation() {
        this.playPlantAnimation('die');
    }
}
