import { SKILL_CONFIG } from '../config/skill.js';
import HolyAuraEffect from './effects/HolyAuraEffect.js';
import CodeProjectileEffect from './effects/CodeProjectileEffect.js';
import IceParticleEffect from './effects/IceParticleEffect.js';
import { EFFECT_CONFIG } from '../config/effects.js';

const EFFECT_CLASS_MAP = {
    auraGlow: HolyAuraEffect,
    codeProjectile: CodeProjectileEffect,
    iceTrail: IceParticleEffect,
};
const TARGET_VIEW_MARGIN = 100;

export default class Skill extends Phaser.GameObjects.Sprite {
    constructor(scene, owner, skillType) {
        const config = SKILL_CONFIG[skillType] ?? {};
        const animNames = config.animations ? Object.keys(config.animations) : [];
        const primaryAnimName = animNames.length ? animNames[0] : 'cast';
        const primaryAnim = config.animations ? config.animations[primaryAnimName] : null;
        const baseTexture = config.atlas
            ? config.atlas.key
            : primaryAnim && primaryAnim.frames && primaryAnim.frames.length
                ? `${skillType}_${primaryAnimName}_0`
            : '__WHITE';
        const baseFrame = config.atlas && primaryAnim?.frames?.length
            ? primaryAnim.frames[0]
            : undefined;

        super(scene, 0, 0, baseTexture, baseFrame);
        this.owner = owner;
        this.skillType = skillType;
        this.config = config;
        this.primaryAnimName = primaryAnimName;
        const areaMultiplier = owner.getSkillAreaMultiplier?.(skillType) ?? 1;
        this.hitboxWidth = Math.max(1, Math.round((config.hitboxWidth ?? 150) * areaMultiplier));
        this.hitboxHeight = Math.max(1, Math.round((config.hitboxHeight ?? 60) * areaMultiplier));
        this.duration = owner.getSkillDuration?.(skillType) ?? config.duration ?? 500;
        const ownerDamageMul = owner.damageMultiplier ?? 1;
        const skillDamageMul = owner.getSkillDamageMultiplier?.(skillType) ?? 1;
        const skillDamageFlat = owner.getSkillDamageFlatBonus?.(skillType) ?? 0;
        this.baseDamage = Math.max(0, (config.damage ?? 10) + skillDamageFlat) * ownerDamageMul * skillDamageMul;
        this.damage = this.baseDamage;
        this.tintColor = config.tint ?? null;
        this.category = config.category ?? 'area';
        this.isAura = this.category === 'aura';
        this.projectileSpeed = Math.max(0, (config.projectileSpeed ?? 0) * (owner.getSkillProjectileSpeedMultiplier?.(skillType) ?? 1));
        this.travelRange = config.travelRange ?? 0;
        this.homing = config.homing ?? false;
        this.destroyOnHit = config.destroyOnHit ?? false;
        this.bounceOnHit = config.bounceOnHit ?? false;
        this.retargetOnHit = config.retargetOnHit ?? false;
        this.maxChainTargets = config.maxChainTargets ?? 0;
        this.alignWithMovement = config.alignWithMovement ?? false;
        this.orbitRadius = (config.orbitRadius ?? 0) * areaMultiplier;
        this.orbitSpeed = config.orbitSpeed ?? 0;
        this.orbitDirection = config.orbitDirection ?? 1;
        this.orbitAngle = 0;
        this.spinOnFlight = config.spinOnFlight ?? false;
        this.spinSpeed = config.spinSpeed ?? 0;
        this.baseRotation = 0;
        this.effectKey = config.effectKey ?? null;
        this.effectInstance = null;
        this.knockbackCount = 0;
        this.direction = new Phaser.Math.Vector2(0, 0);
        this.startX = 0;
        this.startY = 0;
        this.prevX = 0;
        this.prevY = 0;
        this.hitTargets = new Set();
        this.dropFromSky = config.dropFromSky ?? false;
        this.dropTarget = null;
        this.dropTrackingSpeed = config.dropTrackingSpeed ?? 220;
        this.dropXOffset = 0;
        this.playAnimation = config.playAnimation ?? true;
        this.visibleDuringEffect = config.visibleDuringEffect ?? true;
        this.critChance = Phaser.Math.Clamp((config.critChance ?? 0) + (owner.getSkillCritChanceBonus?.(skillType) ?? 0), 0, 1);
        this.critMultiplier = config.critMultiplier ?? 1.5;
        this.critColor = config.critColor ?? '#ffde59';
        const baseStunDuration = (config.stunDuration ?? 0) * (owner.getSkillStunDurationMultiplier?.(skillType) ?? 1);
        const bonusEffectDuration = owner.getSkillEffectDurationBonus?.(skillType) ?? 0;
        this.stunDuration = Math.max(0, Math.round(baseStunDuration + bonusEffectDuration));
        const baseKnockbackCount = config.numberKnockback ?? Infinity;
        const bonusKnockbackCount = owner.getSkillKnockbackCountBonus?.(skillType) ?? 0;
        this.numberKnockback = Number.isFinite(baseKnockbackCount)
            ? Math.max(0, Math.round(baseKnockbackCount + bonusKnockbackCount))
            : Infinity;
        this.lastRoll = { value: this.baseDamage, isCritical: false };
        scene.add.existing(this);
        this.setActive(false);
        this.setVisible(false);
        this.setDepth(30);
        this.setDisplaySize(this.hitboxWidth, this.hitboxHeight);
    }

