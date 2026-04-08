// config/characters/characters.js
import { createCharacterConfig } from '../stats.js';

export const CHARACTER_CONFIG = {
    lumina: createCharacterConfig({
        label: 'Lumina',
        description: 'A light mage, the last beacon against the darkness.',
        passiveDescription: '+40 skill range.',
        unlockCost: 0,
        assetKey: 'lumina',
        assetFormat: 'spritesheet',
        defaultSkill: 'shooting_star',
        statsBonus: {
            hp: -25,
            skillRange: 40
        },
        size: { width: 20, height: 20 }
    }),
    knight: createCharacterConfig({
        label: 'Knight',
        description: 'A heavily armored melee fighter who sweeps a broad blade arc across enemies in front.',
        passiveDescription: '+20% dodge chance.',
        unlockCost: 0,
        assetKey: 'knight',
        assetFormat: 'spritesheet',
        defaultSkill: 'slash',
        combatStyle: 'melee',
        meleeHitEffect: {
            color: 0xf4f1df,
            glowColor: 0xffffff,
            length: 28,
            spacing: 0,
            slashWidth: 6,
            slashCount: 1,
            impactRadius: 10,
            impactAlpha: 0.22,
            duration: 140
        },
        statsBonus: {
            hp: 20,
            armor: 3,
            moveSpeed: -5,
            dodge: 0.2
        },
        size: { width: 22, height: 22 }
    }),
    aqua: createCharacterConfig({
        label: 'Aqua',
        description: 'A water sage who controls the flow to cleanse and protect.',
        passiveDescription: 'Tidal Flow: water skill hits grant Flow, up to 5 stacks.\nEach stack gives +4% area size and +3% projectile speed.\nAt 5 stacks, the next water cast triggers Splash Burst on hit: 50% splash damage, freezes nearby enemies for 0.7s, then resets Flow.',
        unlockType: 'dynamon',
        unlockCost: 260,
        assetKey: 'aqua',
        assetFormat: 'spritesheet',
        defaultSkill: 'nova',
        statsBonus: {
            hp: 40
        },
        size: { width: 20, height: 20 }
    }),
    radian: createCharacterConfig({
        label: 'Radian',
        description: 'An eastern exorcist, sealing demons with talismans and barriers.',
        passiveDescription: 'Ghost Summon calls forth spirits that persistently hunt nearby enemies.',
        unlockType: 'challenge',
        unlockRequirement: {
            type: 'clear_map',
            mapKey: 'church_sanctuary'
        },
        assetKey: 'radian',
        assetFormat: 'spritesheet',
        defaultSkill: 'ghost_summon',
        statsBonus: {
            hp: 5
        },
        size: { width: 20, height: 20 }
    }),
    frost: createCharacterConfig({
        label: 'Frost',
        description: 'An ice mage who freezes enemies and slows the horde.',
        passiveDescription: 'Casts Frost Zone: a freezing field that damages enemies and briefly freezes targets after repeated hits.',
        unlockType: 'dynamon',
        unlockCost: 360,
        assetKey: 'frost',
        assetFormat: 'spritesheet',
        defaultSkill: 'frost_zone',
        statsBonus: {
            moveSpeed: 3
        },
        size: { width: 20, height: 20 }
    }),
    witch: createCharacterConfig({
        label: 'Witch',
        description: 'An ancient sorceress using forbidden magic to bend the battlefield.',
        passiveDescription: 'Casts Ritual Zone: periodically places a magic circle that slows and damages enemies standing inside.',
        unlockType: 'challenge',
        unlockRequirement: {
            type: 'clear_map',
            mapKey: 'maprock_field'
        },
        assetKey: 'witch',
        assetFormat: 'spritesheet',
        defaultSkill: 'ritual_zone',
        statsBonus: {
            hp: -25,
            moveSpeed: 7,
            critChance: 0.25,
            critMultiplier: 0.3,
            effectChance: 0.2,
            effectDamageMultiplier: 0.1
        },
        size: { width: 20, height: 20 }
    }),
    asian_dragon: createCharacterConfig({
        label: 'Asian Dragon',
        description: 'A mystical dragon spirit channeling arcane force with elegant precision.',
        passiveDescription: 'Dragonfire: Flame explodes on hit for 30% bonus damage in a small area and leaves behind a burn cloud that applies burn to enemies entering it.',
        unlockType: 'challenge',
        unlockRequirement: {
            type: 'clear_map',
            mapKey: 'inside_church'
        },
        assetKey: 'asian_dragon',
        assetFormat: 'spritesheet',
        defaultSkill: 'flame',
        statsBonus: {
            hp: -25,
            moveSpeed: 7
        },
        size: { width: 30, height: 25 }
    }),
    bodoi: createCharacterConfig({
        label: 'Bodoi',
        description: 'A swift ranged fighter who throws Mu Coi shots that chain from one enemy into the next.',
        passiveDescription: 'Mu Coi auto-aims, chains once to another enemy on hit, and triggers a small burst when it redirects.',
        unlockType: 'dynamon',
        unlockCost: 520,
        assetKey: 'bodoi',
        assetFormat: 'spritesheet',
        defaultSkill: 'mu_coi',
        statsBonus: {
            hp: -20,
            moveSpeed: 7
        },
        size: { width: 20, height: 23 }
    }),
    gambler: createCharacterConfig({
        label: 'Gambler',
        description: 'A rogue cardsharp who bets everything on impossible rolls.',
        passiveDescription: 'Loaded Deck: +8% crit chance. Card Toss fires a 3-card fan with the center card aiming true and the side cards spreading outward.',
        unlockType: 'dynamon',
        unlockCost: 580,
        assetKey: 'gambler',
        assetFormat: 'spritesheet',
        defaultSkill: 'card_toss',
        statsBonus: {
            hp: -15,
            moveSpeed: 5,
            critChance: 0.08
        },
        size: { width: 20, height: 20 }
    }),
    raiji: createCharacterConfig({
        label: 'Raiji',
        description: 'A lightning mage calling down thunder upon the swarm.',
        passiveDescription: 'Static Surge: +1 shock chain and heightened lightning precision.',
        unlockType: 'dynamon',
        unlockCost: 640,
        assetKey: 'raiji',
        assetFormat: 'spritesheet',
        defaultSkill: 'thunder',
        statsBonus: {
            hp: -25,
            armor: 1,
            moveSpeed: 8,
            critChance: 0.02,
            shockChainCount: 1
        },
        size: { width: 20, height: 20 }
    }),
    warden: createCharacterConfig({
        label: 'Warden',
        description: 'A prison keeper who binds and suppresses dark entities.',
        passiveDescription: 'Detention Mark: first hit marks a target. Hitting the marked target again triggers a small explosion, briefly roots it, and resets the mark.',
        unlockType: 'dynamon',
        unlockCost: 700,
        assetKey: 'warden',
        assetFormat: 'spritesheet',
        defaultSkill: 'fire',
        statsBonus: {
            hp: 10,
            armor: 1,
            moveSpeed: -2
        },
        size: { width: 20, height: 20 }
    }),
    werewolf: createCharacterConfig({
        label: 'Werewolf',
        description: 'A feral melee hunter that tears through enemies with oversized claw strikes.',
        passiveDescription: 'Below 50% HP: +15% attack speed, +10 move speed, +8% lifesteal.\nHits against bleeding targets heal 1.5% max HP.',
        unlockType: 'dynamon',
        unlockCost: 780,
        assetKey: 'werewolf',
        assetFormat: 'spritesheet',
        defaultSkill: 'claw',
        combatStyle: 'melee',
        meleeHitEffect: {
            color: 0xff667f,
            glowColor: 0xffd0d6,
            length: 18,
            spacing: 6
        },
        statsBonus: {
            hp: 35,
            armor: 1,
            moveSpeed: 2,
            critChance: -0.6
        },
        size: { width: 25, height: 25 }
    }),
    assasin: createCharacterConfig({
        label: 'Assasin',
        description: 'A close-range killer who darts in with fast knife stabs and clean finishing cuts.',
        passiveDescription: 'Phantom Slash: critical stab hits trigger a ghostly ambush slash for 35% bonus damage. The phantom appears behind a nearby enemy, cuts through it, and can trigger about once every 0.7s.',
        unlockType: 'challenge',
        unlockRequirement: {
            type: 'max_meta_upgrade',
            upgradeKey: 'crit_chance'
        },
        assetKey: 'assasin',
        assetFormat: 'spritesheet',
        defaultSkill: 'stab',
        combatStyle: 'melee',
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
        statsBonus: {
            hp: -15,
            moveSpeed: 10,
            critChance: 0.1
        },
        size: { width: 20, height: 22 }
    })
};

export const DEFAULT_CHARACTER_KEY = 'lumina';
export const DEFAULT_UNLOCKED_CHARACTER_KEYS = Object.freeze(['lumina', 'knight']);

export const CHARACTER_KEYS = [
    'lumina',
    'knight',
    'werewolf',
    'witch',
    ...Object.keys(CHARACTER_CONFIG).filter((key) => !['lumina', 'knight', 'werewolf', 'witch'].includes(key))
];

export function getCharacterConfig(key) {
    return CHARACTER_CONFIG[key] ?? CHARACTER_CONFIG[DEFAULT_CHARACTER_KEY];
}

export function getCharacterUnlockCost(characterKey) {
    const config = getCharacterConfig(characterKey);
    return Math.max(0, Math.floor(config?.unlockCost ?? 0));
}

export function getCharacterUnlockType(characterKey) {
    const config = getCharacterConfig(characterKey);
    return String(config?.unlockType ?? ((config?.unlockCost ?? 0) > 0 ? 'dynamon' : 'free'));
}

export function getCharacterUnlockRequirement(characterKey) {
    const config = getCharacterConfig(characterKey);
    return config?.unlockRequirement ?? null;
}
