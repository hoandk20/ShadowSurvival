// systems/enemyBehaviors/zigzagDash.js
//
// A small, self-contained melee evasion dash behavior:
// When the player is close, the enemy performs 2-3 short perpendicular dashes
// (zigzag) before returning to normal chase/attack.
//
// Also supports an "approach" mode: dash forward toward the player multiple times
// to quickly close distance, then resume normal melee behavior.

const STATE_KEY = 'zigzagDash';

const clampInt = (n, min, max) => {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) return min;
    return Math.min(max, Math.max(min, v));
};

function getCfg(enemy) {
    return enemy?.enemyConfig?.meleeEvasionDash ?? null;
}

function getState(enemy) {
    enemy.behaviorState = enemy.behaviorState ?? {};
    enemy.behaviorState[STATE_KEY] = enemy.behaviorState[STATE_KEY] ?? {
        active: false,
        stepsRemaining: 0,
        nextSide: Phaser.Math.RND.pick([-1, 1]),
        stepEndsAtMs: 0,
        pauseUntilMs: 0,
        cooldownUntilMs: 0,
        direction: new Phaser.Math.Vector2(0, 0),
        telegraph: null
    };
    return enemy.behaviorState[STATE_KEY];
}

export function isZigzagDashing(enemy) {
    return Boolean(getState(enemy)?.active);
}

export function maybeStartZigzagDash(enemy, targetPlayer, time, distanceSq) {
    const cfg = getCfg(enemy);
    if (!cfg || cfg.enabled === false) return false;
    if (!enemy?.active || !enemy.body) return false;
    if (!targetPlayer?.active || targetPlayer.isDead) return false;
    if (enemy.isAttacking || enemy.isDashAttacking) return false;

    const state = getState(enemy);
    if (state.active) return false;
    if ((state.cooldownUntilMs ?? 0) > time) return false;

    const triggerRange = Math.max(30, Number(cfg.triggerRange ?? 120) || 120);
    if (distanceSq > triggerRange * triggerRange) return false;

    const chance = Phaser.Math.Clamp(cfg.chance ?? 1, 0, 1);
    if (chance < 1 && Math.random() > chance) return false;

    const steps = Phaser.Math.Between(
        Math.max(1, clampInt(cfg.stepsMin ?? 2, 1, 99)),
        Math.max(1, clampInt(cfg.stepsMax ?? 3, 1, 99))
    );
    state.active = true;
    state.stepsRemaining = steps;
    state.nextSide = Phaser.Math.RND.pick([-1, 1]);
    state.pauseUntilMs = time;
    state.stepEndsAtMs = time;
    enemy.resetMeleeEngageDelay?.();
    updateZigzagDash(enemy, targetPlayer, time);
    return true;
}

