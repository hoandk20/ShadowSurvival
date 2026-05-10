import { SKILL_CONFIG } from '../config/skill.js';
import { isBadgeUnlocked, unlockBadge, setBadgeProgress } from '../utils/badges.js';

const BADGE_IDS = Object.freeze({
    // Bronze
    firstBlood: 'bronze_first_blood_first_rune',
    pixelProof: 'bronze_pixel_proof',
    collectorsItch: 'bronze_collectors_itch',
    goldHasWeight: 'bronze_gold_has_weight',
    rerollRitual: 'bronze_reroll_ritual',
    bossBreaker: 'bronze_boss_breaker',
    minibossHarvester: 'bronze_miniboss_harvester',
    sixSlotSymphony: 'bronze_six_slot_symphony',

    // Silver
    noRerollsNoRegrets: 'silver_no_rerolls_no_regrets',
    lastFrameEscape: 'silver_last_frame_escape',
    critHappens: 'silver_crit_happens',
    statusArchitect: 'silver_status_architect',
    lockAndLoaded: 'silver_lock_and_loaded',
    shopBigSpender: 'silver_shop_big_spender',
    magnetHands: 'silver_magnet_hands',
    supporterBond: 'silver_supporter_bond',
    loneWolf: 'silver_lone_wolf_protocol',
    oneSkillDiscipline: 'silver_one_skill_discipline',

    // Gold
    projectilePurist: 'gold_projectile_purist',
    meleeZealot: 'gold_melee_zealot',
    economyBuild: 'gold_the_economy_build',
    flawlessFinale: 'gold_flawless_finale',
    heavyHitter: 'gold_heavy_hitter',
    impactConductor: 'gold_impact_conductor'
});

function getSkillCategory(skillKey) {
    return SKILL_CONFIG?.[skillKey]?.category ?? null;
}

