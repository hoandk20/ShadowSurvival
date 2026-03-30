const DEFAULT_CONFIG = {
    depthOffset: 7,
    ringColor: 0x95ecff,
    ringSecondaryColor: 0x49b8ff,
    glowColor: 0xcff8ff,
    bubbleColor: 0xe8fdff,
    radiusX: 26,
    radiusY: 34,
    orbitRadiusX: 18,
    orbitRadiusY: 24,
    pulseScale: 1.05
};

export default class WaterShieldEffect {
    constructor(scene, skill, config = {}) {
        this.scene = scene;
        this.skill = skill;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.container = scene.add.container(skill.x, skill.y);
        const ownerDepth = skill.owner?.depth ?? 0;
        this.container.setDepth(ownerDepth + (this.config.depthOffset ?? DEFAULT_CONFIG.depthOffset));
        this.container.setAlpha(0.92);

        this.glow = scene.add.graphics();
        this.ring = scene.add.graphics();
        this.highlight = scene.add.graphics();
        this.bubbles = [];
        this.bubbleSeeds = [
            { angle: 0, speed: 0.0016, size: 3 },
            { angle: Math.PI * 0.66, speed: 0.0012, size: 2 },
            { angle: Math.PI * 1.25, speed: 0.00145, size: 2.5 }
        ];

        this.drawShell();
        this.container.add([this.glow, this.ring, this.highlight]);
        this.bubbleSeeds.forEach(() => {
            const bubble = scene.add.circle(0, 0, 2, this.config.bubbleColor, 0.9);
            this.bubbles.push(bubble);
            this.container.add(bubble);
        });

        this.pulseTween = scene.tweens.add({
            targets: this.container,
            scaleX: this.config.pulseScale,
            scaleY: this.config.pulseScale,
            duration: 900,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    drawShell() {
        const { radiusX, radiusY, glowColor, ringColor, ringSecondaryColor } = this.config;
        this.glow.clear();
        this.glow.fillStyle(glowColor, 0.16);
        this.glow.fillEllipse(0, 0, radiusX * 2.35, radiusY * 2.15);

        this.ring.clear();
        this.ring.lineStyle(3, ringColor, 0.78);
        this.ring.strokeEllipse(0, 0, radiusX * 2, radiusY * 2);
        this.ring.lineStyle(2, ringSecondaryColor, 0.42);
        this.ring.strokeEllipse(0, 2, radiusX * 1.64, radiusY * 1.72);

        this.highlight.clear();
        this.highlight.lineStyle(2, 0xffffff, 0.55);
        this.highlight.beginPath();
        this.highlight.arc(-radiusX * 0.18, -radiusY * 0.22, radiusX * 0.52, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(320), false);
        this.highlight.strokePath();
    }

    update(_time, delta) {
        if (!this.skill?.owner || !this.container) return;
        this.container.setPosition(this.skill.owner.x, this.skill.owner.y - 4);
        this.bubbles.forEach((bubble, index) => {
            const seed = this.bubbleSeeds[index];
            seed.angle += seed.speed * delta;
            bubble.setRadius(seed.size);
            bubble.x = Math.cos(seed.angle) * this.config.orbitRadiusX;
            bubble.y = Math.sin(seed.angle) * this.config.orbitRadiusY;
            bubble.alpha = 0.55 + Math.sin(seed.angle * 2.2) * 0.2;
        });
    }

    destroy() {
        this.pulseTween?.stop();
        this.container?.destroy();
        this.container = null;
    }
}
