import { SKILL_CONFIG } from '../config/skill.js';
import CodeProjectileEffect from './effects/CodeProjectileEffect.js';
import IceParticleEffect from './effects/IceParticleEffect.js';
import CometTailEffect from './effects/CometTailEffect.js';
import WaterParticleEffect from './effects/WaterParticleEffect.js';
import { EFFECT_CONFIG } from '../config/effects.js';
import { resolveSkillBehaviorEntries } from '../systems/skills/skillBehaviorConfig.js';
import { applyDamageVariance } from '../utils/damageVariance.js';

const EFFECT_CLASS_MAP = {
    codeProjectile: CodeProjectileEffect,
    iceTrail: IceParticleEffect,
    aquaStreamTrail: WaterParticleEffect,
    cometTail: CometTailEffect,
    cometTailAstral: CometTailEffect,
};
const TARGET_VIEW_MARGIN = 100;

export default class Skill extends Phaser.GameObjects.Sprite {
    constructor(scene, owner, skillType) {
        const config = owner.getSkillConfig?.(skillType) ?? SKILL_CONFIG[skillType] ?? {};
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
        this.ownerPlayerId = owner?.playerId ?? null;
        this.ownerEntityId = owner?.playerId ?? owner?.name ?? owner?.type ?? null;
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
        const rawBaseDamage = Math.max(0, (config.damage ?? 10) + skillDamageFlat) * ownerDamageMul * skillDamageMul;
        const projectileCount = Math.max(1, Math.round(owner.getSkillObjectCount?.(skillType) ?? config.defaultObjects ?? 1));
        const perProjectileDamage = projectileCount <= 1
            ? rawBaseDamage
            : (rawBaseDamage / projectileCount) + (0.1 * rawBaseDamage);
        this.baseDamage = Math.max(0, perProjectileDamage);
        this.damage = this.baseDamage;
        this.tintColor = config.tint ?? null;
        this.category = config.category ?? 'projectile';
        this.isMelee = this.category === 'melee';
        this.meleeVisualProjectile = this.isMelee && (config.meleeVisualProjectile ?? false);
        this.meleeVisualTravelTime = Math.max(40, config.meleeVisualTravelTime ?? 90);
        this.projectileSpeed = Math.max(0, (config.projectileSpeed ?? 0) * (owner.getSkillProjectileSpeedMultiplier?.(skillType) ?? 1));
        this.travelRange = config.travelRange ?? 0;
        this.meleeRange = Math.max(0, config.meleeRange ?? this.travelRange ?? 0);
        this.meleeTargetMode = config.meleeTargetMode ?? 'single';
        this.meleeArcDegrees = Phaser.Math.Clamp(config.meleeArcDegrees ?? 0, 0, 360);
        this.meleeMaxTargets = Number.isFinite(config.meleeMaxTargets)
            ? Math.max(1, Math.round(config.meleeMaxTargets))
            : Infinity;
        this.homing = config.homing ?? false;
        this.destroyOnHit = config.destroyOnHit ?? false;
        this.bounceOnHit = config.bounceOnHit ?? false;
        this.retargetOnHit = config.retargetOnHit ?? false;
        this.maxChainTargets = config.maxChainTargets ?? 0;
        this.alignWithMovement = config.alignWithMovement ?? false;
        this.rotationOffset = config.rotationOffset ?? 0;
        this.rotateSpriteToDirection = config.rotateSpriteToDirection ?? true;
        this.spinOnFlight = config.spinOnFlight ?? false;
        this.spinSpeed = config.spinSpeed ?? 0;
        this.baseRotation = 0;
        this.effectKey = config.effectKey ?? null;
        this.effectInstance = null;
        const explosionRadiusMultiplier = owner.getSkillExplosionRadiusMultiplier?.(skillType) ?? 1;
        this.explosionRadius = Math.max(0, Math.round((config.explosionRadius ?? 0) * explosionRadiusMultiplier));
        this.explosionDamageMultiplier = Math.max(0, config.explosionDamageMultiplier ?? 1);
        this.explosionKnockbackMultiplier = Math.max(0, config.explosionKnockbackMultiplier ?? 1);
        this.knockback = Math.max(0, Math.round((config.knockback ?? 0) * (owner.getSkillKnockbackMultiplier?.(skillType) ?? 1)));
        this.hasExploded = false;
        this.knockbackCount = 0;
        this.direction = new Phaser.Math.Vector2(0, 0);
        this.startX = 0;
        this.startY = 0;
        this.prevX = 0;
        this.prevY = 0;
        this.hitTargets = new Set();
        this.meleeHitResolved = false;
        this.meleeVisualTween = null;
        this.dropFromSky = config.dropFromSky ?? false;
        this.dropTarget = null;
        this.dropTrackingSpeed = config.dropTrackingSpeed ?? 220;
        this.dropXOffset = 0;
        this.autoExplodeAtViewportCenter = config.autoExplodeAtViewportCenter ?? false;
        this.playAnimation = config.playAnimation ?? true;
        this.visibleDuringEffect = config.visibleDuringEffect ?? true;
        this.critChance = Phaser.Math.Clamp((config.critChance ?? 0) + (owner.getSkillCritChanceBonus?.(skillType) ?? 0), 0, 1);
        this.critMultiplier = (config.critMultiplier ?? 1.5) + (owner.getSkillCritMultiplierBonus?.(skillType) ?? 0);
        this.critColor = '#ff3b30';
        this.tags = Array.isArray(config.tags) ? [...config.tags] : [];
        this.behaviorEntries = resolveSkillBehaviorEntries(config);
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

    getFacingRotation(angle = 0) {
        if (!this.rotateSpriteToDirection) {
            return this.rotation ?? 0;
        }
        return angle + (this.rotationOffset ?? 0);
    }

    shouldAutoExplodeAtViewportCenter() {
        if (!this.active || !this.autoExplodeAtViewportCenter || !this.dropFromSky || this.hasExploded) return false;
        const worldView = this.scene?.cameras?.main?.worldView;
        if (!worldView) return false;
        return this.y >= worldView.centerY;
    }

    getPrimaryStatusEffects() {
        return Array.isArray(this.config?.statusEffects) ? this.config.statusEffects : [];
    }

    getBonusStatusEffects() {
        return Array.isArray(this.config?.bonusStatusEffects) ? this.config.bonusStatusEffects : [];
    }

    triggerAutoExplosion() {
        if (!this.active || this.hasExploded) return false;
        const effectRunner = this.scene?.skillBehaviorPipeline?.effects;
        const explosionStatusEffect = [...this.getPrimaryStatusEffects(), ...this.getBonusStatusEffects()]
            .find((entry) => (entry?.key ?? entry?.effectKey) === 'explosion');
        const behaviorConfig = explosionStatusEffect ?? {};
        const radius = behaviorConfig.radius ?? this.explosionRadius ?? 0;
        if (radius <= 0) {
            this.destroy();
            return false;
        }

        this.hasExploded = true;
        const tint = behaviorConfig.tint ?? this.config?.explosionTint ?? '#ff8c42';
        const depth = (this.depth ?? 30) + 4;
        effectRunner?.spawnExplosion(this.x, this.y, depth, {
            ...(behaviorConfig.effect ?? {}),
            outerColor: Phaser.Display.Color.HexStringToColor(tint).color
        });

        const damageMultiplier = behaviorConfig.damageMultiplier ?? this.explosionDamageMultiplier ?? 1;
        const knockbackMultiplier = behaviorConfig.knockbackMultiplier ?? this.explosionKnockbackMultiplier ?? 1;
        const explosionDamage = applyDamageVariance(Math.max(1, Math.round(this.baseDamage * damageMultiplier)));
        const explosionForce = Math.max(0, Math.round((this.knockback ?? this.config?.knockback ?? 0) * knockbackMultiplier));
        const radiusSq = radius * radius;
        const splashTargets = this.scene?.enemies?.getChildren?.() ?? [];
        const attackTags = Array.from(new Set([
            ...this.tags,
            'explosion',
            this.skillType
        ].filter(Boolean)));
        const followupStatusEffects = [...this.getPrimaryStatusEffects(), ...this.getBonusStatusEffects()].filter(
            (entry) => (entry?.key ?? entry?.effectKey) !== 'explosion'
        );
        const tintText = typeof tint === 'string'
            ? tint
            : Phaser.Display.Color.IntegerToColor(tint ?? 0xff8c42).rgba;

        for (const enemy of splashTargets) {
            if (!enemy?.active || enemy.isDead) continue;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distanceSq = (dx * dx) + (dy * dy);
            if (distanceSq > radiusSq) continue;

            const direction = new Phaser.Math.Vector2(dx, dy);
            if (direction.lengthSq() === 0) {
                direction.set(1, 0);
            } else {
                direction.normalize();
            }

            const damageResult = enemy.takeDamage(
                explosionDamage,
                explosionForce,
                direction,
                this,
                {
                    damageSource: this,
                    fromExplosion: true,
                    fromAutoExplosion: true,
                    attackTags,
                    isCritical: false
                },
                {
                    ...this.config,
                    knockbackTakeDamage: false,
                    knockback: explosionForce
                }
            ) ?? { healthDamage: explosionDamage, absorbedDamage: 0, didKill: false };

            effectRunner?.showDamageText(enemy, explosionDamage, {
                color: tintText,
                fontSize: '7px'
            });
            const hitEvent = {
                target: enemy,
                sourceOwner: this.owner ?? null,
                source: this,
                ownerPlayerId: this.ownerPlayerId ?? null,
                attackTags,
                isCritical: false,
                damage: explosionDamage,
                damageTaken: damageResult.healthDamage ?? explosionDamage,
                absorbedDamage: damageResult.absorbedDamage ?? 0,
                didKill: Boolean(damageResult.didKill),
                direction,
                force: explosionForce
            };
            this.scene?.statusEffectSystem?.applyConfiguredEffects?.(followupStatusEffects, {
                ...hitEvent,
                trigger: 'onExplosionHit'
            });
            if (damageResult.didKill) {
                this.scene?.statusEffectSystem?.applyConfiguredEffects?.(followupStatusEffects, {
                    ...hitEvent,
                    trigger: 'onKill'
                });
            }
            this.scene?.statusEffectSystem?.notifyHit?.(hitEvent);
        }

        this.destroy();
        return true;
    }

    rollCriticalDamage() {
        const isCritical = Math.random() < this.critChance;
        const multiplier = isCritical ? this.critMultiplier : 1;
        const value = applyDamageVariance(Math.max(1, Math.round(this.baseDamage * multiplier)));
        this.lastRoll = { value, isCritical };
        return this.lastRoll;
    }

    cast() {
        this.hasExploded = false;
        this.knockbackCount = 0;
        this.meleeHitResolved = false;
        let x = this.owner.x;
        let y = this.owner.y;
        if (this.isMelee) {
            const anchor = this.getMeleeAnchorPoint();
            if (this.meleeVisualProjectile) {
                x = this.owner.x;
                y = this.owner.y;
            } else {
                x = anchor.x;
                y = anchor.y;
            }
        }
        this.hitTargets.clear();
        this.remainingChainTargets = this.maxChainTargets;
        this.setOrigin(0.5, 0.5);
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
        if (this.isMelee) {
            const initialAnchor = this.getMeleeAnchorPoint();
            this.direction.copy(initialAnchor.direction);
            this.setRotation(this.getFacingRotation(Math.atan2(initialAnchor.direction.y, initialAnchor.direction.x)));
            this.setFlipX(initialAnchor.direction.x < 0);
        }
        this.scene?.statusEffectSystem?.applyConfiguredEffects?.(this.getPrimaryStatusEffects(), {
            trigger: 'onCast',
            target: this.owner,
            sourceOwner: this.owner ?? null,
            source: this,
            ownerPlayerId: this.ownerPlayerId ?? null,
            attackTags: this.tags ?? [],
            isCritical: false,
            didKill: false
        });
        this.scene?.statusEffectSystem?.applyConfiguredEffects?.(this.getBonusStatusEffects(), {
            trigger: 'onCast',
            target: this.owner,
            sourceOwner: this.owner ?? null,
            source: this,
            ownerPlayerId: this.ownerPlayerId ?? null,
            attackTags: this.tags ?? [],
            isCritical: false,
            didKill: false
        });

        if (this.config?.attackStyle === 'chain_lightning_strike') {
            this.castChainLightningStrike();
            return;
        }
        if (this.config?.attackStyle === 'ritual_zone') {
            this.castRitualZone();
            return;
        }
        if (this.config?.attackStyle === 'summon_ghosts') {
            this.castSummonGhosts();
            return;
        }

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
        }
        if (this.isMelee) {
            if (this.meleeVisualProjectile) {
                const previewTarget = this.getNearestEnemyInRange();
                this.startMeleeVisualTravel(previewTarget);
            }
            this.tryResolveMeleeHit();
            if (!this.active) {
                return;
            }
        }

        this.scene.time.delayedCall(this.duration, () => {
            if (this.active) {
                this.destroy();
            }
        });
    }

