const ELITE_MODIFIERS = {
    tank: {
        kind: 'self',
        apply(stats) {
            stats.maxHealth *= 2;
            stats.knockbackResist *= 0.1;
        }
    },
    fast: {
        kind: 'self',
        apply(stats) {
            stats.speed *= 4;
            stats.scale *= 0.6;
            stats.damage -= 7;
            stats.maxHealth *= 0.5;
            stats.knockbackResist *= 1.2;
        }
    },
    berserk: {
        kind: 'self',
        apply(stats) {
            stats.damage *= 2;
            stats.knockbackResist *= 0.5;
        }
    },
    giant: {
        kind: 'self',
        apply(stats) {
            stats.scale *= 2;
            stats.maxHealth *= 4;
            stats.speed *= 0.5;
            stats.knockbackResist *= 0.1;
        }
    }
};

const ELITE_MODIFIER_VISUALS = {
    tank: {
        tint: 0x7d7263
    },
    fast: {
        tint: 0xf7fbff,
        trail: {
            tint: 0xffffff,
            spawnInterval: 8,
            lifetime: 60,
            scale: 0.4,
            minAlpha: 0.18
        }
    },
    berserk: {
        tint: 0xff4a4a
    },
    giant: {
        tint: 0x9a6a3a
    }
};

const SHARED_ELITE_CONFIG = {
    baseChance: 0.001,
    chancePerMinute: 0.003,
    maxChance: 0.5,
    lootTable: [
        { itemKey: 'xp_orb_icon', chance: 0.3, minAmount: 18, maxAmount: 30 },
        { itemKey: 'health_flask', chance: 0.1, minAmount: 2, maxAmount: 3 }
    ],
    baseStatMultipliers: {
        maxHealth: 7,
        damage: 1.5,
        speed: 1.5,
        scale: 1.2,
        stunResist: 0.3
    },
    modifierCount: {
        min: 1,
        max: 1
    },
    tint: 0xffd166,
    modifiedTint: 0x5da9ff,
    trailTint: 0xffef99,
    modifiedTrailTint: 0xb9d7ff,
    trailSpawnInterval: 18,
    trailLifetime: 90,
    trailScale: 0.4,
    trailMinAlpha: 0.2,
    modifierPool: Object.keys(ELITE_MODIFIERS)
};

const SHARED_WAVE_CONFIG = [
    {
        id: 'opening_swarm',
        startAtMs: 60000,
        intervalMs: 30000,
        count: 50,
        clusterRadius: 60
    }
];

const SHARED_ENEMY_HEALTH_MILESTONES = [
    { minute: 3, setMultiplier: 1.5 },
    { minute: 5, setMultiplier: 2 },
    { minute: 7, setMultiplier: 2.5 },
    { minute: 10, setMultiplier: 3 },
    { minute: 15, setMultiplier: 5 },
    { minute: 20, setMultiplier: 10 },
    { minute: 25, setMultiplier: 15 }
];

function createEliteConfig(overrides = {}) {
    return {
        ...SHARED_ELITE_CONFIG,
        ...overrides,
        lootTable: overrides.lootTable ?? [...SHARED_ELITE_CONFIG.lootTable],
        baseStatMultipliers: {
            ...SHARED_ELITE_CONFIG.baseStatMultipliers,
            ...(overrides.baseStatMultipliers ?? {})
        },
        modifierCount: {
            ...SHARED_ELITE_CONFIG.modifierCount,
            ...(overrides.modifierCount ?? {})
        },
        modifierPool: overrides.modifierPool ?? [...SHARED_ELITE_CONFIG.modifierPool]
    };
}

function createWaveConfig(prefix, overrides = []) {
    return SHARED_WAVE_CONFIG.map((wave, index) => ({
        ...wave,
        id: `${prefix}_${overrides[index]?.id ?? wave.id}`,
        ...(overrides[index] ?? {})
    }));
}

