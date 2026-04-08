// config/skill.js
function normalizeSkillConfig(config = {}) {
    const normalized = { ...config };
    const objects = config.objects ?? {};
    const targeting = config.targeting ?? {};
    const projectile = config.projectile ?? {};
    const skyDrop = config.skyDrop ?? {};
    const knockback = config.knockback ?? {};
    const critical = config.critical ?? {};
    const explosion = config.explosion ?? {};
    const stun = config.stun ?? {};

    if (Array.isArray(config.tags)) normalized.tags = [...config.tags];
    const normalizedStatusEffects = Array.isArray(config.statusEffects)
        ? config.statusEffects.map((entry) => ({
            trigger: 'onHit',
            target: 'target',
            chance: 1,
            ...entry
        }))
        : [];
    if (normalizedStatusEffects.length) {
        normalized.statusEffects = normalizedStatusEffects.slice(0, 1);
    }
    if (Array.isArray(config.behaviors)) normalized.behaviors = config.behaviors.map((entry) => ({ ...entry }));

    if (typeof objects.multiple === 'boolean') normalized.multipleObject = objects.multiple;
    if (typeof objects.defaultCount === 'number') normalized.defaultObjects = objects.defaultCount;
    if (typeof objects.maxCount === 'number') normalized.maxObjects = objects.maxCount;
    if (typeof objects.spawnInterval === 'number') normalized.objectSpawnInterval = objects.spawnInterval;

    if (typeof targeting.homing === 'boolean') normalized.homing = targeting.homing;
    if (typeof targeting.autoAim === 'boolean') {
        normalized.autoAim = targeting.autoAim;
    } else if (targeting.autoAim && typeof targeting.autoAim === 'object') {
        normalized.autoAim = targeting.autoAim.enabled ?? true;
        if (typeof targeting.autoAim.distinctTargets === 'boolean') normalized.autoAimDistinctTargets = targeting.autoAim.distinctTargets;
        if (typeof targeting.autoAim.burstInterval === 'number') normalized.autoAimBurstInterval = targeting.autoAim.burstInterval;
        if (typeof targeting.autoAim.fanAngle === 'number') normalized.autoAimFanAngle = targeting.autoAim.fanAngle;
        if (typeof targeting.autoAim.spawnRadius === 'number') normalized.autoAimSpawnRadius = targeting.autoAim.spawnRadius;
    }

    if (typeof projectile.speed === 'number') normalized.projectileSpeed = projectile.speed;
    if (typeof projectile.range === 'number') normalized.travelRange = projectile.range;
    if (typeof projectile.alignWithMovement === 'boolean') normalized.alignWithMovement = projectile.alignWithMovement;
    if (typeof projectile.destroyOnHit === 'boolean') normalized.destroyOnHit = projectile.destroyOnHit;
    if (typeof projectile.bounceOnHit === 'boolean') normalized.bounceOnHit = projectile.bounceOnHit;
    if (typeof projectile.retargetOnHit === 'boolean') normalized.retargetOnHit = projectile.retargetOnHit;
    if (typeof projectile.maxChainTargets === 'number') normalized.maxChainTargets = projectile.maxChainTargets;
    if (typeof projectile.spinOnFlight === 'boolean') normalized.spinOnFlight = projectile.spinOnFlight;
    if (typeof projectile.spinSpeed === 'number') normalized.spinSpeed = projectile.spinSpeed;
    if (typeof projectile.castRotationStartAngle === 'number') normalized.castRotationStartAngle = projectile.castRotationStartAngle;
    if (typeof projectile.castRotationSpeed === 'number') normalized.castRotationSpeed = projectile.castRotationSpeed;
    if (typeof projectile.rotationOffset === 'number') normalized.rotationOffset = projectile.rotationOffset;
    if (typeof projectile.rotateSpriteToDirection === 'boolean') normalized.rotateSpriteToDirection = projectile.rotateSpriteToDirection;

    if (typeof skyDrop.enabled === 'boolean') normalized.dropFromSky = skyDrop.enabled;
    if (typeof skyDrop.height === 'number') normalized.skyHeight = skyDrop.height;
    if (typeof skyDrop.trackingSpeed === 'number') normalized.dropTrackingSpeed = skyDrop.trackingSpeed;
    if (typeof skyDrop.entryOffsetX === 'number') normalized.skyEntryOffsetX = skyDrop.entryOffsetX;

    if (typeof knockback.takeDamage === 'boolean') normalized.knockbackTakeDamage = knockback.takeDamage;
    if (typeof knockback.maxSpeed === 'number') normalized.maxKnockbackSpeed = knockback.maxSpeed;
    if (typeof knockback.distance === 'number') normalized.knockbackDistance = knockback.distance;
    if (typeof knockback.dragFactor === 'number') normalized.knockbackDragFactor = knockback.dragFactor;
    if (typeof knockback.dragDuration === 'number') normalized.knockbackDragDuration = knockback.dragDuration;
    if (typeof knockback.speedMultiplier === 'number') normalized.knockbackSpeedMultiplier = knockback.speedMultiplier;
    if (typeof knockback.count === 'number' || knockback.count === Infinity) normalized.numberKnockback = knockback.count;
    // Default knockback force for skills unless explicitly configured per-skill.
    normalized.knockback = 100;
    normalized.knockbackSpeedMultiplier = normalized.knockbackSpeedMultiplier ?? 1.35;

    if (typeof critical.chance === 'number') normalized.critChance = critical.chance;
    if (typeof critical.multiplier === 'number') normalized.critMultiplier = critical.multiplier;
    if (critical.color) normalized.critColor = critical.color;

    if (typeof stun.duration === 'number') normalized.stunDuration = stun.duration;
    if (stun.color) normalized.stunColor = stun.color;

    return normalized;
}

