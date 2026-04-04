export const FINAL_BOSS_CONFIG = {
    giant_rock: {
        key: 'giant_rock',
        name: 'Giant Rock',
        hudName: 'GIANT ROCK',
        barColor: 0xc95f3f,
        barGlowColor: 0xffd3a1,
        barFrameColor: 0x2b1710,
        rounds: [
            {
                name: 'Round 1',
                maxHealth: 8000,
                damage: 50,
                armor: 12,
                effectResist: 0.8,
                knockbackResist: 0.1,
                behavior: 'chase',
                attackStyle: 'dash_lunge',
                attackRange: 150,
                attackCooldown: 3000,
                meleeAttack: {
                    engageDelayMs: 140,
                    windupMs: 1500,
                    recoveryMs: 260,
                    rangePadding: 10,
                    dashSpeed: 320,
                    dashDistance: 220,
                    dashOvershootDistance: 100
                },
                dashTelegraphWidth: 24,
                dashTelegraphAlpha: 0.18
            },
            {
                name: 'Round 2',
                maxHealth: 10000,
                damage: 50,
                speed: 55,
                armor: 12,
                effectResist: 0.8,
                knockbackResist: 0.1,
                behavior: 'chase',
                attackStyle: 'giant_rock_stone_columns',
                attackRange: 150,
                attackCooldown: 3000,
                meleeAttack: {
                    engageDelayMs: 140,
                    windupMs: 1000,
                    recoveryMs: 400,
                    rangePadding: 10
                }
            }
        ]
    }
};

export function getFinalBossConfig(key) {
    if (!key) return null;
    return FINAL_BOSS_CONFIG[key] ?? null;
}

export function getFinalBossRoundConfig(key, roundIndex = 0) {
    const config = getFinalBossConfig(key);
    if (!config) return null;
    return config.rounds?.[roundIndex] ?? null;
}