export const STAGE_SCENARIOS = {
    maprock_field: {
        normalSpawnPerSecond: 0.5,
        normalSpawnPerSecondPerMinute: 0.7,
        enemyHealthMilestones: SHARED_ENEMY_HEALTH_MILESTONES,
        enemyUnlockTimeline: [
            { enemyType: 'skeleton', unlockAtMinute: 0, spawnWeight: 1 },
            { enemyType: 'slime', unlockAtMinute: 3, spawnWeight: 2 },
            { enemyType: 'bat', unlockAtMinute: 6, spawnWeight: 3 },
            { enemyType: 'worm', unlockAtMinute: 9, spawnWeight: 5 },
            { enemyType: 'rat', unlockAtMinute: 12, spawnWeight: 8 },
            { enemyType: 'succubus', unlockAtMinute: 15, spawnWeight: 13 },
            { enemyType: 'widow', unlockAtMinute: 18, spawnWeight: 21 },
            { enemyType: 'mummy', unlockAtMinute: 21, spawnWeight: 34 }
        ],
        elite: createEliteConfig({
            maxActive: 10
        }),
        waves: createWaveConfig('maprock')
    },
    church_sanctuary: {
        normalSpawnPerSecond: 0.5,
        normalSpawnPerSecondPerMinute: 0.7,
        enemyHealthMilestones: SHARED_ENEMY_HEALTH_MILESTONES,
        enemyUnlockTimeline: [
            { enemyType: 'worm', unlockAtMinute: 0, spawnWeight: 1 },
            { enemyType: 'slime', unlockAtMinute: 3, spawnWeight: 2 },
            { enemyType: 'bat', unlockAtMinute: 6, spawnWeight: 3 },
            { enemyType: 'succubus', unlockAtMinute: 9, spawnWeight: 5 },
            { enemyType: 'moth_woman', unlockAtMinute: 12, spawnWeight: 8 },
            { enemyType: 'widow', unlockAtMinute: 15, spawnWeight: 13 },
            { enemyType: 'kitsume', unlockAtMinute: 20, spawnWeight: 21 },
            { enemyType: 'zombie_woman', unlockAtMinute: 22, spawnWeight: 34 }
        ],
        elite: createEliteConfig({
            maxActive: 10
        }),
        waves: createWaveConfig('church')
    },
    inside_church: {
        normalSpawnPerSecond: 0.5,
        normalSpawnPerSecondPerMinute: 0.7,
        enemyHealthMilestones: SHARED_ENEMY_HEALTH_MILESTONES,
        enemyUnlockTimeline: [
            { enemyType: 'bat', unlockAtMinute: 0, spawnWeight: 1 },
            { enemyType: 'slime', unlockAtMinute: 3, spawnWeight: 2 },
            { enemyType: 'medusa', unlockAtMinute: 6, spawnWeight: 3 },
            { enemyType: 'rat', unlockAtMinute: 9, spawnWeight: 5 },
            { enemyType: 'skeleton', unlockAtMinute: 12, spawnWeight: 8 },
            { enemyType: 'succubus', unlockAtMinute: 15, spawnWeight: 13 },
            { enemyType: 'widow', unlockAtMinute: 20, spawnWeight: 21 },
            { enemyType: 'worm', unlockAtMinute: 22, spawnWeight: 34 },
            { enemyType: 'minotau', unlockAtMinute: 24, spawnWeight: 55 }
        ],
        elite: createEliteConfig({
            maxActive: 10
        }),
        waves: createWaveConfig('inside_church')
    }
};

export function getStageScenario(mapKey) {
    return STAGE_SCENARIOS[mapKey] ?? null;
}

function getScenarioElapsedMs(scene) {
    if (!scene) return 0;
    const now = scene.time?.now ?? 0;
    const runStartTime = scene.runStartTime ?? now;
    return Math.max(0, now - runStartTime);
}

export function getScenarioSpawnInterval(scenario, fallbackInterval = 500) {
    const normalSpawnPerSecond = scenario?.normalSpawnPerSecond;
    if (typeof normalSpawnPerSecond !== 'number' || normalSpawnPerSecond <= 0) {
        return fallbackInterval;
    }
    return Math.max(1, Math.round(1000 / normalSpawnPerSecond));
}

export function getScenarioSpawnRate(scene, scenario, fallbackPerSecond = 2) {
    const basePerSecond = scenario?.normalSpawnPerSecond;
    if (typeof basePerSecond !== 'number' || basePerSecond <= 0) {
        return fallbackPerSecond;
    }
    const perMinuteBonus = Math.max(0, scenario?.normalSpawnPerSecondPerMinute ?? 0);
    const elapsedMinutes = getScenarioElapsedMs(scene) / 60000;
    return basePerSecond + (perMinuteBonus * elapsedMinutes);
}

export function getScenarioEnemyHealthMultiplier(scene, scenario) {
    const elapsedMinutes = getScenarioElapsedMs(scene) / 60000;
    let multiplier = 1;
    const milestones = Array.isArray(scenario?.enemyHealthMilestones) ? scenario.enemyHealthMilestones : [];
    milestones.forEach((entry) => {
        if (!entry || elapsedMinutes < (entry.minute ?? 0)) return;
        if (typeof entry.setMultiplier === 'number' && entry.setMultiplier > 0) {
            multiplier = entry.setMultiplier;
            return;
        }
        if (typeof entry.multiplier === 'number' && entry.multiplier > 0) {
            multiplier *= entry.multiplier;
        }
    });
    return multiplier;
}

