// entities/effects/HolyAuraEffect.js
const DEFAULT_CONFIG = {
    glowRadii: [18, 14],
    glowColors: [0xffeb9c, 0xffd95a, 0xfff8d2],
    rayVectors: [0, 45, 90, 135, 180, 225, 270, 315].map(deg => ({
        dx: Math.cos(Phaser.Math.DegToRad(deg)),
        dy: Math.sin(Phaser.Math.DegToRad(deg))
    })),
    rayColor: 0xffd15a,
    rayLengthStart: 10,
    rayLengthEnd: 18,
    pulseScale: 1.1,
    particleCount: 14,
    particleRise: 40,
    particleWidth: 3,
    particleHeight: 6,
    particleDuration: { min: 600, max: 900 },
    particleTint: 0xffe3b3,
    depthOffset: 6,
    useParticles: false
};

function buildSizeAwareConfig(skill, overrides = {}) {
    const skillWidth = skill?.hitboxWidth ?? DEFAULT_CONFIG.glowRadii[0] * 2;
    const skillHeight = skill?.hitboxHeight ?? DEFAULT_CONFIG.glowRadii[0] * 2;
    const diameter = Math.max(skillWidth, skillHeight, DEFAULT_CONFIG.glowRadii[0] * 2);
    const baseRadius = Math.max(diameter / 2, DEFAULT_CONFIG.glowRadii[0]);
    return {
        glowRadii: [
            baseRadius,
            Math.max(baseRadius * 0.8, baseRadius - 6)
        ],
        rayLengthStart: Math.max(baseRadius * 0.15, DEFAULT_CONFIG.rayLengthStart),
        rayLengthEnd: Math.max(baseRadius * 0.4, DEFAULT_CONFIG.rayLengthEnd),
        particleRise: Math.max(baseRadius * 0.9, DEFAULT_CONFIG.particleRise),
        particleWidth: Math.max(baseRadius * 0.05, DEFAULT_CONFIG.particleWidth),
        particleHeight: Math.max(baseRadius * 0.1, DEFAULT_CONFIG.particleHeight),
        particleOrbitRadius: overrides.particleOrbitRadius ?? Math.max(baseRadius * 0.6, baseRadius - 6)
    };
}

const AURA_PARTICLE_KEY = 'aura_particle';

function ensureAuraParticleTexture(scene) {
    if (scene.textures.exists(AURA_PARTICLE_KEY)) return;
    const size = 6;
    const canvas = scene.textures.createCanvas(AURA_PARTICLE_KEY, size, size);
    const ctx = canvas.context;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    canvas.refresh();
}

export default class HolyAuraEffect {
    constructor(scene, skill, config = {}) {
        this.scene = scene;
        this.skill = skill;
        const sizeAwareConfig = buildSizeAwareConfig(skill, config);
        this.config = { ...DEFAULT_CONFIG, ...sizeAwareConfig, ...config };
        this.container = scene.add.container(skill.x, skill.y);
        const ownerDepth = skill.owner?.depth ?? 0;
        this.container.setDepth(ownerDepth + Math.max(this.config.depthOffset ?? 0, DEFAULT_CONFIG.depthOffset));
        this.container.setBlendMode(Phaser.BlendModes.ADD);
        this.container.setScrollFactor(1);
        this.container.setVisible(true);
        this.container.setAlpha(1);
        this.container.setScale(1);
        this.createGlow();
        if (this.config.useParticles) {
            this.createParticles();
        }
        this.pulseTween = this.scene.tweens.add({
            targets: this.container,
            scaleX: this.config.pulseScale,
            scaleY: this.config.pulseScale,
            duration: 900,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    createGlow() {
        const { glowRadii, glowColors } = this.config;
        const glow = this.scene.add.graphics();
        glow.setDepth(this.container.depth - 1);
        const renderRadii = glowRadii.slice(0, 2);
        for (let i = 0; i < renderRadii.length; i += 1) {
            const radius = renderRadii[i];
            const thickness = Math.max(radius / 12, 2);
            const alpha = i === 0 ? 0.25 : 0.18;
            glow.lineStyle(thickness, glowColors[i] ?? glowColors[0], alpha);
            glow.strokeCircle(0, 0, radius);
        }
        this.container.add(glow);
        this.glow = glow;
    }

    createParticles() {
        const { particleCount, particleWidth, particleHeight, particleRise } = this.config;
        this.particleTweens = [];
        for (let i = 0; i < particleCount; i += 1) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const offsetX = Math.cos(angle) * (particleWidth * 2);
            const offsetY = Math.sin(angle) * (particleWidth * 2);
            const particle = this.scene.add.rectangle(
                offsetX,
                offsetY + particleRise / 2,
                particleWidth,
                particleHeight,
                this.config.particleTint
            );
            particle.setAlpha(0.85);
            this.container.add(particle);
            const tween = this.scene.tweens.add({
                targets: particle,
                y: particle.y - particleRise,
                alpha: 0,
                duration: Phaser.Math.Between(this.config.particleDuration.min, this.config.particleDuration.max),
                ease: 'Quad.easeOut',
                repeat: -1,
                onRepeat: () => {
                    particle.y = offsetY + particleRise / 2;
                    particle.alpha = 0.85;
                }
            });
            this.particleTweens.push(tween);
        }
    }

    update() {
        if (!this.skill) return;
        this.container.setPosition(this.skill.x, this.skill.y);
    }

    destroy() {
        this.pulseTween?.stop();
        this.particleTweens?.forEach(t => t.stop());
        this.container?.destroy();
    }
}