export function updateZigzagDash(enemy, targetPlayer, time) {
    const cfg = getCfg(enemy);
    const state = getState(enemy);
    if (!state.active || !enemy?.active || !enemy.body) return;
    if (!targetPlayer?.active || targetPlayer?.isDead || enemy.isStunned) {
        finishZigzagDash(enemy, time, null);
        return;
    }

    if ((state.pauseUntilMs ?? 0) > time) {
        enemy.body.setVelocity(0, 0);
        return;
    }

    if ((state.stepEndsAtMs ?? 0) > time) {
        if (enemy.body.blocked?.left || enemy.body.blocked?.right || enemy.body.blocked?.up || enemy.body.blocked?.down) {
            finishZigzagDash(enemy, time, targetPlayer);
        }
        return;
    }

    if ((state.stepsRemaining ?? 0) <= 0) {
        finishZigzagDash(enemy, time, targetPlayer);
        return;
    }

    const toPlayer = new Phaser.Math.Vector2(targetPlayer.x - enemy.x, targetPlayer.y - enemy.y);
    if (toPlayer.lengthSq() === 0) {
        toPlayer.set(enemy.flipX ? -1 : 1, 0);
    } else {
        toPlayer.normalize();
    }

    const mode = String(cfg?.mode ?? 'zigzag');
    let dashDir = null;
    if (mode === 'approach') {
        dashDir = toPlayer.clone();
    } else if (mode === 'zigzag_approach') {
        // Blend forward + sideways so it feels like a long zigzag "lunge" toward the player.
        const side = state.nextSide ?? 1;
        state.nextSide = -side;
        const perp = new Phaser.Math.Vector2(-toPlayer.y, toPlayer.x).scale(side);
        const forwardWeight = Phaser.Math.Clamp(cfg.forwardWeight ?? 0.85, 0, 1);
        const sideWeight = Phaser.Math.Clamp(cfg.sideWeight ?? 0.55, 0, 1);
        dashDir = toPlayer.clone().scale(forwardWeight).add(perp.scale(sideWeight));
        if (dashDir.lengthSq() === 0) dashDir = toPlayer.clone();
        dashDir.normalize();
    } else {
        const side = state.nextSide ?? 1;
        dashDir = new Phaser.Math.Vector2(-toPlayer.y, toPlayer.x).scale(side);
        state.nextSide = -side;
    }
    state.direction.copy(dashDir);

    const dashSpeed = Math.max(80, clampInt(cfg.stepSpeed ?? 520, 80, 5000));
    const rawDashDistance = Math.max(18, clampInt(cfg.stepDistance ?? 60, 18, 999));
    let dashDistance = rawDashDistance;
    if (mode === 'approach' || mode === 'zigzag_approach') {
        const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, targetPlayer.x, targetPlayer.y);
        const desiredStop = Math.max(18, enemy.getMeleeAttackDistance?.(targetPlayer) ?? 34);
        if (distToPlayer <= desiredStop) {
            finishZigzagDash(enemy, time, targetPlayer);
            return;
        }
        // Avoid overshooting too hard; still keep a minimum distance so it feels like a dash.
        dashDistance = Math.max(18, Math.min(rawDashDistance, Math.max(0, distToPlayer - desiredStop)));
    }
    const stepMs = Math.max(40, Math.round((dashDistance / dashSpeed) * 1000));
    const pauseMs = Math.max(0, clampInt(cfg.stepPauseMs ?? 60, 0, 2000));

    enemy.body.setVelocity(dashDir.x * dashSpeed, dashDir.y * dashSpeed);
    enemy.setFlipX((enemy.body.velocity.x ?? 0) < 0);
    spawnTelegraph(enemy, dashDir, cfg, state);

    state.stepsRemaining = Math.max(0, state.stepsRemaining - 1);
    state.stepEndsAtMs = time + stepMs;
    state.pauseUntilMs = state.stepEndsAtMs + pauseMs;
}

function finishZigzagDash(enemy, time, targetPlayer) {
    const cfg = getCfg(enemy) ?? {};
    const state = getState(enemy);
    state.active = false;
    state.stepsRemaining = 0;
    state.stepEndsAtMs = 0;
    state.pauseUntilMs = 0;
    state.cooldownUntilMs = time + Math.max(0, clampInt(cfg.cooldownMs ?? 1600, 0, 60000));
    enemy.body?.setVelocity?.(0, 0);
    destroyTelegraph(state);
    enemy.forceReturnToMoveAnimation?.();

    // For approach dashes, we can immediately try a normal melee attack if we're now in range.
    if (String(cfg.mode ?? 'zigzag') === 'approach' && targetPlayer?.active && !targetPlayer?.isDead) {
        enemy.tryAttackPlayer?.(targetPlayer, time);
    }
}

function spawnTelegraph(enemy, direction, cfg, state) {
    if (cfg?.telegraphEnabled === false) return;
    if (!enemy?.scene?.add?.graphics || !direction) return;
    destroyTelegraph(state);
    const dir = direction.clone?.() ?? new Phaser.Math.Vector2(direction.x ?? 0, direction.y ?? 0);
    if (dir.lengthSq() === 0) return;
    dir.normalize();

    const length = Math.max(18, clampInt(cfg.telegraphLength ?? 36, 18, 200));
    const width = Math.max(1, clampInt(cfg.telegraphWidth ?? 2, 1, 12));
    const alpha = Phaser.Math.Clamp(cfg.telegraphAlpha ?? 0.22, 0, 1);
    if (alpha <= 0) return;
    const duration = Math.max(60, clampInt(cfg.telegraphMs ?? 140, 60, 2000));

    const g = enemy.scene.add.graphics().setDepth((enemy.depth ?? 20) + 2);
    g.lineStyle(width, 0xffd2ff, alpha);
    g.beginPath();
    g.moveTo(enemy.x, enemy.y);
    g.lineTo(enemy.x + dir.x * length, enemy.y + dir.y * length);
    g.strokePath();
    state.telegraph = g;
    enemy.scene.tweens.add({
        targets: g,
        alpha: 0,
        duration,
        ease: 'Cubic.easeOut',
        onComplete: () => g.destroy()
    });
}

function destroyTelegraph(state) {
    state.telegraph?.destroy?.();
    state.telegraph = null;
}

export function cleanupZigzagDash(enemy) {
    const state = getState(enemy);
    destroyTelegraph(state);
    state.active = false;
}
