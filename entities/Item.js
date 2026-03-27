import { ITEM_CONFIG } from '../config/items.js';

export default class Item extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, itemKey, amount = 1) {
        const config = ITEM_CONFIG[itemKey] ?? {};
        const textureKey = config.textureKey ?? itemKey;
        super(scene, x, y, textureKey);
        this.scene = scene;
        this.config = config;
        this.amount = Math.max(1, amount);
        this.valueMultiplier = config.baseValue ?? 1;
        this.collected = false;
        this.floatBaseY = y;
        this.isMagnetized = false;
        this.floatAmplitude = config.floatAmplitude ?? 4;
        this.floatSpeed = config.floatSpeed ?? 0.005;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.body.setBounce(0.2, 0.2);
        this.body.setDrag(10, 10);
        this.body.setCollideWorldBounds(true);
        this.setDepth(12);
        this.setOrigin(0.5);
        const displaySize = Math.max(config.displaySize ?? config.size ?? 16, 8);
        const naturalWidth = this.frame?.realWidth ?? this.frame?.width ?? this.texture?.source?.[0]?.width ?? 32;
        const naturalHeight = this.frame?.realHeight ?? this.frame?.height ?? this.texture?.source?.[0]?.height ?? 32;
        const maxNatural = Math.max(naturalWidth, naturalHeight, 1);
        const displayScale = config.displayScale ?? 1;
        const finalDisplaySize = Math.max(displaySize * displayScale, 1);
        this.setDisplaySize(finalDisplaySize, finalDisplaySize);
        this.setAlpha(config.alpha ?? 0.95);
        const size = finalDisplaySize;
        if (this.body?.setCircle) {
            const radius = size / 2;
            this.body.setCircle(radius, (this.displayWidth - radius) / 2, (this.displayHeight - radius) / 2);
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.isMagnetized) {
            this.floatBaseY = this.y;
            return;
        }
        if (!this.floatBaseY) {
            this.floatBaseY = this.y;
        }
        const offset = Math.sin(time * this.floatSpeed) * this.floatAmplitude;
        this.setY(this.floatBaseY + offset);
    }

    collect(player) {
        if (this.collected || !player) return;
        this.collected = true;
        if (this.body) {
            this.body.enable = false;
            this.body.stop();
        }
        this.setActive(false);
        this.setVisible(false);
        this.applyTo(player);
    }

    applyTo(player) {
        if (!player || player.isDead) {
            this.destroy();
            return;
        }
        const type = this.config?.type;
        const effectiveValue = this.getEffectiveValue();
        switch (type) {
            case 'xp':
                player.addXP(effectiveValue);
                break;
            case 'gold':
                player.addGold(effectiveValue);
                break;
            case 'health':
                player.heal(effectiveValue);
                break;
            default:
                player.addXP?.(effectiveValue);
        }
        this.playPickupText();
        this.destroy();
    }

    getEffectiveValue() {
        return Math.max(1, Math.round(this.amount * (this.valueMultiplier ?? 1)));
    }

    playPickupText() {
        const text = this.scene.add.text(this.x, this.y - 12, `+${this.getEffectiveValue()}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: this.config.pickupTextColor ?? '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(70);
        this.scene.tweens.add({
            targets: text,
            y: text.y - 20,
            alpha: 0,
            duration: 420,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy()
        });
    }
}
