const DEFAULT_CONFIG = {
    tint: 0xaeefff,
    spawnInterval: 24,
    lifetime: 180,
    depthOffset: -1,
    blendMode: 'ADD',
    minAlpha: 0.15,
    sizeFactor: 0.9,
    trailDistance: 10,
    minTravelDistance: 4
};

export default class SkillMotionTrailEffect {
    constructor(scene, skill, config = {}) {
        this.scene = scene;
        this.skill = skill;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.elapsed = this.config.spawnInterval;
        this.trails = [];
        this.lastDirection = new Phaser.Math.Vector2(1, 0);
        this.lastPosition = new Phaser.Math.Vector2(skill.x, skill.y);
    }

    update(_time, delta) {
        if (!this.scene || !this.skill?.active) return;
        this.elapsed += delta;
        this.updateDirection();
        if (this.shouldSpawnTrail() && this.elapsed >= this.config.spawnInterval) {
            this.elapsed = 0;
            this.spawnTrail();
        }
        this.lastPosition.set(this.skill.x, this.skill.y);

        for (let i = this.trails.length - 1; i >= 0; i -= 1) {
            const trail = this.trails[i];
            trail.life -= delta;
            if (trail.life <= 0) {
                trail.sprite.destroy();
                this.trails.splice(i, 1);
                continue;
            }
            const normalized = trail.life / this.config.lifetime;
            trail.sprite.setAlpha(Phaser.Math.Clamp(normalized, this.config.minAlpha, 1));
        }
    }

    shouldSpawnTrail() {
        const traveled = Phaser.Math.Distance.Between(this.lastPosition.x, this.lastPosition.y, this.skill.x, this.skill.y);
        return traveled >= (this.config.minTravelDistance ?? 4);
    }

    updateDirection() {
        const dir = this.skill.direction?.clone?.() ?? new Phaser.Math.Vector2(
            this.skill.x - this.lastPosition.x,
            this.skill.y - this.lastPosition.y
        );
        if (dir.lengthSq() > 0) {
            this.lastDirection.copy(dir.normalize());
        }
    }

    spawnTrail() {
        const textureKey = this.skill.texture.key;
        const frameName = this.skill.frame?.name ?? null;
        const offset = this.lastDirection.clone().negate().scale(this.config.trailDistance ?? 10);
        const sprite = this.scene.add.sprite(this.skill.x + offset.x, this.skill.y + offset.y, textureKey, frameName);
        sprite.setTint(this.config.tint);
        sprite.setBlendMode(this.config.blendMode);
        sprite.setDepth((this.skill.depth ?? 0) + (this.config.depthOffset ?? 0));
        sprite.setOrigin(this.skill.originX, this.skill.originY);
        sprite.setRotation(this.skill.rotation ?? 0);
        sprite.setFlipX(this.skill.flipX);
        const baseWidth = this.skill.displayWidth || this.skill.width || 24;
        const baseHeight = this.skill.displayHeight || this.skill.height || 24;
        const sizeFactor = this.config.sizeFactor ?? 1;
        sprite.setDisplaySize(baseWidth * sizeFactor, baseHeight * sizeFactor);
        sprite.setAlpha(0.75);
        this.trails.push({ sprite, life: this.config.lifetime });
    }

    destroy() {
        this.trails.forEach((trail) => trail.sprite.destroy());
        this.trails.length = 0;
    }
}
