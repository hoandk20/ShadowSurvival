// entities/effects/CriticalHitEffect.js
const DEFAULT_CONFIG = {
    glowRadii: [4, 3, 2, 1],
    glowColors: [0x101010, 0x2a2a2a, 0x444444, 0xffffff],
    rayVectors: [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: -0.7, dy: -0.7 },
        { dx: 0.7, dy: -0.7 },
        { dx: -0.7, dy: 0.7 },
        { dx: 0.7, dy: 0.7 }
    ],
    rayLineColor: 0x888888,
    rayLengthStart: 4,
    rayLengthEnd: 6,
    sparkCount: 12,
    sparkSpeed: { min: 30, max: 90 },
    sparkTravelFactor: 0.1,
    sparkTints: [0xddddff, 0xbbbbcc],
    sparkScale: { min: 0.2, max: 0.35 },
    sparkDuration: { min: 180, max: 320 }
};

export default class CriticalHitEffect {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.ensureSparkTexture();
    }

    ensureSparkTexture() {
        if (!this.scene.textures.exists('spark_pixel')) {
            const canvas = this.scene.textures.createCanvas('spark_pixel', 2, 2);
            const ctx = canvas.context;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 2, 2);
            canvas.refresh();
        }
    }

    spawn(target, override = {}) {
        if (!target) return;
        const cfg = { ...this.config, ...override };
        const {
            glowRadii,
            glowColors,
            rayVectors,
            rayLineColor,
            rayLengthStart,
            rayLengthEnd,
            sparkCount,
            sparkSpeed,
            sparkTravelFactor,
            sparkTints,
            sparkScale
        } = cfg;
        const sparkDuration = cfg.sparkDuration ?? DEFAULT_CONFIG.sparkDuration;
        const minDuration = Math.max(0, sparkDuration?.min ?? 0);
        const maxDuration = Math.max(minDuration, sparkDuration?.max ?? minDuration);
        const flash = this.scene.add.graphics({ x: target.x, y: target.y });
        flash.setDepth((target.depth ?? 0) + 2);
        for (let i = 0; i < glowRadii.length; i += 1) {
            flash.fillStyle(glowColors[i], 1);
            flash.fillCircle(0, 0, glowRadii[i]);
        }
        flash.lineStyle(2, rayLineColor, 0.85);
        rayVectors.forEach(({ dx, dy }) => {
            const startX = dx * rayLengthStart;
            const startY = dy * rayLengthStart;
            const endX = dx * rayLengthEnd;
            const endY = dy * rayLengthEnd;
            flash.strokeRect(startX - 2, startY - 2, 4, 4);
            flash.lineBetween(startX, startY, endX, endY);
        });
        for (let i = 0; i < sparkCount; i += 1) {
            const spark = this.scene.add.image(target.x, target.y, 'spark_pixel');
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const speed = Phaser.Math.FloatBetween(sparkSpeed.min, sparkSpeed.max);
            const dist = speed * sparkTravelFactor;
            const offsetX = Math.cos(angle) * dist;
            const offsetY = Math.sin(angle) * dist;
            spark.setBlendMode(Phaser.BlendModes.ADD);
            spark.setTint(Phaser.Math.RND.pick(sparkTints));
            spark.setScale(Phaser.Math.FloatBetween(sparkScale.min, sparkScale.max));
            spark.setDepth((target.depth ?? 0) + 3);
            this.scene.tweens.add({
                targets: spark,
                x: target.x + offsetX,
                y: target.y + offsetY + Phaser.Math.FloatBetween(10, 30),
                alpha: 0,
                scale: 0,
            duration: Phaser.Math.Between(minDuration, maxDuration),
                ease: 'Quad.easeOut',
                onComplete: () => spark.destroy()
            });
        }
        this.scene.tweens.add({
            targets: flash,
            scaleX: 1.8,
            scaleY: 1.8,
            alpha: 0,
            duration: 240,
            ease: 'Cubic.easeOut',
            onComplete: () => flash.destroy()
        });
    }
}
