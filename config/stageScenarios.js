const ELITE_MODIFIERS = {
    tank: {
        kind: 'self',
        apply(stats) {
            stats.maxHealth *= 3;
            stats.speed *= 0.8;
        }
    },
    fast: {
        kind: 'self',
        apply(stats) {
            stats.speed *= 1.5;
        }
    },
    berserk: {
        kind: 'self',
        apply(stats) {
            stats.damage *= 1.5;
        }
    },
    giant: {
        kind: 'self',
        apply(stats) {
            stats.scale *= 1.5;
            stats.maxHealth *= 1.5;
        }
    },
    aura_speed: {
        kind: 'aura',
        applyAura(stats) {
            stats.speed *= 1.2;
        }
    },
    aura_damage: {
        kind: 'aura',
        applyAura(stats) {
            stats.damage *= 1.15;
        }
    }
};

export const STAGE_SCENARIOS = {
    church_sanctuary: {
        elite: {
            baseChance: 0.05,
            chancePerMinute: 0.02,
            maxChance: 0.3,
            modifierCount: {
                min: 1,
                max: 3
            },
            auraRadius: 120,
            tint: 0xffd166,
            trailTint: 0xffef99,
            trailSpawnInterval: 18,
            trailLifetime: 90,
            trailScale: 0.4,
            trailMinAlpha: 0.2,
            modifierPool: Object.keys(ELITE_MODIFIERS)
        },
        waves: [
            {
                id: 'church_opening_swarm',
                startAtMs: 27000,
                intervalMs: 35000,
                count: 20,
                clusterRadius: 90,
                enemyTypes: ['skeleton', 'succubus', 'lamia', 'moth_woman']
            }
        ]
    }
};

export function getStageScenario(mapKey) {
    return STAGE_SCENARIOS[mapKey] ?? null;
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
    const elapsedMinutes = Math.max((scene.time?.now ?? 0) / 60000, 0);
    const scaledChance = eliteConfig.baseChance + (eliteConfig.chancePerMinute * elapsedMinutes);
    return Math.min(eliteConfig.maxChance ?? scaledChance, scaledChance);
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
        scale: baseStats.scale ?? enemy.scaleSize ?? 1
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

export function applyEliteModifiers(enemy, modifierKeys, scenario) {
    if (!enemy || !Array.isArray(modifierKeys) || !modifierKeys.length) return false;
    ensureEnemyStats(enemy);
    enemy.isElite = true;
    enemy.stageEliteState = {
        modifierKeys: [...modifierKeys],
        auraRadius: scenario?.elite?.auraRadius ?? 120
    };
    enemy.eliteTint = scenario?.elite?.tint ?? 0xffd166;
    enemy.setTint(enemy.eliteTint);
    enemy.enableMotionTrail?.({
        tint: scenario?.elite?.trailTint ?? enemy.eliteTint,
        spawnInterval: scenario?.elite?.trailSpawnInterval ?? 18,
        lifetime: scenario?.elite?.trailLifetime ?? 90,
        scale: scenario?.elite?.trailScale ?? 0.4,
        minAlpha: scenario?.elite?.trailMinAlpha ?? 0.2,
        depthOffset: -2,
        blendMode: 'ADD',
        sizeFactor: 0.8
    });
    const nextStats = buildBaseRuntimeStats(enemy);
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
    const now = scene.time?.now ?? 0;
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
