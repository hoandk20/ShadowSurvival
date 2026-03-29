import DamageText from '../../entities/DamageText.js';
import ExplosionEffect from '../../entities/effects/ExplosionEffect.js';

export default class SkillEffectRunner {
    constructor(scene) {
        this.scene = scene;
        this.explosionEffect = new ExplosionEffect(scene);
    }

    showDamageText(target, value, options = {}) {
        if (!target) return null;
        return new DamageText(
            this.scene,
            target.x,
            target.y - (target.body?.height ?? 20),
            value,
            options
        );
    }

    showDamageTextAt(x, y, value, options = {}) {
        return new DamageText(this.scene, x, y, value, options);
    }

    spawnExplosion(x, y, depth = 40) {
        this.explosionEffect?.spawn(x, y, depth);
    }
}
