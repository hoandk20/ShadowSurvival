export default class SupporterOrbEffect {
    constructor(scene, orb, options = {}) {
        this.scene = scene;
        this.orb = orb;
        this.trailColor = options.trailColor ?? 0xffffff;
        this.burstColor = options.burstColor ?? this.trailColor;
        this.lastTrailAt = 0;
        this.trailIntervalMs = Math.max(24, options.trailIntervalMs ?? 36);
    }

    update(time) {
        if (!this.scene || !this.orb?.active) return;
        if ((time - this.lastTrailAt) < this.trailIntervalMs) return;
        this.lastTrailAt = time;
        const puff = this.scene.add.circle(this.orb.x, this.orb.y, 2, this.trailColor, 0.65);
        puff.setDepth((this.orb.depth ?? 40) - 1);
        this.scene.tweens.add({
            targets: puff,
            alpha: 0,
            scaleX: 0.25,
            scaleY: 0.25,
            duration: 180,
            onComplete: () => puff.destroy()
        });
    }

    spawnLaunchPulse() {
        if (!this.scene || !this.orb) return;
        const pulse = this.scene.add.circle(this.orb.x, this.orb.y, 5, this.burstColor, 0.4);
        pulse.setDepth((this.orb.depth ?? 40) - 1);
        this.scene.tweens.add({
            targets: pulse,
            alpha: 0,
            scaleX: 1.8,
            scaleY: 1.8,
            duration: 180,
            onComplete: () => pulse.destroy()
        });
    }

    spawnImpactBurst(x, y) {
        if (!this.scene) return;
        for (let index = 0; index < 5; index += 1) {
            const angle = (Math.PI * 2 * index) / 5;
            const spark = this.scene.add.circle(x, y, 2, this.burstColor, 0.95);
            spark.setDepth((this.orb?.depth ?? 40) + 1);
            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * 12,
                y: y + Math.sin(angle) * 12,
                alpha: 0,
                scaleX: 0.35,
                scaleY: 0.35,
                duration: 220,
                ease: 'Quad.easeOut',
                onComplete: () => spark.destroy()
            });
        }
    }
}
