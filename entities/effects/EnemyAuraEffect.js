const DEFAULT_CONFIG = {
    color: 0xffd166,
    radius: 30,
    pulseScale: 1.04,
    alpha: 0.12,
    depthOffset: -1,
    pixelSize: 4,
    ringThickness: 1,
    innerRingScale: 0.78,
    rayCount: 8,
    rayInset: 6,
    rayOutset: 14,
    sparkleCount: 8
};

export default class EnemyAuraEffect {
    constructor(scene, owner, config = {}) {
        this.scene = scene;
        this.owner = owner;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.container = scene.add.container(owner.x, owner.y);
        this.container.setDepth((owner.depth ?? 20) + (this.config.depthOffset ?? -1));

        this.fill = scene.add.graphics();
        this.ring = scene.add.graphics();
        this.sparkleGroup = scene.add.container(0, 0);

        this.container.add([this.fill, this.ring, this.sparkleGroup]);
        this.drawAura();

        this.pulseTween = scene.tweens.add({
            targets: this.container,
            scaleX: this.config.pulseScale,
            scaleY: this.config.pulseScale,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    drawPixelRing(graphics, radius, color, alpha, pixelSize) {
        const points = Math.max(12, Math.round((Math.PI * 2 * radius) / Math.max(4, pixelSize * 2.2)));
        const halfSize = pixelSize / 2;
        graphics.fillStyle(color, alpha);
        for (let i = 0; i < points; i += 1) {
            const angle = (Math.PI * 2 * i) / points;
            const x = Math.round((Math.cos(angle) * radius) / pixelSize) * pixelSize;
            const y = Math.round((Math.sin(angle) * radius) / pixelSize) * pixelSize;
            graphics.fillRect(x - halfSize, y - halfSize, pixelSize, pixelSize);
        }
    }

    drawAura() {
        const color = this.config.color;
        const radius = this.config.radius;
        const pixelSize = this.config.pixelSize ?? 4;
        const alpha = this.config.alpha ?? 0.12;
        const innerRadius = Math.max(pixelSize, radius - (pixelSize * (this.config.ringThickness ?? 1)));
        const innerRingRadius = Math.max(pixelSize * 2, radius * (this.config.innerRingScale ?? 0.78));
        const rayCount = Math.max(4, this.config.rayCount ?? 8);
        const rayInset = Math.max(2, this.config.rayInset ?? 6);
        const rayOutset = Math.max(rayInset + 4, this.config.rayOutset ?? 14);
        const sparkleCount = Math.max(4, this.config.sparkleCount ?? 8);

        this.fill.clear();
        this.ring.clear();
        this.sparkleGroup.removeAll(true);

        this.fill.fillStyle(color, alpha * 0.75);
        this.fill.fillCircle(0, 0, innerRadius);

        this.drawPixelRing(this.ring, radius, color, 0.82, pixelSize);
        this.drawPixelRing(this.ring, innerRingRadius, color, 0.38, Math.max(2, pixelSize - 1));

        this.ring.fillStyle(color, 0.22);
        for (let i = 0; i < rayCount; i += 1) {
            const angle = (Math.PI * 2 * i) / rayCount;
            const startX = Math.round((Math.cos(angle) * (radius + rayInset)) / 2) * 2;
            const startY = Math.round((Math.sin(angle) * (radius + rayInset)) / 2) * 2;
            const endX = Math.round((Math.cos(angle) * (radius + rayOutset)) / 2) * 2;
            const endY = Math.round((Math.sin(angle) * (radius + rayOutset)) / 2) * 2;
            const steps = Math.max(1, Math.round(Phaser.Math.Distance.Between(startX, startY, endX, endY) / 4));
            for (let step = 0; step <= steps; step += 1) {
                const t = step / steps;
                const x = Math.round(Phaser.Math.Linear(startX, endX, t) / 2) * 2;
                const y = Math.round(Phaser.Math.Linear(startY, endY, t) / 2) * 2;
                this.ring.fillRect(x - 1, y - 1, 2, 2);
            }
        }

        for (let i = 0; i < sparkleCount; i += 1) {
            const angle = (Math.PI * 2 * i) / sparkleCount;
            const sparkleRadius = i % 2 === 0 ? radius : innerRingRadius;
            const sparkle = this.scene.add.rectangle(
                Math.round((Math.cos(angle) * sparkleRadius) / pixelSize) * pixelSize,
                Math.round((Math.sin(angle) * sparkleRadius) / pixelSize) * pixelSize,
                pixelSize,
                pixelSize,
                color,
                0.95
            ).setOrigin(0.5);
            this.sparkleGroup.add(sparkle);
            this.scene.tweens.add({
                targets: sparkle,
                alpha: 0.2,
                scaleX: 0.6,
                scaleY: 0.6,
                duration: 320 + (i * 35),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    update() {
        if (!this.owner?.active) return;
        this.container.setPosition(this.owner.x, this.owner.y);
    }

    destroy() {
        this.pulseTween?.stop();
        this.pulseTween = null;
        this.container?.destroy(true);
        this.container = null;
    }
}
