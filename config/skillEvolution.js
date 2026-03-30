export const SKILL_EVOLUTION_CONFIG = [
    {
        key: 'aqua_nova_to_aqua_stream',
        sourceSkillKey: 'nova',
        evolvedSkillKey: 'aqua_stream',
        inventoryKey: 'waterwarn',
        requiredLevel: 8
    },
    {
        key: 'lumina_heavenfall_to_sky_fall',
        sourceSkillKey: 'heavenfall',
        evolvedSkillKey: 'sky_fall',
        inventoryKey: 'shotingstar',
        requiredLevel: 8
    },
    {
        key: 'gambler_card_toss_to_card_shot',
        sourceSkillKey: 'card_toss',
        evolvedSkillKey: 'card_shot',
        inventoryKey: 'card',
        requiredLevel: 3,
        requiredSkillObjectSpawns: 3500
    },
    {
        key: 'card_shot_to_god_card',
        sourceSkillKey: 'card_shot',
        evolvedSkillKey: 'god_card',
        inventoryKey: 'clownmask',
        requiredLevel: 1,
        renameInventoryKey: 'card',
        requiredEliteKillsAfterReady: 50
    }
];
