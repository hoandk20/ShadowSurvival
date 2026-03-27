// entities/Card.js
import { CARD_RARITY_STYLES } from '../config/card.js';

export const CARD_LAYOUT = {
    width: 420,
    height: 120,
    scale: 1,
    hoverScale: 1.05,
    spacingGap: 22,
    padding: 16
};


export default class Card extends Phaser.GameObjects.Container {
    constructor(scene, x, y, cardConfig, onSelect, scaleFactor = 1) {
        super(scene, x, y);
        this.cardConfig = cardConfig;
        this.onSelect = onSelect;
        const width = CARD_LAYOUT.width;
        const height = CARD_LAYOUT.height;
        const cardScale = CARD_LAYOUT.scale * scaleFactor;
        const hoverScale = CARD_LAYOUT.hoverScale * scaleFactor;
        const bgWidth = width * cardScale + CARD_LAYOUT.padding;
        const bgHeight = height * cardScale + CARD_LAYOUT.padding;
        const rarity = cardConfig.rarity || 'common';
        const style = CARD_RARITY_STYLES[rarity] || CARD_RARITY_STYLES.common;
        const glow = scene.add.rectangle(0, 0, bgWidth + 18, bgHeight + 18, style.glow)
            .setOrigin(0.5)
            .setAlpha(0.28);
        const background = scene.add.rectangle(0, 0, bgWidth, bgHeight, 0x05030a)
            .setOrigin(0.5)
            .setStrokeStyle(3, style.border);
        const gradient = scene.add.graphics();
        gradient.fillStyle(0x08020b, 0.5);
        gradient.fillRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);
        gradient.fillGradientStyle(0x1a0312, 0x08020b, 0x05010a, 0x0c0211, 0.6);
        gradient.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 8);
        const vignette = scene.add.graphics();
        vignette.fillStyle(0x000000, 0.35);
        vignette.fillEllipse(0, 0, bgWidth * 0.9, bgHeight * 0.9);
        vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);
        const fog = scene.add.rectangle(0, 0, bgWidth + 20, bgHeight + 20, 0x0c0410, 0.12)
            .setOrigin(0.5);
        const accentBar = scene.add.rectangle(0, -bgHeight / 2 + 18, bgWidth - 36, 26, style.border)
            .setOrigin(0.5);
        const pixelLeft = scene.add.rectangle(-bgWidth / 2 + 18, -bgHeight / 2 + 18, 10, 10, 0xffc759).setOrigin(0.5);
        const pixelRight = scene.add.rectangle(bgWidth / 2 - 18, -bgHeight / 2 + 18, 10, 10, 0xffc759).setOrigin(0.5);
        const iconContainer = scene.add.container(-bgWidth / 2 + 72, 0);
        const iconGlow = scene.add.circle(0, 0, 46, style.glow).setAlpha(0.18);
        const iconRing = scene.add.circle(0, 0, 36, 0x090d12).setStrokeStyle(2, style.border);
        const iconKey = `card_icon_${cardConfig.key}`;
        const iconTexture = scene.textures.exists(iconKey) ? iconKey : '__missing_texture__';
        const iconImage = scene.add.image(0, 0, iconTexture)
            .setDisplaySize(64, 64)
            .setAngle(cardConfig.iconRotation || 0)
            .setOrigin(0.5)
            .setTint(style.border);
        iconContainer.add([iconGlow, iconRing, iconImage]);
        const shadowLayer = scene.add.rectangle(0, 0, 88, 88, 0x020103)
            .setOrigin(0.5)
            .setAlpha(0.1);
        const spikeLeft = scene.add.rectangle(-bgWidth / 2 + 6, -bgHeight / 2 + 14, 8, 18, 0x2c0507).setOrigin(0.5);
        const spikeRight = scene.add.rectangle(bgWidth / 2 - 6, -bgHeight / 2 + 14, 8, 18, 0x2c0507).setOrigin(0.5);
        iconContainer.add(shadowLayer);
        const textStartX = -bgWidth / 2 + 160;
        const availableTextWidth = bgWidth - (textStartX + bgWidth / 2 - 30);
        const textWidth = Math.max(160, availableTextWidth);
        const title = scene.add.text(textStartX, -20, cardConfig.name, {
            fontSize: '28px',
            fontFamily: 'Press Start 2P, Arial',
            color: '#fefefe',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0.5);
        title.setShadow(2, 2, '#000000', 3, true, true);
        const spacing = this.scene.scale.width < 600 ? 14 : 28;
        const descriptionY = -20 + spacing;
        const description = scene.add.text(textStartX, descriptionY, cardConfig.description, {
            fontSize: '22px',
            fontFamily: 'Press Start 2P, Arial',
            color: '#ffe8c3',
            align: 'left',
            wordWrap: { width: textWidth }
        }).setOrigin(0, 0.5);
        description.setShadow(1, 1, '#000000', 2, true, true);
        const badge = scene.add.rectangle(bgWidth / 2 - 90, bgHeight / 2 - 22, 140, 28, style.badge)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x000000, 0.3);
        scene.tweens.add({
            targets: badge,
            alpha: { from: 0.6, to: 1 },
            duration: 2200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        const badgeText = scene.add.text(badge.x, badge.y, rarity.toUpperCase(), {
            fontSize: '10px',
            fontFamily: 'Press Start 2P, Arial',
            color: '#0d0d0d'
        }).setOrigin(0.5);

        const hitArea = scene.add.zone(0, 0, bgWidth, bgHeight).setOrigin(0.5);
        hitArea.setInteractive();
        this.add([glow, gradient, background, vignette, fog, accentBar, pixelLeft, pixelRight, spikeLeft, spikeRight, iconContainer, title, description, badge, badgeText, hitArea]);
        scene.add.existing(this);
        this.setSize(width, height);
        this.baseScale = cardScale;
        this.hoverScale = hoverScale;
        this.pointerHover = false;
        this.keyboardFocus = false;
        this.updateScale();

        scene.tweens.add({
            targets: glow,
            alpha: { from: 0.2, to: 0.55 },
            yoyo: true,
            repeat: -1,
            duration: 2400,
            ease: 'Sine.easeInOut'
        });
        scene.tweens.add({
            targets: iconGlow,
            alpha: { from: 0.1, to: 0.4 },
            yoyo: true,
            repeat: -1,
            duration: 2000,
            ease: 'Sine.easeInOut'
        });

        hitArea
            .on('pointerover', () => {
                this.pointerHover = true;
                this.updateScale();
            })
            .on('pointerout', () => {
                this.pointerHover = false;
                this.updateScale();
            })
            .on('pointerdown', () => {
                if (this.onSelect) this.onSelect(this.cardConfig);
            });
    }

    updateScale() {
        const targetScale = this.keyboardFocus || this.pointerHover ? this.hoverScale : this.baseScale;
        this.setScale(targetScale);
    }

    setFocus(focused) {
        this.keyboardFocus = focused;
        this.updateScale();
    }
}
