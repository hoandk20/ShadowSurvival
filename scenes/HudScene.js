import Card, { CARD_LAYOUT } from '../entities/Card.js';

export default class HudScene extends Phaser.Scene {
    constructor() {
        super('HudScene');
        this.hpBarBg = null;
        this.hpBarFill = null;
        this.hpText = null;
        this.expBarBg = null;
        this.expBarFill = null;
        this.expLevelText = null;
        this.expProgressText = null;
        this.killCountText = null;
        this.mainScene = null;
        this.levelUpOverlay = null;
        this.levelUpContainer = null;
        this.levelUpPanel = null;
        this.levelUpHeaderBar = null;
        this.levelUpTitle = null;
        this.levelUpCards = [];
        this.levelUpSelectionCallback = null;
        this.levelUpCardFocusIndex = 0;
        this.levelUpKeyboardActive = false;
    }

    create() {
        this.mainScene = this.scene.get('MainScene');
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        this.scene.bringToTop('HudScene');
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
        this.scale.on('resize', this.layoutHud, this);

        this.hpBarBg = this.add.graphics().setScrollFactor(0).setDepth(999);
        this.hpBarFill = this.add.graphics().setScrollFactor(0).setDepth(1000);
        this.hpText = this.add.text(0, 0, 'HP 100%', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#ffd8d8',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1002);
        this.expBarBg = this.add.graphics().setScrollFactor(0).setDepth(1000);
        this.expBarFill = this.add.graphics().setScrollFactor(0).setDepth(1001);
        this.expLevelText = this.add.text(0, 0, 'Lv 1', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1002);
        this.expProgressText = this.add.text(0, 0, '0 / 100', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#d6ffe8',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1002);
        this.killCountText = this.add.text(10, 10, 'Kills: 0', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1003);

        this.layoutHud();
    }

    update() {
        this.mainScene = this.scene.get('MainScene');
        const player = this.mainScene?.player;
        if (!player) {
            this.layoutHud();
            return;
        }

        this.layoutHud();

        const rawXP = typeof player.displayedXP === 'number' ? player.displayedXP : player.currentXP;
        const xpToNextLevel = Math.max(1, player.xpToNextLevel ?? 100);
        const progress = Phaser.Math.Clamp(rawXP / xpToNextLevel, 0, 1);
        const rawHealth = typeof player.displayedHealth === 'number' ? player.displayedHealth : player.health;
        const maxHealth = Math.max(1, player.maxHealth ?? 1);
        const hpProgress = Phaser.Math.Clamp(rawHealth / maxHealth, 0, 1);
        const level = player.level ?? 1;
        const kills = this.mainScene?.killCount ?? 0;

        if (this.killCountText) {
            this.killCountText.setText(`Kills: ${kills}`);
        }
        this.drawHpBar(hpProgress, rawHealth, maxHealth);
        this.drawExpBar(progress, level, rawXP, xpToNextLevel);
    }

    layoutHud() {
        const width = this.scale.width;
        const height = this.scale.height;
        const marginX = 12;
        const marginBottom = 10;
        const barHeight = 8;
        const maxBarWidth = Math.max(1, width - marginX * 2);
        const barWidth = Math.min(Math.floor(width * 0.84), maxBarWidth);
        const barX = Math.floor((width - barWidth) / 2);
        const expBarY = Math.floor(height - marginBottom - barHeight);
        const hpBarY = Math.max(8, expBarY - barHeight - 2);

        this.hudLayout = {
            width,
            height,
            marginX,
            marginBottom,
            barHeight,
            barWidth,
            barX,
            expBarY,
            hpBarY
        };

        if (this.killCountText) {
            this.killCountText.setPosition(10, 10);
        }
        if (this.expLevelText) {
            this.expLevelText.setPosition(width / 2, expBarY - 9);
        }
        if (this.expProgressText) {
            this.expProgressText.setPosition(barX + 6, expBarY + barHeight / 2 - 1);
        }
        if (this.hpText) {
            this.hpText.setPosition(barX + 6, hpBarY + barHeight / 2 - 1);
        }
    }

    drawHpBar(progress, rawHealth, maxHealth) {
        if (!this.hpBarBg || !this.hpBarFill || !this.hudLayout) return;
        const { barX, hpBarY, barWidth, barHeight } = this.hudLayout;

        this.hpBarBg.clear();
        this.hpBarBg.fillStyle(0x151515, 1);
        this.hpBarBg.fillRect(barX - 2, hpBarY - 2, barWidth + 4, barHeight + 4);
        this.hpBarBg.lineStyle(1, 0x000000, 1);
        this.hpBarBg.strokeRect(barX - 2, hpBarY - 2, barWidth + 4, barHeight + 4);

        this.hpBarFill.clear();
        if (progress > 0) {
            const fillWidth = Math.max(0, Math.floor(barWidth * progress));
            this.hpBarFill.fillStyle(0xff5b5b, 1);
            this.hpBarFill.fillRect(barX, hpBarY, fillWidth, barHeight);
            this.hpBarFill.lineStyle(1, 0xffd6d6, 0.35);
            this.hpBarFill.strokeRect(barX, hpBarY, fillWidth, barHeight);
        }

        if (this.hpText) {
            this.hpText.setText(`HP ${Math.floor(rawHealth)} / ${maxHealth}`);
        }
    }

    drawExpBar(progress, level, rawXP, xpToNextLevel) {
        if (!this.expBarBg || !this.expBarFill || !this.hudLayout) return;
        const { barX, expBarY, barWidth, barHeight } = this.hudLayout;

        this.expBarBg.clear();
        this.expBarBg.fillStyle(0x151515, 1);
        this.expBarBg.fillRect(barX - 2, expBarY - 2, barWidth + 4, barHeight + 4);
        this.expBarBg.lineStyle(1, 0x000000, 1);
        this.expBarBg.strokeRect(barX - 2, expBarY - 2, barWidth + 4, barHeight + 4);

        this.expBarFill.clear();
        if (progress > 0) {
            const fillWidth = Math.max(0, Math.floor(barWidth * progress));
            this.expBarFill.fillStyle(0x7cff6b, 1);
            this.expBarFill.fillRect(barX, expBarY, fillWidth, barHeight);
            this.expBarFill.lineStyle(1, 0xd9ffd3, 0.35);
            this.expBarFill.strokeRect(barX, expBarY, fillWidth, barHeight);
        }

        if (this.expLevelText) {
            this.expLevelText.setText(`Lv ${level}`);
        }
        if (this.expProgressText) {
            this.expProgressText.setText(`${Math.floor(rawXP)} / ${xpToNextLevel}`);
        }
    }

    showLevelUpSelection(cards, onSelect) {
        this.hideLevelUpSelection();
        const selectionCards = Array.isArray(cards) ? cards : [];
        if (!selectionCards.length) return;

        this.levelUpSelectionCallback = typeof onSelect === 'function' ? onSelect : null;
        this.levelUpCardFocusIndex = 0;
        this.levelUpKeyboardActive = false;

        const width = this.scale.width;
        const height = this.scale.height;
        const safeX = Math.max(16, Math.floor(width * 0.05));
        const safeY = Math.max(16, Math.floor(height * 0.05));
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(200);
        const panelWidth = Math.min(Math.max(Math.floor(width * 0.84), 340), width - safeX * 2);
        const columns = 1;
        const rows = selectionCards.length;
        const cardGutterX = 0;
        const cardGutterY = Math.max(10, Math.floor(height * 0.014));
        const usablePanelWidth = panelWidth - 32;
        const maxPanelHeight = Math.min(Math.floor(height * 0.82), height - safeY * 2);
        const headerSpace = width < 600 ? 46 : 54;
        const footerSpace = 24;
        const scaleByWidth = (usablePanelWidth - 24) / CARD_LAYOUT.width;
        const scaleByHeight = (maxPanelHeight - headerSpace - footerSpace - cardGutterY * (rows - 1)) / Math.max(1, rows * CARD_LAYOUT.height);
        const cardScaleFactor = Phaser.Math.Clamp(Math.min(scaleByWidth, scaleByHeight), 0.42, 0.82);
        const cardWidth = CARD_LAYOUT.width * cardScaleFactor + CARD_LAYOUT.padding;
        const cardHeight = CARD_LAYOUT.height * cardScaleFactor + CARD_LAYOUT.padding;
        const totalCardsWidth = columns * cardWidth + (columns - 1) * cardGutterX;
        const totalCardsHeight = rows * cardHeight + (rows - 1) * cardGutterY;
        const panelHeight = headerSpace + totalCardsHeight + footerSpace;
        const levelUpContainer = this.add.container(width / 2, height / 2).setDepth(202).setScrollFactor(0);
        const innerPanel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x111827, 0.95)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x6280b3, 1);
        const headerBar = this.add.rectangle(0, -panelHeight / 2 + 24, panelWidth - 28, 28, 0x31486c)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x000000, 0.35);
        const title = this.add.text(width / 2, safeY + 8, 'Choose an upgrade', {
            fontSize: width < 600 ? '16px' : '18px',
            fontFamily: 'monospace',
            color: '#f7fbff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(203);
        const startX = -totalCardsWidth / 2 + cardWidth / 2;
        const startY = -panelHeight / 2 + headerSpace + cardHeight / 2;
        const levelUpCards = [];

        levelUpContainer.add([innerPanel, headerBar]);
        selectionCards.forEach((cardConfig, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + col * (cardWidth + cardGutterX);
            const y = startY + row * (cardHeight + cardGutterY);
            const card = new Card(this, x, y, cardConfig, (selected) => {
                this.levelUpSelectionCallback?.(selected);
            }, cardScaleFactor);
            card.setAlpha(0);
            levelUpCards.push(card);
            levelUpContainer.add(card);
            this.tweens.add({
                targets: card,
                alpha: 1,
                scale: { from: cardScaleFactor * 0.92, to: cardScaleFactor },
                duration: 180,
                ease: 'Back.Out'
            });
        });
        this.levelUpOverlay = overlay;
        this.levelUpPanel = innerPanel;
        this.levelUpHeaderBar = headerBar;
        this.levelUpContainer = levelUpContainer;
        this.levelUpTitle = title;
        this.levelUpCards = levelUpCards;

        overlay.setInteractive();
        this.tweens.add({
            targets: overlay,
            alpha: { from: 0, to: 0.65 },
            duration: 180,
            ease: 'Sine.easeOut'
        });
        this.scene.bringToTop('HudScene');
        this.layoutLevelUpSelection();
    }

    layoutLevelUpSelection() {
        if (!this.levelUpContainer || !this.levelUpPanel || !this.levelUpOverlay) return;
        const width = this.scale.width;
        const height = this.scale.height;
        const safeX = Math.max(16, Math.floor(width * 0.05));
        const safeY = Math.max(16, Math.floor(height * 0.05));
        const columns = 1;
        const rows = Math.max(1, this.levelUpCards.length || 1);
        const cardGutterX = 0;
        const cardGutterY = Math.max(10, Math.floor(height * 0.014));
        const panelWidth = Math.min(Math.max(Math.floor(width * 0.84), 340), width - safeX * 2);
        const maxPanelHeight = Math.min(Math.floor(height * 0.82), height - safeY * 2);
        const headerSpace = width < 600 ? 46 : 54;
        const footerSpace = 24;
        const usablePanelWidth = panelWidth - 32;
        const scaleByWidth = (usablePanelWidth - 24) / CARD_LAYOUT.width;
        const scaleByHeight = (maxPanelHeight - headerSpace - footerSpace - cardGutterY * (rows - 1)) / Math.max(1, rows * CARD_LAYOUT.height);
        const cardScaleFactor = Phaser.Math.Clamp(Math.min(scaleByWidth, scaleByHeight), 0.42, 0.82);
        const cardWidth = CARD_LAYOUT.width * cardScaleFactor + CARD_LAYOUT.padding;
        const cardHeight = CARD_LAYOUT.height * cardScaleFactor + CARD_LAYOUT.padding;
        const totalCardsWidth = columns * cardWidth + (columns - 1) * cardGutterX;
        const totalCardsHeight = rows * cardHeight + (rows - 1) * cardGutterY;
        const panelHeight = headerSpace + totalCardsHeight + footerSpace;
        const startX = -totalCardsWidth / 2 + cardWidth / 2;
        const startY = -panelHeight / 2 + headerSpace + cardHeight / 2;

        this.levelUpContainer.setPosition(width / 2, height / 2);
        this.levelUpPanel.setDisplaySize(panelWidth, panelHeight);
        this.levelUpHeaderBar.setDisplaySize(panelWidth - 28, 28);
        this.levelUpHeaderBar.setPosition(0, -panelHeight / 2 + 24);
        if (this.levelUpTitle) {
            this.levelUpTitle.setPosition(width / 2, Math.max(16, Math.floor(height * 0.05)) + 8);
        }
        this.levelUpCards.forEach((card, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + col * (cardWidth + cardGutterX);
            const y = startY + row * (cardHeight + cardGutterY);
            card.setPosition(x, y);
        });
        this.levelUpOverlay.setSize(width, height);
    }

    setLevelUpFocus(index) {
        if (!this.levelUpCards.length) return;
        const total = this.levelUpCards.length;
        const wrappedIndex = Phaser.Math.Wrap(index, 0, total);
        this.levelUpCardFocusIndex = wrappedIndex;
        this.levelUpKeyboardActive = true;
        this.levelUpCards.forEach((card, cardIndex) => card.setFocus(cardIndex === wrappedIndex));
    }

    clearLevelUpSelection() {
        this.levelUpCards.forEach(card => card.setFocus(false));
        this.levelUpCardFocusIndex = 0;
        this.levelUpKeyboardActive = false;
    }

    hideLevelUpSelection() {
        this.clearLevelUpSelection();
        this.levelUpOverlay?.destroy();
        this.levelUpOverlay = null;
        this.levelUpContainer?.destroy();
        this.levelUpContainer = null;
        this.levelUpPanel = null;
        this.levelUpHeaderBar = null;
        this.levelUpTitle?.destroy();
        this.levelUpTitle = null;
        this.levelUpCards = [];
        this.levelUpSelectionCallback = null;
    }

    shutdown() {
        this.scale.off('resize', this.layoutHud, this);
        this.hideLevelUpSelection();
        this.hpBarFill?.destroy();
        this.hpBarFill = null;
        this.hpBarBg?.destroy();
        this.hpBarBg = null;
        this.hpText?.destroy();
        this.hpText = null;
        this.expBarFill?.destroy();
        this.expBarFill = null;
        this.expBarBg?.destroy();
        this.expBarBg = null;
        this.expLevelText?.destroy();
        this.expLevelText = null;
        this.expProgressText?.destroy();
        this.expProgressText = null;
        this.killCountText?.destroy();
        this.killCountText = null;
        this.mainScene = null;
    }
}
