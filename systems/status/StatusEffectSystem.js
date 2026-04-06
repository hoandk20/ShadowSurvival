import { getStatusEffectConfig, getStatusEffectDefaultOptions } from '../../config/statusEffects.js';
import StatusSynergyResolver from './StatusSynergyResolver.js';

const DEFAULT_STACKING_MODE = 'refresh';
const VENOM_TRAIL_POISON_REAPPLY_MS = 1000;
const BLOCK_FREEZE_TRIGGER_MS = 3000;
const BLOCK_FREEZE_DAMAGE_WINDOW_MS = 3000;
const BLOCK_FREEZE_DAMAGE_THRESHOLD_RATIO = 0.15;
const BLOCK_FREEZE_DURATION_MS = 5000;
const BLOCK_FREEZE_ARMOR_BONUS = 50;
const BLOCK_FREEZE_SHAKE_DURATION_MS = 140;
const BLOCK_FREEZE_SHAKE_INTENSITY = 0.0035;

class StatusEffect {
    static effectKey = 'base';

    static defaultDefinition = {
        durationMs: 1000,
        maxStacks: 1,
        stackingMode: DEFAULT_STACKING_MODE,
        tags: [],
        tickIntervalMs: 0,
        priority: 0
    };

    constructor(component, options = {}, definition = {}) {
        this.component = component;
        this.system = component.system;
        this.entity = component.entity;
        this.scene = component.scene;
        this.definition = {
            ...this.constructor.defaultDefinition,
            ...definition
        };
        this.key = this.constructor.effectKey;
        this.ownerPlayerId = options.ownerPlayerId ?? null;
        this.source = options.source ?? null;
        this.sourceEntityId = options.sourceEntityId ?? this.source?.ownerEntityId ?? this.source?.playerId ?? null;
        this.durationMs = Math.max(0, options.durationMs ?? this.definition.durationMs ?? 0);
        this.remainingMs = this.durationMs;
        this.maxStacks = Math.max(1, options.maxStacks ?? this.definition.maxStacks ?? 1);
        this.stackCount = Math.max(1, Math.min(this.maxStacks, options.stackCount ?? 1));
        this.stackingMode = options.stackingMode ?? this.definition.stackingMode ?? DEFAULT_STACKING_MODE;
        this.tags = Array.from(new Set([
            ...(Array.isArray(this.definition.tags) ? this.definition.tags : []),
            ...(Array.isArray(options.tags) ? options.tags : [])
        ]));
        this.tickIntervalMs = Math.max(0, options.tickIntervalMs ?? this.definition.tickIntervalMs ?? 0);
        this.priority = Number.isFinite(options.priority) ? options.priority : (this.definition.priority ?? 0);
        this.reapplyDelayMs = Math.max(0, options.reapplyDelayMs ?? this.definition.reapplyDelayMs ?? 0);
        this.elapsedSinceTickMs = 0;
        this.expired = false;
        this.state = {};
        this.configure(options);
    }

    configure(_options = {}) {}

    getStackingKey() {
        return `${this.key}::${this.ownerPlayerId ?? 'global'}`;
    }

    cloneOptions() {
        return {
            ownerPlayerId: this.ownerPlayerId,
            source: this.source,
            sourceEntityId: this.sourceEntityId,
            durationMs: this.durationMs,
            stackCount: this.stackCount,
            maxStacks: this.maxStacks,
            stackingMode: this.stackingMode,
            tags: [...this.tags]
        };
    }

    onApply(_context = {}) {}

    onRefresh(context = {}) {
        this.remainingMs = Math.max(this.remainingMs, context.durationMs ?? this.durationMs);
    }

    onTick(_context = {}) {}

    onExpire(_context = {}) {}

    onHitReceived(_event = {}) {}

    onHitDealt(_event = {}) {}

    onKill(_event = {}) {}

    onMove(_event = {}) {}

    modifyIncomingDamage(context = {}) {
        return context;
    }

    modifyOutgoingDamage(context = {}) {
        return context;
    }

    modifyIncomingHealing(context = {}) {
        return context;
    }

    getDisplayTint() {
        return null;
    }

    getStateContribution() {
        return null;
    }

    refreshFromOptions(options = {}) {
        if (this.stackingMode === 'refresh') {
            this.remainingMs = Math.max(this.remainingMs, options.durationMs ?? this.durationMs);
            this.stackCount = Math.max(this.stackCount, Math.min(this.maxStacks, options.stackCount ?? this.stackCount));
            this.onRefresh(options);
            return true;
        }
        if (this.stackingMode === 'addStack') {
            this.remainingMs = Math.max(this.remainingMs, options.durationMs ?? this.durationMs);
            const nextStacks = (options.addStacks ?? options.stackCount ?? 1);
            this.stackCount = Math.min(this.maxStacks, this.stackCount + Math.max(1, nextStacks));
            this.onRefresh(options);
            return true;
        }
        return false;
    }

    markExpired() {
        this.expired = true;
    }

    update(delta, context = {}) {
        if (this.expired) return;
        if (this.tickIntervalMs > 0) {
            this.elapsedSinceTickMs += delta;
            while (this.elapsedSinceTickMs >= this.tickIntervalMs) {
                this.elapsedSinceTickMs -= this.tickIntervalMs;
                this.onTick({
                    ...context,
                    delta: this.tickIntervalMs
                });
                if (this.expired) return;
            }
        }
        if (this.durationMs <= 0) return;
        this.remainingMs -= delta;
        if (this.remainingMs > 0) return;
        this.expired = true;
    }
}

class BurnStatusEffect extends StatusEffect {
    static effectKey = 'burn';

    static defaultDefinition = {
        ...StatusEffect.defaultDefinition,
        durationMs: 3000,
        maxStacks: 6,
        stackingMode: 'independent',
        tags: ['fire', 'burn'],
        tickIntervalMs: 500
    };

    configure(options = {}) {
        this.hitDamageSnapshot = Math.max(0, options.hitDamageSnapshot ?? options.baseDamage ?? 0);
        this.damageRatioPerTick = Math.max(0, options.damageRatioPerTick ?? 0.15);
        this.minDamagePerTick = Math.max(0, options.minDamagePerTick ?? 3);
        this.damagePerTick = Math.max(
            this.minDamagePerTick,
            options.damagePerTick ?? Math.round(this.hitDamageSnapshot * this.damageRatioPerTick)
        );
        this.spreadStacks = Math.max(1, options.spreadStacks ?? 1);
    }

    onTick() {
        this.system.applyOwnedDamage(this.entity, this.damagePerTick * this.stackCount, {
            ownerPlayerId: this.ownerPlayerId,
            source: this.source,
            tags: [...this.tags, 'dot', 'status'],
            statusKey: this.key,
            statusEffect: this,
            showDamageText: true,
            damageTextColor: '#ff7a2f',
            damageTextFontSize: '7px'
        });
    }
}

class FreezeStatusEffect extends StatusEffect {
    static effectKey = 'freeze';

    static defaultDefinition = {
        ...StatusEffect.defaultDefinition,
        durationMs: 1500,
        maxStacks: 1,
        stackingMode: 'refresh',
        tags: ['ice', 'freeze']
    };

    configure(options = {}) {
        this.mode = options.mode ?? 'slow';
        this.slowMultiplier = Phaser.Math.Clamp(options.slowMultiplier ?? 0.5, 0, 1);
    }

    getStateContribution() {
        return {
            stunned: this.mode === 'stun',
            speedMultiplier: this.mode === 'stun' ? 0 : this.slowMultiplier
        };
    }
}

class ShockStatusEffect extends StatusEffect {
    static effectKey = 'shock';

    static defaultDefinition = {
        ...StatusEffect.defaultDefinition,
        durationMs: 2500,
        maxStacks: 4,
        stackingMode: 'refresh',
        tags: ['lightning', 'shock']
    };

    configure(options = {}) {
        this.slowDurationMs = Math.max(0, options.slowDurationMs ?? 2000);
        this.slowMultiplier = Phaser.Math.Clamp(options.slowMultiplier ?? 0.8, 0, 1);
        this.chainRadius = Math.max(24, options.chainRadius ?? 120);
        this.chainCount = Math.max(1, options.chainCount ?? 3);
        this.chainDamage = Math.max(1, options.chainDamage ?? 8);
        this.chainDamageRatios = Array.isArray(options.chainDamageRatios) && options.chainDamageRatios.length
            ? options.chainDamageRatios.map((ratio) => Math.max(0, Number(ratio) || 0))
            : null;
        this.chainInitialDamageRatio = Phaser.Math.Clamp(options.chainInitialDamageRatio ?? 0.75, 0.05, 1);
        this.chainDamageDecayFactor = Phaser.Math.Clamp(options.chainDamageDecayFactor ?? options.chainFalloff ?? 0.75, 0.1, 1);
        this.chainMinimumDamageRatio = Phaser.Math.Clamp(options.chainMinimumDamageRatio ?? 0.3, 0.05, 1);
        this.chainStepDelayMs = Math.max(0, options.chainStepDelayMs ?? 90);
    }

    getStateContribution() {
        if (this.slowDurationMs <= 0 || this.slowMultiplier >= 1) return null;
        const slowStartThreshold = Math.max(0, this.durationMs - this.slowDurationMs);
        if (this.remainingMs <= slowStartThreshold) return null;
        return {
            speedMultiplier: this.slowMultiplier
        };
    }

    onHitReceived(event = {}) {
        const attackTags = new Set(event.attackTags ?? []);
        if (attackTags.has('chain')) return;
        if (attackTags.has('direct_shock_chain')) return;
        const isEnemyTarget = Boolean(this.entity?.scene?.enemies?.contains?.(this.entity));
        if (!isEnemyTarget) return;
        if (!this.entity?.scene) return;
        const burnEffect = this.entity?.statusEffects?.getPrimaryEffect?.('burn') ?? null;

        const baseDamage = Math.max(
            1,
            Math.round(event.damageTaken ?? event.damage ?? this.chainDamage)
        );

        this.system.chainLightningFrom(this.entity, {
            ownerPlayerId: this.ownerPlayerId ?? event.ownerPlayerId ?? null,
            source: this.source ?? event.source ?? null,
            chainCount: this.chainCount,
            chainRadius: this.chainRadius,
            baseDamage,
            damageRatios: this.chainDamageRatios,
            initialDamageRatio: this.chainInitialDamageRatio,
            damageDecayFactor: this.chainDamageDecayFactor,
            minimumDamageRatio: this.chainMinimumDamageRatio,
            stepDelayMs: this.chainStepDelayMs,
            targetMode: 'enemies',
            spreadEffectKey: 'shock',
            spreadEffectOptions: {
                durationMs: this.remainingMs > 0 ? this.remainingMs : this.durationMs,
                chainCount: this.chainCount,
                chainRadius: this.chainRadius,
                chainDamageRatios: this.chainDamageRatios ? [...this.chainDamageRatios] : undefined,
                chainInitialDamageRatio: this.chainInitialDamageRatio,
                chainDamageDecayFactor: this.chainDamageDecayFactor,
                chainMinimumDamageRatio: this.chainMinimumDamageRatio,
                chainStepDelayMs: this.chainStepDelayMs,
                tags: [...this.tags]
            },
            spreadSecondaryEffects: burnEffect
                ? [
                    {
                        effectKey: 'burn',
                        effectOptions: {
                            durationMs: burnEffect.remainingMs > 0 ? burnEffect.remainingMs : burnEffect.durationMs,
                            damagePerTick: burnEffect.damagePerTick,
                            damageRatioPerTick: burnEffect.damageRatioPerTick,
                            minDamagePerTick: burnEffect.minDamagePerTick,
                            spreadStacks: burnEffect.spreadStacks,
                            tags: [...burnEffect.tags]
                        }
                    }
                ]
                : []
        });
    }
}

