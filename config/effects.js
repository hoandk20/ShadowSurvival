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
    },
    codeProjectile: {
        label: 'Code Projectile',
        description: 'Neon-green glyph burst used for code-themed projectiles.',
        usage: ['skill-projectile'],
        effectClass: 'CodeProjectileEffect',
        settings: {
            depthOffset: 2
        },
        tags: ['pixel', 'code', 'green']
    }
};

export const EFFECT_KEYS = Object.keys(EFFECT_CONFIG);
