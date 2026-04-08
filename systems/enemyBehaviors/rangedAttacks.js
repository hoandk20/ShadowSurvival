// systems/enemyBehaviors/rangedAttacks.js
//
// Extracted ranged attack logic from Enemy.js to keep the entity class lean.

export function tryRangedAttack(enemy, targetPlayer, time) {
    if (!enemy?.active || !targetPlayer?.active || targetPlayer?.isDead) return false;
    if ((time - enemy.lastRangedAttackTime) < enemy.attackCooldown) return false;
    const dx = targetPlayer.x - enemy.x;
    const dy = targetPlayer.y - enemy.y;
    const preferredRange = Math.max(0, enemy.rangedAttackConfig?.preferredRange ?? 0);
    const attackDistance = Math.max(enemy.attackRange ?? 0, preferredRange + 20, 40);
    if ((dx * dx) + (dy * dy) > attackDistance * attackDistance) return false;
    enemy.lastRangedAttackTime = time;
    enemy.playAttackSquashBounce?.();

    switch (enemy.attackStyle) {
        case 'projectile_burst':
            performBurstRangedAttack(enemy, targetPlayer);
            return true;
        case 'trap_poison_cloud':
            performPoisonTrapAttack(enemy, targetPlayer);
            return true;
        case 'projectile_sniper':
            enemy.beginSniperAttack?.(targetPlayer);
            return true;
        case 'trap_burn_cloud':
            performBurnTrapAttack(enemy, targetPlayer);
            return true;
        default:
            enemy.scene?.spawnEnemyProjectile?.(enemy, targetPlayer, {
                damage: enemy.damage ?? 10,
                speed: enemy.rangedAttackConfig?.projectileSpeed ?? 230,
                radius: enemy.rangedAttackConfig?.projectileRadius ?? 5,
                lifetimeMs: enemy.rangedAttackConfig?.projectileLifetimeMs ?? 1400,
                color: enemy.rangedAttackConfig?.projectileColor ?? 0xff7cba,
                glowColor: enemy.rangedAttackConfig?.projectileGlowColor ?? 0xffd5ee
            });
            return true;
    }
}

export function performBurstRangedAttack(enemy, targetPlayer) {
    const burstCount = Math.max(2, Math.round(enemy.rangedAttackConfig?.burstCount ?? 3));
    const burstSpreadDeg = Math.max(0, Number(enemy.rangedAttackConfig?.burstSpreadDeg ?? 18) || 18);
    const baseAngle = Math.atan2(targetPlayer.y - enemy.y, targetPlayer.x - enemy.x);
    const spreadRad = Phaser.Math.DegToRad(burstSpreadDeg);
    const step = burstCount > 1 ? spreadRad / (burstCount - 1) : 0;
    for (let index = 0; index < burstCount; index += 1) {
        const angleOffset = burstCount > 1 ? (-spreadRad * 0.5) + (step * index) : 0;
        const projectileAngle = baseAngle + angleOffset;
        enemy.scene?.spawnEnemyProjectileDirection?.(
            enemy,
            enemy.x,
            enemy.y,
            Math.cos(projectileAngle),
            Math.sin(projectileAngle),
            {
                damage: enemy.damage ?? 10,
                speed: enemy.rangedAttackConfig?.projectileSpeed ?? 230,
                radius: enemy.rangedAttackConfig?.projectileRadius ?? 5,
                lifetimeMs: enemy.rangedAttackConfig?.projectileLifetimeMs ?? 1400,
                color: enemy.rangedAttackConfig?.projectileColor ?? 0xff7cba,
                glowColor: enemy.rangedAttackConfig?.projectileGlowColor ?? 0xffd5ee
            }
        );
    }
}

export function performPoisonTrapAttack(enemy, targetPlayer) {
    enemy.scene?.statusEffectSystem?.spawnPoisonCloud?.(enemy, {
        x: targetPlayer.x,
        y: targetPlayer.y,
        radius: enemy.rangedAttackConfig?.cloudRadius ?? 56,
        durationMs: enemy.rangedAttackConfig?.cloudDurationMs ?? 2200,
        tickIntervalMs: enemy.rangedAttackConfig?.cloudTickIntervalMs ?? 450,
        poisonDurationMs: enemy.rangedAttackConfig?.poisonDurationMs ?? 2500,
        damage: enemy.rangedAttackConfig?.cloudDamage ?? 0,
        source: enemy,
        targetMode: 'opponents',
        tags: enemy.rangedAttackConfig?.cloudTags ?? ['poison', 'cloud', 'enemy_trap'],
        showDamageText: true
    });
}

export function performBurnTrapAttack(enemy, targetPlayer) {
    enemy.scene?.statusEffectSystem?.spawnBurnCloud?.(enemy, {
        x: targetPlayer.x,
        y: targetPlayer.y,
        radius: enemy.rangedAttackConfig?.fireRadius ?? 56,
        durationMs: enemy.rangedAttackConfig?.fireDurationMs ?? 1800,
        tickIntervalMs: enemy.rangedAttackConfig?.fireTickIntervalMs ?? 450,
        burnDurationMs: enemy.rangedAttackConfig?.burnDurationMs ?? 2500,
        damage: enemy.rangedAttackConfig?.fireDamage ?? 0,
        source: enemy,
        targetMode: 'opponents',
        tags: enemy.rangedAttackConfig?.fireTags ?? ['fire', 'burn', 'enemy_trap'],
        showDamageText: true
    });
}

