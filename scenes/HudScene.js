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
        this.inventoryPanel = null;
        this.inventoryPanelBg = null;
        this.inventorySlots = [];
        this.inventoryColumns = 2;
        this.inventoryRows = 6;
        this.pauseButton = null;
        this.pauseButtonBg = null;
        this.pauseButtonHitArea = null;
        this.pauseButtonLines = [];
        this.touchJoystick = null;
        this.touchJoystickBase = null;
        this.touchJoystickThumb = null;
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

        this.createPauseButton();
        this.createInventoryPanel();
        this.createTouchJoystick();

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
        this.updateTouchJoystick();
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
            const pauseOffset = width < 640 ? 58 : 64;
            this.killCountText.setPosition(pauseOffset, 14);
        }
        this.layoutPauseButton();
        this.layoutTouchJoystick();
        if (this.expLevelText) {
            this.expLevelText.setPosition(width / 2, expBarY - 9);
        }
        if (this.expProgressText) {
            this.expProgressText.setPosition(barX + 6, expBarY + barHeight / 2 - 1);
        }
        if (this.hpText) {
            this.hpText.setPosition(barX + 6, hpBarY + barHeight / 2 - 1);
        }
        this.layoutInventoryPanel();
    }

    createInventoryPanel() {
        this.inventoryPanel?.destroy(true);
        this.inventoryPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(1001);
        this.inventoryPanelBg = this.add.graphics();

        this.inventoryPanel.add(this.inventoryPanelBg);
        this.inventorySlots = [];
        const totalSlots = this.inventoryColumns * this.inventoryRows;
        for (let i = 0; i < totalSlots; i++) {
            const slotContainer = this.add.container(0, 0);
            const slotGraphics = this.add.graphics();
            slotContainer.add(slotGraphics);
            this.inventorySlots.push({
                container: slotContainer,
                graphics: slotGraphics
            });
            this.inventoryPanel.add(slotContainer);
        }

        this.layoutInventoryPanel();
    }

    createPauseButton() {
        this.pauseButton?.destroy(true);
        this.pauseButton = this.add.container(0, 0).setScrollFactor(0).setDepth(1005);
        this.pauseButtonBg = this.add.graphics();
        this.pauseButtonHitArea = this.add.rectangle(0, 0, 1, 1, 0xffffff, 0.001)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        this.pauseButtonHitArea
            .on('pointerdown', () => {
                this.scene.get('MainScene')?.handlePauseToggle?.();
            })
            .on('pointerover', () => this.pauseButton?.setAlpha(1))
            .on('pointerout', () => this.pauseButton?.setAlpha(0.9));

        this.pauseButton.add(this.pauseButtonBg);
        this.pauseButtonLines = [];
        for (let i = 0; i < 3; i += 1) {
            const line = this.add.rectangle(0, 0, 1, 1, 0xf8d67f, 1).setOrigin(0.5);
            this.pauseButtonLines.push(line);
            this.pauseButton.add(line);
        }
        this.pauseButton.add(this.pauseButtonHitArea);
        this.pauseButton.setAlpha(0.9);
    }

    createTouchJoystick() {
        this.touchJoystick?.destroy(true);
        this.touchJoystick = this.add.container(0, 0).setScrollFactor(0).setDepth(1004);
        this.touchJoystickBase = this.add.circle(0, 0, 30, 0x140f17, 0.34)
            .setStrokeStyle(2, 0xd8b15a, 0.35);
        this.touchJoystickThumb = this.add.circle(0, 0, 12, 0xf8d67f, 0.45)
            .setStrokeStyle(2, 0x000000, 0.4);
        this.touchJoystick.add([this.touchJoystickBase, this.touchJoystickThumb]);
        this.touchJoystick.setVisible(false);
    }

    layoutPauseButton() {
        if (!this.pauseButton || !this.pauseButtonBg || !this.pauseButtonHitArea) return;
        const width = this.scale.width;
        const compact = width < 640;
        const buttonSize = compact ? 38 : 44;
        const margin = compact ? 10 : 14;
        const lineWidth = compact ? 16 : 18;
        const lineHeight = 3;
        const lineGap = compact ? 6 : 7;

        this.pauseButton.setPosition(margin + buttonSize / 2, margin + buttonSize / 2);
        this.pauseButtonBg.clear();
        this.pauseButtonBg.fillStyle(0x140f17, 0.94);
        this.pauseButtonBg.fillRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize);
        this.pauseButtonBg.lineStyle(2, 0x000000, 1);
        this.pauseButtonBg.strokeRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize);
        this.pauseButtonBg.lineStyle(2, 0xd8b15a, 1);
        this.pauseButtonBg.strokeRect(-buttonSize / 2 + 2, -buttonSize / 2 + 2, buttonSize - 4, buttonSize - 4);
        this.pauseButtonBg.lineStyle(1, 0x4d3b25, 1);
        this.pauseButtonBg.strokeRect(-buttonSize / 2 + 6, -buttonSize / 2 + 6, buttonSize - 12, buttonSize - 12);

        this.pauseButtonLines.forEach((line, index) => {
            line.setSize(lineWidth, lineHeight);
            line.setPosition(0, (index - 1) * lineGap);
        });
        this.pauseButtonHitArea.setSize(buttonSize, buttonSize);
    }

    layoutTouchJoystick() {
        if (!this.touchJoystick || !this.mainScene?.touchControlsEnabled) {
            this.touchJoystick?.setVisible(false);
            return;
        }
        const width = this.scale.width;
        const height = this.scale.height;
        const compact = width < 640;
        const marginX = compact ? 64 : 76;
        const marginY = compact ? 68 : 84;
        const radius = compact ? 28 : 34;
        const thumbRadius = compact ? 11 : 13;

        this.touchJoystick.setVisible(true);
        this.touchJoystick.setPosition(marginX, height - marginY);
        this.touchJoystickBase.setRadius(radius);
        this.touchJoystickThumb.setRadius(thumbRadius);
    }

    updateTouchJoystick() {
        if (!this.touchJoystick || !this.mainScene?.touchControlsEnabled) return;
        const touchState = this.mainScene.touchMoveState;
        const vector = this.mainScene.getTouchMoveVector?.() ?? { x: 0, y: 0, magnitude: 0, active: false };
        this.touchJoystick.setVisible(true);
        this.touchJoystick.setAlpha(touchState?.active ? 1 : 0.7);

        if (!touchState?.active) {
            this.touchJoystickThumb.setPosition(0, 0);
            return;
        }

        const maxThumbDistance = Math.max(12, (this.touchJoystickBase.radius ?? 30) - 12);
        this.touchJoystick.setPosition(touchState.startX, touchState.startY);
        this.touchJoystickThumb.setPosition(
            vector.x * maxThumbDistance * vector.magnitude,
            vector.y * maxThumbDistance * vector.magnitude
        );
    }

    drawInventorySlot(graphics, size) {
        const half = size / 2;
        graphics.clear();
        graphics.fillStyle(0x2a221b, 1);
        graphics.fillRect(-half, -half, size, size);
        graphics.fillStyle(0x413327, 1);
        graphics.fillRect(-half + 1, -half + 1, size - 2, size - 2);
        graphics.lineStyle(1, 0x000000, 1);
        graphics.strokeRect(-half, -half, size, size);
        graphics.lineStyle(1, 0x6e5a43, 1);
        graphics.strokeRect(-half + 1, -half + 1, size - 2, size - 2);
        graphics.lineStyle(1, 0x8f7a5b, 0.45);
        graphics.lineBetween(-half + 2, -half + 2, half - 2, -half + 2);
        graphics.lineBetween(-half + 2, -half + 2, -half + 2, half - 2);
    }

    layoutInventoryPanel() {
        if (!this.inventoryPanel || !this.hudLayout) return;
        const width = this.scale.width;
        const height = this.scale.height;
        const isCompact = width < 640;
        const slotSize = isCompact ? 11 : 13;
        const gap = isCompact ? 2 : 3;
        const paddingX = isCompact ? 4 : 5;
        const paddingY = isCompact ? 4 : 5;
        const paddingBottom = 5;
        const gridWidth = this.inventoryColumns * slotSize + (this.inventoryColumns - 1) * gap;
        const gridHeight = this.inventoryRows * slotSize + (this.inventoryRows - 1) * gap;
        const panelWidth = gridWidth + paddingX * 2;
        const panelHeight = gridHeight + paddingY * 2 + paddingBottom;
        const panelX = panelWidth / 2 + 8;
        const { hpBarY } = this.hudLayout;
        const panelY = Math.max(panelHeight / 2 + 8, hpBarY - panelHeight / 2 - 10);

        this.inventoryPanel.setPosition(panelX, panelY);

        this.inventoryPanelBg.clear();
        this.inventoryPanelBg.fillStyle(0x1c1714, 0.92);
        this.inventoryPanelBg.fillRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);
        this.inventoryPanelBg.lineStyle(2, 0x000000, 1);
        this.inventoryPanelBg.strokeRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight);
        this.inventoryPanelBg.lineStyle(1, 0x7b6147, 1);
        this.inventoryPanelBg.strokeRect(-panelWidth / 2 + 2, -panelHeight / 2 + 2, panelWidth - 4, panelHeight - 4);

        const startX = -gridWidth / 2 + slotSize / 2;
        const startY = -panelHeight / 2 + paddingY + slotSize / 2;
        this.inventorySlots.forEach((slot, index) => {
            const col = index % this.inventoryColumns;
            const row = Math.floor(index / this.inventoryColumns);
            slot.container.setPosition(
                startX + col * (slotSize + gap),
                startY + row * (slotSize + gap)
            );
            this.drawInventorySlot(slot.graphics, slotSize);
        });
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
        const cardScaleFactor = Phaser.Math.Clamp(Math.min(scaleByWidth, scaleByHeight), 0.38, 0.58);
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
            fontSize: width < 600 ? '20px' : '24px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#f7fbff',
            stroke: '#000000',
            strokeThickness: 4
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
        const cardScaleFactor = Phaser.Math.Clamp(Math.min(scaleByWidth, scaleByHeight), 0.38, 0.58);
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
        this.pauseButton?.destroy(true);
        this.pauseButton = null;
        this.pauseButtonBg = null;
        this.pauseButtonHitArea = null;
        this.pauseButtonLines = [];
        this.touchJoystick?.destroy(true);
        this.touchJoystick = null;
        this.touchJoystickBase = null;
        this.touchJoystickThumb = null;
        this.inventoryPanel?.destroy(true);
        this.inventoryPanel = null;
        this.inventoryPanelBg = null;
        this.inventorySlots = [];
        this.mainScene = null;
    }
}
