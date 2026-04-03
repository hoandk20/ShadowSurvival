// utils/animationSystem.js
import { ASSET_CONFIG } from '../config/assets.js';
import { SKILL_CONFIG } from '../config/skill.js';
import { ITEM_CONFIG } from '../config/items.js';
import { SUPPORTER_CONFIG } from '../config/supporters.js';
import { SHOP_ITEM_CONFIG } from '../config/shopItems.js';

const MISSING_TEXTURE_KEY = '__missing_texture__';
const AUDIO_ASSET_CONFIG = {
    sfx_coin: 'assets/audio/coin.mp3',
    sfx_enemy_kill: 'assets/audio/enemies-kill.mp3',
    sfx_levelup: 'assets/audio/levelup.mp3'
};
const STATUS_EFFECT_ATLAS = {
    key: 'status_effect_icons',
    texture: 'assets/statuseffect/spritesheet.png',
    atlasJSON: 'assets/statuseffect/spritesheet.json'
};

const buildAtlasFrames = (scene, atlasKey, frameNames = []) => {
    if (!scene.textures.exists(atlasKey)) return [];
    const texture = scene.textures.get(atlasKey);
    return (frameNames ?? [])
        .filter((frameName) => texture.has(frameName))
        .map((frameName) => ({ key: atlasKey, frame: frameName }));
};

export function preloadAllAssets(scene) {
    // Tạo texture placeholder cho frame thiếu
    if (!scene.textures.exists(MISSING_TEXTURE_KEY)) {
        const size = 32;
        const canvas = scene.textures.createCanvas(MISSING_TEXTURE_KEY, size, size);
        canvas.context.fillStyle = '#ff00ff';
        canvas.context.fillRect(0, 0, size, size);
        canvas.refresh();
    }

    scene.load.on('loaderror', (file) => {
        console.warn(`Asset not found: ${file.src}, key=${file.key}. Will use placeholder.`);
        // Không cần điều gì thêm ở đây; placeholder sẽ được xử lý trong createAllAnimations
    });

    // Load entity assets (per-frame)
    for (const entityType in ASSET_CONFIG) {
        const entityConfig = ASSET_CONFIG[entityType];
        if (entityConfig.atlas) {
            const atlas = entityConfig.atlas;
            scene.load.atlas(atlas.key, atlas.texture, atlas.atlasJSON);
        } else if (entityConfig.spritesheet) {
            const sheet = entityConfig.spritesheet;
            scene.load.spritesheet(sheet.key, sheet.path, {
                frameWidth: sheet.frameWidth,
                frameHeight: sheet.frameHeight
            });
        } else {
            for (const animName in entityConfig.animations) {
                const animConfig = entityConfig.animations[animName];
                const folderPath = entityConfig.basePath + animConfig.folder;
                animConfig.frames.forEach((frameFile, index) => {
                    const key = `${entityType}_${animName}_${index}`;
                    const path = folderPath + frameFile;
                    scene.load.image(key, path);
                });
            }
        }
    }

    // Load skill assets (per-frame or spritesheet)
    for (const skillType in SKILL_CONFIG) {
        const skillConfig = SKILL_CONFIG[skillType];
        if (skillConfig.atlas) {
            const atlas = skillConfig.atlas;
            scene.load.atlas(atlas.key, atlas.texture, atlas.atlasJSON);
        }
        for (const animName in skillConfig.animations) {
            const animConfig = skillConfig.animations[animName];
            if (skillConfig.atlas && animConfig.frames && Array.isArray(animConfig.frames)) {
                continue;
            }
            if (animConfig.frames && Array.isArray(animConfig.frames)) {
                const basePath = skillConfig.basePath || '';
                animConfig.frames.forEach((frameFile, index) => {
                    const key = `${skillType}_${animName}_${index}`;
                    const path = basePath + frameFile;
                    scene.load.image(key, path);
                });
            } else if (animConfig.file) {
                const key = `${skillType}_${animName}`;
                const path = skillConfig.basePath + animConfig.file;
                scene.load.spritesheet(key, path, {
                    frameWidth: animConfig.frameWidth,
                    frameHeight: animConfig.frameHeight
                });
            }
        }
    }

    for (const supporterKey in SUPPORTER_CONFIG) {
        const supporterConfig = SUPPORTER_CONFIG[supporterKey];
        const atlas = supporterConfig?.atlas;
        if (atlas && !scene.textures.exists(atlas.key)) {
            scene.load.atlas(atlas.key, atlas.texture, atlas.atlasJSON);
        }
    }

    for (const itemKey in ITEM_CONFIG) {
        const config = ITEM_CONFIG[itemKey];
        const key = config.textureKey ?? itemKey;
        if (!config.assetPath || !key) continue;
        if (scene.textures.exists(key)) continue;
        scene.load.image(key, config.assetPath);
    }

    for (const shopItem of SHOP_ITEM_CONFIG) {
        const key = shopItem.iconKey ?? null;
        if (!shopItem.assetPath || !key) continue;
        if (scene.textures.exists(key)) continue;
        scene.load.image(key, shopItem.assetPath);
    }

    for (const [key, path] of Object.entries(AUDIO_ASSET_CONFIG)) {
        if (scene.cache.audio.exists(key)) continue;
        scene.load.audio(key, path);
    }

    if (!scene.textures.exists(STATUS_EFFECT_ATLAS.key)) {
        scene.load.atlas(STATUS_EFFECT_ATLAS.key, STATUS_EFFECT_ATLAS.texture, STATUS_EFFECT_ATLAS.atlasJSON);
    }
}

