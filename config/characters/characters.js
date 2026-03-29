// config/characters/characters.js
export const CHARACTER_CONFIG = {
    lumina: {
        label: 'Lumina',
        description: 'A light mage, the last beacon against the darkness.',
        assetKey: 'lumina',
        assetFormat: 'spritesheet',
        defaultSkill: 'heavenfall',
        hp: 110,
        armor: 1,
        speed: 75,
        size: { width: 20, height: 20 }
    },
    aqua: {
        label: 'Aqua',
        description: 'A water sage who controls the flow to cleanse and protect.',
        assetKey: 'aqua',
        assetFormat: 'spritesheet',
        defaultSkill: 'nova',
        hp: 140,
        armor: 1,
        speed: 75,
        size: { width: 20, height: 20 }
    },
    radian: {
        label: 'Radian',
        description: 'An eastern exorcist, sealing demons with talismans and barriers.',
        assetKey: 'radian',
        assetFormat: 'spritesheet',
        defaultSkill: 'charm',
        hp: 100,
        armor: 1,
        speed: 75,
        size: { width: 20, height: 20 }
    },
    frost: {
        label: 'Frost',
        description: 'An ice mage who freezes enemies and slows the horde.',
        assetKey: 'frost',
        assetFormat: 'spritesheet',
        defaultSkill: 'ice',
        hp: 100,
        armor: 1,
        speed: 78,
        size: { width: 20, height: 20 }
    },
    holy: {
        label: 'Holy',
        description: 'An exorcist nun wielding sacred flames to purge evil.',
        assetKey: 'holy',
        assetFormat: 'spritesheet',
        defaultSkill: 'aura',
        hp: 85,
        armor: 1,
        speed: 80,
        size: { width: 20, height: 20 }
    },
    witch: {
        label: 'Witch',
        description: 'An ancient sorceress using forbidden magic to bend the battlefield.',
        assetKey: 'witch',
        assetFormat: 'spritesheet',
        defaultSkill: 'avada',
        hp: 75,
        armor: 1,
        speed: 82,
        size: { width: 20, height: 20 }
    },
    asian_dragon: {
        label: 'Asian Dragon',
        description: 'A mystical dragon spirit channeling arcane force with elegant precision.',
        assetKey: 'asian_dragon',
        assetFormat: 'spritesheet',
        defaultSkill: 'flame',
        hp: 75,
        armor: 1,
        speed: 82,
        size: { width: 30, height: 25 }
    },
    bodoi: {
        label: 'Bodoi',
        description: 'Bodoi is a warrior from Vietnam who has come to this land to eliminate the monsters threatening it.',
        assetKey: 'bodoi',
        assetFormat: 'spritesheet',
        defaultSkill: 'mu_coi',
        hp: 75,
        armor: 1,
        speed: 82,
        size: { width: 20, height: 23 }
    },
    hoan: {
        label: 'Hoan',
        description: 'Hoan, an IT specialist from 2030, wakes up trapped in a monster-filled world. With no way back, he turns code into weapons to survive.',
        assetKey: 'hoan',
        assetFormat: 'spritesheet',
        defaultSkill: 'code',
        hp: 75,
        armor: 1,
        speed: 82,
        size: { width: 20, height: 23 }
    },
    gambler: {
        label: 'Gambler',
        description: 'A rogue cardsharp who bets everything on impossible rolls.',
        assetKey: 'gambler',
        assetFormat: 'spritesheet',
        defaultSkill: 'card_toss',
        hp: 80,
        armor: 1,
        speed: 78,
        size: { width: 20, height: 20 }
    },
    raiji: {
        label: 'Raiji',
        description: 'A lightning mage calling down thunder upon the swarm.',
        assetKey: 'raiji',
        assetFormat: 'spritesheet',
        defaultSkill: 'thunder',
        hp: 70,
        armor: 2,
        speed: 85,
        size: { width: 20, height: 20 }
    },
    warden: {
        label: 'Warden',
        description: 'A prison keeper who binds and suppresses dark entities.',
        assetKey: 'warden',
        assetFormat: 'spritesheet',
        defaultSkill: 'fire',
        hp: 100,
        armor: 2,
        speed: 75,
        size: { width: 20, height: 20 }
    },
    grum: {
        label: 'Grum',
        description: 'A wrestler who crushes enemies with sheer physical power.',
        assetKey: 'grum',
        assetFormat: 'spritesheet',
        defaultSkill: 'iron_fist',
        hp: 170,
        armor: 3,
        speed: 70,
        size: { width: 25, height: 25 }
    }
};

export const DEFAULT_CHARACTER_KEY = 'lumina';

export const CHARACTER_KEYS = Object.keys(CHARACTER_CONFIG);

export function getCharacterConfig(key) {
    return CHARACTER_CONFIG[key] ?? CHARACTER_CONFIG[DEFAULT_CHARACTER_KEY];
}
