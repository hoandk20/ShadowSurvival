// systems/enemyBehaviors/dashLunge.js
//
// Extracted dash-lunge/charge mechanics from Enemy so Enemy.js stays as an orchestrator.
// This module intentionally mutates the passed-in enemy instance and relies on enemy-owned
// helpers like animations, impact VFX, and status effect application.

export function performDashAttack(enemy, targetPlayer) {
    enemy.destroyDashAttackTelegraph?.();
    const recoveryMs = Math.max(0, enemy.meleeAttackConfig?.recoveryMs ?? 120);
    const lockedTarget = enemy.dashAttackTargetPoint?.clone?.()
        ?? new Phaser.Math.Vector2(targetPlayer?.x ?? enemy.x, targetPlayer?.y ?? enemy.y);
    enemy.dashAttackTrackedPlayer = targetPlayer ?? null;
    enemy.resumeDashJumpAnimation?.();

    const dashDirection = new Phaser.Math.Vector2(lockedTarget.x - enemy.x, lockedTarget.y - enemy.y);
    if (dashDirection.lengthSq() === 0) {
        dashDirection.set(enemy.flipX ? -1 : 1, 0);
    } else {
        dashDirection.normalize();
    }

    const dashOvershootDistance = Math.max(0, enemy.meleeAttackConfig?.dashOvershootDistance ?? 100);
    const dashTarget = lockedTarget.clone().add(dashDirection.clone().scale(dashOvershootDistance));
    const dashSpeed = Math.max(80, enemy.meleeAttackConfig?.dashSpeed ?? 280);
    const directDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, dashTarget.x, dashTarget.y);
    const dashDistance = Math.max(24, enemy.meleeAttackConfig?.dashDistance ?? directDistance);

    enemy.isDashAttacking = true;
    setDashMapCollisionEnabled(enemy, false);
    enemy.dashAttackHitResolved = false;
    enemy.dashBackFanElapsedMs = 0;
    enemy.dashBackFanShotTimerMs = 0;
    enemy.dashAttackDirection.copy(dashDirection);
    enemy.dashAttackRemainingDistance = Math.max(dashDistance, directDistance);
    enemy.dashAttackLastPosition.set(enemy.x, enemy.y);
    enemy.body?.setVelocity(dashDirection.x * dashSpeed, dashDirection.y * dashSpeed);
    enemy.setFlipX(dashDirection.x < 0);

    // Safety stop even if we never hit walls / distance conditions.
    enemy.scene?.time?.delayedCall(Math.max(1, recoveryMs + Math.round((enemy.dashAttackRemainingDistance / dashSpeed) * 1000)), () => {
        if (enemy.active && enemy.isDashAttacking) {
            finishDashAttack(enemy);
        }
    });
}

export function updateDashAttack(enemy, targetPlayer = null) {
    if (!enemy.isDashAttacking || !enemy.body) return;

    if (targetPlayer?.active && !targetPlayer?.isDead && !enemy.dashAttackHitResolved) {
        const hitPlayerDuringDash = didDashPathIntersectPlayer(
            enemy,
            enemy.dashAttackLastPosition.x,
            enemy.dashAttackLastPosition.y,
            enemy.x,
            enemy.y,
            targetPlayer
        );
        if (hitPlayerDuringDash) {
            if (onDashAttackHitPlayer(enemy, targetPlayer)) return;
            return;
        }
    }

    const movedDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.dashAttackLastPosition.x, enemy.dashAttackLastPosition.y);
    enemy.dashAttackRemainingDistance -= movedDistance;
    updateDashBackFanAttack(enemy);
    enemy.dashAttackLastPosition.set(enemy.x, enemy.y);

    if (Math.abs(enemy.body.velocity.x) + Math.abs(enemy.body.velocity.y) <= 2) {
        finishDashAttack(enemy);
        return;
    }

    if (
        !enemy.ignoreMapCollisionDuringDash
        && (enemy.body.blocked?.left || enemy.body.blocked?.right || enemy.body.blocked?.up || enemy.body.blocked?.down)
    ) {
        // Some dash attackers are meant to be baited into walls for a punish window.
        if (enemy.meleeAttackConfig?.stunOnWallHitMs) {
            enemy.applyStatusEffect?.('petrify', {
                durationMs: Math.max(1, Math.round(enemy.meleeAttackConfig.stunOnWallHitMs)),
                mode: 'stun',
                slowMultiplier: 0,
                tags: ['stun', 'charge', 'wall_hit']
            });
        }
        finishDashAttack(enemy);
        return;
    }

    if (enemy.dashAttackRemainingDistance <= 0) {
        finishDashAttack(enemy);
        return;
    }

    if (targetPlayer?.active) {
        enemy.setFlipX((enemy.body.velocity.x ?? 0) < 0);
    }
}

