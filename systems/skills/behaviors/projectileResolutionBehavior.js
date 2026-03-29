export default function projectileResolutionBehavior(context) {
    const { skill, target } = context;
    if (!context.hitResolved || !skill?.active) return;

    const bounced = skill.bounceFromEnemy?.(target) ?? false;
    const retargeted = bounced ? false : (skill.retargetToNextEnemy?.() ?? false);
    context.projectileResolution = { bounced, retargeted };

    if (skill.config?.destroyOnHit && !bounced && !retargeted) {
        skill.destroy();
    }
}
