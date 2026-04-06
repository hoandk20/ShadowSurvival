import { SUPPORTER_CONFIG } from '../config/supporters.js';
import { LOOT_CONFIG } from '../config/loot.js';

const SHOP_STAT_HINTS = {
    hp: 'HP shows your current and maximum health. If HP reaches zero, the character is defeated.',
    armor: 'Armor reduces incoming damage. If Armor goes negative, enemy hits deal extra damage instead.',
    armorPierce: 'Armor Pierce ignores a percentage of enemy armor before damage is applied.',
    range: 'Range increases how far your skills can reach or auto-target enemies.',
    speed: 'Speed controls how fast the character moves.',
    damage: 'Damage increases the overall damage dealt by your skills.',
    attackSpeed: 'Attack Speed makes skills fire more often by shortening the delay between attacks.',
    critChance: 'Crit Chance is the chance for attacks to land a critical hit.',
    critDamage: 'Crit Damage increases how much extra damage a critical hit deals.',
    area: 'Area increases the size or reach of skills with an area of effect.',
    projectiles: 'Projectiles is the number of shots or spawned objects your skill creates.',
    knockback: 'Knockback increases how strongly enemies are pushed back when hit.',
    effectChance: 'Effect Chance increases the chance to apply status effects such as burn, freeze, or poison.',
    effectDamage: 'Effect Damage increases status effect damage and also boosts some support effects such as shield effects and HP buffs.',
    effectDuration: 'Effect Duration increases how long status effects remain active.',
    regen: 'Regen restores health over time each second.',
    lifesteal: 'Lifesteal restores a portion of health based on the damage you deal.',
    shield: 'Shield is extra protection that is consumed before HP.',
    dodge: 'Dodge is the chance to avoid a hit completely and take no damage from that hit.',
    pickup: 'Pickup shows the current loot collection radius around your character.',
    gold: 'Gold increases how much gold you gain during the run.',
    xp: 'XP increases how much experience you gain, helping you level up faster.'
};

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
        this.goldIcon = null;
        this.goldText = null;
        this.killCountText = null;
        this.waveCountdownText = null;
        this.bossBarContainer = null;
        this.bossBarBg = null;
        this.bossBarFill = null;
        this.bossBarNameText = null;
        this.bossBarInfoKey = null;
        this.bossBarVisible = false;
        this.bossBarSlideTween = null;
        this.waveAnnouncementContainer = null;
        this.waveAnnouncementBackdrop = null;
        this.waveAnnouncementText = null;
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
        this.supporterChoiceOverlay = null;
        this.supporterChoiceContainer = null;
        this.supporterChoiceOptions = [];
        this.supporterChoiceCallback = null;
        this.supporterChoiceRerollCallback = null;
        this.supporterChoiceRerollButton = null;
        this.supporterChoiceRerollText = null;
        this.supporterChoiceInfoOverlay = null;
        this.supporterChoiceInfoPanel = null;
        this.supporterChoiceInfoTitle = null;
        this.supporterChoiceInfoText = null;
        this.preShopCardOverlay = null;
        this.preShopCardContainer = null;
        this.preShopCardOptions = [];
        this.preShopCardSelectCallback = null;
        this.preShopCardRerollCallback = null;
        this.preShopCardRerollButton = null;
        this.preShopCardRerollText = null;
        this.shopOverlay = null;
        this.shopContainer = null;
        this.shopPanel = null;
        this.shopPanelInner = null;
        this.shopHeaderBar = null;
        this.shopFooterBar = null;
        this.shopTitle = null;
        this.shopGoldIcon = null;
        this.shopGoldText = null;
        this.shopGoldPanel = null;
        this.shopStatsPopupOverlay = null;
        this.shopStatsPopupContainer = null;
        this.shopStatsPanel = null;
        this.shopStatsInner = null;
        this.shopStatsTitle = null;
        this.shopStatsText = null;
        this.shopStatsLineTexts = [];
        this.shopStatsHintPanel = null;
        this.shopStatsHintText = null;
        this.shopStatsPopupOverlay = null;
        this.shopStatsToggleButton = null;
        this.shopStatsToggleButtonText = null;
        this.shopStatsVisible = false;
        this.shopItemInfoOverlay = null;
        this.shopItemInfoPanel = null;
        this.shopItemInfoTitle = null;
        this.shopItemInfoText = null;
        this.shopSectionLabel = null;
        this.shopPurchasedLabel = null;
        this.shopPurchasedFrame = null;
        this.shopPurchasedStrip = null;
        this.shopPurchasedItems = [];
        this.shopPurchasedMaskGraphics = null;
        this.shopPurchasedMask = null;
        this.shopPurchasedScrollOffset = 0;
        this.shopPurchasedScrollMaxOffset = 0;
        this.shopPurchasedViewport = null;
        this.shopPurchasedDragPointerId = null;
        this.shopPurchasedDragStartX = 0;
        this.shopPurchasedDragStartOffset = 0;
        this.shopBodyText = null;
        this.shopEmptySlots = [];
        this.shopItemSlots = [];
        this.shopItemCount = 0;
        this.shopGridColumns = 0;
        this.shopScrollOffset = 0;
        this.shopScrollMaxOffset = 0;
        this.shopScrollViewport = null;
        this.shopWheelHandler = null;
        this.shopDragPointerId = null;
        this.shopDragStartY = 0;
        this.shopDragStartOffset = 0;
        this.shopPurchaseCallback = null;
        this.shopToggleLockCallback = null;
        this.shopRerollCost = 5;
        this.shopRerollButton = null;
        this.shopRerollButtonShadow = null;
        this.shopRerollButtonBg = null;
        this.shopRerollButtonText = null;
        this.shopRerollCostText = null;
        this.shopRerollCallback = null;
        this.shopContinueButton = null;
        this.shopContinueButtonShadow = null;
        this.shopContinueButtonBg = null;
        this.shopContinueButtonText = null;
        this.shopContinueCallback = null;
        this.inventoryPanel = null;
        this.inventoryPanelBg = null;
        this.inventorySlots = [];
        this.inventoryColumns = 2;
        this.inventoryRows = 5;
        this.inventoryExpanded = false;
        this.inventoryPreviewOverlay = null;
        this.inventoryPreviewContainer = null;
        this.inventoryPreviewPanel = null;
        this.inventoryPreviewIcon = null;
        this.inventoryPreviewTitle = null;
        this.inventoryPreviewLevel = null;
        this.inventoryPreviewLines = [];
        this.inventoryPreviewItemKey = null;
        this.pauseButton = null;
        this.pauseButtonBg = null;
        this.pauseButtonHitArea = null;
        this.pauseButtonLines = [];
        this.touchJoystick = null;
        this.touchJoystickBase = null;
        this.touchJoystickThumb = null;
        this.hudPlayerId = null;
    }

    create() {
        this.mainScene = this.scene.get('MainScene');
        this.hudPlayerId = this.mainScene?.getPrimaryPlayer?.()?.playerId ?? null;
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
        this.goldIcon = this.add.image(0, 0, 'item_gold_coin')
            .setScrollFactor(0)
            .setDepth(1003);
        this.goldText = this.add.text(0, 0, '0', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffe066',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1003);
        this.killCountText = this.add.text(10, 10, 'Kills: 0', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1003);
        this.killCountText.setVisible(false);
        this.waveCountdownText = this.add.text(0, 0, '', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffe9a6',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1003);
        this.createBossBar();

        this.createPauseButton();
        this.createTouchJoystick();

        this.layoutHud();
    }

    update() {
        this.mainScene = this.scene.get('MainScene');
        const { player, runState } = this.resolveHudContext();
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
        const shield = Math.max(0, player.getTotalShield?.() ?? player.temporaryShield ?? 0);
        const level = player.level ?? 1;
        const gold = Math.max(0, Math.floor(player.gold ?? 0));
        const kills = runState?.killCount ?? 0;
        const showKillCount = player.hasSkill?.('flame') || player.hasSkill?.('blueflame');
        const waveDurationSeconds = Math.max(0, Math.round(this.mainScene?.currentWaveDurationSeconds ?? 0));
        const waveRemainingMs = Math.max(0, this.mainScene?.getCurrentWaveRemainingMs?.() ?? 0);
        const waveRemainingSeconds = waveRemainingMs <= 0 ? 0 : Math.ceil(waveRemainingMs / 1000);
        const waveRemainingMinutesText = String(Math.floor(waveRemainingSeconds / 60)).padStart(2, '0');
        const waveRemainingSecondsText = String(waveRemainingSeconds % 60).padStart(2, '0');

        if (this.killCountText) {
            this.killCountText.setVisible(Boolean(showKillCount));
            this.killCountText.setText(`Kills: ${kills}`);
        }
        if (this.goldText) {
            this.goldText.setText(`${gold}`);
        }
        if (this.waveCountdownText) {
            const shouldShowWaveCountdown = Boolean(
                this.mainScene?.waveSystemEnabled
                && !this.mainScene?.isShopOpen
                && !this.mainScene?.isRunComplete
                && waveDurationSeconds > 0
            );
            this.waveCountdownText.setVisible(shouldShowWaveCountdown);
            if (shouldShowWaveCountdown) {
                this.waveCountdownText.setText(`${waveRemainingMinutesText}:${waveRemainingSecondsText}`);
            }
        }
        this.updateBossBar(this.mainScene?.getBossHudInfo?.() ?? null);
        this.updateTouchJoystick();
        this.drawHpBar(hpProgress, rawHealth, maxHealth, shield);
        this.drawExpBar(progress, level, rawXP, xpToNextLevel);
    }

    resolveHudContext() {
        const mainScene = this.mainScene ?? this.scene.get('MainScene');
        const fallbackPlayer = mainScene?.getPrimaryPlayer?.() ?? mainScene?.player ?? null;
        const player = this.hudPlayerId
            ? (mainScene?.getPlayerById?.(this.hudPlayerId) ?? fallbackPlayer)
            : fallbackPlayer;
        const runState = player
            ? (mainScene?.getRunStateForPlayer?.(player) ?? mainScene?.getPrimaryRunState?.() ?? null)
            : null;
        if (player?.playerId && this.hudPlayerId !== player.playerId) {
            this.hudPlayerId = player.playerId;
        }
        return { player, runState };
    }

    getHudPlayer() {
        return this.resolveHudContext().player;
    }

    getHudRunState() {
        return this.resolveHudContext().runState;
    }

    setHudPlayer(playerOrId = null) {
        if (!playerOrId) {
            this.hudPlayerId = this.mainScene?.getPrimaryPlayer?.()?.playerId ?? null;
            return;
        }
        this.hudPlayerId = typeof playerOrId === 'string'
            ? playerOrId
            : (playerOrId.playerId ?? null);
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
        if (this.waveCountdownText) {
            const bossOffset = this.bossBarVisible ? 42 : 18;
            this.waveCountdownText.setPosition(width / 2, bossOffset);
        }
        if (this.goldText && this.goldIcon) {
            const rightMargin = width < 640 ? 10 : 14;
            const timerX = width - rightMargin;
            const timerY = 14;
            const iconSize = width < 640 ? 13 : 15;
            const gap = 4;
            const rowSpacing = width < 640 ? 17 : 19;
            const textWidth = this.goldText.width ?? 0;
            const totalWidth = iconSize + gap + textWidth;
            const leftX = timerX - totalWidth;
            const goldY = timerY + rowSpacing;

            this.goldIcon.setDisplaySize(iconSize, iconSize);
            this.goldIcon.setOrigin(0.5, 0.5);
            this.goldIcon.setPosition(leftX + iconSize / 2, goldY);
            this.goldText.setOrigin(0, 0.5);
            this.goldText.setPosition(leftX + iconSize + gap, goldY);
        }
        this.layoutPauseButton();
        this.layoutTouchJoystick();
        this.layoutBossBar();
        if (this.expLevelText) {
            this.expLevelText.setPosition(width / 2, expBarY - 9);
        }
        if (this.expProgressText) {
            this.expProgressText.setPosition(barX + 6, expBarY + barHeight / 2 - 1);
        }
        if (this.hpText) {
            this.hpText.setPosition(barX + 6, hpBarY + barHeight / 2 - 1);
        }
        this.layoutShopOverlay();
    }

    createBossBar() {
        this.bossBarContainer?.destroy(true);
        this.bossBarContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(1010).setVisible(false);
        this.bossBarBg = this.add.graphics();
        this.bossBarFill = this.add.graphics();
        this.bossBarNameText = this.add.text(0, -13, '', {
            fontSize: '12px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#fff3d8',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5);
        this.bossBarContainer.add([
            this.bossBarBg,
            this.bossBarFill,
            this.bossBarNameText
        ]);
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
            const slotIcon = this.add.image(0, 0, '__missing_texture__')
                .setVisible(false)
                .setOrigin(0.5);
            const levelText = this.add.text(0, 0, '', {
                fontSize: '8px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#fff4cc',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(1, 1).setVisible(false);
            const slotHitArea = this.add.rectangle(0, 0, 1, 1, 0xffffff, 0.001)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            slotHitArea.on('pointerdown', () => {
                const item = slotContainer.getData('inventoryItem');
                if (item && !this.inventoryExpanded) {
                    this.toggleInventoryExpanded();
                    return;
                }
            });
            slotContainer.add(slotGraphics);
            slotContainer.add(slotIcon);
            slotContainer.add(levelText);
            slotContainer.add(slotHitArea);
            this.inventorySlots.push({
                container: slotContainer,
                graphics: slotGraphics,
                icon: slotIcon,
                levelText,
                hitArea: slotHitArea
            });
            this.inventoryPanel.add(slotContainer);
        }

        this.layoutInventoryPanel();
    }

    createInventoryPreview() {
        this.inventoryPreviewOverlay?.destroy();
        this.inventoryPreviewContainer?.destroy(true);

        this.inventoryPreviewOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.55)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(1000)
            .setInteractive()
            .setVisible(false);
        this.inventoryPreviewOverlay.on('pointerdown', () => this.hideInventoryPreview());
        this.inventoryPreviewContainer = null;
        this.inventoryPreviewPanel = null;
        this.inventoryPreviewIcon = null;
        this.inventoryPreviewTitle = null;
        this.inventoryPreviewLevel = null;
        this.inventoryPreviewLines = [];
        this.inventoryPreviewItemKey = null;
    }

    createPauseButton() {
        this.pauseButton?.destroy(true);
        this.pauseButton = this.add.container(0, 0).setScrollFactor(0).setDepth(998);
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
            const line = this.add.rectangle(0, 0, 1, 1, 0xd9f6ff, 1).setOrigin(0.5);
            this.pauseButtonLines.push(line);
            this.pauseButton.add(line);
        }
        this.pauseButton.add(this.pauseButtonHitArea);
        this.pauseButton.setAlpha(0.9);
    }

    createTouchJoystick() {
        this.touchJoystick?.destroy(true);
        this.touchJoystick = this.add.container(0, 0).setScrollFactor(0).setDepth(1004);
        this.touchJoystickBase = this.add.circle(0, 0, 30, 0x11171b, 0.34)
            .setStrokeStyle(2, 0x7e99a8, 0.35);
        this.touchJoystickThumb = this.add.circle(0, 0, 12, 0xd9f6ff, 0.45)
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
        this.pauseButtonBg.fillStyle(0x11171b, 0.94);
        this.pauseButtonBg.fillRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize);
        this.pauseButtonBg.lineStyle(2, 0x000000, 1);
        this.pauseButtonBg.strokeRect(-buttonSize / 2, -buttonSize / 2, buttonSize, buttonSize);
        this.pauseButtonBg.lineStyle(2, 0x7e99a8, 1);
        this.pauseButtonBg.strokeRect(-buttonSize / 2 + 2, -buttonSize / 2 + 2, buttonSize - 4, buttonSize - 4);
        this.pauseButtonBg.lineStyle(1, 0x556f80, 1);
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

        this.touchJoystick.setVisible(false);
        this.touchJoystick.setPosition(marginX, height - marginY);
        this.touchJoystickBase.setRadius(radius);
        this.touchJoystickThumb.setRadius(thumbRadius);
    }

    shouldShowTouchJoystick() {
        if (!this.touchJoystick || !this.mainScene?.touchControlsEnabled) return false;
        if (!this.mainScene?.touchMoveState?.active) return false;
        if (this.mainScene?.isShopOpen || this.mainScene?.isChoosingCard || this.mainScene?.isChoosingSupporter) return false;
        if (this.mainScene?.isGameOver || this.mainScene?.isRunComplete) return false;
        if (this.scene.isActive('PauseMenuScene')) return false;
        if (this.shopOverlay?.active || this.levelUpOverlay?.active || this.supporterChoiceOverlay?.active || this.preShopCardOverlay?.active) {
            return false;
        }
        return true;
    }

    updateTouchJoystick() {
        if (!this.touchJoystick || !this.mainScene?.touchControlsEnabled) return;
        const touchState = this.mainScene.touchMoveState;
        const vector = this.mainScene.getTouchMoveVector?.() ?? { x: 0, y: 0, magnitude: 0, active: false };
        const shouldShow = this.shouldShowTouchJoystick();
        this.touchJoystick.setVisible(shouldShow);
        if (!shouldShow) {
            this.touchJoystickThumb.setPosition(0, 0);
            this.touchJoystick.setAlpha(1);
            return;
        }
        this.touchJoystick.setAlpha(1);

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

    isPointOverHud(screenX, screenY) {
        if (this.shopOverlay?.active) {
            return true;
        }
        if (this.levelUpOverlay?.active) {
            return true;
        }
        if (this.supporterChoiceOverlay?.active) {
            return true;
        }
        if (this.preShopCardOverlay?.active) {
            return true;
        }

        const containsPoint = (gameObject) => {
            if (!gameObject?.active || !gameObject.visible) return false;
            const bounds = gameObject.getBounds?.();
            return Boolean(bounds?.contains?.(screenX, screenY));
        };

        if (containsPoint(this.pauseButtonHitArea)) return true;
        if (containsPoint(this.inventoryPanel)) return true;
        if (this.inventoryExpanded && this.inventoryPreviewOverlay?.visible) return true;
        if (containsPoint(this.killCountText)) return true;
        if (containsPoint(this.waveCountdownText)) return true;

        if (this.hudLayout) {
            const { barX, barWidth, hpBarY, expBarY, barHeight } = this.hudLayout;
            const bottomHudTop = hpBarY - 8;
            const bottomHudBottom = expBarY + barHeight + 8;
            const withinBottomHudX = screenX >= barX - 8 && screenX <= barX + barWidth + 8;
            const withinBottomHudY = screenY >= bottomHudTop && screenY <= bottomHudBottom;
            if (withinBottomHudX && withinBottomHudY) {
                return true;
            }
        }

        return false;
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
        const slotSize = this.inventoryExpanded
            ? (isCompact ? 36 : 42)
            : (isCompact ? 11 : 13);
        const gap = this.inventoryExpanded
            ? (isCompact ? 8 : 10)
            : (isCompact ? 2 : 3);
        const paddingX = this.inventoryExpanded
            ? (isCompact ? 12 : 16)
            : (isCompact ? 4 : 5);
        const paddingY = this.inventoryExpanded
            ? (isCompact ? 12 : 16)
            : (isCompact ? 4 : 5);
        const paddingBottom = this.inventoryExpanded ? 12 : 5;
        const gridWidth = this.inventoryColumns * slotSize + (this.inventoryColumns - 1) * gap;
        const gridHeight = this.inventoryRows * slotSize + (this.inventoryRows - 1) * gap;
        const panelWidth = gridWidth + paddingX * 2;
        const panelHeight = gridHeight + paddingY * 2 + paddingBottom;
        const panelX = this.inventoryExpanded ? width / 2 : panelWidth / 2 + 8;
        const { hpBarY } = this.hudLayout;
        const panelY = this.inventoryExpanded
            ? height / 2
            : Math.max(panelHeight / 2 + 8, hpBarY - panelHeight / 2 - 10);

        this.inventoryPanel.setPosition(panelX, panelY);
        this.inventoryPanel.setDepth(this.inventoryExpanded ? 1301 : 1001);

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
            slot.icon.setDisplaySize(slotSize - 4, slotSize - 4);
            slot.icon.setPosition(0, 0);
            slot.levelText.setPosition(slotSize / 2 - 1, slotSize / 2 - 1);
            slot.levelText.setFontSize(this.inventoryExpanded ? (isCompact ? '16px' : '18px') : '8px');
            slot.hitArea.setSize(slotSize, slotSize);
            slot.hitArea.setPosition(0, 0);
        });

        if (this.inventoryPreviewOverlay) {
            this.inventoryPreviewOverlay.setSize(width, height);
            this.inventoryPreviewOverlay.setVisible(this.inventoryExpanded);
        }

    }

    showInventoryPreview() {
        this.inventoryExpanded = true;
        this.layoutInventoryPanel();
        this.tweens.killTweensOf(this.inventoryPanel);
        this.inventoryPanel.setScale(0.92);
        this.tweens.add({
            targets: this.inventoryPanel,
            scale: 1,
            duration: 140,
            ease: 'Back.Out'
        });
    }

    hideInventoryPreview() {
        if (!this.inventoryExpanded) return;
        this.inventoryExpanded = false;
        this.inventoryPanel.setScale(1);
        this.layoutInventoryPanel();
    }

    toggleInventoryExpanded() {
        if (this.inventoryExpanded) {
            this.hideInventoryPreview();
            return;
        }
        this.showInventoryPreview();
    }

    drawHpBar(progress, rawHealth, maxHealth, shield = 0) {
        if (!this.hpBarBg || !this.hpBarFill || !this.hudLayout) return;
        const { barX, hpBarY, barWidth, barHeight } = this.hudLayout;

        this.hpBarBg.clear();
        this.hpBarBg.fillStyle(0x151515, 1);
        this.hpBarBg.fillRect(barX - 2, hpBarY - 2, barWidth + 4, barHeight + 4);
        this.hpBarBg.lineStyle(1, 0x000000, 1);
        this.hpBarBg.strokeRect(barX - 2, hpBarY - 2, barWidth + 4, barHeight + 4);

        this.hpBarFill.clear();
        const fillWidth = Math.max(0, Math.floor(barWidth * progress));
        if (fillWidth > 0) {
            this.hpBarFill.fillStyle(0xff5b5b, 1);
            this.hpBarFill.fillRect(barX, hpBarY, fillWidth, barHeight);
            this.hpBarFill.lineStyle(1, 0xffd6d6, 0.35);
            this.hpBarFill.strokeRect(barX, hpBarY, fillWidth, barHeight);
        }

        if (shield > 0) {
            const shieldProgress = Math.max(0, shield / maxHealth);
            const shieldWidth = Math.max(0, Math.floor(barWidth * Math.min(1, shieldProgress)));
            const remainingWidth = Math.max(0, barWidth - fillWidth);
            if (remainingWidth > 0) {
                const overflowShieldWidth = Math.min(remainingWidth, shieldWidth);
                this.hpBarFill.fillStyle(0xa8afb8, 0.95);
                this.hpBarFill.fillRect(barX + fillWidth, hpBarY, overflowShieldWidth, barHeight);
                this.hpBarFill.lineStyle(1, 0xe3e7eb, 0.35);
                this.hpBarFill.strokeRect(barX + fillWidth, hpBarY, overflowShieldWidth, barHeight);
            } else if (shieldWidth > 0) {
                const shieldOverlayHeight = Math.max(2, Math.floor(barHeight * 0.45));
                this.hpBarFill.fillStyle(0xa8afb8, 0.95);
                this.hpBarFill.fillRect(barX, hpBarY, shieldWidth, shieldOverlayHeight);
                this.hpBarFill.lineStyle(1, 0xe3e7eb, 0.35);
                this.hpBarFill.strokeRect(barX, hpBarY, shieldWidth, shieldOverlayHeight);
            }
        }

        if (this.hpText) {
            const roundedShield = Math.floor(shield);
            const shieldText = roundedShield > 0 ? ` + ${roundedShield}` : '';
            this.hpText.setText(`HP ${Math.floor(rawHealth)} / ${maxHealth}${shieldText}`);
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

    layoutBossBar() {
        if (!this.bossBarContainer) return;
        const width = this.scale.width;
        const compact = width < 640;
        const barWidth = compact ? Math.min(220, Math.floor(width * 0.7)) : Math.min(340, Math.floor(width * 0.52));
        const visibleX = Math.floor(width / 2);
        const hiddenX = width + Math.floor(barWidth * 0.7);
        const y = compact ? 18 : 20;
        const targetX = this.bossBarVisible ? visibleX : hiddenX;
        if (!this.bossBarSlideTween) {
            this.bossBarContainer.setPosition(targetX, y);
        } else {
            this.bossBarContainer.y = y;
        }
        this.bossBarContainer.setData('barWidth', barWidth);
    }

    updateBossBar(info = null) {
        if (!this.bossBarContainer || !this.bossBarBg || !this.bossBarFill) return;
        const hadVisibleBoss = this.bossBarVisible;
        this.bossBarVisible = Boolean(info && info.maxHealth > 0 && info.health >= 0);
        this.layoutBossBar();

        if (!this.bossBarVisible) {
            this.bossBarInfoKey = null;
            this.bossBarSlideTween?.stop?.();
            this.bossBarSlideTween = null;
            this.bossBarContainer.setVisible(false);
            return;
        }

        const barWidth = this.bossBarContainer.getData('barWidth') ?? 280;
        const barHeight = 12;
        const fillProgress = Phaser.Math.Clamp((info.health ?? 0) / Math.max(1, info.maxHealth ?? 1), 0, 1);
        const frameColor = info.barFrameColor ?? 0x26110d;
        const fillColor = info.barColor ?? 0xd24e3b;
        const glowColor = info.barGlowColor ?? 0xffdca8;

        this.bossBarContainer.setVisible(true);
        this.bossBarBg.clear();
        this.bossBarBg.fillStyle(0x0e0908, 0.94);
        this.bossBarBg.fillRoundedRect(-barWidth / 2 - 5, -6, barWidth + 10, barHeight + 12, 6);
        this.bossBarBg.lineStyle(2, 0x000000, 1);
        this.bossBarBg.strokeRoundedRect(-barWidth / 2 - 5, -6, barWidth + 10, barHeight + 12, 6);
        this.bossBarBg.lineStyle(2, frameColor, 1);
        this.bossBarBg.strokeRoundedRect(-barWidth / 2 - 2, -3, barWidth + 4, barHeight + 6, 5);

        this.bossBarFill.clear();
        this.bossBarFill.fillStyle(0x20110d, 1);
        this.bossBarFill.fillRoundedRect(-barWidth / 2, 0, barWidth, barHeight, 4);
        const fillWidth = Math.max(0, Math.floor(barWidth * fillProgress));
        if (fillWidth > 0) {
            const fillX = (barWidth / 2) - fillWidth;
            this.bossBarFill.fillStyle(fillColor, 1);
            this.bossBarFill.fillRoundedRect(fillX, 0, fillWidth, barHeight, 4);
            this.bossBarFill.lineStyle(1, glowColor, 0.7);
            this.bossBarFill.strokeRoundedRect(fillX, 0, fillWidth, barHeight, 4);
        }

        if (this.bossBarNameText) {
            this.bossBarNameText.setText(info.name ?? 'BOSS');
        }

        const infoKey = `${info.key}:${info.roundNumber}`;
        if (!hadVisibleBoss || this.bossBarInfoKey !== infoKey) {
            this.bossBarInfoKey = infoKey;
            this.bossBarSlideTween?.stop?.();
            const targetY = this.bossBarContainer.y;
            const hiddenX = this.scale.width + Math.floor(barWidth * 0.7);
            const visibleX = Math.floor(this.scale.width / 2);
            this.bossBarContainer.setPosition(hiddenX, targetY);
            this.bossBarContainer.setAlpha(0);
            this.bossBarSlideTween = this.tweens.add({
                targets: this.bossBarContainer,
                x: visibleX,
                alpha: 1,
                duration: 340,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    this.bossBarSlideTween = null;
                }
            });
        }
    }

    showWaveAnnouncement({ waveNumber = 1, durationMs = 1600 } = {}) {
        this.hideWaveAnnouncement();
        const width = this.scale.width;
        const height = this.scale.height;
        const isMobile = width < 640;
        const container = this.add.container(width / 2, height / 2).setDepth(2100).setScrollFactor(0);
        const backdrop = this.add.rectangle(0, 0, isMobile ? 180 : 260, isMobile ? 56 : 72, 0x000000, 0.55)
            .setOrigin(0.5);
        const text = this.add.text(0, 0, `WAVE ${Math.max(1, Math.round(waveNumber))}`, {
            fontSize: isMobile ? '20px' : '28px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#ffe4a8',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);
        container.add([backdrop, text]);
        container.setAlpha(0);
        container.setScale(0.9);
        this.waveAnnouncementContainer = container;
        this.waveAnnouncementBackdrop = backdrop;
        this.waveAnnouncementText = text;
        this.tweens.add({
            targets: container,
            alpha: 1,
            scale: 1,
            duration: 180,
            ease: 'Back.Out'
        });
        this.time.delayedCall(Math.max(250, durationMs), () => {
            if (!this.waveAnnouncementContainer || this.waveAnnouncementContainer !== container) return;
            this.tweens.add({
                targets: container,
                alpha: 0,
                scale: 1.04,
                duration: 220,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    if (this.waveAnnouncementContainer === container) {
                        this.hideWaveAnnouncement();
                    } else {
                        container.destroy(true);
                    }
                }
            });
        });
        this.scene.bringToTop('HudScene');
    }

    hideWaveAnnouncement() {
        this.waveAnnouncementContainer?.destroy?.(true);
        this.waveAnnouncementContainer = null;
        this.waveAnnouncementBackdrop = null;
        this.waveAnnouncementText = null;
    }

    formatShopItemModifierLine(key, amount) {
        const value = Number(amount ?? 0);
        if (!Number.isFinite(value) || value === 0) return null;
        const prefix = value > 0 ? '+' : '';
        switch (key) {
            case 'damageMultiplier':
                return `${prefix}${Math.round(value * 100)}% dmg`;
            case 'critChance':
                return `${prefix}${Math.round(value * 100)}% crit`;
            case 'critMultiplier':
                return `${prefix}${Math.round(value * 100)}% crit dmg`;
            case 'attackSpeed':
                return `${prefix}${Math.round(value * 100)}% atk spd`;
            case 'armor':
                return `${prefix}${value} armor`;
            case 'armorPierce':
                return `${prefix}${Math.round(value * 100)}% armor pierce`;
            case 'skillRange':
                return `${prefix}${Math.round(value)} range`;
            case 'skillRangeFlat':
                return `${prefix}${Math.round(value)} range`;
            case 'hp':
                return `${prefix}${value} hp`;
            case 'healthRegenPerSecond':
                return `${prefix}${value}/s regen`;
            case 'lifesteal':
                return `${prefix}${Math.round(value * 100)}% lifesteal`;
            case 'shield':
                return `${prefix}${value} shield`;
            case 'dodge':
                return `${prefix}${Math.round(value * 100)}% dodge`;
            case 'moveSpeed':
                return `${prefix}${value} speed`;
            case 'areaSizeMultiplier':
                return `${prefix}${Math.round(value * 100)}% area`;
            case 'projectileCount':
                return `${prefix}${value} projectile`;
            case 'knockbackMultiplier':
                return `${prefix}${Math.round(value * 100)}% knockback`;
            case 'effectChance':
                return `${prefix}${Math.round(value * 100)}% effect`;
            case 'effectDamageMultiplier':
                return `${prefix}${Math.round(value * 100)}% effect dmg`;
            case 'effectDurationMultiplier':
                return `${prefix}${Math.round(value * 100)}% effect dur`;
            case 'shockChainCount':
                return `${prefix}${Math.round(value)} shock chain`;
            case 'pickupRangeMultiplier':
                return `${prefix}${Math.round(value * 100)}% pickup`;
            case 'goldGainMultiplier':
                return `${prefix}${Math.round(value * 100)}% gold`;
            default:
                return null;
        }
    }

    formatShopItemStatLines(item = null) {
        if (!item) return [];
        const lines = [];
        Object.entries(item.modifiers ?? {}).forEach(([key, value]) => {
            const text = this.formatShopItemModifierLine(key, value);
            const amount = Number(value ?? 0);
            if (!text || !Number.isFinite(amount) || amount === 0) return;
            lines.push({
                text,
                color: amount > 0 ? '#7dff93' : '#ff7d7d'
            });
        });
        if (!lines.length && item.effectBonuses) {
            Object.entries(item.effectBonuses).forEach(([effectKey, bonusConfig]) => {
                if (!bonusConfig || typeof bonusConfig !== 'object') return;
                Object.entries(bonusConfig).forEach(([bonusKey, bonusValue]) => {
                    if (bonusKey === 'chainCount' && Number.isFinite(Number(bonusValue))) {
                        lines.push({ text: `${effectKey} chains +${Math.round(Number(bonusValue))}`, color: '#7dff93' });
                        return;
                    }
                    if (bonusKey === 'chainDamageBonus' && Number.isFinite(Number(bonusValue))) {
                        lines.push({ text: `${effectKey} chain dmg +${Math.round(Number(bonusValue) * 100)}%`, color: '#7dff93' });
                        return;
                    }
                    if (bonusValue === true) {
                        lines.push({ text: `${effectKey} ${bonusKey}`, color: '#7dff93' });
                        return;
                    }
                    lines.push({ text: `${effectKey} bonus`, color: '#7dff93' });
                });
            });
        }
        if (!lines.length && item.unlockElement?.effectKey) {
            const effectLabel = String(item.unlockElement.label ?? item.unlockElement.effectKey).replace(/^./, (char) => char.toUpperCase());
            const effectChance = Math.round((item.unlockElement.chance ?? 0.2) * 100);
            if (item.unlockElement.mode === 'hit_explosion') {
                lines.push({ text: `Enable ${effectLabel}`, color: '#7dff93' });
                lines.push({ text: 'Explodes on hit', color: '#7dff93' });
            } else {
                lines.push({ text: `Enable ${effectLabel}`, color: '#7dff93' });
                lines.push({ text: `${effectChance}% effect chance`, color: '#7dff93' });
            }
        }
        if (!lines.length && item.special) {
            Object.keys(item.special).forEach((key) => {
                lines.push({
                    text: key.replace(/[A-Z]/g, (char) => ` ${char.toLowerCase()}`),
                    color: '#7dff93'
                });
            });
        }
        return lines.slice(0, 4);
    }

    buildShopCurrentStatEntries() {
        const player = this.getHudPlayer?.();
        if (!player) {
            return [{ key: 'none', label: 'No player data', hint: 'Current player data is not available.' }];
        }

        const characterStats = player.resolveCharacterStats?.() ?? player.characterStats ?? {};
        const maxHp = Math.max(1, Math.round(player.maxHealth ?? characterStats.hp ?? 1));
        const hp = Math.max(0, Math.round(player.health ?? maxHp));
        const armor = Math.round(player.armor ?? characterStats.armor ?? 0);
        const armorPierce = Math.round((player.armorPierce ?? characterStats.armorPierce ?? 0) * 100);
        const skillRangeBonus = Math.round(player.skillRange ?? characterStats.skillRange ?? 0);
        const moveSpeed = Math.round(player.speed ?? characterStats.moveSpeed ?? 0);
        const damageMul = Math.round(((characterStats.damageMultiplier ?? 1) * (player.damageMultiplier ?? 1)) * 100);
        const attackSpeed = Math.round(((characterStats.attackSpeed ?? 1) * (player.attackSpeedMultiplier ?? 1)) * 100);
        const activeSkillKey = player.getActiveSkillKey?.() ?? null;
        const activeSkillConfig = activeSkillKey ? (player.getSkillConfig?.(activeSkillKey) ?? null) : null;
        const critChance = Math.round((Number(player.getSkillCritChanceBonus?.(activeSkillKey) ?? 0) || 0) * 100);
        const critDamage = Math.round(((characterStats.critMultiplier ?? 1.5) + (player.getSkillCritMultiplierBonus?.() ?? 0)) * 100);
        const area = Math.round((characterStats.areaSizeMultiplier ?? 1) * (player.globalSkillAreaMultiplier ?? 1) * 100);
        const effectiveRange = Math.round(
            activeSkillConfig?.category === 'projectile'
                ? (activeSkillConfig.travelRange ?? skillRangeBonus)
                : (activeSkillConfig?.meleeRange ?? skillRangeBonus)
        );
        const projectileCount = Math.max(1, Math.round(activeSkillKey ? (player.getSkillObjectCount?.(activeSkillKey) ?? 1) : (characterStats.projectileCount ?? 1)));
        const knockback = Math.round((player.getSkillKnockbackMultiplier?.() ?? 1) * 100);
        const effectChance = Math.round(((characterStats.effectChance ?? 0) + (player.globalEffectChanceBonus ?? 0)) * 100);
        const effectDamage = Math.round((characterStats.effectDamageMultiplier ?? 1) * (player.globalEffectDamageMultiplier ?? 1) * 100);
        const effectDuration = Math.round((characterStats.effectDurationMultiplier ?? 1) * (player.globalEffectDurationMultiplier ?? 1) * 100);
        const regen = Number(player.healthRegenPerSecond ?? 0);
        const lifesteal = Math.round((player.lifesteal ?? 0) * 100);
        const shield = Math.round(player.getTotalShield?.() ?? 0);
        const dodge = Math.round(Phaser.Math.Clamp(player.dodge ?? 0, 0, 1) * 100);
        const pickupRadius = Math.round((LOOT_CONFIG.magnetRadius ?? 0) * (player.lootMagnetRadiusMultiplier ?? 1));
        const goldGain = Math.round((player.goldGainMultiplier ?? 1) * 100);
        const xpGain = Math.round((player.xpGainMultiplier ?? 1) * 100);

        return [
            { key: 'hp', label: `HP ${hp}/${maxHp}`, hint: SHOP_STAT_HINTS.hp },
            { key: 'armor', label: `Armor ${armor}`, hint: SHOP_STAT_HINTS.armor },
            { key: 'armorPierce', label: `Armor Pierce ${armorPierce}%`, hint: SHOP_STAT_HINTS.armorPierce },
            { key: 'range', label: `Range ${effectiveRange}`, hint: SHOP_STAT_HINTS.range },
            { key: 'speed', label: `Speed ${moveSpeed}`, hint: SHOP_STAT_HINTS.speed },
            { key: 'damage', label: `Damage ${damageMul}%`, hint: SHOP_STAT_HINTS.damage },
            { key: 'attackSpeed', label: `Atk Spd ${attackSpeed}%`, hint: SHOP_STAT_HINTS.attackSpeed },
            { key: 'critChance', label: `Crit ${critChance}%`, hint: SHOP_STAT_HINTS.critChance },
            { key: 'critDamage', label: `Crit Dmg ${critDamage}%`, hint: SHOP_STAT_HINTS.critDamage },
            { key: 'area', label: `Area ${area}%`, hint: SHOP_STAT_HINTS.area },
            { key: 'projectiles', label: `Projectiles ${projectileCount}`, hint: SHOP_STAT_HINTS.projectiles },
            { key: 'knockback', label: `Knockback ${knockback}%`, hint: SHOP_STAT_HINTS.knockback },
            { key: 'effectChance', label: `Effect ${effectChance}%`, hint: SHOP_STAT_HINTS.effectChance },
            { key: 'effectDamage', label: `Eff Dmg ${effectDamage}%`, hint: SHOP_STAT_HINTS.effectDamage },
            { key: 'effectDuration', label: `Eff Dur ${effectDuration}%`, hint: SHOP_STAT_HINTS.effectDuration },
            { key: 'regen', label: `Regen ${regen}/s`, hint: SHOP_STAT_HINTS.regen },
            { key: 'lifesteal', label: `Lifesteal ${lifesteal}%`, hint: SHOP_STAT_HINTS.lifesteal },
            { key: 'shield', label: `Shield ${shield}`, hint: SHOP_STAT_HINTS.shield },
            { key: 'dodge', label: `Dodge ${dodge}%`, hint: SHOP_STAT_HINTS.dodge },
            { key: 'pickup', label: `Pickup ${pickupRadius}`, hint: SHOP_STAT_HINTS.pickup },
            { key: 'gold', label: `Gold ${goldGain}%`, hint: SHOP_STAT_HINTS.gold },
            { key: 'xp', label: `XP ${xpGain}%`, hint: SHOP_STAT_HINTS.xp }
        ];
    }

    getResponsiveShopGridColumns(availableWidth, isMobileShopLayout = false) {
        return 5;
    }

    getShopLayoutFlags() {
        const width = this.scale.width;
        const height = this.scale.height;
        const isMobileDevice = Boolean(this.sys.game.device.os.android || this.sys.game.device.os.iOS);
        const shortestSide = Math.min(width, height);
        const isCompactViewport = shortestSide < 600;
        const isMobileShopLayout = isMobileDevice || isCompactViewport;
        const isMobileLandscape = isMobileShopLayout && width > height;
        return { width, height, isMobileDevice, isMobileShopLayout, isMobileLandscape };
    }

    refreshShopStatsPanel() {
        const entries = this.buildShopCurrentStatEntries();
        this.shopStatsLineTexts?.forEach((textObject, index) => {
            const entry = entries[index] ?? null;
            textObject?.setVisible(Boolean(entry));
            textObject?.setText(entry?.label ?? '');
            textObject?.setData('statHint', entry?.hint ?? '');
        });
        if (this.shopStatsHintText && !this.shopStatsHintText.text) {
            this.shopStatsHintText.setText('Click any stat line to see what it does.');
        }
    }

    toggleShopStatsPanel() {
        this.shopStatsVisible = !this.shopStatsVisible;
        if (this.shopStatsToggleButtonText) {
            this.shopStatsToggleButtonText.setText(this.shopStatsVisible ? 'HIDE STATS' : 'SHOW STATS');
        }
        this.shopStatsPopupOverlay?.setVisible(this.shopStatsVisible);
        this.shopStatsPanel?.setVisible(this.shopStatsVisible);
        this.shopStatsInner?.setVisible(this.shopStatsVisible);
        this.shopStatsTitle?.setVisible(this.shopStatsVisible);
        this.shopStatsLineTexts?.forEach((line) => line?.setVisible(this.shopStatsVisible));
        this.shopStatsHintPanel?.setVisible(this.shopStatsVisible);
        this.shopStatsHintText?.setVisible(this.shopStatsVisible);
        if (this.shopStatsVisible && this.shopStatsPopupContainer) {
            this.children.bringToTop(this.shopStatsPopupContainer);
        }
        this.layoutShopOverlay();
    }

    setShopScrollOffset(value = 0) {
        const maxOffset = Math.max(0, this.shopScrollMaxOffset ?? 0);
        this.shopScrollOffset = Phaser.Math.Clamp(value, 0, maxOffset);
        this.layoutShopOverlay();
    }

    showShopOverlay({ gold = 0, items = [], purchasedItems = [], onContinue = null, onReroll = null, onToggleLock = null, onPurchase = null, rerollCost = 5, rerollRemaining = 0, debugMode = false } = {}) {
        this.hideShopOverlay();
        const { width, height, isMobileShopLayout, isMobileLandscape } = this.getShopLayoutFlags();
        const shopTextFontFamily = isMobileShopLayout ? 'Arial' : 'monospace';
        const safeX = Math.max(10, Math.floor(width * 0.02));
        const safeY = Math.max(10, Math.floor(height * 0.02));
        const panelWidth = isMobileLandscape
            ? width
            : isMobileShopLayout
            ? Math.max(320, width - 12)
            : Math.min(Math.max(Math.floor(width * 0.96), 400), width - safeX * 2);
        const panelHeight = isMobileLandscape
            ? height
            : isMobileShopLayout
            ? Math.max(320, height - 12)
            : Math.min(Math.max(Math.floor(height * 0.9), 340), height - safeY * 2);
        const requestedItemCount = Math.max(debugMode ? items.length : 5, items.length, 1);
        const gridColumns = 0;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.72)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(2000)
            .setInteractive();
        const container = this.add.container(width / 2, height / 2).setDepth(2002).setScrollFactor(0);
        const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x11171b, 0.97)
            .setOrigin(0.5)
            .setStrokeStyle(3, 0x000000, 1);
        const panelInner = this.add.rectangle(0, 0, panelWidth - 12, panelHeight - 12, 0x1b252b, 0.98)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x7e99a8, 1);
        const headerBar = this.add.rectangle(0, -panelHeight / 2 + 26, panelWidth - 28, 30, 0x25343d)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x000000, 0.9);
        const footerBar = this.add.rectangle(0, panelHeight / 2 - 22, panelWidth - 28, 24, 0x213039, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x000000, 0.9);
        const statsPopupContainer = this.add.container(width / 2, height / 2).setDepth(2004).setScrollFactor(0);
        const statsPopupOverlay = this.add.rectangle(0, 0, panelWidth - 40, panelHeight - 40, 0x000000, 0.35)
            .setOrigin(0.5)
            .setVisible(false)
            .setInteractive();
        const statsPanel = this.add.rectangle(0, 0, isMobileShopLayout ? 170 : 220, panelHeight - 84, 0x11171b, 0.98)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x7e99a8, 1)
            .setInteractive();
        const statsInner = this.add.rectangle(0, 0, (isMobileShopLayout ? 170 : 220) - 12, panelHeight - 96, 0x1b252b, 0.98)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x000000, 0.9)
            .setInteractive();
        const statsTitle = this.add.text(0, 0, 'CURRENT STATS', {
            fontSize: isMobileShopLayout ? '13px' : '14px',
            fontFamily: shopTextFontFamily,
            fontStyle: 'bold',
            color: '#e7f4ff',
            stroke: '#000000',
            strokeThickness: isMobileShopLayout ? 4 : 3
        }).setOrigin(0.5).setInteractive();
        const statsLineTexts = Array.from({ length: 21 }, () => this.add.text(0, 0, '', {
            fontSize: isMobileShopLayout ? '10px' : '10px',
            fontFamily: shopTextFontFamily,
            color: '#d9f6ff',
            align: 'left',
            stroke: '#000000',
            strokeThickness: isMobileShopLayout ? 2 : 1
        }).setOrigin(0, 0).setInteractive({ useHandCursor: true }));
        const statsHintPanel = this.add.rectangle(0, 0, (isMobileShopLayout ? 170 : 220) - 16, 68, 0x213039, 1)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x7e99a8, 1)
            .setInteractive();
        const statsHintText = this.add.text(0, 0, 'Click any stat line to see what it does.', {
            fontSize: isMobileShopLayout ? '9px' : '9px',
            fontFamily: shopTextFontFamily,
            color: '#d9f6ff',
            align: 'left',
            wordWrap: { width: (isMobileShopLayout ? 170 : 220) - 28 },
            stroke: '#000000',
            strokeThickness: isMobileShopLayout ? 2 : 1
        }).setOrigin(0, 0).setInteractive();
        statsLineTexts.forEach((line) => {
            line.on('pointerdown', () => {
                const hint = line.getData('statHint') ?? '';
                if (hint && this.shopStatsHintText) {
                    this.shopStatsHintText.setText(hint);
                }
            });
            line.on('pointerover', () => line.setColor('#f2fcff'));
            line.on('pointerout', () => line.setColor('#d9f6ff'));
        });
        const swallowPopupClick = (pointer, _localX, _localY, event) => {
            event?.stopPropagation?.();
        };
        statsPanel.on('pointerdown', swallowPopupClick);
        statsInner.on('pointerdown', swallowPopupClick);
        statsTitle.on('pointerdown', swallowPopupClick);
        statsHintPanel.on('pointerdown', swallowPopupClick);
        statsHintText.on('pointerdown', swallowPopupClick);
        statsLineTexts.forEach((line) => line.on('pointerdown', swallowPopupClick));
        const title = this.add.text(0, -panelHeight / 2 + 22, 'CHOOSE AN ITEM', {
            fontSize: isMobileShopLayout ? '18px' : '20px',
            fontFamily: shopTextFontFamily,
            fontStyle: 'bold',
            color: '#e7f4ff',
            stroke: '#000000',
            strokeThickness: isMobileShopLayout ? 5 : 4
        }).setOrigin(0.5);
        const subtitle = this.add.text(0, -panelHeight / 2 + 48, '', {
            fontSize: isMobileShopLayout ? '11px' : '13px',
            fontFamily: shopTextFontFamily,
            color: '#b7d0db',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setVisible(false);
        const goldPanel = this.add.rectangle(panelWidth / 2 - 92, -panelHeight / 2 + 26, 118, 28, 0x162026, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x8cc4dc, 1);
        const goldIcon = this.add.image(panelWidth / 2 - 138, -panelHeight / 2 + 26, 'item_gold_coin')
            .setOrigin(0.5);
        goldIcon.setDisplaySize(18, 18);
        const goldText = this.add.text(panelWidth / 2 - 124, -panelHeight / 2 + 26, `${Math.max(0, Math.floor(gold))}`, {
            fontSize: isMobileShopLayout ? '19px' : '18px',
            fontFamily: shopTextFontFamily,
            fontStyle: 'bold',
            color: '#d9f6ff',
            stroke: '#000000',
            strokeThickness: isMobileShopLayout ? 4 : 3
        }).setOrigin(0, 0.5);
        const bodyText = this.add.text(0, 72, '', {
            fontSize: isMobileShopLayout ? '15px' : '16px',
            fontFamily: shopTextFontFamily,
            color: '#e7f4ff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: isMobileShopLayout ? 4 : 3
        }).setOrigin(0.5);
        const purchasedLabel = this.add.text(0, panelHeight / 2 - 82, 'Purchased', {
            fontSize: isMobileShopLayout ? '11px' : '11px',
            fontFamily: shopTextFontFamily,
            fontStyle: 'bold',
            color: '#d9f6ff',
            stroke: '#000000',
            strokeThickness: isMobileShopLayout ? 3 : 2
        }).setOrigin(0.5);
        const purchasedFrame = this.add.rectangle(0, panelHeight / 2 - 62, panelWidth - 70, 34, 0x162026, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x7e99a8, 1);
        const purchasedFrameInner = this.add.rectangle(0, panelHeight / 2 - 62, panelWidth - 76, 28, 0x213039, 1)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x000000, 0.9);
        const purchasedStrip = this.add.container(0, panelHeight / 2 - 50);
        const purchasedMaskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        const purchasedMask = purchasedMaskGraphics.createGeometryMask();
        purchasedStrip.setMask(purchasedMask);
        const slotPositions = Array.from({ length: requestedItemCount }, (_, index) => index);
        const emptySlots = slotPositions.map((x) => {
            const slot = this.add.container(0, 0);
            const shadow = this.add.rectangle(2, 3, 82, 82, 0x000000, 0.45).setOrigin(0.5);
            const bg = this.add.rectangle(0, 0, 82, 82, 0x162026, 1)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0x000000, 1);
            const inner = this.add.rectangle(0, 0, 72, 72, 0x213039, 1)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0x556f80, 1);
            const plus = this.add.text(0, -6, '+', {
                fontSize: '24px',
                fontFamily: shopTextFontFamily,
                fontStyle: 'bold',
                color: '#d9f6ff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            const label = this.add.text(0, 20, 'EMPTY', {
                fontSize: isMobileShopLayout ? '11px' : '10px',
                fontFamily: shopTextFontFamily,
                fontStyle: 'bold',
                color: '#9db1bb',
                stroke: '#000000',
                strokeThickness: isMobileShopLayout ? 3 : 2
            }).setOrigin(0.5);
            slot.add([shadow, bg, inner, plus, label]);
            return slot;
        });
        const itemSlots = slotPositions.map((x) => {
            const slot = this.add.container(0, 0);
            const shadow = this.add.rectangle(4, 6, 188, 190, 0x000000, 0.24).setOrigin(0.5);
            const bg = this.add.rectangle(0, 0, 188, 190, 0x162026, 0.98)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0x000000, 1);
            const inner = this.add.rectangle(0, 0, 180, 182, 0x213039, 0.98)
                .setOrigin(0.5)
                .setStrokeStyle(3, 0x7e99a8, 1);
            const hitArea = this.add.rectangle(0, 0, 188, 190, 0xffffff, 0.001)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            const iconPlaceholder = this.add.rectangle(0, -62, 18, 18, 0x25343d, 1)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0x8cc4dc, 1);
            const iconImage = this.add.image(0, -60, '__missing_texture__')
                .setOrigin(0.5)
                .setDisplaySize(16, 16)
                .setVisible(false);
            iconImage.setPosition(0, -62);
            const iconText = this.add.text(0, -60, '?', {
                fontSize: isMobileShopLayout ? '10px' : '9px',
                fontFamily: shopTextFontFamily,
                fontStyle: 'bold',
                color: '#d9f6ff',
                stroke: '#000000',
                strokeThickness: isMobileShopLayout ? 4 : 3
            }).setOrigin(0.5).setPosition(0, -62);
            const mobileStatLineYs = [20, 38, 56, 74, 92];
            const desktopStatLineYs = [24, 42, 60, 78, 96];
            const nameText = this.add.text(0, isMobileShopLayout ? -12 : -8, '', {
                fontSize: isMobileShopLayout ? '16px' : '16px',
                fontFamily: shopTextFontFamily,
                fontStyle: 'bold',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: isMobileShopLayout ? 156 : 152 },
                stroke: '#000000',
                strokeThickness: isMobileShopLayout ? 5 : 3
            }).setOrigin(0.5);
            if (isMobileShopLayout) {
                nameText.setResolution(2);
            }
            const statLineTexts = (isMobileShopLayout ? mobileStatLineYs : desktopStatLineYs).map((lineY) => this.add.text(0, lineY, '', {
                fontSize: isMobileShopLayout ? '15px' : '11px',
                fontFamily: shopTextFontFamily,
                color: isMobileShopLayout ? '#ffffff' : '#c8d6dc',
                align: 'center',
                wordWrap: { width: isMobileShopLayout ? 158 : 154 },
                stroke: '#000000',
                strokeThickness: isMobileShopLayout ? 0 : 2,
                shadow: isMobileShopLayout ? { offsetX: 0, offsetY: 1, color: '#000000', blur: 1, stroke: false, fill: true } : undefined
            }).setOrigin(0.5));
            if (isMobileShopLayout) {
                statLineTexts.forEach((text) => text.setResolution(2));
            }
            const pricePanel = this.add.rectangle(0, isMobileShopLayout ? 124 : 122, isMobileShopLayout ? 88 : 76, isMobileShopLayout ? 26 : 22, 0x25343d, 1)
                .setOrigin(0.5)
                .setStrokeStyle(isMobileShopLayout ? 2 : 1, 0x8cc4dc, 1);
            const priceText = this.add.text(0, isMobileShopLayout ? 124 : 116, '', {
                fontSize: isMobileShopLayout ? '14px' : '11px',
                fontFamily: shopTextFontFamily,
                fontStyle: 'bold',
                color: isMobileShopLayout ? '#ffffff' : '#d9f6ff',
                stroke: '#000000',
                strokeThickness: isMobileShopLayout ? 4 : 2
            }).setOrigin(0.5).setPosition(0, isMobileShopLayout ? 124 : 122);
            if (isMobileShopLayout) {
                priceText.setResolution(2);
            }
            const selectText = this.add.text(0, isMobileShopLayout ? 152 : 150, '', {
                fontSize: isMobileShopLayout ? '12px' : '10px',
                fontFamily: shopTextFontFamily,
                fontStyle: 'bold',
                color: '#d9f6ff',
                stroke: '#000000',
                strokeThickness: isMobileShopLayout ? 4 : 2
            }).setOrigin(0.5);
            const lockButtonBg = this.add.rectangle(0, isMobileShopLayout ? 152 : 150, isMobileShopLayout ? 42 : 34, isMobileShopLayout ? 24 : 20, 0x25343d, 1)
                .setOrigin(0.5)
                .setStrokeStyle(isMobileShopLayout ? 2 : 1, 0x8cc4dc, 1)
                .setInteractive({ useHandCursor: true });
            const lockButtonText = this.add.text(0, isMobileShopLayout ? 152 : 150, '🔓', {
                fontSize: isMobileShopLayout ? '14px' : '11px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#d9f6ff',
                stroke: '#000000',
                strokeThickness: isMobileShopLayout ? 4 : 2
            }).setOrigin(0.5);
            if (isMobileShopLayout) {
                lockButtonText.setResolution(2);
            }
            lockButtonText.setPosition(lockButtonBg.x, lockButtonBg.y);
            const infoButtonBg = this.add.circle(68, -76, 10, 0x25343d, 1)
                .setStrokeStyle(2, 0x8cc4dc, 1)
                .setInteractive({ useHandCursor: true });
            const infoButtonText = this.add.text(68, -76, 'i', {
                fontSize: isMobileShopLayout ? '12px' : '11px',
                fontFamily: shopTextFontFamily,
                fontStyle: 'bold',
                color: '#d9f6ff',
                stroke: '#000000',
                strokeThickness: isMobileShopLayout ? 3 : 2
            }).setOrigin(0.5);
            hitArea.on('pointerover', () => slot.setScale(1.03));
            hitArea.on('pointerout', () => slot.setScale(1));
            slot.add([shadow, bg, inner, iconPlaceholder, iconImage, iconText, nameText, ...statLineTexts, pricePanel, priceText, selectText, hitArea, lockButtonBg, lockButtonText, infoButtonBg, infoButtonText]);
            slot.setVisible(false);
            return {
                container: slot,
                bg,
                inner,
                hitArea,
                iconImage,
                iconText,
                nameText,
                statLineTexts,
                pricePanel,
                priceText,
                selectText,
                lockButtonBg,
                lockButtonText,
                infoButtonBg,
                infoButtonText
            };
        });
        const continueButton = this.add.container(panelWidth / 2 - 88, panelHeight / 2 - 32);
        const continueButtonShadow = this.add.rectangle(3, 3, 132, 38, 0x000000, 0.45).setOrigin(0.5);
        const continueButtonBg = this.add.rectangle(0, 0, 132, 38, 0x25343d, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x000000, 1)
            .setInteractive({ useHandCursor: true });
        const continueButtonInner = this.add.rectangle(0, 0, 124, 30, 0x30454f, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x7e99a8, 1);
        const continueButtonText = this.add.text(0, 0, 'Continue', {
            fontSize: '15px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#d9f6ff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        const rerollButton = this.add.container(panelWidth / 2 - 61, -panelHeight / 2 + 106);
        const rerollButtonShadow = this.add.rectangle(3, 3, 92, 48, 0x000000, 0.45).setOrigin(0.5);
        const rerollButtonBg = this.add.rectangle(0, 0, 92, 48, 0x25343d, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x000000, 1)
            .setInteractive({ useHandCursor: true });
        const rerollButtonInner = this.add.rectangle(0, 0, 76, 32, 0x30454f, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x7e99a8, 1);
        const rerollButtonText = this.add.text(-22, -1, '↻', {
            fontSize: '30px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#d9f6ff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        const rerollCostText = this.add.text(6, 0, `${Math.max(0, Math.floor(rerollCost))}`, {
            fontSize: isMobileShopLayout ? '13px' : '14px',
            fontFamily: shopTextFontFamily,
            fontStyle: 'bold',
            color: '#fff7dd',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        const statsToggleButton = this.add.rectangle(-panelWidth / 2 + 74, -panelHeight / 2 + 26, 120, 24, 0x25343d, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x7e99a8, 1)
            .setInteractive({ useHandCursor: true });
        const statsToggleButtonText = this.add.text(-panelWidth / 2 + 74, -panelHeight / 2 + 26, 'SHOW STATS', {
            fontSize: isMobileShopLayout ? '10px' : '11px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#d9f6ff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        statsToggleButton
            .on('pointerdown', () => this.toggleShopStatsPanel())
            .on('pointerover', () => statsToggleButton.setScale(1.03))
            .on('pointerout', () => statsToggleButton.setScale(1));
        statsPopupOverlay.on('pointerdown', () => {
            if (this.shopStatsVisible) {
                this.toggleShopStatsPanel();
            }
        });
        continueButtonBg
            .on('pointerdown', () => this.shopContinueCallback?.())
            .on('pointerover', () => continueButton.setScale(1.03))
            .on('pointerout', () => continueButton.setScale(1));
        rerollButtonBg
            .on('pointerdown', () => {
                const nextState = this.shopRerollCallback?.();
                if (nextState) {
                    this.updateShopOverlayContent(nextState);
                    this.layoutShopOverlay();
                }
            })
            .on('pointerover', () => rerollButton.setScale(1.03))
            .on('pointerout', () => rerollButton.setScale(1));
        rerollButton.add([rerollButtonShadow, rerollButtonBg, rerollButtonInner, rerollButtonText, rerollCostText]);
        continueButton.add([continueButtonShadow, continueButtonBg, continueButtonInner, continueButtonText]);

        container.add([
            panel,
            panelInner,
            headerBar,
            footerBar,
            statsToggleButton,
            statsToggleButtonText,
            title,
            subtitle,
            goldPanel,
            goldIcon,
            goldText,
            purchasedLabel,
            purchasedFrame,
            purchasedFrameInner,
            purchasedStrip,
            ...emptySlots,
            ...itemSlots.map((slot) => slot.container),
            bodyText,
            rerollButton,
            continueButton
        ]);
        statsPopupContainer.add([
            statsPopupOverlay,
            statsPanel,
            statsInner,
            statsTitle,
            ...statsLineTexts,
            statsHintPanel,
            statsHintText
        ]);

        this.shopOverlay = overlay;
        this.shopContainer = container;
        this.shopPanel = panel;
        this.shopPanelInner = panelInner;
        this.shopHeaderBar = headerBar;
        this.shopFooterBar = footerBar;
        this.shopTitle = title;
        this.shopSubtitle = subtitle;
        this.shopGoldIcon = goldIcon;
        this.shopGoldText = goldText;
        this.shopGoldPanel = goldPanel;
        this.shopStatsPopupContainer = statsPopupContainer;
        this.shopStatsPopupOverlay = statsPopupOverlay;
        this.shopStatsPanel = statsPanel;
        this.shopStatsInner = statsInner;
        this.shopStatsTitle = statsTitle;
        this.shopStatsText = null;
        this.shopStatsLineTexts = statsLineTexts;
        this.shopStatsHintPanel = statsHintPanel;
        this.shopStatsHintText = statsHintText;
        this.shopStatsToggleButton = statsToggleButton;
        this.shopStatsToggleButtonText = statsToggleButtonText;
        this.shopSectionLabel = null;
        this.shopPurchasedLabel = purchasedLabel;
        this.shopPurchasedFrame = purchasedFrame;
        this.shopPurchasedStrip = purchasedStrip;
        this.shopPurchasedItems = [];
        this.shopPurchasedMaskGraphics = purchasedMaskGraphics;
        this.shopPurchasedMask = purchasedMask;
        this.shopBodyText = bodyText;
        this.shopEmptySlots = emptySlots;
        this.shopItemSlots = itemSlots;
        this.shopItemCount = requestedItemCount;
        this.shopGridColumns = gridColumns;
        this.shopScrollOffset = 0;
        this.shopScrollMaxOffset = 0;
        this.shopScrollViewport = null;
        this.shopPurchaseCallback = typeof onPurchase === 'function' ? onPurchase : null;
        this.shopToggleLockCallback = typeof onToggleLock === 'function' ? onToggleLock : null;
        this.shopRerollCost = Math.max(0, Math.floor(rerollCost ?? 0));
        this.shopRerollButton = rerollButton;
        this.shopRerollButtonShadow = rerollButtonShadow;
        this.shopRerollButtonBg = rerollButtonBg;
        this.shopRerollButtonText = rerollButtonText;
        this.shopRerollCostText = rerollCostText;
        this.shopRerollCallback = typeof onReroll === 'function' ? onReroll : null;
        this.shopContinueButton = continueButton;
        this.shopContinueButtonShadow = continueButtonShadow;
        this.shopContinueButtonBg = continueButtonBg;
        this.shopContinueButtonText = continueButtonText;
        this.shopContinueCallback = typeof onContinue === 'function' ? onContinue : null;
        this.shopStatsVisible = false;
        this.updateShopOverlayContent({ gold, items, purchasedItems, rerollRemaining, debugMode });
        this.layoutShopOverlay();
        this.shopWheelHandler = (_pointer, _gameObjects, _dx, dy) => {
            if (!this.shopOverlay?.active) return;
            const pointer = _pointer;
            if (!pointer) return;
            const purchasedViewport = this.shopPurchasedViewport;
            if (purchasedViewport && (this.shopPurchasedScrollMaxOffset ?? 0) > 0) {
                const withinPurchasedX = pointer.x >= purchasedViewport.left && pointer.x <= purchasedViewport.right;
                const withinPurchasedY = pointer.y >= purchasedViewport.top && pointer.y <= purchasedViewport.bottom;
                if (withinPurchasedX && withinPurchasedY) {
                    this.setShopPurchasedScrollOffset((this.shopPurchasedScrollOffset ?? 0) + dy * 0.45);
                    return;
                }
            }
            const viewport = this.shopScrollViewport;
            if (!viewport || (this.shopScrollMaxOffset ?? 0) <= 0) return;
            const withinX = pointer.x >= viewport.left && pointer.x <= viewport.right;
            const withinY = pointer.y >= viewport.top && pointer.y <= viewport.bottom;
            if (!withinX || !withinY) return;
            this.setShopScrollOffset((this.shopScrollOffset ?? 0) + dy * 0.45);
        };
        this.input.on('wheel', this.shopWheelHandler, this);
        overlay.on('pointerdown', (pointer) => {
            if (!pointer) return;
            if ((this.shopPurchasedScrollMaxOffset ?? 0) > 0 && this.shopPurchasedViewport) {
                const viewport = this.shopPurchasedViewport;
                const withinX = pointer.x >= viewport.left && pointer.x <= viewport.right;
                const withinY = pointer.y >= viewport.top && pointer.y <= viewport.bottom;
                if (withinX && withinY) {
                    this.shopPurchasedDragPointerId = pointer.id;
                    this.shopPurchasedDragStartX = pointer.x;
                    this.shopPurchasedDragStartOffset = this.shopPurchasedScrollOffset ?? 0;
                    return;
                }
            }
            if ((this.shopScrollMaxOffset ?? 0) <= 0 || !this.shopScrollViewport) return;
            const viewport = this.shopScrollViewport;
            const withinX = pointer.x >= viewport.left && pointer.x <= viewport.right;
            const withinY = pointer.y >= viewport.top && pointer.y <= viewport.bottom;
            if (!withinX || !withinY) return;
            this.shopDragPointerId = pointer.id;
            this.shopDragStartY = pointer.y;
            this.shopDragStartOffset = this.shopScrollOffset ?? 0;
        });
        overlay.on('pointermove', (pointer) => {
            if (!pointer) return;
            if (this.shopPurchasedDragPointerId !== null && pointer.id === this.shopPurchasedDragPointerId) {
                const deltaX = pointer.x - this.shopPurchasedDragStartX;
                this.setShopPurchasedScrollOffset(this.shopPurchasedDragStartOffset - deltaX);
                return;
            }
            if (this.shopDragPointerId === null || pointer.id !== this.shopDragPointerId) return;
            const deltaY = pointer.y - this.shopDragStartY;
            this.setShopScrollOffset(this.shopDragStartOffset - deltaY);
        });
        const clearShopDrag = (pointer = null) => {
            if (pointer && this.shopDragPointerId !== null && pointer.id !== this.shopDragPointerId && pointer.id !== this.shopPurchasedDragPointerId) return;
            this.shopDragPointerId = null;
            this.shopPurchasedDragPointerId = null;
        };
        overlay.on('pointerup', clearShopDrag);
        overlay.on('pointerupoutside', clearShopDrag);
        this.scene.bringToTop('HudScene');
    }

    updateShopOverlayContent({ gold = 0, items = [], purchasedItems = [], rerollCost = null, rerollRemaining = 0, debugMode = false } = {}) {
        if (Number.isFinite(rerollCost)) {
            this.shopRerollCost = Math.max(0, Math.floor(rerollCost));
        }
        if (this.shopGoldText) {
            this.shopGoldText.setText(`${Math.max(0, Math.floor(gold))}`);
        }
        this.shopRerollButtonText?.setText('↻');
        this.shopRerollCostText?.setText(`${Math.max(0, Math.floor(this.shopRerollCost ?? 0))}`);
        const canReroll = debugMode || gold >= (this.shopRerollCost ?? 0);
        this.shopRerollButtonBg?.setFillStyle(canReroll ? 0x7d5a24 : 0x4e3d2b, 1);
        this.shopRerollButtonBg?.setStrokeStyle(2, canReroll ? 0x000000 : 0x231911, 1);
        this.shopRerollButtonBg?.disableInteractive();
        if (canReroll) {
            this.shopRerollButtonBg?.setInteractive({ useHandCursor: true });
        }
        this.shopRerollButtonText?.setColor(canReroll ? '#fff7dd' : '#c8b396');
        this.shopRerollCostText?.setColor(canReroll ? '#fff7dd' : '#c8b396');
        this.shopRerollButton?.setAlpha(canReroll ? 1 : 0.8);
        this.refreshShopStatsPanel();
        const hasItems = Array.isArray(items) && items.some(Boolean);
        if (this.shopBodyText) {
            this.shopBodyText.setText(hasItems ? '' : 'No items available.\nThe merchant cart is empty.');
            this.shopBodyText.setVisible(!hasItems);
        }
        const slotTargetCount = Math.max(debugMode ? items.length : 5, items.length, 1);
        this.rebuildPurchasedShopItems(purchasedItems);
        this.shopEmptySlots?.forEach((slot, index) => {
            slot?.setData?.('shopVisible', !hasItems && index < slotTargetCount);
            slot?.setVisible?.(!hasItems && index < slotTargetCount);
        });
        this.shopItemSlots?.forEach((slot, index) => {
            const item = items[index] ?? null;
            if (!slot?.container) return;
            if (!item) {
                slot.container.setData('shopVisible', false);
                slot.container.setVisible(false);
                return;
            }
            slot.container.setData('shopVisible', true);
            slot.container.setVisible(true);
            const iconKey = item.iconKey ?? null;
            const hasIconTexture = Boolean(iconKey && this.textures.exists(iconKey));
            slot.iconImage?.setVisible(hasIconTexture);
            if (hasIconTexture) {
                slot.iconImage?.setTexture(iconKey);
            }
            slot.iconText?.setVisible(!hasIconTexture);
            slot.nameText?.setText(item.name ?? item.id ?? 'Item');
            const statLines = this.formatShopItemStatLines(item);
            slot.statLineTexts?.forEach((textObject, lineIndex) => {
                const line = statLines[lineIndex] ?? null;
                textObject?.setVisible(Boolean(line));
                if (!line) {
                    textObject?.setText('');
                    return;
                }
                textObject?.setText(line.text);
                textObject?.setColor(line.color);
            });
            slot.priceText?.setText(`${Math.max(0, Math.floor(item.cost ?? 0))}G`);
            const canAfford = gold >= (item.cost ?? 0);
            const isLocked = item.locked === true;
            const outerStrokeColor = isLocked
                ? 0xd9c06b
                : 0x000000;
            const innerStrokeColor = isLocked
                ? 0xffdf8a
                : (canAfford ? 0x7e99a8 : 0x55646d);
            slot.bg?.setStrokeStyle(2, outerStrokeColor, 1);
            slot.inner?.setStrokeStyle(2, innerStrokeColor, 1);
            slot.bg?.setFillStyle(isLocked ? 0x1b252b : 0x162026, 1);
            slot.inner?.setFillStyle(isLocked ? 0x273740 : 0x213039, 1);
            slot.container?.setAlpha(isLocked ? 1 : 0.96);
            slot.priceText?.setColor(canAfford ? '#d9f6ff' : '#ff8a8a');
            slot.pricePanel?.setStrokeStyle(1, canAfford ? 0x8cc4dc : 0xb14a4a, 1);
            slot.lockButtonText?.setText(isLocked ? '🔒' : '🔓');
            slot.lockButtonText?.setColor(isLocked ? '#ffe7ab' : '#d9f6ff');
            slot.lockButtonBg?.setFillStyle(isLocked ? 0x4a5f28 : 0x25343d, 1);
            slot.lockButtonBg?.setStrokeStyle(1, isLocked ? 0xe0b55a : 0x8cc4dc, 1);
            slot.rarityBar?.setFillStyle(isLocked ? 0xb99948 : 0x7e99a8, 1);
            slot.selectText?.setText('');
            slot.selectText?.setColor(canAfford ? '#9db1bb' : '#ff8a8a');
            slot.hitArea?.removeAllListeners?.();
            slot.hitArea?.disableInteractive();
            if (canAfford) {
                slot.hitArea?.setInteractive({ useHandCursor: true });
                slot.hitArea?.on('pointerover', () => {
                    slot.container.setScale((slot.container.scaleX ?? 1) * 1.03);
                    slot.bg?.setFillStyle(0x1f2c34, 0.98);
                    slot.inner?.setStrokeStyle(3, 0x92b7ca, 1);
                    slot.selectText?.setColor('#ffffff');
                });
                slot.hitArea?.on('pointerout', () => {
                    slot.container.setScale(slot.container.getData('shopBaseScale') ?? 1);
                    slot.bg?.setFillStyle(isLocked ? 0x1b252b : 0x162026, 1);
                    slot.inner?.setStrokeStyle(3, innerStrokeColor, 1);
                    slot.selectText?.setColor('#9db1bb');
                });
                slot.hitArea?.on('pointerdown', () => {
                    const nextState = this.shopPurchaseCallback?.(item);
                    if (nextState) {
                        this.updateShopOverlayContent(nextState);
                        this.layoutShopOverlay();
                    }
                });
            } else {
                slot.container.setScale(slot.container.getData('shopBaseScale') ?? 1);
            }
            slot.lockButtonBg?.removeAllListeners?.();
            slot.lockButtonBg?.disableInteractive();
            slot.infoButtonBg?.removeAllListeners?.();
            slot.infoButtonBg?.setInteractive({ useHandCursor: true });
            slot.infoButtonBg?.on('pointerover', () => {
                slot.infoButtonBg.setFillStyle(0x614124, 1);
            });
            slot.infoButtonBg?.on('pointerout', () => {
                slot.infoButtonBg.setFillStyle(0x4b3522, 1);
            });
            slot.infoButtonBg?.on('pointerdown', (_pointer, _localX, _localY, event) => {
                event?.stopPropagation?.();
                this.showShopItemInfo(item);
            });
            if (!debugMode) {
                slot.lockButtonBg?.setInteractive({ useHandCursor: true });
                slot.lockButtonBg?.on('pointerdown', (_pointer, _localX, _localY, event) => {
                    event?.stopPropagation?.();
                    const nextState = this.shopToggleLockCallback?.(item);
                    if (nextState) {
                        this.updateShopOverlayContent(nextState);
                        this.layoutShopOverlay();
                    }
                });
                slot.lockButtonBg?.on('pointerover', () => {
                    slot.lockButtonBg.setScale(1.08);
                });
                slot.lockButtonBg?.on('pointerout', () => slot.lockButtonBg.setScale(1));
            } else {
                slot.lockButtonBg?.setScale(1);
            }
        });
    }

    rebuildPurchasedShopItems(purchasedItems = []) {
        this.shopPurchasedStrip?.removeAll(true);
        this.shopPurchasedItems = [];
        this.shopPurchasedScrollOffset = 0;
        this.shopPurchasedScrollMaxOffset = 0;
        const normalizedItems = Array.isArray(purchasedItems) ? purchasedItems.filter(Boolean) : [];
        this.shopPurchasedLabel?.setVisible(normalizedItems.length > 0);
        this.shopPurchasedStrip?.setVisible(normalizedItems.length > 0);
        if (!this.shopPurchasedStrip || !normalizedItems.length) {
            return;
        }

        normalizedItems.forEach((item) => {
            const slot = this.add.container(0, 0);
            const bg = this.add.rectangle(0, 0, 30, 30, 0x11171b, 1)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0x7e99a8, 1);
            const inner = this.add.rectangle(0, 0, 24, 24, 0x213039, 1)
                .setOrigin(0.5)
                .setStrokeStyle(1, 0x000000, 1);
            const iconKey = item.iconKey ?? null;
            const hasIconTexture = Boolean(iconKey && this.textures.exists(iconKey));
            const iconImage = this.add.image(0, -2, '__missing_texture__')
                .setOrigin(0.5)
                .setDisplaySize(17, 17)
                .setVisible(hasIconTexture);
            if (hasIconTexture) {
                iconImage.setTexture(iconKey);
            }
            const iconText = this.add.text(0, -1, hasIconTexture ? '' : '?', {
                fontSize: '9px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#d9f6ff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5).setVisible(!hasIconTexture);
            const stackCount = Math.max(1, Math.floor(item.stackCount ?? 1));
            const stackText = this.add.text(11, 11, stackCount > 1 ? `x${stackCount}` : '', {
                fontSize: '7px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#fff2cc',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(1, 1);
            const hitArea = this.add.rectangle(0, 0, 30, 30, 0xffffff, 0.001)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            hitArea.on('pointerover', () => slot.setScale(1.06));
            hitArea.on('pointerout', () => slot.setScale(1));
            hitArea.on('pointerdown', () => this.showShopItemInfo(item));
            slot.add([bg, inner, iconImage, iconText, stackText, hitArea]);
            this.shopPurchasedStrip.add(slot);
            this.shopPurchasedItems.push(slot);
        });
    }

    setShopPurchasedScrollOffset(nextOffset = 0) {
        this.shopPurchasedScrollOffset = Phaser.Math.Clamp(
            nextOffset,
            0,
            Math.max(0, this.shopPurchasedScrollMaxOffset ?? 0)
        );
        this.layoutShopOverlay();
    }

    layoutShopOverlay() {
        if (!this.shopOverlay || !this.shopContainer || !this.shopPanel) return;
        const { width, height, isMobileShopLayout, isMobileLandscape } = this.getShopLayoutFlags();
        const safeX = Math.max(10, Math.floor(width * 0.02));
        const safeY = Math.max(10, Math.floor(height * 0.02));
        const panelWidth = isMobileLandscape
            ? width
            : isMobileShopLayout
            ? Math.max(320, width - 12)
            : Math.min(Math.max(Math.floor(width * 0.96), 400), width - safeX * 2);
        const panelHeight = isMobileLandscape
            ? height
            : isMobileShopLayout
            ? Math.max(320, height - 12)
            : Math.min(Math.max(Math.floor(height * 0.9), 340), height - safeY * 2);
        const compact = isMobileShopLayout;
        const statsPanelActualWidth = isMobileShopLayout ? 170 : 220;
        const useMobileCompactTopBar = isMobileShopLayout;
        const headerBarHeight = useMobileCompactTopBar ? 24 : 30;
        const footerBarHeight = useMobileCompactTopBar ? 12 : 24;
        const gridAreaPadding = useMobileCompactTopBar ? 10 : compact ? 16 : 20;
        const gridAvailableWidth = Math.max(120, panelWidth - (useMobileCompactTopBar ? 24 : 54));
        const columns = this.getResponsiveShopGridColumns(gridAvailableWidth, isMobileShopLayout);
        const baseCardWidth = 188;
        const baseCardHeight = 190;
        const baseGapX = compact ? 12 : 16;
        const baseGapY = compact ? 16 : 18;

        this.shopOverlay.setSize(width, height);
        this.shopContainer.setPosition(width / 2, height / 2);
        this.shopStatsPopupContainer?.setPosition(width / 2, height / 2);
        this.shopPanel.setDisplaySize(panelWidth, panelHeight);
        this.shopPanelInner?.setDisplaySize(panelWidth - 12, panelHeight - 12);
        this.shopHeaderBar?.setDisplaySize(panelWidth - (useMobileCompactTopBar ? 8 : 28), headerBarHeight);
        this.shopFooterBar?.setDisplaySize(panelWidth - (useMobileCompactTopBar ? 8 : 28), footerBarHeight);
        this.shopHeaderBar?.setPosition(0, -panelHeight / 2 + (useMobileCompactTopBar ? 16 : 26));
        this.shopFooterBar?.setPosition(0, panelHeight / 2 - (useMobileCompactTopBar ? 8 : 22));
        this.shopTitle?.setPosition(0, -panelHeight / 2 + (useMobileCompactTopBar ? 15 : 22));
        this.shopTitle?.setFontSize(useMobileCompactTopBar ? '13px' : isMobileShopLayout ? '16px' : '20px');
        this.shopTitle?.setVisible(!useMobileCompactTopBar);
        this.shopSubtitle?.setPosition(0, -panelHeight / 2 + 48);
        this.shopSubtitle?.setVisible(false);
        this.shopStatsPopupOverlay?.setSize(panelWidth - 40, panelHeight - 40);
        this.shopStatsPopupOverlay?.setVisible(this.shopStatsVisible);
        const statsToggleWidth = useMobileCompactTopBar ? 70 : 120;
        const statsToggleHeight = useMobileCompactTopBar ? 20 : 24;
        const statsToggleX = -panelWidth / 2 + (useMobileCompactTopBar ? 44 : 74);
        const statsToggleY = -panelHeight / 2 + (useMobileCompactTopBar ? 16 : 26);
        this.shopStatsToggleButton?.setPosition(statsToggleX, statsToggleY);
        this.shopStatsToggleButton?.setDisplaySize(statsToggleWidth, statsToggleHeight);
        this.shopStatsToggleButtonText?.setPosition(statsToggleX, statsToggleY);
        this.shopStatsToggleButtonText?.setFontSize(useMobileCompactTopBar ? '8px' : isMobileShopLayout ? '10px' : '11px');
        this.shopStatsToggleButtonText?.setText(
            this.shopStatsVisible
                ? (useMobileCompactTopBar ? 'CLOSE' : 'HIDE STATS')
                : (useMobileCompactTopBar ? 'STATS' : 'SHOW STATS')
        );
        this.shopStatsPanel?.setVisible(this.shopStatsVisible);
        this.shopStatsInner?.setVisible(this.shopStatsVisible);
        this.shopStatsTitle?.setVisible(this.shopStatsVisible);
        this.shopStatsPanel?.setDisplaySize(statsPanelActualWidth, panelHeight - 84);
        this.shopStatsInner?.setDisplaySize(statsPanelActualWidth - 12, panelHeight - 96);
        this.shopStatsPanel?.setPosition(0, 10);
        this.shopStatsInner?.setPosition(0, 10);
        this.shopStatsTitle?.setPosition(0, -panelHeight / 2 + 76);
        const statsStartX = -statsPanelActualWidth / 2 + 14;
        const statsStartY = -panelHeight / 2 + 98;
        this.shopStatsLineTexts?.forEach((line, index) => {
            line?.setVisible(this.shopStatsVisible);
            line?.setPosition(statsStartX, statsStartY + index * 16);
        });
        this.shopStatsHintPanel?.setVisible(this.shopStatsVisible);
        this.shopStatsHintText?.setVisible(this.shopStatsVisible);
        this.shopStatsHintPanel?.setPosition(0, panelHeight / 2 - 64);
        this.shopStatsHintPanel?.setDisplaySize(statsPanelActualWidth - 16, 68);
        this.shopStatsHintText?.setPosition(-statsPanelActualWidth / 2 + 14, panelHeight / 2 - 92);
        this.shopStatsHintText?.setWordWrapWidth(statsPanelActualWidth - 28);
        if (this.shopStatsVisible && this.shopStatsPopupContainer) {
            this.children.bringToTop(this.shopStatsPopupContainer);
        }
        const goldPanelWidth = useMobileCompactTopBar ? 96 : 118;
        const goldPanelHeight = useMobileCompactTopBar ? 22 : 28;
        const goldCenterX = useMobileCompactTopBar ? (panelWidth / 2 - 72) : panelWidth / 2 - 92;
        const goldCenterY = -panelHeight / 2 + (useMobileCompactTopBar ? 16 : 26);
        this.shopGoldPanel?.setPosition(goldCenterX, goldCenterY);
        this.shopGoldPanel?.setDisplaySize(goldPanelWidth, goldPanelHeight);
        this.shopGoldIcon?.setPosition(goldCenterX - (useMobileCompactTopBar ? 30 : 46), goldCenterY);
        this.shopGoldIcon?.setDisplaySize(useMobileCompactTopBar ? 14 : compact ? 16 : 18, useMobileCompactTopBar ? 14 : compact ? 16 : 18);
        this.shopGoldText?.setPosition(goldCenterX - (useMobileCompactTopBar ? 18 : 32), goldCenterY);
        this.shopGoldText?.setFontSize(useMobileCompactTopBar ? '14px' : '18px');
        const gridLeft = (-panelWidth / 2) + 18 + gridAreaPadding;
        const gridRight = (panelWidth / 2) - gridAreaPadding;
        const gridCenterX = (gridLeft + gridRight) / 2;
        this.shopSectionLabel?.setPosition(gridCenterX, useMobileCompactTopBar ? -panelHeight / 2 + 54 : -panelHeight / 2 + 110);
        const visibleItemTargets = (this.shopItemSlots ?? [])
            .map((slot) => slot?.container)
            .filter((target) => target && target.getData('shopVisible') !== false);
        const visibleEmptyTargets = (this.shopEmptySlots ?? [])
            .filter((target) => target && target.getData('shopVisible') !== false);
        const activeTargets = visibleItemTargets.length ? visibleItemTargets : visibleEmptyTargets;
        const totalSlots = Math.max(1, activeTargets.length);
        const rows = Math.max(1, Math.ceil(totalSlots / columns));
        const viewportTop = useMobileCompactTopBar ? -panelHeight / 2 + 42 : -panelHeight / 2 + 126;
        const purchasedStripVisible = (this.shopPurchasedItems?.length ?? 0) > 0;
        const viewportBottom = useMobileCompactTopBar
            ? (purchasedStripVisible ? panelHeight / 2 - 42 : panelHeight / 2 - 12)
            : (purchasedStripVisible ? panelHeight / 2 - 116 : panelHeight / 2 - 62);
        const gridViewportWidth = Math.max(1, gridRight - gridLeft);
        const gridViewportHeight = Math.max(1, viewportBottom - viewportTop);
        const widthScale = Math.max(
            0.55,
            Math.min(
                1,
                (gridViewportWidth - Math.max(0, columns - 1) * baseGapX) / Math.max(1, columns * baseCardWidth)
            )
        );
        const heightScale = Math.max(
            0.55,
            Math.min(
                1,
                (gridViewportHeight - 12 - Math.max(0, rows - 1) * baseGapY) / Math.max(1, rows * baseCardHeight)
            )
        );
        const targetScale = Math.min(widthScale, heightScale, 1);
        const itemCardWidth = baseCardWidth * targetScale;
        const itemCardHeight = baseCardHeight * targetScale;
        const gapX = baseGapX * Math.max(0.85, targetScale);
        const gapY = baseGapY * Math.max(0.85, targetScale);
        const slotSpacing = itemCardWidth + gapX;
        const rowSpacing = itemCardHeight + gapY;
        const gridStartY = viewportTop + (itemCardHeight / 2) + (compact ? 8 : 12);
        const contentHeight = Math.max(itemCardHeight, (rows - 1) * rowSpacing + itemCardHeight + (compact ? 8 : 12));
        const viewportHeight = Math.max(1, viewportBottom - viewportTop);
        this.shopScrollMaxOffset = Math.max(0, contentHeight - viewportHeight);
        this.shopScrollOffset = Phaser.Math.Clamp(this.shopScrollOffset ?? 0, 0, this.shopScrollMaxOffset);
        this.shopScrollViewport = {
            left: width / 2 - panelWidth / 2 + 18,
            right: width / 2 + panelWidth / 2 - 18,
            top: height / 2 + viewportTop,
            bottom: height / 2 + viewportBottom
        };
        const layoutGridSlot = (target, index) => {
            if (!target) return;
            const row = Math.floor(index / columns);
            const col = index % columns;
            const rowCount = row === rows - 1
                ? Math.max(1, totalSlots - row * columns)
                : columns;
            const rowWidth = rowCount <= 1 ? itemCardWidth : rowCount * itemCardWidth + (rowCount - 1) * gapX;
            const rowOffsetX = gridCenterX - rowWidth / 2 + itemCardWidth / 2;
            const x = Math.round(rowOffsetX + col * slotSpacing);
            const y = Math.round(gridStartY + row * rowSpacing - (this.shopScrollOffset ?? 0));
            target.setPosition(x, y);
            target.setScale(targetScale);
            target.setData('shopBaseScale', targetScale);
            const targetHalfHeight = target.getBounds?.()?.height
                ? target.getBounds().height / 2
                : 92;
            const isVisible = (y + targetHalfHeight) >= viewportTop && (y - targetHalfHeight) <= viewportBottom;
            target.setVisible(target.getData('shopVisible') !== false && isVisible);
        };
        this.shopEmptySlots?.forEach((slot) => {
            if (slot?.getData('shopVisible') === false) {
                slot.setVisible(false);
            }
        });
        this.shopItemSlots?.forEach((slot) => {
            if (slot?.container?.getData('shopVisible') === false) {
                slot.container.setVisible(false);
            }
        });
        activeTargets.forEach((target, index) => layoutGridSlot(target, index));
        this.shopBodyText?.setPosition(gridCenterX, viewportTop + 70);
        if (this.shopPurchasedLabel) {
            this.shopPurchasedLabel.setPosition(0, useMobileCompactTopBar ? panelHeight / 2 - 34 : panelHeight / 2 - 98);
            this.shopPurchasedLabel.setVisible(!useMobileCompactTopBar && (this.shopPurchasedItems?.length ?? 0) > 0);
        }
        this.shopPurchasedFrame?.setPosition(0, useMobileCompactTopBar ? panelHeight / 2 - 18 : panelHeight / 2 - 62);
        this.shopPurchasedFrame?.setDisplaySize(useMobileCompactTopBar ? panelWidth - 20 : panelWidth - 70, useMobileCompactTopBar ? 24 : 34);
        if (this.shopPurchasedStrip) {
            this.shopPurchasedStrip.setPosition(0, useMobileCompactTopBar ? panelHeight / 2 - 18 : panelHeight / 2 - 62);
            const purchasedSlots = this.shopPurchasedItems ?? [];
            const slotSpacing = compact ? 34 : 36;
            const stripWidth = Math.max(1, useMobileCompactTopBar ? panelWidth - 20 : panelWidth - 70);
            const contentWidth = Math.max(stripWidth, purchasedSlots.length > 0 ? 30 + Math.max(0, purchasedSlots.length - 1) * slotSpacing : 0);
            this.shopPurchasedScrollMaxOffset = Math.max(0, contentWidth - stripWidth);
            this.shopPurchasedScrollOffset = Phaser.Math.Clamp(this.shopPurchasedScrollOffset ?? 0, 0, this.shopPurchasedScrollMaxOffset);
            const stripLeft = -stripWidth / 2;
            const stripRight = stripWidth / 2;
            this.shopPurchasedViewport = {
                left: width / 2 + stripLeft,
                right: width / 2 + stripRight,
                top: height / 2 + (useMobileCompactTopBar ? panelHeight / 2 - 30 : panelHeight / 2 - 80),
                bottom: height / 2 + (useMobileCompactTopBar ? panelHeight / 2 - 6 : panelHeight / 2 - 44)
            };
            this.shopPurchasedMaskGraphics?.clear();
            this.shopPurchasedMaskGraphics?.fillStyle(0xffffff, 1);
            this.shopPurchasedMaskGraphics?.fillRect(
                this.shopPurchasedViewport.left,
                this.shopPurchasedViewport.top,
                this.shopPurchasedViewport.right - this.shopPurchasedViewport.left,
                this.shopPurchasedViewport.bottom - this.shopPurchasedViewport.top
            );
            purchasedSlots.forEach((slot, index) => {
                const x = stripLeft + 15 + index * slotSpacing - (this.shopPurchasedScrollOffset ?? 0);
                const isVisible = x >= stripLeft - 18 && x <= stripRight + 18;
                slot.setVisible(isVisible);
                if (!isVisible) return;
                slot.setPosition(x, 0);
                slot.setScale(useMobileCompactTopBar ? 0.82 : compact ? 0.92 : 1);
            });
        }
        this.shopRerollButton?.setPosition(
            useMobileCompactTopBar ? (panelWidth / 2 - 134) : panelWidth / 2 - 61,
            -panelHeight / 2 + (useMobileCompactTopBar ? 16 : 106)
        );
        this.shopRerollButton?.setScale(useMobileCompactTopBar ? 0.68 : 1);
        this.shopContinueButton?.setPosition(
            panelWidth / 2 - (useMobileCompactTopBar ? 68 : 88),
            useMobileCompactTopBar ? (panelHeight / 2 - 24) : (panelHeight / 2 - 32)
        );
        this.shopContinueButton?.setScale(useMobileCompactTopBar ? 0.78 : 1);
    }

    buildShopItemDetail(item = null) {
        if (!item) {
            return ['No item data.'];
        }
        if (typeof item.shortText === 'string' && item.shortText.trim()) {
            return [item.shortText.trim()];
        }
        const lines = [];
        const modifiers = item.modifiers ?? {};
        const effectBonuses = item.effectBonuses ?? {};
        const special = item.special ?? {};
        const unlockElement = item.unlockElement ?? null;

        Object.entries(modifiers).forEach(([key, value]) => {
            const line = this.formatShopItemModifierLine(key, value);
            if (line) {
                lines.push(line);
            }
        });

        Object.entries(effectBonuses).forEach(([effectKey, bonusConfig]) => {
            if (!bonusConfig || typeof bonusConfig !== 'object') return;
            Object.entries(bonusConfig).forEach(([bonusKey, bonusValue]) => {
                if (bonusValue === true) {
                    lines.push(`${effectKey}: ${bonusKey}`);
                    return;
                }
                if (Number.isFinite(Number(bonusValue))) {
                    const numericValue = Number(bonusValue);
                    const prettyBonusKey = bonusKey.replace(/[A-Z]/g, (char) => ` ${char.toLowerCase()}`);
                    if (Math.abs(numericValue) <= 1 && !Number.isInteger(numericValue)) {
                        const sign = numericValue >= 0 ? '+' : '';
                        lines.push(`${effectKey}: ${prettyBonusKey} ${sign}${Math.round(numericValue * 100)}%`);
                    } else {
                        const sign = numericValue >= 0 ? '+' : '';
                        lines.push(`${effectKey}: ${prettyBonusKey} ${sign}${Math.round(numericValue)}`);
                    }
                }
            });
        });

        Object.entries(special).forEach(([key, value]) => {
            const label = key.replace(/[A-Z]/g, (char) => ` ${char.toLowerCase()}`);
            if (value === true) {
                lines.push(label);
                return;
            }
            if (Number.isFinite(Number(value))) {
                const numericValue = Number(value);
                const sign = numericValue >= 0 ? '+' : '';
                if (Math.abs(numericValue) <= 1 && !Number.isInteger(numericValue)) {
                    lines.push(`${label} ${sign}${Math.round(numericValue * 100)}%`);
                } else {
                    lines.push(`${label} ${sign}${Math.round(numericValue)}`);
                }
            }
        });

        if (unlockElement?.effectKey) {
            const label = String(unlockElement.label ?? unlockElement.effectKey).replace(/^./, (char) => char.toUpperCase());
            if (unlockElement.mode === 'hit_explosion') {
                lines.push(`Enable ${label}`);
                lines.push('Replaces current skill effect');
                lines.push('Explodes at hit location');
            } else {
                const chance = Math.round((unlockElement.chance ?? 0.2) * 100);
                lines.push(`Enable ${label}`);
                lines.push('Replaces current skill effect');
                lines.push(`${chance}% chance to apply on hit`);
            }
        }

        if (!lines.length) {
            lines.push('No detailed description.');
        }

        return lines;
    }

    showShopItemInfo(item = null) {
        if (!item || !this.shopContainer) return;
        this.hideShopItemInfo();
        const width = this.scale.width;
        const height = this.scale.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const isMobile = width < 640;
        const panelWidth = isMobile ? 230 : 310;
        const detailLines = this.buildShopItemDetail(item);
        const lineCount = Math.max(1, detailLines.length);
        const panelHeight = Phaser.Math.Clamp((isMobile ? 94 : 104) + lineCount * (isMobile ? 15 : 17), isMobile ? 156 : 180, isMobile ? 300 : 340);
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.2)
            .setOrigin(0)
            .setInteractive()
            .setDepth(2006);
        const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x11171b, 0.98)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x7e99a8, 1)
            .setDepth(2007)
            .setInteractive();
        const title = this.add.text(centerX, centerY - panelHeight / 2 + 20, `${item.name ?? item.id ?? 'Item'} Info`, {
            fontSize: isMobile ? '12px' : '14px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#e7f4ff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: panelWidth - 26 }
        }).setOrigin(0.5).setDepth(2008).setInteractive();
        const text = this.add.text(centerX - panelWidth / 2 + 14, centerY - panelHeight / 2 + 44, detailLines.join('\n'), {
            fontSize: isMobile ? '9px' : '10px',
            fontFamily: 'monospace',
            color: '#d9f6ff',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: panelWidth - 28 }
        }).setOrigin(0, 0).setDepth(2008).setInteractive();

        const stopClose = (gameObject) => {
            gameObject.on('pointerdown', (pointer) => {
                pointer?.event?.stopPropagation?.();
            });
        };
        stopClose(panel);
        stopClose(title);
        stopClose(text);
        overlay.on('pointerdown', () => this.hideShopItemInfo());

        this.children.add(overlay);
        this.children.add(panel);
        this.children.add(title);
        this.children.add(text);
        this.shopItemInfoOverlay = overlay;
        this.shopItemInfoPanel = panel;
        this.shopItemInfoTitle = title;
        this.shopItemInfoText = text;
    }

    hideShopItemInfo() {
        this.shopItemInfoOverlay?.destroy();
        this.shopItemInfoOverlay = null;
        this.shopItemInfoPanel?.destroy();
        this.shopItemInfoPanel = null;
        this.shopItemInfoTitle?.destroy();
        this.shopItemInfoTitle = null;
        this.shopItemInfoText?.destroy();
        this.shopItemInfoText = null;
    }

    hideShopOverlay() {
        this.hideShopItemInfo();
        if (this.shopWheelHandler) {
            this.input.off('wheel', this.shopWheelHandler, this);
            this.shopWheelHandler = null;
        }
        this.shopOverlay?.destroy();
        this.shopOverlay = null;
        this.shopContainer?.destroy(true);
        this.shopContainer = null;
        this.shopPanel = null;
        this.shopPanelInner = null;
        this.shopHeaderBar = null;
        this.shopFooterBar = null;
        this.shopTitle = null;
        this.shopGoldIcon = null;
        this.shopGoldText = null;
        this.shopGoldPanel = null;
        this.shopStatsPopupContainer?.destroy(true);
        this.shopStatsPopupContainer = null;
        this.shopStatsPopupOverlay = null;
        this.shopStatsPanel = null;
        this.shopStatsInner = null;
        this.shopStatsTitle = null;
        this.shopStatsText = null;
        this.shopStatsLineTexts = [];
        this.shopStatsHintPanel = null;
        this.shopStatsHintText = null;
        this.shopStatsToggleButton = null;
        this.shopStatsToggleButtonText = null;
        this.shopStatsVisible = false;
        this.shopItemInfoOverlay = null;
        this.shopItemInfoPanel = null;
        this.shopItemInfoTitle = null;
        this.shopItemInfoText = null;
        this.shopSectionLabel = null;
        this.shopPurchasedLabel = null;
        this.shopPurchasedFrame = null;
        this.shopPurchasedStrip = null;
        this.shopPurchasedItems = [];
        this.shopPurchasedMaskGraphics = null;
        this.shopPurchasedMask = null;
        this.shopPurchasedScrollOffset = 0;
        this.shopPurchasedScrollMaxOffset = 0;
        this.shopPurchasedViewport = null;
        this.shopPurchasedDragPointerId = null;
        this.shopPurchasedDragStartX = 0;
        this.shopPurchasedDragStartOffset = 0;
        this.shopBodyText = null;
        this.shopEmptySlots = [];
        this.shopItemSlots = [];
        this.shopItemCount = 0;
        this.shopGridColumns = 0;
        this.shopScrollOffset = 0;
        this.shopScrollMaxOffset = 0;
        this.shopScrollViewport = null;
        this.shopDragPointerId = null;
        this.shopDragStartY = 0;
        this.shopDragStartOffset = 0;
        this.shopPurchaseCallback = null;
        this.shopToggleLockCallback = null;
        this.shopRerollCost = 5;
        this.shopRerollButton = null;
        this.shopRerollButtonShadow = null;
        this.shopRerollButtonBg = null;
        this.shopRerollButtonText = null;
        this.shopRerollCostText = null;
        this.shopRerollCallback = null;
        this.shopContinueButton = null;
        this.shopContinueButtonShadow = null;
        this.shopContinueButtonBg = null;
        this.shopContinueButtonText = null;
        this.shopContinueCallback = null;
    }

    showSupporterSelection({ supporterKeys = [], gold = 0, rerollCost = 5, rerollRemaining = 0, onSelect = null, onReroll = null } = {}) {
        this.hideSupporterSelection();
        const validKeys = (Array.isArray(supporterKeys) ? supporterKeys : []).filter((key) => SUPPORTER_CONFIG[key]);
        if (!validKeys.length) return;

        this.supporterChoiceCallback = typeof onSelect === 'function' ? onSelect : null;
        this.supporterChoiceRerollCallback = typeof onReroll === 'function' ? onReroll : null;
        const width = this.scale.width;
        const height = this.scale.height;
        const isMobile = width < 640;
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(200)
            .setInteractive();
        const container = this.add.container(width / 2, height / 2).setDepth(202).setScrollFactor(0);
        const panelWidth = Math.min(isMobile ? width - 28 : width - 72, isMobile ? 390 : 1080);
        const panelHeight = Math.min(isMobile ? height - 70 : 380, height - 48);
        const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x11171b, 0.97)
            .setOrigin(0.5)
            .setStrokeStyle(3, 0x000000, 1);
        const inner = this.add.rectangle(0, 0, panelWidth - 12, panelHeight - 12, 0x1b252b, 0.98)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x7e99a8, 1);
        const title = this.add.text(0, -panelHeight / 2 + 26, 'CHOOSE A SUPPORTER', {
            fontSize: isMobile ? '16px' : '20px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#e7f4ff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        const rerollButton = this.add.rectangle(panelWidth / 2 - 76, -panelHeight / 2 + 28, 72, 32, 0x25343d, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x000000, 1);
        const canReroll = gold >= rerollCost && rerollRemaining > 0;
        rerollButton.setFillStyle(canReroll ? 0x25343d : 0x1b252b, 1);
        rerollButton.setStrokeStyle(2, canReroll ? 0x7e99a8 : 0x55646d, 1);
        const rerollText = this.add.text(panelWidth / 2 - 76, -panelHeight / 2 + 28, `↻ ${Math.max(0, Math.floor(rerollRemaining))}`, {
            fontSize: isMobile ? '14px' : '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: canReroll ? '#d9f6ff' : '#8a98a0',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        if (canReroll && this.supporterChoiceRerollCallback) {
            rerollButton.setInteractive({ useHandCursor: true });
            rerollButton.on('pointerover', () => {
                rerollButton.setFillStyle(0x30454f, 1);
                rerollText.setColor('#f2fcff');
            });
            rerollButton.on('pointerout', () => {
                rerollButton.setFillStyle(0x25343d, 1);
                rerollText.setColor('#d9f6ff');
            });
            rerollButton.on('pointerdown', () => this.supporterChoiceRerollCallback?.());
        }

        container.add([panel, inner, title, rerollButton, rerollText]);
        const columns = isMobile ? Math.min(2, validKeys.length) : Math.min(5, validKeys.length);
        const rows = Math.ceil(validKeys.length / columns);
        const cardWidth = isMobile ? Math.floor((panelWidth - 52) / Math.max(1, columns)) : 188;
        const cardHeight = 180;
        const gapX = isMobile ? 12 : 16;
        const gapY = 16;
        const totalWidth = columns * cardWidth + (columns - 1) * gapX;
        const totalHeight = rows * cardHeight + (rows - 1) * gapY;
        const startX = -totalWidth / 2 + cardWidth / 2;
        const startY = -totalHeight / 2 + cardHeight / 2 + 18;

        this.supporterChoiceOptions = validKeys.map((supporterKey, index) => {
            const config = SUPPORTER_CONFIG[supporterKey];
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + col * (cardWidth + gapX);
            const y = startY + row * (cardHeight + gapY);
            const card = this.add.container(x, y);
            const shadow = this.add.rectangle(4, 6, cardWidth, cardHeight, 0x000000, 0.22).setOrigin(0.5);
            const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x11171b, 0.98)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0x000000, 1);
            const frame = this.add.rectangle(0, 0, cardWidth - 8, cardHeight - 8, 0x1b252b, 0.98)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0x7e99a8, 1);
            const iconFrame = this.add.rectangle(0, -36, 72, 72, 0x213039, 1)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0x556f80, 1);
            const atlasKey = config.atlas?.key ?? null;
            const previewFrame = config.animations?.idle?.frames?.[0] ?? null;
            const icon = atlasKey && previewFrame && this.textures.exists(atlasKey)
                ? this.add.image(0, -36, atlasKey, previewFrame).setDisplaySize(48, 48)
                : this.add.text(0, -36, '?', {
                    fontSize: '28px',
                    fontFamily: 'monospace',
                    color: '#e7f4ff',
                    stroke: '#000000',
                    strokeThickness: 3
                }).setOrigin(0.5);
            const name = this.add.text(0, 26, config.label ?? supporterKey, {
                fontSize: '14px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#e7f4ff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: cardWidth - 24 }
            }).setOrigin(0.5);
            const infoButton = this.add.circle(cardWidth / 2 - 18, -cardHeight / 2 + 18, 10, 0x25343d, 1)
                .setStrokeStyle(2, 0x7e99a8, 1)
                .setInteractive({ useHandCursor: true });
            const infoText = this.add.text(cardWidth / 2 - 18, -cardHeight / 2 + 18, 'i', {
                fontSize: '12px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#d9f6ff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            const hit = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff, 0.001)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            hit.on('pointerover', () => {
                card.setScale(1.03);
                bg.setFillStyle(0x1b252b, 0.98);
                frame.setStrokeStyle(2, 0xa8d6ea, 1);
            });
            hit.on('pointerout', () => {
                card.setScale(1);
                bg.setFillStyle(0x11171b, 0.98);
                frame.setStrokeStyle(2, 0x7e99a8, 1);
            });
            hit.on('pointerdown', () => {
                this.supporterChoiceCallback?.(supporterKey);
            });
            infoButton.on('pointerover', () => {
                infoButton.setFillStyle(0x30454f, 1);
            });
            infoButton.on('pointerout', () => {
                infoButton.setFillStyle(0x25343d, 1);
            });
            infoButton.on('pointerdown', (pointer) => {
                pointer?.event?.stopPropagation?.();
                this.showSupporterPassiveInfo(supporterKey);
            });
            card.add([shadow, bg, frame, iconFrame, icon, name, hit, infoButton, infoText]);
            container.add(card);
            return card;
        });

        this.supporterChoiceOverlay = overlay;
        this.supporterChoiceContainer = container;
        this.supporterChoiceRerollButton = rerollButton;
        this.supporterChoiceRerollText = rerollText;
        this.tweens.add({
            targets: overlay,
            alpha: { from: 0, to: 0.72 },
            duration: 180,
            ease: 'Sine.easeOut'
        });
        container.setScale(0.96);
        this.tweens.add({
            targets: container,
            scale: 1,
            alpha: { from: 0, to: 1 },
            duration: 200,
            ease: 'Back.Out'
        });
        this.scene.bringToTop('HudScene');
    }

    showPreShopCardSelection({ cards = [], gold = 0, rerollCost = 5, rerollRemaining = 0, onSelect = null, onReroll = null } = {}) {
        this.hidePreShopCardSelection();
        const validCards = (Array.isArray(cards) ? cards : []).filter(Boolean);
        if (!validCards.length) return;

        this.preShopCardSelectCallback = typeof onSelect === 'function' ? onSelect : null;
        this.preShopCardRerollCallback = typeof onReroll === 'function' ? onReroll : null;
        const width = this.scale.width;
        const height = this.scale.height;
        const isMobileDevice = Boolean(this.sys.game.device.os.android || this.sys.game.device.os.iOS);
        const isMobile = isMobileDevice || Math.min(width, height) < 640;
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(200)
            .setInteractive();
        const container = this.add.container(width / 2, height / 2).setDepth(202).setScrollFactor(0);
        const panelWidth = Math.min(isMobile ? width - 28 : width - 72, isMobile ? 390 : 1080);
        const panelHeight = Math.min(isMobile ? height - 70 : 380, height - 48);
        const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x11171b, 0.97)
            .setOrigin(0.5)
            .setStrokeStyle(3, 0x000000, 1);
        const inner = this.add.rectangle(0, 0, panelWidth - 12, panelHeight - 12, 0x1b252b, 0.98)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x7e99a8, 1);
        const title = this.add.text(0, -panelHeight / 2 + 26, 'CHOOSE A CARD', {
            fontSize: isMobile ? '16px' : '20px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#e7f4ff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        const subtitle = this.add.text(0, -panelHeight / 2 + 52, 'Pick 1 bonus before the shop opens', {
            fontSize: isMobile ? '11px' : '13px',
            fontFamily: 'monospace',
            color: '#b7d0db',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        const canReroll = gold >= rerollCost && rerollRemaining > 0;
        const rerollButton = this.add.rectangle(panelWidth / 2 - 76, -panelHeight / 2 + 28, 72, 32, 0x25343d, 1)
            .setOrigin(0.5)
            .setStrokeStyle(2, canReroll ? 0x8cc4dc : 0x55646d, 1);
        const rerollText = this.add.text(panelWidth / 2 - 76, -panelHeight / 2 + 28, `↻ ${Math.max(0, Math.floor(rerollRemaining))}`, {
            fontSize: isMobile ? '14px' : '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: canReroll ? '#d9f6ff' : '#7f9299',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        if (canReroll && this.preShopCardRerollCallback) {
            rerollButton.setInteractive({ useHandCursor: true });
            rerollButton.on('pointerover', () => {
                rerollButton.setFillStyle(0x30454f, 1);
                rerollText.setColor('#f2fcff');
            });
            rerollButton.on('pointerout', () => {
                rerollButton.setFillStyle(0x25343d, 1);
                rerollText.setColor('#d9f6ff');
            });
            rerollButton.on('pointerdown', () => this.preShopCardRerollCallback?.());
        }

        container.add([panel, inner, title, subtitle, rerollButton, rerollText]);
        const columns = isMobile ? Math.min(2, validCards.length) : Math.min(4, validCards.length);
        const rows = Math.ceil(validCards.length / columns);
        const mobileCardScale = 0.8;
        const mobileBaseCardWidth = Math.floor((panelWidth - 52) / Math.max(1, columns));
        const cardWidth = isMobile ? Math.floor(mobileBaseCardWidth * mobileCardScale) : 188;
        const cardHeight = isMobile ? Math.floor(172 * mobileCardScale) : 190;
        const gapX = isMobile ? 10 : 16;
        const gapY = isMobile ? 12 : 16;
        const totalWidth = columns * cardWidth + (columns - 1) * gapX;
        const totalHeight = rows * cardHeight + (rows - 1) * gapY;
        const startX = -totalWidth / 2 + cardWidth / 2;
        const startY = -totalHeight / 2 + cardHeight / 2 + 26;

        this.preShopCardOptions = validCards.map((cardConfig, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + col * (cardWidth + gapX);
            const y = startY + row * (cardHeight + gapY);
            const card = this.add.container(x, y);
            const rarityColor = cardConfig.rarityColor ?? 0xa3a3a3;
            const rarityAccentColor = cardConfig.rarityAccentColor ?? 0xd9d9d9;
            const shadow = this.add.rectangle(4, 6, cardWidth, cardHeight, 0x000000, 0.24).setOrigin(0.5);
            const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x162026, 0.98)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0x000000, 1);
            const frame = this.add.rectangle(0, 0, cardWidth - 8, cardHeight - 8, 0x213039, 0.98)
                .setOrigin(0.5)
                .setStrokeStyle(3, rarityColor, 1);
            const rarityBar = this.add.rectangle(0, -cardHeight / 2 + 18, cardWidth - 24, 24, rarityColor, 1)
                .setOrigin(0.5);
            const rarityText = this.add.text(0, -cardHeight / 2 + 18, String(cardConfig.rarityLabel ?? '').toUpperCase(), {
                fontSize: '11px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#0b0d0f',
                stroke: '#ffffff',
                strokeThickness: 1
            }).setOrigin(0.5);
            const valueText = this.add.text(0, -18, cardConfig.valueText ?? '', {
                fontSize: isMobile ? '26px' : '30px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: Phaser.Display.Color.IntegerToColor(rarityAccentColor).rgba,
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            const name = this.add.text(0, 22, cardConfig.label ?? 'Card', {
                fontSize: '16px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#f2f7fa',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: cardWidth - 24 }
            }).setOrigin(0.5);
            const desc = this.add.text(0, 62, '', {
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#c8d6dc',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center',
                wordWrap: { width: cardWidth - 24 }
            }).setOrigin(0.5);
            const selectText = this.add.text(0, cardHeight / 2 - 18, '', {
                fontSize: '10px',
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: '#9db1bb',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            const hit = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff, 0.001)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            hit.on('pointerover', () => {
                card.setScale(1.03);
                bg.setFillStyle(0x1f2c34, 0.98);
                frame.setStrokeStyle(3, rarityAccentColor, 1);
            });
            hit.on('pointerout', () => {
                card.setScale(1);
                bg.setFillStyle(0x162026, 0.98);
                frame.setStrokeStyle(3, rarityColor, 1);
            });
            hit.on('pointerdown', () => {
                this.preShopCardSelectCallback?.(cardConfig);
            });
            card.add([shadow, bg, frame, rarityBar, rarityText, valueText, name, desc, selectText, hit]);
            container.add(card);
            return card;
        });

        this.preShopCardOverlay = overlay;
        this.preShopCardContainer = container;
        this.preShopCardRerollButton = rerollButton;
        this.preShopCardRerollText = rerollText;
        this.tweens.add({
            targets: overlay,
            alpha: { from: 0, to: 0.72 },
            duration: 180,
            ease: 'Sine.easeOut'
        });
        container.setScale(0.96);
        this.tweens.add({
            targets: container,
            scale: 1,
            alpha: { from: 0, to: 1 },
            duration: 200,
            ease: 'Back.Out'
        });
        this.scene.bringToTop('HudScene');
    }

    buildSupporterChoiceDetail(config = {}) {
        if (config.supportStyle === 'heal_aura') {
            return `Heal aura\n+${Math.round(config.supportHealAmount ?? 0)} HP base`;
        }
        if (config.supportStyle === 'armor_aura') {
            return `Armor aura\n+${Math.round(config.supportArmorBonus ?? 0)} armor base`;
        }
        const range = Math.round(config.attackRange ?? 0);
        const damage = Math.round(config.projectileDamage ?? 0);
        return `Range ${range}\nDamage ${damage}`;
    }

    buildSupporterPassiveDetail(config = {}) {
        const configuredDescription = typeof config.passiveDescription === 'string'
            ? config.passiveDescription
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
            : [];
        if (configuredDescription.length) {
            return configuredDescription;
        }

        const lines = [];
        const passiveBonuses = config.passiveBonuses ?? {};
        const conditionalBonuses = config.conditionalPassiveBonuses ?? {};
        const statusEntries = Array.isArray(config.statusEffects) ? config.statusEffects : [];

        if (config.supportStyle === 'heal_aura') {
            lines.push(`Heal aura: +${Math.round(config.supportHealAmount ?? 0)} HP base`);
            lines.push('Buff scales with effect damage');
            lines.push('Each hit reduces buff cooldown by 0.5s');
        } else if (config.supportStyle === 'armor_aura') {
            lines.push(`Armor aura: +${Math.round(config.supportArmorBonus ?? 0)} armor base`);
            lines.push('Buff scales with effect damage');
            lines.push('Each hit reduces buff cooldown by 0.5s');
        }

        Object.entries(passiveBonuses).forEach(([key, rawValue]) => {
            const value = Number(rawValue ?? 0);
            if (!Number.isFinite(value) || value === 0) return;
            switch (key) {
                case 'goldGainMultiplier':
                    lines.push(`Gold gain +${Math.round(value * 100)}%`);
                    break;
                case 'critChance':
                    lines.push(`Crit chance +${Math.round(value * 100)}%`);
                    break;
                case 'critMultiplier':
                    lines.push(`Crit damage +${Math.round(value * 100)}%`);
                    break;
                case 'lifesteal':
                    lines.push(`Lifesteal +${Math.round(value * 100)}%`);
                    break;
                case 'attackSpeed':
                    lines.push(`Attack speed +${Math.round(value * 100)}%`);
                    break;
                case 'knockbackMultiplier':
                    lines.push(`Knockback +${Math.round(value * 100)}%`);
                    break;
                case 'armor':
                    lines.push(`Armor +${Math.round(value)}`);
                    break;
                case 'projectileSpeedPercent':
                    lines.push(`Projectile speed +${Math.round(value * 100)}%`);
                    break;
                case 'armorPierce':
                    lines.push(`Armor pierce +${Math.round(value * 100)}%`);
                    break;
                case 'effectDamageMultiplier':
                    lines.push(`Effect damage +${Math.round(value * 100)}%`);
                    break;
                case 'effectDurationMultiplier':
                    lines.push(`Effect duration +${Math.round(value * 100)}%`);
                    break;
                case 'healthRegenPerSecond':
                    lines.push(`Health regen +${Math.round(value)}/s`);
                    break;
                case 'maxHealthPercent':
                    lines.push(`Max HP +${Math.round(value * 100)}%`);
                    break;
                case 'skillRangeFlat':
                    lines.push(`Skill range +${Math.round(value)}`);
                    break;
                case 'skillRange':
                    lines.push(`Skill range +${Math.round(value)}`);
                    break;
                case 'shieldResetAmount':
                    lines.push(`Gain ${Math.round(value)} shield every 10s`);
                    break;
                case 'shieldResetIntervalMs':
                    break;
                case 'shockChainDamageBonus':
                    lines.push(`Shock chain damage +${Math.round(value * 100)}%`);
                    break;
                case 'shockChainCountBonus':
                    lines.push(`Shock chain count +${Math.round(value)}`);
                    break;
                default:
            }
        });

        Object.entries(conditionalBonuses).forEach(([key, rawValue]) => {
            const value = Number(rawValue ?? 0);
            if (!Number.isFinite(value) || value === 0) return;
            if (key === 'attackSpeed') {
                lines.push(`While target is in supporter range: atk speed +${Math.round(value * 100)}%`);
            }
        });

        statusEntries.forEach((entry) => {
            if (!entry?.key) return;
            const effectLabel = String(entry.key).replace(/^./, (char) => char.toUpperCase());
            if ((entry.chance ?? 0) >= 1) {
                lines.push(`Supporter hits always apply ${effectLabel}`);
            } else {
                lines.push(`Supporter hits can apply ${effectLabel}`);
            }
        });

        if (!lines.length) {
            lines.push('No passive bonus.');
        }

        return lines;
    }

    showSupporterPassiveInfo(supporterKey = null) {
        const config = SUPPORTER_CONFIG[supporterKey];
        if (!config || !this.supporterChoiceContainer) return;
        this.hideSupporterPassiveInfo();
        const width = this.scale.width;
        const isMobile = width < 640;
        const panelWidth = isMobile ? 220 : 300;
        const passiveLines = this.buildSupporterPassiveDetail(config);
        const lineCount = Math.max(1, passiveLines.length);
        const panelHeight = Phaser.Math.Clamp((isMobile ? 86 : 96) + lineCount * (isMobile ? 15 : 17), isMobile ? 150 : 180, isMobile ? 280 : 320);
        const overlay = this.add.rectangle(0, 0, width, this.scale.height, 0x000000, 0.2)
            .setOrigin(0.5)
            .setInteractive()
            .setDepth(206);
        const panel = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x11171b, 0.98)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x7e99a8, 1)
            .setDepth(207)
            .setInteractive();
        const title = this.add.text(0, -panelHeight / 2 + 20, `${config.label ?? supporterKey} Passive`, {
            fontSize: isMobile ? '12px' : '14px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#e7f4ff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: panelWidth - 26 }
        }).setOrigin(0.5).setDepth(208).setInteractive();
        const text = this.add.text(-panelWidth / 2 + 14, -panelHeight / 2 + 42, passiveLines.join('\n'), {
            fontSize: isMobile ? '9px' : '10px',
            fontFamily: 'monospace',
            color: '#d9f6ff',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: panelWidth - 28 }
        }).setOrigin(0, 0).setDepth(208).setInteractive();

        const stopClose = (gameObject) => {
            gameObject.on('pointerdown', (pointer) => {
                pointer?.event?.stopPropagation?.();
            });
        };
        stopClose(panel);
        stopClose(title);
        stopClose(text);
        overlay.on('pointerdown', () => this.hideSupporterPassiveInfo());

        this.supporterChoiceContainer.add([overlay, panel, title, text]);
        this.supporterChoiceInfoOverlay = overlay;
        this.supporterChoiceInfoPanel = panel;
        this.supporterChoiceInfoTitle = title;
        this.supporterChoiceInfoText = text;
    }

    hideSupporterPassiveInfo() {
        this.supporterChoiceInfoOverlay?.destroy();
        this.supporterChoiceInfoOverlay = null;
        this.supporterChoiceInfoPanel?.destroy();
        this.supporterChoiceInfoPanel = null;
        this.supporterChoiceInfoTitle?.destroy();
        this.supporterChoiceInfoTitle = null;
        this.supporterChoiceInfoText?.destroy();
        this.supporterChoiceInfoText = null;
    }

    hideSupporterSelection() {
        this.hideSupporterPassiveInfo();
        this.supporterChoiceOverlay?.destroy();
        this.supporterChoiceOverlay = null;
        this.supporterChoiceContainer?.destroy(true);
        this.supporterChoiceContainer = null;
        this.supporterChoiceOptions = [];
        this.supporterChoiceCallback = null;
        this.supporterChoiceRerollCallback = null;
        this.supporterChoiceRerollButton = null;
        this.supporterChoiceRerollText = null;
    }

    hidePreShopCardSelection() {
        this.preShopCardOverlay?.destroy();
        this.preShopCardOverlay = null;
        this.preShopCardContainer?.destroy(true);
        this.preShopCardContainer = null;
        this.preShopCardOptions = [];
        this.preShopCardSelectCallback = null;
        this.preShopCardRerollCallback = null;
        this.preShopCardRerollButton = null;
        this.preShopCardRerollText = null;
    }

    shutdown() {
        this.scale.off('resize', this.layoutHud, this);
        this.hideWaveAnnouncement();
        this.hideShopOverlay();
        this.hideSupporterSelection();
        this.hidePreShopCardSelection();
        this.hideInventoryPreview();
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
        this.goldIcon?.destroy();
        this.goldIcon = null;
        this.goldText?.destroy();
        this.goldText = null;
        this.killCountText?.destroy();
        this.killCountText = null;
        this.waveCountdownText?.destroy();
        this.waveCountdownText = null;
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
        this.inventoryPreviewOverlay?.destroy();
        this.inventoryPreviewOverlay = null;
        this.mainScene = null;
    }
}
