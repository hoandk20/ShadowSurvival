const DEFAULT_CONFIG = {
    coreRadius: 14,
    outerRadius: 28,
    ringRadius: 40,
    coreColor: 0xfff2b3,
    outerColor: 0xff8c42,
    ringColor: 0xff5a36,
    emberColor: 0xffd27a,
    emberCount: 10,
    emberDistance: { min: 16, max: 42 },
    emberDuration: { min: 160, max: 280 }
};

export default class ExplosionEffect {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    spawn(x, y, depth = 40) {
        if (!this.scene) return;

        const flash = this.scene.add.graphics({ x, y });
        flash.setDepth(depth);
        flash.fillStyle(this.config.outerColor, 0.3);
        flash.fillCircle(0, 0, this.config.outerRadius);
        flash.fillStyle(this.config.coreColor, 0.92);
        flash.fillCircle(0, 0, this.config.coreRadius);
        flash.lineStyle(2, this.config.ringColor, 0.85);
        flash.strokeCircle(0, 0, this.config.coreRadius + 4);

        this.scene.tweens.add({
            targets: flash,
            scaleX: 1.4,
            scaleY: 1.4,
            alpha: 0,
            duration: 220,
            ease: 'Cubic.easeOut',
            onComplete: () => flash.destroy()
        });

        const ring = this.scene.add.circle(x, y, this.config.ringRadius, this.config.outerColor, 0);
        ring.setStrokeStyle(2, this.config.ringColor, 0.9);
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

        for (let i = 0; i < this.config.emberCount; i += 1) {
            const ember = this.scene.add.rectangle(x, y, 3, 3, this.config.emberColor, 0.95);
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(
                this.config.emberDistance.min,
                this.config.emberDistance.max
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
                    this.config.emberDuration.min,
                    this.config.emberDuration.max
                ),
                ease: 'Quad.easeOut',
                onComplete: () => ember.destroy()
            });
        }
    }
}
