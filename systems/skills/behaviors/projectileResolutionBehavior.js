export default function projectileResolutionBehavior(context) {
    const { skill, target } = context;
    if (!context.hitResolved || !skill?.active) return;

    const bounced = skill.bounceFromEnemy?.(target) ?? false;
    const retargeted = bounced ? false : (skill.retargetToNextEnemy?.() ?? false);
    context.projectileResolution = { bounced, retargeted };

    if (retargeted) {
        const burst = skill.config?.retargetBurstEffect ?? null;
        if (burst?.enabled !== false) {
            context.effects?.spawnExplosion?.(
                target?.x ?? skill.x,
                target?.y ?? skill.y,
                (target?.depth ?? skill.depth ?? 20) + 3,
                {
                    coreColor: burst?.coreColor ?? 0xf6f5c2,
                    outerColor: burst?.outerColor ?? 0xb7df67,
                    ringColor: burst?.ringColor ?? 0x5f8f2f,
                    emberColor: burst?.emberColor ?? 0xdde99b,
                    coreRadius: burst?.coreRadius ?? 4,
                    outerRadius: burst?.outerRadius ?? 8,
                    ringRadius: burst?.ringRadius ?? 12,
                    emberCount: burst?.emberCount ?? 5,
                    alphaMultiplier: burst?.alphaMultiplier ?? 0.5
                }
            );
        }
    }

    if (skill.config?.destroyOnHit && !bounced && !retargeted) {
        skill.destroy();
    }
}
