function cloneBehaviorEntry(entry = {}) {
    return {
        ...entry,
        config: entry.config ? { ...entry.config } : {}
    };
}

function buildLegacyBehaviorEntries(config = {}) {
    const entries = [
        { type: 'directHit' }
    ];

    if ((config.stunDuration ?? 0) > 0) {
        entries.push({ type: 'stunOnHit' });
    }

    if (config.explosionOnHit) {
        entries.push({
            type: 'explosionOnHit',
            config: {
                radius: config.explosionRadius,
                damageMultiplier: config.explosionDamageMultiplier,
                knockbackMultiplier: config.explosionKnockbackMultiplier,
                tint: config.explosionTint
            }
        });
    }

    if (config.category === 'projectile') {
        entries.push({ type: 'projectileResolution' });
    }

    return entries;
}

export function resolveSkillBehaviorEntries(config = {}) {
    if (Array.isArray(config.behaviors) && config.behaviors.length) {
        return config.behaviors.map(cloneBehaviorEntry);
    }
    return buildLegacyBehaviorEntries(config);
}
