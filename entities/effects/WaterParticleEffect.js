const WATER_PARTICLE_KEY = 'water_particle_fx';

const DEFAULT_CONFIG = {
    depthOffset: -1,
    tint: 0xd7fbff,
    secondaryTint: 0x5fd6ff,
    tertiaryTint: 0x2fa9ff,
    foamTint: 0xf2ffff,
    speed: { min: 18, max: 42 },
    scale: { start: 1.55, end: 0.28 },
    alpha: { start: 0.68, end: 0 },
    lifespan: 420,
    frequency: 12,
    quantity: 7,
    followOffset: 22,
    spread: 16,
    radialDrift: 14,
    streamArc: 24
};

function ensureWaterParticleTexture(scene) {
    if (scene.textures.exists(WATER_PARTICLE_KEY)) return;
    const size = 18;
    const texture = scene.textures.createCanvas(WATER_PARTICLE_KEY, size, size);
    const ctx = texture.context;
    ctx.clearRect(0, 0, size, size);

    const gradient = ctx.createRadialGradient(9, 9, 2, 9, 9, 8);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(210,245,255,0.95)');
    gradient.addColorStop(0.7, 'rgba(125,215,255,0.72)');
    gradient.addColorStop(1, 'rgba(40,130,220,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(9, 1.5);
    ctx.quadraticCurveTo(14.5, 5, 14.5, 9.5);
    ctx.quadraticCurveTo(14.5, 15.5, 9, 16.5);
    ctx.quadraticCurveTo(3.5, 15.5, 3.5, 9.5);
    ctx.quadraticCurveTo(3.5, 5, 9, 1.5);
    ctx.fill();

    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(7, 6, 2.5, 1.6, -0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.38;
    ctx.beginPath();
    ctx.ellipse(11.8, 11.8, 2.2, 1.3, 0.5, 0, Math.PI * 2);
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
            tint: [this.config.foamTint, this.config.tint, this.config.secondaryTint, this.config.tertiaryTint],
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
        this.emitter.setAngle({
            min: Phaser.Math.RadToDeg(Math.atan2(offset.y - perpendicular.y, offset.x - perpendicular.x)) - (this.config.streamArc ?? 0),
            max: Phaser.Math.RadToDeg(Math.atan2(offset.y + perpendicular.y, offset.x + perpendicular.x)) + (this.config.streamArc ?? 0)
        });
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