class PoisonStatusEffect extends StatusEffect {
    static effectKey = 'poison';

    static defaultDefinition = {
        ...StatusEffect.defaultDefinition,
        durationMs: 3000,
        maxStacks: 6,
        stackingMode: 'independent',
        tags: ['poison'],
        tickIntervalMs: 500
    };

    configure(options = {}) {
        this.hitDamageSnapshot = Math.max(0, options.hitDamageSnapshot ?? options.baseDamage ?? 0);
        this.damageRatioPerTick = Math.max(0, options.damageRatioPerTick ?? 0.15);
        this.minDamagePerTick = Math.max(0, options.minDamagePerTick ?? 3);
        this.damagePerTick = Math.max(
            this.minDamagePerTick,
            options.damagePerTick ?? Math.round(this.hitDamageSnapshot * this.damageRatioPerTick)
        );
        this.antiHealMultiplier = Phaser.Math.Clamp(options.antiHealMultiplier ?? 0.35, 0, 1);
        this.trailIntervalMs = Math.max(200, options.trailIntervalMs ?? 700);
        this.trailDamage = Math.max(1, options.trailDamage ?? 4);
        this.lastTrailAtMs = 0;
    }

    onTick(context = {}) {
        this.system.applyOwnedDamage(this.entity, this.damagePerTick * this.stackCount, {
            ownerPlayerId: this.ownerPlayerId,
            source: this.source,
            tags: [...this.tags, 'dot', 'status'],
            statusKey: this.key,
            statusEffect: this,
            showDamageText: true,
            damageTextColor: '#7dff8d',
            damageTextFontSize: '7px'
        });
        const extraFreezeMs = Math.max(0, Math.round(this.state?.frozenToxinFreezeExtensionMs ?? 0));
        const timeNow = context.timeNow ?? this.scene?.time?.now ?? 0;
        const frozenToxinActiveUntilMs = Math.max(0, Math.round(this.state?.frozenToxinActiveUntilMs ?? 0));
        if (extraFreezeMs > 0 && frozenToxinActiveUntilMs > timeNow) {
            this.system.applyEffect(this.entity, 'freeze', {
                ownerPlayerId: this.ownerPlayerId,
                source: this.source,
                durationMs: extraFreezeMs,
                mode: 'stun',
                slowMultiplier: 0,
                tags: ['ice', 'poison', 'frozen_toxin']
            });
        } else if (frozenToxinActiveUntilMs > 0 && frozenToxinActiveUntilMs <= timeNow) {
            this.state.frozenToxinFreezeExtensionMs = 0;
            this.state.frozenToxinActiveUntilMs = 0;
        }
    }

    modifyIncomingHealing(context = {}) {
        return {
            ...context,
            amount: Math.max(0, (context.amount ?? 0) * (1 - this.antiHealMultiplier))
        };
    }
}

class BleedStatusEffect extends StatusEffect {
    static effectKey = 'bleed';

    static defaultDefinition = {
        ...StatusEffect.defaultDefinition,
        durationMs: 3000,
        maxStacks: 10,
        stackingMode: 'independent',
        tags: ['physical', 'bleed'],
        tickIntervalMs: 500
    };

    configure(options = {}) {
        this.hitDamageSnapshot = Math.max(0, options.hitDamageSnapshot ?? options.baseDamage ?? 0);
        this.damageRatioPerTick = Math.max(0, options.damageRatioPerTick ?? 0.15);
        this.minDamagePerTick = Math.max(0, options.minDamagePerTick ?? 3);
        this.damagePerTick = Math.max(
            this.minDamagePerTick,
            options.damagePerTick ?? Math.round(this.hitDamageSnapshot * this.damageRatioPerTick)
        );
        this.hitCounter = Math.max(0, options.hitCounter ?? 0);
        this.burstDamage = Math.max(1, options.burstDamage ?? 10);
    }

    onHitReceived() {
        this.hitCounter += 1;
    }

    onTick() {
        const tickDamage = this.damagePerTick * Math.max(1, this.stackCount + this.hitCounter);
        this.system.applyOwnedDamage(this.entity, tickDamage, {
            ownerPlayerId: this.ownerPlayerId,
            source: this.source,
            tags: [...this.tags, 'dot', 'status'],
            statusKey: this.key,
            statusEffect: this,
            showDamageText: true,
            damageTextColor: '#ff6f8f',
            damageTextFontSize: '7px'
        });
    }
}

class ExplosionStatusEffect extends StatusEffect {
    static effectKey = 'explosion';

    static defaultDefinition = {
        ...StatusEffect.defaultDefinition,
        durationMs: 0,
        maxStacks: 1,
        stackingMode: 'independent',
        tags: ['explosion']
    };

    configure(options = {}) {
        this.hitDamageSnapshot = Math.max(0, options.hitDamageSnapshot ?? options.baseDamage ?? 0);
        this.damageRatio = Math.max(0, options.damageRatio ?? 0.5);
        this.radius = Math.max(24, options.radius ?? 90);
        this.damage = Math.max(1, options.damage ?? Math.round(this.hitDamageSnapshot * this.damageRatio));
        this.knockbackMultiplier = Math.max(0, options.knockbackMultiplier ?? 1);
        this.tint = options.tint ?? '#ff9a42';
        this.effect = options.effect ?? {};
        this.spreadStatusKey = options.spreadStatusKey ?? null;
        this.spreadStatusOptions = options.spreadStatusOptions ?? null;
    }

    onApply() {
        this.scene?.skillBehaviorPipeline?.effects?.spawnExplosion?.(this.entity.x, this.entity.y, (this.entity.depth ?? 20) + 4, {
            ...this.effect,
            outerColor: typeof this.tint === 'string'
                ? Phaser.Display.Color.HexStringToColor(this.tint).color
                : this.tint
        });
        this.system.explodeAround(this.entity, {
            radius: this.radius,
            damage: this.damage,
            ownerPlayerId: this.ownerPlayerId,
            source: this.source,
            tags: [...this.tags, 'status'],
            targetMode: 'enemies',
            forceMultiplier: this.knockbackMultiplier
        });
        if (this.spreadStatusKey) {
            this.system.spreadStatusAround(this.entity, this.spreadStatusKey, this.spreadStatusOptions ?? {}, {
                radius: this.radius,
                ownerPlayerId: this.ownerPlayerId,
                source: this.source,
                targetMode: 'enemies'
            });
        }
        this.markExpired();
    }
}

class ShieldStatusEffect extends StatusEffect {
    static effectKey = 'shield';

    static defaultDefinition = {
        ...StatusEffect.defaultDefinition,
        durationMs: 0,
        maxStacks: 1,
        stackingMode: 'refresh',
        tags: ['shield'],
        priority: 100,
        tickIntervalMs: 10000
    };

    configure(options = {}) {
        this.capacity = Math.max(0, options.capacity ?? 50);
        this.currentCapacity = Math.max(0, options.currentCapacity ?? this.capacity);
        this.refillIntervalMs = Math.max(250, options.refillIntervalMs ?? this.tickIntervalMs ?? 10000);
        this.tickIntervalMs = this.refillIntervalMs;
    }

    refreshFromOptions(options = {}) {
        const didRefresh = super.refreshFromOptions(options);
        if (!didRefresh) return false;
        const nextCapacity = Math.max(0, options.capacity ?? this.capacity);
        this.capacity = nextCapacity;
        this.currentCapacity = nextCapacity;
        this.refillIntervalMs = Math.max(250, options.refillIntervalMs ?? this.refillIntervalMs ?? 10000);
        this.tickIntervalMs = this.refillIntervalMs;
        return true;
    }

    onTick() {
        this.currentCapacity = this.capacity;
    }

    modifyIncomingDamage(context = {}) {
        if (this.currentCapacity <= 0 || (context.amount ?? 0) <= 0) {
            return context;
        }
        const absorbedDamage = Math.min(this.currentCapacity, context.amount ?? 0);
        this.currentCapacity -= absorbedDamage;
        return {
            ...context,
            amount: Math.max(0, (context.amount ?? 0) - absorbedDamage),
            absorbedDamage: (context.absorbedDamage ?? 0) + absorbedDamage,
            shieldTriggered: true
        };
    }
}

class MarkStatusEffect extends StatusEffect {
    static effectKey = 'mark';

    static defaultDefinition = {
        ...StatusEffect.defaultDefinition,
        durationMs: 5000,
        maxStacks: 5,
        stackingMode: 'refresh',
        tags: ['mark'],
        priority: 10
    };

    configure(options = {}) {
        this.damageIncreasePerStack = Math.max(0, options.damageIncreasePerStack ?? 0.3);
    }

    modifyIncomingDamage(context = {}) {
        return {
            ...context,
            amount: (context.amount ?? 0) * (1 + this.damageIncreasePerStack * this.stackCount)
        };
    }
}

const EFFECT_CLASS_MAP = {
    burn: BurnStatusEffect,
    freeze: FreezeStatusEffect,
    shock: ShockStatusEffect,
    poison: PoisonStatusEffect,
    bleed: BleedStatusEffect,
    explosion: ExplosionStatusEffect,
    shield: ShieldStatusEffect,
    mark: MarkStatusEffect
};

class StatusSynergyHandler {
    constructor(system) {
        this.system = system;
    }

    handleHit(event = {}) {
        const target = event.target ?? null;
        const targetEffects = target?.statusEffects ?? null;
        if (!targetEffects) return;
        this.system.synergyResolver?.resolveSynergy?.({
            ...event,
            trigger: 'hit'
        });

        if (targetEffects.hasEffect('mark')) {
            const markEffect = targetEffects.getPrimaryEffect('mark');
            if (markEffect) {
                markEffect.stackCount = Math.min(markEffect.maxStacks, markEffect.stackCount + 1);
                markEffect.remainingMs = Math.max(markEffect.remainingMs, markEffect.durationMs);
            }
        }

    }

    handleKill(event = {}) {
        this.system.synergyResolver?.resolveSynergy?.({
            ...event,
            trigger: 'kill'
        });
    }