    rollCriticalDamage() {
        const isCritical = Math.random() < this.critChance;
        const multiplier = isCritical ? this.critMultiplier : 1;
        const value = Math.max(1, Math.round(this.baseDamage * multiplier));
        this.lastRoll = { value, isCritical };
        return this.lastRoll;
    }

    cast() {
        this.knockbackCount = 0;
        let x = this.owner.x;
        let y = this.owner.y;
        if (this.category === 'area' && !this.isAura) {
            if (typeof this.customAngle === 'number') {
                const radius = 32;
                x = this.owner.x + Math.cos(this.customAngle) * radius;
                y = this.owner.y + Math.sin(this.customAngle) * radius;
            } else {
                const ownerBounds = this.owner.getBounds ? this.owner.getBounds() : null;
                const direction = this.owner.flipX ? -1 : 1;
                const castGap = this.config?.castGap ?? 16;
                const frontEdge = ownerBounds
                    ? (this.owner.flipX ? ownerBounds.left : ownerBounds.right)
                    : this.owner.x;
                x = frontEdge + direction * castGap;
                y = this.owner.y;
            }
        }
        if (this.isAura) {
            x = this.owner.x;
            y = this.owner.y;
        }

        this.hitTargets.clear();
        this.remainingChainTargets = this.maxChainTargets;
        if (this.category === 'area' && !this.isAura) {
            const horizontalOrigin = this.owner.flipX ? 1 : 0;
            this.setOrigin(horizontalOrigin, 0.5);
        } else {
            this.setOrigin(0.5, 0.5);
        }
        this.setPosition(x, y);
        this.setDepth(30);
        this.setFlipX(this.owner.flipX);
        this.baseRotation = this.rotation ?? 0;
        const animKey = `${this.skillType}_${this.primaryAnimName}`;
        if (this.playAnimation && this.scene.anims.exists(animKey)) {
            this.anims.play(animKey);
        }
        if (this.tintColor !== null) {
            this.setTint(this.tintColor);
        }
        this.setActive(true);
        this.setVisible(this.visibleDuringEffect);

        const effectDefinition = this.effectKey ? EFFECT_CONFIG[this.effectKey] : null;
        if (this.effectKey && EFFECT_CLASS_MAP[this.effectKey]) {
            this.effectInstance?.destroy();
            const EffectClass = EFFECT_CLASS_MAP[this.effectKey];
            const settings = effectDefinition?.settings ?? {};
            this.effectInstance = new EffectClass(this.scene, this, settings);
        }
        if (this.category === 'projectile') {
            this.startX = this.owner.x;
            this.startY = this.owner.y;
            this.prevX = this.x;
            this.prevY = this.y;
            if (this.alignWithMovement) {
                const velX = this.owner.body?.velocity?.x ?? 0;
                const velY = this.owner.body?.velocity?.y ?? 0;
                const movementVec = new Phaser.Math.Vector2(velX, velY);
                if (movementVec.lengthSq() === 0) {
                    movementVec.set(this.owner.flipX ? -1 : 1, 0);
                } else {
                    movementVec.normalize();
                }
                this.direction.copy(movementVec);
            } else {
                const directionX = this.owner.flipX ? -1 : 1;
                this.direction.set(directionX, 0).normalize();
            }
        } else if (this.category === 'area' && !this.isAura) {
            this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                this.destroy();
            });
        }

        if (this.category === 'orbit') {
            if (typeof this.customAngle === 'number') {
                this.orbitAngle = this.customAngle;
            } else {
                this.orbitAngle = Math.random() * Math.PI * 2;
            }
            this.startX = this.owner.x + Math.cos(this.orbitAngle) * this.orbitRadius;
            this.startY = this.owner.y + Math.sin(this.orbitAngle) * this.orbitRadius;
            this.setPosition(this.startX, this.startY);
        }

        this.scene.time.delayedCall(this.duration, () => {
            if (this.active) {
                this.destroy();
            }
        });
    }

    update(time, delta) {
        if (this.effectInstance?.update) {
            this.effectInstance.update(time, delta);
        }
        if (this.active) {
            this.setDisplaySize(this.hitboxWidth, this.hitboxHeight);
        }
        if (this.active && this.isAura && this.owner) {
            this.setPosition(this.owner.x, this.owner.y);
        }
        if (this.active && this.category === 'projectile') {
            this.prevX = this.x;
            this.prevY = this.y;
            if (this.homing) {
                const target = this.getNearestEnemyTarget();
                if (target) {
                    this.direction.set(target.x - this.x, target.y - this.y).normalize();
                }
            }
            if (this.direction.lengthSq() === 0) {
                const directionX = this.owner.flipX ? -1 : 1;
                this.direction.set(directionX, 0).normalize();
            }
            if (this.dropFromSky && this.dropTarget) {
                this.applySkyTracking(delta);
            }
            const moveDist = (this.projectileSpeed * delta) / 1000;
            let nextX = this.x + this.direction.x * moveDist;
            let nextY = this.y + this.direction.y * moveDist;
            if (this.bounceOnHit) {
                const bounceResult = this.resolveBlockBounce(nextX, nextY);
                nextX = bounceResult.x;
                nextY = bounceResult.y;
                const viewportBounceResult = this.resolveViewportBounce(nextX, nextY);
                nextX = viewportBounceResult.x;
                nextY = viewportBounceResult.y;
            }
            this.x = nextX;
            this.y = nextY;
            if (this.spinOnFlight && this.spinSpeed !== 0) {
                this.rotation += (this.spinSpeed * delta) / 1000;
            }
            if (this.travelRange > 0) {
                const traveled = Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y);
                if (traveled >= this.travelRange) {
                    this.destroy();
                }
            }
        } else if (this.active && this.category === 'orbit') {
            this.orbitAngle += ((this.orbitSpeed * this.orbitDirection) * delta) / 1000;
            const targetX = this.owner.x + Math.cos(this.orbitAngle) * this.orbitRadius;
            const targetY = this.owner.y + Math.sin(this.orbitAngle) * this.orbitRadius;
            this.x = targetX;
            this.y = targetY;
        }
    }

    resolveBlockBounce(nextX, nextY) {
        const mapManager = this.scene?.mapManager;
        if (!mapManager?.isCollidableAtWorldXY) {
            return { x: nextX, y: nextY };
        }

        const sampleRadius = Math.max(this.displayWidth ?? this.hitboxWidth ?? 0, this.displayHeight ?? this.hitboxHeight ?? 0) * 0.35;
        const hitsAt = (x, y) => {
            const samplePoints = [
                [x, y],
                [x - sampleRadius, y],
                [x + sampleRadius, y],
                [x, y - sampleRadius],
                [x, y + sampleRadius]
            ];
            return samplePoints.some(([sampleX, sampleY]) => mapManager.isCollidableAtWorldXY(sampleX, sampleY));
        };

        const hitX = hitsAt(nextX, this.y);
        const hitY = hitsAt(this.x, nextY);
        const hitDiagonal = hitsAt(nextX, nextY);

        if (!hitX && !hitY && !hitDiagonal) {
            return { x: nextX, y: nextY };
        }

        let normal = null;
        if (hitX && !hitY) {
            normal = new Phaser.Math.Vector2(nextX > this.x ? -1 : 1, 0);
        } else if (hitY && !hitX) {
            normal = new Phaser.Math.Vector2(0, nextY > this.y ? -1 : 1);
        } else {
            const deltaX = nextX - this.x;
            const deltaY = nextY - this.y;
            if (Math.abs(deltaX) >= Math.abs(deltaY)) {
                normal = new Phaser.Math.Vector2(deltaX >= 0 ? -1 : 1, 0);
            } else {
                normal = new Phaser.Math.Vector2(0, deltaY >= 0 ? -1 : 1);
            }
        }

        const fallbackX = hitX || hitDiagonal ? this.x : nextX;
        const fallbackY = hitY || hitDiagonal ? this.y : nextY;
        this.applyBounceNormal(normal, fallbackX, fallbackY, Math.max(2, sampleRadius * 0.25));
        return { x: this.x, y: this.y };
    }

    resolveViewportBounce(nextX, nextY) {
        const view = this.scene?.cameras?.main?.worldView;
        if (!view) {
            return { x: nextX, y: nextY };
        }

        const halfWidth = (this.displayWidth ?? this.hitboxWidth ?? 0) * 0.5;
        const halfHeight = (this.displayHeight ?? this.hitboxHeight ?? 0) * 0.5;
        const minX = view.left + halfWidth;
        const maxX = view.right - halfWidth;
        const minY = view.top + halfHeight;
        const maxY = view.bottom - halfHeight;

        let bounced = false;
        let normal = new Phaser.Math.Vector2(0, 0);

        if (nextX <= minX || nextX >= maxX) {
            nextX = Phaser.Math.Clamp(nextX, minX, maxX);
            normal.x = nextX <= minX ? 1 : -1;
            bounced = true;
        }

        if (nextY <= minY || nextY >= maxY) {
            nextY = Phaser.Math.Clamp(nextY, minY, maxY);
            normal.y = nextY <= minY ? 1 : -1;
            bounced = true;
        }

        if (bounced) {
            this.applyBounceNormal(normal, nextX, nextY, 2);
            return { x: this.x, y: this.y };
        }

        return { x: nextX, y: nextY };
    }

    getNearestEnemyTarget(excludedTargets = this.hitTargets) {
        if (!this.scene || !this.scene.enemies) return null;
        const enemies = this.scene.enemies.getChildren();
        const view = this.scene?.cameras?.main?.worldView;
        const candidates = [];
        for (const enemy of enemies) {
            if (!enemy || !enemy.active) continue;
            if (excludedTargets?.has?.(enemy)) continue;
            if (view) {
                const withinView = enemy.x >= view.left - TARGET_VIEW_MARGIN
                    && enemy.x <= view.right + TARGET_VIEW_MARGIN
                    && enemy.y >= view.top - TARGET_VIEW_MARGIN
                    && enemy.y <= view.bottom + TARGET_VIEW_MARGIN;
                if (!withinView) continue;
            }
            candidates.push(enemy);
        }
        if (!candidates.length) return null;

        const preferredCandidates = candidates.filter(enemy => !enemy.isHacked);
        const targetPool = preferredCandidates.length ? preferredCandidates : candidates;
        let nearest = null;
        let minDist = Number.POSITIVE_INFINITY;
        for (const enemy of targetPool) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    retargetToNextEnemy() {
        if (!this.active || !this.retargetOnHit || this.remainingChainTargets <= 0) {
            return false;
        }
        const nextTarget = this.getNearestEnemyTarget(this.hitTargets);
        if (!nextTarget) return false;
        this.remainingChainTargets -= 1;
        this.direction.set(nextTarget.x - this.x, nextTarget.y - this.y).normalize();
        this.setRotation(Math.atan2(this.direction.y, this.direction.x));
        return true;
    }

    bounceFromEnemy(enemy) {
        if (!this.active || !this.bounceOnHit || !enemy) return false;
        const bounds = enemy.getBounds?.();
        let normal = null;

        if (bounds) {
            const nearestX = Phaser.Math.Clamp(this.x, bounds.left, bounds.right);
            const nearestY = Phaser.Math.Clamp(this.y, bounds.top, bounds.bottom);
            normal = new Phaser.Math.Vector2(this.x - nearestX, this.y - nearestY);

            if (normal.lengthSq() === 0) {
                const distances = [
                    { value: Math.abs(this.x - bounds.left), normal: new Phaser.Math.Vector2(-1, 0) },
                    { value: Math.abs(bounds.right - this.x), normal: new Phaser.Math.Vector2(1, 0) },
                    { value: Math.abs(this.y - bounds.top), normal: new Phaser.Math.Vector2(0, -1) },
                    { value: Math.abs(bounds.bottom - this.y), normal: new Phaser.Math.Vector2(0, 1) }
                ];
                distances.sort((a, b) => a.value - b.value);
                normal = distances[0].normal;
            }
        }

        if (!normal || normal.lengthSq() === 0) {
            normal = new Phaser.Math.Vector2(this.x - enemy.x, this.y - enemy.y);
        }
        if (normal.lengthSq() === 0) {
            normal.copy(this.direction).negate();
        }
        if (normal.lengthSq() === 0) {
            normal.set(1, 0);
        }

        this.applyBounceNormal(normal, this.x, this.y, Math.max(4, (this.displayWidth ?? this.hitboxWidth ?? 12) * 0.5));
        return true;
    }

    applyBounceNormal(normal, anchorX, anchorY, separation = 2) {
        if (!normal) return false;
        const resolvedNormal = normal.clone();
        if (resolvedNormal.lengthSq() === 0) return false;
        resolvedNormal.normalize();

        const incoming = this.direction.clone();
        if (incoming.lengthSq() === 0) {
            incoming.set(this.owner.flipX ? -1 : 1, 0);
        }
        incoming.normalize();

        let reflected = incoming.subtract(resolvedNormal.clone().scale(2 * incoming.dot(resolvedNormal)));
        if (reflected.lengthSq() === 0) {
            reflected = resolvedNormal.clone();
        }

        this.direction.copy(reflected.normalize());
        this.x = anchorX + resolvedNormal.x * separation;
        this.y = anchorY + resolvedNormal.y * separation;
        this.setRotation(Math.atan2(this.direction.y, this.direction.x));
        return true;
    }

    applySkyTracking(delta) {
        if (!this.dropTarget || !this.dropTarget.active) return;
        const targetY = this.dropTarget.y;
        const targetX = this.dropTarget.x + this.dropXOffset;
        if (this.y < targetY) {
            const desired = targetY - this.y;
            this.y += Math.min(desired, (this.dropTrackingSpeed * delta) / 1000);
        }
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        this.direction.set(dx, dy).normalize();
        this.dropXOffset += dx * 0.1;
    }

    recordHit(enemy) {
        if (!enemy || !this.active) return false;
        if (this.hitTargets.has(enemy)) return false;
        this.hitTargets.add(enemy);
        return true;
    }

    destroy() {
        this.clearTint();
        this.setActive(false);
        this.setVisible(false);
        this.hitTargets.clear();
        this.effectInstance?.destroy();
        this.effectInstance = null;
        super.destroy();
    }
}
