export const DAMAGE_VARIANCE_RATIO = 0.1;

export function applyDamageVariance(baseDamage, varianceRatio = DAMAGE_VARIANCE_RATIO) {
    const normalizedDamage = Math.max(0, Number(baseDamage) || 0);
    if (normalizedDamage <= 0) return 0;
    const normalizedRatio = Math.max(0, Number(varianceRatio) || 0);
    const minMultiplier = Math.max(0, 1 - normalizedRatio);
    const maxMultiplier = 1 + normalizedRatio;
    const multiplier = Phaser.Math.FloatBetween(minMultiplier, maxMultiplier);
    return Math.max(1, Math.round(normalizedDamage * multiplier));
}
