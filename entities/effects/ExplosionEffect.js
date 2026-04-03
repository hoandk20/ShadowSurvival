const DEFAULT_CONFIG = {
    coreRadius: 7,
    outerRadius: 14,
    ringRadius: 20,
    coreColor: 0xfff2b3,
    outerColor: 0xff8c42,
    ringColor: 0xff5a36,
    emberColor: 0xffd27a,
    emberCount: 10,
    emberDistance: { min: 8, max: 21 },
    emberDuration: { min: 160, max: 280 },
    style: 'default'
};

export default class ExplosionEffect {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    spawn(x, y, depth = 40, options = {}) {
        if (!this.scene) return;

        const config = {
            ...this.config,
            ...options,
            emberDistance: {
                ...this.config.emberDistance,
                ...(options.emberDistance ?? {})
            },
            emberDuration: {
                ...this.config.emberDuration,
                ...(options.emberDuration ?? {})
            }
        };

        if (config.style === 'pixelFlame') {
            this.spawnPixelFlame(x, y, depth, config);
            return;
        }

        this.spawnDefault(x, y, depth, config);
    }

    spawnDefault(x, y, depth, config) {
        const flash = this.scene.add.graphics({ x, y });
        flash.setDepth(depth);
        flash.fillStyle(config.outerColor, 0.3);
        flash.fillCircle(0, 0, config.outerRadius);
        flash.fillStyle(config.coreColor, 0.92);
        flash.fillCircle(0, 0, config.coreRadius);
        flash.lineStyle(2, config.ringColor, 0.85);
        flash.strokeCircle(0, 0, config.coreRadius + 4);

        this.scene.tweens.add({
            targets: flash,
            scaleX: 1.4,
            scaleY: 1.4,
            alpha: 0,
            duration: 220,
            ease: 'Cubic.easeOut',
            onComplete: () => flash.destroy()
        });

        const ring = this.scene.add.circle(x, y, config.ringRadius, config.outerColor, 0);
        ring.setStrokeStyle(2, config.ringColor, 0.9);
        ring.setDepth(depth - 1);

        this.scene.tweens.add({
            targets: ring,
            scaleX: 1.35,
            scaleY: 1.35,
            alpha: 0,
            duration: 240,
            ease: 'Quad.easeOut',
            onComplete: () => ring.destroy()
        });

        for (let i = 0; i < config.emberCount; i += 1) {
            const ember = this.scene.add.rectangle(x, y, 3, 3, config.emberColor, 0.95);
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(
                config.emberDistance.min,
                config.emberDistance.max
            );
            ember.setDepth(depth + 1);
            ember.setRotation(angle);

            this.scene.tweens.add({
                targets: ember,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scaleX: 0.2,
                scaleY: 0.2,
                duration: Phaser.Math.Between(
                    config.emberDuration.min,
                    config.emberDuration.max
                ),
                ease: 'Quad.easeOut',
                onComplete: () => ember.destroy()
            });
        }
    }

    spawnPixelFlame(x, y, depth, config) {
        const pixelSize = config.pixelSize ?? 4;
        const burst = this.scene.add.container(x, y);
        burst.setDepth(depth);

        if ((config.ringRadius ?? 0) > 0) {
            const shockwave = this.scene.add.circle(x, y, config.ringRadius, config.outerColor ?? config.ringColor ?? 0xff8c42, 0);
            shockwave.setStrokeStyle(Math.max(2, Math.round(pixelSize * 0.75)), config.ringColor ?? 0xff5a36, 0.95);
            shockwave.setDepth(depth - 1);

            this.scene.tweens.add({
                targets: shockwave,
                scaleX: 1.08,
                scaleY: 1.08,
                alpha: 0,
                duration: Math.max(180, config.duration ?? 190),
                ease: 'Quad.easeOut',
                onComplete: () => shockwave.destroy()
            });
        }

        const layers = [
            { radius: config.outerRadius ?? 34, color: config.ringColor ?? 0xff5a36, density: 18, size: pixelSize },
            { radius: (config.coreRadius ?? 14) + 14, color: config.outerColor ?? 0xff8c42, density: 14, size: pixelSize + 1 },
            { radius: config.coreRadius ?? 14, color: config.coreColor ?? 0xfff2b3, density: 8, size: pixelSize + 2 }
        ];

        const blocks = [];

        layers.forEach((layer, layerIndex) => {
            for (let i = 0; i < layer.density; i += 1) {
                const angle = (Math.PI * 2 * i) / layer.density;
                const distance = Phaser.Math.Between(
                    Math.max(4, Math.floor(layer.radius * 0.35)),
                    layer.radius
                );
                const offsetX = Math.round((Math.cos(angle) * distance) / pixelSize) * pixelSize;
                const offsetY = Math.round((Math.sin(angle) * distance) / pixelSize) * pixelSize;
                const size = layer.size + ((i + layerIndex) % 2 === 0 ? 0 : pixelSize);
                const block = this.scene.add.rectangle(offsetX, offsetY, size, size, layer.color, 1)
                    .setOrigin(0.5);
                burst.add(block);
                blocks.push(block);
            }
        });

        const core = this.scene.add.rectangle(0, 0, pixelSize * 4, pixelSize * 4, config.coreColor, 1)
            .setOrigin(0.5);
        burst.add(core);
        blocks.push(core);

        this.scene.tweens.add({
            targets: burst,
            alpha: 0,
            scaleX: 1.18,
            scaleY: 1.18,
            duration: config.duration ?? 190,
            ease: 'Stepped(5)',
            onComplete: () => burst.destroy()
        });

        blocks.forEach((block, index) => {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(
                config.emberDistance.min,
                config.emberDistance.max
            );
            const targetX = Math.round((Math.cos(angle) * distance) / pixelSize) * pixelSize;
            const targetY = Math.round((Math.sin(angle) * distance) / pixelSize) * pixelSize;
            const targetScale = index < 6 ? 1.15 : 0.55;

            this.scene.tweens.add({
                targets: block,
                x: block.x + targetX,
                y: block.y + targetY,
                scaleX: targetScale,
                scaleY: targetScale,
                alpha: 0,
                duration: Phaser.Math.Between(
                    config.emberDuration.min,
                    config.emberDuration.max
                ),
                ease: 'Stepped(4)'
            });
        });

    }
}
