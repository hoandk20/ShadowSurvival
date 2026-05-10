export const BADGE_TIERS = {
    bronze: {
        key: 'bronze',
        label: 'BRONZE',
        color: '#caa07a'
    },
    silver: {
        key: 'silver',
        label: 'SILVER',
        color: '#c9d6e3'
    },
    gold: {
        key: 'gold',
        label: 'GOLD',
        color: '#ffd38a'
    },
    meta: {
        key: 'meta',
        label: 'META',
        color: '#b9a7ff'
    }
};

export const BADGES = [
    // BRONZE – Early / Onboarding
    {
        id: 'bronze_first_blood_first_rune',
        tier: 'bronze',
        name: 'First Blood, First Rune',
        description: 'Defeat your first enemy.',
        iconPath: 'assets/badge/First Blood.png',
        iconKey: 'badge_bronze_first_blood_first_rune'
    },
    {
        id: 'bronze_pixel_proof',
        tier: 'bronze',
        name: 'Pixel-Proof',
        description: 'Finish a wave without taking damage.',
        iconPath: 'assets/badge/Pixel-Proof.png',
        iconKey: 'badge_bronze_pixel_proof'
    },
    {
        id: 'bronze_collectors_itch',
        tier: 'bronze',
        name: "The Collector’s Itch",
        description: 'Pick up 100 XP orbs in one run.',
        iconPath: 'assets/badge/The Collector Itch.png',
        iconKey: 'badge_bronze_collectors_itch'
    },
    {
        id: 'bronze_gold_has_weight',
        tier: 'bronze',
        name: 'Gold Has Weight',
        description: 'Earn 300 gold in one run.',
        iconPath: 'assets/badge/Gold Has Weight.png',
        iconKey: 'badge_bronze_gold_has_weight'
    },
    {
        id: 'bronze_reroll_ritual',
        tier: 'bronze',
        name: 'Reroll Ritual',
        description: 'Reroll 10 times in one run.',
        iconPath: 'assets/badge/Reroll Ritual.png',
        iconKey: 'badge_bronze_reroll_ritual'
    },
    {
        id: 'bronze_upgrade_initiation',
        tier: 'bronze',
        name: 'Upgrade Initiation',
        description: 'Purchase your first meta upgrade.',
        iconPath: 'assets/badge/Upgrade Initiation.png',
        iconKey: 'badge_bronze_upgrade_initiation'
    },
    {
        id: 'bronze_boss_breaker',
        tier: 'bronze',
        name: 'Boss Breaker',
        description: 'Defeat a boss for the first time.',
        iconPath: 'assets/badge/Boss Breaker.png',
        iconKey: 'badge_bronze_boss_breaker'
    },
    {
        id: 'bronze_miniboss_harvester',
        tier: 'bronze',
        name: 'Miniboss Harvester',
        description: 'Defeat 3 minibosses in one run.',
        iconPath: 'assets/badge/Miniboss Harvester.png',
        iconKey: 'badge_bronze_miniboss_harvester'
    },
    {
        id: 'bronze_six_slot_symphony',
        tier: 'bronze',
        name: 'Six-Slot Symphony',
        description: 'Reach max active skills in one run.',
        iconPath: 'assets/badge/Six-Slot Symphony.png',
        iconKey: 'badge_bronze_six_slot_symphony'
    },
    {
        id: 'bronze_roster_expansion',
        tier: 'bronze',
        name: 'Roster Expansion',
        description: 'Unlock 5 characters.',
        iconPath: 'assets/badge/Roster Expansion.png',
        iconKey: 'badge_bronze_roster_expansion'
    },

    // SILVER – Skill expression / build awareness
    {
        id: 'silver_no_rerolls_no_regrets',
        tier: 'silver',
        name: 'No Rerolls, No Regrets',
        description: 'Win a run with 0 rerolls used.',
        iconPath: 'assets/badge/No Rerolls No Regrets.png',
        iconKey: 'badge_silver_no_rerolls_no_regrets'
    },
    {
        id: 'silver_last_frame_escape',
        tier: 'silver',
        name: 'Last-Frame Escape',
        description: 'Survive 10 seconds while below 10% HP.',
        iconPath: 'assets/badge/Last-Frame Escape.png',
        iconKey: 'badge_silver_last_frame_escape'
    },
    {
        id: 'silver_crit_happens',
        tier: 'silver',
        name: 'Crit Happens',
        description: 'Land 10 critical hits within 15 seconds.',
        iconPath: 'assets/badge/Crit Happens.png',
        iconKey: 'badge_silver_crit_happens'
    },
    {
        id: 'silver_status_architect',
        tier: 'silver',
        name: 'Status Architect',
        description: 'Apply 3 different status effects in one wave.',
        iconPath: 'assets/badge/Status Architect.png',
        iconKey: 'badge_silver_status_architect'
    },
    {
        id: 'silver_lock_and_loaded',
        tier: 'silver',
        name: 'Lock & Loaded',
        description: 'Keep the same locked item through 3 shop rerolls.',
        iconPath: 'assets/badge/Lock Loaded.png',
        iconKey: 'badge_silver_lock_and_loaded'
    },
    {
        id: 'silver_shop_big_spender',
        tier: 'silver',
        name: 'Shop Big Spender',
        description: 'Spend 250 gold in a single shop visit.',
        iconPath: 'assets/badge/Shop Big Spender.png',
        iconKey: 'badge_silver_shop_big_spender'
    },
    {
        id: 'silver_magnet_hands',
        tier: 'silver',
        name: 'Magnet Hands',
        description: 'Reach 180% pickup range multiplier in one run.',
        iconPath: 'assets/badge/Magnet Hands.png',
        iconKey: 'badge_silver_magnet_hands'
    },
    {
        id: 'silver_supporter_bond',
        tier: 'silver',
        name: 'Supporter Bond',
        description: 'Finish 10 waves with the same supporter active.',
        iconPath: 'assets/badge/Supporter Bond.png',
        iconKey: 'badge_silver_supporter_bond'
    },
    {
        id: 'silver_lone_wolf_protocol',
        tier: 'silver',
        name: 'Lone Wolf Protocol',
        description: 'Clear wave 10 without recruiting a supporter.',
        iconPath: 'assets/badge/Lone Wolf Protocol.png',
        iconKey: 'badge_silver_lone_wolf_protocol'
    },
    {
        id: 'silver_one_skill_discipline',
        tier: 'silver',
        name: 'One Skill Discipline',
        description: 'Use only your starting active skill for 5 consecutive waves.',
        iconPath: 'assets/badge/One Skill Discipline.png',
        iconKey: 'badge_silver_one_skill_discipline'
    },

    // GOLD – Build mastery / challenge
    {
        id: 'gold_projectile_purist',
        tier: 'gold',
        name: 'Projectile Purist',
        description: 'Reach wave 10 using only projectile skills.',
        iconPath: 'assets/badge/Projectile Purist.png',
        iconKey: 'badge_gold_projectile_purist'
    },
    {
        id: 'gold_melee_zealot',
        tier: 'gold',
        name: 'Melee Zealot',
        description: 'Reach wave 10 using only melee skills.',
        iconPath: 'assets/badge/Melee Zealot.png',
        iconKey: 'badge_gold_melee_zealot'
    },
    {
        id: 'gold_the_economy_build',
        tier: 'gold',
        name: 'The Economy Build',
        description: 'Reach +30% gold gain and +30% XP gain in one run.',
        iconPath: 'assets/badge/The Economy Build.png',
        iconKey: 'badge_gold_the_economy_build'
    },
    {
        id: 'gold_flawless_finale',
        tier: 'gold',
        name: 'Flawless Finale',
        description: 'Defeat a boss without taking damage during that boss wave.',
        iconPath: 'assets/badge/Flawless Finale.png',
        iconKey: 'badge_gold_flawless_finale'
    },
    {
        id: 'gold_heavy_hitter',
        tier: 'gold',
        name: 'Heavy Hitter',
        description: 'Deal 150+ damage in a single hit.',
        iconPath: 'assets/badge/Heavy Hitter.png',
        iconKey: 'badge_gold_heavy_hitter'
    },
    {
        id: 'gold_impact_conductor',
        tier: 'gold',
        name: 'Impact Conductor',
        description: 'Trigger 20 heavy hit effects in one run.',
        iconPath: 'assets/badge/Impact Conductor.png',
        iconKey: 'badge_gold_impact_conductor'
    },

    // META / LONG-TERM
    {
        id: 'meta_dynamon_drip',
        tier: 'meta',
        name: 'Dynamon Drip',
        description: 'Earn 100+ dynamon across runs.',
        iconPath: 'assets/badge/Dynamon Drip.png',
        iconKey: 'badge_meta_dynamon_drip'
    },
    {
        id: 'meta_maxed_out',
        tier: 'meta',
        name: 'Maxed Out',
        description: 'Max any single meta upgrade line.',
        iconPath: 'assets/badge/Maxed Out.png',
        iconKey: 'badge_meta_maxed_out'
    },
    {
        id: 'meta_veteran_survivor',
        tier: 'meta',
        name: 'Veteran Survivor',
        description: 'Complete 10 total runs.',
        iconPath: 'assets/badge/Veteran Survivor.png',
        iconKey: 'badge_meta_veteran_survivor'
    },
    {
        id: 'meta_completionist_rune',
        tier: 'meta',
        name: 'Completionist Rune',
        description: 'Unlock all characters.',
        iconPath: 'assets/badge/Completionist Rune.png',
        iconKey: 'badge_meta_completionist_rune'
    }
];

export function getBadgeTier(tierKey) {
    return BADGE_TIERS[tierKey] ?? BADGE_TIERS.bronze;
}

export function getBadgeById(badgeId) {
    return BADGES.find((badge) => badge.id === badgeId) ?? null;
}