    castChainLightningStrike() {
        const primaryTarget = this.getNearestEnemyTarget();
        if (!primaryTarget) {
            this.destroy();
            return;
        }

        const effectRunner = this.scene?.skillBehaviorPipeline?.effects;
        const sourcePoint = {
            x: this.owner?.x ?? this.x,
            y: (this.owner?.y ?? this.y) - ((this.owner?.body?.height ?? 24) * 0.2)
        };
        effectRunner?.spawnChainLightning?.(
            sourcePoint,
            primaryTarget,
            (primaryTarget.depth ?? this.depth ?? 20) + 6,
            {
                color: this.config?.lightningColor ?? 0x79dfff,
                glowColor: this.config?.lightningGlowColor ?? 0xe6fcff,
                particleCount: 8,
                duration: 130
            }
        );

        const roll = this.rollCriticalDamage();
        this.damage = roll.value;
        const attackTags = Array.from(new Set([
            ...(Array.isArray(this.config?.tags) ? this.config.tags : []),
            this.skillType,
            'lightning',
            'shock',
            'hit'
        ].filter(Boolean)));
        const direction = new Phaser.Math.Vector2(primaryTarget.x - sourcePoint.x, primaryTarget.y - sourcePoint.y);
        if (direction.lengthSq() === 0) {
            direction.set(1, 0);
        } else {
            direction.normalize();
        }

        const force = this.config?.knockback ?? 0;
        const damageResult = primaryTarget.takeDamage(
            roll.value,
            force,
            direction,
            this,
            {
                damageSource: this,
                attackTags,
                isCritical: roll.isCritical
            },
            this.config
        ) ?? { healthDamage: roll.value, absorbedDamage: 0, didKill: false };

        effectRunner?.showDamageText(primaryTarget, roll.value, {
            color: roll.isCritical ? '#ff3b30' : '#ffde59',
            fontSize: '7px'
        });

        const hitEvent = {
            target: primaryTarget,
            sourceOwner: this.owner ?? null,
            source: this,
            ownerPlayerId: this.ownerPlayerId ?? null,
            attackTags,
            isCritical: roll.isCritical,
            damage: roll.value,
            damageTaken: damageResult.healthDamage ?? roll.value,
            absorbedDamage: damageResult.absorbedDamage ?? 0,
            didKill: Boolean(damageResult.didKill),
            direction,
            force
        };
        this.scene?.statusEffectSystem?.applyConfiguredEffects?.(this.getPrimaryStatusEffects(), {
            ...hitEvent,
            trigger: 'onHit'
        });
        this.scene?.statusEffectSystem?.applyConfiguredEffects?.(this.getBonusStatusEffects(), {
            ...hitEvent,
            trigger: 'onHit'
        });
        if (roll.isCritical) {
            this.scene?.statusEffectSystem?.applyConfiguredEffects?.(this.getPrimaryStatusEffects(), {
                ...hitEvent,
                trigger: 'onCrit'
            });
            this.scene?.statusEffectSystem?.applyConfiguredEffects?.(this.getBonusStatusEffects(), {
                ...hitEvent,
                trigger: 'onCrit'
            });
        }
        if (damageResult.didKill) {
            this.scene?.statusEffectSystem?.applyConfiguredEffects?.(this.getPrimaryStatusEffects(), {
                ...hitEvent,
                trigger: 'onKill'
            });
            this.scene?.statusEffectSystem?.applyConfiguredEffects?.(this.getBonusStatusEffects(), {
                ...hitEvent,
                trigger: 'onKill'
            });
        }
        this.scene?.statusEffectSystem?.notifyHit?.(hitEvent);

        this.scene?.statusEffectSystem?.chainLightningFrom?.(primaryTarget, {
            ownerPlayerId: this.ownerPlayerId ?? null,
            source: this,
            baseDamage: roll.value,
            chainCount: this.config?.chainCount ?? 3,
            chainRadius: this.config?.chainRadius ?? 180,
            damageRatios: this.config?.chainDamageRatios,
            initialDamageRatio: this.config?.chainInitialDamageRatio ?? 0.75,
            damageDecayFactor: this.config?.chainDamageDecayFactor ?? 0.75,
            minimumDamageRatio: this.config?.chainMinimumDamageRatio ?? 0.3,
            targetMode: 'enemies'
        });

        this.destroy();
    }

