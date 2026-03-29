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
        const bgWidth = width + CARD_LAYOUT.padding;
        const bgHeight = height + CARD_LAYOUT.padding;
        const rarity = cardConfig.rarity || 'common';
        const style = CARD_RARITY_STYLES[rarity] || CARD_RARITY_STYLES.common;
        const drawFrame = (graphics, xPos, yPos, frameWidth, frameHeight, palette, inset = 0) => {
            const left = xPos - frameWidth / 2;
            const top = yPos - frameHeight / 2;
            graphics.fillStyle(palette.shadow, 1);
            graphics.fillRect(left + inset, top + inset, frameWidth - inset * 2, frameHeight - inset * 2);
            graphics.fillStyle(palette.panel, 1);
            graphics.fillRect(left + 4 + inset, top + 4 + inset, frameWidth - 8 - inset * 2, frameHeight - 8 - inset * 2);
            graphics.lineStyle(4, 0x000000, 1);
            graphics.strokeRect(left + inset, top + inset, frameWidth - inset * 2, frameHeight - inset * 2);
            graphics.lineStyle(2, palette.border, 1);
            graphics.strokeRect(left + 2 + inset, top + 2 + inset, frameWidth - 4 - inset * 2, frameHeight - 4 - inset * 2);
            graphics.lineStyle(2, palette.accent, 1);
            graphics.strokeRect(left + 6 + inset, top + 6 + inset, frameWidth - 12 - inset * 2, frameHeight - 12 - inset * 2);
            graphics.fillStyle(0xffffff, 0.08);
            graphics.fillRect(left + 6 + inset, top + 6 + inset, frameWidth - 12 - inset * 2, 8);
        };
        const glow = scene.add.rectangle(0, 0, bgWidth + 24, bgHeight + 24, style.glow)
            .setOrigin(0.5)
            .setAlpha(0.22);
        const outerFrame = scene.add.graphics();
        outerFrame.lineStyle(2, style.outer ?? style.border, 0.95);
        outerFrame.strokeRect(-bgWidth / 2 - 6, -bgHeight / 2 - 6, bgWidth + 12, bgHeight + 12);
        outerFrame.lineStyle(2, 0x000000, 0.9);
        outerFrame.strokeRect(-bgWidth / 2 - 8, -bgHeight / 2 - 8, bgWidth + 16, bgHeight + 16);
        const outerShadow = scene.add.rectangle(4, 5, bgWidth + 16, bgHeight + 16, 0x000000, 0.14)
            .setOrigin(0.5);
        const frame = scene.add.graphics();
        drawFrame(frame, 0, 0, bgWidth, bgHeight, style);
        const headerBar = scene.add.rectangle(0, -bgHeight / 2 + 20, bgWidth - 20, 22, style.accent)
            .setOrigin(0.5);
        const headerShadow = scene.add.rectangle(0, -bgHeight / 2 + 24, bgWidth - 28, 10, 0x000000, 0.18)
            .setOrigin(0.5);
        const pixelStripes = scene.add.graphics();
        pixelStripes.fillStyle(style.badge, 0.3);
        for (let i = 0; i < 10; i += 1) {
            pixelStripes.fillRect(-bgWidth / 2 + 16 + i * 22, -bgHeight / 2 + 14, 10, 4);
        }
        const iconContainer = scene.add.container(-bgWidth / 2 + 78, 4);
        const iconFrame = scene.add.graphics();
        drawFrame(iconFrame, 0, 0, 82, 82, {
            border: style.border,
            accent: style.badge,
            panel: style.shadow,
            shadow: 0x050403
        });
        const iconGlow = scene.add.rectangle(0, 0, 70, 70, style.glow, 0.22).setOrigin(0.5);
        const iconKey = `card_icon_${cardConfig.key}`;
        const iconTexture = scene.textures.exists(iconKey) ? iconKey : '__missing_texture__';
        const iconImage = scene.add.image(0, 0, iconTexture)
            .setDisplaySize(56, 56)
            .setAngle(cardConfig.iconRotation || 0)
            .setOrigin(0.5)
            .setTint(0xf8f1d7);
        const shadowLayer = scene.add.rectangle(2, 3, 58, 58, 0x020103)
            .setOrigin(0.5)
            .setAlpha(0.35);
        iconContainer.add([iconFrame, iconGlow, shadowLayer, iconImage]);
        const textStartX = -bgWidth / 2 + 160;
        const availableTextWidth = bgWidth - (textStartX + bgWidth / 2 - 36);
        const textWidth = Math.max(170, Math.min(280, availableTextWidth));
        const title = scene.add.text(textStartX, -64, cardConfig.name, {
            fontSize: '24px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: style.text,
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0, 0);
        title.setShadow(3, 3, '#000000', 0, false, true);
        const description = scene.add.text(textStartX, -8, cardConfig.description, {
            fontSize: '17px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#f4e8c5',
            align: 'left',
            wordWrap: { width: textWidth },
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0);
        description.setLineSpacing(4);
        description.setShadow(2, 2, '#000000', 0, false, true);
        const infoPanel = scene.add.graphics();
        drawFrame(infoPanel, textStartX + textWidth / 2 - 2, 26, textWidth + 22, 86, {
            border: style.accent,
            accent: style.shadow,
            panel: 0x1a1410,
            shadow: 0x080604
        });
        infoPanel.setAlpha(0.9);
        const hitArea = scene.add.zone(0, 0, bgWidth, bgHeight).setOrigin(0.5);
        hitArea.setInteractive();
        this.add([glow, outerShadow, outerFrame, frame, headerBar, headerShadow, pixelStripes, iconContainer, infoPanel, title, description, hitArea]);
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
            alpha: { from: 0.2, to: 0.4 },
            yoyo: true,
            repeat: -1,
            duration: 1600,
            ease: 'Sine.easeInOut'
        });
        scene.tweens.add({
            targets: iconGlow,
            alpha: { from: 0.12, to: 0.28 },
            yoyo: true,
            repeat: -1,
            duration: 1200,
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