    handleMove(event = {}) {
        const entityEffects = event.entity?.statusEffects ?? null;
        if (!entityEffects?.hasEffect('poison')) return;
        const poisonEffect = entityEffects.getPrimaryEffect('poison');
        const now = event.timeNow ?? event.entity?.scene?.time?.now ?? 0;
        if ((poisonEffect.lastTrailAtMs ?? 0) > 0 && (now - poisonEffect.lastTrailAtMs) < poisonEffect.trailIntervalMs) {
            return;
        }
        poisonEffect.lastTrailAtMs = now;
        this.system.applyTrailDamage(event.entity, {
            radius: 48,
            damage: poisonEffect.trailDamage,
            ownerPlayerId: poisonEffect.ownerPlayerId,
            source: poisonEffect.source,
            tags: ['poison', 'trail']
        });
    }
}

class StatusEffectComponent {
    constructor(system, entity, options = {}) {
        this.system = system;
        this.scene = system.scene;
        this.entity = entity;
        this.entityType = options.entityType ?? 'neutral';
        this.activeEffects = [];
        this.lastEffectApplyTimes = new Map();
        this.statusSpeedMultiplier = 1;
        this.statusIsStunned = false;
        this.lastMoveSample = new Phaser.Math.Vector2(entity.x ?? 0, entity.y ?? 0);
        this.movedDistanceSinceTrail = 0;
        this.freezeContinuousStartedAtMs = 0;
        this.blockFreezeUntilMs = 0;
        this.recentDamageSamples = [];
        this.recentFreezeApplyTimes = [];
    }

    destroy() {
        this.activeEffects.forEach((effect) => effect.onExpire?.({ entity: this.entity }));
        this.activeEffects = [];
        this.recentDamageSamples = [];
        this.recentFreezeApplyTimes = [];
        this.entity.setBlockFreezeArmorBonus?.(0);
        this.entity.setBlockFreezeVisual?.(false);
        this.entity.clearStatusHighlight?.();
        this.entity.syncStatusEffectIndicators?.([]);
    }

    isEnemy() {
        return this.entityType === 'enemy';
    }

    canUseBlockFreeze() {
        if (!this.isEnemy()) return false;
        return Boolean(this.entity?.isBoss || this.entity?.isMiniBoss || this.entity?.isFinalBoss);
    }

    isBlockFreezeActive(timeNow = this.scene?.time?.now ?? 0) {
        return this.canUseBlockFreeze() && (this.blockFreezeUntilMs ?? 0) > timeNow;
    }

    activateBlockFreeze(timeNow = this.scene?.time?.now ?? 0) {
        if (!this.canUseBlockFreeze()) return;
        this.blockFreezeUntilMs = timeNow + BLOCK_FREEZE_DURATION_MS;
        this.freezeContinuousStartedAtMs = 0;
        this.recentDamageSamples = [];
        this.recentFreezeApplyTimes = [];
        if (this.hasEffect('freeze')) {
            this.removeEffects('freeze');
        } else {
            this.applyStateContributions();
        }
        this.entity.setBlockFreezeArmorBonus?.(BLOCK_FREEZE_ARMOR_BONUS);
        this.entity.setBlockFreezeVisual?.(true);
        this.scene?.cameras?.main?.shake?.(BLOCK_FREEZE_SHAKE_DURATION_MS, BLOCK_FREEZE_SHAKE_INTENSITY);
    }

    updateBlockFreezeState(timeNow = this.scene?.time?.now ?? 0) {
        if (!this.canUseBlockFreeze()) {
            this.blockFreezeUntilMs = 0;
            this.freezeContinuousStartedAtMs = 0;
            this.recentDamageSamples = [];
            this.recentFreezeApplyTimes = [];
            this.entity.setBlockFreezeArmorBonus?.(0);
            this.entity.setBlockFreezeVisual?.(false);
            return;
        }
        const blockFreezeActive = this.isBlockFreezeActive(timeNow);
        if (blockFreezeActive) {
            this.freezeContinuousStartedAtMs = 0;
            this.recentFreezeApplyTimes = [];
            this.entity.setBlockFreezeArmorBonus?.(BLOCK_FREEZE_ARMOR_BONUS);
            if (this.hasEffect('freeze')) {
                this.removeEffects('freeze');
            } else {
                this.entity.setBlockFreezeVisual?.(true);
            }
            return;
        }
        this.entity.setBlockFreezeArmorBonus?.(0);
        this.entity.setBlockFreezeVisual?.(false);
        if (!this.hasEffect('freeze')) {
            this.freezeContinuousStartedAtMs = 0;
            return;
        }
        if (this.freezeContinuousStartedAtMs <= 0) {
            this.freezeContinuousStartedAtMs = timeNow;
            return;
        }
        if ((timeNow - this.freezeContinuousStartedAtMs) >= BLOCK_FREEZE_TRIGGER_MS) {
            this.activateBlockFreeze(timeNow);
        }
    }

    pruneRecentDamageSamples(timeNow = this.scene?.time?.now ?? 0) {
        const cutoff = timeNow - BLOCK_FREEZE_DAMAGE_WINDOW_MS;
        this.recentDamageSamples = this.recentDamageSamples.filter((entry) => (entry?.timeNow ?? 0) >= cutoff);
    }

    pruneRecentFreezeApplies(timeNow = this.scene?.time?.now ?? 0) {
        const cutoff = timeNow - BLOCK_FREEZE_TRIGGER_MS;
        this.recentFreezeApplyTimes = this.recentFreezeApplyTimes.filter((appliedAtMs) => appliedAtMs >= cutoff);
    }

    recordFreezeApply(timeNow = this.scene?.time?.now ?? 0) {
        if (!this.canUseBlockFreeze() || this.isBlockFreezeActive(timeNow)) return;
        this.recentFreezeApplyTimes.push(timeNow);
        this.pruneRecentFreezeApplies(timeNow);
        if (this.recentFreezeApplyTimes.length >= 3) {
            this.activateBlockFreeze(timeNow);
        }
    }

    updateDamageTriggeredBlockFreeze(timeNow = this.scene?.time?.now ?? 0) {
        if (!this.canUseBlockFreeze() || this.isBlockFreezeActive(timeNow)) return;
        this.pruneRecentDamageSamples(timeNow);
        const totalRecentDamage = this.recentDamageSamples.reduce((sum, entry) => {
            return sum + Math.max(0, Number(entry?.damage ?? 0) || 0);
        }, 0);
        const maxHealth = Math.max(1, Number(this.entity?.maxHealth ?? 1) || 1);
        if (totalRecentDamage >= (maxHealth * BLOCK_FREEZE_DAMAGE_THRESHOLD_RATIO)) {
            this.activateBlockFreeze(timeNow);
        }
    }

    applyEffect(effectKey, options = {}) {
        const timeNow = this.scene?.time?.now ?? 0;
        if (effectKey === 'freeze' && this.isBlockFreezeActive(timeNow)) {
            this.entity.setBlockFreezeVisual?.(true);
            return null;
        }
        if (effectKey === 'freeze') {
            this.recordFreezeApply(timeNow);
            if (this.isBlockFreezeActive(timeNow)) {
                this.entity.setBlockFreezeVisual?.(true);
                return null;
            }
        }
        const effect = this.system.createEffect(this, effectKey, options);
        if (!effect) return null;
        const stackingKey = `${effect.key}::${effect.getStackingKey()}`;

        if (effect.stackingMode !== 'independent') {
            const existing = this.activeEffects.find((entry) => (
                !entry.expired
                && entry.key === effect.key
                && entry.getStackingKey() === effect.getStackingKey()
            ));
            if (existing?.refreshFromOptions?.(options)) {
                this.lastEffectApplyTimes.set(stackingKey, timeNow);
                return existing;
            }
        }

        if (effect.stackingMode === 'independent' && effect.reapplyDelayMs > 0) {
            const lastAppliedAtMs = this.lastEffectApplyTimes.get(stackingKey) ?? -Infinity;
            if ((timeNow - lastAppliedAtMs) < effect.reapplyDelayMs) {
                return this.getPrimaryEffect(effect.key);
            }
        }

        this.activeEffects.push(effect);
        this.lastEffectApplyTimes.set(stackingKey, timeNow);
        effect.onApply({ entity: this.entity, options });
        this.applyStateContributions();
        return effect;
    }

    removeEffects(effectKey) {
        this.activeEffects = this.activeEffects.filter((effect) => {
            if (effect.key !== effectKey) return true;
            effect.onExpire?.({ entity: this.entity, removed: true });
            return false;
        });
        this.applyStateContributions();
    }

    hasEffect(effectKey) {
        return this.activeEffects.some((effect) => effect.key === effectKey && !effect.expired);
    }

    getPrimaryEffect(effectKey) {
        return this.activeEffects.find((effect) => effect.key === effectKey && !effect.expired) ?? null;
    }

    getEffects(effectKey = null) {
        return this.activeEffects.filter((effect) => {
            if (effect.expired) return false;
            if (!effectKey) return true;
            return effect.key === effectKey;
        });
    }

    getTotalStackCount(effectKey) {
        return this.getEffects(effectKey)
            .reduce((total, effect) => total + Math.max(1, effect.stackCount ?? 1), 0);
    }

    getActiveTags() {
        const tags = new Set();
        this.activeEffects.forEach((effect) => {
            if (!effect) return;
            if (effect.expired) return;
            effect.tags?.forEach?.((tag) => tags.add(tag));
        });
        return Array.from(tags);
    }

    getAdjustedSpeed(baseSpeed) {
        return (baseSpeed ?? 0) * (this.statusSpeedMultiplier ?? 1);
    }

    getIndicatorEntries() {
        const grouped = new Map();
        this.activeEffects.forEach((effect) => {
            if (!effect) return;
            if (effect.expired) return;
            const displayConfig = getStatusEffectConfig(effect.key);
            const priority = displayConfig?.iconPriority;
            if (!Number.isFinite(priority)) return;
            const existing = grouped.get(effect.key);
            const stackCount = Math.max(1, effect.stackCount ?? 1);
            if (!existing) {
                grouped.set(effect.key, {
                    key: effect.key,
                    stackCount,
                    priority,
                    effect
                });
                return;
            }
            existing.stackCount += stackCount;
            if ((effect.priority ?? 0) >= (existing.effect?.priority ?? 0)) {
                existing.effect = effect;
            }
        });
        return Array.from(grouped.values())
            .sort((left, right) => {
                if (right.priority !== left.priority) return right.priority - left.priority;
                return left.key.localeCompare(right.key);
            })
            .map((entry) => ({
                key: entry.key,
                stackCount: getStatusEffectConfig(entry.key)?.showStack ? entry.stackCount : 1
            }));
    }

