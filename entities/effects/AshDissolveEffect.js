const DEFAULT_CONFIG = {
    duration: 320,
    riseDistance: 10,
    driftX: 4,
    minAlpha: 0.72,
    ashColors: [0xc9c0b6, 0x9a9288, 0x716960, 0x4b4540],
    glowColor: 0xcfc8ba,
    glowAlpha: 0.22,
    glowRadius: 16,
    spiritColor: 0xe9e2d6,
    spiritAlpha: 0.5,
    spiritScale: 0.78,
    particleCount: 10,
    particleSize: { min: 2, max: 5 },
    particleDuration: { min: 180, max: 340 },
    particleSpreadX: 18,
    particleRise: { min: 8, max: 24 }
};

export default class AshDissolveEffect {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    spawn(target, depth = 30, options = {}) {
        if (!this.scene || !target?.texture?.key) return;

        const config = {
            ...this.config,
            ...options,
            particleSize: {
                ...this.config.particleSize,
                ...(options.particleSize ?? {})
            },
            particleDuration: {
                ...this.config.particleDuration,
                ...(options.particleDuration ?? {})
            },
            particleRise: {
                ...this.config.particleRise,
                ...(options.particleRise ?? {})
            }
        };

        const textureKey = target.texture.key;
        const frameName = target.frame?.name ?? null;
        const clone = this.scene.add.sprite(target.x, target.y, textureKey, frameName);
        clone.setDepth(depth);
        clone.setOrigin(target.originX ?? 0.5, target.originY ?? 0.5);
        clone.setFlipX(Boolean(target.flipX));
        clone.setFlipY(Boolean(target.flipY));
        clone.setDisplaySize(
            target.displayWidth || target.width || 32,
            target.displayHeight || target.height || 32
        );
        clone.setAlpha(config.minAlpha);
        clone.setTint(0x7d746c);

        const glow = this.scene.add.circle(
            target.x,
            target.y - Math.max(2, config.riseDistance * 0.2),
            config.glowRadius,
            config.glowColor,
            config.glowAlpha
        );
        glow.setDepth(depth - 1);

        const spirit = this.scene.add.ellipse(
            target.x,
            target.y - Math.max(4, config.riseDistance * 0.45),
            Math.max(8, (target.displayWidth || target.width || 18) * 0.32),
            Math.max(14, (target.displayHeight || target.height || 24) * 0.58),
            config.spiritColor,
            config.spiritAlpha
        );
        spirit.setDepth(depth);
        spirit.setScale(config.spiritScale);

        this.scene.tweens.add({
            targets: clone,
            y: target.y - config.riseDistance,
            x: target.x + Phaser.Math.FloatBetween(-config.driftX, config.driftX),
            alpha: 0,
            scaleX: 0.92,
            scaleY: 0.84,
            duration: config.duration,
            ease: 'Cubic.easeOut',
            onComplete: () => clone.destroy()
        });

        this.scene.tweens.add({
            targets: glow,
            y: glow.y - Math.max(4, config.riseDistance * 0.55),
            alpha: 0,
            scaleX: 1.4,
            scaleY: 1.15,
            duration: Math.max(160, Math.round(config.duration * 0.9)),
            ease: 'Cubic.easeOut',
            onComplete: () => glow.destroy()
        });

        this.scene.tweens.add({
            targets: spirit,
            y: spirit.y - Math.max(10, config.riseDistance * 1.2),
            alpha: 0,
            scaleX: config.spiritScale * 0.78,
            scaleY: config.spiritScale * 1.24,
            duration: Math.max(180, Math.round(config.duration * 0.92)),
            ease: 'Sine.easeOut',
            onComplete: () => spirit.destroy()
        });

        const width = Math.max(10, target.displayWidth || target.width || target.body?.width || 24);
        const height = Math.max(10, target.displayHeight || target.height || target.body?.height || 24);
        const count = Math.max(4, Math.round(config.particleCount ?? 8));
        for (let i = 0; i < count; i += 1) {
            const size = Phaser.Math.Between(config.particleSize.min, config.particleSize.max);
            const particle = this.scene.add.rectangle(
                target.x + Phaser.Math.FloatBetween(-width * 0.32, width * 0.32),
                target.y + Phaser.Math.FloatBetween(-height * 0.18, height * 0.2),
                size,
                size,
                Phaser.Math.RND.pick(config.ashColors),
                0.95
            );
            particle.setDepth(depth + 1);
            particle.setRotation(Phaser.Math.FloatBetween(-0.4, 0.4));
            const duration = Phaser.Math.Between(config.particleDuration.min, config.particleDuration.max);
            const targetX = particle.x + Phaser.Math.FloatBetween(-config.particleSpreadX, config.particleSpreadX);
            const targetY = particle.y - Phaser.Math.Between(config.particleRise.min, config.particleRise.max);

            this.scene.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scaleX: 0.4,
                scaleY: 0.4,
                duration,
                ease: 'Cubic.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }
}
