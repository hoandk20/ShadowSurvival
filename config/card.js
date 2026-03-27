// config/card.js
export const CARD_CONFIG = [
    {
        key: 'vitality',
        name: 'Vitality',
        description: '+25 Max HP',
        iconFile: 'icon_vitality.png',
        rarity: 'common',
        group: 'survivability',
        effect: {
            type: 'maxHealth',
            value: 25
        },
        weight: 5,
        stackLimit: 5
    },
    {
        key: 'agility',
        name: 'Agility',
        description: '+30 Move Speed',
        iconFile: 'icon_agility.png',
        rarity: 'common',
        group: 'mobility',
        effect: {
            type: 'speed',
            value: 30
        },
        weight: 2,
        stackLimit: 5
    },
    {
        key: 'fury',
        name: 'Fury',
        description: '-0.15s Skill cooldown',
        iconFile: 'icon_fury.png',
        rarity: 'rare',
        group: 'offense',
        effect: {
            type: 'skillCooldown',
            value: -150
        },
        weight: 2,
        stackLimit: 5
    },
    {
        key: 'focus',
        name: 'Focus',
        description: '+20 Heal now',
        iconFile: 'icon_focus.png',
        rarity: 'common',
        group: 'survivability',
        effect: {
            type: 'heal',
            value: 20
        },
        weight: 8,
        stackLimit: 99999
    }
    ,
    {
        key: 'fierce',
        name: 'Fierce',
        description: '+10% Damage dealt',
        iconFile: 'icon_fierce.png',
        rarity: 'legendary',
        group: 'damage',
        effect: {
            type: 'damage',
            value: 0.1
        },
        weight: 5,
        stackLimit: 3
    },
    {
        key: 'echo',
        name: 'Arcane Echo',
        description: '+1 additional skill object',
        iconFile: 'icon_echo.png',
        rarity: 'rare',
        group: 'skill',
        effect: {
            type: 'skillObject',
            value: 1
        },
        weight: 99,
        stackLimit: 12
    }
];

export const CARD_RARITY_STYLES = {
    common: { border: 0x293e66, glow: 0x1c2a44, badge: 0x374a74, text: '#b4c4ff' },
    rare: { border: 0x5d2d85, glow: 0x331d44, badge: 0x7031c3, text: '#d6b5ff' },
    legendary: { border: 0x8a6123, glow: 0x452a15, badge: 0xaa6216, text: '#ffe0ad' }
};