    applyStateContributions() {
        let speedMultiplier = 1;
        let stunned = false;
        let highlightTint = null;
        let highlightPriority = -Infinity;
        const timeNow = this.scene?.time?.now ?? 0;
        this.activeEffects.forEach((effect) => {
            if (!effect) return;
            if (effect.expired) return;
            const contribution = effect.getStateContribution?.();
            if (!contribution) return;
            if (typeof contribution.speedMultiplier === 'number') {
                speedMultiplier *= contribution.speedMultiplier;
            }
            if (contribution.stunned) {
                stunned = true;
            }
        });
        this.activeEffects.forEach((effect) => {
            if (!effect) return;
            if (effect.expired) return;
            const displayConfig = getStatusEffectConfig(effect.key);
            const tint = effect.getDisplayTint?.() ?? displayConfig?.highlightTint;
            if (typeof tint !== 'number') return;
            const priority = (displayConfig?.highlightPriority ?? 0) + (effect.priority ?? 0);
            if (priority < highlightPriority) return;
            highlightPriority = priority;
            highlightTint = tint;
        });
        if (this.isBlockFreezeActive(timeNow)) {
            highlightTint = 0xffffff;
            highlightPriority = Number.POSITIVE_INFINITY;
        }
        this.statusSpeedMultiplier = Phaser.Math.Clamp(speedMultiplier, 0, 1);
        this.statusIsStunned = stunned;
        this.entity.isStunned = this.statusIsStunned;
        if (this.statusIsStunned && this.entity.body?.setVelocity) {
            this.entity.body.setVelocity(0, 0);
        }
        if (typeof highlightTint === 'number') {
            this.entity.applyStatusHighlight?.(highlightTint);
        } else {
            this.entity.clearStatusHighlight?.();
        }
        this.entity.syncStatusEffectIndicators?.(this.getIndicatorEntries());
    }

    update(delta) {
        const timeNow = this.scene?.time?.now ?? 0;
        this.pruneRecentDamageSamples(timeNow);
        if (this.isBlockFreezeActive(timeNow) && this.hasEffect('freeze')) {
            this.removeEffects('freeze');
        }
        if (this.activeEffects.some((effect) => !effect)) {
            this.activeEffects = this.activeEffects.filter(Boolean);
        }
        for (let index = this.activeEffects.length - 1; index >= 0; index -= 1) {
            const effect = this.activeEffects[index];
            if (!effect) {
                this.activeEffects.splice(index, 1);
                continue;
            }
            effect.update(delta, { entity: this.entity, timeNow });
            if (!effect.expired) continue;
            effect.onExpire?.({ entity: this.entity, expired: true });
            this.activeEffects.splice(index, 1);
        }
        this.updateBlockFreezeState(timeNow);
        this.applyStateContributions();
        this.handleMove(timeNow);
    }

    handleMove(timeNow) {
        const movedDistance = Phaser.Math.Distance.Between(
            this.lastMoveSample.x,
            this.lastMoveSample.y,
            this.entity.x ?? 0,
            this.entity.y ?? 0
        );
        if (movedDistance > 0) {
            this.movedDistanceSinceTrail += movedDistance;
            this.lastMoveSample.set(this.entity.x ?? 0, this.entity.y ?? 0);
        }
        if (this.movedDistanceSinceTrail < 14) return;
        this.movedDistanceSinceTrail = 0;
        this.system.synergyHandler.handleMove({
            entity: this.entity,
            movedDistance,
            timeNow
        });
    }

    beforeDamageTaken(context = {}) {
        let nextContext = { ...context, amount: Math.max(0, context.amount ?? 0), absorbedDamage: context.absorbedDamage ?? 0 };
        const sortedEffects = [...this.activeEffects]
            .filter((effect) => !effect.expired)
            .sort((left, right) => (left.priority ?? 0) - (right.priority ?? 0));
        sortedEffects.forEach((effect) => {
            nextContext = effect.modifyIncomingDamage?.(nextContext) ?? nextContext;
        });
        return nextContext;
    }

    beforeHealingReceived(context = {}) {
        let nextContext = { ...context, amount: Math.max(0, context.amount ?? 0) };
        this.activeEffects.forEach((effect) => {
            if (effect.expired) return;
            nextContext = effect.modifyIncomingHealing?.(nextContext) ?? nextContext;
        });
        return nextContext;
    }

    notifyHitReceived(event = {}) {
        const timeNow = this.scene?.time?.now ?? 0;
        if (this.canUseBlockFreeze()) {
            const damageTaken = Math.max(0, Number(event.damageTaken ?? event.healthDamage ?? 0) || 0);
            if (damageTaken > 0) {
                this.recentDamageSamples.push({ timeNow, damage: damageTaken });
                this.updateDamageTriggeredBlockFreeze(timeNow);
            } else {
                this.pruneRecentDamageSamples(timeNow);
            }
        }
        this.activeEffects.forEach((effect) => {
            if (effect.expired) return;
            effect.onHitReceived?.(event);
        });
        this.system.synergyHandler.handleHit(event);
    }

    notifyHitDealt(event = {}) {
        this.activeEffects.forEach((effect) => {
            if (effect.expired) return;
            effect.onHitDealt?.(event);
        });
    }

    notifyKill(event = {}) {
        this.activeEffects.forEach((effect) => {
            if (effect.expired) return;
            effect.onKill?.(event);
        });
        this.system.synergyHandler.handleKill(event);
    }
}

export default class StatusEffectSystem {
    constructor(scene) {
        this.scene = scene;
        this.effectClasses = new Map(Object.entries(EFFECT_CLASS_MAP));
        this.components = new WeakMap();
        this.synergyResolver = new StatusSynergyResolver(this);
        this.synergyHandler = new StatusSynergyHandler(this);
        this.activeTrailClouds = [];
        this.trailPoisonApplyTimes = new WeakMap();

        this.handleSceneUpdate = this.handleSceneUpdate.bind(this);
        this.handleSceneShutdown = this.handleSceneShutdown.bind(this);
        this.scene?.events?.on?.(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate);
        this.scene?.events?.once?.(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown);
    }

    handleSceneUpdate(_time, delta = 0) {
        this.updateTrailClouds(delta);
    }

    handleSceneShutdown() {
        this.scene?.events?.off?.(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate);
        this.activeTrailClouds.forEach((cloud) => this.destroyTrailCloud(cloud));
        this.activeTrailClouds.length = 0;
    }

    destroyTrailCloud(cloud) {
        if (!cloud) return;
        cloud.mistLayers?.forEach((shape) => shape?.destroy?.());
    }

    updateTrailCloudVisual(cloud) {
        const lifeRatio = Phaser.Math.Clamp(cloud.remainingMs / Math.max(1, cloud.durationMs), 0, 1);
        const elapsedRatio = Phaser.Math.Clamp(cloud.elapsedMs / Math.max(1, cloud.durationMs), 0, 1);
        const pulse = 0.5 + (Math.sin(cloud.pulsePhase) * 0.5);
        const fadeMultiplier = lifeRatio < 0.15 ? (lifeRatio / 0.15) : 1;

        cloud.mistLayers.forEach((layer, index) => {
            if (!layer?.active) return;
            const baseAlpha = cloud.baseAlphas[index] ?? 0.18;
            const pulseAlpha = cloud.pulseAlphas[index] ?? 0.05;
            const driftX = cloud.driftX[index] ?? 0;
            const driftY = cloud.driftY[index] ?? 0;
            const scaleX = 1 + ((cloud.scaleXAmplitude[index] ?? 0.04) * pulse);
            const scaleY = 1 + ((cloud.scaleYAmplitude[index] ?? 0.02) * pulse);
            layer.x = cloud.centerX + (driftX * elapsedRatio);
            layer.y = cloud.centerY + (driftY * elapsedRatio);
            layer.alpha = Math.max(0, (baseAlpha + (pulseAlpha * pulse)) * fadeMultiplier);
            layer.scaleX = scaleX;
            layer.scaleY = scaleY;
        });
    }

    updateTrailCloudDamage(cloud) {
        const radiusSq = cloud.radius * cloud.radius;
        const timeNow = this.scene?.time?.now ?? Date.now();
        const enemyChildren = this.scene?.enemies?.getChildren?.() ?? [];
        enemyChildren.forEach((target) => {
            if (!target?.active || target?.isDead) return;
            const dx = target.x - cloud.centerX;
            const dy = target.y - cloud.centerY;
            if ((dx * dx) + (dy * dy) > radiusSq) return;
            const lastTrailPoisonAt = this.trailPoisonApplyTimes.get(target) ?? -Infinity;
            if ((timeNow - lastTrailPoisonAt) >= VENOM_TRAIL_POISON_REAPPLY_MS) {
                const hitDamageSnapshot = this.resolveOwnerDamageSnapshot(
                    cloud.ownerPlayerId,
                    cloud.source,
                    cloud.damage
                );
                this.applyEffect(target, 'poison', {
                    ownerPlayerId: cloud.ownerPlayerId,
                    source: cloud.source,
                    durationMs: cloud.poisonDurationMs,
                        hitDamageSnapshot: Math.max(1, hitDamageSnapshot),
                        tags: ['poison', 'cloud']
                });
                this.trailPoisonApplyTimes.set(target, timeNow);
            }
            if (cloud.damage <= 0) return;
            this.applyOwnedDamage(target, cloud.damage, {
                ownerPlayerId: cloud.ownerPlayerId,
                source: cloud.source,
                tags: cloud.tags,
                showDamageText: cloud.showDamageText,
                damageTextColor: '#7dff8d',
                damageTextFontSize: '7px'
            });
        });
    }

    updateTrailClouds(delta = 0) {
        if (!this.activeTrailClouds.length) return;
        const frameDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
        for (let index = this.activeTrailClouds.length - 1; index >= 0; index -= 1) {
            const cloud = this.activeTrailClouds[index];
            if (!cloud || !cloud.mistLayers?.some?.((shape) => shape?.active)) {
                this.destroyTrailCloud(cloud);
                this.activeTrailClouds.splice(index, 1);
                continue;
            }

            cloud.elapsedMs += frameDelta;
            cloud.remainingMs -= frameDelta;
            cloud.tickAccumulatorMs += frameDelta;
            cloud.pulsePhase += (frameDelta / cloud.pulseDurationMs) * Math.PI * 2;

            while (cloud.tickAccumulatorMs >= cloud.tickIntervalMs) {
                cloud.tickAccumulatorMs -= cloud.tickIntervalMs;
                this.updateTrailCloudDamage(cloud);
            }

            this.updateTrailCloudVisual(cloud);

            if (cloud.remainingMs > 0) continue;
            this.destroyTrailCloud(cloud);
            this.activeTrailClouds.splice(index, 1);
        }
    }

    registerEffect(effectKey, EffectClass) {
        if (!effectKey || typeof EffectClass !== 'function') return;
        this.effectClasses.set(effectKey, EffectClass);
    }

