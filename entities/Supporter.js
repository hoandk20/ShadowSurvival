import { getSupporterConfig } from '../config/supporters.js';

const SUPPORTER_DISPLAY_SCALE = 1;

export default class Supporter extends Phaser.GameObjects.Sprite {
    constructor(scene, owner, supporterKey) {
        const config = getSupporterConfig(supporterKey);
        const atlasKey = config?.atlas?.key ?? '__missing_texture__';
        const initialFrame = config?.animations?.idle?.frames?.[0];
        super(scene, owner?.x ?? 0, owner?.y ?? 0, atlasKey, initialFrame);
        this.scene = scene;
        this.owner = owner;
        this.supporterKey = supporterKey;
        this.baseConfig = config ?? {};
        this.runtimeConfigOverrides = {};
        this.config = this.baseConfig;
        this.ownerPlayerId = owner?.playerId ?? null;
        this.ownerEntityId = `supporter_${supporterKey}_${this.ownerPlayerId ?? 'unknown'}`;
        this.lastFireAt = -Infinity;
        this.lastSupportAt = -Infinity;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.followSide = Math.random() < 0.5 ? -1 : 1;
        this.appliedArmorBonus = 0;
        this.supportBonusOwner = null;
        this.passiveBonusOwner = null;
        this.passiveBonusConfigRef = null;
        this.appliedPassiveBonuses = {};
        this.conditionalPassiveOwner = null;
        this.conditionalPassiveConfigRef = null;
        this.appliedConditionalPassiveBonuses = {};
        this.setDepth((owner?.depth ?? 1000) - 1);
        this.setDisplaySize(
            (this.config.displaySize?.width ?? 30) * SUPPORTER_DISPLAY_SCALE,
            (this.config.displaySize?.height ?? 30) * SUPPORTER_DISPLAY_SCALE
        );
        this.baseScaleX = this.scaleX;
        this.baseScaleY = this.scaleY;
        scene.add.existing(this);
        this.playAnimation('idle');
        this.setRuntimeOverrides();
        this.syncSupportBonuses();
    }

    setOwner(owner) {
        if (owner === this.owner) return;
        this.clearArmorAuraBonus();
        this.clearPassiveBonuses(false);
        this.clearPassiveBonuses(true);
        this.owner = owner;
        this.ownerPlayerId = owner?.playerId ?? this.ownerPlayerId ?? null;
        this.ownerEntityId = `supporter_${this.supporterKey}_${this.ownerPlayerId ?? 'unknown'}`;
        this.syncSupportBonuses();
    }

    setRuntimeOverrides(overrides = {}) {
        this.runtimeConfigOverrides = overrides ?? {};
        this.config = {
            ...this.baseConfig,
            ...this.runtimeConfigOverrides,
            tags: Array.from(new Set([
                ...(Array.isArray(this.baseConfig?.tags) ? this.baseConfig.tags : []),
                ...(Array.isArray(this.runtimeConfigOverrides?.tags) ? this.runtimeConfigOverrides.tags : [])
            ])),
            statusEffects: Array.isArray(this.runtimeConfigOverrides?.statusEffects)
                ? this.runtimeConfigOverrides.statusEffects.slice(0, 1)
                : ((Array.isArray(this.baseConfig?.statusEffects) ? this.baseConfig.statusEffects : []).slice(0, 1))
        };
        this.syncSupportBonuses();
    }

    update(time, delta) {
        if (!this.active) return;
        if (!this.owner?.active || this.owner?.isDead) {
            this.destroy();
            return;
        }

        const target = this.config.supportStyle
            ? null
            : this.getCombatTarget();
        const isMoving = this.updateMovement(target, delta);
        this.syncMovementAnimation(isMoving);
        this.syncSupportBonuses({ targetInRange: Boolean(target) });

        if (this.config.supportStyle) {
            if ((time - this.lastSupportAt) >= this.getActionCooldownMs(this.config.supportIntervalMs ?? 1500)) {
                this.lastSupportAt = time;
                this.scene?.supporterSystem?.applySupportEffect?.(this, this.config);
                this.pulseShot();
            }
            return;
        }

        if (!target) return;
        this.setFlipX(target.x < this.x);
        if ((time - this.lastFireAt) < this.getActionCooldownMs(this.config.fireCooldownMs ?? 1200)) return;
        this.lastFireAt = time;
        this.scene?.supporterSystem?.spawnOrb?.(this, target, this.config);
        this.pulseShot();
    }

    updateMovement(target, delta) {
        const movementStyle = this.config.movementStyle ?? 'ranged_orbit';
        if (movementStyle === 'melee_follow') {
            return this.updateMeleeFollowMovement(target, delta);
        }
        this.updateOrbitMovement(delta);
        return false;
    }