const RAW_SKILL_CONFIG = {
    ritual_zone: {
        label: 'Ritual Zone',
        category: 'projectile',
        attackStyle: 'ritual_zone',
        targeting: {
            autoAim: true
        },
        projectile: {
            // Used by Player.hasEnemyInSkillRange() gating for projectile-category skills.
            range: 160
        },
        // No sprite needed; zone visuals are spawned by StatusEffectSystem.
        playAnimation: false,
        visibleDuringEffect: false,
        hitboxWidth: 1,
        hitboxHeight: 1,
        // Base damage is distributed across ticks (via zoneDamageRatio and zoneTickIntervalMs).
        damage: 24,
        duration: 1500,
        cooldown: 2300,
        zoneRadius: 130,
        zoneDurationMs: 1600,
        zoneTickIntervalMs: 400,
        zoneDamageRatio: 0.3,
        // Compress base damage contribution so effect damage scaling matters more.
        // baseTotalDamage = (baseDamage ^ exponent) * zoneDamageRatio
        zoneBaseDamageExponent: 0.85,
        zoneSlowMultiplier: 0.65,
        zoneSlowDurationMs: 650,
        tags: ['ritual', 'zone']
    },
    frost_zone: {
        label: 'Frost Zone',
        category: 'projectile',
        attackStyle: 'ritual_zone',
        targeting: {
            autoAim: true
        },
        projectile: {
            range: 150
        },
        playAnimation: false,
        visibleDuringEffect: false,
        hitboxWidth: 1,
        hitboxHeight: 1,
        damage: 20,
        duration: 1500,
        cooldown: 2200,
        zoneRadius: 128,
        zoneDurationMs: 1600,
        zoneTickIntervalMs: 320,
        zoneDamageRatio: 0.28,
        zoneBaseDamageExponent: 0.85,
        zoneApplySlow: false,
        zoneFreezeHitsRequired: 4,
        zoneFreezeDurationMs: 700,
        zoneVisualColors: {
            base: 0x03111c,
            haze: 0x082237,
            outerVeil: 0x12507a,
            innerGlow: 0x7fd8ff,
            core: 0xe7fbff,
            runeColors: [0xe7fbff, 0x9fe9ff, 0x7fd8ff, 0x4fb8ea],
            arcColors: [0xe7fbff, 0x9fe9ff, 0x7fd8ff]
        },
        tags: ['ice', 'zone']
    },
    ghost_summon: {
        label: 'Ghost',
        category: 'projectile',
        attackStyle: 'summon_ghosts',
        objects: {
            multiple: true,
            maxCount: 8,
            defaultCount: 2
        },
        projectile: {
            range: 170
        },
        basePath: 'assets/skills/ghost/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        damage: 13,
        duration: 300,
        cooldown: 1200,
        summonLifetimeMs: 20000,
        hitboxWidth: 10,
        hitboxHeight: 10,
        playAnimation: false,
        visibleDuringEffect: false,
        tags: ['summon', 'ghost']
    },
    thunder: {
        label: 'Thunder',
        category: 'projectile',
        attackStyle: 'chain_lightning_strike',
        objects: {
            multiple: false
        },
        targeting: {
            autoAim: true
        },
        projectile: {
            range: 140,
            alignWithMovement: true
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 5,
            dragFactor: 0.5,
            dragDuration: 220,
            count: 99
        },
        basePath: 'assets/skills/thunder/',
        animations: {
            cast: {
                frames: ['frame0.png', 'frame1.png', 'frame2.png'],
                frameRate: 12,
                loop: false
            }
        },
        damage: 14,
        duration: 300,
        cooldown: 1000,
        hitboxWidth: 60,
        hitboxHeight: 30,
        playAnimation: false,
        visibleDuringEffect: false,
        statusEffects: [
            {
                key: 'shock',
                trigger: 'onHit',
                target: 'target',
                chance: 1
            }
        ],
        chainCount: 0,
        chainRadius: 180,
        chainInitialDamageRatio: 0.75,
        chainDamageDecayFactor: 0.75,
        chainMinimumDamageRatio: 0.3,
        lightningColor: 0x79dfff,
        lightningGlowColor: 0xe6fcff,
        critical: {
            chance: 0.25,
            multiplier: 1.6,
            color: '#ffb347'
        }
    },
    nova: {
        label: 'Nova',
        category: 'projectile',
        tags: ['water'],
        targeting: {
            autoAim: true
        },
        objects: {
            multiple: true,
            maxCount: 6
        },
        projectile: {
            speed: 400,
            range: 140,
            alignWithMovement: false,
            destroyOnHit: true,
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 5,
            dragFactor: 0.4,
            dragDuration: 220,
            count: 99
        },
        basePath: 'assets/skills/nova/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        damage: 16,
        duration: 800,
        cooldown: 1400,
        hitboxWidth: 20,
        hitboxHeight: 8,
        critical: {
            chance: 0.25,
            multiplier: 1.4,
            color: '#4287f5'
        }
    },
    shooting_star: {
        label: 'Shooting Star',
        category: 'projectile',
        targeting: {
            homing: false,
            autoAim: {
                enabled: true,
                distinctTargets: true,
                burstInterval: 300
            }
        },
        objects: {
            multiple: true,
            defaultCount: 1,
            maxCount: 8
        },
        projectile: {
            speed: 800,
            range: 140,
            alignWithMovement: true,
            destroyOnHit: true
        },
        knockback: {
            takeDamage: false,
            count: 4
        },
        basePath: 'assets/skills/shooting_star/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        damage: 22,
        duration: 1600,
        cooldown: 1000,
        hitboxWidth: 40,
        hitboxHeight: 15,
        critical: {
            chance: 0.25,
            multiplier: 1.75,
            color: '#2b1e1a'
        }
    },
    fire: {
        label: 'Fire',
        category: 'projectile',
        targeting: {
            homing: true
        },
        objects: {
            multiple: true,
            maxCount: 8
        },
        projectile: {
            speed: 260,
            range: 120,
            alignWithMovement: true,
            destroyOnHit: true
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 5,
            dragFactor: 0.3,
            dragDuration: 300,
            count: 99
        },
        basePath: 'assets/skills/fire/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        damage: 18,
        duration: 10000,
        cooldown: 1800,
        hitboxWidth: 20,
        hitboxHeight: 20,
        detentionMark: {
            enabled: true,
            markEffectKey: 'mark',
            markDurationMs: 6000,
            rootDurationMs: 550,
            explosionRadius: 38,
            explosionDamageRatio: 0.4,
            explosionTint: '#ff9a4d'
        },
        prioritizeDetentionMarkedTargets: true,
        statusEffects: [
            {
                key: 'mark',
                trigger: 'onHit',
                target: 'target',
                chance: 1,
                durationMs: 6000,
                damageIncreasePerStack: 0,
                maxStacks: 1,
                tags: ['mark', 'detention']
            }
        ],
        critical: {
            chance: 0.3,
            multiplier: 1.4,
            color: '#ff7043'
        }
    },
    flame: {
        label: 'Flame',
        category: 'projectile',
        targeting: {
            homing: false,
            autoAim: {
                enabled: true,
                distinctTargets: false,
                burstInterval: 300
            }
        },
        objects: {
            multiple: true,
            maxCount: 3
        },
        projectile: {
            speed: 240,
            range: 130,
            alignWithMovement: true,
            destroyOnHit: true
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 10,
            dragFactor: 0.35,
            dragDuration: 300,
            count: 1
        },
        basePath: 'assets/skills/flame/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        behaviors: [
            { type: 'directHit' },
            { type: 'projectileResolution' }
        ],
        damage: 22,
        duration: 1800,
        cooldown: 2500,
        hitboxWidth: 30,
        hitboxHeight: 20,
        onHitExplosionRadius: 42,
        onHitExplosionDamageRatio: 0.3,
        onHitExplosionTint: '#ff9a4d',
        onHitBurnCloudRadius: 54,
        onHitBurnCloudDurationMs: 1500,
        onHitBurnDurationMs: 2200,
        critical: {
            chance: 0.15,
            multiplier: 2,
            color: '#B2BEB5'
        }
    },
    code: {
        label: 'Code',
        category: 'projectile',
        targeting: {
            homing: false,
            autoAim: {
                enabled: true,
                distinctTargets: true,
                burstInterval: 300
            }
        },
        objects: {
            multiple: true,
            maxCount: 8
        },
        projectile: {
            speed: 150,
            range: 140,
            alignWithMovement: true,
            destroyOnHit: true
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 10,
            dragFactor: 0.35,
            dragDuration: 300,
            count: 1
        },
        playAnimation: false,
        visibleDuringEffect: false,
        effectKey: 'codeProjectile',
        damage: 15,
        duration: 1800,
        cooldown: 3000,
        hitboxWidth: 10,
        hitboxHeight: 10,
        critical: {
            chance: 0.15,
            multiplier: 2,
            color: '#9dff73'
        }
    },
    mu_coi: {
        label: 'Mu Coi',
        category: 'projectile',
        targeting: {
            homing: false,
            autoAim: {
                enabled: true,
                burstInterval: 200
            }
        },
        objects: {
            multiple: true,
            maxCount: 8
        },
        projectile: {
            speed: 500,
            range: 140,
            alignWithMovement: true,
            destroyOnHit: true,
            bounceOnHit: false,
            retargetOnHit: true,
            maxChainTargets: 1
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 10,
            dragFactor: 0.35,
            dragDuration: 300,
            count: Infinity
        },
        basePath: 'assets/skills/mucoi/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        damage: 18,
        duration: 8000,
        cooldown: 2000,
        hitboxWidth: 12,
        hitboxHeight: 12,
        retargetBurstEffect: {
            enabled: true,
            coreColor: 0xf6f5c2,
            outerColor: 0xb7df67,
            ringColor: 0x5f8f2f,
            emberColor: 0xdde99b,
            coreRadius: 4,
            outerRadius: 8,
            ringRadius: 12,
            emberCount: 5,
            alphaMultiplier: 0.5
        },
        critical: {
            chance: 0.15,
            multiplier: 2,
            color: '#B2BEB5'
        }
    },
    card_toss: {
        label: 'Card Toss',
        category: 'projectile',
        targeting: {
            homing: false,
            autoAim: {
                enabled: true,
                distinctTargets: false,
                burstInterval: 0,
                fanAngle: 0.48,
                spawnRadius: 10
            }
        },
        projectile: {
            speed: 400,
            range: 145,
            alignWithMovement: true,
            destroyOnHit: true,
            spinOnFlight: true,
            spinSpeed: 18
        },
        objects: {
            multiple: true,
            defaultCount: 3,
            maxCount: 9
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 10,
            dragFactor: 0.35,
            dragDuration: 300,
            count: 1
        },
        basePath: 'assets/skills/card_toss/',
        atlas: {
            key: 'card_toss_atlas',
            texture: 'assets/skills/card_toss/spritesheet.png',
            atlasJSON: 'assets/skills/card_toss/spritesheet.json'
        },
        animations: {
            cast: {
                frames: ['image.png', 'image_2.png', 'image_3.png'],
                frameRate: 8,
                loop: false
            }
        },
        damage: 18,
        duration: 1800,
        cooldown: 1500,
        hitboxWidth: 10,
        hitboxHeight: 15,
        critical: {
            chance: 0.15,
            multiplier: 2,
            color: '#d9c27a'
        }
    },
    claw: {
        label: 'Claw',
        category: 'melee',
        meleeRange: 34,
        castGap: 22,
        visibleDuringEffect: false,
        damage: 22,
        duration: 1200,
        cooldown: 1200,
        hitboxWidth: 20,
        hitboxHeight: 40,
        meleeHitEffect: {
            color: 0xff667f,
            glowColor: 0xffd0d6,
            length: 18,
            spacing: 6
        },
        critical: {
            chance: 0.35,
            multiplier: 2.2,
            color: '#ff7288'
        }
    },
    stab: {
        label: 'Stab',
        category: 'melee',
        meleeRange: 30,
        castGap: 20,
        visibleDuringEffect: false,
        damage: 18,
        duration: 900,
        cooldown: 820,
        hitboxWidth: 18,
        hitboxHeight: 34,
        meleeHitEffect: {
            color: 0xe8eef7,
            glowColor: 0xffffff,
            length: 24,
            spacing: 0,
            slashWidth: 4,
            slashCount: 1,
            impactRadius: 8,
            impactAlpha: 0.18,
            duration: 120
        },
        critical: {
            chance: 0.38,
            multiplier: 2.25,
            color: '#f7f1c8'
        }
    },
    slash: {
        label: 'Slash',
        category: 'melee',
        meleeTargetMode: 'arc',
        meleeArcDegrees: 180,
        meleeMaxTargets: Infinity,
        meleeRange: 38,
        castGap: 24,
        visibleDuringEffect: false,
        damage: 24,
        duration: 1000,
        cooldown: 1700,
        hitboxWidth: 44,
        hitboxHeight: 44,
        meleeHitEffect: {
            style: 'knightSlash',
            radius: 30,
            arcDegrees: 180,
            duration: 170,
            particleLifespan: 180,
            quantity: 22,
            speedMin: 70,
            speedMax: 210,
            scaleFrom: 0.7,
            scaleTo: 0,
            alphaFrom: 0.95,
            alphaTo: 0,
            tint: 0xf4f1df,
            glowTint: 0xfff7d6,
            streakTint: 0xffffff,
            forwardOffset: 16,
            flashWidth: 7,
            centerFlashRadius: 8
        },
        critical: {
            chance: 0.22,
            multiplier: 1.9,
            color: '#fff3c7'
        }
    },
    charm: {
        label: 'Charm',
        description: 'Spectral cats fire as a normal auto-aim projectile volley.',
        category: 'projectile',
        targeting: {
            autoAim: {
                enabled: true,
                distinctTargets: true,
                burstInterval: 120
            }
        },
        objects: {
            multiple: true,
            maxCount: 5
        },
        projectile: {
            speed: 720,
            range: 140,
            alignWithMovement: true,
            destroyOnHit: true
        },
        knockback: {
            distance: 5,
            maxSpeed: 99999
        },
        basePath: 'assets/skills/charm/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: true
            }
        },
        damage: 18,
        duration: 2000,
        cooldown: 3000,
        hitboxWidth: 15,
        hitboxHeight: 20,
        critical: {
            chance: 0.25,
            multiplier: 1.7,
            color: '#ffd700'
        }
    }
};

export const SKILL_CONFIG = Object.fromEntries(
    Object.entries(RAW_SKILL_CONFIG).map(([skillKey, config]) => [skillKey, normalizeSkillConfig(config)])
);
