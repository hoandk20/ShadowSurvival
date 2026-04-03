import DamageText from '../../entities/DamageText.js';
import ExplosionEffect from '../../entities/effects/ExplosionEffect.js';
import AshDissolveEffect from '../../entities/effects/AshDissolveEffect.js';
import ChainLightningEffect from '../../entities/effects/ChainLightningEffect.js';

export default class SkillEffectRunner {
    constructor(scene) {
        this.scene = scene;
        this.explosionEffect = new ExplosionEffect(scene);
        this.ashDissolveEffect = new AshDissolveEffect(scene);
        this.chainLightningEffect = new ChainLightningEffect(scene);
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

    spawnExplosion(x, y, depth = 40, options = {}) {
        this.explosionEffect?.spawn(x, y, depth, options);
    }

    spawnAshDissolve(target, depth = 40, options = {}) {
        this.ashDissolveEffect?.spawn(target, depth, options);
    }

    spawnChainLightning(fromPoint, toPoint, depth = 40, options = {}) {
        this.chainLightningEffect?.spawn(fromPoint, toPoint, depth, options);
    }
}
