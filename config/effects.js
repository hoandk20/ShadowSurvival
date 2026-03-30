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
    },
    aquaStreamTrail: {
        label: 'Aqua Stream Trail',
        description: 'Watery particle stream used for Aqua Stream projectiles.',
        usage: ['skill-projectile'],
        effectClass: 'WaterParticleEffect',
        settings: {
            tint: 0xd7fbff,
            secondaryTint: 0x5fd6ff,
            tertiaryTint: 0x2fa9ff,
            depthOffset: -1,
            speed: { min: 10, max: 26 },
            scale: { start: 1.05, end: 0.15 },
            alpha: { start: 0.52, end: 0 },
            lifespan: 320,
            frequency: 18,
            quantity: 4,
            followOffset: 14,
            spread: 8,
            radialDrift: 6
        },
        tags: ['pixel', 'water', 'particle']
    },
    cometTail: {
        label: 'Comet Tail',
        description: 'Warm comet-like particle trail for falling celestial projectiles.',
        usage: ['skill-projectile'],
        effectClass: 'CometTailEffect',
        settings: {
            depthOffset: -1,
            coreTint: 0xfff0b3,
            glowTint: 0xffc26b,
            emberTint: 0xff7a45,
            speed: { min: 22, max: 52 },
            scale: { start: 1.5, end: 0.1 },
            alpha: { start: 0.88, end: 0 },
            lifespan: 420,
            frequency: 14,
            quantity: 5,
            followOffset: 26,
            spread: 4
        },
        tags: ['pixel', 'fire', 'trail', 'celestial']
    },
    cometTailAstral: {
        label: 'Comet Tail Astral',
        description: 'Oversized comet trail variant for Astral.',
        usage: ['skill-projectile'],
        effectClass: 'CometTailEffect',
        settings: {
            depthOffset: -1,
            coreTint: 0xe8f7ff,
            glowTint: 0x7fc8ff,
            emberTint: 0x2f6dff,
            speed: { min: 22, max: 52 },
            scale: { start: 3, end: 0.2 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 480,
            frequency: 14,
            quantity: 6,
            followOffset: 32,
            spread: 4
        },
        tags: ['pixel', 'blue', 'trail', 'celestial']
    }
};

export const EFFECT_KEYS = Object.keys(EFFECT_CONFIG);
