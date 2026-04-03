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
        this.setStrokeStyle(2, this.glowColor, 0.95);
        this.setDepth((owner?.depth ?? 20) + 3);
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
            this.destroy();
            return;
        }
    }
}