    castRitualZone() {
        const anchorTarget = this.getNearestEnemyTarget?.() ?? null;
        const centerX = anchorTarget?.active ? anchorTarget.x : (this.owner?.x ?? this.x);
        const centerY = anchorTarget?.active ? anchorTarget.y : (this.owner?.y ?? this.y);
        const ownerPlayerId = this.ownerPlayerId ?? null;
        const tickRatio = Math.max(0, Number(this.config?.zoneDamageRatio ?? 0.25) || 0);
        const baseTickDamage = Math.max(1, Math.round((this.baseDamage ?? 1) * tickRatio));
        const characterEffectMul = Math.max(0.01, this.owner?.resolveCharacterStats?.()?.effectDamageMultiplier ?? 1);
        const globalEffectMul = Math.max(0.01, this.owner?.globalEffectDamageMultiplier ?? 1);
        const tickDamage = Math.max(1, Math.round(baseTickDamage * characterEffectMul * globalEffectMul));

        const depth = Math.max(this.owner?.depth ?? 0, anchorTarget?.depth ?? 0, this.depth ?? 20) + 8;
        const areaMultiplier = Math.max(0.1, this.owner?.getSkillAreaMultiplier?.(this.skillType) ?? 1);
        this.scene?.statusEffectSystem?.spawnRitualZoneCloud?.(this.owner ?? this, {
            x: centerX,
            y: centerY,
            depth,
            radius: Math.max(18, Math.round((this.config?.zoneRadius ?? 120) * areaMultiplier)),
            durationMs: this.config?.zoneDurationMs ?? this.duration ?? 1800,
            tickIntervalMs: this.config?.zoneTickIntervalMs ?? 450,
            slowDurationMs: this.config?.zoneSlowDurationMs ?? 550,
            slowMultiplier: this.config?.zoneSlowMultiplier ?? 0.6,
            damage: tickDamage,
            ownerPlayerId,
            source: this,
            targetMode: 'enemies',
            tags: ['ritual', 'zone', 'dot'],
            showDamageText: false
        });

        this.destroy();
    }

