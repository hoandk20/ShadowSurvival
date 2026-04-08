export const STATUS_EFFECT_CONFIG = {
    burn: {
        defaultStats: {
            durationMs: 4000,
            damageRatioPerTick: 0.3,
            minDamagePerTick: 5,
            reapplyDelayMs: 400,
            maxStacks: 6
        },
        highlightTint: 0xff7a2f,
        highlightPriority: 60,
        iconPriority: 70,
        iconFrame: 'image.png',
        showStack: true
    },
    shock: {
        defaultStats: {
            durationMs: 2000,
            slowDurationMs: 2000,
            slowMultiplier: 0.7,
            chainCount: 2,
            chainRadius: 120,
            chainDamageRatios: [0.75, 0.5, 0.25],
            chainStepDelayMs: 90,
            maxStacks: 4
        },
        highlightTint: 0xf6e65a,
        highlightPriority: 70,
        iconPriority: 60,
        iconFrame: 'image_2.png',
        showStack: false
    },
    freeze: {
        defaultStats: {
            durationMs: 1500,
            mode: 'stun',
            slowMultiplier: 0,
            maxStacks: 1
        },
        highlightTint: 0x7fd8ff,
        highlightPriority: 80,
        iconPriority: 80,
        iconFrame: 'image_3.png',
        showStack: false
    },
    petrify: {
        defaultStats: {
            durationMs: 700,
            mode: 'stun',
            slowMultiplier: 0,
            maxStacks: 1
        },
        // Stone-ish tint + custom icon (shown above player/enemy when active).
        highlightTint: 0xbab3a5,
        highlightPriority: 55,
        iconPriority: 85,
        iconTextureKey: 'petrify_icon',
        showStack: false
    },
    ritual_slow: {
        defaultStats: {
            durationMs: 650,
            slowMultiplier: 0.65,
            maxStacks: 1
        },
        highlightTint: 0x8a2be2,
        highlightPriority: 35,
        iconPriority: 75,
        iconTextureKey: 'ritual_zone_icon',
        showStack: false
    },
    root: {
        defaultStats: {
            durationMs: 550,
            maxStacks: 1
        },
        highlightTint: 0xff8a4d,
        highlightPriority: 65,
        iconPriority: 82,
        iconTextureKey: 'root_icon',
        showStack: false
    },
    poison: {
        defaultStats: {
            durationMs: 4000,
            damageRatioPerTick: 0.3,
            minDamagePerTick: 5,
            trailIntervalMs: 700,
            trailDamage: 4,
            antiHealMultiplier: 0.35,
            reapplyDelayMs: 400,
            maxStacks: 6
        },
        highlightTint: 0x7dff6a,
        highlightPriority: 50,
        iconPriority: 50,
        iconFrame: 'image_4.png',
        showStack: true
    },
    shield: {
        defaultStats: {
            durationMs: 0,
            capacity: 50,
            refillIntervalMs: 10000,
            maxStacks: 1
        },
        highlightTint: 0x7af7ff,
        highlightPriority: 20,
        iconPriority: 20,
        iconFrame: 'image_5.png',
        showStack: false
    },
    bleed: {
        defaultStats: {
            durationMs: 4000,
            damageRatioPerTick: 0.3,
            minDamagePerTick: 5,
            burstDamage: 10,
            reapplyDelayMs: 400,
            maxStacks: 10
        },
        highlightTint: 0xff4f6d,
        highlightPriority: 40,
        iconPriority: 40,
        iconFrame: 'image_6.png',
        showStack: true
    },
    mark: {
        defaultStats: {
            durationMs: 5000,
            damageIncreasePerStack: 0.25,
            maxStacks: 1
        },
        highlightTint: 0xff5de4,
        highlightPriority: 30,
        iconPriority: 30,
        iconFrame: 'image_7.png',
        showStack: false
    },
    explosion: {
        defaultStats: {
            durationMs: 0,
            radius: 45,
            damageRatio: 0.5,
            maxStacks: 1
        },
        highlightTint: 0xffaa33,
        highlightPriority: 10,
        iconPriority: 10,
        showStack: false
    }
};

export function getStatusEffectConfig(effectKey) {
    return STATUS_EFFECT_CONFIG[effectKey] ?? null;
}

export function getStatusEffectDefaultOptions(effectKey) {
    return { ...(getStatusEffectConfig(effectKey)?.defaultStats ?? {}) };
}
