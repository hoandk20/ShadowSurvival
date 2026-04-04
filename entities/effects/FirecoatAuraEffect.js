const FIRECOAT_DEFAULT_INTERVAL_MS = 1000;
const FIRECOAT_DEFAULT_RADIUS = 70;
const FIRECOAT_DEFAULT_DAMAGE_RATIO = 0.2;

export default class FirecoatAuraEffect {
    constructor(scene, owner) {
        this.scene = scene;
        this.owner = owner;
        this.timer = 0;
        this.cachedAuraConfig = null;
        this.cachedRunState = null;
        this.cachedFirecoatEntry = null;
        this.cachedFirecoatPurchaseCount = null;
    }

    update(delta) {
        const auraConfig = this.getAuraConfig();
        if (!auraConfig || this.owner?.isDead) {
            this.timer = 0;
            return;
        }
        this.timer += delta;
        const intervalMs = Math.max(1, auraConfig.intervalMs ?? FIRECOAT_DEFAULT_INTERVAL_MS);
        while (this.timer >= intervalMs) {
            this.timer -= intervalMs;
            this.triggerPulse(auraConfig);
        }
    }

    getAuraConfig() {
        const runState = this.scene?.getRunStateForPlayer?.(this.owner) ?? null;
        if (!runState) return null;
        const firecoatEntry = runState.shopSpecialFlags?.firecoat ?? null;
        const firecoatPurchaseCount = runState.shopPurchaseCounts?.firecoat ?? 0;
        if (
            this.cachedRunState === runState
            && this.cachedFirecoatEntry === firecoatEntry
            && this.cachedFirecoatPurchaseCount === firecoatPurchaseCount
        ) {
            return this.cachedAuraConfig;
        }

        this.cachedRunState = runState;
        this.cachedFirecoatEntry = firecoatEntry;
        this.cachedFirecoatPurchaseCount = firecoatPurchaseCount;

        const auraConfig = firecoatEntry?.firecoatAura ?? null;
        if (!auraConfig || firecoatPurchaseCount <= 0) {
            this.cachedAuraConfig = null;
            return null;
        }

        this.cachedAuraConfig = {
            intervalMs: FIRECOAT_DEFAULT_INTERVAL_MS,
            radius: FIRECOAT_DEFAULT_RADIUS,
            damageFromOwnerMaxHealthRatio: FIRECOAT_DEFAULT_DAMAGE_RATIO
        };
        this.cachedAuraConfig.intervalMs = Math.max(1, auraConfig.intervalMs ?? this.cachedAuraConfig.intervalMs);
        this.cachedAuraConfig.radius = Math.max(1, auraConfig.radius ?? this.cachedAuraConfig.radius);
        this.cachedAuraConfig.damageFromOwnerMaxHealthRatio = Math.max(
            0,
            auraConfig.damageFromOwnerMaxHealthRatio ?? this.cachedAuraConfig.damageFromOwnerMaxHealthRatio
        );
        return this.cachedAuraConfig;
    }

    triggerPulse(auraConfig = {}) {
        if (!this.scene?.enemies || !this.owner) return;
        const radius = Math.max(1, auraConfig.radius ?? FIRECOAT_DEFAULT_RADIUS);
        const damageRatio = Math.max(0, auraConfig.damageFromOwnerMaxHealthRatio ?? FIRECOAT_DEFAULT_DAMAGE_RATIO);
        const damage = Math.max(1, Math.round((this.owner.maxHealth ?? 1) * damageRatio));
        const enemies = this.getEnemiesInRadius(radius);
        if (!enemies.length) return;

        this.spawnAuraWave(radius);

        enemies.forEach((enemy) => {
            enemy.takeDamage?.(
                damage,
                0,
                null,
                {
                    owner: this.owner,
                    ownerPlayerId: this.owner.playerId,
                    playerId: this.owner.playerId,
                    sourceType: 'firecoat'
                },
                {
                    fromFirecoat: true,
                    fromPlayerAura: true,
                    attackTags: ['fire', 'burn', 'aura']
                }
            );
            enemy.applyStatusEffect?.('burn', {
                ownerPlayerId: this.owner.playerId,
                source: {
                    owner: this.owner,
                    ownerPlayerId: this.owner.playerId,
                    playerId: this.owner.playerId,
                    sourceType: 'firecoat'
                },
                hitDamageSnapshot: damage,
                tags: ['fire', 'burn', 'aura']
            });
        });
    }

    spawnAuraWave(radius = FIRECOAT_DEFAULT_RADIUS) {
        if (!this.scene?.add || !this.scene?.tweens || !this.owner) return;
        const aura = this.scene.add.circle(this.owner.x, this.owner.y, 18, 0xff8a3a, 0.16)
            .setDepth((this.owner.depth ?? 20) + 1);
        aura.setStrokeStyle(3, 0xffc26a, 0.65);

        this.scene.tweens.add({
            targets: aura,
            radius,
            alpha: { from: 0.16, to: 0 },
            scale: { from: 0.92, to: 1.08 },
            duration: 320,
            ease: 'Cubic.easeOut',
            onComplete: () => aura.destroy()
        });
    }

    getEnemiesInRadius(radius = 0) {
        if (!this.scene?.enemies?.getChildren || !this.owner || radius <= 0) return [];
        const results = [];
        const seen = new Set();
        const overlapBodies = this.scene.physics?.overlapCirc?.(this.owner.x, this.owner.y, radius, true, true);
        if (Array.isArray(overlapBodies) && overlapBodies.length) {
            overlapBodies.forEach((body) => {
                const enemy = body?.gameObject;
                if (!enemy?.active || enemy?.isDead) return;
                if (!this.scene.enemies.contains?.(enemy)) return;
                if (seen.has(enemy)) return;
                seen.add(enemy);
                results.push(enemy);
            });
            return results;
        }

        const radiusSq = radius * radius;
        const enemies = this.scene.enemies.getChildren?.() ?? [];
        enemies.forEach((enemy) => {
            if (!enemy?.active || enemy?.isDead) return;
            const dx = enemy.x - this.owner.x;
            const dy = enemy.y - this.owner.y;
            const enemyRadius = Math.max(enemy.displayWidth ?? enemy.body?.width ?? 0, enemy.displayHeight ?? enemy.body?.height ?? 0) * 0.5;
            const maxDistance = radius + enemyRadius;
            if (((dx * dx) + (dy * dy)) <= Math.max(radiusSq, maxDistance * maxDistance)) {
                results.push(enemy);
            }
        });
        return results;
    }

    destroy() {
        this.timer = 0;
        this.cachedAuraConfig = null;
        this.cachedRunState = null;
        this.cachedFirecoatEntry = null;
        this.cachedFirecoatPurchaseCount = null;
    }
}
