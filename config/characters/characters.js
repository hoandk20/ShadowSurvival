// config/characters/characters.js
import { createCharacterConfig } from '../stats.js';

export const CHARACTER_CONFIG = {
    lumina: createCharacterConfig({
        label: 'Lumina',
        description: 'A light mage, the last beacon against the darkness.',
        passiveDescription: '+40 skill range.',
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
            armor: 2,
            moveSpeed: -5,
            dodge: 0.2
        },
        size: { width: 22, height: 22 }
    }),
    aqua: createCharacterConfig({
        label: 'Aqua',
        description: 'A water sage who controls the flow to cleanse and protect.',
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
        assetKey: 'radian',
        assetFormat: 'spritesheet',
        defaultSkill: 'charm',
        statsBonus: {},
        size: { width: 20, height: 20 }
    }),
    frost: createCharacterConfig({
        label: 'Frost',
        description: 'An ice mage who freezes enemies and slows the horde.',
        assetKey: 'frost',
        assetFormat: 'spritesheet',
        defaultSkill: 'ice',
        statsBonus: {
            moveSpeed: 3
        },
        size: { width: 20, height: 20 }
    }),
    witch: createCharacterConfig({
        label: 'Witch',
        description: 'An ancient sorceress using forbidden magic to bend the battlefield.',
        assetKey: 'witch',
        assetFormat: 'spritesheet',
        defaultSkill: 'avada',
        statsBonus: {
            hp: -25,
            moveSpeed: 7
        },
        size: { width: 20, height: 20 }
    }),
    asian_dragon: createCharacterConfig({
        label: 'Asian Dragon',
        description: 'A mystical dragon spirit channeling arcane force with elegant precision.',
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
        description: 'Bodoi is a warrior from Vietnam who has come to this land to eliminate the monsters threatening it.',
        assetKey: 'bodoi',
        assetFormat: 'spritesheet',
        defaultSkill: 'mu_coi',
        statsBonus: {
            hp: -25,
            moveSpeed: 7
        },
        size: { width: 20, height: 23 }
    }),
    gambler: createCharacterConfig({
        label: 'Gambler',
        description: 'A rogue cardsharp who bets everything on impossible rolls.',
        assetKey: 'gambler',
        assetFormat: 'spritesheet',
        defaultSkill: 'card_toss',
        statsBonus: {
            hp: -20,
            moveSpeed: 3
        },
        size: { width: 20, height: 20 }
    }),
    raiji: createCharacterConfig({
        label: 'Raiji',
        description: 'A lightning mage calling down thunder upon the swarm.',
        assetKey: 'raiji',
        assetFormat: 'spritesheet',
        defaultSkill: 'thunder',
        statsBonus: {
            hp: -30,
            armor: 1,
            moveSpeed: 10
        },
        size: { width: 20, height: 20 }
    }),
    warden: createCharacterConfig({
        label: 'Warden',
        description: 'A prison keeper who binds and suppresses dark entities.',
        assetKey: 'warden',
        assetFormat: 'spritesheet',
        defaultSkill: 'fire',
        statsBonus: {
            armor: 1
        },
        size: { width: 20, height: 20 }
    }),
    werewolf: createCharacterConfig({
        label: 'Werewolf',
        description: 'A feral melee hunter that tears through enemies with oversized claw strikes.',
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
            critChance: 0.08
        },
        size: { width: 25, height: 25 }
    }),
    assasin: createCharacterConfig({
        label: 'Assasin',
        description: 'A close-range killer who darts in with fast knife stabs and clean finishing cuts.',
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
            hp: -10,
            moveSpeed: 8,
            critChance: 0.12
        },
        size: { width: 20, height: 22 }
    })
};

export const DEFAULT_CHARACTER_KEY = 'lumina';

export const CHARACTER_KEYS = [
    'lumina',
    'knight',
    ...Object.keys(CHARACTER_CONFIG).filter((key) => key !== 'lumina' && key !== 'knight')
];

export function getCharacterConfig(key) {
    return CHARACTER_CONFIG[key] ?? CHARACTER_CONFIG[DEFAULT_CHARACTER_KEY];
}
