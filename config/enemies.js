// config/enemies.js
import { createEnemyConfig } from './stats.js';

const DISPLAY_SCALE = 1;
const HITBOX_SCALE = 1;
const scaleDimension = ({ width, height }) => ({
    width: Math.max(2, Math.round((width ?? 0) * DISPLAY_SCALE)),
    height: Math.max(2, Math.round((height ?? 0) * DISPLAY_SCALE))
});
const scaleHitbox = ({ width, height }) => ({
    width: Math.max(2, Math.round((width ?? 0) * HITBOX_SCALE)),
    height: Math.max(2, Math.round((height ?? 0) * HITBOX_SCALE))
});

export const ENEMIES = {
    skeleton: createEnemyConfig({
        name: 'Skeleton',
        statsBonus: {
            attackRange: 200,
            attackCooldown: 900,
            knockbackResist: -0.2
        },
        combatType: 'melee',
        attackStyle: 'dash_lunge_back_fan',
        meleeAttack: {
            engageDelayMs: 120,
            windupMs: 750,
            recoveryMs: 180,
            rangePadding: 0,
            dashSpeed: 280,
            dashDistance: 150,
            dashOvershootDistance: 120,
            dashBackFan: {
                bulletSpeed: 80,
                bulletInterval: 300,
                bulletsPerWave: 2,
                spreadAngle: 100,
                projectileRadius: 5,
                projectileLifetimeMs: 1800,
                projectileDamageRatio: 1,
                projectileColor: 0xff3b3b,
                projectileGlowColor: 0xff8c8c
            }
        },
        behavior: 'chase',
        texture: 'skeleton',
        displaySize: scaleDimension({ width: 20, height: 20 }),
        hitboxSize: scaleHitbox({ width: 20, height: 20 }),
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    succubus: createEnemyConfig({
        name: 'Succubus',
        statsBonus: {
            damage: 4,
            attackCooldown: 700,
            attackRange: 180,
            knockbackResist: -0.2
        },
        combatType: 'ranged',
        attackStyle: 'projectile_burst',
        behavior: 'ranged',
        texture: 'succubus',
        displaySize: scaleDimension({ width: 20, height: 20 }),
        hitboxSize: scaleHitbox({ width: 20, height: 20 }),
        flashTint: 0xff0000,
        flashDuration: 120,
        rangedAttack: {
            preferredRange: 180,
            keepDistanceRatio: 0.72,
            projectileSpeed: 180,
            projectileRadius: 5,
            projectileLifetimeMs: 1400,
            projectileColor: 0xff7cba,
            projectileGlowColor: 0xffd5ee,
            burstCount: 3,
            burstSpreadDeg: 18
        }
    }),
    lamia: createEnemyConfig({
        name: 'Lamia',
        statsBonus: {
            damage: 3,
            attackCooldown: 900,
            attackRange: 180,
            knockbackResist: -0.2
        },
        combatType: 'ranged',
        attackStyle: 'trap_poison_cloud',
        behavior: 'ranged',
        texture: 'lamia',
        displaySize: scaleDimension({ width: 20, height: 20 }),
        hitboxSize: scaleHitbox({ width: 20, height: 20 }),
        flashTint: 0xff0000,
        flashDuration: 120,
        rangedAttack: {
            preferredRange: 180,
            keepDistanceRatio: 0.72,
            projectileSpeed: 180,
            projectileRadius: 5,
            projectileLifetimeMs: 1400,
            projectileColor: 0xff7cba,
            projectileGlowColor: 0xffd5ee,
            cloudRadius: 56,
            cloudDurationMs: 2200,
            cloudTickIntervalMs: 450,
            poisonDurationMs: 2500,
            cloudDamage: 0,
            cloudTags: ['poison', 'cloud', 'lamia_trap']
        }
    }),
    firer: createEnemyConfig({
        name: 'Firer',
        statsBonus: {
            damage: 3,
            attackCooldown: 900,
            attackRange: 180,
            knockbackResist: -0.2
        },
        combatType: 'ranged',
        attackStyle: 'trap_burn_cloud',
        behavior: 'ranged',
        texture: 'firer',
        displaySize: scaleDimension({ width: 20, height: 20 }),
        hitboxSize: scaleHitbox({ width: 20, height: 20 }),
        flashTint: 0xff7a33,
        flashDuration: 120,
        rangedAttack: {
            preferredRange: 180,
            keepDistanceRatio: 0.72,
            fireRadius: 56,
            fireDurationMs: 1800,
            fireTickIntervalMs: 450,
            burnDurationMs: 2500,
            fireDamage: 0,
            fireTags: ['fire', 'burn', 'enemy_trap']
        }
    }),
    ailen: createEnemyConfig({
        name: 'Ailen',
        statsBonus: {
            damage: 8,
            attackCooldown: 1300,
            attackRange: 260,
            knockbackResist: -0.2
        },
        combatType: 'ranged',
        attackStyle: 'projectile_sniper',
        behavior: 'ranged',
        texture: 'ailen',
        displaySize: scaleDimension({ width: 20, height: 20 }),
        hitboxSize: scaleHitbox({ width: 20, height: 20 }),
        flashTint: 0x8fd7ff,
        flashDuration: 120,
        rangedAttack: {
            preferredRange: 220,
            keepDistanceRatio: 0.82,
            projectileSpeed: 460,
            projectileRadius: 4,
            projectileLifetimeMs: 1800,
            projectileColor: 0x8fd7ff,
            projectileGlowColor: 0xe3f6ff,
            sniperWindupMs: 650,
            sniperRecoveryMs: 160
        }
    }),
    moth_woman: createEnemyConfig({
        name: 'Moth Woman',
        behavior: 'chase',
        texture: 'moth_woman',
        displaySize: scaleDimension({ width: 20, height: 20 }),
        hitboxSize: scaleHitbox({ width: 20, height: 20 }),
        flashTint: 0xff0000,
        flashDuration: 120,
        attackEffectTint: 0x000000,
        attackGlowColors: [0x000000, 0x111111],
        attackSparkTints: [0x000000]
    }),
    widow: createEnemyConfig({
        name: 'Widow',
        combatType: 'melee',
        attackStyle: 'contact_bite',
        behavior: 'chase',
        texture: 'widow',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    medusa: createEnemyConfig({
        name: 'Medusa',
        statsBonus: {
            effectResist: 0.6,
            damage: 10,
            attackCooldown: 1400,
            attackRange: 260,
            knockbackResist: -0.2
        },
        combatType: 'ranged',
        attackStyle: 'projectile_sniper',
        behavior: 'ranged',
        texture: 'medusa',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120,
        rangedAttack: {
            preferredRange: 220,
            keepDistanceRatio: 0.82,
            projectileSpeed: 520,
            projectileRadius: 5,
            projectileLifetimeMs: 1900,
            projectileColor: 0xc8f7ff,
            projectileGlowColor: 0xf7fbff,
            sniperWindupMs: 850,
            sniperRecoveryMs: 220,
            onHitEffectKey: 'petrify',
            onHitEffectOptions: {
                durationMs: 700,
                mode: 'stun',
                slowMultiplier: 0
            }
        }
    }),
    minotau: createEnemyConfig({
        name: 'Minotau',
        statsBonus: {
            effectResist: 0.6
        },
        behavior: 'chase',
        texture: 'minotau',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    baphomet: createEnemyConfig({
        name: 'Baphomet',
        statsBonus: {
            effectResist: 0.6
        },
        behavior: 'chase',
        texture: 'baphomet',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    dino: createEnemyConfig({
        name: 'Dino',
        statsBonus: {
            effectResist: 0.6
        },
        behavior: 'chase',
        texture: 'dino',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    bugmonster: createEnemyConfig({
        name: 'Bug Monster',
        statsBonus: {
            effectResist: 0.6
        },
        behavior: 'chase',
        texture: 'bugmonster',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    cursed_maiden: createEnemyConfig({
        name: 'Cursed Maiden',
        statsBonus: {
            effectResist: 0.6
        },
        behavior: 'chase',
        texture: 'cursed_maiden',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    kitsume: createEnemyConfig({
        name: 'Kitsume',
        statsBonus: {
            attackRange: 200,
            attackCooldown: 900
        },
        combatType: 'melee',
        attackStyle: 'dash_lunge',
        meleeAttack: {
            engageDelayMs: 120,
            windupMs: 750,
            recoveryMs: 180,
            rangePadding: 0,
            dashSpeed: 280,
            dashDistance: 150,
            dashOvershootDistance: 120
        },
        behavior: 'chase',
        texture: 'kitsume',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    mummy: createEnemyConfig({
        name: 'Mummy',
        behavior: 'chase',
        texture: 'mummy',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    zombie_woman: createEnemyConfig({
        name: 'Zombie Woman',
        statsBonus: {
            knockbackResist: 8
        },
        behavior: 'chase',
        texture: 'zombie_woman',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    slime: createEnemyConfig({
        name: 'Slime',
        combatType: 'melee',
        attackStyle: 'contact_smash',
        behavior: 'chase',
        texture: 'slime',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    worm: createEnemyConfig({
        name: 'Worm',
        behavior: 'chase',
        texture: 'worm',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    bomber: createEnemyConfig({
        name: 'Bomber',
        combatType: 'melee',
        attackStyle: 'contact_smash',
        behavior: 'chase',
        texture: 'bomber',
        displaySize: { width: 24, height: 24 },
        hitboxSize: { width: 24, height: 24 },
        flashTint: 0xff8c42,
        flashDuration: 120,
        explodeOnDead: {
            moveSpeedMultiplier: 1.5,
            delayMs: 200,
            damage: 50,
            radius: 36,
            triggerOnPlayerContact: true,
            contactRadius: 18
        }
    }),
    lava_monster: createEnemyConfig({
        name: 'Lava Monster',
        combatType: 'melee',
        attackStyle: 'contact_smash',
        behavior: 'chase',
        texture: 'lava_monster',
        displaySize: { width: 24, height: 24 },
        hitboxSize: { width: 24, height: 24 },
        flashTint: 0xff7a33,
        flashDuration: 120
    }),
    giant_rock: createEnemyConfig({
        name: 'Giant Rock',
        statsBonus: {
            maxHealth: 40,
            damage: 5,
            moveSpeed: -15,
            armor: 6,
            effectResist: 0.7,
            knockbackResist: 4
        },
        combatType: 'melee',
        attackStyle: 'contact_smash',
        behavior: 'chase',
        meleeAttack: {
            engageDelayMs: 140,
            windupMs: 900,
            recoveryMs: 260,
            rangePadding: 10,
            dashSpeed: 320,
            dashDistance: 220,
            dashOvershootDistance: 150
        },
        dashTelegraphWidth: 24,
        dashTelegraphAlpha: 0.18,
        texture: 'giant_rock',
        displaySize: { width: 64, height: 64 },
        hitboxSize: { width: 44, height: 44 },
        flashTint: 0xffb36b,
        flashDuration: 120,
        isBoss: true,
        finalBossKey: 'giant_rock'
    }),
    plant: createEnemyConfig({
        name: 'Plant Abomination',
        statsBonus: {
            maxHealth: 40,
            damage: 5,
            moveSpeed: -15,
            armor: 6,
            effectResist: 0.7,
            knockbackResist: 4
        },
        combatType: 'melee',
        attackStyle: 'plant_boss_cycle',
        behavior: 'chase',
        meleeAttack: {
            engageDelayMs: 140,
            windupMs: 900,
            recoveryMs: 260,
            rangePadding: 10,
            dashSpeed: 320,
            dashDistance: 220,
            dashOvershootDistance: 150
        },
        texture: 'plant',
        displaySize: { width: 64, height: 64 },
        hitboxSize: { width: 44, height: 44 },
        flashTint: 0xffb36b,
        flashDuration: 120,
        isBoss: true,
        finalBossKey: 'plant'
    }),
    black_widow: createEnemyConfig({
        name: 'Black Widow',
        statsBonus: {
            maxHealth: 40,
            damage: 5,
            moveSpeed: -15,
            armor: 6,
            effectResist: 0.7,
            knockbackResist: 4
        },
        combatType: 'melee',
        attackStyle: 'black_widow_cycle',
        behavior: 'chase',
        meleeAttack: {
            engageDelayMs: 140,
            windupMs: 900,
            recoveryMs: 260,
            rangePadding: 10,
            dashSpeed: 320,
            dashDistance: 220,
            dashOvershootDistance: 150
        },
        texture: 'black_widow',
        displaySize: { width: 64, height: 64 },
        hitboxSize: { width: 44, height: 44 },
        flashTint: 0xff7a7a,
        flashDuration: 120,
        isBoss: true,
        finalBossKey: 'black_widow'
    }),
    plant_melee_minion: createEnemyConfig({
        name: 'Plant Melee Minion',
        statsBonus: {
            maxHealth: 200
        },
        combatType: 'melee',
        attackStyle: 'contact_smash',
        behavior: 'chase',
        texture: 'plant_melee_minion',
        displaySize: { width: 36, height: 36 },
        hitboxSize: { width: 26, height: 26 },
        flashTint: 0x8ed36a,
        flashDuration: 120
    }),
    plant_ranged_minion: createEnemyConfig({
        name: 'Plant Ranged Minion',
        statsBonus: {
            maxHealth: 150,
            damage: 4,
            attackCooldown: 450,
            attackRange: 180
        },
        combatType: 'ranged',
        attackStyle: 'projectile_bolt',
        behavior: 'ranged',
        texture: 'plant_ranged_minion',
        displaySize: { width: 34, height: 34 },
        hitboxSize: { width: 24, height: 24 },
        flashTint: 0xb5f28a,
        flashDuration: 120,
        rangedAttack: {
            preferredRange: 180,
            keepDistanceRatio: 0.78,
            projectileSpeed: 140,
            projectileRadius: 4,
            projectileLifetimeMs: 1400,
            projectileColor: 0xb7f06a,
            projectileGlowColor: 0xe9ffba
        }
    }),
    rat: createEnemyConfig({
        name: 'Rat',
        behavior: 'chase',
        texture: 'rat',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    bat: createEnemyConfig({
        name: 'Bat',
        combatType: 'melee',
        attackStyle: 'contact_bite',
        behavior: 'chase',
        texture: 'bat',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    demonbat: createEnemyConfig({
        name: 'Demon Bat',
        behavior: 'chase',
        texture: 'demonbat',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    eyes: createEnemyConfig({
        name: 'Eyes',
        statsBonus: {
            damage: 4,
            attackCooldown: 350,
            attackRange: 180
        },
        combatType: 'ranged',
        attackStyle: 'projectile_bolt',
        behavior: 'ranged',
        texture: 'eyes',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 22, height: 22 },
        flashTint: 0xff0000,
        flashDuration: 120,
        rangedAttack: {
            preferredRange: 200,
            keepDistanceRatio: 0.72,
            projectileSpeed: 180,
            projectileRadius: 5,
            projectileLifetimeMs: 1400,
            projectileColor: 0xff7cba,
            projectileGlowColor: 0xffd5ee
        }
    })
    // Add more enemy types
};
