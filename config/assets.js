// config/assets.js
import { CHARACTER_CONFIG } from './characters/characters.js';

const DEFAULT_CHARACTER_SPRITESHEET_ANIMATION_CONFIG = {
    idle: { frames: ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'], frameRate: 5, loop: true },
    move: { frames: ['image_5.png', 'image_6.png', 'image_7.png', 'image_8.png'], frameRate: 5, loop: true }
};

const buildCharacterAssetEntries = () => {
    const entries = {};
    for (const characterKey in CHARACTER_CONFIG) {
        const character = CHARACTER_CONFIG[characterKey];
        const assetKey = character.assetKey ?? characterKey;
        entries[assetKey] = {
            animations: DEFAULT_CHARACTER_SPRITESHEET_ANIMATION_CONFIG,
            atlas: {
                key: `${assetKey}_atlas`,
                texture: `assets/player/${characterKey}/spritesheet.png`,
                atlasJSON: `assets/player/${characterKey}/spritesheet.json`
            }
        }
    }
    return entries;
};

const buildCharacterSizeEntries = () => {
    const entries = {};
    for (const characterKey in CHARACTER_CONFIG) {
        const character = CHARACTER_CONFIG[characterKey];
        if (!character.size) continue;
        const assetKey = character.assetKey ?? characterKey;
        entries[assetKey] = {
            width: character.size.width,
            height: character.size.height
        };
    }
    return entries;
};

const CHARACTER_ASSET_ENTRIES = buildCharacterAssetEntries();
const CHARACTER_SIZE_ENTRIES = buildCharacterSizeEntries();
const ENEMY_MOVE_FRAMES = ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'];
const GIANT_ROCK_MOVE_FRAMES = ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'];
const GIANT_ROCK_JUMP_FRAMES = ['image_5.png', 'image_6.png', 'image_7.png', 'image_8.png'];
const GIANT_ROCK_ATTACK_FRAMES = ['image_9.png', 'image_10.png', 'image_11.png', 'image_12.png'];
const GIANT_ROCK_STONE_FRAMES = ['image_13.png', 'image_14.png'];
const GIANT_ROCK_DIE_FRAMES = ['image_15.png', 'image_16.png', 'image_17.png'];
const GIANT_ROCK_ROCK_FALL_FRAMES = ['image_18.png'];
const PLANT_MOVE_FRAMES = ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'];
const PLANT_SUMMON_FRAMES = ['image_5.png', 'image_6.png', 'image_7.png', 'image_8.png'];
const PLANT_ATTACK_FRAMES = ['image_9.png', 'image_10.png', 'image_11.png', 'image_12.png'];
const PLANT_DIE_FRAMES = ['image_13.png', 'image_14.png', 'image_15.png'];
const PLANT_SUMMON_MELEE_FRAMES = ['image_16.png', 'image_17.png', 'image_18.png', 'image_19.png'];
const PLANT_SUMMON_RANGED_FRAMES = ['image_20.png', 'image_21.png', 'image_22.png'];
const BLACK_WIDOW_MOVE_FRAMES = ['image.png', 'image_2.png', 'image_3.png', 'image_4.png'];
const BLACK_WIDOW_JUMP_FRAMES = ['image_5.png', 'image_6.png', 'image_7.png'];
const BLACK_WIDOW_FALL_FRAMES = ['image_8.png', 'image_9.png', 'image_10.png'];
const BLACK_WIDOW_HAND_ATTACK_FRAMES = ['image_11.png', 'image_12.png', 'image_13.png'];
const BLACK_WIDOW_WINDUP_FRAMES = ['image_14.png', 'image_15.png'];
const BLACK_WIDOW_SHIELD_FRAMES = ['image_16.png'];
const BLACK_WIDOW_SUMMON_FRAMES = ['image_17.png'];
const BLACK_WIDOW_DIE_FRAMES = ['image_18.png', 'image_19.png', 'image_20.png', 'image_21.png'];
const BLACK_WIDOW_IDLE_FRAMES = ['image_22.png', 'image_23.png', 'image_24.png'];

const ENEMY_ASSET_ENTRIES = {
    skeleton: buildEnemyAtlasEntry('skeleton'),
    succubus: buildEnemyAtlasEntry('succubus'),
    lamia: buildEnemyAtlasEntry('lamia'),
    firer: buildEnemyAtlasEntry('firer'),
    ailen: buildEnemyAtlasEntry('ailen'),
    moth_woman: buildEnemyAtlasEntry('moth_woman'),
    medusa: buildEnemyAtlasEntry('medusa'),
    minotau: buildEnemyAtlasEntry('minotau'),
    baphomet: buildEnemyAtlasEntry('baphomet'),
    dino: buildEnemyAtlasEntry('dino'),
    bugmonster: buildEnemyAtlasEntry('bugmonster'),
    cursed_maiden: buildEnemyAtlasEntry('cursed_maiden'),
    kitsume: buildEnemyAtlasEntry('kitsume'),
    mummy: buildEnemyAtlasEntry('mummy'),
    zombie_woman: buildEnemyAtlasEntry('zombie_woman'),
    slime: buildEnemyAtlasEntry('slime'),
    rat: buildEnemyAtlasEntry('rat'),
    bat: buildEnemyAtlasEntry('bat'),
    demonbat: buildEnemyAtlasEntry('demonbat'),
    eyes: buildEnemyAtlasEntry('eyes'),
    worm: buildEnemyAtlasEntry('worm'),
    widow: buildEnemyAtlasEntry('widow'),
    bomber: buildEnemyAtlasEntry('bomber'),
    lava_monster: buildEnemyAtlasEntry('lava_monster', { directory: 'lava_monster' }),
    giant_rock: {
        atlas: {
            key: 'giant_rock_atlas',
            texture: 'assets/finalBoss/giain_rock/spritesheet.png',
            atlasJSON: 'assets/finalBoss/giain_rock/spritesheet.json'
        },
        animations: {
            move: { frames: GIANT_ROCK_MOVE_FRAMES, frameRate: 3, loop: true },
            jump: { frames: GIANT_ROCK_JUMP_FRAMES, frameRate: 5, loop: false },
            attack: { frames: GIANT_ROCK_ATTACK_FRAMES, frameRate: 5, loop: false },
            stone: { frames: GIANT_ROCK_STONE_FRAMES, frameRate: 5, loop: false },
            rock_fall: { frames: GIANT_ROCK_ROCK_FALL_FRAMES, frameRate: 1, loop: false },
            die: { frames: GIANT_ROCK_DIE_FRAMES, frameRate: 3, loop: false }
        }
    },
    plant: {
        atlas: {
            key: 'plant_atlas',
            texture: 'assets/finalBoss/plant/spritesheet.png',
            atlasJSON: 'assets/finalBoss/plant/spritesheet.json'
        },
        animations: {
            move: { frames: PLANT_MOVE_FRAMES, frameRate: 4, loop: true },
            summon: { frames: PLANT_SUMMON_FRAMES, frameRate: 5, loop: false },
            attack: { frames: PLANT_ATTACK_FRAMES, frameRate: 5, loop: false },
            die: { frames: PLANT_DIE_FRAMES, frameRate: 3, loop: false },
            summon_melee: { frames: PLANT_SUMMON_MELEE_FRAMES, frameRate: 5, loop: false },
            summon_ranged: { frames: PLANT_SUMMON_RANGED_FRAMES, frameRate: 5, loop: false }
        }
    },
    black_widow: {
        atlas: {
            key: 'black_widow_atlas',
            texture: 'assets/finalBoss/black_widow/spritesheet.png',
            atlasJSON: 'assets/finalBoss/black_widow/spritesheet.json'
        },
        animations: {
            idle: { frames: BLACK_WIDOW_IDLE_FRAMES, frameRate: 4, loop: true },
            move: { frames: BLACK_WIDOW_MOVE_FRAMES, frameRate: 5, loop: true },
            jump: { frames: BLACK_WIDOW_JUMP_FRAMES, frameRate: 6, loop: false },
            fall: { frames: BLACK_WIDOW_FALL_FRAMES, frameRate: 8, loop: false },
            hand_attack: { frames: BLACK_WIDOW_HAND_ATTACK_FRAMES, frameRate: 7, loop: false },
            windup: { frames: BLACK_WIDOW_WINDUP_FRAMES, frameRate: 6, loop: false },
            shield: { frames: BLACK_WIDOW_SHIELD_FRAMES, frameRate: 1, loop: true },
            summon: { frames: BLACK_WIDOW_SUMMON_FRAMES, frameRate: 1, loop: false },
            die: { frames: BLACK_WIDOW_DIE_FRAMES, frameRate: 4, loop: false }
        }
    },
    plant_melee_minion: {
        atlas: {
            key: 'plant_atlas',
            texture: 'assets/finalBoss/plant/spritesheet.png',
            atlasJSON: 'assets/finalBoss/plant/spritesheet.json'
        },
        animations: {
            move: { frames: PLANT_SUMMON_MELEE_FRAMES, frameRate: 5, loop: true }
        }
    },
    plant_ranged_minion: {
        atlas: {
            key: 'plant_atlas',
            texture: 'assets/finalBoss/plant/spritesheet.png',
            atlasJSON: 'assets/finalBoss/plant/spritesheet.json'
        },
        animations: {
            move: { frames: PLANT_SUMMON_RANGED_FRAMES, frameRate: 5, loop: true }
        }
    },
    plant_vine: {
        image: {
            key: 'plant_vine',
            path: 'assets/finalBoss/plant/vine.png'
        },
        animations: {}
    }
};

function buildEnemyAtlasEntry(key, options = {}) {
    const directory = options.directory ?? key;
    const fileName = options.fileName ?? key;
    const atlasKey = `${key}_atlas`;
    return {
        atlas: {
            key: atlasKey,
            texture: `assets/enemy/${directory}/${fileName}.png`,
            atlasJSON: `assets/enemy/${directory}/${fileName}.json`
        },
        animations: {
            move: { frames: ENEMY_MOVE_FRAMES, frameRate: 6, loop: true }
        }
    };
}

export const ASSET_CONFIG = {
    ...CHARACTER_ASSET_ENTRIES,
    ...ENEMY_ASSET_ENTRIES
};

export const ENTITY_SIZE_CONFIG = {
    ...CHARACTER_SIZE_ENTRIES
};

export const CHARACTER_ASSET_CONFIG = CHARACTER_ASSET_ENTRIES;
