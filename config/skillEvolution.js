export const PASSIVE_EVOLUTION_CONFIG = {
    gambler_god_card_burst: {
        label: 'God Card Tempo',
        hidden: true,
        effects: [
            {
                type: 'skillConfigOverride',
                skillKey: 'god_card',
                overrides: {
                    cooldown: 500
                }
            }
        ]
    }
};

export const SKILL_EVOLUTION_CONFIG = [
    {
        key: 'lumina_heavenfall_to_sky_fall',
        characterKey: 'lumina',
        sourceSkillKey: 'heavenfall',
        evolvedSkillKey: 'sky_fall',
        inventoryKey: 'shotingstar',
        requiredLevel: 8,
        onlyDefaultSkill: true
    },
    {
        key: 'gambler_card_toss_to_god_card',
        characterKey: 'gambler',
        sourceSkillKey: 'card_toss',
        evolvedSkillKey: 'god_card',
        inventoryKey: 'card',
        requiredLevel: 8,
        onlyDefaultSkill: true,
        passiveEvolutionKey: 'gambler_god_card_burst'
    }
];

export function getPassiveEvolutionConfig(passiveKey) {
    return PASSIVE_EVOLUTION_CONFIG[passiveKey] ?? null;
}
