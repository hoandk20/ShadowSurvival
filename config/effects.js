// config/effects.js
export const EFFECT_CONFIG = {
    criticalHit: {
        label: 'Critical Hit Burst',
        description: 'Tối-toned pixel burst spawned when enemies take direct damage.',
        usage: ['enemy-hit', 'impact'],
        effectClass: 'CriticalHitEffect',
        settings: {
            depthOffset: 2
        },
        tags: ['pixel', 'dark', 'sparkle']
    }
    ,
    auraGlow: {
        label: 'Holy Aura Burst',
        description: 'Golden pixel aura that wraps around the aura skill.',
        usage: ['skill-aura'],
        effectClass: 'HolyAuraEffect',
        settings: {
            depthOffset: 3
        },
        tags: ['pixel', 'holy', 'loop']
    }
};

export const EFFECT_KEYS = Object.keys(EFFECT_CONFIG);