    createEffect(component, effectKey, options = {}) {
        const EffectClass = this.effectClasses.get(effectKey);
        if (!EffectClass) return null;
        return new EffectClass(component, {
            ...getStatusEffectDefaultOptions(effectKey),
            ...options
        });
    }

    attach(entity, options = {}) {
        if (!entity) return null;
        const existing = this.components.get(entity);
        if (existing) return existing;
        const component = new StatusEffectComponent(this, entity, options);
        this.components.set(entity, component);
        entity.statusEffects = component;
        entity.applyStatusEffect = (effectKey, effectOptions = {}) => component.applyEffect(effectKey, effectOptions);
        entity.getStatusAdjustedSpeed = (baseSpeed = entity.speed ?? 0) => component.getAdjustedSpeed(baseSpeed);
        return component;
    }

    getComponent(entity) {
        return entity?.statusEffects ?? this.components.get(entity) ?? null;
    }

    applyEffect(entity, effectKey, options = {}) {
        return this.getComponent(entity)?.applyEffect(effectKey, options) ?? null;
    }

    resolveOwnerSource(ownerPlayerId = null, source = null, tags = []) {
        return {
            ownerPlayerId: ownerPlayerId ?? source?.ownerPlayerId ?? source?.playerId ?? null,
            ownerEntityId: source?.ownerEntityId ?? source?.playerId ?? source?.name ?? null,
            source,
            tags: Array.from(new Set(tags ?? []))
        };
    }

    doesEntryMatchTrigger(entry = {}, event = {}) {
        const entryTrigger = entry.trigger ?? 'onHit';
        const eventTrigger = event.trigger ?? 'onHit';
        if (entryTrigger !== eventTrigger) return false;
        if (entry.requireCrit === true && !event.isCritical) return false;
        if (entry.requireKill === true && !event.didKill) return false;
        if (typeof entry.chance === 'number' && entry.chance < 1 && Math.random() > Math.max(0, entry.chance)) {
            return false;
        }
        const requiredAttackTags = Array.isArray(entry.requireAttackTags) ? entry.requireAttackTags : [];
        if (requiredAttackTags.length) {
            const attackTags = new Set(event.attackTags ?? []);
            const hasAllRequiredTags = requiredAttackTags.every((tag) => attackTags.has(tag));
            if (!hasAllRequiredTags) return false;
        }
        return true;
    }

    resolveEffectTargets(entry = {}, event = {}) {
        const targetMode = entry.target ?? 'target';
        if (targetMode === 'self') {
            return event.sourceOwner ? [event.sourceOwner] : [];
        }
        if (targetMode === 'owner') {
            return event.sourceOwner ? [event.sourceOwner] : [];
        }
        if (targetMode === 'source') {
            return event.source ? [event.source] : [];
        }
        if (targetMode === 'both') {
            return [event.target, event.sourceOwner].filter(Boolean);
        }
        return event.target ? [event.target] : [];
    }

    sanitizeEffectOptions(entry = {}, event = {}) {
        const ownerPlayer = event.sourceOwner
            ?? event.source?.owner
            ?? (event.ownerPlayerId ? this.scene?.getPlayerById?.(event.ownerPlayerId) : null)
            ?? null;
        const ownerRunState = ownerPlayer
            ? this.scene?.getRunStateForPlayer?.(ownerPlayer)
            : null;
        const effectKey = entry?.key ?? entry?.effectKey ?? null;
        const sourceSkillKey = event.source?.skillType
            ?? event.source?.ownerSkillKey
            ?? event.source?.skillKey
            ?? null;
        const usesOwnerDamageSnapshot = effectKey === 'burn' || effectKey === 'poison' || effectKey === 'bleed';
        const nextOptions = {
            ...entry,
            hitDamageSnapshot: entry.hitDamageSnapshot ?? (
                usesOwnerDamageSnapshot && ownerPlayer?.getStatusEffectDamageSnapshot
                    ? ownerPlayer.getStatusEffectDamageSnapshot(sourceSkillKey)
                    : (event.damageTaken ?? event.damage ?? 0)
            ),
            ownerPlayerId: entry.ownerPlayerId ?? event.ownerPlayerId ?? event.source?.ownerPlayerId ?? event.source?.playerId ?? null,
            source: event.source ?? null,
            sourceEntityId: event.source?.ownerEntityId ?? event.source?.playerId ?? null
        };
        const isSupporterSource = Boolean(
            event.source?.supporter
            || String(event.source?.ownerSkillKey ?? '').startsWith('supporter_')
            || (event.attackTags ?? []).includes('supporter')
        );
        if (isSupporterSource && ownerPlayer) {
            const effectDurationMultiplier = Math.max(0.1, ownerPlayer.globalEffectDurationMultiplier ?? 1);
            const effectDamageMultiplier = Math.max(0.01, ownerPlayer.globalEffectDamageMultiplier ?? 1);
            if (Number.isFinite(nextOptions.durationMs) && (nextOptions.durationMs ?? 0) > 0) {
                nextOptions.durationMs = Math.max(1, Math.round(nextOptions.durationMs * effectDurationMultiplier));
            }
            if (effectKey === 'burn' || effectKey === 'poison' || effectKey === 'bleed' || effectKey === 'explosion' || effectKey === 'shock') {
                if (Number.isFinite(nextOptions.hitDamageSnapshot)) {
                    nextOptions.hitDamageSnapshot = Math.max(0, nextOptions.hitDamageSnapshot * effectDamageMultiplier);
                }
                if (Number.isFinite(nextOptions.damagePerTick)) {
                    nextOptions.damagePerTick = Math.max(1, Math.round(nextOptions.damagePerTick * effectDamageMultiplier));
                }
                if (Number.isFinite(nextOptions.minDamagePerTick)) {
                    nextOptions.minDamagePerTick = Math.max(1, Math.round(nextOptions.minDamagePerTick * effectDamageMultiplier));
                }
                if (Number.isFinite(nextOptions.trailDamage)) {
                    nextOptions.trailDamage = Math.max(1, Math.round(nextOptions.trailDamage * effectDamageMultiplier));
                }
                if (Number.isFinite(nextOptions.burstDamage)) {
                    nextOptions.burstDamage = Math.max(1, Math.round(nextOptions.burstDamage * effectDamageMultiplier));
                }
                if (Number.isFinite(nextOptions.damage)) {
                    nextOptions.damage = Math.max(1, Math.round(nextOptions.damage * effectDamageMultiplier));
                }
                if (Number.isFinite(nextOptions.chainDamage)) {
                    nextOptions.chainDamage = Math.max(1, Math.round(nextOptions.chainDamage * effectDamageMultiplier));
                }
            }
        }
        if ((entry?.key ?? entry?.effectKey) === 'shock') {
            const shockEffectBonuses = Object.values(ownerRunState?.shopEffectBonuses ?? {}).reduce((merged, itemBonuses) => {
                const shockBonuses = itemBonuses?.shock;
                if (!shockBonuses || typeof shockBonuses !== 'object') return merged;
                return {
                    ...merged,
                    ...shockBonuses,
                    chainCount: (merged.chainCount ?? 0) + (shockBonuses.chainCount ?? 0),
                    chainDamageBonus: (merged.chainDamageBonus ?? 0) + (shockBonuses.chainDamageBonus ?? 0)
                };
            }, {});
            if (Number.isFinite(shockEffectBonuses.chainCount) && shockEffectBonuses.chainCount !== 0) {
                nextOptions.chainCount = Math.max(1, (nextOptions.chainCount ?? 3) + shockEffectBonuses.chainCount);
            }
            const shopChainDamageBonus = Math.max(0, shockEffectBonuses.chainDamageBonus ?? 0);
            if (shopChainDamageBonus > 0) {
                nextOptions.chainMinimumDamageRatio = Math.max(
                    nextOptions.chainMinimumDamageRatio ?? 0.3,
                    (nextOptions.chainMinimumDamageRatio ?? 0.3) + shopChainDamageBonus
                );
                nextOptions.chainInitialDamageRatio = Math.max(
                    nextOptions.chainInitialDamageRatio ?? 0.75,
                    (nextOptions.chainInitialDamageRatio ?? 0.75) + shopChainDamageBonus
                );
                if (Array.isArray(nextOptions.chainDamageRatios) && nextOptions.chainDamageRatios.length) {
                    nextOptions.chainDamageRatios = nextOptions.chainDamageRatios.map((ratio) => Math.max(0, (ratio ?? 0) + shopChainDamageBonus));
                }
            }
            const chainCountBonus = Math.max(0, ownerPlayer?.shockChainCountBonus ?? 0);
            if (chainCountBonus > 0) {
                nextOptions.chainCount = Math.max(1, (nextOptions.chainCount ?? 3) + chainCountBonus);
            }
            const chainDamageBonus = Math.max(0, ownerPlayer?.shockChainDamageBonus ?? 0);
            if (chainDamageBonus > 0) {
                nextOptions.chainMinimumDamageRatio = Math.max(
                    nextOptions.chainMinimumDamageRatio ?? 0.3,
                    (nextOptions.chainMinimumDamageRatio ?? 0.3) + chainDamageBonus
                );
                nextOptions.chainInitialDamageRatio = Math.max(
                    nextOptions.chainInitialDamageRatio ?? 0.75,
                    (nextOptions.chainInitialDamageRatio ?? 0.75) + chainDamageBonus
                );
                if (Array.isArray(nextOptions.chainDamageRatios) && nextOptions.chainDamageRatios.length) {
                    nextOptions.chainDamageRatios = nextOptions.chainDamageRatios.map((ratio) => Math.max(0, (ratio ?? 0) + chainDamageBonus));
                }
            }
        }
        return nextOptions;
    }

    resolveOwnerDamageSnapshot(ownerPlayerId = null, source = null, fallbackDamage = 0) {
        const ownerPlayer = source?.owner
            ?? (ownerPlayerId ? this.scene?.getPlayerById?.(ownerPlayerId) : null)
            ?? null;
        const sourceSkillKey = source?.skillType
            ?? source?.ownerSkillKey
            ?? source?.skillKey
            ?? null;
        if (ownerPlayer?.getStatusEffectDamageSnapshot) {
            return Math.max(0, ownerPlayer.getStatusEffectDamageSnapshot(sourceSkillKey));
        }
        return Math.max(0, fallbackDamage ?? 0);
    }

    applyConfiguredEffects(statusEntries = [], event = {}) {
        if (!Array.isArray(statusEntries) || !statusEntries.length) return [];
        const normalizedEntries = statusEntries.filter(Boolean).slice(0, 1);
        const appliedEffects = [];
        normalizedEntries.forEach((entry) => {
            const effectKey = entry?.key ?? entry?.effectKey ?? null;
            if (!effectKey) return;
            if (!this.doesEntryMatchTrigger(entry, event)) return;
            const effectTargets = this.resolveEffectTargets(entry, event);
            if (!effectTargets.length) return;
            const effectOptions = this.sanitizeEffectOptions(entry, event);
            effectTargets.forEach((effectTarget) => {
                const applied = this.applyEffect(effectTarget, effectKey, effectOptions);
                if (applied) {
                    appliedEffects.push(applied);
                }
            });
        });
        return appliedEffects;
    }