function arrayEquals(a, b) {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export default class BadgeRunSystem {
    constructor(scene) {
        this.scene = scene;
        this.reset();
        this.install();
    }

    reset() {
        this.totalRerolls = 0;
        this.xpOrbsCollected = 0;
        this.goldEarned = 0;
        this.minibossKills = 0;
        this.damageTakenThisWave = 0;
        this.statusKeysThisWave = new Set();
        this.lowHpMs = 0;
        this.critHitTimes = [];
        this.heavyHitCount = 0;
        this.shopGoldSpent = 0;
        this.lockSnapshot = null;
        this.lockRerollStreak = 0;
        this.lastSkillKeys = [];
        this.startingSkillKey = null;
        this.oneSkillWaveStreak = 0;
        this.projectileOnly = true;
        this.meleeOnly = true;
        this.supporterBondKey = null;
        this.supporterBondWaves = 0;
        this.activeBossCount = 0;
        this.bossFightWaveNumber = null;
        this.bossNoDamageFailed = false;
        this.tickAccumulatorMs = 0;
        this.progressCache = new Map();

        // Reset visible progress for run-scoped badges.
        this.resetProgressBadge(BADGE_IDS.collectorsItch, 100);
        this.resetProgressBadge(BADGE_IDS.goldHasWeight, 300);
        this.resetProgressBadge(BADGE_IDS.rerollRitual, 10);
        this.resetProgressBadge(BADGE_IDS.minibossHarvester, 3);
        this.resetProgressBadge(BADGE_IDS.lastFrameEscape, 10);
        this.resetProgressBadge(BADGE_IDS.critHappens, 10);
        this.resetProgressBadge(BADGE_IDS.statusArchitect, 3);
        this.resetProgressBadge(BADGE_IDS.lockAndLoaded, 3);
        this.resetProgressBadge(BADGE_IDS.shopBigSpender, 250);
        this.resetProgressBadge(BADGE_IDS.magnetHands, 180);
        this.resetProgressBadge(BADGE_IDS.supporterBond, 10);
        this.resetProgressBadge(BADGE_IDS.oneSkillDiscipline, 5);
        this.resetProgressBadge(BADGE_IDS.economyBuild, 2);
        this.resetProgressBadge(BADGE_IDS.impactConductor, 20);
    }

    resetProgressBadge(badgeId, target) {
        this.progressCache.set(badgeId, `0:${target}`);
        if (isBadgeUnlocked(badgeId)) return;
        setBadgeProgress(badgeId, 0, target);
    }

    syncBadgeProgress(badgeId, current, target) {
        const normalizedCurrent = Math.max(0, Math.min(Number(current) || 0, Number(target) || 1));
        const normalizedTarget = Math.max(1, Number(target) || 1);
        const cacheKey = `${normalizedCurrent}:${normalizedTarget}`;
        if (this.progressCache.get(badgeId) === cacheKey) return false;
        this.progressCache.set(badgeId, cacheKey);
        return setBadgeProgress(badgeId, normalizedCurrent, normalizedTarget);
    }

    install() {
        const events = this.scene?.events;
        if (!events) return;
        this._handlers = {
            enemyDead: (payload) => this.onEnemyDead(payload),
            enemySpawned: (payload) => this.onEnemySpawned(payload),
            playerDamaged: (payload) => this.onPlayerDamaged(payload),
            lootCollected: (payload) => this.onLootCollected(payload),
            goldGained: (payload) => this.onGoldGained(payload),
            enemyDamaged: (payload) => this.onEnemyDamaged(payload),
            statusApplied: (payload) => this.onStatusApplied(payload),
            waveStart: (payload) => this.onWaveStart(payload),
            waveEnd: (payload) => this.onWaveEnd(payload),
            shopOpen: (payload) => this.onShopOpen(payload),
            shopPurchase: (payload) => this.onShopPurchase(payload),
            shopReroll: (payload) => this.onShopReroll(payload),
            shopLockChange: (payload) => this.onShopLockChange(payload),
            runReroll: (payload) => this.onRunReroll(payload),
            runEnd: (payload) => this.onRunEnd(payload),
            heavyHit: (payload) => this.onHeavyHit(payload)
        };
        events.on('enemy-dead', this._handlers.enemyDead);
        events.on('enemy-spawned', this._handlers.enemySpawned);
        events.on('player-damaged', this._handlers.playerDamaged);
        events.on('loot-collected', this._handlers.lootCollected);
        events.on('gold-gained', this._handlers.goldGained);
        events.on('enemy-damaged', this._handlers.enemyDamaged);
        events.on('status-effect-applied', this._handlers.statusApplied);
        events.on('wave-start', this._handlers.waveStart);
        events.on('wave-end', this._handlers.waveEnd);
        events.on('shop-open', this._handlers.shopOpen);
        events.on('shop-purchase', this._handlers.shopPurchase);
        events.on('shop-reroll', this._handlers.shopReroll);
        events.on('shop-lock-change', this._handlers.shopLockChange);
        events.on('run-reroll', this._handlers.runReroll);
        events.on('run-end', this._handlers.runEnd);
        events.on('heavy-hit-effect', this._handlers.heavyHit);

        this.bootstrapSkillState();
    }

    destroy() {
        const events = this.scene?.events;
        if (!events || !this._handlers) return;
        events.off('enemy-dead', this._handlers.enemyDead);
        events.off('enemy-spawned', this._handlers.enemySpawned);
        events.off('player-damaged', this._handlers.playerDamaged);
        events.off('loot-collected', this._handlers.lootCollected);
        events.off('gold-gained', this._handlers.goldGained);
        events.off('enemy-damaged', this._handlers.enemyDamaged);
        events.off('status-effect-applied', this._handlers.statusApplied);
        events.off('wave-start', this._handlers.waveStart);
        events.off('wave-end', this._handlers.waveEnd);
        events.off('shop-open', this._handlers.shopOpen);
        events.off('shop-purchase', this._handlers.shopPurchase);
        events.off('shop-reroll', this._handlers.shopReroll);
        events.off('shop-lock-change', this._handlers.shopLockChange);
        events.off('run-reroll', this._handlers.runReroll);
        events.off('run-end', this._handlers.runEnd);
        events.off('heavy-hit-effect', this._handlers.heavyHit);
        this._handlers = null;
    }

    bootstrapSkillState() {
        const player = this.scene?.player ?? null;
        const keys = player?.getActiveSkillKeys?.() ?? this.scene?.activeSkillKeys ?? [];
        this.lastSkillKeys = Array.isArray(keys) ? [...keys] : [];
        this.startingSkillKey = this.lastSkillKeys[0] ?? null;
        // Initialize purity flags from starting skills.
        this.projectileOnly = true;
        this.meleeOnly = true;
        this.lastSkillKeys.forEach((key) => {
            const category = getSkillCategory(key);
            if (category !== 'projectile') this.projectileOnly = false;
            if (category !== 'melee') this.meleeOnly = false;
        });
    }

    update(_time, delta) {
        if (!this.scene || !this.scene.player || typeof delta !== 'number') return;
        this.tickAccumulatorMs += delta;
        if (this.tickAccumulatorMs < 200) return;
        const elapsed = this.tickAccumulatorMs;
        this.tickAccumulatorMs = 0;

        this.updateLowHpTimer(elapsed);
        this.updateSkillDerivedBadges();
        this.updateStatDerivedBadges();
    }

    updateLowHpTimer(deltaMs) {
        const player = this.scene?.player;
        const maxHealth = Math.max(1, Number(player?.maxHealth ?? 1) || 1);
        const health = Math.max(0, Number(player?.health ?? 0) || 0);
        const ratio = health / maxHealth;
        if (ratio > 0 && ratio < 0.1) {
            this.lowHpMs += deltaMs;
        } else {
            this.lowHpMs = 0;
        }
        this.syncBadgeProgress(BADGE_IDS.lastFrameEscape, Math.floor(this.lowHpMs / 1000), 10);
        if (this.lowHpMs >= 10_000) {
            unlockBadge(BADGE_IDS.lastFrameEscape);
        }
    }

    updateSkillDerivedBadges() {
        const player = this.scene?.player;
        const keys = player?.getActiveSkillKeys?.() ?? this.scene?.activeSkillKeys ?? [];
        const nextKeys = Array.isArray(keys) ? [...keys] : [];
        const normalizedNext = nextKeys.slice().sort();
        const normalizedPrev = (this.lastSkillKeys ?? []).slice().sort();
        const changed = !arrayEquals(normalizedNext, normalizedPrev);
        if (changed) {
            // Purity badges are run-history constraints: once a non-matching
            // skill appears in the loadout, the corresponding purity flag
            // stays false for the rest of the run.
            if (nextKeys.length <= 0) {
                this.projectileOnly = false;
                this.meleeOnly = false;
            }
            nextKeys.forEach((key) => {
                const category = getSkillCategory(key);
                if (category !== 'projectile') this.projectileOnly = false;
                if (category !== 'melee') this.meleeOnly = false;
            });
            this.lastSkillKeys = nextKeys;
        }

        if (nextKeys.length >= 6) {
            unlockBadge(BADGE_IDS.sixSlotSymphony);
        }
    }

    updateStatDerivedBadges() {
        const player = this.scene?.player;
        const pickup = Math.max(0, Number(player?.lootMagnetRadiusMultiplier ?? 1) || 1) * 100;
        this.syncBadgeProgress(BADGE_IDS.magnetHands, Math.floor(pickup), 180);
        if (pickup >= 180) {
            unlockBadge(BADGE_IDS.magnetHands);
        }

        const goldGain = Math.max(0, Number(player?.goldGainMultiplier ?? 1) || 1);
        const xpGain = Math.max(0, Number(player?.xpGainMultiplier ?? 1) || 1);
        const meets = goldGain >= 1.3 && xpGain >= 1.3;
        this.syncBadgeProgress(BADGE_IDS.economyBuild, meets ? 2 : (goldGain >= 1.3 || xpGain >= 1.3 ? 1 : 0), 2);
        if (meets) {
            unlockBadge(BADGE_IDS.economyBuild);
        }
    }

    onEnemySpawned(payload) {
        const enemy = payload?.enemy ?? null;
        if (!enemy) return;
        if (enemy.isBoss || enemy.isFinalBoss) {
            this.activeBossCount += 1;
            this.bossFightWaveNumber = enemy.waveNumber ?? this.scene?.currentWaveNumber ?? null;
            this.bossNoDamageFailed = false;
        }
    }

    onEnemyDead(payload) {
        const enemy = payload?.enemy ?? null;
        if (!enemy) return;
        unlockBadge(BADGE_IDS.firstBlood);

        if (enemy.isMiniBoss) {
            this.minibossKills += 1;
            this.syncBadgeProgress(BADGE_IDS.minibossHarvester, this.minibossKills, 3);
            if (this.minibossKills >= 3) unlockBadge(BADGE_IDS.minibossHarvester);
        }
        const isBoss = Boolean(enemy.isBoss || enemy.isFinalBoss);
        if (isBoss) {
            unlockBadge(BADGE_IDS.bossBreaker);
            this.activeBossCount = Math.max(0, this.activeBossCount - 1);
            const waveNumber = enemy.waveNumber ?? this.scene?.currentWaveNumber ?? null;
            if ((this.bossFightWaveNumber ?? null) === (waveNumber ?? null) && this.activeBossCount === 0) {
                if (!this.bossNoDamageFailed) {
                    unlockBadge(BADGE_IDS.flawlessFinale);
                }
            }
        }
    }

    onPlayerDamaged(payload) {
        const amount = Math.max(0, Number(payload?.amount ?? 0) || 0);
        if (amount <= 0) return;
        this.damageTakenThisWave += amount;
        if (this.activeBossCount > 0) {
            const waveNumber = this.scene?.currentWaveNumber ?? null;
            if ((this.bossFightWaveNumber ?? null) === (waveNumber ?? null)) {
                this.bossNoDamageFailed = true;
            }
        }
    }

    onLootCollected(payload) {
        const itemType = payload?.type ?? null;
        if (itemType !== 'xp') return;
        const amount = Math.max(0, Math.floor(Number(payload?.amount ?? 0) || 0));
        this.xpOrbsCollected += amount;
        this.syncBadgeProgress(BADGE_IDS.collectorsItch, this.xpOrbsCollected, 100);
        if (this.xpOrbsCollected >= 100) unlockBadge(BADGE_IDS.collectorsItch);
    }

    onGoldGained(payload) {
        const amount = Math.max(0, Math.floor(Number(payload?.amount ?? 0) || 0));
        if (amount <= 0) return;
        this.goldEarned += amount;
        this.syncBadgeProgress(BADGE_IDS.goldHasWeight, this.goldEarned, 300);
        if (this.goldEarned >= 300) unlockBadge(BADGE_IDS.goldHasWeight);
    }

    onEnemyDamaged(payload) {
        const isCritical = payload?.isCritical === true;
        const damageTaken = Math.max(0, Number(payload?.damageTaken ?? 0) || 0);
        if (damageTaken >= 150) {
            this.syncBadgeProgress(BADGE_IDS.heavyHitter, 1, 1);
            unlockBadge(BADGE_IDS.heavyHitter);
        }
        if (!isCritical) return;

        const now = Math.max(0, Number(payload?.timeNow ?? this.scene?.time?.now ?? 0) || 0);
        this.critHitTimes.push(now);
        const cutoff = now - 15_000;
        this.critHitTimes = this.critHitTimes.filter((t) => t >= cutoff);
        this.syncBadgeProgress(BADGE_IDS.critHappens, this.critHitTimes.length, 10);
        if (this.critHitTimes.length >= 10) {
            unlockBadge(BADGE_IDS.critHappens);
        }
    }

    onStatusApplied(payload) {
        const effectKey = String(payload?.effectKey ?? '').trim();
        const targetType = payload?.targetType ?? null;
        if (!effectKey) return;
        if (targetType !== 'enemy') return;
        this.statusKeysThisWave.add(effectKey);
        this.syncBadgeProgress(BADGE_IDS.statusArchitect, this.statusKeysThisWave.size, 3);
        if (this.statusKeysThisWave.size >= 3) {
            unlockBadge(BADGE_IDS.statusArchitect);
        }
    }

    onWaveStart(payload) {
        this.damageTakenThisWave = 0;
        this.statusKeysThisWave.clear();
        this.bossNoDamageFailed = false;
        const waveNumber = payload?.waveNumber ?? this.scene?.currentWaveNumber ?? null;
        this.bossFightWaveNumber = waveNumber;
        this.activeBossCount = 0;
    }

    onWaveEnd(payload) {
        const waveNumber = payload?.waveNumber ?? this.scene?.currentWaveNumber ?? null;
        const reason = payload?.reason ?? 'cleared';
        const isCleared = reason === 'cleared';
        if (this.damageTakenThisWave <= 0) {
            if (isCleared) {
                unlockBadge(BADGE_IDS.pixelProof);
            }
        }

        const player = this.scene?.player;
        const skillKeys = player?.getActiveSkillKeys?.() ?? this.scene?.activeSkillKeys ?? [];
        const starting = this.startingSkillKey;
        const onlyStarting = Boolean(
            starting
            && Array.isArray(skillKeys)
            && skillKeys.length === 1
            && skillKeys[0] === starting
        );
        if (isCleared && onlyStarting) {
            this.oneSkillWaveStreak += 1;
        } else {
            this.oneSkillWaveStreak = 0;
        }
        this.syncBadgeProgress(BADGE_IDS.oneSkillDiscipline, this.oneSkillWaveStreak, 5);
        if (this.oneSkillWaveStreak >= 5) unlockBadge(BADGE_IDS.oneSkillDiscipline);

        const supporterKey = this.scene?.selectedSupporterKey ?? null;
        if (supporterKey && isCleared) {
            if (!this.supporterBondKey || this.supporterBondKey !== supporterKey) {
                this.supporterBondKey = supporterKey;
                this.supporterBondWaves = 0;
            }
            this.supporterBondWaves += 1;
        } else {
            this.supporterBondKey = null;
            this.supporterBondWaves = 0;
        }
        this.syncBadgeProgress(BADGE_IDS.supporterBond, this.supporterBondWaves, 10);
        if (this.supporterBondWaves >= 10) unlockBadge(BADGE_IDS.supporterBond);

        if (isCleared && Number(waveNumber) === 10) {
            if (!supporterKey) unlockBadge(BADGE_IDS.loneWolf);
            if (this.projectileOnly) unlockBadge(BADGE_IDS.projectilePurist);
            if (this.meleeOnly) unlockBadge(BADGE_IDS.meleeZealot);
        }
    }

    onShopOpen() {
        this.shopGoldSpent = 0;
        this.lockSnapshot = null;
        this.lockRerollStreak = 0;
        this.syncBadgeProgress(BADGE_IDS.shopBigSpender, 0, 250);
        this.syncBadgeProgress(BADGE_IDS.lockAndLoaded, 0, 3);
    }

    onShopPurchase(payload) {
        const cost = Math.max(0, Math.floor(Number(payload?.cost ?? 0) || 0));
        if (cost <= 0) return;
        this.shopGoldSpent += cost;
        this.syncBadgeProgress(BADGE_IDS.shopBigSpender, this.shopGoldSpent, 250);
        if (this.shopGoldSpent >= 250) unlockBadge(BADGE_IDS.shopBigSpender);
    }

    onShopLockChange(payload) {
        const lockedIds = Array.isArray(payload?.lockedItemIds) ? payload.lockedItemIds.filter(Boolean).slice().sort() : [];
        if (!lockedIds.length) {
            this.lockSnapshot = null;
            this.lockRerollStreak = 0;
            this.syncBadgeProgress(BADGE_IDS.lockAndLoaded, 0, 3);
            return;
        }
        this.lockSnapshot = lockedIds;
        this.lockRerollStreak = 0;
        this.syncBadgeProgress(BADGE_IDS.lockAndLoaded, 0, 3);
    }

    onShopReroll(payload) {
        this.incrementReroll();
        const lockedIds = Array.isArray(payload?.lockedItemIds) ? payload.lockedItemIds.filter(Boolean).slice().sort() : [];
        if (!this.lockSnapshot || !this.lockSnapshot.length || !lockedIds.length) {
            this.lockRerollStreak = 0;
            this.syncBadgeProgress(BADGE_IDS.lockAndLoaded, 0, 3);
            return;
        }
        if (arrayEquals(this.lockSnapshot, lockedIds)) {
            this.lockRerollStreak += 1;
        } else {
            this.lockRerollStreak = 0;
            this.lockSnapshot = lockedIds;
        }
        this.syncBadgeProgress(BADGE_IDS.lockAndLoaded, this.lockRerollStreak, 3);
        if (this.lockRerollStreak >= 3) unlockBadge(BADGE_IDS.lockAndLoaded);
    }

    onRunReroll() {
        this.incrementReroll();
    }

    incrementReroll() {
        this.totalRerolls += 1;
        this.syncBadgeProgress(BADGE_IDS.rerollRitual, this.totalRerolls, 10);
        if (this.totalRerolls >= 10) unlockBadge(BADGE_IDS.rerollRitual);
    }

    onHeavyHit() {
        this.heavyHitCount += 1;
        this.syncBadgeProgress(BADGE_IDS.impactConductor, this.heavyHitCount, 20);
        if (this.heavyHitCount >= 20) unlockBadge(BADGE_IDS.impactConductor);
    }

    onRunEnd(payload) {
        const won = payload?.won === true;
        if (won && this.totalRerolls === 0) {
            unlockBadge(BADGE_IDS.noRerollsNoRegrets);
        }
    }
}
