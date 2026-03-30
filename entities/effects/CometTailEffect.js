const COMET_PARTICLE_KEY = 'comet_tail_particle_fx';

const DEFAULT_CONFIG = {
    depthOffset: -1,
    coreTint: 0xfff0b3,
    glowTint: 0xffb45c,
    emberTint: 0xff7a45,
    speed: { min: 18, max: 42 },
    scale: { start: 0.95, end: 0 },
    alpha: { start: 0.85, end: 0 },
    lifespan: 260,
    frequency: 18,
    quantity: 4,
    followOffset: 18,
    spread: 8
};

function ensureCometParticleTexture(scene) {
    if (scene.textures.exists(COMET_PARTICLE_KEY)) return;
    const width = 6;
    const height = 14;
    const texture = scene.textures.createCanvas(COMET_PARTICLE_KEY, width, height);
    const ctx = texture.context;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 0, 2, 14);
    ctx.fillRect(1, 1, 4, 6);
    ctx.fillRect(2, 10, 2, 3);
    texture.refresh();
}

export default class CometTailEffect {
    constructor(scene, skill, config = {}) {
        this.scene = scene;
        this.skill = skill;
        this.config = { ...DEFAULT_CONFIG, ...config };
        ensureCometParticleTexture(scene);
        this.emitter = scene.add.particles(0, 0, COMET_PARTICLE_KEY, {
            lifespan: this.config.lifespan,
            frequency: this.config.frequency,
            quantity: this.config.quantity,
            speedX: { min: -this.config.speed.max, max: this.config.speed.max },
            speedY: { min: -this.config.speed.max, max: this.config.speed.max },
            scale: this.config.scale,
            alpha: this.config.alpha,
            blendMode: Phaser.BlendModes.ADD,
            tint: [this.config.coreTint, this.config.glowTint, this.config.emberTint],
            emitting: true
        });
        this.emitter.setDepth((skill.depth ?? 0) + (this.config.depthOffset ?? 0));
    }

    update() {
        if (!this.skill?.active || !this.emitter) return;
        const dir = this.skill.direction?.clone?.() ?? new Phaser.Math.Vector2(0, 1);
        if (dir.lengthSq() === 0) {
            dir.set(0, 1);
        } else {
            dir.normalize();
        }
        const offset = dir.clone().negate().scale(this.config.followOffset ?? 18);
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
