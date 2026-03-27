// entities/effects/MotionTrailEffect.js
const DEFAULT_CONFIG = {
    tint: 0x6ea2ff,
    spawnInterval: 10,
    lifetime: 30,
    depthOffset: -2,
    blendMode: 'ADD',
    scale: 0.5,
    attachOffsetY: 0,
    minAlpha: 0.4,
    offsetDistance: 1,
    sizeFactor: 0.9
};

export default class MotionTrailEffect {
    constructor(scene, owner, config = {}) {
        this.scene = scene;
        this.owner = owner;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.elapsed = this.config.spawnInterval;
        this.trails = [];
        this.lastDirection = new Phaser.Math.Vector2(1, 0);
    }

    update(time, delta) {
        if (!this.owner || !this.scene) return;
        this.elapsed += delta;
        this.updateDirection();
        if (this.hasMovement() && this.elapsed >= this.config.spawnInterval) {
            this.elapsed = 0;
            this.spawnTrail();
        }
        for (let i = this.trails.length - 1; i >= 0; i -= 1) {
            const trail = this.trails[i];
            trail.life -= delta;
            if (trail.life <= 0) {
                trail.sprite.destroy();
                this.trails.splice(i, 1);
                continue;
            }
            const normalized = trail.life / this.config.lifetime;
            const alpha = Phaser.Math.Clamp(normalized, this.config.minAlpha ?? 0.2, 1);
            trail.sprite.setAlpha(alpha);
        }
    }

    spawnTrail() {
        if (!this.owner || !this.scene) return;
        const textureKey = this.owner.texture.key;
        const frameName = this.owner.frame?.name ?? null;
        const offsetDistance = this.config.offsetDistance ?? 12;
        const offsetX = -this.lastDirection.x * offsetDistance;
        const offsetY = -this.lastDirection.y * offsetDistance;
        const spawnX = this.owner.x + offsetX;
        const spawnY = this.owner.y + offsetY + (this.config.attachOffsetY ?? 0);
        const sprite = this.scene.add.sprite(spawnX, spawnY, textureKey, frameName);
        sprite.setTint(this.config.tint);
        sprite.setBlendMode(this.config.blendMode);
        sprite.setDepth((this.owner.depth ?? 0) + (this.config.depthOffset ?? 0));
        sprite.setOrigin(this.owner.originX, this.owner.originY);
        sprite.setFlipX(this.owner.flipX);
        const baseWidth = this.owner.displayWidth || this.owner.width || (this.owner.body?.width ?? 32);
        const baseHeight = this.owner.displayHeight || this.owner.height || (this.owner.body?.height ?? 32);
        const sizeFactor = this.config.sizeFactor ?? 1;
        sprite.setDisplaySize(baseWidth * sizeFactor, baseHeight * sizeFactor);
        sprite.setAlpha(0.8);
        this.trails.push({ sprite, life: this.config.lifetime });
    }

    hasMovement() {
        if (!this.owner.body) return false;
        const vx = this.owner.body.velocity.x ?? 0;
        const vy = this.owner.body.velocity.y ?? 0;
        return Math.abs(vx) > 6 || Math.abs(vy) > 6;
    }

    updateDirection() {
        if (!this.owner.body) return;
        const vx = this.owner.body.velocity.x ?? 0;
        const vy = this.owner.body.velocity.y ?? 0;
        if (Math.abs(vx) > 4 || Math.abs(vy) > 4) {
            this.lastDirection.set(vx, vy).normalize();
        }
    }

    destroy() {
        this.trails.forEach((trail) => trail.sprite.destroy());
        this.trails.length = 0;
    }
}
