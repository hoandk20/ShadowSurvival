// config/elites.js
export const ELITE_CONFIGS = [
    {
        id: 'ember_succubus',
        baseMonsterId: 'succubus',
        hpMultiplier: 2.4,
        damageMultiplier: 1.35,
        speedMultiplier: 1.1,
        specialAbilities: ['ember_aura'],
        scaleSize: 1.7,
        canBeKnockedBack: false
    },
    {
        id: 'venom_rat',
        baseMonsterId: 'rat',
        hpMultiplier: 1.8,
        damageMultiplier: 1.6,
        speedMultiplier: 1.25,
        specialAbilities: ['poison_trail', 'agile_leap'],
        scaleSize: 1.7
    },
    {
        id: 'torrent_moth',
        baseMonsterId: 'moth_woman',
        hpMultiplier: 2.0,
        damageMultiplier: 1.45,
        speedMultiplier: 1.15,
        specialAbilities: ['frost_chill'],
        scaleSize: 1.7
    }
    ,
    {
        id: 'kitsume_elite',
        baseMonsterId: 'kitsume',
        hpMultiplier: 2.1,
        damageMultiplier: 1.5,
        speedMultiplier: 1.3,
        specialAbilities: ['shadow_dash', 'vicious_arc'],
        scaleSize: 1.7,
        canBeKnockedBack: false
    },
    {
        id: 'zombie_woman_elite',
        baseMonsterId: 'zombie_woman',
        hpMultiplier: 2.6,
        damageMultiplier: 1.4,
        speedMultiplier: 1.05,
        specialAbilities: ['deathly_aura', 'soul_slam'],
        scaleSize: 2,
        canBeKnockedBack: false
    }
];


export const ELITE_SPAWN_SETTINGS = {
    cooldownRange: [20000, 30000],
    maxActive: 10
};

export const ELITE_KILL_MILESTONES = [
    { kills: 10, eliteId: 'ember_succubus', spawnCount: 1 },
    { kills: 20, eliteId: 'zombie_woman_elite', spawnCount: 2 },
    { kills: 30, eliteId: 'kitsume_elite', spawnCount: 3 }
];
