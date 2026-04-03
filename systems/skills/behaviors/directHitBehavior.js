export default function directHitBehavior(context) {
    const { skill, target, effects, scene } = context;
    if (!skill?.active || !target?.takeDamage) {
        context.stopProcessing = true;
        return;
    }

    const force = skill.knockback ?? skill.config?.knockback ?? 0;
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
    const attackTags = Array.from(new Set([
        ...(Array.isArray(skill.config?.tags) ? skill.config.tags : []),
        skill.skillType,
        'hit'
    ].filter(Boolean)));
    const damageResult = target.takeDamage(
        roll.value,
        force,
        direction,
        skill,
        {
            damageSource: skill,
            attackTags,
            isCritical: roll.isCritical
        },
        skill.config
    ) ?? { healthDamage: roll.value, absorbedDamage: 0, didKill: false };

    effects.showDamageText(target, roll.value, {
        color: roll.isCritical ? (skill.critColor ?? '#ffde59') : '#ffde59',
        fontSize: '7px'
    });
    skill.owner?.spawnMeleeHitEffect?.(target, { direction, skill });

    const hitEvent = {
        target,
        sourceOwner: skill.owner ?? null,
        source: skill,
        ownerPlayerId: skill.ownerPlayerId ?? null,
        attackTags,
        isCritical: roll.isCritical,
        damage: roll.value,
        damageTaken: damageResult.healthDamage ?? roll.value,
        absorbedDamage: damageResult.absorbedDamage ?? 0,
        didKill: Boolean(damageResult.didKill),
        direction,
        force
    };
    const primaryStatusEffects = Array.isArray(skill.config?.statusEffects) ? skill.config.statusEffects : [];
    const bonusStatusEffects = Array.isArray(skill.config?.bonusStatusEffects) ? skill.config.bonusStatusEffects : [];
    scene?.statusEffectSystem?.applyConfiguredEffects?.(primaryStatusEffects, {
        ...hitEvent,
        trigger: 'onHit'
    });
    scene?.statusEffectSystem?.applyConfiguredEffects?.(bonusStatusEffects, {
        ...hitEvent,
        trigger: 'onHit'
    });
    if (roll.isCritical) {
        scene?.statusEffectSystem?.applyConfiguredEffects?.(primaryStatusEffects, {
            ...hitEvent,
            trigger: 'onCrit'
        });
        scene?.statusEffectSystem?.applyConfiguredEffects?.(bonusStatusEffects, {
            ...hitEvent,
            trigger: 'onCrit'
        });
    }
    if (damageResult.didKill) {
        scene?.statusEffectSystem?.applyConfiguredEffects?.(primaryStatusEffects, {
            ...hitEvent,
            trigger: 'onKill'
        });
        scene?.statusEffectSystem?.applyConfiguredEffects?.(bonusStatusEffects, {
            ...hitEvent,
            trigger: 'onKill'
        });
    }
    scene?.statusEffectSystem?.notifyHit?.(hitEvent);

    context.directHit = {
        roll,
        force,
        direction,
        attackTags,
        damageResult,
        hitEvent
    };
    context.hitResolved = true;
}
