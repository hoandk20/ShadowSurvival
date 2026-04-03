import Supporter from '../entities/Supporter.js';
import SupporterOrb from '../entities/SupporterOrb.js';
import SupporterClawEffect from '../entities/effects/SupporterClawEffect.js';
import { applyDamageVariance } from '../utils/damageVariance.js';

export default class SupporterSystem {
    constructor(scene) {
        this.scene = scene;
        this.supporters = scene.add.group();
        this.orbs = scene.add.group();
        this.clawEffect = new SupporterClawEffect(scene);
    }

    update(time, delta) {
        this.supporters.children.each((supporter) => {
            supporter?.update?.(time, delta);
        });
        this.orbs.children.each((orb) => {
            orb?.update?.(time, delta);
        });
    }

    getSupporterForPlayer(playerId) {
        if (!playerId) return null;
        return this.supporters.getChildren().find((supporter) => supporter?.ownerPlayerId === playerId) ?? null;
    }

    syncPlayerSupporter(player, supporterKey = null) {
        if (!player) return null;
        const resolvedSupporterKey = supporterKey
            ?? player.selectedSupporterKey
            ?? this.scene?.selectedSupporterKey
            ?? null;
        const existing = this.getSupporterForPlayer(player.playerId);

        if (!resolvedSupporterKey) {
            existing?.destroy?.();
            return null;
        }

        if (existing && existing.supporterKey === resolvedSupporterKey) {
            existing.setOwner(player);
            existing.setRuntimeOverrides?.(this.scene?.buildDebugSupporterEffectOverride?.(resolvedSupporterKey) ?? {});
            return existing;
        }

        existing?.destroy?.();
        const supporter = new Supporter(this.scene, player, resolvedSupporterKey);
        supporter.setRuntimeOverrides?.(this.scene?.buildDebugSupporterEffectOverride?.(resolvedSupporterKey) ?? {});
        this.supporters.add(supporter);
        return supporter;
    }

    spawnOrb(supporter, target, config = {}) {
        if (!supporter?.active || !target?.active) return null;
        if (config.attackStyle === 'claw_slash') {
            return this.spawnClawSlash(supporter, target, config);
        }
        if (config.attackStyle === 'chain_lightning') {
            return this.spawnChainLightning(supporter, target, config);
        }
        const orb = new SupporterOrb(this.scene, supporter, target, {
            speed: config.projectileSpeed,
            damage: supporter.getScaledAttackDamage?.(config.projectileDamage ?? 8) ?? config.projectileDamage,
            radius: config.projectileRadius,
            lifetimeMs: config.projectileLifetimeMs,
            color: config.projectileColor,
            glowColor: config.projectileGlowColor,
            trailColor: config.projectileTrailColor,
            burstColor: config.projectileBurstColor,
            tags: config.tags ?? []
        });
        this.orbs.add(orb);
        return orb;
    }

    applySupportEffect(supporter, config = {}) {
        const owner = supporter?.owner;
        if (!supporter?.active || !owner?.active || owner?.isDead) return null;
        switch (config.supportStyle) {
            case 'heal_aura':
                return this.applyHealAura(supporter, owner, config);
            case 'armor_aura':
                return this.applyArmorAura(supporter, owner, config);
            default:
                return null;
        }
    }

    applyHealAura(supporter, owner, config = {}) {
        const healAmount = Math.max(1, Math.round(config.supportHealAmount ?? 25));
        owner.heal?.(healAmount);
        this.spawnSupportPulse(owner.x, owner.y - 8, {
            color: config.supportPulseColor ?? 0xa6ffcb,
            glowColor: config.supportGlowColor ?? 0xe8fff0,
            radius: config.supportPulseRadius ?? 10
        });
        return { kind: 'heal_aura', supporter, owner, value: healAmount };
    }

    applyArmorAura(supporter, owner, config = {}) {
        this.spawnSupportPulse(owner.x, owner.y - 8, {
            color: config.supportPulseColor ?? 0x8fdfff,
            glowColor: config.supportGlowColor ?? 0xe8fbff,
            radius: config.supportPulseRadius ?? 10
        });
        const armorBonus = Math.max(0, Math.round(config.supportArmorBonus ?? 0));
        return { kind: 'armor_aura', supporter, owner, value: armorBonus };
    }

    spawnSupportPulse(x, y, options = {}) {
        const pulse = this.scene?.add?.circle?.(
            x,
            y,
            options.radius ?? 10,
            options.color ?? 0xffffff,
            0.35
        );
        if (!pulse) return;
        pulse.setDepth(1004);
        pulse.setStrokeStyle(2, options.glowColor ?? 0xffffff, 0.85);
        pulse.setBlendMode(Phaser.BlendModes.ADD);
        this.scene?.tweens?.add?.({
            targets: pulse,
            alpha: 0,
            scaleX: 1.8,
            scaleY: 1.8,
            duration: 220,
            ease: 'Quad.easeOut',
            onComplete: () => pulse.destroy()
        });
    }

