// entities/Card.js
import { CARD_RARITY_STYLES } from '../config/card.js';

export const CARD_LAYOUT = {
    width: 452,
    height: 176,
    scale: 1,
    hoverScale: 1.04,
    spacingGap: 22,
    padding: 20
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
            .setAlpha(0.12);
        const background = scene.add.rectangle(0, 0, bgWidth, bgHeight, 0x0b1220)
            .setOrigin(0.5)
            .setStrokeStyle(4, style.border);
        const gradient = scene.add.graphics();
        gradient.fillStyle(0x0b1220, 0.98);
        gradient.fillRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);
        gradient.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 6);
        const vignette = scene.add.graphics();
        vignette.fillStyle(0x000000, 0.08);
        vignette.fillEllipse(0, 0, bgWidth * 0.92, bgHeight * 0.88);
        vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);
        const fog = scene.add.rectangle(0, 0, bgWidth + 20, bgHeight + 20, 0xffffff, 0.02)
            .setOrigin(0.5);
        const accentBar = scene.add.rectangle(0, -bgHeight / 2 + 22, bgWidth - 36, 22, 0x324766)
            .setOrigin(0.5);
        const iconContainer = scene.add.container(-bgWidth / 2 + 72, 0);
        const iconGlow = scene.add.circle(0, 0, 40, style.glow).setAlpha(0.12);
        const iconRing = scene.add.circle(0, 0, 32, 0x0f1724).setStrokeStyle(2, style.border);
        const iconKey = `card_icon_${cardConfig.key}`;
        const iconTexture = scene.textures.exists(iconKey) ? iconKey : '__missing_texture__';
        const iconImage = scene.add.image(0, 0, iconTexture)
            .setDisplaySize(58, 58)
            .setAngle(cardConfig.iconRotation || 0)
            .setOrigin(0.5)
            .setTint(0xf4f7ff);
        iconContainer.add([iconGlow, iconRing, iconImage]);
        const shadowLayer = scene.add.rectangle(0, 0, 76, 76, 0x020103)
            .setOrigin(0.5)
            .setAlpha(0.1);
        iconContainer.add(shadowLayer);
        const textStartX = -bgWidth / 2 + 150;
        const availableTextWidth = bgWidth - (textStartX + bgWidth / 2 - 36);
        const textWidth = Math.max(180, Math.min(300, availableTextWidth));
        const title = scene.add.text(textStartX, -46, cardConfig.name, {
            fontSize: '32px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#eff5ff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);
        title.setShadow(2, 2, '#000000', 4, true, true);
        const description = scene.add.text(textStartX, 18, cardConfig.description, {
            fontSize: '24px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#f3f8ff',
            align: 'left',
            wordWrap: { width: textWidth },
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0, 0.5);
        description.setLineSpacing(10);
        description.setShadow(2, 2, '#000000', 3, true, true);
        const badge = scene.add.rectangle(bgWidth / 2 - 96, bgHeight / 2 - 28, 132, 30, style.badge)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x000000, 0.2);
        scene.tweens.add({
            targets: badge,
            alpha: { from: 0.65, to: 1 },
            duration: 2200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        const badgeText = scene.add.text(badge.x, badge.y, rarity.toUpperCase(), {
            fontSize: '14px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#10131c',
            stroke: '#ffffff',
            strokeThickness: 1
        }).setOrigin(0.5);

        const hitArea = scene.add.zone(0, 0, bgWidth, bgHeight).setOrigin(0.5);
        hitArea.setInteractive();
        this.add([glow, gradient, background, vignette, fog, accentBar, iconContainer, title, description, badge, badgeText, hitArea]);
        scene.add.existing(this);
        this.setSize(width, height);
        this.baseScale = cardScale;
        this.hoverScale = hoverScale;
        this.pointerHover = false;
        this.pointerPress = false;
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
                this.pointerPress = false;
                this.updateScale();
            })
            .on('pointerdown', () => {
                this.pointerPress = true;
                this.updateScale();
                if (this.onSelect) this.onSelect(this.cardConfig);
            })
            .on('pointerup', () => {
                this.pointerPress = false;
                this.updateScale();
            });
    }

    updateScale() {
        const targetScale = this.keyboardFocus || this.pointerHover || this.pointerPress ? this.hoverScale : this.baseScale;
        this.setScale(targetScale);
    }

    setFocus(focused) {
        this.keyboardFocus = focused;
        this.updateScale();
    }
}