    updateOrbitMovement(delta) {
        this.orbitAngle += ((this.config.orbitSpeed ?? 1.2) * delta) / 1000;
        const orbitRadius = this.config.orbitRadius ?? 24;
        const hoverAmplitude = this.config.hoverAmplitude ?? 6;
        const followLerp = Phaser.Math.Clamp(this.config.followLerp ?? 0.18, 0.05, 1);
        const anchorX = this.owner.x + Math.cos(this.orbitAngle) * orbitRadius;
        const anchorY = this.owner.y - 18 + Math.sin(this.orbitAngle * 1.5) * hoverAmplitude;
        this.x = Phaser.Math.Linear(this.x, anchorX, followLerp);
        this.y = Phaser.Math.Linear(this.y, anchorY, followLerp);
    }

    updateMeleeFollowMovement(target, delta) {
        const previousX = this.x;
        const previousY = this.y;
        const moveSpeed = Math.max(10, this.config.moveSpeed ?? 120);
        const followOffsetX = this.config.followOffsetX ?? 18;
        const followOffsetY = this.config.followOffsetY ?? 8;
        const followSlackDistance = Math.max(0, this.config.followSlackDistance ?? 12);
        const returnSpeedMultiplier = Math.max(0.1, this.config.returnSpeedMultiplier ?? 0.85);
        const engageDistance = Math.max(8, this.config.engageDistance ?? 20);

        let destinationX = this.owner.x + (this.followSide * followOffsetX);
        let destinationY = this.owner.y + followOffsetY;

        if (target?.active && !target?.isDead) {
            this.followSide = target.x < this.owner.x ? -1 : 1;
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.hypot(dx, dy);
            if (distance > engageDistance) {
                const travelDistance = Math.min(distance - engageDistance, (moveSpeed * delta) / 1000);
                const ratio = distance > 0 ? (travelDistance / distance) : 0;
                destinationX = this.x + (dx * ratio);
                destinationY = this.y + (dy * ratio);
            } else {
                destinationX = this.x;
                destinationY = this.y;
            }
        } else {
            const leashDx = destinationX - this.x;
            const leashDy = destinationY - this.y;
            const leashDistance = Math.hypot(leashDx, leashDy);
            if (leashDistance <= followSlackDistance) {
                destinationX = this.x;
                destinationY = this.y;
            } else {
                const travelDistance = Math.min(
                    leashDistance - followSlackDistance,
                    ((moveSpeed * returnSpeedMultiplier) * delta) / 1000
                );
                const ratio = leashDistance > 0 ? (travelDistance / leashDistance) : 0;
                destinationX = this.x + (leashDx * ratio);
                destinationY = this.y + (leashDy * ratio);
            }
        }

        this.x = destinationX;
        this.y = destinationY;
        const moveDeltaX = this.x - previousX;
        if (Math.abs(moveDeltaX) > 0.01) {
            this.setFlipX(moveDeltaX < 0);
        }
        return Math.hypot(this.x - previousX, this.y - previousY) > 0.01;
    }

    playAnimation(animName = 'idle') {
        const animKey = `supporter_${this.supporterKey}_${animName}`;
        if (!this.scene?.anims?.exists(animKey)) return false;
        if (this.anims.currentAnim?.key === animKey) return true;
        this.anims.play(animKey, true);
        return true;
    }

    syncMovementAnimation(isMoving = false) {
        const movementStyle = this.config.movementStyle ?? 'ranged_orbit';
        if (movementStyle !== 'melee_follow') {
            this.playAnimation('idle');
            return;
        }
        if (isMoving && this.config.animations?.move) {
            this.playAnimation('move');
            return;
        }
        this.playAnimation('idle');
    }

    getCombatTarget() {
        const movementStyle = this.config.movementStyle ?? 'ranged_orbit';
        if (movementStyle === 'melee_follow') {
            return this.getNearestEnemyTargetAroundOwner(this.config.attackArea ?? this.config.attackRange ?? 200);
        }
        return this.getNearestEnemyTarget(this.config.attackRange ?? 280);
    }

    getAttackSpeedMultiplier() {
        return Math.max(0.1, this.owner?.attackSpeedMultiplier ?? 1);
    }

    getActionCooldownMs(baseCooldown = 1200) {
        return Math.max(100, Math.round((Number(baseCooldown) || 0) / this.getAttackSpeedMultiplier()));
    }

    getDamageMultiplier() {
        return Math.max(0, this.owner?.damageMultiplier ?? 1);
    }