export function didDashPathIntersectPlayer(enemy, startX, startY, endX, endY, targetPlayer) {
    if (!targetPlayer?.active || targetPlayer?.isDead) return false;
    const lineDx = endX - startX;
    const lineDy = endY - startY;
    const lineLengthSq = (lineDx * lineDx) + (lineDy * lineDy);
    const enemyRadius = Math.max(
        enemy.hitboxSize?.width ?? 0,
        enemy.hitboxSize?.height ?? 0,
        enemy.displayWidth ?? 0,
        enemy.displayHeight ?? 0,
        16
    ) * 0.5;
    const playerRadius = Math.max(
        targetPlayer?.hitboxSize?.width ?? 0,
        targetPlayer?.hitboxSize?.height ?? 0,
        targetPlayer?.displayWidth ?? 0,
        targetPlayer?.displayHeight ?? 0,
        18
    ) * 0.5;
    const hitDistance = enemyRadius + playerRadius;
    if (lineLengthSq <= 0) {
        return Phaser.Math.Distance.Between(startX, startY, targetPlayer.x, targetPlayer.y) <= hitDistance;
    }
    const toPlayerX = targetPlayer.x - startX;
    const toPlayerY = targetPlayer.y - startY;
    const projection = Phaser.Math.Clamp(
        ((toPlayerX * lineDx) + (toPlayerY * lineDy)) / lineLengthSq,
        0,
        1
    );
    const closestX = startX + (lineDx * projection);
    const closestY = startY + (lineDy * projection);
    return Phaser.Math.Distance.Between(closestX, closestY, targetPlayer.x, targetPlayer.y) <= hitDistance;
}

export function onDashAttackHitPlayer(enemy, targetPlayer) {
    enemy.dashAttackHitResolved = true;
    targetPlayer.takeDamage?.(enemy.damage ?? 10, enemy, { fromEnemyAttack: true });

    // Optional strong knockback for charge-style dash attacks.
    const kb = enemy.meleeAttackConfig?.dashKnockbackOnHit;
    if (kb && typeof targetPlayer.applyExternalKnockback === 'function') {
        const speed = Math.max(0, kb.speed ?? 480);
        const durationMs = Math.max(0, kb.durationMs ?? 160);
        const dragFactor = Phaser.Math.Clamp(kb.dragFactor ?? 0.94, 0, 0.999);
        const dir = enemy.dashAttackDirection?.lengthSq?.() > 0
            ? enemy.dashAttackDirection
            : new Phaser.Math.Vector2(targetPlayer.x - enemy.x, targetPlayer.y - enemy.y);
        targetPlayer.applyExternalKnockback(dir, speed, durationMs, dragFactor);
    }

    enemy.spawnMeleeAttackImpact?.(targetPlayer);
    return false;
}

export function finishDashAttack(enemy) {
    enemy.isDashAttacking = false;
    setDashMapCollisionEnabled(enemy, true);
    enemy.body?.setVelocity(0, 0);
    enemy.dashAttackTargetPoint = null;
    enemy.dashAttackRemainingDistance = 0;
    enemy.dashAttackHitResolved = false;
    enemy.dashAttackTrackedPlayer = null;
    enemy.dashBackFanElapsedMs = 0;
    enemy.dashBackFanShotTimerMs = 0;

    const recoveryMs = Math.max(0, enemy.meleeAttackConfig?.recoveryMs ?? 120);
    if (recoveryMs > 0) {
        enemy.scene?.time?.delayedCall(recoveryMs, () => {
            if (enemy.active) {
                enemy.isAttacking = false;
                enemy.forceReturnToMoveAnimation?.();
            }
        });
    } else {
        enemy.isAttacking = false;
        enemy.forceReturnToMoveAnimation?.();
    }
}

export function setDashMapCollisionEnabled(enemy, enabled = true) {
    const shouldEnable = Boolean(enabled);
    if (shouldEnable && !enemy.ignoreMapCollisionDuringDash) return;
    if (!shouldEnable && enemy.ignoreMapCollisionDuringDash) return;
    enemy.ignoreMapCollisionDuringDash = !shouldEnable;
    if (shouldEnable) {
        enemy.scene?.mapManager?.enableObjectCollisions?.(enemy);
        return;
    }
    enemy.scene?.mapManager?.removeObjectCollisions?.(enemy);
}