    notifyHit(event = {}) {
        const targetComponent = this.getComponent(event.target);
        targetComponent?.notifyHitReceived(event);
        this.applyLifestealFromEvent(event);
        const sourceOwner = this.resolveEventSourceOwner(event);
        const sourceComponent = this.getComponent(sourceOwner);
        sourceComponent?.notifyHitDealt(event);
        sourceOwner?.handleHitDealt?.(event);
    }

    notifyKill(event = {}) {
        const targetComponent = this.getComponent(event.target);
        targetComponent?.notifyKill(event);
    }

    shouldIgnoreArmorForOwnedDamage(options = {}) {
        if (options.ignoreArmor === true) return true;
        const statusKey = options.statusKey ?? options.statusEffect?.key ?? null;
        if (statusKey === 'burn' || statusKey === 'poison' || statusKey === 'bleed') {
            return true;
        }
        const tagSet = new Set(Array.isArray(options.tags) ? options.tags : []);
        if (tagSet.has('dot')) {
            return true;
        }
        if (tagSet.has('poison') && (tagSet.has('trail') || tagSet.has('cloud'))) {
            return true;
        }
        return false;
    }

    applyOwnedDamage(target, amount, options = {}) {
        if (!target?.takeDamage || !Number.isFinite(amount) || amount <= 0) return null;
        const source = options.source ?? {
            ownerPlayerId: options.ownerPlayerId ?? null,
            ownerEntityId: options.ownerEntityId ?? null,
            ownerSkillKey: options.ownerSkillKey ?? null
        };
        const ignoreArmor = this.shouldIgnoreArmorForOwnedDamage(options);
        const damageResult = target.takeDamage(
            amount,
            options.force ?? 0,
            options.direction ?? null,
            source,
            {
                damageSource: source,
                ownerPlayerId: options.ownerPlayerId ?? source?.ownerPlayerId ?? null,
                attackTags: options.tags ?? [],
                fromStatusEffect: true,
                ignoreArmor,
                statusKey: options.statusKey ?? null,
                statusEffect: options.statusEffect ?? null,
                isCritical: options.isCritical ?? false
            },
            options.skillConfig ?? null
        );
        this.applyLifestealFromDamageResult(damageResult, {
            sourceOwner: this.resolveEventSourceOwner({
                source,
                sourceOwner: options.sourceOwner ?? null,
                ownerPlayerId: options.ownerPlayerId ?? source?.ownerPlayerId ?? null
            })
        });
        this.showOwnedDamageText(target, damageResult, options);
        return damageResult;
    }

    resolveEventSourceOwner(event = {}) {
        return event.sourceOwner
            ?? event.source?.owner
            ?? event.source?.supporter?.owner
            ?? event.source?.ownerEntity
            ?? event.source?.ownerPlayer
            ?? (event.ownerPlayerId ? this.scene?.getPlayerById?.(event.ownerPlayerId) : null)
            ?? null;
    }

    applyLifestealFromDamageResult(damageResult = {}, options = {}) {
        const sourceOwner = options.sourceOwner ?? null;
        if (!sourceOwner?.heal) return;
        const lifestealRatio = Math.max(0, Number(sourceOwner.lifesteal ?? 0) || 0);
        if (lifestealRatio <= 0) return;
        const damageTaken = Math.max(0, Math.floor(Number(damageResult?.healthDamage ?? 0) || 0));
        if (damageTaken <= 0) return;
        const healAmount = Math.floor(damageTaken * lifestealRatio);
        if (healAmount <= 0) return;
        sourceOwner.heal(healAmount);
    }

    applyLifestealFromEvent(event = {}) {
        this.applyLifestealFromDamageResult(
            { healthDamage: event.damageTaken ?? event.damage ?? 0 },
            { sourceOwner: this.resolveEventSourceOwner(event) }
        );
    }

    showOwnedDamageText(target, damageResult, options = {}) {
        if (!options.showDamageText || !target?.scene) return;
        const damageValue = Math.max(0, Math.round(damageResult?.healthDamage ?? 0));
        if (damageValue <= 0) return;
        target.scene?.skillBehaviorPipeline?.effects?.showDamageText?.(target, damageValue, {
            color: options.damageTextColor ?? '#ffffff',
            fontSize: options.damageTextFontSize ?? '7px',
            stroke: options.damageTextStroke ?? '#000000',
            strokeThickness: options.damageTextStrokeThickness ?? 2,
            rise: options.damageTextRise ?? 26,
            duration: options.damageTextDuration ?? 560
        });
    }

    getOpposingTargets(entity) {
        if (!entity?.scene) return [];
        const scene = entity.scene;
        const isEnemy = Boolean(scene.enemies?.contains?.(entity));
        if (isEnemy) {
            return scene.getActivePlayers?.() ?? [];
        }
        return scene.enemies?.getChildren?.()?.filter((target) => target?.active && !target?.isDead) ?? [];
    }

    getSameFactionTargets(entity) {
        if (!entity?.scene) return [];
        const scene = entity.scene;
        const isEnemy = Boolean(scene.enemies?.contains?.(entity));
        if (isEnemy) {
            return scene.enemies?.getChildren?.()?.filter((target) => target?.active && !target?.isDead && target !== entity) ?? [];
        }
        return (scene.getActivePlayers?.() ?? []).filter((target) => target?.active && !target?.isDead && target !== entity);
    }

    getEnemyTargets(entity, options = {}) {
        const scene = entity?.scene ?? this.scene;
        if (!scene?.enemies?.getChildren) return [];
        const excludeEntity = options.excludeEntity !== false;
        return scene.enemies.getChildren().filter((target) => {
            if (!target?.active || target?.isDead) return false;
            if (excludeEntity && target === entity) return false;
            return true;
        });
    }

    getPlayerTargets(entity, options = {}) {
        const scene = entity?.scene ?? this.scene;
        if (!scene?.getActivePlayers) return [];
        const excludeEntity = options.excludeEntity !== false;
        return scene.getActivePlayers().filter((target) => {
            if (!target?.active || target?.isDead) return false;
            if (excludeEntity && target === entity) return false;
            return true;
        });
    }

    getTargetsForAreaEffect(entity, options = {}) {
        const targetMode = options.targetMode ?? 'auto';
        if (targetMode === 'enemies') {
            return this.getEnemyTargets(entity, options);
        }
        if (targetMode === 'players') {
            return this.getPlayerTargets(entity, options);
        }
        if (targetMode === 'opponents') {
            return this.getOpposingTargets(entity);
        }
        const isPlayerOwned = options.ownerPlayerId != null
            || options.source?.ownerPlayerId != null
            || options.source?.playerId != null
            || options.source?.owner?.playerId != null;
        if (isPlayerOwned) {
            return this.getEnemyTargets(entity, options);
        }
        return this.getOpposingTargets(entity);
    }

    explodeAround(entity, options = {}) {
        const targets = this.getTargetsForAreaEffect(entity, options);
        const radius = Math.max(1, options.radius ?? 90);
        const radiusSq = radius * radius;
        const sourceKnockback = Math.max(0, options.source?.knockback ?? options.source?.config?.knockback ?? 0);
        const forceMultiplier = Math.max(0, options.forceMultiplier ?? 1);
        const explosionForce = Math.max(0, Math.round(sourceKnockback * forceMultiplier));
        targets.forEach((target) => {
            if (!target?.active || target === entity || target.isDead) return;
            const dx = target.x - entity.x;
            const dy = target.y - entity.y;
            if ((dx * dx) + (dy * dy) > radiusSq) return;
            const direction = new Phaser.Math.Vector2(dx, dy);
            if (direction.lengthSq() > 0) {
                direction.normalize();
            }
            this.applyOwnedDamage(target, options.damage ?? 1, {
                ownerPlayerId: options.ownerPlayerId ?? null,
                source: options.source ?? null,
                force: explosionForce,
                direction,
                tags: options.tags ?? ['explosion']
            });
        });
    }

    spreadStatusAround(entity, effectKey, effectOptions = {}, options = {}) {
        const targets = this.getTargetsForAreaEffect(entity, options);
        const radius = Math.max(1, options.radius ?? 90);
        const radiusSq = radius * radius;
        targets.forEach((target) => {
            if (!target?.active || target === entity || target.isDead) return;
            const dx = target.x - entity.x;
            const dy = target.y - entity.y;
            if ((dx * dx) + (dy * dy) > radiusSq) return;
            this.applyEffect(target, effectKey, {
                ...effectOptions,
                ownerPlayerId: options.ownerPlayerId ?? effectOptions.ownerPlayerId ?? null,
                source: options.source ?? effectOptions.source ?? null
            });
        });
    }

    chainLightningFrom(entity, options = {}) {
        const targetMode = options.targetMode ?? 'sameFaction';
        const targetPool = targetMode === 'enemies'
            ? this.getEnemyTargets(entity)
            : this.getSameFactionTargets(entity);
        const targets = targetPool
            .filter((target) => target?.active && !target?.isDead && target !== entity)
            .map((target) => ({
                target,
                distance: Phaser.Math.Distance.Between(entity.x, entity.y, target.x, target.y)
            }))
            .filter((entry) => entry.distance <= (options.chainRadius ?? 120))
            .sort((left, right) => left.distance - right.distance)
            .slice(0, options.chainCount ?? 3);

        const ratios = Array.isArray(options.damageRatios) && options.damageRatios.length
            ? options.damageRatios
            : this.buildChainDamageRatios(options.chainCount ?? 3, {
                initialDamageRatio: options.initialDamageRatio ?? 0.75,
                damageDecayFactor: options.damageDecayFactor ?? 0.75,
                minimumDamageRatio: options.minimumDamageRatio ?? 0.3
            });
        const stepDelayMs = Math.max(0, options.stepDelayMs ?? 90);
        const baseDamage = Math.max(1, Math.round(options.baseDamage ?? options.damage ?? 8));
        let previousSource = entity;

        targets.forEach((entry, index) => {
            const ratio = Math.max(0, ratios[index] ?? ratios[ratios.length - 1] ?? 0.25);
            const damage = Math.max(1, Math.round(baseDamage * ratio));
            this.scene?.time?.delayedCall?.(index * stepDelayMs, () => {
                if (!entry.target?.active || entry.target?.isDead) return;
                const sourcePoint = {
                    x: previousSource?.x ?? entity.x,
                    y: previousSource?.y ?? entity.y
                };
                this.scene?.skillBehaviorPipeline?.effects?.spawnChainLightning?.(
                    sourcePoint,
                    entry.target,
                    (entry.target.depth ?? entity.depth ?? 20) + 6,
                    {
                        color: 0x79dfff,
                        glowColor: 0xe6fcff,
                        particleCount: 7 + index,
                        duration: 120 + (index * 20)
                    }
                );
                const direction = new Phaser.Math.Vector2(entry.target.x - sourcePoint.x, entry.target.y - sourcePoint.y);
                if (direction.lengthSq() > 0) direction.normalize();
                this.applyOwnedDamage(entry.target, damage, {
                    ownerPlayerId: options.ownerPlayerId ?? null,
                    source: options.source ?? null,
                    direction,
                    tags: ['lightning', 'shock', 'chain'],
                    showDamageText: true,
                    damageTextColor: '#8ce8ff',
                    damageTextFontSize: '7px'
                });
                if (options.spreadEffectKey) {
                    this.applyEffect(entry.target, options.spreadEffectKey, {
                        ...(options.spreadEffectOptions ?? {}),
                        ownerPlayerId: options.ownerPlayerId ?? options.spreadEffectOptions?.ownerPlayerId ?? null,
                        source: options.source ?? options.spreadEffectOptions?.source ?? null
                    });
                }
                const spreadSecondaryEffects = Array.isArray(options.spreadSecondaryEffects)
                    ? options.spreadSecondaryEffects
                    : [];
                spreadSecondaryEffects.forEach((extraEffect) => {
                    const effectKey = extraEffect?.effectKey ?? extraEffect?.key ?? null;
                    if (!effectKey) return;
                    this.applyEffect(entry.target, effectKey, {
                        ...(extraEffect.effectOptions ?? {}),
                        ownerPlayerId: options.ownerPlayerId ?? extraEffect?.effectOptions?.ownerPlayerId ?? null,
                        source: options.source ?? extraEffect?.effectOptions?.source ?? null
                    });
                });
                previousSource = entry.target;
            });
        });
    }

