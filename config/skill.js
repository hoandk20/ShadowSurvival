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
    const orbit = config.orbit ?? {};
    const stun = config.stun ?? {};

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

    if (typeof skyDrop.enabled === 'boolean') normalized.dropFromSky = skyDrop.enabled;
    if (typeof skyDrop.height === 'number') normalized.skyHeight = skyDrop.height;
    if (typeof skyDrop.trackingSpeed === 'number') normalized.dropTrackingSpeed = skyDrop.trackingSpeed;

    if (typeof knockback.takeDamage === 'boolean') normalized.knockbackTakeDamage = knockback.takeDamage;
    if (typeof knockback.maxSpeed === 'number') normalized.maxKnockbackSpeed = knockback.maxSpeed;
    if (typeof knockback.distance === 'number') normalized.knockbackDistance = knockback.distance;
    if (typeof knockback.force === 'number') normalized.knockback = knockback.force;
    if (typeof knockback.dragFactor === 'number') normalized.knockbackDragFactor = knockback.dragFactor;
    if (typeof knockback.dragDuration === 'number') normalized.knockbackDragDuration = knockback.dragDuration;
    if (typeof knockback.count === 'number' || knockback.count === Infinity) normalized.numberKnockback = knockback.count;

    if (typeof critical.chance === 'number') normalized.critChance = critical.chance;
    if (typeof critical.multiplier === 'number') normalized.critMultiplier = critical.multiplier;
    if (critical.color) normalized.critColor = critical.color;

    if (typeof explosion.enabled === 'boolean') normalized.explosionOnHit = explosion.enabled;
    if (typeof explosion.radius === 'number') normalized.explosionRadius = explosion.radius;
    if (typeof explosion.damageMultiplier === 'number') normalized.explosionDamageMultiplier = explosion.damageMultiplier;
    if (typeof explosion.knockbackMultiplier === 'number') normalized.explosionKnockbackMultiplier = explosion.knockbackMultiplier;
    if (explosion.tint) normalized.explosionTint = explosion.tint;
    if (explosion.effect) normalized.explosionEffect = explosion.effect;

    if (typeof orbit.radius === 'number') normalized.orbitRadius = orbit.radius;
    if (typeof orbit.speed === 'number') normalized.orbitSpeed = orbit.speed;
    if (typeof orbit.direction === 'number') normalized.orbitDirection = orbit.direction;

    if (typeof stun.duration === 'number') normalized.stunDuration = stun.duration;
    if (stun.color) normalized.stunColor = stun.color;

    return normalized;
}