export function spawnDashAttackTelegraph(enemy, targetPoint) {
    destroyDashAttackTelegraph(enemy);
    if (!enemy.scene?.add || !targetPoint) return;

    const container = enemy.scene.add.container(0, 0).setDepth((enemy.depth ?? 20) + 8);
    const line = enemy.scene.add.graphics();
    line.lineStyle(enemy.dashTelegraphWidth ?? 2, 0xff4d4d, enemy.dashTelegraphAlpha ?? 0.95);
    line.beginPath();
    line.moveTo(enemy.x, enemy.y);
    line.lineTo(targetPoint.x, targetPoint.y);
    line.strokePath();

    const alert = enemy.scene.add.text(targetPoint.x, targetPoint.y - 24, '!', {
        fontSize: '14px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: '#ffb3b3',
        stroke: '#000000',
        strokeThickness: 3
    }).setOrigin(0.5);

    container.add([line, alert]);
    enemy.dashAttackTelegraph = container;
    enemy.dashAttackTelegraphTween = enemy.scene.tweens?.add({
        targets: [alert],
        alpha: { from: 0.45, to: 1 },
        scale: { from: 0.92, to: 1.08 },
        duration: 260,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    }) ?? null;
}

export function destroyDashAttackTelegraph(enemy) {
    enemy.dashAttackTelegraphTween?.remove?.();
    enemy.dashAttackTelegraphTween = null;
    enemy.dashAttackTelegraph?.destroy?.(true);
    enemy.dashAttackTelegraph = null;
}

export function updateDashBackFanAttack(enemy) {
    if (!enemy.isDashAttacking || enemy.attackStyle !== 'dash_lunge_back_fan' || !enemy.scene) return;
    const dashBackFan = enemy.meleeAttackConfig?.dashBackFan ?? {};
    const bulletIntervalMs = Math.max(40, Number(dashBackFan.bulletInterval) || 120);
    enemy.dashBackFanShotTimerMs += enemy.scene.game.loop.delta;
    while (enemy.dashBackFanShotTimerMs >= bulletIntervalMs) {
        enemy.dashBackFanShotTimerMs -= bulletIntervalMs;
        shootBackFan(enemy);
    }
}

export function shootBackFan(enemy) {
    if (!enemy.scene || !enemy.active) return;
    const dashBackFan = enemy.meleeAttackConfig?.dashBackFan ?? {};
    const bulletsPerWave = Math.max(1, Math.round(dashBackFan.bulletsPerWave ?? 5));
    const spreadAngleRad = Phaser.Math.DegToRad(Math.max(0, Number(dashBackFan.spreadAngle) || 55));
    const bulletSpeed = Math.max(0, Number(dashBackFan.bulletSpeed) || 140);
    const backDir = enemy.dashAttackDirection.clone().negate();
    const centerAngle = backDir.angle();
    const startAngle = centerAngle - (spreadAngleRad * 0.5);
    const angleStep = bulletsPerWave <= 1 ? 0 : (spreadAngleRad / (bulletsPerWave - 1));
    for (let index = 0; index < bulletsPerWave; index += 1) {
        const bulletAngle = startAngle + (angleStep * index);
        const dirX = Math.cos(bulletAngle);
        const dirY = Math.sin(bulletAngle);
        spawnBullet(enemy, enemy.x, enemy.y, dirX, dirY, {
            speed: bulletSpeed,
            radius: dashBackFan.projectileRadius ?? 5,
            lifetimeMs: dashBackFan.projectileLifetimeMs ?? 1800,
            color: dashBackFan.projectileColor ?? 0xff3b3b,
            glowColor: dashBackFan.projectileGlowColor ?? 0xff8c8c,
            damage: Math.max(1, Math.round((enemy.damage ?? 10) * (dashBackFan.projectileDamageRatio ?? 1)))
        });
    }
}

export function spawnBullet(enemy, x, y, dirX, dirY, options = {}) {
    const normalized = new Phaser.Math.Vector2(dirX, dirY);
    if (normalized.lengthSq() === 0) {
        normalized.set(1, 0);
    } else {
        normalized.normalize();
    }
    enemy.scene?.spawnEnemyProjectileDirection?.(enemy, x, y, normalized.x, normalized.y, options);
}

