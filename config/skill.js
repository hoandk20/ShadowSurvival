// config/skill.js
export const SKILL_CONFIG = {
    thunder: {
        label: 'Thunder',
        category: 'area',
        multipleObject: false,
        knockbackTakeDamage: false,
        alignWithMovement: true,
        maxKnockbackSpeed: 9999,
        knockbackDistance: 5,
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
        knockback: 220,
        knockbackDragFactor: 0.5,
        knockbackDragDuration: 220,
        numberKnockback: 99
        ,
        critChance: 0.25,
        critMultiplier: 1.6,
        critColor: '#ffb347'
    },
    nova: {
        label: 'Nova',
        category: 'projectile',
        projectileSpeed: 400,
        travelRange: 500,
        knockbackTakeDamage: false,
        multipleObject: true,
        maxObjects: 6,
        alignWithMovement: true,
        maxKnockbackSpeed: 9999,
        knockbackDistance: 5,
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
        knockback: 120,
        knockbackDragFactor: 0.4,
        knockbackDragDuration: 220,
        numberKnockback: 99
        ,
        critChance: 0.3,
        critMultiplier: 1.45,
        critColor: '#4287f5'
    },
    ice: {
        label: 'Ice',
        category: 'projectile',
        projectileSpeed: 1000,
        travelRange: 400,
        knockbackTakeDamage: false,
        multipleObject: false,
        autoAim: true,
        alignWithMovement: false,
        maxKnockbackSpeed: 9999,
        knockbackDistance: 1,
        basePath: 'assets/skills/ice/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        damage: 8,
        duration: 800,
        cooldown: 2600,
        hitboxWidth: 30,
        hitboxHeight: 10,
        knockback: 120,
        knockbackDragFactor: 0.4,
        knockbackDragDuration: 220,
        numberKnockback: 50
        ,
        critChance: 0.3,
        critMultiplier: 1.45,
        critColor: '#7ce5ff',
        stunDuration: 1000
        ,
        stunColor: '#7ce5ff'
    },
    heavenfall: {
        label: 'Heaven Fall',
        category: 'projectile',
        projectileSpeed: 2000,
        travelRange: 900,
        knockbackTakeDamage: false,
        multipleObject: true,
        maxObjects: 8,
        dropFromSky: true,
        skyHeight: 300,
        alignWithMovement: false,
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
        destroyOnHit: true,
        knockback: 80,
        numberKnockback: 1
        ,
        critChance: 0.25,
        critMultiplier: 1.75,
        critColor: '#2b1e1a'
    },
    fire: {
        label: 'Fire',
        category: 'projectile',
        homing: true,
        multipleObject: true,
        maxObjects: 8,
        knockbackTakeDamage: false,
        alignWithMovement: true,
        maxKnockbackSpeed: 9999,
        knockbackDistance: 5,
        projectileSpeed: 200,
        travelRange: 200,
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
        destroyOnHit: true,
        knockback: 30,
        knockbackDragFactor: 0.3,
        knockbackDragDuration: 300,
        numberKnockback: 99
        ,
        critChance: 0.3,
        critMultiplier: 1.4,
        critColor: '#ff7043'
    },
    avada: {
        label: 'Avada',
        category: 'projectile',
        homing: false,
        autoAim: true,
        autoAimDistinctTargets: true,
        autoAimBurstInterval: 300,
        multipleObject: true,
        maxObjects: 8,
        knockbackTakeDamage: false,
        alignWithMovement: true,
        maxKnockbackSpeed: 9999,
        knockbackDistance: 10,
        projectileSpeed: 800,
        travelRange: 700,
        basePath: 'assets/skills/avada/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        damage: 18,
        duration: 1800,
        cooldown: 3000,
        hitboxWidth: 30,
        hitboxHeight: 5,
        destroyOnHit: true,
        knockback: 140,
        knockbackDragFactor: 0.35,
        knockbackDragDuration: 300,
        numberKnockback: 1
        ,
        critChance: 0.15,
        critMultiplier: 2,
        critColor: '#B2BEB5'
    },
    card_toss: {
        label: 'Card Toss',
        category: 'projectile',
        homing: false,
        autoAim: true,
        autoAimDistinctTargets: false,
        autoAimBurstInterval: 80,
        autoAimFanAngle: 2,
        autoAimSpawnRadius: 10,
        spinOnFlight: true,
        spinSpeed: 18,
        multipleObject: true,
        defaultObjects: 7,
        maxObjects: 15,
        knockbackTakeDamage: false,
        alignWithMovement: true,
        maxKnockbackSpeed: 9999,
        knockbackDistance: 10,
        projectileSpeed: 700,
        travelRange: 800,
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
        damage: 3,
        duration: 1800,
        cooldown: 2000,
        hitboxWidth: 10,
        hitboxHeight: 15,
        destroyOnHit: true,
        knockback: 140,
        knockbackDragFactor: 0.35,
        knockbackDragDuration: 300,
        numberKnockback: 1,
        critChance: 0.15,
        critMultiplier: 2,
        critColor: '#d9c27a'
    },
    iron_fist: {
        label: 'Iron Fist',
        category: 'projectile',
        homing: false,
        autoAim: false,
        multipleObject: false,
        knockbackTakeDamage: true,
        alignWithMovement: true,
        maxKnockbackSpeed: 300,
        knockbackDistance: 150,
        projectileSpeed: 300,
        travelRange: 60,
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
        destroyOnHit: false,
        knockback: 1600,
        numberKnockback: 1
        ,
        critChance: 0.35,
        critMultiplier: 2.2,
        critColor: '#ff5252'
    },
    charm: {
        label: 'Charm',
        description: 'Orbiting spectral cats that swipe nearby foes.',
        category: 'orbit',
        multipleObject: true,
        maxObjects: 5,
        orbitRadius: 80,

        orbitSpeed: 5,
        orbitDirection: 1,
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
        knockback: 120,
        knockbackDistance: 5,
maxKnockbackSpeed: 99999,
        critChance: 0.25,
        critMultiplier: 1.7,
        critColor: '#ffd700'
    },
    aura: {
        label: 'Aura',
        category: 'aura',
        multipleObject: false,
        knockbackTakeDamage: false,
        alignWithMovement: false,
        maxKnockbackSpeed: 99999,
        knockbackDistance: 5,
        effectKey: 'auraGlow',
        playAnimation: false,
        visibleDuringEffect: false,
        effectKey: 'auraGlow',
        damage: 18,
        duration: 2200,
        cooldown: 1000,
        hitboxWidth: 80,
        hitboxHeight: 80,
        knockback: 120,
        knockbackDragFactor: 0.4,
        knockbackDragDuration: 220,
        numberKnockback: 99
        ,
        critChance: 0.22,
        critMultiplier: 1.65,
        critColor: '#B2BEB5'
    }
};
