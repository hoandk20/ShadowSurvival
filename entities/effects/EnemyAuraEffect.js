const DEFAULT_CONFIG = {
    color: 0xffd166,
    radius: 30,
    pulseScale: 1.04,
    alpha: 0.12,
    depthOffset: -1,
    pixelSize: 4,
    ringThickness: 1
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
            duration: 840,
            yoyo: true,
            repeat: -1,
            ease: 'Stepped(4)'
        });
    }

    drawAura() {
        const color = this.config.color;
        const radius = this.config.radius;
        const pixelSize = this.config.pixelSize ?? 4;
        const alpha = this.config.alpha ?? 0.12;
        const halfSize = pixelSize / 2;
        const innerRadius = Math.max(pixelSize, radius - (pixelSize * (this.config.ringThickness ?? 1)));
        const sampleStep = Math.max(10, Math.round(360 / Math.max(12, Math.floor((radius * 2) / pixelSize))));
        const usedCells = new Set();

        this.fill.clear();
        this.ring.clear();
        this.sparkleGroup.removeAll(true);

        this.fill.fillStyle(color, alpha * 0.75);
        this.fill.fillCircle(0, 0, innerRadius);

        for (let angleDeg = 0; angleDeg < 360; angleDeg += sampleStep) {
            const angle = Phaser.Math.DegToRad(angleDeg);
            const x = Math.round((Math.cos(angle) * radius) / pixelSize) * pixelSize;
            const y = Math.round((Math.sin(angle) * radius) / pixelSize) * pixelSize;
            const cellKey = `${x}:${y}`;
            if (usedCells.has(cellKey)) continue;
            usedCells.add(cellKey);
            this.ring.fillStyle(color, 0.78);
            this.ring.fillRect(x - halfSize, y - halfSize, pixelSize, pixelSize);
        }

        const sparkleOffsets = [
            { x: 0, y: -radius },
            { x: radius, y: 0 },
            { x: 0, y: radius },
            { x: -radius, y: 0 }
        ];
        sparkleOffsets.forEach((offset, index) => {
            const sparkle = this.scene.add.rectangle(
                Math.round(offset.x / pixelSize) * pixelSize,
                Math.round(offset.y / pixelSize) * pixelSize,
                pixelSize,
                pixelSize,
                color,
                0.95
            ).setOrigin(0.5);
            this.sparkleGroup.add(sparkle);
            this.scene.tweens.add({
                targets: sparkle,
                alpha: 0.25,
                duration: 280 + (index * 40),
                yoyo: true,
                repeat: -1,
                ease: 'Stepped(2)'
            });
        });
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
