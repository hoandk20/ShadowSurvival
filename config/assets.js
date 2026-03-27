// config/assets.js
import { CHARACTER_CONFIG } from './characters/characters.js';

const buildCharacterAssetEntries = () => {
    const entries = {};
    for (const characterKey in CHARACTER_CONFIG) {
        const character = CHARACTER_CONFIG[characterKey];
        const assetKey = character.assetKey ?? characterKey;
        entries[assetKey] = {
            basePath: character.basePath,
            animations: character.animations
        };
        if (character.atlas) {
            entries[assetKey].atlas = character.atlas;
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

const ENEMY_ASSET_ENTRIES = {
    succubus: buildEnemyAtlasEntry('succubus'),
    harpy: buildEnemyAtlasEntry('harpy'),
    skeleton: buildEnemyAtlasEntry('skeleton'),
    moth_woman: buildEnemyAtlasEntry('moth_woman'),
    siren: buildEnemyAtlasEntry('siren'),
    medusa: buildEnemyAtlasEntry('medusa'),
    cursed_maiden: buildEnemyAtlasEntry('cursed_maiden'),
    kitsume: buildEnemyAtlasEntry('kitsume'),
    mummy: buildEnemyAtlasEntry('mummy'),
    zombie_woman: buildEnemyAtlasEntry('zombie_woman'),
    slime: buildEnemyAtlasEntry('slime'),
    rat: buildEnemyAtlasEntry('rat'),
    bat: buildEnemyAtlasEntry('bat'),
    worm: buildEnemyAtlasEntry('worm'),
    widow: buildEnemyAtlasEntry('widow')
};

function buildEnemyAtlasEntry(key) {
    const atlasKey = `${key}_atlas`;
    return {
        atlas: {
            key: atlasKey,
            texture: `assets/enemy/${key}/${key}.png`,
            atlasJSON: `assets/enemy/${key}/${key}.json`
        },
        animations: {
            move: { frames: ['frame0.png', 'frame1.png', 'frame2.png', 'frame3.png'], frameRate: 6, loop: true }
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
