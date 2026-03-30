const WATER_PARTICLE_KEY = 'water_particle_fx';

const DEFAULT_CONFIG = {
    depthOffset: -1,
    tint: 0xd7fbff,
    secondaryTint: 0x5fd6ff,
    tertiaryTint: 0x2fa9ff,
    speed: { min: 10, max: 26 },
    scale: { start: 1.05, end: 0.15 },
    alpha: { start: 0.52, end: 0 },
    lifespan: 320,
    frequency: 18,
    quantity: 4,
    followOffset: 14,
    spread: 8,
    radialDrift: 6
};

function ensureWaterParticleTexture(scene) {
    if (scene.textures.exists(WATER_PARTICLE_KEY)) return;
    const size = 10;
    const texture = scene.textures.createCanvas(WATER_PARTICLE_KEY, size, size);
    const ctx = texture.context;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(5, 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.arc(3.5, 3.5, 1.25, 0, Math.PI * 2);
    ctx.fill();
    texture.refresh();
}

export default class WaterParticleEffect {
    constructor(scene, skill, config = {}) {
        this.scene = scene;
        this.skill = skill;
        this.config = { ...DEFAULT_CONFIG, ...config };
        ensureWaterParticleTexture(scene);
        this.emitter = scene.add.particles(0, 0, WATER_PARTICLE_KEY, {
            lifespan: this.config.lifespan,
            frequency: this.config.frequency,
            quantity: this.config.quantity,
            speedX: { min: -this.config.speed.max, max: this.config.speed.max },
            speedY: { min: -this.config.speed.max, max: this.config.speed.max },
            scale: this.config.scale,
            alpha: this.config.alpha,
            blendMode: Phaser.BlendModes.SCREEN,
            tint: [this.config.tint, this.config.secondaryTint, this.config.tertiaryTint],
            emitting: true
        });
        this.emitter.setDepth((skill.depth ?? 0) + (this.config.depthOffset ?? 0));
    }

    update() {
        if (!this.skill?.active || !this.emitter) return;
        const dir = this.skill.direction?.clone?.() ?? new Phaser.Math.Vector2(1, 0);
        if (dir.lengthSq() === 0) {
            dir.set(1, 0);
        } else {
            dir.normalize();
        }

        const offset = dir.clone().negate().scale(this.config.followOffset ?? 12);
        const perpendicular = new Phaser.Math.Vector2(-dir.y, dir.x).scale(this.config.radialDrift ?? 6);
        const emitX = this.skill.x + offset.x;
        const emitY = this.skill.y + offset.y;
        this.emitter.setPosition(emitX, emitY);
        this.emitter.setParticleSpeed(
            {
                min: offset.x - perpendicular.x - this.config.spread,
                max: offset.x + perpendicular.x + this.config.spread
            },
            {
                min: offset.y - perpendicular.y - this.config.spread,
                max: offset.y + perpendicular.y + this.config.spread
            }
        );
    }

    destroy() {
        this.emitter?.stop();
        this.emitter?.destroy();
        this.emitter = null;
    }
}
