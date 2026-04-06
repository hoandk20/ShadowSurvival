import { createMaprockFieldScenario } from './map/maprockFieldScenario.js';
import { createChurchSanctuaryScenario } from './map/churchSanctuaryScenario.js';

const SHARED_ENEMY_HEALTH_MILESTONES = [
    { minute: 3, setMultiplier: 1.5 },
    { minute: 5, setMultiplier: 2 },
    { minute: 7, setMultiplier: 2.5 },
    { minute: 10, setMultiplier: 3 },
    { minute: 15, setMultiplier: 5 },
    { minute: 17, setMultiplier: 10 },
    { minute: 20, setMultiplier: 13 },
    { minute: 23, setMultiplier: 17 }
];

export const STAGE_SCENARIOS = {
    maprock_field: createMaprockFieldScenario(SHARED_ENEMY_HEALTH_MILESTONES),
    church_sanctuary: createChurchSanctuaryScenario(SHARED_ENEMY_HEALTH_MILESTONES),
    inside_church: {
        normalSpawnPerSecond: 0.5,
        normalSpawnPerSecondPerMinute: 0.7,
        enemyHealthMilestones: SHARED_ENEMY_HEALTH_MILESTONES,
        enemyUnlockTimeline: [
            { enemyType: 'bat', unlockAtMinute: 0 },
            { enemyType: 'slime', unlockAtMinute: 3 },
            { enemyType: 'medusa', unlockAtMinute: 6 },
            { enemyType: 'rat', unlockAtMinute: 9 },
            { enemyType: 'skeleton', unlockAtMinute: 12 },
            { enemyType: 'succubus', unlockAtMinute: 15 },
            { enemyType: 'widow', unlockAtMinute: 20 },
            { enemyType: 'worm', unlockAtMinute: 22 },
            { enemyType: 'minotau', unlockAtMinute: 24 }
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
    const waveSpawnRateByWave = scenario?.waveSpawnRateByWave;
    if (typeof waveSpawnRateByWave === 'function') {
        const waveNumber = scene?.currentWaveNumber ?? 1;
        const waveSpawnRate = Number(waveSpawnRateByWave(waveNumber, scene));
        if (Number.isFinite(waveSpawnRate) && waveSpawnRate > 0) {
            return waveSpawnRate;
        }
    }

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

export function getScenarioWavePlan(scenario, waveNumber) {
    const wavePlans = Array.isArray(scenario?.wavePlans) ? scenario.wavePlans : [];
    if (!wavePlans.length) return null;
    const index = Math.max(0, Math.round(waveNumber) - 1);
    const wavePlan = wavePlans[index] ?? null;
    if (Array.isArray(wavePlan)) {
        return wavePlan;
    }
    if (Array.isArray(wavePlan?.enemies)) {
        return wavePlan.enemies;
    }
    return null;
}

export function getScenarioWaveDurationSeconds(scenario, waveNumber, fallbackSeconds = 45) {
    const wavePlans = Array.isArray(scenario?.wavePlans) ? scenario.wavePlans : [];
    if (!wavePlans.length) return fallbackSeconds;
    const index = Math.max(0, Math.round(waveNumber) - 1);
    const wavePlan = wavePlans[index] ?? null;
    const durationSeconds = wavePlan?.durationSeconds;
    if (typeof durationSeconds === 'number' && durationSeconds > 0) {
        return durationSeconds;
    }
    return fallbackSeconds;
}
