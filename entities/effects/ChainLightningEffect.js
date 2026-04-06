const CHAIN_LIGHTNING_PARTICLE_KEY = 'chain_lightning_particle_fx';

const DEFAULT_CONFIG = {
    color: 0x8ce8ff,
    glowColor: 0xe8feff,
    thickness: 2,
    glowThickness: 4,
    alpha: 0.95,
    duration: 120,
    particleCount: 9,
    particleSpread: 10,
    particleTravel: 18
};

export default class ChainLightningEffect {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.ensureParticleTexture();
    }

    ensureParticleTexture() {
        if (!this.scene || this.scene.textures.exists(CHAIN_LIGHTNING_PARTICLE_KEY)) return;
        const canvas = this.scene.textures.createCanvas(CHAIN_LIGHTNING_PARTICLE_KEY, 2, 2);
        canvas.context.fillStyle = '#ffffff';
        canvas.context.fillRect(0, 0, 2, 2);
        canvas.refresh();
    }

    spawn(fromPoint, toPoint, depth = 50, options = {}) {
        if (!this.scene || !fromPoint || !toPoint) return;
        const config = { ...this.config, ...options };
        const alphaMul = Phaser.Math.Clamp(config.alphaMultiplier ?? 1, 0, 1);
        const fromX = fromPoint.x ?? 0;
        const fromY = fromPoint.y ?? 0;
        const toX = toPoint.x ?? 0;
        const toY = toPoint.y ?? 0;
        const graphics = this.scene.add.graphics();
        graphics.setDepth(depth);
        graphics.setAlpha(alphaMul);

        const points = this.buildBoltPoints(fromX, fromY, toX, toY);
        this.drawBolt(graphics, points, config);
        this.spawnParticles(points, depth + 1, config);

        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: config.duration,
            ease: 'Cubic.easeOut',
            onComplete: () => graphics.destroy()
        });
    }

    buildBoltPoints(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.max(1, Math.sqrt((dx * dx) + (dy * dy)));
        const normalX = -dy / distance;
        const normalY = dx / distance;
        const segments = Math.max(4, Math.round(distance / 18));
        const points = [{ x: fromX, y: fromY }];

        for (let index = 1; index < segments; index += 1) {
            const t = index / segments;
            const jitter = Phaser.Math.Between(-8, 8);
            points.push({
                x: fromX + (dx * t) + (normalX * jitter),
                y: fromY + (dy * t) + (normalY * jitter)
            });
        }

        points.push({ x: toX, y: toY });
        return points;
    }

    drawBolt(graphics, points, config) {
        const alphaMul = Phaser.Math.Clamp(config.alphaMultiplier ?? 1, 0, 1);
        graphics.lineStyle(config.glowThickness, config.glowColor, config.alpha * 0.45 * alphaMul);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let index = 1; index < points.length; index += 1) {
            graphics.lineTo(points[index].x, points[index].y);
        }
        graphics.strokePath();

        graphics.lineStyle(config.thickness, config.color, config.alpha * alphaMul);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let index = 1; index < points.length; index += 1) {
            graphics.lineTo(points[index].x, points[index].y);
        }
        graphics.strokePath();
    }

    spawnParticles(points, depth, config) {
        const alphaMul = Phaser.Math.Clamp(config.alphaMultiplier ?? 1, 0, 1);
        for (let index = 0; index < config.particleCount; index += 1) {
            const t = index / Math.max(1, config.particleCount - 1);
            const pointIndex = Math.min(points.length - 1, Math.round(t * (points.length - 1)));
            const anchor = points[pointIndex];
            const particle = this.scene.add.image(
                anchor.x + Phaser.Math.Between(-config.particleSpread, config.particleSpread),
                anchor.y + Phaser.Math.Between(-config.particleSpread, config.particleSpread),
                CHAIN_LIGHTNING_PARTICLE_KEY
            );
            particle.setDepth(depth);
            particle.setTint(index % 2 === 0 ? config.color : config.glowColor);
            particle.setBlendMode(Phaser.BlendModes.ADD);
            particle.setScale(Phaser.Math.FloatBetween(0.8, 1.8));
            particle.setAlpha(alphaMul);

            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Phaser.Math.Between(-config.particleTravel, config.particleTravel),
                y: particle.y + Phaser.Math.Between(-config.particleTravel, config.particleTravel),
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: config.duration + Phaser.Math.Between(20, 80),
                ease: 'Quad.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }
}