    castSummonGhosts() {
        // Ensure persistent ghost summons exist up to the current skill object count.
        const owner = this.owner ?? null;
        if (owner?.scene?.ensureGhostSummons) {
            owner.scene.ensureGhostSummons(owner);
        }
        this.destroy();
    }

    update(time, delta) {
        if (this.effectInstance?.update) {
            this.effectInstance.update(time, delta);
        }
        if (this.active) {
            this.setDisplaySize(this.hitboxWidth, this.hitboxHeight);
        }
        if (this.active && this.isMelee && !this.meleeVisualProjectile) {
            this.syncMeleePosition();
            this.tryResolveMeleeHit();
            if (!this.active) {
                return;
            }
        } else if (this.active && this.category === 'projectile') {
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
            if (this.shouldAutoExplodeAtViewportCenter()) {
                this.triggerAutoExplosion();
                return;
            }
            if (this.spinOnFlight && this.spinSpeed !== 0) {
                this.rotation += (this.spinSpeed * delta) / 1000;
            }
            if (this.travelRange > 0) {
                const traveled = Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y);
                if (traveled >= this.travelRange) {
                    this.destroy();
                }
            }
        }
    }

    getMeleeDirection(target = null) {
        const direction = new Phaser.Math.Vector2(0, 0);
        if (target?.active) {
            direction.set(target.x - this.owner.x, target.y - this.owner.y);
        } else if (this.owner?.lastMoveDirection?.lengthSq?.() > 0) {
            direction.copy(this.owner.lastMoveDirection);
        } else {
            direction.set(this.owner?.flipX ? -1 : 1, 0);
        }
        if (direction.lengthSq() === 0) {
            direction.set(this.owner?.flipX ? -1 : 1, 0);
        }
        return direction.normalize();
    }

    getMeleeAnchorPointForDirection(directionInput = null) {
        const direction = directionInput?.clone?.() ?? new Phaser.Math.Vector2(this.owner?.flipX ? -1 : 1, 0);
        if (direction.lengthSq() === 0) {
            direction.set(this.owner?.flipX ? -1 : 1, 0);
        }
        direction.normalize();
        const castGap = this.config?.castGap ?? Math.max(16, Math.round(this.meleeRange * 0.35));
        const anchorX = this.owner.x + direction.x * castGap;
        const anchorY = this.owner.y + direction.y * Math.max(10, castGap * 0.6);
        return { x: anchorX, y: anchorY, direction };
    }

    getMeleeAnchorPoint(target = null) {
        return this.getMeleeAnchorPointForDirection(this.getMeleeDirection(target));
    }

    syncMeleePosition(target = null, direction = null) {
        if (!this.active || !this.owner) return;
        const anchor = direction
            ? this.getMeleeAnchorPointForDirection(direction)
            : this.getMeleeAnchorPoint(target);
        this.direction.copy(anchor.direction);
        this.setPosition(anchor.x, anchor.y);
        this.setRotation(this.getFacingRotation(Math.atan2(anchor.direction.y, anchor.direction.x)));
        this.setFlipX(anchor.direction.x < 0);
    }

    getNearestEnemyInRange(range = this.meleeRange) {
        if (!this.scene?.enemies?.getChildren || range <= 0) return null;
        const enemies = this.scene.enemies.getChildren();
        let nearest = null;
        let minDistance = Number.POSITIVE_INFINITY;

        for (const enemy of enemies) {
            if (!enemy?.active || enemy.isDead) continue;
            if (this.hitTargets.has(enemy)) continue;

            const distance = Phaser.Math.Distance.Between(this.owner.x, this.owner.y, enemy.x, enemy.y);
            const enemyRadius = Math.max(enemy.displayWidth ?? enemy.body?.width ?? 0, enemy.displayHeight ?? enemy.body?.height ?? 0) * 0.5;
            if (distance > range + enemyRadius) continue;
            if (distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        }

        return nearest;
    }

    getEnemiesInMeleeArc(range = this.meleeRange, direction = this.getMeleeDirection(), arcDegrees = this.meleeArcDegrees) {
        if (!this.scene?.enemies?.getChildren || range <= 0) return [];
        const enemies = this.scene.enemies.getChildren();
        const forward = direction?.clone?.() ?? new Phaser.Math.Vector2(this.owner?.flipX ? -1 : 1, 0);
        if (forward.lengthSq() === 0) {
            forward.set(this.owner?.flipX ? -1 : 1, 0);
        }
        forward.normalize();
        const meleeEffect = this.config?.meleeHitEffect ?? {};
        const effectRadius = Math.max(0, meleeEffect.radius ?? 0);
        const arcRadius = effectRadius > 0 ? effectRadius : range;
        const forwardOffset = Math.max(0, meleeEffect.forwardOffset ?? this.config?.castGap ?? 0);
        const sweepOrigin = new Phaser.Math.Vector2(
            this.owner.x + (forward.x * forwardOffset),
            this.owner.y + (forward.y * Math.max(0, forwardOffset * 0.55))
        );
        const halfArcRadians = Phaser.Math.DegToRad(Math.max(0, Math.min(360, arcDegrees)) * 0.5);
        const dotThreshold = arcDegrees >= 360 ? -1 : Math.cos(halfArcRadians);
        const targets = [];

        for (const enemy of enemies) {
            if (!enemy?.active || enemy.isDead) continue;
            if (this.hitTargets.has(enemy)) continue;

            const toEnemy = new Phaser.Math.Vector2(enemy.x - sweepOrigin.x, enemy.y - sweepOrigin.y);
            const enemyRadius = Math.max(enemy.displayWidth ?? enemy.body?.width ?? 0, enemy.displayHeight ?? enemy.body?.height ?? 0) * 0.5;
            const distance = toEnemy.length();
            const closestDistance = Math.max(0, distance - enemyRadius);
            if (closestDistance > arcRadius) continue;
            if (distance <= enemyRadius || toEnemy.lengthSq() === 0) {
                targets.push({ enemy, distanceSq: 0 });
                continue;
            }

            const nearestEdgeDirection = toEnemy.clone().normalize();
            if (forward.dot(nearestEdgeDirection) < dotThreshold) continue;
            targets.push({ enemy, distanceSq: closestDistance * closestDistance });
        }

        targets.sort((left, right) => left.distanceSq - right.distanceSq);
        const maxTargets = this.meleeMaxTargets;
        return targets
            .slice(0, Number.isFinite(maxTargets) ? maxTargets : targets.length)
            .map((entry) => entry.enemy);
    }

    startMeleeVisualTravel(target = null, direction = null) {
        if (!this.active || !this.meleeVisualProjectile) return;
        this.meleeVisualTween?.remove?.();
        const anchor = direction
            ? this.getMeleeAnchorPointForDirection(direction)
            : this.getMeleeAnchorPoint(target);
        this.direction.copy(anchor.direction);
        this.setRotation(this.getFacingRotation(Math.atan2(anchor.direction.y, anchor.direction.x)));
        this.setFlipX(anchor.direction.x < 0);
        this.setPosition(this.owner.x, this.owner.y);
        this.meleeVisualTween = this.scene?.tweens?.add?.({
            targets: this,
            x: anchor.x,
            y: anchor.y,
            duration: this.meleeVisualTravelTime,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.meleeVisualTween = null;
                if (this.active) {
                    this.destroy();
                }
            }
        }) ?? null;
    }

    tryResolveMeleeHit() {
        if (!this.active || !this.isMelee) return false;
        if (this.meleeHitResolved) return false;
        if (this.meleeTargetMode === 'arc') {
            const sweepDirection = this.getMeleeDirection();
            this.meleeSweepDirection = sweepDirection.clone();
            const targets = this.getEnemiesInMeleeArc(this.meleeRange, sweepDirection, this.meleeArcDegrees);
            if (!targets.length) return false;

            this.meleeHitResolved = true;
            if (!this.meleeVisualProjectile) {
                this.syncMeleePosition(null, sweepDirection);
            } else {
                this.startMeleeVisualTravel(targets[0], sweepDirection);
            }

            for (const target of targets) {
                if (!this.active) break;
                this.scene?.onSkillHitEnemy?.(this, target);
            }

            if (this.active && !this.meleeVisualProjectile) {
                this.destroy();
            }
            return true;
        }

        const target = this.getNearestEnemyInRange();
        if (!target) return false;

        this.meleeHitResolved = true;
        if (!this.meleeVisualProjectile) {
            this.syncMeleePosition(target);
        } else {
            this.startMeleeVisualTravel(target);
        }
        this.scene?.onSkillHitEnemy?.(this, target);

        const maxTargets = this.meleeMaxTargets;
        if (Number.isFinite(maxTargets) && maxTargets > 1) {
            for (let i = 1; i < Math.floor(maxTargets); i += 1) {
                if (!this.active) break;
                const nextTarget = this.getNearestEnemyInRange();
                if (!nextTarget) break;
                this.scene?.onSkillHitEnemy?.(this, nextTarget);
            }
        }
        if (this.active && !this.meleeVisualProjectile) {
            this.destroy();
        }
        return true;
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

        const targetPool = candidates;
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
        this.setRotation(this.getFacingRotation(Math.atan2(this.direction.y, this.direction.x)));
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
        this.setRotation(this.getFacingRotation(Math.atan2(this.direction.y, this.direction.x)));
        return true;
    }

    applySkyTracking(delta) {
        if (!this.dropTarget || !this.dropTarget.active) return;
        const targetY = this.dropTarget.y;
        const targetX = this.dropTarget.x;
        if (this.y < targetY) {
            const desired = targetY - this.y;
            this.y += Math.min(desired, (this.dropTrackingSpeed * delta) / 1000);
        }
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        this.direction.set(dx, dy).normalize();
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
        this.meleeVisualTween?.remove?.();
        this.meleeVisualTween = null;
        this.hitTargets.clear();
        this.effectInstance?.destroy();
        this.effectInstance = null;
        super.destroy();
    }
}