    spawnClawSlash(supporter, target, config = {}) {
        if (!supporter?.active || !target?.active || target?.isDead) return null;
        this.clawEffect?.spawn?.(supporter, target, {
            color: config.slashColor ?? config.projectileColor ?? 0xff6b7d,
            glowColor: config.slashGlowColor ?? config.projectileGlowColor ?? 0xffd3d9,
            depth: (target.depth ?? supporter.depth ?? 20) + 6,
            length: config.slashLength ?? 18,
            spacing: config.slashSpacing ?? 6,
            slashWidth: config.slashWidth,
            slashCount: config.slashCount,
            angle: config.slashAngle,
            impactRadius: config.slashImpactRadius,
            offsetX: config.slashOffsetX,
            offsetY: config.slashOffsetY
        });

        const damage = applyDamageVariance(
            supporter.getScaledAttackDamage?.(config.projectileDamage ?? 8)
            ?? Math.max(1, Math.round(config.projectileDamage ?? 8))
        );
        const attackTags = Array.from(new Set([
            ...(Array.isArray(config.tags) ? config.tags : []),
            'supporter',
            'melee',
            'slash',
            'hit'
        ]));
        const hitDirection = new Phaser.Math.Vector2(target.x - supporter.x, target.y - supporter.y);
        if (hitDirection.lengthSq() > 0) {
            hitDirection.normalize();
        }
        const damageResult = target.takeDamage(damage, 0, hitDirection, supporter, {
            attackTags
        }, null);
        const hitEvent = {
            target,
            sourceOwner: supporter.owner ?? null,
            source: supporter,
            ownerPlayerId: supporter.ownerPlayerId ?? null,
            attackTags,
            isCritical: false,
            damage,
            damageTaken: damageResult?.healthDamage ?? damage,
            absorbedDamage: damageResult?.absorbedDamage ?? 0,
            didKill: Boolean(damageResult?.didKill),
            direction: hitDirection,
            force: 0
        };
        this.scene?.statusEffectSystem?.applyConfiguredEffects?.(supporter.config?.statusEffects ?? [], {
            ...hitEvent,
            trigger: 'onHit'
        });
        if (damageResult?.didKill) {
            this.scene?.statusEffectSystem?.applyConfiguredEffects?.(supporter.config?.statusEffects ?? [], {
                ...hitEvent,
                trigger: 'onKill'
            });
        }
        this.scene?.statusEffectSystem?.notifyHit?.(hitEvent);
        if ((damageResult?.healthDamage ?? 0) > 0) {
            this.scene?.skillBehaviorPipeline?.effects?.showDamageText?.(target, damageResult.healthDamage, {
                color: '#ff9ba5',
                fontSize: '7px'
            });
        }
        return {
            kind: 'claw_slash',
            supporter,
            target,
            damage: damageResult?.healthDamage ?? damage
        };
    }

