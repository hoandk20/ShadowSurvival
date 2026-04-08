// systems/enemyBehaviors/meleeAttack.js
//
// Core melee attack flow (engage delay -> windup -> hit confirm -> recovery).
// Dash-lunge special cases are delegated back to the enemy instance (Enemy owns
// the dash module wrappers + animation helpers).

export function getMeleeAttackDistance(enemy, targetPlayer = null) {
    const playerRadius = Math.max(
        targetPlayer?.hitboxSize?.width ?? 0,
        targetPlayer?.hitboxSize?.height ?? 0,
        targetPlayer?.displayWidth ?? 0,
        targetPlayer?.displayHeight ?? 0,
        18
    ) * 0.35;
    return Math.max(18, (enemy.attackRange ?? 10) + playerRadius + (enemy.meleeAttackConfig?.rangePadding ?? 0));
}

export function getMeleeEngageTargetId(enemy, targetPlayer = null) {
    return targetPlayer?.playerId ?? targetPlayer?.name ?? '__primary_player__';
}

export function resetMeleeEngageDelay(enemy) {
    enemy.meleeEngageStartedAt = -Infinity;
    enemy.meleeEngageTargetId = null;
}

export function hasSatisfiedMeleeEngageDelay(enemy, targetPlayer, time) {
    const targetId = getMeleeEngageTargetId(enemy, targetPlayer);
    const engageDelayMs = Math.max(0, enemy.meleeAttackConfig?.engageDelayMs ?? 0);
    if (enemy.meleeEngageTargetId !== targetId) {
        enemy.meleeEngageTargetId = targetId;
        enemy.meleeEngageStartedAt = time;
        return engageDelayMs <= 0;
    }
    if (!Number.isFinite(enemy.meleeEngageStartedAt)) {
        enemy.meleeEngageStartedAt = time;
        return engageDelayMs <= 0;
    }
    return (time - enemy.meleeEngageStartedAt) >= engageDelayMs;
}

export function tryAttackPlayer(enemy, targetPlayer, time) {
    if (enemy.explodeOnDead?.triggerOnPlayerContact) return false;
    if (enemy.combatType !== 'melee' || !targetPlayer?.active || targetPlayer?.isDead) return false;
    if (enemy.isAttacking) return false;
    if ((time - enemy.lastAttackTime) < enemy.attackCooldown) return false;
    const dx = targetPlayer.x - enemy.x;
    const dy = targetPlayer.y - enemy.y;
    const attackDistance = getMeleeAttackDistance(enemy, targetPlayer);
    if ((dx * dx) + (dy * dy) > attackDistance * attackDistance) return false;

    enemy.lastAttackTime = time;
    enemy.isAttacking = true;
    enemy.playAttackSquashBounce?.();
    resetMeleeEngageDelay(enemy);
    enemy.body?.setVelocity(0, 0);
    enemy.setFlipX(dx < 0);

    if (enemy.isDashLungeStyle?.()) {
        enemy.beginDashWindupAnimation?.();
        enemy.dashAttackTargetPoint = new Phaser.Math.Vector2(targetPlayer.x, targetPlayer.y);
        enemy.spawnDashAttackTelegraph?.(enemy.dashAttackTargetPoint);
    } else {
        enemy.spawnMeleeAttackTelegraph?.();
    }

    const windupConfig = enemy.meleeAttackConfig?.windupMs ?? 220;
    const resolvedWindupMs = (windupConfig && typeof windupConfig === 'object')
        ? Phaser.Math.Between(
            Math.min(Math.round(windupConfig.min ?? 0), Math.round(windupConfig.max ?? 0)),
            Math.max(Math.round(windupConfig.min ?? 0), Math.round(windupConfig.max ?? 0))
        )
        : Math.round(windupConfig);
    const windupMs = Math.max(0, resolvedWindupMs);

    enemy.pendingAttackTimer?.remove?.(false);
    enemy.pendingAttackTimer = enemy.scene?.time?.delayedCall(windupMs, () => {
        enemy.pendingAttackTimer = null;
        performMeleeAttack(enemy, targetPlayer);
    });
    return true;
}

export function performMeleeAttack(enemy, targetPlayer) {
    if (!enemy.active) return;
    if (enemy.isDashLungeStyle?.()) {
        enemy.performDashAttack?.(targetPlayer);
        return;
    }

    const recoveryMs = Math.max(0, enemy.meleeAttackConfig?.recoveryMs ?? 120);
    const finishAttack = () => {
        enemy.isAttacking = false;
    };

    if (!targetPlayer?.active || targetPlayer?.isDead) {
        if (recoveryMs > 0) {
            enemy.scene?.time?.delayedCall(recoveryMs, finishAttack);
        } else {
            finishAttack();
        }
        return;
    }

    const dx = targetPlayer.x - enemy.x;
    const dy = targetPlayer.y - enemy.y;
    const attackDistance = getMeleeAttackDistance(enemy, targetPlayer);
    const hitConfirmPadding = Math.max(0, enemy.meleeAttackConfig?.hitConfirmPadding ?? 0);
    const confirmedAttackDistance = attackDistance + hitConfirmPadding;
    const withinRange = ((dx * dx) + (dy * dy)) <= confirmedAttackDistance * confirmedAttackDistance;

    if (withinRange && targetPlayer.takeDamage && !targetPlayer.isDead) {
        targetPlayer.takeDamage(enemy.damage ?? 10, enemy, { fromEnemyAttack: true });
        enemy.spawnMeleeAttackImpact?.(targetPlayer);
    }

    if (recoveryMs > 0) {
        enemy.scene?.time?.delayedCall(recoveryMs, finishAttack);
    } else {
        finishAttack();
    }
}

