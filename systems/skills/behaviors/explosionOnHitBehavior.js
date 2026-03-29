function resolveTintText(tintSource) {
    if (typeof tintSource === 'string') return tintSource;
    return Phaser.Display.Color.IntegerToColor(tintSource ?? 0xff8c42).rgba;
}

export default function explosionOnHitBehavior(context, entry = {}) {
    const { skill, target, scene, effects, impact } = context;
    if (!context.directHit || !skill?.active || skill.hasExploded) return;

    const behaviorConfig = entry.config ?? {};
    const radius = behaviorConfig.radius ?? skill.explosionRadius ?? 0;
    if (radius <= 0) return;

    skill.hasExploded = true;
    const tintText = resolveTintText(
        behaviorConfig.tint ?? skill.config?.explosionTint ?? skill.critColor ?? '#ff8c42'
    );

    effects.spawnExplosion(impact.x, impact.y, (skill.depth ?? 30) + 4);

    const damageMultiplier = behaviorConfig.damageMultiplier ?? skill.explosionDamageMultiplier ?? 1;
    const knockbackMultiplier = behaviorConfig.knockbackMultiplier ?? skill.explosionKnockbackMultiplier ?? 1;
    const explosionDamage = Math.max(1, Math.round(context.directHit.roll.value * damageMultiplier));
    const explosionForce = Math.max(0, Math.round((skill.config?.knockback ?? 0) * knockbackMultiplier));
    const radiusSq = radius * radius;
    const splashTargets = scene.enemies.getChildren?.() ?? [];

    for (const enemy of splashTargets) {
        if (!enemy?.active || enemy.isDead || enemy === target) continue;
        const dx = enemy.x - impact.x;
        const dy = enemy.y - impact.y;
        const distanceSq = (dx * dx) + (dy * dy);
        if (distanceSq > radiusSq) continue;

        const direction = new Phaser.Math.Vector2(dx, dy);
        if (direction.lengthSq() === 0) {
            direction.set(1, 0);
        } else {
            direction.normalize();
        }

        enemy.takeDamage(
            explosionDamage,
            explosionForce,
            direction,
            skill,
            { damageSource: skill, fromExplosion: true },
            {
                ...skill.config,
                knockbackTakeDamage: false,
                knockback: explosionForce
            }
        );

        effects.showDamageText(enemy, explosionDamage, {
            color: tintText,
            fontSize: '7px'
        });
    }
}
