export default function directHitBehavior(context) {
    const { skill, target, effects } = context;
    if (!skill?.active || !target?.takeDamage) {
        context.stopProcessing = true;
        return;
    }

    const force = skill.config?.knockback ?? 0;
    const limit = skill.numberKnockback ?? skill.config?.numberKnockback ?? Infinity;
    const currentHits = skill.knockbackCount ?? 0;
    if (currentHits >= limit) {
        context.stopProcessing = true;
        return;
    }

    skill.knockbackCount = currentHits + 1;
    const direction = new Phaser.Math.Vector2(target.x - skill.x, target.y - skill.y);
    if (direction.lengthSq() === 0) direction.set(1, 0);
    direction.normalize();

    const roll = skill.rollCriticalDamage();
    skill.damage = roll.value;
    target.takeDamage(roll.value, force, direction, skill, { damageSource: skill }, skill.config);

    effects.showDamageText(target, roll.value, {
        color: roll.isCritical ? (skill.critColor ?? '#ffde59') : '#ffde59',
        fontSize: '7px'
    });

    context.directHit = {
        roll,
        force,
        direction
    };
    context.hitResolved = true;
}
