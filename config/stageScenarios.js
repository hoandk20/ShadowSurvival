const ELITE_MODIFIERS = {
    tank: {
        kind: 'self',
        apply(stats) {
            stats.maxHealth *= 5;
            stats.knockbackResist *= 0.1;
        }
    },
    fast: {
        kind: 'self',
        apply(stats) {
            stats.speed *= 5;
            stats.scale *= 0.6;
            stats.damage -= 7;
            stats.maxHealth *= 0.5;
            stats.knockbackResist *= 2;
        }
    },
    berserk: {
        kind: 'self',
        apply(stats) {
            stats.damage *= 5;
            stats.knockbackResist *= 0.5;
        }
    },
    giant: {
        kind: 'self',
        apply(stats) {
            stats.scale *= 2;
            stats.maxHealth *= 10;
            stats.speed *= 0.5;
            stats.knockbackResist *= 0.1;
        }
    },
    aura_speed: {
        kind: 'aura',
        applyAura(stats) {
            stats.speed *= 2;
        }
    },
    aura_damage: {
        kind: 'aura',
        applyAura(stats) {
            stats.damage *= 3;
        }
    },
    aura_hp: {
        kind: 'aura',
        applyAura(stats) {
            stats.maxHealth *= 2;
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
    },
    aura_speed: {
        tint: 0xdff7ff,
        aura: {
            color: 0xc2f1ff,
            alpha: 0.12,
            pulseScale: 1.06,
            radius: 34
        }
    },
    aura_damage: {
        tint: 0xff6767,
        aura: {
            color: 0xff5a5a,
            alpha: 0.12,
            pulseScale: 1.05,
            radius: 34
        }
    },
    aura_hp: {
        tint: 0x7cff8e,
        aura: {
            color: 0x7cff8e,
            alpha: 0.12,
            pulseScale: 1.05,
            radius: 34
        }
    }
};

export const STAGE_SCENARIOS = {
    church_sanctuary: {
        normalSpawnPerSecond: 0.5,
        normalSpawnPerSecondPerMinute: 0.1,
        enemyHealthPercentPerMinute: 10,
        enemyUnlockTimeline: [
             { enemyType: 'worm', unlockAtMinute: 0, spawnWeight: 5 },
            { enemyType: 'slime', unlockAtMinute: 3, spawnWeight: 10 },
            { enemyType: 'bat', unlockAtMinute: 6, spawnWeight: 15 },
            { enemyType: 'succubus', unlockAtMinute: 9, spawnWeight: 20 },
            { enemyType: 'moth_woman', unlockAtMinute: 12, spawnWeight: 25 },
            { enemyType: 'widow', unlockAtMinute: 15, spawnWeight: 30 },
            { enemyType: 'kitsume', unlockAtMinute: 20, spawnWeight: 35 },
            { enemyType: 'zombie_woman', unlockAtMinute: 22, spawnWeight: 40 },
           
        ],
        elite: {
            baseChance: 0.001,
            chancePerMinute: 0.005,
            maxChance: 0.5,
            lootTable: [
                { itemKey: 'xp_orb_icon', chance: 0.3, minAmount: 18, maxAmount: 30 }
            ],
            baseStatMultipliers: {
                maxHealth: 10,
                damage: 1.5,
                speed: 1.5,
                scale: 1.2
            },
            modifierCount: {
                min: 1,
                max: 1
            },
            auraRadius: 120,
            tint: 0xffd166,
            modifiedTint: 0x5da9ff,
            trailTint: 0xffef99,
            modifiedTrailTint: 0xb9d7ff,
            trailSpawnInterval: 18,
            trailLifetime: 90,
            trailScale: 0.4,
            trailMinAlpha: 0.2,
            modifierPool: Object.keys(ELITE_MODIFIERS)
        },
        waves: [
            {
                id: 'church_opening_swarm',
                startAtMs: 50000,
                intervalMs: 40000,
                count: 50,
                clusterRadius: 60
            }
        ]
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
    const percentPerMinute = scenario?.enemyHealthPercentPerMinute;
    if (typeof percentPerMinute !== 'number' || percentPerMinute <= 0) {
        return 1;
    }
    const elapsedMinutes = getScenarioElapsedMs(scene) / 60000;
    return 1 + ((percentPerMinute * elapsedMinutes) / 100);
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
        knockbackResist: baseStats.knockbackResist ?? enemy.knockbackResist ?? 1
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
}

function applyEliteVisuals(enemy, modifierKeys, scenario) {
    const primaryModifierKey = modifierKeys[0] ?? null;
    const visual = primaryModifierKey ? ELITE_MODIFIER_VISUALS[primaryModifierKey] ?? null : null;
    const defaultTint = scenario?.elite?.tint ?? 0xffd166;
    const defaultTrailTint = scenario?.elite?.trailTint ?? defaultTint;

    enemy.eliteTint = visual?.tint ?? defaultTint;
    enemy.setTint(enemy.eliteTint);

    enemy.disableMotionTrail?.();
    enemy.disableAuraEffect?.();

    if (visual?.trail) {
        enemy.enableMotionTrail?.({
            depthOffset: -2,
            blendMode: 'ADD',
            sizeFactor: 0.8,
            ...visual.trail
        });
    }

    if (visual?.aura) {
        enemy.enableAuraEffect?.(visual.aura);
    }

    if (!visual?.trail && !visual?.aura && !primaryModifierKey) {
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
        modifierKeys: [...modifierKeys],
        auraRadius: scenario?.elite?.auraRadius ?? 120
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

    const nextStatsByEnemy = new Map();
    activeEnemies.forEach((enemy) => {
        const nextStats = buildBaseRuntimeStats(enemy);
        if (enemy.stageEliteState?.modifierKeys?.length) {
            applyEliteBaseStats(nextStats, scenario);
            applySelfModifiers(nextStats, enemy.stageEliteState.modifierKeys);
        }
        nextStatsByEnemy.set(enemy, nextStats);
    });

    const auraSources = activeEnemies.filter((enemy) =>
        enemy.stageEliteState?.modifierKeys?.some((modifierKey) => ELITE_MODIFIERS[modifierKey]?.kind === 'aura')
    );

    for (const source of auraSources) {
        const radius = source.stageEliteState?.auraRadius ?? scenario.elite.auraRadius ?? 120;
        const radiusSq = radius * radius;
        for (const target of activeEnemies) {
            if (target === source) continue;
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            if ((dx * dx) + (dy * dy) > radiusSq) continue;
            const targetStats = nextStatsByEnemy.get(target);
            source.stageEliteState.modifierKeys.forEach((modifierKey) => {
                const modifier = ELITE_MODIFIERS[modifierKey];
                if (modifier?.kind === 'aura') {
                    modifier.applyAura(targetStats);
                }
            });
        }
    }

    activeEnemies.forEach((enemy) => {
        const nextStats = nextStatsByEnemy.get(enemy);
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
        scale: 1
    },
    currentStats: {
        maxHealth: 45,
        damage: 11.5,
        speed: 42,
        scale: 1.5
    },
    stageEliteState: {
        modifierKeys: ['tank', 'aura_damage'],
        auraRadius: 120
    }
};
