// utils/animationSystem.js
import { ANIMATION_CONFIG } from '../config/animationConfig.js';

export function createAllAnimations(scene) {
    for (const type in ANIMATION_CONFIG) {
        const anims = ANIMATION_CONFIG[type];
        for (const state in anims) {
            const config = anims[state];
            const key = `${type}_${state}`;
            if (!scene.anims.exists(key)) {
                scene.anims.create({
                    key: key,
                    frames: scene.anims.generateFrameNumbers(type, { frames: config.frames }),
                    frameRate: config.frameRate,
                    repeat: config.loop ? -1 : 0
                });
            }
        }
    }
}