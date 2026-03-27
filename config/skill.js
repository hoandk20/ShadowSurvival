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
        damage: 15,
        duration: 300,
        cooldown: 1000,
        hitboxWidth: 60,
        hitboxHeight: 30,
        knockback: 220,
        knockbackDragFactor: 0.5,
        knockbackDragDuration: 220,
        numberKnockback: 99
        ,
        critChance: 0.32,
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
        damage: 15,
        duration: 800,
        cooldown: 1500,
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
        damage: 10,
        duration: 800,
        cooldown: 3000,
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
        stunDuration: 2000
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
        damage: 45,
        duration: 1600,
        cooldown: 1500,
        hitboxWidth: 40,
        hitboxHeight: 15,
        destroyOnHit: true,
        knockback: 80,
        numberKnockback: 1
        ,
        critChance: 0.35,
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
        projectileSpeed: 300,
        travelRange: 200,
        basePath: 'assets/skills/fire/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: false
            }
        },
        damage: 25,
        duration: 3000,
        cooldown: 1500,
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
        damage: 45,
        duration: 1800,
        cooldown: 1500,
        hitboxWidth: 30,
        hitboxHeight: 5,
        destroyOnHit: true,
        knockback: 140,
        knockbackDragFactor: 0.35,
        knockbackDragDuration: 300,
        numberKnockback: 1
        ,
        critChance: 0.2,
        critMultiplier: 1.9,
        critColor: '#B2BEB5'
    },
    iron_first: {
        label: 'Iron Fist',
        category: 'projectile',
        homing: false,
        autoAim: false,
        multipleObject: false,
        knockbackTakeDamage: true,
        alignWithMovement: true,
        maxKnockbackSpeed: 400,
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
        damage: 25,
        duration: 1200,
        cooldown: 1500,
        hitboxWidth: 20,
        hitboxHeight: 40,
        destroyOnHit: false,
        knockback: 1600,
        numberKnockback: 5
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
        orbitRadius: 120,

        orbitSpeed: 6,
        orbitDirection: 1,
        basePath: 'assets/skills/charm/',
        animations: {
            cast: {
                frames: ['frame0.png'],
                frameRate: 1,
                loop: true
            }
        },
        damage: 25,
        duration: 7200,
        cooldown: 9200,
        hitboxWidth: 15,
        hitboxHeight: 20,
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
        damage: 12,
        duration: 2200,
        cooldown: 1200,
        hitboxWidth: 80,
        hitboxHeight: 80,
        knockback: 120,
        knockbackDragFactor: 0.4,
        knockbackDragDuration: 220,
        numberKnockback: 99
        ,
        critChance: 0.18,
        critMultiplier: 1.65,
        critColor: '#B2BEB5'
    }
};
