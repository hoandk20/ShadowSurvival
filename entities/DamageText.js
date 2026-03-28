export default class DamageText extends Phaser.GameObjects.Text {
    constructor(scene, x, y, value, options = {}) {
        const textConfig = {
            fontSize: options.fontSize ?? '7px',
            fontFamily: options.fontFamily ?? '"Press Start 2P", "PixelFont", monospace',
            color: options.color ?? '#ffde59',
            stroke: options.stroke ?? '#000000',
            strokeThickness: options.strokeThickness ?? 2,
            align: 'center',
            resolution: 2
        };
        const displayValue = Math.round(value);
        super(scene, x, y, `-${displayValue}`, textConfig);
        scene.add.existing(this);
        this.setOrigin(0.5);
        this.setDepth(options.depth ?? 60);
        this.scene.tweens.add({
            targets: this,
            y: y - (options.rise ?? 30),
            alpha: 0,
            duration: options.duration ?? 600,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.destroy();
            }
        });
    }
}
