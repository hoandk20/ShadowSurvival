import DamageText from '../../entities/DamageText.js';
import ExplosionEffect from '../../entities/effects/ExplosionEffect.js';
import AshDissolveEffect from '../../entities/effects/AshDissolveEffect.js';
import ChainLightningEffect from '../../entities/effects/ChainLightningEffect.js';
import { getDamageNumbersMode, getDamageTextCapMode } from '../../utils/gameplaySettings.js';

export default class SkillEffectRunner {
    constructor(scene) {
        this.scene = scene;
        this.explosionEffect = new ExplosionEffect(scene);
        this.ashDissolveEffect = new AshDissolveEffect(scene);
        this.chainLightningEffect = new ChainLightningEffect(scene);
    }

    showDamageText(target, value, options = {}) {
        if (!target) return null;
        const mode = getDamageNumbersMode(this.scene);
        if (mode === 'off') return null;
        // reduced mode still uses the same cap/merge system; callers can further lower frequency separately.
        const capMode = getDamageTextCapMode(this.scene);
        return DamageText.createOrMerge(
            this.scene,
            target.x,
            target.y - (target.body?.height ?? 20),
            value,
            { capMode, ...options }
        );
    }

    showDamageTextAt(x, y, value, options = {}) {
        const mode = getDamageNumbersMode(this.scene);
        if (mode === 'off') return null;
        const capMode = getDamageTextCapMode(this.scene);
        return DamageText.createOrMerge(this.scene, x, y, value, { capMode, ...options });
    }

    spawnExplosion(x, y, depth = 40, options = {}) {
        this.explosionEffect?.spawn(x, y, depth, { alphaMultiplier: 0.6, ...options });
    }

    spawnAshDissolve(target, depth = 40, options = {}) {
        this.ashDissolveEffect?.spawn(target, depth, { alphaMultiplier: 0.6, ...options });
    }

    spawnChainLightning(fromPoint, toPoint, depth = 40, options = {}) {
        this.chainLightningEffect?.spawn(fromPoint, toPoint, depth, { alphaMultiplier: 0.6, ...options });
    }
}