export function createStageScenarioState(scenario) {
    const nextWaveAtById = {};
    (scenario?.waves ?? []).forEach((wave) => {
        if (!wave?.id) return;
        nextWaveAtById[wave.id] = wave.startAtMs ?? 0;
    });
    return { nextWaveAtById };
}

export function getEliteSpawnChance(scene, scenario) {
    const eliteConfig = scenario?.elite;
    if (!scene || !eliteConfig) return 0;
    const elapsedMinutes = getScenarioElapsedMs(scene) / 60000;
    const scaledChance = eliteConfig.baseChance + (eliteConfig.chancePerMinute * elapsedMinutes);
    return Math.min(eliteConfig.maxChance ?? scaledChance, scaledChance);
}

export function getActiveEliteCount(scene) {
    const enemies = scene?.enemies?.getChildren?.() ?? [];
    return enemies.filter((enemy) => enemy?.active && enemy?.isElite && !enemy?.isDead).length;
}

export function getUnlockedEnemyTypes(scene, scenario) {
    const timeline = Array.isArray(scenario?.enemyUnlockTimeline) ? scenario.enemyUnlockTimeline : [];
    if (!timeline.length) return null;
    const elapsedMinutes = getScenarioElapsedMs(scene) / 60000;
    return new Set(
        timeline
            .filter((entry) => elapsedMinutes >= (entry.unlockAtMinute ?? 0))
            .map((entry) => entry.enemyType)
            .filter(Boolean)
    );
}

export function getScenarioEnemySpawnWeights(scenario) {
    const timeline = Array.isArray(scenario?.enemyUnlockTimeline) ? scenario.enemyUnlockTimeline : [];
    if (!timeline.length) return null;
    const weights = new Map();
    timeline.forEach((entry) => {
        if (!entry?.enemyType || typeof entry.spawnWeight !== 'number') return;
        weights.set(entry.enemyType, entry.spawnWeight);
    });
    return weights;
}

export function rollEliteSpawn(scene, scenario, rng = Math.random) {
    const chance = getEliteSpawnChance(scene, scenario);
    return rng() < chance;
}

export function assignRandomModifiers(scenario, rng = Math.random) {
    const eliteConfig = scenario?.elite;
    const pool = [...(eliteConfig?.modifierPool ?? [])].filter((key) => ELITE_MODIFIERS[key]);
    if (!pool.length) return [];
    const min = Math.max(1, eliteConfig?.modifierCount?.min ?? 1);
    const max = Math.max(min, eliteConfig?.modifierCount?.max ?? min);
    const count = Math.min(pool.length, Phaser.Math.Between(min, max));
    const picked = [];

    while (picked.length < count && pool.length) {
        const index = Math.floor(rng() * pool.length);
        picked.push(pool.splice(index, 1)[0]);
    }

    return picked;
}

function ensureEnemyStats(enemy) {
    if (!enemy) return;
    if (typeof enemy.captureBaseStats === 'function' && !enemy.baseStats) {
        enemy.captureBaseStats();
    }
}

function buildBaseRuntimeStats(enemy) {
    ensureEnemyStats(enemy);
    const baseStats = enemy?.baseStats ?? {};
    return {
        maxHealth: baseStats.maxHealth ?? enemy.maxHealth ?? 1,
        damage: baseStats.damage ?? enemy.damage ?? 0,
        speed: baseStats.speed ?? enemy.speed ?? 0,
        scale: baseStats.scale ?? enemy.scaleSize ?? 1,
        knockbackResist: baseStats.knockbackResist ?? enemy.knockbackResist ?? 1,
        stunResist: baseStats.stunResist ?? enemy.stunResist ?? 1
    };
}

function applySelfModifiers(stats, modifierKeys) {
    modifierKeys.forEach((modifierKey) => {
        const modifier = ELITE_MODIFIERS[modifierKey];
        if (modifier?.kind === 'self') {
            modifier.apply(stats);
        }
    });
}

function applyEliteBaseStats(stats, scenario) {
    const multipliers = scenario?.elite?.baseStatMultipliers;
    if (!multipliers) return;
    stats.maxHealth *= multipliers.maxHealth ?? 1;
    stats.damage *= multipliers.damage ?? 1;
    stats.speed *= multipliers.speed ?? 1;
    stats.scale *= multipliers.scale ?? 1;
    stats.knockbackResist *= multipliers.knockbackResist ?? 1;
    stats.stunResist *= multipliers.stunResist ?? 1;
}