    spawnChainLightning(supporter, target, config = {}) {
        if (!supporter?.active || !target?.active || target?.isDead) return null;
        const passiveChainCountBonus = Math.max(0, config.passiveBonuses?.shockChainCountBonus ?? 0);
        const ownerChainCountBonus = Math.max(0, supporter.owner?.shockChainCountBonus ?? 0);
        const totalChainCountBonus = Math.max(passiveChainCountBonus, ownerChainCountBonus);
        const passiveChainDamageBonus = Math.max(0, config.passiveBonuses?.shockChainDamageBonus ?? 0);
        const ownerChainDamageBonus = Math.max(0, supporter.owner?.shockChainDamageBonus ?? 0);
        const totalChainDamageBonus = Math.max(passiveChainDamageBonus, ownerChainDamageBonus);
        this.scene?.skillBehaviorPipeline?.effects?.spawnChainLightning?.(
            supporter,
            target,
            (target.depth ?? supporter.depth ?? 20) + 6,
            {
                color: config.lightningColor ?? config.projectileColor ?? 0xffdc57,
                glowColor: config.lightningGlowColor ?? config.projectileGlowColor ?? 0xfff8c7,
                particleCount: config.lightningParticleCount ?? 8,
                duration: config.lightningDuration ?? 130
            }
        );

        const damage = applyDamageVariance(
            supporter.getScaledAttackDamage?.(config.projectileDamage ?? 8)
            ?? Math.max(1, Math.round(config.projectileDamage ?? 8))
        );
        const effectDurationMultiplier = supporter.getEffectDurationMultiplier?.() ?? 1;
        const attackTags = Array.from(new Set([
            ...(Array.isArray(config.tags) ? config.tags : []),
            'supporter',
            'lightning',
            'shock',
            'direct_shock_chain',
            'hit'
        ]));
        const hitDirection = new Phaser.Math.Vector2(target.x - supporter.x, target.y - supporter.y);
        if (hitDirection.lengthSq() > 0) {
            hitDirection.normalize();
        }
        const damageResult = target.takeDamage(damage, 0, hitDirection, supporter, {
            attackTags
        }, null);
        const hitEvent = {
            target,
            sourceOwner: supporter.owner ?? null,
            source: supporter,
            ownerPlayerId: supporter.ownerPlayerId ?? null,
            attackTags,
            isCritical: false,
            damage,
            damageTaken: damageResult?.healthDamage ?? damage,
            absorbedDamage: damageResult?.absorbedDamage ?? 0,
            didKill: Boolean(damageResult?.didKill),
            direction: hitDirection,
            force: 0
        };
        this.scene?.statusEffectSystem?.applyConfiguredEffects?.(supporter.config?.statusEffects ?? [], {
            ...hitEvent,
            trigger: 'onHit'
        });
        if (damageResult?.didKill) {
            this.scene?.statusEffectSystem?.applyConfiguredEffects?.(supporter.config?.statusEffects ?? [], {
                ...hitEvent,
                trigger: 'onKill'
            });
        }
        this.scene?.statusEffectSystem?.notifyHit?.(hitEvent);
        this.scene?.statusEffectSystem?.chainLightningFrom?.(target, {
            ownerPlayerId: supporter.ownerPlayerId ?? null,
            source: supporter,
            baseDamage: damage,
            chainCount: Math.max(1, (config.chainCount ?? 3) + totalChainCountBonus),
            chainRadius: config.chainRadius ?? 120,
            damageRatios: config.chainDamageRatios,
            initialDamageRatio: (config.chainInitialDamageRatio ?? 0.75) + totalChainDamageBonus,
            damageDecayFactor: config.chainDamageDecayFactor ?? 0.75,
            minimumDamageRatio: (config.chainMinimumDamageRatio ?? 0.3) + totalChainDamageBonus,
            stepDelayMs: config.chainStepDelayMs ?? 90,
            targetMode: 'enemies',
            spreadEffectKey: 'shock',
            spreadEffectOptions: {
                durationMs: Math.max(1, Math.round((config.shockDurationMs ?? 2000) * effectDurationMultiplier)),
                chainCount: Math.max(1, (config.chainCount ?? 3) + totalChainCountBonus),
                chainRadius: config.chainRadius ?? 120,
                chainDamageRatios: config.chainDamageRatios,
                chainInitialDamageRatio: (config.chainInitialDamageRatio ?? 0.75) + totalChainDamageBonus,
                chainDamageDecayFactor: config.chainDamageDecayFactor ?? 0.75,
                chainMinimumDamageRatio: (config.chainMinimumDamageRatio ?? 0.3) + totalChainDamageBonus,
                chainStepDelayMs: config.chainStepDelayMs ?? 90
            }
        });
        if ((damageResult?.healthDamage ?? 0) > 0) {
            this.scene?.skillBehaviorPipeline?.effects?.showDamageText?.(target, damageResult.healthDamage, {
                color: '#ffe680',
                fontSize: '7px'
            });
        }
        return {
            kind: 'chain_lightning',
            supporter,
            target,
            damage: damageResult?.healthDamage ?? damage
        };
    }

    getNearestEnemyToPoint(x, y, range = 240) {
        const enemies = this.scene?.enemies?.getChildren?.() ?? [];
        let nearest = null;
        let nearestDistanceSq = range * range;
        enemies.forEach((enemy) => {
            if (!enemy?.active || enemy?.isDead) return;
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distanceSq = (dx * dx) + (dy * dy);
            if (distanceSq >= nearestDistanceSq) return;
            nearest = enemy;
            nearestDistanceSq = distanceSq;
        });
        return nearest;
    }

    clearGroupSafely(group) {
        if (!group) return;
        const entries = Array.isArray(group?.children?.entries)
            ? [...group.children.entries]
            : [];
        entries.forEach((entry) => {
            entry?.destroy?.();
        });
        if (group?.children) {
            group.clear(false, false);
        }
    }

    clear() {
        this.clearGroupSafely(this.orbs);
        this.clearGroupSafely(this.supporters);
    }

    destroy() {
        this.clear();
        if (this.orbs?.children) {
            this.orbs.destroy(false);
        }
        if (this.supporters?.children) {
            this.supporters.destroy(false);
        }
        this.orbs = null;
        this.supporters = null;
        this.clawEffect?.destroy?.();
        this.clawEffect = null;
        this.scene = null;
    }
}