    getScaledAttackDamage(baseDamage = 0) {
        return Math.max(1, Math.round((Number(baseDamage) || 0) * this.getDamageMultiplier()));
    }

    getEffectDurationMultiplier() {
        return Math.max(0.1, this.owner?.globalEffectDurationMultiplier ?? 1);
    }

    getEffectDamageMultiplier() {
        return Math.max(0.01, this.owner?.globalEffectDamageMultiplier ?? 1);
    }

    pulseShot() {
        this.scene?.tweens?.killTweensOf?.(this);
        this.setScale(this.baseScaleX, this.baseScaleY);
        this.scene?.tweens?.add({
            targets: this,
            scaleX: this.baseScaleX * 1.12,
            scaleY: this.baseScaleY * 1.12,
            duration: 90,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
                if (!this.active) return;
                this.setScale(this.baseScaleX, this.baseScaleY);
            }
        });
    }

    syncSupportBonuses(context = {}) {
        const owner = this.owner;
        const supportStyle = this.config.supportStyle ?? null;
        this.syncPassiveBonuses(owner, this.config.passiveBonuses ?? null, false);
        this.syncPassiveBonuses(
            owner,
            this.shouldApplyConditionalPassiveBonuses(owner, context) ? (this.config.conditionalPassiveBonuses ?? null) : null,
            true
        );
        if (supportStyle !== 'armor_aura') {
            this.clearArmorAuraBonus();
            return;
        }
        const nextBonus = Math.max(0, Math.round(this.config.supportArmorBonus ?? 0));
        if (!owner) {
            this.clearArmorAuraBonus();
            return;
        }
        if (this.supportBonusOwner === owner && this.appliedArmorBonus === nextBonus) {
            return;
        }
        this.clearArmorAuraBonus();
        if (nextBonus <= 0) return;
        owner.bonusArmor = (owner.bonusArmor ?? 0) + nextBonus;
        owner.updateArmorFromConfig?.();
        this.appliedArmorBonus = nextBonus;
        this.supportBonusOwner = owner;
    }

    shouldApplyConditionalPassiveBonuses(owner, context = {}) {
        if (!owner) return false;
        const requiredCombatStyle = this.config.conditionalPassiveCombatStyle ?? null;
        if (requiredCombatStyle) {
            return owner.characterConfig?.combatStyle === requiredCombatStyle;
        }
        return Boolean(context.targetInRange);
    }

    syncPassiveBonuses(owner, passiveBonuses = null, conditional = false) {
        const ownerKey = conditional ? 'conditionalPassiveOwner' : 'passiveBonusOwner';
        const configKey = conditional ? 'conditionalPassiveConfigRef' : 'passiveBonusConfigRef';
        const appliedKey = conditional ? 'appliedConditionalPassiveBonuses' : 'appliedPassiveBonuses';
        const normalizedBonuses = passiveBonuses && Object.keys(passiveBonuses).length ? passiveBonuses : null;
        if (!owner || !normalizedBonuses) {
            this.clearPassiveBonuses(conditional);
            return;
        }
        if (this[ownerKey] === owner && this[configKey] === normalizedBonuses) {
            return;
        }
        this.clearPassiveBonuses(conditional);
        this.applyPassiveBonuses(owner, normalizedBonuses, conditional);
    }

    applyPassiveBonuses(owner, passiveBonuses = {}, conditional = false) {
        const ownerKey = conditional ? 'conditionalPassiveOwner' : 'passiveBonusOwner';
        const configKey = conditional ? 'conditionalPassiveConfigRef' : 'passiveBonusConfigRef';
        const appliedKey = conditional ? 'appliedConditionalPassiveBonuses' : 'appliedPassiveBonuses';
        const applied = {};
        Object.entries(passiveBonuses).forEach(([key, rawValue]) => {
            const value = Number(rawValue ?? 0);
            if (!Number.isFinite(value) || value === 0) return;
            switch (key) {
                case 'goldGainMultiplier':
                    owner.goldGainMultiplier = Math.max(0, (owner.goldGainMultiplier ?? 1) * (1 + value));
                    applied[key] = value;
                    break;
                case 'critChance':
                    owner.globalCritChanceBonus = (owner.globalCritChanceBonus ?? 0) + value;
                    applied[key] = value;
                    break;
                case 'critMultiplier':
                    owner.critMultiplierBonus = (owner.critMultiplierBonus ?? 0) + value;
                    applied[key] = value;
                    break;
                case 'lifesteal':
                    owner.lifesteal = Math.max(0, (owner.lifesteal ?? 0) + value);
                    applied[key] = value;
                    break;
                case 'attackSpeed':
                    owner.attackSpeedMultiplier = Math.max(0.1, (owner.attackSpeedMultiplier ?? 1) * (1 + value));
                    applied[key] = value;
                    break;
                case 'knockbackMultiplier':
                    owner.bonusKnockbackMultiplier = (owner.bonusKnockbackMultiplier ?? 0) + value;
                    applied[key] = value;
                    break;
                case 'armor':
                    owner.bonusArmor = (owner.bonusArmor ?? 0) + value;
                    owner.updateArmorFromConfig?.();
                    applied[key] = value;
                    break;
                case 'projectileSpeedPercent':
                    owner.globalProjectileSpeedMultiplier = (owner.globalProjectileSpeedMultiplier ?? 1) * (1 + value);
                    applied[key] = value;
                    break;
                case 'armorPierce':
                    owner.bonusArmorPierce = (owner.bonusArmorPierce ?? 0) + value;
                    owner.updateArmorPierceFromConfig?.();
                    applied[key] = value;
                    break;
                case 'effectDamageMultiplier':
                    owner.globalEffectDamageMultiplier = (owner.globalEffectDamageMultiplier ?? 1) * (1 + value);
                    applied[key] = value;
                    break;
                case 'effectDurationMultiplier':
                    owner.globalEffectDurationMultiplier = (owner.globalEffectDurationMultiplier ?? 1) * (1 + value);
                    applied[key] = value;
                    break;
                case 'healthRegenPerSecond':
                    owner.healthRegenPerSecond = (owner.healthRegenPerSecond ?? 0) + value;
                    applied[key] = value;
                    break;
                case 'maxHealthPercent':
                    owner.bonusMaxHealthPercent = (owner.bonusMaxHealthPercent ?? 0) + value;
                    owner.updateHealthFromCharacterConfig?.();
                    applied[key] = value;
                    break;
                case 'skillRange':
                    owner.bonusSkillRange = (owner.bonusSkillRange ?? 0) + value;
                    owner.updateSkillRangeFromConfig?.();
                    applied[key] = value;
                    break;
                case 'skillRangeFlat':
                    owner.bonusSkillRange = (owner.bonusSkillRange ?? 0) + value;
                    owner.updateSkillRangeFromConfig?.();
                    applied[key] = value;
                    break;
                case 'shieldResetAmount':
                    owner.itemShieldResetAmount = Math.max(0, value);
                    owner.itemShieldValue = Math.min(owner.itemShieldValue ?? 0, owner.itemShieldResetAmount);
                    applied[key] = value;
                    break;
                case 'shieldResetIntervalMs':
                    owner.itemShieldResetIntervalMs = Math.max(0, value);
                    owner.itemShieldTimer = 0;
                    applied[key] = value;
                    break;
                case 'shockChainDamageBonus':
                    owner.shockChainDamageBonus = (owner.shockChainDamageBonus ?? 0) + value;
                    applied[key] = value;
                    break;
                case 'shockChainCountBonus':
                    owner.shockChainCountBonus = (owner.shockChainCountBonus ?? 0) + value;
                    applied[key] = value;
                    break;
                default:
            }
        });
        this[appliedKey] = applied;
        this[ownerKey] = owner;
        this[configKey] = passiveBonuses;
    }

    clearPassiveBonuses(conditional = false) {
        const ownerKey = conditional ? 'conditionalPassiveOwner' : 'passiveBonusOwner';
        const configKey = conditional ? 'conditionalPassiveConfigRef' : 'passiveBonusConfigRef';
        const appliedKey = conditional ? 'appliedConditionalPassiveBonuses' : 'appliedPassiveBonuses';
        const owner = this[ownerKey];
        const applied = this[appliedKey] ?? {};
        if (!owner) {
            this[configKey] = null;
            this[appliedKey] = {};
            return;
        }
        Object.entries(applied).forEach(([key, value]) => {
            switch (key) {
                case 'goldGainMultiplier':
                    owner.goldGainMultiplier = Math.max(0, (owner.goldGainMultiplier ?? 1) / (1 + value));
                    break;
                case 'critChance':
                    owner.globalCritChanceBonus = (owner.globalCritChanceBonus ?? 0) - value;
                    break;
                case 'critMultiplier':
                    owner.critMultiplierBonus = (owner.critMultiplierBonus ?? 0) - value;
                    break;
                case 'lifesteal':
                    owner.lifesteal = Math.max(0, (owner.lifesteal ?? 0) - value);
                    break;
                case 'attackSpeed':
                    owner.attackSpeedMultiplier = Math.max(0.1, (owner.attackSpeedMultiplier ?? 1) / (1 + value));
                    break;
                case 'knockbackMultiplier':
                    owner.bonusKnockbackMultiplier = (owner.bonusKnockbackMultiplier ?? 0) - value;
                    break;
                case 'armor':
                    owner.bonusArmor = (owner.bonusArmor ?? 0) - value;
                    owner.updateArmorFromConfig?.();
                    break;
                case 'projectileSpeedPercent':
                    owner.globalProjectileSpeedMultiplier = Math.max(0.01, (owner.globalProjectileSpeedMultiplier ?? 1) / (1 + value));
                    break;
                case 'armorPierce':
                    owner.bonusArmorPierce = (owner.bonusArmorPierce ?? 0) - value;
                    owner.updateArmorPierceFromConfig?.();
                    break;
                case 'effectDamageMultiplier':
                    owner.globalEffectDamageMultiplier = Math.max(0.01, (owner.globalEffectDamageMultiplier ?? 1) / (1 + value));
                    break;
                case 'effectDurationMultiplier':
                    owner.globalEffectDurationMultiplier = Math.max(0.01, (owner.globalEffectDurationMultiplier ?? 1) / (1 + value));
                    break;
                case 'healthRegenPerSecond':
                    owner.healthRegenPerSecond = (owner.healthRegenPerSecond ?? 0) - value;
                    break;
                case 'maxHealthPercent':
                    owner.bonusMaxHealthPercent = (owner.bonusMaxHealthPercent ?? 0) - value;
                    owner.updateHealthFromCharacterConfig?.();
                    break;
                case 'skillRange':
                    owner.bonusSkillRange = (owner.bonusSkillRange ?? 0) - value;
                    owner.updateSkillRangeFromConfig?.();
                    break;
                case 'skillRangeFlat':
                    owner.bonusSkillRange = (owner.bonusSkillRange ?? 0) - value;
                    owner.updateSkillRangeFromConfig?.();
                    break;
                case 'shieldResetAmount':
                    owner.itemShieldResetAmount = 0;
                    owner.itemShieldValue = 0;
                    owner.itemShieldTimer = 0;
                    break;
                case 'shieldResetIntervalMs':
                    owner.itemShieldResetIntervalMs = 0;
                    owner.itemShieldTimer = 0;
                    break;
                case 'shockChainDamageBonus':
                    owner.shockChainDamageBonus = (owner.shockChainDamageBonus ?? 0) - value;
                    break;
                case 'shockChainCountBonus':
                    owner.shockChainCountBonus = (owner.shockChainCountBonus ?? 0) - value;
                    break;
                default:
            }
        });
        this[ownerKey] = null;
        this[configKey] = null;
        this[appliedKey] = {};
    }

    clearArmorAuraBonus() {
        if (!this.supportBonusOwner || !this.appliedArmorBonus) {
            this.supportBonusOwner = null;
            this.appliedArmorBonus = 0;
            return;
        }
        this.supportBonusOwner.bonusArmor = Math.max(0, (this.supportBonusOwner.bonusArmor ?? 0) - this.appliedArmorBonus);
        this.supportBonusOwner.updateArmorFromConfig?.();
        this.supportBonusOwner = null;
        this.appliedArmorBonus = 0;
    }

    getNearestEnemyTarget(range = 280) {
        const enemies = this.scene?.enemies?.getChildren?.() ?? [];
        let nearest = null;
        let nearestDistanceSq = range * range;
        enemies.forEach((enemy) => {
            if (!enemy?.active || enemy?.isDead) return;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distanceSq = (dx * dx) + (dy * dy);
            if (distanceSq >= nearestDistanceSq) return;
            nearest = enemy;
            nearestDistanceSq = distanceSq;
        });
        return nearest;
    }

    getNearestEnemyTargetAroundOwner(range = 200) {
        if (!this.owner) return null;
        const enemies = this.scene?.enemies?.getChildren?.() ?? [];
        let nearest = null;
        let nearestDistanceSq = range * range;
        enemies.forEach((enemy) => {
            if (!enemy?.active || enemy?.isDead) return;
            const ownerDx = enemy.x - this.owner.x;
            const ownerDy = enemy.y - this.owner.y;
            const ownerDistanceSq = (ownerDx * ownerDx) + (ownerDy * ownerDy);
            if (ownerDistanceSq >= nearestDistanceSq) return;
            nearest = enemy;
            nearestDistanceSq = ownerDistanceSq;
        });
        return nearest;
    }

    destroy(fromScene) {
        this.clearArmorAuraBonus();
        this.clearPassiveBonuses(false);
        this.clearPassiveBonuses(true);
        super.destroy(fromScene);
    }
}