function applyEliteVisuals(enemy, modifierKeys, scenario) {
    const primaryModifierKey = modifierKeys[0] ?? null;
    const visual = primaryModifierKey ? ELITE_MODIFIER_VISUALS[primaryModifierKey] ?? null : null;
    const defaultTint = scenario?.elite?.tint ?? 0xffd166;
    const defaultTrailTint = scenario?.elite?.trailTint ?? defaultTint;

    enemy.eliteTint = visual?.tint ?? defaultTint;
    enemy.setTint(enemy.eliteTint);

    enemy.disableMotionTrail?.();
    if (visual?.trail) {
        enemy.enableMotionTrail?.({
            depthOffset: -2,
            blendMode: 'ADD',
            sizeFactor: 0.8,
            ...visual.trail
        });
    }

    if (!visual?.trail && !primaryModifierKey) {
        enemy.enableMotionTrail?.({
            tint: defaultTrailTint,
            spawnInterval: scenario?.elite?.trailSpawnInterval ?? 18,
            lifetime: scenario?.elite?.trailLifetime ?? 90,
            scale: scenario?.elite?.trailScale ?? 0.4,
            minAlpha: scenario?.elite?.trailMinAlpha ?? 0.2,
            depthOffset: -2,
            blendMode: 'ADD',
            sizeFactor: 0.8
        });
    }
}

export function applyEliteModifiers(enemy, modifierKeys, scenario) {
    if (!enemy || !Array.isArray(modifierKeys) || !modifierKeys.length) return false;
    ensureEnemyStats(enemy);
    enemy.isElite = true;
    enemy.stageEliteState = {
        modifierKeys: [...modifierKeys]
    };
    applyEliteVisuals(enemy, modifierKeys, scenario);
    const nextStats = buildBaseRuntimeStats(enemy);
    applyEliteBaseStats(nextStats, scenario);
    applySelfModifiers(nextStats, modifierKeys);
    enemy.applyRuntimeStats?.(nextStats, { preserveHealthRatio: false });
    return true;
}

export function spawnEnemyWithEliteChance(scene, enemy, scenario, rng = Math.random) {
    if (!enemy || !scenario?.elite) return enemy;
    const maxActive = scenario.elite.maxActive;
    if (typeof maxActive === 'number' && maxActive > 0 && getActiveEliteCount(scene) >= maxActive) {
        return enemy;
    }
    ensureEnemyStats(enemy);
    if (!rollEliteSpawn(scene, scenario, rng)) {
        return enemy;
    }
    const modifierKeys = assignRandomModifiers(scenario, rng);
    applyEliteModifiers(enemy, modifierKeys, scenario);
    return enemy;
}

export function handleAuraSystem(enemies, scenario) {
    if (!scenario?.elite || !Array.isArray(enemies) || !enemies.length) return;
    const activeEnemies = enemies.filter((enemy) => enemy?.active);
    if (!activeEnemies.length) return;
    activeEnemies.forEach((enemy) => {
        const nextStats = buildBaseRuntimeStats(enemy);
        if (enemy.stageEliteState?.modifierKeys?.length) {
            applyEliteBaseStats(nextStats, scenario);
            applySelfModifiers(nextStats, enemy.stageEliteState.modifierKeys);
        }
        enemy.applyRuntimeStats?.(nextStats);
    });
}

export function getTriggeredWaves(scene, scenario, scenarioState) {
    if (!scene || !scenarioState || !Array.isArray(scenario?.waves) || !scenario.waves.length) {
        return [];
    }
    const now = getScenarioElapsedMs(scene);
    const triggered = [];

    scenario.waves.forEach((wave) => {
        if (!wave?.id) return;
        const nextTriggerAt = scenarioState.nextWaveAtById?.[wave.id];
        if (typeof nextTriggerAt !== 'number' || now < nextTriggerAt) return;
        triggered.push(wave);
        if ((wave.intervalMs ?? 0) > 0) {
            scenarioState.nextWaveAtById[wave.id] = nextTriggerAt + wave.intervalMs;
        } else {
            scenarioState.nextWaveAtById[wave.id] = Number.POSITIVE_INFINITY;
        }
    });

    return triggered;
}

export const EXAMPLE_ENEMY_RUNTIME_SHAPE = {
    baseStats: {
        maxHealth: 15,
        damage: 10,
        speed: 35,
        scale: 1,
        stunResist: 1
    },
    currentStats: {
        maxHealth: 45,
        damage: 11.5,
        speed: 42,
        scale: 1.5,
        stunResist: 0.5
    },
    stageEliteState: {
        modifierKeys: ['tank']
    }
};
