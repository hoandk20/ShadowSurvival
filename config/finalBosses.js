export const FINAL_BOSS_CONFIG = {
    giant_rock: {
        name: 'Giant Rock',
        hudName: 'GIANT ROCK',
        barColor: 0xc95f3f,
        barGlowColor: 0xffd3a1,
        barFrameColor: 0x2b1710,
        rounds: [
            {
                name: 'Round 1',
                maxHealth: 8,
                damage: 150,
                speed: 55,
                armor: 30,
                effectResist: 0.1,
                knockbackResist: 0.1,
                behavior: 'chase',
                attackStyle: 'dash_lunge',
                attackRange: 150,
                attackCooldown: 500,
                meleeAttack: {
                    engageDelayMs: 140,
                    windupMs: 1000,
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
                maxHealth: 100000,
                damage: 150,
                speed: 65,
                armor: 30,
                effectResist: 0.1,
                knockbackResist: 0.1,
                behavior: 'chase',
                attackStyle: 'giant_rock_stone_columns',
                attackRange: 150,
                attackCooldown: 500,
                meleeAttack: {
                    engageDelayMs: 140,
                    windupMs: 1000,
                    recoveryMs: 400,
                    rangePadding: 10
                }
            }
        ]
    },
    plant: {
        name: 'Plant Abomination',
        hudName: 'PLANT ABOMINATION',
        barColor: 0x4d9a4a,
        barGlowColor: 0xbdf6a0,
        barFrameColor: 0x10240f,
        rounds: [
            {
                name: 'Round 1',
                maxHealth: 80000,
                damage: 150,
                armor: 30,
                speed: 60,
                effectResist: 0.8,
                knockbackResist: 0.1,
                behavior: 'chase',
                attackStyle: 'plant_boss_cycle',
                attackRange: 150,
                attackCooldown: 100,
                meleeAttack: {
                    windupMs: 1500,
                    recoveryMs: 260
                }
            },
            {
                name: 'Round 2',
                maxHealth: 100000,
                damage: 150,
                speed: 70,
                armor: 30,
                effectResist: 0.8,
                knockbackResist: 0.1,
                behavior: 'chase',
                attackStyle: 'plant_boss_cycle',
                attackRange: 150,
                attackCooldown: 3000,
                meleeAttack: {
                    windupMs: 1000,
                    recoveryMs: 400
                }
            }
        ]
    },
    black_widow: {
        name: 'Black Widow',
        hudName: 'BLACK WIDOW',
        barColor: 0x7f2230,
        barGlowColor: 0xff9aa6,
        barFrameColor: 0x1a0910,
        rounds: [
            {
                name: 'Round 1',
                maxHealth: 80000,
                damage: 150,
                armor: 30,
                speed: 120,
                effectResist: 0.8,
                knockbackResist: 0.1,
                behavior: 'chase',
                attackStyle: 'black_widow_cycle',
                attackRange: 150,
                attackCooldown: 2000,
                meleeAttack: {
                    windupMs: 1500,
                    recoveryMs: 260
                }
            },
            {
                name: 'Round 2',
                maxHealth: 100000,
                damage: 150,
                speed: 120,
                armor: 30,
                effectResist: 0.8,
                knockbackResist: 0.1,
                behavior: 'chase',
                attackStyle: 'black_widow_cycle',
                attackRange: 150,
                attackCooldown: 1000,
                meleeAttack: {
                    windupMs: 1000,
                    recoveryMs: 400
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