const RAW_SKILL_CONFIG = {
    thunder: {
        label: 'Thunder',
        category: 'area',
        objects: {
            multiple: false
        },
        projectile: {
            alignWithMovement: true
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 5,
            force: 40,
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
        damage: 12,
        duration: 300,
        cooldown: 1000,
        hitboxWidth: 60,
        hitboxHeight: 30,
        critical: {
            chance: 0.25,
            multiplier: 1.6,
            color: '#ffb347'
        }
    },
    nova: {
        label: 'Nova',
        category: 'projectile',
        objects: {
            multiple: true,
            maxCount: 6
        },
        projectile: {
            speed: 400,
            range: 500,
            alignWithMovement: true
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 5,
            force: 40,
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
        damage: 18,
        duration: 800,
        cooldown: 1400,
        hitboxWidth: 20,
        hitboxHeight: 8,
        critical: {
            chance: 0.3,
            multiplier: 1.45,
            color: '#4287f5'
        }
    },
    waterwarn: {
        label: 'Waterwarn',
        category: 'projectile',
        objects: {
            multiple: true,
            maxCount: 6
        },
        projectile: {
            speed: 400,
            range: 500,
            alignWithMovement: true
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 5,
            force: 20,
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
        damage: 18,
        duration: 800,
        cooldown: 1400,
        hitboxWidth: 20,
        hitboxHeight: 8,
        critical: {
            chance: 0.3,
            multiplier: 1.45,
            color: '#7cc6ff'
        }
    },
    ice: {
        label: 'Ice',
        category: 'projectile',
        objects: {
            multiple: false
        },
        targeting: {
            autoAim: true
        },
        projectile: {
            speed: 1000,
            range: 400,
            alignWithMovement: false
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 1,
            force: 10,
            dragFactor: 0.4,
            dragDuration: 220,
            count: 50
        },
        basePath: 'assets/skills/ice/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        behaviors: [
            { type: 'directHit' },
            { type: 'stunOnHit' },
            { type: 'projectileResolution' }
        ],
        damage: 8,
        duration: 800,
        cooldown: 2000,
        hitboxWidth: 30,
        hitboxHeight: 10,
        effectKey: 'iceTrail',
        critical: {
            chance: 0.3,
            multiplier: 1.45,
            color: '#7ce5ff'
        },
        stun: {
            duration: 2000,
            color: '#7ce5ff'
        }
    },
    heavenfall: {
        label: 'Heaven Fall',
        category: 'projectile',
        objects: {
            multiple: true,
            maxCount: 8
        },
        projectile: {
            speed: 2000,
            range: 500,
            alignWithMovement: false,
            destroyOnHit: true
        },
        skyDrop: {
            enabled: true,
            height: 300
        },
        knockback: {
            takeDamage: false,
            force: 80,
            count: 4
        },
        basePath: 'assets/skills/heavenfall/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        damage: 28,
        duration: 1600,
        cooldown: 2800,
        hitboxWidth: 40,
        hitboxHeight: 15,
        critical: {
            chance: 0.25,
            multiplier: 1.75,
            color: '#2b1e1a'
        }
    },
    sky_fall: {
        label: 'Sky Fall',
        category: 'projectile',
        objects: {
            multiple: true,
            defaultCount: 5,
            maxCount: 10,
            spawnInterval: 100
        },
        projectile: {
            speed: 300,
            range: 500,
            alignWithMovement: false,
            destroyOnHit: true
        },
        skyDrop: {
            enabled: true,
            height: 360
        },
        knockback: {
            takeDamage: false,
            force: 110,
            count: 6
        },
        basePath: 'assets/skill_evolution/sky_fall/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        behaviors: [
            { type: 'directHit' },
            {
                type: 'explosionOnHit',
                config: {
                    radius: 84,
                    damageMultiplier: 0.8,
                    knockbackMultiplier: 0.55,
                    tint: '#ffb066',
                    effect: {
                        style: 'pixelFlame',
                        coreRadius: 18,
                        outerRadius: 34,
                        ringRadius: 46,
                        coreColor: 0xffe6a3,
                        ringColor: 0xff6a3d,
                        emberColor: 0xffb15c,
                        emberDistance: { min: 10, max: 28 },
                        emberDuration: { min: 100, max: 170 },
                        duration: 190,
                        pixelSize: 4
                    }
                }
            },
            { type: 'projectileResolution' }
        ],
        damage: 120,
        duration: 1800,
        cooldown: 767,
        hitboxWidth: 100,
        hitboxHeight: 100,
        explosion: {
            enabled: true,
            radius: 84,
            damageMultiplier: 0.8,
            knockbackMultiplier: 0.55,
            tint: '#ffb066'
        },
        critical: {
            chance: 0.3,
            multiplier: 1.85,
            color: '#fff0a8'
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
            speed: 200,
            range: 300,
            alignWithMovement: true,
            destroyOnHit: true
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 5,
            force: 30,
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
        damage: 20,
        duration: 3000,
        cooldown: 1800,
        hitboxWidth: 20,
        hitboxHeight: 20,
        critical: {
            chance: 0.3,
            multiplier: 1.4,
            color: '#ff7043'
        }
    },
    avada: {
        label: 'Avada',
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
            speed: 800,
            range: 700,
            alignWithMovement: true,
            destroyOnHit: true
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 10,
            force: 140,
            dragFactor: 0.35,
            dragDuration: 300,
            count: 1
        },
        basePath: 'assets/skills/avada/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        damage: 15,
        duration: 1800,
        cooldown: 3000,
        hitboxWidth: 30,
        hitboxHeight: 5,
        critical: {
            chance: 0.15,
            multiplier: 2,
            color: '#B2BEB5'
        }
    },
    flame: {
        label: 'Flame',
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
            maxCount: 3
        },
        projectile: {
            speed: 200,
            range: 700,
            alignWithMovement: true,
            destroyOnHit: true
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 10,
            force: 140,
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
            {
                type: 'explosionOnHit',
                config: {
                    radius: 84,
                    damageMultiplier: 0.8,
                    knockbackMultiplier: 0.55,
                    tint: '#ffb066',
                    effect: {
                        style: 'pixelFlame',
                        coreRadius: 18,
                        outerRadius: 34,
                        ringRadius: 46,
                        coreColor: 0xffe6a3,
                        ringColor: 0xff6a3d,
                        emberColor: 0xffb15c,
                        emberDistance: { min: 10, max: 28 },
                        emberDuration: { min: 100, max: 170 },
                        duration: 190,
                        pixelSize: 4
                    }
                }
            },
            { type: 'projectileResolution' }
        ],
        damage: 22,
        duration: 1800,
        cooldown: 2500,
        hitboxWidth: 50,
        hitboxHeight: 30,
        explosion: {
            enabled: true,
            radius: 84,
            damageMultiplier: 0.8,
            knockbackMultiplier: 0.55,
            tint: '#ffb066'
        },
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
            range: 700,
            alignWithMovement: true,
            destroyOnHit: true
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 10,
            force: 140,
            dragFactor: 0.35,
            dragDuration: 300,
            count: 1
        },
        playAnimation: false,
        visibleDuringEffect: false,
        effectKey: 'codeProjectile',
        appliesHack: true,
        hackDuration: 10000,
        hackTint: '#59ff8b',
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
            speed: 60,
            range: 700,
            alignWithMovement: true,
            destroyOnHit: false,
            bounceOnHit: true
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 10,
            force: 140,
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
        damage: 15,
        duration: 8000,
        cooldown: 3000,
        hitboxWidth: 12,
        hitboxHeight: 12,
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
                burstInterval: 80,
                fanAngle: 2,
                spawnRadius: 10
            }
        },
        projectile: {
            speed: 700,
            range: 300,
            alignWithMovement: true,
            destroyOnHit: true,
            spinOnFlight: true,
            spinSpeed: 18
        },
        objects: {
            multiple: true,
            defaultCount: 7,
            maxCount: 15
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 10,
            force: 40,
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
        damage: 5,
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
    god_card: {
        label: 'God Card',
        category: 'projectile',
        targeting: {
            homing: false,
            autoAim: {
                enabled: true,
                distinctTargets: true,
                burstInterval: 70,
                fanAngle: 2.4,
                spawnRadius: 14
            }
        },
        projectile: {
            speed: 720,
            range: 360,
            alignWithMovement: true,
            destroyOnHit: true,
            spinOnFlight: true,
            spinSpeed: 22
        },
        objects: {
            multiple: true,
            defaultCount: 10,
            maxCount: 16
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 9999,
            distance: 12,
            force: 55,
            dragFactor: 0.35,
            dragDuration: 300,
            count: 2
        },
        basePath: 'assets/skill_evolution/god_card/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        damage: 15,
        duration: 2000,
        cooldown: 1000,
        hitboxWidth: 18,
        hitboxHeight: 24,
        critical: {
            chance: 0.22,
            multiplier: 2.2,
            color: '#ffe08a'
        }
    },
    iron_fist: {
        label: 'Iron Fist',
        category: 'projectile',
        targeting: {
            homing: false,
            autoAim: false
        },
        objects: {
            multiple: false
        },
        projectile: {
            speed: 300,
            range: 60,
            alignWithMovement: true,
            destroyOnHit: false
        },
        knockback: {
            takeDamage: true,
            maxSpeed: 300,
            distance: 80,
            force: 1000,
            count: 1
        },
        basePath: 'assets/skills/iron_fist/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 14,
                loop: false
            }
        },
        damage: 22,
        duration: 1200,
        cooldown: 1200,
        hitboxWidth: 20,
        hitboxHeight: 40,
        critical: {
            chance: 0.35,
            multiplier: 2.2,
            color: '#ff5252'
        }
    },
    charm: {
        label: 'Charm',
        description: 'Orbiting spectral cats that swipe nearby foes.',
        category: 'orbit',
        objects: {
            multiple: true,
            maxCount: 5
        },
        orbit: {
            radius: 50,
            speed: 5,
            direction: 1
        },
        knockback: {
            force: 30,
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
        duration: 3000,
        cooldown: 5000,
        hitboxWidth: 10,
        hitboxHeight: 15,
        critical: {
            chance: 0.25,
            multiplier: 1.7,
            color: '#ffd700'
        }
    },
    aura: {
        label: 'Aura',
        category: 'aura',
        objects: {
            multiple: false
        },
        projectile: {
            alignWithMovement: false
        },
        knockback: {
            takeDamage: false,
            maxSpeed: 99999,
            distance: 5,
            force: 20,
            dragFactor: 0.4,
            dragDuration: 220,
            count: 99
        },
        effectKey: 'auraGlow',
        playAnimation: false,
        visibleDuringEffect: false,
        effectKey: 'auraGlow',
        damage: 18,
        duration: 2200,
        cooldown: 1000,
        hitboxWidth: 50,
        hitboxHeight: 50,
        critical: {
            chance: 0.22,
            multiplier: 1.65,
            color: '#B2BEB5'
        }
    }
};

export const SKILL_CONFIG = Object.fromEntries(
    Object.entries(RAW_SKILL_CONFIG).map(([skillKey, config]) => [skillKey, normalizeSkillConfig(config)])
);
