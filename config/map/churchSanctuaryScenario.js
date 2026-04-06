const CHURCH_SANCTUARY_MAX_WAVE = 20;
const CHURCH_SANCTUARY_REGULAR_WAVE_DURATION = 60;
const CHURCH_SANCTUARY_BOSS_WAVE_DURATION = 9999;

function getEnemyMaxHealth(waveNumber, enemyType) {
    if (!enemyType) return null;
    if (waveNumber <= 0) return null;
    const clampedWave = Phaser.Math.Clamp(Math.round(waveNumber), 1, CHURCH_SANCTUARY_MAX_WAVE);
    const progress = (clampedWave - 1) / (CHURCH_SANCTUARY_MAX_WAVE - 1);
    return Math.round(10 + (390 * progress));
}

function getEnemyDamage(waveNumber) {
    if (waveNumber <= 0) return null;
    const clampedWave = Phaser.Math.Clamp(Math.round(waveNumber), 1, CHURCH_SANCTUARY_MAX_WAVE);
    const progress = (clampedWave - 1) / (CHURCH_SANCTUARY_MAX_WAVE - 1);
    return Math.round(10 + (30 * progress));
}

function scaleWaveEnemy(enemy, waveNumber) {
    if (!enemy) return enemy;
    if (enemy.isBoss || enemy.isMiniBoss) {
        return {
            ...enemy,
            statsOverride: enemy.statsOverride ? { ...enemy.statsOverride } : undefined
        };
    }

    const scaledMaxHealth = getEnemyMaxHealth(waveNumber, enemy.enemyType);
    const scaledDamage = getEnemyDamage(waveNumber);
    const scaledArmor = waveNumber >= 15 ? 10 : (waveNumber >= 10 ? 5 : 0);
    if (!Number.isFinite(scaledMaxHealth)) {
        return {
            ...enemy,
            statsOverride: enemy.statsOverride ? { ...enemy.statsOverride } : undefined
        };
    }

    return {
        ...enemy,
        statsOverride: {
            ...(enemy.statsOverride ?? {}),
            maxHealth: scaledMaxHealth,
            ...(Number.isFinite(scaledDamage) ? { damage: scaledDamage } : {}),
            ...(scaledArmor > 0 ? { armor: scaledArmor } : {})
        }
    };
}

function applyWaveScaling(wavePlans = []) {
    return wavePlans
        .filter(Boolean)
        .map((wavePlan, index) => ({
            ...wavePlan,
            enemies: Array.isArray(wavePlan?.enemies)
                ? wavePlan.enemies.map((enemy) => scaleWaveEnemy(enemy, index + 1))
                : []
        }));
}

function regularWave(enemies = []) {
    return {
        durationSeconds: CHURCH_SANCTUARY_REGULAR_WAVE_DURATION,
        enemies: enemies.map((enemy) => ({ ...enemy }))
    };
}

function bossWave(enemies = []) {
    return {
        durationSeconds: CHURCH_SANCTUARY_BOSS_WAVE_DURATION,
        clearWhenBossesDefeated: true,
        enemies: enemies.map((enemy) => ({ ...enemy }))
    };
}

function enemy(enemyType, weight, count = 999) {
    return { enemyType, count, weight };
}

function miniBoss(enemyType, count, statsOverride, weight = 99) {
    return { enemyType, count, weight, isMiniBoss: true, statsOverride: { ...statsOverride } };
}

function finalBoss(enemyType, count = 1, weight = 99, statsOverride = null) {
    return {
        enemyType,
        count,
        weight,
        isBoss: true,
        ...(statsOverride ? { statsOverride: { ...statsOverride } } : {})
    };
}

function cloneWaveEnemy(enemyConfig) {
    return {
        ...enemyConfig,
        ...(enemyConfig.statsOverride ? { statsOverride: { ...enemyConfig.statsOverride } } : {})
    };
}

function buildPhaseWeight(baseWeight, waveOffset, step = -1, minimum = 1) {
    return Math.max(minimum, baseWeight + (waveOffset * step));
}

function createWavePlans() {
    const ailenBoss = miniBoss('ailen', 2, { maxHealth: 4000, damage: 50, armor: 7, scale: 1.7 });
    const skeletonBoss = miniBoss('skeleton', 3, { maxHealth: 10000, damage: 50, armor: 10, scale: 1.7 });
    const ailenPair = miniBoss('ailen', 2, { maxHealth: 8000, damage: 50, armor: 7, scale: 1.7 });
    const skeletonTrio = miniBoss('skeleton', 3, { maxHealth: 10000, damage: 50, armor: 10, scale: 1.7 });
    const skeletonFive = miniBoss('skeleton', 5, { maxHealth: 10000, damage: 15 });
    const waves = [];

    for (let wave = 1; wave <= CHURCH_SANCTUARY_MAX_WAVE; wave += 1) {
        let enemies = [];
        let bossEnemies = [];

        if (wave <= 5) {
            enemies = [enemy('slime', 12)];
            if (wave === 5) bossEnemies = [ailenBoss];
        } else if (wave <= 10) {
            const phaseOffset = wave - 6;
            enemies = [
                enemy('slime', buildPhaseWeight(11, phaseOffset, -1, 8)),
                enemy('widow', buildPhaseWeight(8, phaseOffset, 1, 8)),
                enemy('succubus', 2),
                enemy('lamia', 2)
            ];
            if (wave === 10) bossEnemies = [skeletonBoss];
        } else if (wave <= 15) {
            const phaseOffset = wave - 11;
            enemies = [
                enemy('slime', buildPhaseWeight(8, phaseOffset, -1, 6)),
                enemy('widow', buildPhaseWeight(10, phaseOffset, -1, 8)),
                enemy('succubus', 2),
                enemy('lamia', 2),
                enemy('bomber', buildPhaseWeight(1, phaseOffset, 1, 1))
            ];
            if (wave === 15) bossEnemies = [ailenPair, skeletonTrio];
        } else {
            const phaseOffset = wave - 16;
            enemies = [
                enemy('bugmonster', buildPhaseWeight(13, phaseOffset, 1, 13)),
                enemy('slime', buildPhaseWeight(6, phaseOffset, -1, 4)),
                enemy('widow', buildPhaseWeight(8, phaseOffset, -1, 7)),
                enemy('succubus', 2),
                enemy('lamia', 2),
                enemy('bomber', 2)
            ];
            if (wave === 20) bossEnemies = [skeletonFive, finalBoss('plant')];
        }

        const waveEnemies = [
            ...enemies.map(cloneWaveEnemy),
            ...bossEnemies.map(cloneWaveEnemy)
        ];
        waves.push(
            bossEnemies.length > 0
                ? bossWave(waveEnemies)
                : regularWave(waveEnemies)
        );
    }

    return applyWaveScaling(waves);
}

export function getChurchSanctuarySpawnRate(waveNumber = 1) {
    const clampedWave = Phaser.Math.Clamp(Math.round(waveNumber), 1, 7);
    const progress = (clampedWave - 1) / 6;
    return 0.5 + (1.5 * progress);
}

export function createChurchSanctuaryScenario(sharedEnemyHealthMilestones = []) {
    return {
        normalSpawnPerSecond: 0.5,
        waveSpawnRateByWave: getChurchSanctuarySpawnRate,
        enemyHealthMilestones: sharedEnemyHealthMilestones,
        wavePlans: createWavePlans()
    };
}
