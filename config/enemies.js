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
            moveSpeed: 55,
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
        displaySize: scaleDimension({ width: 35, height: 35 }),
        hitboxSize: scaleHitbox({ width: 35, height: 35 }),
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    succubus: createEnemyConfig({
        name: 'Succubus',
        statsBonus: {
            moveSpeed: 48,
            attackCooldown: 100,
            knockbackResist: -0.2
        },
        combatType: 'melee',
        attackStyle: 'contact_slash',
        behavior: 'chase',
        texture: 'succubus',
        displaySize: scaleDimension({ width: 20, height: 20 }),
        hitboxSize: scaleHitbox({ width: 20, height: 20 }),
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    lamia: createEnemyConfig({
        name: 'Lamia',
        statsBonus: {
            moveSpeed: 48,
            attackCooldown: 100,
            knockbackResist: -0.2
        },
        combatType: 'melee',
        attackStyle: 'contact_slash',
        behavior: 'chase',
        texture: 'lamia',
        displaySize: scaleDimension({ width: 20, height: 20 }),
        hitboxSize: scaleHitbox({ width: 20, height: 20 }),
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    moth_woman: createEnemyConfig({
        name: 'Moth Woman',
        statsBonus: {
            moveSpeed: 45
        },
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
        statsBonus: {
            moveSpeed: 48
        },
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
            moveSpeed: 45,
            effectResist: 0.6
        },
        behavior: 'chase',
        texture: 'medusa',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120,
        isBoss: true
    }),
    minotau: createEnemyConfig({
        name: 'Minotau',
        statsBonus: {
            moveSpeed: 45,
            effectResist: 0.6
        },
        behavior: 'chase',
        texture: 'minotau',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120,
        isBoss: true
    }),
    baphomet: createEnemyConfig({
        name: 'Baphomet',
        statsBonus: {
            moveSpeed: 45,
            effectResist: 0.6
        },
        behavior: 'chase',
        texture: 'baphomet',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120,
        isBoss: true
    }),
    dino: createEnemyConfig({
        name: 'Dino',
        statsBonus: {
            moveSpeed: 45,
            effectResist: 0.6
        },
        behavior: 'chase',
        texture: 'dino',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120,
        isBoss: true
    }),
    bugmonster: createEnemyConfig({
        name: 'Bug Monster',
        statsBonus: {
            moveSpeed: 45,
            effectResist: 0.6
        },
        behavior: 'chase',
        texture: 'bugmonster',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120,
        isBoss: true
    }),
    cursed_maiden: createEnemyConfig({
        name: 'Cursed Maiden',
        statsBonus: {
            moveSpeed: 45,
            effectResist: 0.6
        },
        behavior: 'chase',
        texture: 'cursed_maiden',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120,
        isBoss: true
    }),
    kitsume: createEnemyConfig({
        name: 'Kitsume',
        statsBonus: {
            moveSpeed: 55,
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
        displaySize: { width: 35, height: 35 },
        hitboxSize: { width: 35, height: 35 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    mummy: createEnemyConfig({
        name: 'Mummy',
        statsBonus: {
            moveSpeed: 45
        },
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
            moveSpeed: 45,
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
        statsBonus: {
            moveSpeed: 45
        },
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
        statsBonus: {
            moveSpeed: 45
        },
        behavior: 'chase',
        texture: 'worm',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    rat: createEnemyConfig({
        name: 'Rat',
        statsBonus: {
            moveSpeed: 45
        },
        behavior: 'chase',
        texture: 'rat',
        displaySize: { width: 20, height: 20 },
        hitboxSize: { width: 20, height: 20 },
        flashTint: 0xff0000,
        flashDuration: 120
    }),
    bat: createEnemyConfig({
        name: 'Bat',
        statsBonus: {
            moveSpeed: 48
        },
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
        statsBonus: {
            moveSpeed: 45
        },
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
            moveSpeed: 20,
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
            projectileSpeed: 230,
            projectileRadius: 5,
            projectileLifetimeMs: 1400,
            projectileColor: 0xff7cba,
            projectileGlowColor: 0xffd5ee
        }
    })
    // Add more enemy types
};
