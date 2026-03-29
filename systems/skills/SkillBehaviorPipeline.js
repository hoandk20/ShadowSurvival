import SkillEffectRunner from './SkillEffectRunner.js';
import directHitBehavior from './behaviors/directHitBehavior.js';
import stunOnHitBehavior from './behaviors/stunOnHitBehavior.js';
import explosionOnHitBehavior from './behaviors/explosionOnHitBehavior.js';
import projectileResolutionBehavior from './behaviors/projectileResolutionBehavior.js';

const BEHAVIOR_MAP = {
    directHit: directHitBehavior,
    stunOnHit: stunOnHitBehavior,
    explosionOnHit: explosionOnHitBehavior,
    projectileResolution: projectileResolutionBehavior
};

export default class SkillBehaviorPipeline {
    constructor(scene) {
        this.scene = scene;
        this.effects = new SkillEffectRunner(scene);
    }

    processHit(skill, target) {
        if (!skill || !target) return null;

        const context = {
            scene: this.scene,
            skill,
            target,
            impact: {
                x: target.x,
                y: target.y
            },
            effects: this.effects,
            directHit: null,
            hitResolved: false,
            stopProcessing: false,
            projectileResolution: null
        };

        const behaviorEntries = Array.isArray(skill.behaviorEntries) ? skill.behaviorEntries : [];
        for (const entry of behaviorEntries) {
            if (context.stopProcessing) break;
            const handler = BEHAVIOR_MAP[entry?.type];
            if (typeof handler !== 'function') continue;
            handler(context, entry);
        }

        return context;
    }
}