export function createAllAnimations(scene) {
    // Create entity animations (per-frame)
    for (const entityType in ASSET_CONFIG) {
        const entityConfig = ASSET_CONFIG[entityType];
        const sheetConfig = entityConfig.spritesheet;
        const atlasConfig = entityConfig.atlas;
        for (const animName in entityConfig.animations) {
            const animConfig = entityConfig.animations[animName];
            const animKey = `${entityType}_${animName}`;
            if (scene.anims.exists(animKey)) continue;
            let frames = [];
            if (atlasConfig && animConfig.frames && Array.isArray(animConfig.frames)) {
                if (!scene.textures.exists(atlasConfig.key)) {
                    console.warn(`Atlas ${atlasConfig.key} missing, skipping animation ${animKey}.`);
                    continue;
                }
                frames = buildAtlasFrames(scene, atlasConfig.key, animConfig.frames);
            } else if (sheetConfig && Array.isArray(animConfig.frameIndexes)) {
                if (!scene.textures.exists(sheetConfig.key)) {
                    console.warn(`Spritesheet ${sheetConfig.key} missing, skipping animation ${animKey}.`);
                    continue;
                }
                frames = animConfig.frameIndexes.map(frame => ({ key: sheetConfig.key, frame }));
            } else if (animConfig.frames && Array.isArray(animConfig.frames)) {
                frames = animConfig.frames.map((_, index) => {
                    const frameKey = `${entityType}_${animName}_${index}`;
                    const keyToUse = scene.textures.exists(frameKey) ? frameKey : MISSING_TEXTURE_KEY;
                    if (keyToUse === MISSING_TEXTURE_KEY) {
                        console.warn(`Missing frame ${frameKey}, using placeholder.`);
                    }
                    return { key: keyToUse };
                });
            }
            if (!frames.length) continue;
            scene.anims.create({
                key: animKey,
                frames,
                frameRate: animConfig.frameRate,
                repeat: animConfig.loop ? -1 : 0
            });
        }
    }

    // Create skill animations
    for (const skillType in SKILL_CONFIG) {
        const skillConfig = SKILL_CONFIG[skillType];
        const atlasConfig = skillConfig.atlas;
        for (const animName in skillConfig.animations) {
            const animConfig = skillConfig.animations[animName];
            const animKey = `${skillType}_${animName}`;
            if (scene.anims.exists(animKey)) continue;

            if (atlasConfig && animConfig.frames && Array.isArray(animConfig.frames)) {
                if (!scene.textures.exists(atlasConfig.key)) {
                    console.warn(`Skill atlas ${atlasConfig.key} missing, skipping animation ${animKey}.`);
                    continue;
                }
                const frames = buildAtlasFrames(scene, atlasConfig.key, animConfig.frames);
                if (!frames.length) continue;
                scene.anims.create({
                    key: animKey,
                    frames,
                    frameRate: animConfig.frameRate,
                    repeat: animConfig.loop ? -1 : 0
                });
            } else if (animConfig.frames && Array.isArray(animConfig.frames)) {
                const frames = animConfig.frames.map((_, index) => {
                    const frameKey = `${skillType}_${animName}_${index}`;
                    const keyToUse = scene.textures.exists(frameKey) ? frameKey : MISSING_TEXTURE_KEY;
                    if (keyToUse === MISSING_TEXTURE_KEY) {
                        console.warn(`Missing skill frame ${frameKey}, using placeholder.`);
                    }
                    return { key: keyToUse };
                });

                scene.anims.create({
                    key: animKey,
                    frames,
                    frameRate: animConfig.frameRate,
                    repeat: animConfig.loop ? -1 : 0
                });
            } else if (animConfig.file) {
                scene.anims.create({
                    key: animKey,
                    frames: scene.anims.generateFrameNumbers(animKey, {
                        start: animConfig.start,
                        end: animConfig.end
                    }),
                    frameRate: animConfig.frameRate,
                    repeat: animConfig.loop ? -1 : 0
                });
            }
        }
    }

    for (const supporterKey in SUPPORTER_CONFIG) {
        const supporterConfig = SUPPORTER_CONFIG[supporterKey];
        const atlasConfig = supporterConfig?.atlas;
        if (!atlasConfig) continue;
        const animations = supporterConfig?.animations ?? {};
        for (const animName in animations) {
            const animConfig = animations[animName];
            const animKey = `supporter_${supporterKey}_${animName}`;
            if (scene.anims.exists(animKey)) continue;
            if (!scene.textures.exists(atlasConfig.key)) continue;
            const frames = buildAtlasFrames(scene, atlasConfig.key, animConfig.frames ?? []);
            if (!frames.length) continue;
            scene.anims.create({
                key: animKey,
                frames,
                frameRate: animConfig.frameRate ?? 6,
                repeat: animConfig.loop ? -1 : 0
            });
        }
    }
}
