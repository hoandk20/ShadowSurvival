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
    },
    iceTrail: {
        label: 'Ice Particles',
        description: 'Cold particle stream used for fast ice projectiles.',
        usage: ['skill-projectile'],
        effectClass: 'IceParticleEffect',
        settings: {
            tint: 0xb8f4ff,
            secondaryTint: 0x7cdfff,
            depthOffset: -1,
            speed: { min: 10, max: 28 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.82, end: 0 },
            lifespan: 220,
            frequency: 16,
            quantity: 3,
            followOffset: 12,
            spread: 5
        },
        tags: ['pixel', 'ice', 'particle']
    }
};

export const EFFECT_KEYS = Object.keys(EFFECT_CONFIG);
