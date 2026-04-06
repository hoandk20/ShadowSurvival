export const SUPPORTER_CONFIG = {
    blackcat: {
        key: 'blackcat',
        label: 'Black Cat',
        atlas: {
            key: 'supporter_blackcat',
            texture: 'assets/suporter/blackcat/spritesheet.png',
            atlasJSON: 'assets/suporter/blackcat/spritesheet.json'
        },
        animations: {
            idle: {
                frames: ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'],
                frameRate: 7,
                loop: true
            }
        },
        displaySize: {
            width: 11,
            height: 11
        },
        orbitRadius: 30,
        orbitSpeed: 1.55,
        hoverAmplitude: 6,
        followLerp: 0.2,
        attackRange: 180,
        fireCooldownMs: 1500,
        projectileSpeed: 300,
        projectileDamage: 25,
        projectileRadius: 4,
        projectileLifetimeMs: 2200,
        projectileColor: 0xb3a0ff,
        projectileGlowColor: 0x7b62ff,
        projectileTrailColor: 0xd9d0ff,
        projectileBurstColor: 0x4f35d8,
        passiveBonuses: {
            goldGainMultiplier: 0.2,
            critChance: 0.05
        },
        passiveDescription: 'Gold gain +20%\nCrit chance +5%',
        tags: [],
        statusEffects: []
    },
    blood_wolf: {
        key: 'blood_wolf',
        label: 'Blood Wolf',
        movementStyle: 'melee_follow',
        atlas: {
            key: 'supporter_blood_wolf',
            texture: 'assets/suporter/blood_wolf/spritesheet.png',
            atlasJSON: 'assets/suporter/blood_wolf/spritesheet.json'
        },
        animations: {
            idle: {
                frames: ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'],
                frameRate: 8,
                loop: true
            },
            move: {
                frames: ['image_5.png', 'image_6.png', 'image_7.png', 'image_8.png'],
                frameRate: 8,
                loop: true
            }
        },
        displaySize: {
            width: 25,
            height: 25
        },
        orbitRadius: 26,
        orbitSpeed: 2.05,
        hoverAmplitude: 4,
        followLerp: 0.28,
        moveSpeed: 150,
        followOffsetX: 20,
        followOffsetY: 6,
        followSlackDistance: 14,
        returnSpeedMultiplier: 0.8,
        engageDistance: 18,
        attackArea: 100,
        attackRange: 10,
        fireCooldownMs: 1500,
        attackStyle: 'claw_slash',
        projectileDamage: 24,
        projectileColor: 0xff7288,
        projectileGlowColor: 0xffd6dd,
        projectileTrailColor: 0xffc0ca,
        projectileBurstColor: 0xc92d45,
        slashColor: 0xff667f,
        slashGlowColor: 0xffd0d6,
        slashLength: 18,
        slashSpacing: 6,
        passiveBonuses: {
            lifesteal: 0.1
        },
        conditionalPassiveCombatStyle: 'melee',
        conditionalPassiveBonuses: {
            attackSpeed: 0.3
        },
        passiveDescription: 'Lifesteal +10%\nMelee characters gain +30% attack speed\nSupporter hits always apply Bleed',
        tags: [],
        statusEffects: [
            {
                key: 'bleed',
                trigger: 'onHit',
                target: 'target',
                chance: 1
            }
        ]
    },
    fairy: {
        key: 'fairy',
        label: 'Fairy',
        atlas: {
            key: 'supporter_fairy',
            texture: 'assets/suporter/fairy/spritesheet.png',
            atlasJSON: 'assets/suporter/fairy/spritesheet.json'
        },
        animations: {
            idle: {
                frames: ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'],
                frameRate: 8,
                loop: true
            }
        },
        displaySize: {
            width: 12,
            height: 12
        },
        orbitRadius: 24,
        orbitSpeed: 1.75,
        hoverAmplitude: 10,
        followLerp: 0.26,
        attackRange: 135,
        fireCooldownMs: 2000,
        projectileCount: 1,
        projectileSpeed: 280,
        projectileDamage: 18,
        projectileRadius: 4,
        projectileLifetimeMs: 2200,
        projectileColor: 0xb8ffd5,
        projectileGlowColor: 0x7ae7af,
        projectileTrailColor: 0xe9fff3,
        projectileBurstColor: 0x55c98a,
        supportStyle: 'heal_aura',
        supportIntervalMs: 15000,
        supportHealAmount: 25,
        supportPulseColor: 0xa6ffcb,
        supportGlowColor: 0xf2fff7,
        supportPulseRadius: 10,
        passiveBonuses: {
            healthRegenPerSecond: 1,
            maxHealthPercent: 0.1
        },
        passiveDescription: 'Heal aura: +35 HP every 15s, scales with effect damage\nEach hit reduces buff cooldown by 0.5s\nHealth regen +1/s\nMax HP +10%',
        tags: [],
        statusEffects: []
    },
    bluebird: {
        key: 'bluebird',
        label: 'Blue Bird',
        atlas: {
            key: 'supporter_bluebird',
            texture: 'assets/suporter/bluebird/spritesheet.png',
            atlasJSON: 'assets/suporter/bluebird/spritesheet.json'
        },
        animations: {
            idle: {
                frames: ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'],
                frameRate: 8,
                loop: true
            }
        },
        displaySize: {
            width: 11,
            height: 11
        },
        orbitRadius: 34,
        orbitSpeed: 1.8,
        hoverAmplitude: 9,
        followLerp: 0.24,
        attackRange: 150,
        fireCooldownMs: 1200,
        projectileSpeed: 340,
        projectileDamage: 28,
        projectileRadius: 4,
        projectileLifetimeMs: 2200,
        projectileColor: 0xa7e4ff,
        projectileGlowColor: 0x58b8ff,
        projectileTrailColor: 0xe3f8ff,
        projectileBurstColor: 0x2f83d4,
        passiveBonuses: {
            projectileSpeedPercent: 0.2,
            armorPierce: 0.3
        },
        passiveDescription: 'Projectile speed +20%\nArmor pierce +20%',
        tags: [],
        statusEffects: []
    },
    eye_monster: {
        key: 'eye_monster',
        label: 'Eye Monster',
        atlas: {
            key: 'supporter_eye_monster',
            texture: 'assets/suporter/eye_monster/spritesheet.png',
            atlasJSON: 'assets/suporter/eye_monster/spritesheet.json'
        },
        animations: {
            idle: {
                frames: ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'],
                frameRate: 7,
                loop: true
            }
        },
        displaySize: {
            width: 11,
            height: 11
        },
        orbitRadius: 26,
        orbitSpeed: 1.35,
        hoverAmplitude: 7,
        followLerp: 0.18,
        attackRange: 150,
        fireCooldownMs: 1500,
        projectileCount: 2,
        projectileSpeed: 260,
        projectileDamage: 22,
        projectileRadius: 4,
        projectileLifetimeMs: 2200,
        projectileColor: 0xffe082,
        projectileGlowColor: 0xffc14d,
        projectileTrailColor: 0xfff2bc,
        projectileBurstColor: 0xffd56b,
        passiveBonuses: {
            skillRange: 30,
            critMultiplier: 0.1
        },
        passiveDescription: 'Skill range +30\nCrit damage +10%\nSupporter hits always apply Mark',
        tags: [],
        statusEffects: [
            {
                key: 'mark',
                trigger: 'onHit',
                target: 'target',
                chance: 1
            }
        ]
    },
    dragon_ice: {
        key: 'dragon_ice',
        label: 'Dragon Ice',
        atlas: {
            key: 'supporter_dragon_ice',
            texture: 'assets/suporter/dragon_ice/spritesheet.png',
            atlasJSON: 'assets/suporter/dragon_ice/spritesheet.json'
        },
        animations: {
            idle: {
                frames: ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'],
                frameRate: 8,
                loop: true
            }
        },
        displaySize: {
            width: 12,
            height: 12
        },
        orbitRadius: 36,
        orbitSpeed: 1.5,
        hoverAmplitude: 8,
        followLerp: 0.2,
        attackRange: 145,
        fireCooldownMs: 1300,
        projectileCount: 2,
        projectileSpeed: 320,
        projectileDamage: 22,
        projectileRadius: 4,
        projectileLifetimeMs: 2200,
        projectileColor: 0xb7ecff,
        projectileGlowColor: 0x63c8ff,
        projectileTrailColor: 0xe8fbff,
        projectileBurstColor: 0x2f8fd9,
        passiveBonuses: {
            effectDurationMultiplier: 0.3
        },
        passiveDescription: 'Effect duration +30%\nSupporter hits always apply Freeze',
        tags: [],
        statusEffects: [
            {
                key: 'freeze',
                trigger: 'onHit',
                target: 'target',
                chance: 1
            }
        ]
    },
    fire_spirite: {
        key: 'fire_spirite',
        label: 'Fire Spirite',
        atlas: {
            key: 'supporter_fire_spirite',
            texture: 'assets/suporter/fire_spirite/spritesheet.png',
            atlasJSON: 'assets/suporter/fire_spirite/spritesheet.json'
        },
        animations: {
            idle: {
                frames: ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'],
                frameRate: 8,
                loop: true
            }
        },
        displaySize: {
            width: 11,
            height: 11
        },
        orbitRadius: 24,
        orbitSpeed: 1.95,
        hoverAmplitude: 5,
        followLerp: 0.26,
        attackRange: 135,
        fireCooldownMs: 1500,
        projectileCount: 2,
        projectileSpeed: 360,
        projectileDamage: 22,
        projectileRadius: 4,
        projectileLifetimeMs: 2200,
        projectileColor: 0xffcf7a,
        projectileGlowColor: 0xff7a2f,
        projectileTrailColor: 0xffefb0,
        projectileBurstColor: 0xff4d00,
        passiveBonuses: {
            effectDamageMultiplier: 0.3
        },
        passiveDescription: 'Effect damage +30%\nSupporter hits always apply Burn',
        tags: [],
        statusEffects: [
            {
                key: 'burn',
                trigger: 'onHit',
                target: 'target',
                chance: 1
            }
        ]
    },
    shock_mouse: {
        key: 'shock_mouse',
        label: 'Shock Mouse',
        atlas: {
            key: 'supporter_shock_mouse',
            texture: 'assets/suporter/shock_mouse/spritesheet.png',
            atlasJSON: 'assets/suporter/shock_mouse/spritesheet.json'
        },
        animations: {
            idle: {
                frames: ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'],
                frameRate: 8,
                loop: true
            }
        },
        displaySize: {
            width: 12,
            height: 12
        },
        orbitRadius: 32,
        orbitSpeed: 1.9,
        hoverAmplitude: 7,
        followLerp: 0.24,
        attackRange: 150,
        fireCooldownMs: 1550,
        attackStyle: 'chain_lightning',
        projectileSpeed: 380,
        projectileDamage: 22,
        projectileRadius: 4,
        projectileLifetimeMs: 2200,
        projectileColor: 0xfff08a,
        projectileGlowColor: 0xffcf2f,
        projectileTrailColor: 0xfff7be,
        projectileBurstColor: 0xf5a700,
        lightningColor: 0xffdc57,
        lightningGlowColor: 0xfff8c7,
        lightningParticleCount: 8,
        lightningDuration: 130,
        passiveBonuses: {
            shockChainCountBonus: 1,
            attackSpeed: 0.1
        },
        passiveDescription: 'Shock chain count +1\nAttack speed +10%\nSupporter hits always apply Shock',
        tags: [],
        statusEffects: [
            {
                key: 'shock',
                trigger: 'onHit',
                target: 'target',
                chance: 1
            }
        ]
    },
    poison_ball: {
        key: 'poison_ball',
        label: 'Poison Ball',
        atlas: {
            key: 'supporter_poison_ball',
            texture: 'assets/suporter/poison_ball/spritesheet.png',
            atlasJSON: 'assets/suporter/poison_ball/spritesheet.json'
        },
        animations: {
            idle: {
                frames: ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'],
                frameRate: 8,
                loop: true
            }
        },
        displaySize: {
            width: 12,
            height: 12
        },
        orbitRadius: 28,
        orbitSpeed: 1.6,
        hoverAmplitude: 6,
        followLerp: 0.22,
        attackRange: 140,
        fireCooldownMs: 1500,
        projectileSpeed: 320,
        projectileDamage: 22,
        projectileRadius: 4,
        projectileLifetimeMs: 2200,
        projectileColor: 0xa7ff8a,
        projectileGlowColor: 0x57cf54,
        projectileTrailColor: 0xdffff0,
        projectileBurstColor: 0x2f9d44,
        passiveBonuses: {
            effectDurationMultiplier: 0.2,
            effectDamageMultiplier: 0.1
        },
        passiveDescription: 'Effect duration +20%\nEffect damage +10%\nSupporter hits always apply Poison',
        tags: [],
        statusEffects: [
            {
                key: 'poison',
                trigger: 'onHit',
                target: 'target',
                chance: 1
            }
        ]
    },
    shield_drone: {
        key: 'shield_drone',
        label: 'Shield Drone',
        atlas: {
            key: 'supporter_shield_drone',
            texture: 'assets/suporter/shield_drone/spritesheet.png',
            atlasJSON: 'assets/suporter/shield_drone/spritesheet.json'
        },
        animations: {
            idle: {
                frames: ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'],
                frameRate: 8,
                loop: true
            }
        },
        displaySize: {
            width: 12,
            height: 12
        },
        orbitRadius: 30,
        orbitSpeed: 1.45,
        hoverAmplitude: 5,
        followLerp: 0.22,
        attackRange: 130,
        fireCooldownMs: 2000,
        projectileCount: 1,
        projectileSpeed: 270,
        projectileDamage: 18,
        projectileRadius: 4,
        projectileLifetimeMs: 2200,
        projectileColor: 0xc5efff,
        projectileGlowColor: 0x76cfff,
        projectileTrailColor: 0xedfbff,
        projectileBurstColor: 0x4b9fcd,
        supportStyle: 'armor_aura',
        supportIntervalMs: 2200,
        supportArmorBonus: 8,
        supportPulseColor: 0x8fdfff,
        supportGlowColor: 0xe8fbff,
        supportPulseRadius: 10,
        passiveBonuses: {
            armor: 1,
            shieldResetAmount: 20,
            shieldResetIntervalMs: 15000
        },
        passiveDescription: 'Armor aura: +8 armor, scales with effect damage\nEach hit reduces buff cooldown by 0.5s\nArmor +1\nGain 20 shield every 10s',
        tags: [],
        statusEffects: []
    },
    rock: {
        key: 'rock',
        label: 'Rock',
        movementStyle: 'melee_follow',
        atlas: {
            key: 'supporter_rock',
            texture: 'assets/suporter/rock/spritesheet.png',
            atlasJSON: 'assets/suporter/rock/spritesheet.json'
        },
        animations: {
            idle: {
                frames: ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'],
                frameRate: 7,
                loop: true
            },
            move: {
                frames: ['image_5.png', 'image_6.png', 'image_7.png', 'image_8.png'],
                frameRate: 7,
                loop: true
            }
        },
        displaySize: {
            width: 30,
            height: 30
        },
        orbitRadius: 28,
        orbitSpeed: 1.25,
        hoverAmplitude: 3,
        followLerp: 0.18,
        moveSpeed: 120,
        followOffsetX: 18,
        followOffsetY: 8,
        followSlackDistance: 16,
        returnSpeedMultiplier: 0.8,
        engageDistance: 22,
        attackArea: 100,
        attackRange: 20,
        fireCooldownMs: 1800,
        attackStyle: 'claw_slash',
        projectileSpeed: 250,
        projectileDamage: 32,
        projectileRadius: 5,
        projectileLifetimeMs: 2200,
        projectileColor: 0xbca38a,
        projectileGlowColor: 0xe5d2bf,
        projectileTrailColor: 0xdcc8b2,
        projectileBurstColor: 0x8d6e56,
        slashColor: 0xbca38a,
        slashGlowColor: 0xe5d2bf,
        slashLength: 10,
        slashSpacing: 0,
        slashWidth: 8,
        slashCount: 1,
        slashAngle: 0,
        slashImpactRadius: 12,
        slashOffsetX: 2,
        slashOffsetY: 0,
        passiveBonuses: {
            knockbackMultiplier: 0.3,
            armor: 5
        },
        passiveDescription: 'Knockback +30%\nArmor +5\nSupporter hits trigger Explosion',
        tags: [],
        statusEffects: [
            {
                key: 'explosion',
                trigger: 'onHit',
                target: 'target',
                chance: 1,
                damageRatio: 0.6,
                radius: 45,
                tint: '#9a9a9a',
                effect: {
                    coreColor: 0xd9d9d9,
                    outerColor: 0x9a9a9a,
                    ringColor: 0x5f5f5f,
                    emberColor: 0xb8b8b8
                }
            }
        ]
    }
};

export const SUPPORTER_KEYS = Object.keys(SUPPORTER_CONFIG);

export function getSupporterConfig(supporterKey) {
    return SUPPORTER_CONFIG[supporterKey] ?? null;
}