    buildChainDamageRatios(chainCount = 3, options = {}) {
        const resolvedCount = Math.max(1, Math.round(chainCount));
        const initialDamageRatio = Phaser.Math.Clamp(options.initialDamageRatio ?? 0.75, 0.05, 1);
        const damageDecayFactor = Phaser.Math.Clamp(options.damageDecayFactor ?? 0.75, 0.1, 1);
        const minimumDamageRatio = Phaser.Math.Clamp(options.minimumDamageRatio ?? 0.3, 0.05, 1);
        const ratios = [];
        let currentRatio = initialDamageRatio;
        for (let index = 0; index < resolvedCount; index += 1) {
            ratios.push(Math.max(minimumDamageRatio, currentRatio));
            currentRatio *= damageDecayFactor;
        }
        return ratios;
    }

    applyTrailDamage(entity, options = {}) {
        const targets = this.getOpposingTargets(entity);
        const radius = Math.max(1, options.radius ?? 48);
        const radiusSq = radius * radius;
        targets.forEach((target) => {
            if (!target?.active || target === entity || target.isDead) return;
            const dx = target.x - entity.x;
            const dy = target.y - entity.y;
            if ((dx * dx) + (dy * dy) > radiusSq) return;
            this.applyOwnedDamage(target, options.damage ?? 1, {
                ownerPlayerId: options.ownerPlayerId ?? null,
                source: options.source ?? null,
                tags: options.tags ?? ['poison', 'trail']
            });
        });
    }

    spawnPoisonCloud(entity, options = {}) {
        if (!entity?.scene || !this.scene) return;
        const radius = Math.max(12, (options.radius ?? 84) * 0.5);
        const tickIntervalMs = Math.max(100, options.tickIntervalMs ?? 500);
        const durationMs = Math.max(tickIntervalMs, options.durationMs ?? 3000);
        const damage = Math.max(0, Math.round(options.damage ?? 1));
        const poisonDurationMs = Math.max(500, options.poisonDurationMs ?? 3000);
        const showDamageText = Boolean(options.showDamageText);
        const visualProfile = options.visualProfile ?? 'default';
        const isTrailProfile = visualProfile === 'trail';
        const centerX = Number.isFinite(options.x) ? options.x : entity.x;
        const centerY = Number.isFinite(options.y) ? options.y : entity.y;
        const depth = (entity.depth ?? 20) + 1;
        const affectedTargets = new WeakSet();

        const mistLayers = isTrailProfile
            ? [
                this.scene.add.ellipse(centerX, centerY + 2, radius * 1.3, radius * 0.6, 0x17684a, 0.3),
                this.scene.add.ellipse(centerX + radius * 0.12, centerY, radius * 0.92, radius * 0.42, 0x2aa36f, 0.36)
            ]
            : [
                this.scene.add.circle(centerX, centerY + 2, radius * 0.72, 0x1f8f4e, 0.24),
                this.scene.add.circle(centerX - radius * 0.3, centerY + radius * 0.1, radius * 0.62, 0x49d96a, 0.3),
                this.scene.add.circle(centerX + radius * 0.28, centerY - radius * 0.08, radius * 0.56, 0xaaffc1, 0.26),
                this.scene.add.circle(centerX, centerY - radius * 0.04, radius * 0.34, 0xe9fff1, 0.08),
                this.scene.add.circle(centerX, centerY + 1, radius * 0.9, 0x6dff9b, 0.06).setStrokeStyle(2, 0xb6ffcf, 0.45)
            ];
        mistLayers.forEach((layer, index) => {
            layer.setDepth(depth + index);
        });

        if (isTrailProfile) {
            const trailCloud = {
                centerX,
                centerY,
                radius,
                durationMs,
                remainingMs: durationMs,
                elapsedMs: 0,
                tickIntervalMs,
                tickAccumulatorMs: 0,
                poisonDurationMs,
                damage,
                showDamageText,
                ownerPlayerId: options.ownerPlayerId ?? null,
                source: options.source ?? null,
                tags: options.tags ?? ['poison', 'cloud'],
                affectedTargets,
                mistLayers,
                pulsePhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
                pulseDurationMs: 1150,
                baseAlphas: [0.18, 0.24],
                pulseAlphas: [0.05, 0.06],
                driftX: [0, radius * 0.05],
                driftY: [0.75, -0.25],
                scaleXAmplitude: [0.06, 0.08],
                scaleYAmplitude: [0.02, 0.03]
            };
            this.updateTrailCloudVisual(trailCloud);
            this.activeTrailClouds.push(trailCloud);
            return;
        }

        const pulseTween = this.scene.tweens.add({
            targets: mistLayers,
            alpha: { from: 0.16, to: 0.34 },
            scaleX: { from: 0.97, to: 1.12 },
            scaleY: { from: 0.97, to: 1.14 },
            y: `-=${Math.max(1, Math.round(radius * 0.08))}`,
            duration: 960,
            yoyo: true,
            repeat: -1
        });

        const puffEvent = this.scene.time.addEvent({
            delay: 120,
            repeat: Math.max(0, Math.floor(durationMs / 120)),
            callback: () => {
                const puffX = centerX + Phaser.Math.Between(-Math.round(radius * 0.7), Math.round(radius * 0.7));
                const puffY = centerY + Phaser.Math.Between(-Math.round(radius * 0.25), Math.round(radius * 0.4));
                const puffRadius = Phaser.Math.Between(
                    Math.max(5, Math.round(radius * 0.12)),
                    Math.max(8, Math.round(radius * 0.2))
                );
                const puff = this.scene.add.circle(
                    puffX,
                    puffY,
                    puffRadius,
                    Phaser.Math.RND.pick([0xcffff0, 0xaaffc1, 0x6fe88f]),
                    0.24
                );
                puff.setDepth(depth + 3);
                this.scene.tweens.add({
                    targets: puff,
                    x: puffX + Phaser.Math.Between(-5, 5),
                    y: puffY - Phaser.Math.Between(8, 14),
                    alpha: 0,
                    scaleX: Phaser.Math.FloatBetween(1.2, 1.45),
                    scaleY: Phaser.Math.FloatBetween(1.2, 1.45),
                    duration: Phaser.Math.Between(700, 900),
                    onComplete: () => puff.destroy()
                });
            }
        });

        const tickEvent = this.scene.time.addEvent({
            delay: tickIntervalMs,
            repeat: Math.max(0, Math.floor(durationMs / tickIntervalMs) - 1),
            callback: () => {
                const radiusSq = radius * radius;
                const targets = this.getTargetsForAreaEffect(entity, {
                    targetMode: options.targetMode ?? 'auto',
                    excludeEntity: true
                });
                targets.forEach((target) => {
                    if (!target?.active || target?.isDead) return;
                    const dx = target.x - centerX;
                    const dy = target.y - centerY;
                    if ((dx * dx) + (dy * dy) > radiusSq) return;
                    if (!affectedTargets.has(target)) {
                        const hitDamageSnapshot = this.resolveOwnerDamageSnapshot(
                            options.ownerPlayerId ?? null,
                            options.source ?? null,
                            damage
                        );
                        this.applyEffect(target, 'poison', {
                            ownerPlayerId: options.ownerPlayerId ?? null,
                            source: options.source ?? null,
                            durationMs: poisonDurationMs,
                            hitDamageSnapshot: Math.max(1, hitDamageSnapshot),
                            tags: ['poison', 'cloud']
                        });
                        affectedTargets.add(target);
                    }
                    if (damage <= 0) return;
                    this.applyOwnedDamage(target, damage, {
                        ownerPlayerId: options.ownerPlayerId ?? null,
                        source: options.source ?? null,
                        tags: options.tags ?? ['poison', 'cloud'],
                        showDamageText,
                        damageTextColor: '#7dff8d',
                        damageTextFontSize: '7px'
                    });
                });
            }
        });

        this.scene.time.delayedCall(durationMs, () => {
            tickEvent.remove(false);
            puffEvent?.remove?.(false);
            pulseTween?.remove?.();
            mistLayers.forEach((shape) => {
                this.scene.tweens.add({
                    targets: shape,
                    alpha: 0,
                    scaleX: 0.72,
                    scaleY: 0.72,
                    y: '-=8',
                    duration: 220,
                    onComplete: () => shape.destroy()
                });
            });
        });
    }

