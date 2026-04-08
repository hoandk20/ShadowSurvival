export default class EnemyProjectile extends Phaser.GameObjects.Arc {
    constructor(scene, owner, target, options = {}) {
        super(
            scene,
            options.spawnX ?? owner?.x ?? 0,
            options.spawnY ?? owner?.y ?? 0,
            options.radius ?? 5,
            0,
            360,
            false,
            options.color ?? 0xffffff,
            1
        );
        this.scene = scene;
        this.owner = owner;
        this.damage = Math.max(1, Math.round(options.damage ?? owner?.damage ?? 10));
        this.speed = Math.max(0, options.speed ?? 220);
        this.lifeMs = Math.max(200, options.lifetimeMs ?? 1400);
        this.glowColor = options.glowColor ?? options.color ?? 0xffffff;
        this.onHitEffectKey = options.onHitEffectKey ?? null;
        this.onHitEffectOptions = options.onHitEffectOptions ?? null;
        this.invisible = options.invisible === true;
        this.flashBeam = options.flashBeam ?? null;
        this.direction = new Phaser.Math.Vector2(
            options.directionX ?? ((target?.x ?? this.x + 1) - this.x),
            options.directionY ?? ((target?.y ?? this.y) - this.y)
        );
        if (this.direction.lengthSq() === 0) {
            this.direction.set(1, 0);
        } else {
            this.direction.normalize();
        }
        this.elapsedMs = 0;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        this.body.setCircle(this.radius);
        this.body.setVelocity(this.direction.x * this.speed, this.direction.y * this.speed);
        if (this.invisible) {
            this.setFillStyle(this.fillColor, 0);
            this.setStrokeStyle(0, this.glowColor, 0);
        } else {
            this.setStrokeStyle(2, this.glowColor, 0.95);
        }
        this.setDepth((owner?.depth ?? 20) + 3);

        if (this.flashBeam && this.scene?.add && this.scene?.tweens) {
            const length = Math.max(40, Math.round(this.flashBeam.length ?? 140));
            const thickness = Math.max(2, Math.round(this.flashBeam.thickness ?? 4));
            const color = this.flashBeam.color ?? 0xffffff;
            const alpha = Phaser.Math.Clamp(this.flashBeam.alpha ?? 0.55, 0, 1);
            const duration = Math.max(40, Math.round(this.flashBeam.duration ?? 120));
            const angle = Math.atan2(this.direction.y, this.direction.x);
            const beam = this.scene.add.rectangle(this.x + (this.direction.x * (length * 0.5)), this.y + (this.direction.y * (length * 0.5)), length, thickness, color, alpha)
                .setRotation(angle)
                .setDepth((owner?.depth ?? 20) + 6);
            this.scene.tweens.add({
                targets: beam,
                alpha: 0,
                scaleX: { from: 1, to: 1.15 },
                duration,
                ease: 'Cubic.easeOut',
                onComplete: () => beam.destroy()
            });
        }
    }

    update(_time, delta, players = []) {
        if (!this.active) return;
        this.elapsedMs += delta;
        if (this.elapsedMs >= this.lifeMs) {
            this.destroy();
            return;
        }

        for (const player of players) {
            if (!player?.active || player?.isDead) continue;
            const playerRadius = Math.max(player.displayWidth ?? player.body?.width ?? 0, player.displayHeight ?? player.body?.height ?? 0) * 0.35;
            const hitRadius = playerRadius + (this.radius ?? 5);
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            if ((dx * dx) + (dy * dy) > hitRadius * hitRadius) continue;
            player.takeDamage?.(this.damage, this.owner, { fromEnemyProjectile: true });
            if (this.onHitEffectKey && this.scene?.statusEffectSystem?.applyEffect) {
                this.scene.statusEffectSystem.applyEffect(player, this.onHitEffectKey, {
                    ...(this.onHitEffectOptions ?? {}),
                    source: this.owner
                });
            }
            this.destroy();
            return;
        }
    }
}
