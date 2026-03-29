const ICE_PARTICLE_KEY = 'ice_particle_fx';

const DEFAULT_CONFIG = {
    depthOffset: -1,
    tint: 0xb8f4ff,
    secondaryTint: 0x7cdfff,
    speed: { min: 10, max: 28 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 0.82, end: 0 },
    lifespan: 220,
    frequency: 16,
    quantity: 3,
    followOffset: 12,
    spread: 5
};

function ensureIceParticleTexture(scene) {
    if (scene.textures.exists(ICE_PARTICLE_KEY)) return;
    const size = 6;
    const texture = scene.textures.createCanvas(ICE_PARTICLE_KEY, size, size);
    const ctx = texture.context;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 0, 2, 6);
    ctx.fillRect(0, 2, 6, 2);
    ctx.fillRect(1, 1, 4, 4);
    texture.refresh();
}

export default class IceParticleEffect {
    constructor(scene, skill, config = {}) {
        this.scene = scene;
        this.skill = skill;
        this.config = { ...DEFAULT_CONFIG, ...config };
        ensureIceParticleTexture(scene);
        this.emitter = scene.add.particles(0, 0, ICE_PARTICLE_KEY, {
            lifespan: this.config.lifespan,
            frequency: this.config.frequency,
            quantity: this.config.quantity,
            speedX: { min: -this.config.speed.max, max: this.config.speed.max },
            speedY: { min: -this.config.speed.max, max: this.config.speed.max },
            scale: this.config.scale,
            alpha: this.config.alpha,
            blendMode: Phaser.BlendModes.ADD,
            tint: [this.config.tint, this.config.secondaryTint],
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
        const offset = dir.clone().negate().scale(this.config.followOffset ?? 8);
        const emitX = this.skill.x + offset.x;
        const emitY = this.skill.y + offset.y;
        this.emitter.setPosition(emitX, emitY);
        this.emitter.setParticleSpeed(
            {
                min: offset.x - this.config.speed.max,
                max: offset.x + this.config.spread
            },
            {
                min: offset.y - this.config.speed.max,
                max: offset.y + this.config.spread
            }
        );
    }

    destroy() {
        this.emitter?.stop();
        this.emitter?.destroy();
        this.emitter = null;
    }
}
