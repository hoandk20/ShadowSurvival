const DEFAULT_CONFIG = {
    color: 0xffd166,
    radius: 30,
    pulseScale: 1.04,
    alpha: 0.12,
    depthOffset: -1
};

export default class EnemyAuraEffect {
    constructor(scene, owner, config = {}) {
        this.scene = scene;
        this.owner = owner;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.container = scene.add.container(owner.x, owner.y);
        this.container.setDepth((owner.depth ?? 20) + (this.config.depthOffset ?? -1));

        this.ring = scene.add.circle(0, 0, this.config.radius, this.config.color, this.config.alpha);
        this.ring.setStrokeStyle(1, this.config.color, 0.28);
        this.ring.setBlendMode(Phaser.BlendModes.ADD);

        this.container.add(this.ring);
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
