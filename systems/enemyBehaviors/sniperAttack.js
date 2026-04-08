// systems/enemyBehaviors/sniperAttack.js
//
// Sniper ranged attack (telegraph + locked shot) extracted from Enemy.js.

const DEFAULT_LINE_WIDTH = 3;
const DEFAULT_ALPHA = 0.24;
const DEFAULT_STROKE_ALPHA = 0.52;

export function beginSniperAttack(enemy, targetPlayer) {
    if (!enemy?.active || !enemy.body || !enemy.scene) return;
    enemy.isAttacking = true;
    enemy.body?.setVelocity?.(0, 0);
    const targetPoint = new Phaser.Math.Vector2(targetPlayer.x, targetPlayer.y);
    spawnSniperTelegraph(enemy, targetPoint.x, targetPoint.y);
    enemy.pendingAttackTimer?.remove?.(false);
    enemy.pendingAttackTimer = enemy.scene?.time?.delayedCall(enemy.rangedAttackConfig?.sniperWindupMs ?? 650, () => {
        enemy.pendingAttackTimer = null;
        if (!enemy.active) return;
        destroySniperTelegraph(enemy);
        const direction = new Phaser.Math.Vector2(targetPoint.x - enemy.x, targetPoint.y - enemy.y);
        if (direction.lengthSq() === 0) {
            direction.set(enemy.flipX ? -1 : 1, 0);
        } else {
            direction.normalize();
        }
        enemy.spawnSniperMuzzleFlash?.(direction);
        const projectileVisual = String(enemy.rangedAttackConfig?.sniperProjectileVisual ?? 'default');
        enemy.scene?.spawnEnemyProjectileDirection?.(enemy, enemy.x, enemy.y, direction.x, direction.y, {
            damage: enemy.damage ?? 10,
            speed: enemy.rangedAttackConfig?.projectileSpeed ?? 320,
            radius: enemy.rangedAttackConfig?.projectileRadius ?? 4,
            lifetimeMs: enemy.rangedAttackConfig?.projectileLifetimeMs ?? 1800,
            color: enemy.rangedAttackConfig?.projectileColor ?? 0x8fd7ff,
            glowColor: enemy.rangedAttackConfig?.projectileGlowColor ?? 0xe3f6ff,
            onHitEffectKey: enemy.rangedAttackConfig?.onHitEffectKey ?? null,
            onHitEffectOptions: enemy.rangedAttackConfig?.onHitEffectOptions ?? null,
            ...(projectileVisual === 'flash_beam'
                ? {
                    invisible: true,
                    flashBeam: {
                        length: 160,
                        thickness: 9,
                        color: 0xffffff,
                        alpha: 0.62,
                        duration: 120
                    }
                }
                : null)
        });
        const recoveryMs = Math.max(0, enemy.rangedAttackConfig?.sniperRecoveryMs ?? 160);
        enemy.scene?.time?.delayedCall(recoveryMs, () => {
            if (!enemy.active) return;
            enemy.isAttacking = false;
        });
    });
}

export function spawnSniperTelegraph(enemy, targetX, targetY) {
    if (!enemy?.scene?.add?.graphics) return;
    destroySniperTelegraph(enemy);
    const style = String(enemy.rangedAttackConfig?.sniperTelegraphStyle ?? 'default');
    const baseColor = enemy.rangedAttackConfig?.projectileColor ?? 0x8fd7ff;
    const windupMs = enemy.rangedAttackConfig?.sniperWindupMs ?? 650;
    const depth = (enemy.depth ?? 20) + 4;

    const container = enemy.scene.add.container(enemy.x, enemy.y).setDepth(depth);
    const telegraph = enemy.scene.add.graphics();
    container.add(telegraph);
    const dot = enemy.scene.add.circle(0, 0, style === 'gaze' ? 10 : 7, baseColor, style === 'gaze' ? 0.16 : 0.12);
    dot.setStrokeStyle(2, 0xffffff, style === 'gaze' ? 0.18 : 0.12);
    container.add(dot);

    const draw = () => {
        telegraph.clear();
        const dx = (container.__sniperTargetX ?? targetX) - (enemy.x ?? container.x ?? 0);
        const dy = (container.__sniperTargetY ?? targetY) - (enemy.y ?? container.y ?? 0);
        if (style === 'gaze') {
            telegraph.lineStyle(12, 0xb7ffdf, 0.07);
            telegraph.beginPath();
            telegraph.moveTo(0, 0);
            telegraph.lineTo(dx, dy);
            telegraph.strokePath();

            telegraph.lineStyle(7, 0x9affd0, 0.14);
            telegraph.beginPath();
            telegraph.moveTo(0, 0);
            telegraph.lineTo(dx, dy);
            telegraph.strokePath();

            telegraph.lineStyle(3, baseColor, 0.28);
            telegraph.beginPath();
            telegraph.moveTo(0, 0);
            telegraph.lineTo(dx, dy);
            telegraph.strokePath();

            telegraph.lineStyle(1, 0xf7fbff, 0.38);
            telegraph.beginPath();
            telegraph.moveTo(0, 0);
            telegraph.lineTo(dx, dy);
            telegraph.strokePath();
        } else {
            telegraph.lineStyle(DEFAULT_LINE_WIDTH, baseColor, DEFAULT_ALPHA);
            telegraph.beginPath();
            telegraph.moveTo(0, 0);
            telegraph.lineTo(dx, dy);
            telegraph.strokePath();
            telegraph.lineStyle(1, 0xffffff, DEFAULT_STROKE_ALPHA);
            telegraph.beginPath();
            telegraph.moveTo(0, 0);
            telegraph.lineTo(dx, dy);
            telegraph.strokePath();
        }
    };

    container.__sniperTargetX = targetX;
    container.__sniperTargetY = targetY;
    container.__redraw = () => {
        if (!container.active) return;
        container.x = enemy.x;
        container.y = enemy.y;
        dot.x = container.__sniperTargetX - enemy.x;
        dot.y = container.__sniperTargetY - enemy.y;
        draw();
    };
    container.__redraw();

    enemy.sniperTelegraph = container;
    enemy.sniperTelegraphTween = enemy.scene?.tweens?.add({
        targets: [container, dot],
        alpha: { from: style === 'gaze' ? 0.55 : 0.35, to: 1 },
        scaleX: { from: 1, to: style === 'gaze' ? 1.04 : 1.02 },
        scaleY: { from: 1, to: style === 'gaze' ? 1.06 : 1.02 },
        duration: windupMs,
        yoyo: true,
        repeat: -1
    }) ?? null;
}

export function destroySniperTelegraph(enemy) {
    enemy.sniperTelegraphTween?.stop?.();
    enemy.sniperTelegraphTween = null;
    enemy.sniperTelegraph?.destroy?.();
    enemy.sniperTelegraph = null;
}