    spawnBurnCloud(entity, options = {}) {
        if (!entity?.scene || !this.scene) return;
        const radius = Math.max(12, (options.radius ?? 84) * 0.5);
        const tickIntervalMs = Math.max(100, options.tickIntervalMs ?? 500);
        const durationMs = Math.max(tickIntervalMs, options.durationMs ?? 1800);
        const damage = Math.max(0, Math.round(options.damage ?? 0));
        const burnDurationMs = Math.max(500, options.burnDurationMs ?? 2500);
        const showDamageText = Boolean(options.showDamageText);
        const centerX = Number.isFinite(options.x) ? options.x : entity.x;
        const centerY = Number.isFinite(options.y) ? options.y : entity.y;
        const depth = (entity.depth ?? 20) + 1;
        const affectedTargets = new WeakSet();

        const flameLayers = [
            this.scene.add.circle(centerX, centerY + 2, radius * 0.7, 0xff5a1f, 0.26),
            this.scene.add.circle(centerX - radius * 0.24, centerY + radius * 0.06, radius * 0.54, 0xff8d2f, 0.32),
            this.scene.add.circle(centerX + radius * 0.2, centerY - radius * 0.04, radius * 0.46, 0xffc15a, 0.26),
            this.scene.add.circle(centerX, centerY, radius * 0.88, 0xffd27a, 0.05).setStrokeStyle(2, 0xffb347, 0.5)
        ];
        flameLayers.forEach((layer, index) => {
            layer.setDepth(depth + index);
        });

        const pulseTween = this.scene.tweens.add({
            targets: flameLayers,
            alpha: { from: 0.16, to: 0.38 },
            scaleX: { from: 0.94, to: 1.14 },
            scaleY: { from: 0.94, to: 1.18 },
            y: `-=${Math.max(1, Math.round(radius * 0.06))}`,
            duration: 320,
            yoyo: true,
            repeat: -1
        });

        const tickEvent = this.scene.time.addEvent({
            delay: tickIntervalMs,
            repeat: Math.max(0, Math.floor(durationMs / tickIntervalMs) - 1),
            callback: () => {
                const radiusSq = radius * radius;
                const targets = this.getTargetsForAreaEffect(entity, {
                    targetMode: options.targetMode ?? 'auto',
                    excludeEntity: true
                });
                targets.forEach((target) => {
                    if (!target?.active || target?.isDead) return;
                    const dx = target.x - centerX;
                    const dy = target.y - centerY;
                    if ((dx * dx) + (dy * dy) > radiusSq) return;
                    if (!affectedTargets.has(target)) {
                        const hitDamageSnapshot = this.resolveOwnerDamageSnapshot(
                            options.ownerPlayerId ?? null,
                            options.source ?? null,
                            Math.max(1, damage)
                        );
                        this.applyEffect(target, 'burn', {
                            ownerPlayerId: options.ownerPlayerId ?? null,
                            source: options.source ?? null,
                            durationMs: burnDurationMs,
                            hitDamageSnapshot: Math.max(1, hitDamageSnapshot),
                            tags: ['fire', 'burn', 'cloud']
                        });
                        affectedTargets.add(target);
                    }
                    if (damage <= 0) return;
                    this.applyOwnedDamage(target, damage, {
                        ownerPlayerId: options.ownerPlayerId ?? null,
                        source: options.source ?? null,
                        tags: options.tags ?? ['fire', 'burn', 'cloud'],
                        showDamageText,
                        damageTextColor: '#ff9a4d',
                        damageTextFontSize: '7px'
                    });
                });
            }
        });

        this.scene.time.delayedCall(durationMs, () => {
            tickEvent.remove(false);
            pulseTween?.remove?.();
            flameLayers.forEach((shape) => {
                this.scene.tweens.add({
                    targets: shape,
                    alpha: 0,
                    scaleX: 0.72,
                    scaleY: 0.72,
                    duration: 180,
                    onComplete: () => shape.destroy()
                });
            });
        });
    }

    spawnRitualZoneCloud(entity, options = {}) {
        if (!entity?.scene || !this.scene) return;
        const radius = Math.max(18, (options.radius ?? 110) * 0.5);
        const tickIntervalMs = Math.max(100, options.tickIntervalMs ?? 450);
        const durationMs = Math.max(tickIntervalMs, options.durationMs ?? 1800);
        const damage = Math.max(0, Math.round(options.damage ?? 0));
        const slowDurationMs = Math.max(150, options.slowDurationMs ?? 550);
        const slowMultiplier = Phaser.Math.Clamp(options.slowMultiplier ?? 0.6, 0.05, 1);
        const showDamageText = Boolean(options.showDamageText);
        const centerX = Number.isFinite(options.x) ? options.x : entity.x;
        const centerY = Number.isFinite(options.y) ? options.y : entity.y;
        const depth = (options.depth ?? (entity.depth ?? 20) + 1);

        // "Cursed circle" look: layered soft fills, no explicit border/stroke.
        // Palette: heavy purple curse with subtle toxic accent.
        const base = this.scene.add.ellipse(centerX, centerY + 2, radius * 2.05, radius * 1.32, 0x05020a, 0.32).setDepth(depth);
        const haze = this.scene.add.circle(centerX, centerY, radius * 1.18, 0x12061d, 0.20).setDepth(depth + 1);
        const outerVeil = this.scene.add.ellipse(centerX, centerY + 2, radius * 1.98, radius * 1.26, 0x3b0c5a, 0.16).setDepth(depth + 2);
        const innerGlow = this.scene.add.circle(centerX, centerY, radius * 0.74, 0x8a2be2, 0.065).setDepth(depth + 3);
        const core = this.scene.add.circle(centerX, centerY, radius * 0.42, 0xd7a0ff, 0.04).setDepth(depth + 4);

        const runeContainer = this.scene.add.container(centerX, centerY).setDepth(depth + 4);
        const runeCount = 10;
        for (let i = 0; i < runeCount; i += 1) {
            const angle = (Math.PI * 2 * i) / runeCount;
            const dist = radius * Phaser.Math.FloatBetween(0.62, 0.92);
            const rune = this.scene.add.rectangle(
                Math.cos(angle) * dist,
                Math.sin(angle) * dist,
                Phaser.Math.Between(5, 9),
                Phaser.Math.Between(2, 4),
                Phaser.Utils.Array.GetRandom([0xd7a0ff, 0xb36bff, 0x8a2be2, 0x6c1b9a]),
                0.24
            );
            rune.setRotation(angle + Phaser.Math.FloatBetween(-0.35, 0.35));
            rune.setBlendMode(Phaser.BlendModes.ADD);
            runeContainer.add(rune);
        }

        const arcContainer = this.scene.add.container(centerX, centerY).setDepth(depth + 5);
        const arcCount = 3;
        for (let i = 0; i < arcCount; i += 1) {
            const g = this.scene.add.graphics();
            const arcRadius = radius * Phaser.Math.FloatBetween(0.55, 0.95);
            const arcWidth = Phaser.Math.Between(2, 4);
            const start = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const span = Phaser.Math.FloatBetween(Math.PI * 0.35, Math.PI * 0.7);
            g.lineStyle(arcWidth, Phaser.Utils.Array.GetRandom([0xd7a0ff, 0xb36bff, 0x8a2be2]), 0.16);
            g.beginPath();
            g.arc(0, 0, arcRadius, start, start + span);
            g.strokePath();
            g.setBlendMode(Phaser.BlendModes.ADD);
            g.rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);
            arcContainer.add(g);
        }

        const pulseTween = this.scene.tweens.add({
            targets: [base, haze, outerVeil, innerGlow, core],
            alpha: { from: 0.08, to: 0.24 },
            scaleX: { from: 0.975, to: 1.055 },
            scaleY: { from: 0.97, to: 1.08 },
            duration: 560,
            yoyo: true,
            repeat: -1
        });
        const runeSpinTween = this.scene.tweens.add({
            targets: runeContainer,
            rotation: { from: 0, to: Math.PI * 2 },
            duration: 2200,
            repeat: -1
        });
        const arcSpinTween = this.scene.tweens.add({
            targets: arcContainer,
            rotation: { from: 0, to: -Math.PI * 2 },
            duration: 3200,
            repeat: -1
        });

        const emberEvent = this.scene.time.addEvent({
            delay: 110,
            repeat: Math.max(0, Math.floor(durationMs / 110) - 1),
            callback: () => {
                const px = centerX + Phaser.Math.Between(-Math.round(radius * 0.8), Math.round(radius * 0.8));
                const py = centerY + Phaser.Math.Between(-Math.round(radius * 0.3), Math.round(radius * 0.4));
                const dot = this.scene.add.circle(px, py, Phaser.Math.Between(1, 2), Phaser.Utils.Array.GetRandom([0xd7a0ff, 0xb36bff, 0x8a2be2]), 0.26);
                dot.setDepth(depth + 6);
                dot.setBlendMode(Phaser.BlendModes.ADD);
                this.scene.tweens.add({
                    targets: dot,
                    y: py - Phaser.Math.Between(12, 20),
                    x: px + Phaser.Math.Between(-6, 6),
                    alpha: 0,
                    scaleX: 1.8,
                    scaleY: 1.8,
                    duration: Phaser.Math.Between(260, 420),
                    ease: 'Cubic.easeOut',
                    onComplete: () => dot.destroy()
                });
            }
        });

        const tickEvent = this.scene.time.addEvent({
            delay: tickIntervalMs,
            repeat: Math.max(0, Math.floor(durationMs / tickIntervalMs) - 1),
            callback: () => {
                const radiusSq = radius * radius;
                const targets = this.getTargetsForAreaEffect(entity, {
                    targetMode: options.targetMode ?? 'auto',
                    excludeEntity: true
                });
                targets.forEach((target) => {
                    if (!target?.active || target?.isDead) return;
                    const dx = target.x - centerX;
                    const dy = target.y - centerY;
                    if ((dx * dx) + (dy * dy) > radiusSq) return;
                    this.applyEffect(target, 'freeze', {
                        ownerPlayerId: options.ownerPlayerId ?? null,
                        source: options.source ?? null,
                        durationMs: slowDurationMs,
                        mode: 'slow',
                        slowMultiplier,
                        tags: ['ritual', 'slow']
                    });
                    if (damage <= 0) return;
                    this.applyOwnedDamage(target, damage, {
                        ownerPlayerId: options.ownerPlayerId ?? null,
                        source: options.source ?? null,
                        tags: options.tags ?? ['ritual', 'zone', 'dot'],
                        showDamageText,
                        damageTextColor: '#7dff8d',
                        damageTextFontSize: '7px'
                    });
                });
            }
        });

        this.scene.time.delayedCall(durationMs, () => {
            tickEvent.remove(false);
            pulseTween?.remove?.();
            runeSpinTween?.remove?.();
            arcSpinTween?.remove?.();
            emberEvent?.remove?.();
            [base, haze, outerVeil, innerGlow, core].forEach((shape) => {
                if (!shape?.active) return;
                this.scene.tweens.add({
                    targets: shape,
                    alpha: 0,
                    scaleX: 0.82,
                    scaleY: 0.82,
                    duration: 200,
                    onComplete: () => shape.destroy()
                });
            });
            if (runeContainer?.active) {
                this.scene.tweens.add({
                    targets: runeContainer,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => runeContainer.destroy()
                });
            }
            if (arcContainer?.active) {
                this.scene.tweens.add({
                    targets: arcContainer,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => arcContainer.destroy()
                });
            }
        });
    }
}

export {
    StatusEffect,
    BurnStatusEffect,
    FreezeStatusEffect,
    ShockStatusEffect,
    PoisonStatusEffect,
    BleedStatusEffect,
    ExplosionStatusEffect,
    ShieldStatusEffect,
    MarkStatusEffect,
    StatusSynergyHandler
};
