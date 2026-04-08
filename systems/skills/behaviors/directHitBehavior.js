function triggerOnHitExplosion(context, hitEvent = {}) {
    const { skill, scene, effects } = context;
    const radius = Math.max(0, Math.round(skill.config?.onHitExplosionRadius ?? 0));
    const damageRatio = Math.max(0, Number(skill.config?.onHitExplosionDamageRatio ?? 0) || 0);
    if (radius <= 0 || damageRatio <= 0 || !scene?.statusEffectSystem) return;

    const centerX = hitEvent.target?.x ?? skill.x;
    const centerY = hitEvent.target?.y ?? skill.y;
    const tint = skill.config?.onHitExplosionTint ?? '#ff9a4d';
    const explosionDamage = Math.max(1, Math.round((skill.baseDamage ?? hitEvent.damage ?? 1) * damageRatio));
    const radiusSq = radius * radius;
    const targets = scene.enemies?.getChildren?.() ?? [];
    const attackTags = Array.from(new Set([...(hitEvent.attackTags ?? []), 'explosion', 'fire']));

    effects?.spawnExplosion?.(centerX, centerY, (hitEvent.target?.depth ?? skill.depth ?? 20) + 4, {
        outerColor: Phaser.Display.Color.HexStringToColor(tint).color
    });

    targets.forEach((enemy) => {
        if (!enemy?.active || enemy.isDead) return;
        if (enemy === hitEvent.target) return;
        const dx = enemy.x - centerX;
        const dy = enemy.y - centerY;
        if ((dx * dx) + (dy * dy) > radiusSq) return;
        scene.statusEffectSystem.applyOwnedDamage(enemy, explosionDamage, {
            source: skill,
            sourceOwner: skill.owner ?? null,
            ownerPlayerId: skill.ownerPlayerId ?? null,
            ownerSkillKey: skill.skillType,
            tags: attackTags,
            showDamageText: true,
            damageTextColor: tint,
            damageTextFontSize: '7px'
        });
    });
}

function getDetentionMarkEffect(skill, target) {
    const detentionConfig = skill?.config?.detentionMark;
    const markKey = detentionConfig?.markEffectKey ?? 'mark';
    const markEffects = target?.statusEffects?.getEffects?.(markKey) ?? [];
    return markEffects.find((effect) => (
        (effect?.ownerPlayerId ?? null) === (skill?.ownerPlayerId ?? null)
        && Array.isArray(effect?.tags)
        && effect.tags.includes('detention')
    )) ?? null;
}

function triggerDetentionMark(context, hitEvent = {}) {
    const { skill, scene, effects } = context;
    const detentionConfig = skill?.config?.detentionMark ?? null;
    if (!detentionConfig?.enabled || !scene?.statusEffectSystem) return false;
    const target = hitEvent.target ?? null;
    const existingMarkEffect = getDetentionMarkEffect(skill, target);
    if (!existingMarkEffect) return false;

    const centerX = target?.x ?? skill.x;
    const centerY = target?.y ?? skill.y;
    const radius = Math.max(0, Math.round(detentionConfig.explosionRadius ?? 0));
    const damageRatio = Math.max(0, Number(detentionConfig.explosionDamageRatio ?? 0) || 0);
    const tint = detentionConfig.explosionTint ?? '#ff9a4d';

    if (radius > 0 && damageRatio > 0) {
        const radiusSq = radius * radius;
        const explosionDamage = Math.max(1, Math.round((skill.baseDamage ?? hitEvent.damage ?? 1) * damageRatio));
        const targets = scene.enemies?.getChildren?.() ?? [];
        const attackTags = Array.from(new Set([...(hitEvent.attackTags ?? []), 'explosion', 'detention']));
        effects?.spawnExplosion?.(centerX, centerY, (target?.depth ?? skill.depth ?? 20) + 4, {
            outerColor: Phaser.Display.Color.HexStringToColor(tint).color
        });
        targets.forEach((enemy) => {
            if (!enemy?.active || enemy.isDead || enemy === target) return;
            const dx = enemy.x - centerX;
            const dy = enemy.y - centerY;
            if ((dx * dx) + (dy * dy) > radiusSq) return;
            scene.statusEffectSystem.applyOwnedDamage(enemy, explosionDamage, {
                source: skill,
                sourceOwner: skill.owner ?? null,
                ownerPlayerId: skill.ownerPlayerId ?? null,
                ownerSkillKey: skill.skillType,
                tags: attackTags,
                showDamageText: true,
                damageTextColor: tint,
                damageTextFontSize: '7px'
            });
        });
    }

    scene.statusEffectSystem.applyEffect(target, 'root', {
        durationMs: Math.max(100, Math.round(detentionConfig.rootDurationMs ?? 550)),
        ownerPlayerId: skill.ownerPlayerId ?? null,
        source: skill,
        tags: ['root', 'detention']
    });
    target?.statusEffects?.removeEffects?.(detentionConfig.markEffectKey ?? 'mark');
    return true;
}

function filterDetentionMarkEntries(statusEntries = [], skill, detentionTriggered) {
    if (!detentionTriggered) return statusEntries;
    const markKey = skill?.config?.detentionMark?.markEffectKey ?? 'mark';
    return (Array.isArray(statusEntries) ? statusEntries : []).filter(
        (entry) => (entry?.key ?? entry?.effectKey) !== markKey
    );
}

function triggerOnHitBurnCloud(context, hitEvent = {}) {
    const { skill, scene } = context;
    const radius = Math.max(0, Math.round(skill.config?.onHitBurnCloudRadius ?? 0));
    if (radius <= 0 || !scene?.statusEffectSystem?.spawnBurnCloud) return;
    scene.statusEffectSystem.spawnBurnCloud(skill.owner ?? skill, {
        x: hitEvent.target?.x ?? skill.x,
        y: hitEvent.target?.y ?? skill.y,
        radius,
        durationMs: Math.max(100, Math.round(skill.config?.onHitBurnCloudDurationMs ?? 1500)),
        burnDurationMs: Math.max(500, Math.round(skill.config?.onHitBurnDurationMs ?? 2200)),
        damage: 0,
        ownerPlayerId: skill.ownerPlayerId ?? null,
        source: skill,
        targetMode: 'enemies',
        tags: ['fire', 'burn', 'cloud'],
        showDamageText: false
    });
}

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
    const detentionTriggered = triggerDetentionMark(context, hitEvent);
    const primaryStatusEffects = filterDetentionMarkEntries(skill.config?.statusEffects, skill, detentionTriggered);
    const bonusStatusEffects = filterDetentionMarkEntries(skill.config?.bonusStatusEffects, skill, detentionTriggered);
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
    triggerOnHitExplosion(context, hitEvent);
    triggerOnHitBurnCloud(context, hitEvent);
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
