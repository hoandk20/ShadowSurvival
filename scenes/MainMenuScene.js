import {
    CHARACTER_CONFIG,
    CHARACTER_KEYS,
    DEFAULT_CHARACTER_KEY,
    getCharacterUnlockCost,
    getCharacterUnlockRequirement,
    getCharacterUnlockType
} from '../config/characters/characters.js';
import { CHARACTER_ASSET_CONFIG } from '../config/assets.js';
import { DEFAULT_MAP_KEY, getAvailableMaps, getMapDefinition } from '../config/map.js';
import { DEFAULT_AUDIO_SETTINGS, ensureAudioSettings, getAudioSettings, installAudioUnlock, updateAudioSetting } from '../utils/audioSettings.js';
import { ensureGameplaySettings, getGameplaySettings, updateGameplaySetting } from '../utils/gameplaySettings.js';
import {
    bootstrapMetaProgress,
    getMetaProgress,
    getMetaUpgradeLevels,
    getUnlockedCharacterKeys,
    isCharacterUnlocked,
    setMetaUpgradeLevels,
    spendDynamon,
    unlockCharacter
} from '../utils/metaProgress.js';
import {
    META_UPGRADE_CONFIG,
    META_UPGRADE_GROUPS,
    getMetaUpgradeLevel,
    getMetaUpgradeMaxLevel,
    getMetaUpgradeNextCost,
    getMetaUpgradeTotalValue,
    formatMetaUpgradeValue
} from '../config/metaUpgrades.js';
import {
    UI_COLORS,
    createBackdrop,
    createPixelButton,
    createPixelPanel,
    createPixelText,
    createPixelToggle,
    createPixelCycle,
    createSparkField
} from './ui/PixelSceneHelpers.js';

const MENU_BACKGROUND_KEY = 'menu_background';
const DYNAMON_ICON_KEY = 'menu_dynamon_icon';
const MAP_ICON_KEYS = {
    inside_church: 'map_icon_inside_church',
    maprock_field: 'map_icon_maprock',
    church_sanctuary: 'map_icon_church'
};
const MAP_ICON_PATHS = {
    inside_church: 'assets/mapicon/InsideChurch.png',
    maprock_field: 'assets/mapicon/Rock.png',
    church_sanctuary: 'assets/mapicon/Church.png'
};
const MAP_THEME_COLORS = {
    church_sanctuary: 0xd8b15a,
    inside_church: 0xb9b0a3,
    maprock_field: 0x8fa7c7
};
const PASSIVE_INFO_PANEL_MAX_WIDTH = 220;
const SHOP_HUB_COLORS = {
    panelOuter: 0x11171b,
    panelInner: 0x1b252b,
    panelAccent: 0x213039,
    border: 0x7e99a8,
    borderBright: 0xa8d6ea,
    title: '#e7f4ff',
    subtitle: '#b7d0db',
    text: '#d9f6ff',
    dimText: '#b7d0db',
    buttonFill: 0x25343d,
    buttonInner: 0x30454f,
    buttonActiveFill: 0x30454f,
    buttonActiveInner: 0x3b5663
};

function getCharacterUnlockLabel(characterKey) {
    const unlockType = getCharacterUnlockType(characterKey);
    if (unlockType === 'challenge') {
        const requirement = getCharacterUnlockRequirement(characterKey);
        if (requirement?.type === 'clear_map') {
            const mapDefinition = getMapDefinition(requirement.mapKey);
            const mapLabel = String(mapDefinition?.label ?? requirement.mapKey ?? '').trim();
            return `CLEAR ${mapLabel.toUpperCase()}`;
        }
        if (requirement?.type === 'max_meta_upgrade') {
            const upgrade = META_UPGRADE_CONFIG.find((entry) => entry.key === requirement.upgradeKey);
            const upgradeLabel = String(upgrade?.label ?? requirement.upgradeKey ?? '').trim();
            return `MAX ${upgradeLabel.toUpperCase()}`;
        }
        return 'CHALLENGE LOCKED';
    }
    if (unlockType === 'dynamon') {
        return `UNLOCK ${getCharacterUnlockCost(characterKey)} DYN`;
    }
    return 'UNLOCKED';
}

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.mode = 'main';
        this.uiRoot = null;
        this.backgroundImage = null;
        this.backdrop = null;
        this.sparkField = null;
        this.selectedCharacterKey = DEFAULT_CHARACTER_KEY;
        this.selectedMapKey = DEFAULT_MAP_KEY;
        this.debugMode = false;
        this.characterGridKeys = [];
        this.characterGridColumns = 0;
        this.mapOptionKeys = [];
        this.metaUpgradeKeys = [];
        this.selectedUpgradeGroupKey = 'survival';
        this.upgradeScrollOffsets = {};
        this.selectedUpgradeGroupKey = 'survival';
    }

    preload() {
        if (!this.textures.exists(MENU_BACKGROUND_KEY)) {
            this.load.image(MENU_BACKGROUND_KEY, 'assets/menu/background.png');
        }
        if (!this.textures.exists(DYNAMON_ICON_KEY)) {
            this.load.image(DYNAMON_ICON_KEY, 'assets/menu/dynamon.png');
        }
        META_UPGRADE_CONFIG.forEach((upgrade) => {
            if (!upgrade?.iconKey || !upgrade?.iconPath || this.textures.exists(upgrade.iconKey)) return;
            this.load.image(upgrade.iconKey, upgrade.iconPath);
        });
        Object.entries(MAP_ICON_PATHS).forEach(([mapKey, path]) => {
            const textureKey = MAP_ICON_KEYS[mapKey];
            if (!textureKey || this.textures.exists(textureKey)) return;
            this.load.image(textureKey, path);
        });
        Object.entries(CHARACTER_ASSET_CONFIG).forEach(([key, assetConfig]) => {
            const atlas = assetConfig?.atlas;
            if (!atlas?.key || this.textures.exists(atlas.key)) return;
            this.load.atlas(atlas.key, atlas.texture, atlas.atlasJSON);
        });
    }

    create() {
        this.cameras.main.roundPixels = true;
        this.mode = 'main';
        this.registry.set('audioSettings', { ...DEFAULT_AUDIO_SETTINGS, ...ensureAudioSettings(this.registry) });
        ensureGameplaySettings(this.registry);
        bootstrapMetaProgress(this);
        const initialCharacterKey = this.registry.get('selectedCharacterKey') ?? DEFAULT_CHARACTER_KEY;
        this.selectedCharacterKey = CHARACTER_CONFIG[initialCharacterKey] ? initialCharacterKey : DEFAULT_CHARACTER_KEY;
        const initialMapKey = this.registry.get('selectedMapKey') ?? DEFAULT_MAP_KEY;
        this.selectedMapKey = getMapDefinition(initialMapKey) ? initialMapKey : DEFAULT_MAP_KEY;
        this.debugMode = this.registry.get('debugMode') === true;
        this.setDebugPanelVisible(false);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
        this.audioUnlockCleanup = installAudioUnlock(this);
        this.input.keyboard.on('keydown', this.handleKeyboardNavigation, this);
        this.events.on('metaProgressChanged', this.handleMetaProgressChanged, this);
        this.syncChallengeCharacterUnlocks();
        this.ensureMetaUpgradeTexturesLoaded();
        this.render();
        this.scale.on('resize', this.render, this);
    }

    shutdown() {
        this.destroyRenderTree();
        this.setDebugPanelVisible(false);
        this.audioUnlockCleanup?.();
        this.audioUnlockCleanup = null;
        this.input.keyboard.off('keydown', this.handleKeyboardNavigation, this);
        this.events.off('metaProgressChanged', this.handleMetaProgressChanged, this);
        this.scale.off('resize', this.render, this);
    }

    destroyRenderTree() {
        this.uiRoot?.destroy(true);
        this.uiRoot = null;
        this.sparkField?.destroy(true);
        this.sparkField = null;
        this.backdrop?.destroy();
        this.backdrop = null;
        this.backgroundImage?.destroy();
        this.backgroundImage = null;
    }

    setDebugPanelVisible(visible) {
        const panel = document.getElementById('debug-panel');
        if (panel) {
            panel.style.display = visible ? 'flex' : 'none';
        }
    }

    render() {
        this.destroyRenderTree();
        if (!CHARACTER_CONFIG[this.selectedCharacterKey]) {
            this.selectedCharacterKey = DEFAULT_CHARACTER_KEY;
        }
        if (!getMapDefinition(this.selectedMapKey)) {
            this.selectedMapKey = DEFAULT_MAP_KEY;
        }
        this.characterGridKeys = [];
        this.characterGridColumns = 0;
        this.mapOptionKeys = [];
        this.metaUpgradeKeys = META_UPGRADE_CONFIG.map((entry) => entry.key);
        const width = this.scale.width;
        const height = this.scale.height;
        const metrics = this.getResponsiveMetrics();
        this.backgroundImage = this.add.image(width / 2, height / 2, MENU_BACKGROUND_KEY)
            .setDisplaySize(width, height)
            .setAlpha(0.4);
        this.backdrop = createBackdrop(this, 0.48);
        this.sparkField = createSparkField(
            this,
            width / 2,
            height / 2,
            width * 0.68,
            height * 0.68,
            metrics.isCompact ? 12 : 18,
            0x8cc4dc
        );

        this.uiRoot = this.add.container(0, 0);
        this.uiRoot.add(createPixelText(this, width / 2, metrics.safeY + 24, 'RUNE PIXEL SURVIVORS', {
            fontSize: metrics.isCompact ? '22px' : metrics.isPortrait ? '26px' : '32px',
            color: SHOP_HUB_COLORS.title,
            strokeThickness: 5
        }));
        this.uiRoot.add(createPixelText(this, width / 2, metrics.safeY + 56, 'RETRO FANTASY HUNT', {
            fontSize: metrics.isCompact ? '11px' : '12px',
            color: SHOP_HUB_COLORS.dimText,
            strokeThickness: 3
        }));

        // Meta currency HUD (menu-only): Dynamon display.
        const meta = getMetaProgress(this);
        const dynamonContainer = this.add.container(width - metrics.safeX - 10, metrics.safeY + 22);
        const icon = this.add.image(0, 0, DYNAMON_ICON_KEY).setOrigin(1, 0.5);
        const iconScale = metrics.isCompact ? 0.7 : 0.8;
        icon.setScale(iconScale);
        const amountText = createPixelText(this, 10, 0, `${Math.max(0, Math.floor(meta.dynamon ?? 0))}`, {
            fontSize: metrics.isCompact ? '14px' : '16px',
            originX: 0,
            originY: 0.5,
            color: SHOP_HUB_COLORS.title,
            strokeThickness: 4
        });
        dynamonContainer.add([icon, amountText]);
        // Keep above spark field but below title.
        dynamonContainer.setDepth(5);
        this.uiRoot.add(dynamonContainer);

        if (this.mode === 'main') {
            this.renderMainMenu();
        } else if (this.mode === 'characters') {
            this.renderCharacterSelect();
        } else if (this.mode === 'maps') {
            this.renderMapSelect();
        } else if (this.mode === 'settings') {
            this.renderSettings();
        } else if (this.mode === 'upgrade') {
            this.renderUpgradeMenu();
        } else if (this.mode === 'credits') {
            this.renderCredits();
        }
    }

    renderMainMenu() {
        const { width, height, safeX, safeY, isCompact, isPortrait } = this.getResponsiveMetrics();
        const buttonWidth = Math.min(Math.max(width - safeX * 2, 250), isPortrait ? 320 : 360);
        const buttonHeight = isCompact ? 50 : 56;
        const buttonGap = isCompact ? 16 : 18;
        const buttons = [
            { label: 'START GAME', action: () => this.beginNewRun(false) },
            { label: 'START DEBUG MODE', action: () => this.beginNewRun(true) },
            { label: 'UPGRADE', action: () => this.setMode('upgrade') },
            { label: 'CREDITS', action: () => this.setMode('credits') }
        ];
        const totalHeight = buttonHeight * buttons.length + buttonGap * Math.max(0, buttons.length - 1);
        const buttonY = Math.max(safeY + 120, height / 2 - totalHeight / 2 + buttonHeight / 2);

        const gearSize = isCompact ? 46 : 50;
        this.uiRoot.add(createPixelButton(this, safeX + gearSize / 2, safeY + 28, gearSize, gearSize, '⚙', () => {
            this.setMode('settings');
        }, {
            fontSize: isCompact ? '18px' : '20px',
            textColor: SHOP_HUB_COLORS.title,
            fill: SHOP_HUB_COLORS.buttonFill,
            inner: SHOP_HUB_COLORS.buttonInner,
            activeFill: SHOP_HUB_COLORS.buttonActiveFill,
            activeInner: SHOP_HUB_COLORS.buttonActiveInner,
            border: SHOP_HUB_COLORS.border,
            activeBorder: SHOP_HUB_COLORS.borderBright,
            glowColor: 0x8cc4dc
        }));

        buttons.forEach((entry, index) => {
            const button = createPixelButton(this, width / 2, buttonY + index * (buttonHeight + buttonGap), buttonWidth, buttonHeight, entry.label, () => {
                if (!entry.disabled) entry.action();
            }, {
                fontSize: isCompact ? '15px' : '17px',
                textColor: entry.disabled ? '#8a98a0' : SHOP_HUB_COLORS.text,
                fill: SHOP_HUB_COLORS.buttonFill,
                inner: SHOP_HUB_COLORS.buttonInner,
                activeFill: SHOP_HUB_COLORS.buttonActiveFill,
                activeInner: SHOP_HUB_COLORS.buttonActiveInner,
                border: entry.disabled ? UI_COLORS.disabled : SHOP_HUB_COLORS.border,
                activeBorder: SHOP_HUB_COLORS.borderBright,
                glowColor: 0x8cc4dc
            });
            if (entry.disabled) {
                button.getAll().forEach((child) => child.setAlpha?.(0.65));
            }
            this.uiRoot.add(button);
        });
    }

    beginNewRun(debugMode) {
        this.debugMode = Boolean(debugMode);
        this.setMode('characters');
    }

    renderCharacterSelect() {
        const { width, height, safeX, safeY, isPortrait, isCompact } = this.getResponsiveMetrics();
        const isMobileDevice = Boolean(this.sys.game.device.os.android || this.sys.game.device.os.iOS);
        const unlockedCharacterKeys = new Set(getUnlockedCharacterKeys(this));
        const panelWidth = Math.min(isPortrait ? width - safeX * 2 : width - safeX * 2, isPortrait ? 420 : 920);
        const panelHeight = Math.min(height - safeY * 2 - 18, isPortrait ? 680 : 560);
        const panel = createPixelPanel(this, width / 2, height / 2 + (isPortrait ? 8 : 12), panelWidth, panelHeight, {
            fill: SHOP_HUB_COLORS.panelInner,
            fillDark: SHOP_HUB_COLORS.panelOuter,
            border: SHOP_HUB_COLORS.border
        });
        this.uiRoot.add(panel);
        panel.add(createPixelText(this, 0, -panelHeight / 2 + 26, 'CHARACTER SELECT', {
            fontSize: isCompact ? '16px' : '18px',
            color: SHOP_HUB_COLORS.title
        }));

        const entries = CHARACTER_KEYS
            .filter((key) => Boolean(CHARACTER_CONFIG[key]))
            .map((key) => [key, CHARACTER_CONFIG[key]]);
        const contentTop = -panelHeight / 2 + 68;
        const footerHeight = isCompact ? 108 : 92;
        const previewScale = isMobileDevice ? 0.7 : 1;
        const previewWidth = Math.max(180, Math.round((isPortrait ? panelWidth - 28 : Math.min(300, Math.floor(panelWidth * 0.34))) * previewScale));
        const previewHeight = Math.max(170, Math.round((isPortrait ? 236 : Math.min(388, panelHeight - 84)) * previewScale));
        const gridAreaWidth = isPortrait ? panelWidth - 28 : panelWidth - previewWidth - 38;
        const gridAreaHeight = isPortrait
            ? panelHeight - previewHeight - footerHeight - 86
            : panelHeight - footerHeight - 92;
        const totalCharacters = entries.length;
        const rows = isPortrait ? 3 : 2;
        const columns = Math.ceil(totalCharacters / rows);
        this.characterGridKeys = entries.map(([key]) => key);
        this.characterGridColumns = columns;
        const gap = isCompact ? 8 : 12;
        const slotSizeByWidth = Math.floor((gridAreaWidth - gap * (columns - 1)) / columns);
        const slotSizeByHeight = Math.floor((gridAreaHeight - gap * (rows - 1)) / rows);
        const slotSize = Math.max(56, Math.min(slotSizeByWidth, slotSizeByHeight, isCompact ? 84 : 94));
        const gridWidth = columns * slotSize + (columns - 1) * gap;
        const gridHeight = rows * slotSize + Math.max(0, rows - 1) * gap;

        const previewX = isPortrait ? 0 : panelWidth / 2 - previewWidth / 2 - 12;
        const previewY = isPortrait ? contentTop + previewHeight / 2 : 14;
        const previewPanel = createPixelPanel(this, previewX, previewY, previewWidth, previewHeight, {
            fill: SHOP_HUB_COLORS.panelAccent,
            fillDark: SHOP_HUB_COLORS.panelOuter,
            border: SHOP_HUB_COLORS.border
        });
        panel.add(previewPanel);
        const selectedCharacter = CHARACTER_CONFIG[this.selectedCharacterKey];
        const selectedCharacterUnlocked = unlockedCharacterKeys.has(this.selectedCharacterKey);
        const selectedCharacterUnlockCost = getCharacterUnlockCost(this.selectedCharacterKey);
        const selectedCharacterUnlockType = getCharacterUnlockType(this.selectedCharacterKey);
        const selectedCharacterUnlockLabel = getCharacterUnlockLabel(this.selectedCharacterKey);
        const compactPortrait = isPortrait && isCompact;
        previewPanel.add(createPixelText(this, 0, -previewHeight / 2 + 26, selectedCharacter.label ?? this.selectedCharacterKey, {
            fontSize: isCompact ? '16px' : '18px',
            color: SHOP_HUB_COLORS.title
        }));
        if (!selectedCharacterUnlocked) {
            previewPanel.add(createPixelText(this, 0, -previewHeight / 2 + 48, selectedCharacterUnlockLabel, {
                fontSize: isCompact ? '10px' : '11px',
                color: '#ffd4a8',
                strokeThickness: 3
            }));
        }
        const passiveInfoBadge = this.createPassiveInfoBadge(
            previewWidth / 2 - 24,
            -previewHeight / 2 + 24,
            selectedCharacter.passiveDescription,
            { panelWidth: Math.min(PASSIVE_INFO_PANEL_MAX_WIDTH, previewWidth - 28) }
        );
        if (passiveInfoBadge) {
            previewPanel.add(passiveInfoBadge);
        }
        const previewSpriteY = isPortrait ? Math.round(-52 * previewScale) : Math.round(-72 * previewScale);
        const previewSpriteSize = Math.max(50, Math.round((isPortrait ? 70 : 88) * previewScale));
        previewPanel.add(this.createCharacterPreview(this.selectedCharacterKey, 0, previewSpriteY, previewSpriteSize));
        const descriptionY = compactPortrait ? -6 : isPortrait ? 0 : Math.round(-4 * previewScale);
        previewPanel.add(this.add.text(0, descriptionY, selectedCharacter.description ?? '', {
            fontFamily: 'monospace',
            fontSize: isMobileDevice ? '9px' : isCompact ? '10px' : '11px',
            color: SHOP_HUB_COLORS.dimText,
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: previewWidth - 32, useAdvancedWrap: true }
        }).setOrigin(0.5, 0));
        const styleLabelY = compactPortrait ? 48 : isPortrait ? Math.round(72 * previewScale) : Math.round(96 * previewScale);
        const characterStyleLabel = String(selectedCharacter.combatStyle ?? selectedCharacter.style ?? 'ranged').toUpperCase();
        const characterStyleColor = characterStyleLabel === 'MELEE' ? '#ffb4a8' : '#a8e3ff';
        previewPanel.add(createPixelText(this, 0, styleLabelY, characterStyleLabel, {
            fontSize: isMobileDevice ? '12px' : compactPortrait ? '12px' : isCompact ? '14px' : '15px',
            color: characterStyleColor,
            strokeThickness: 3
        }));

        const gridViewportX = isPortrait ? 0 : -panelWidth / 2 + 18 + gridAreaWidth / 2;
        const gridViewportY = isPortrait
            ? contentTop + previewHeight + 18 + gridHeight / 2
            : contentTop + gridAreaHeight / 2;
        const gridContent = this.add.container(gridViewportX, gridViewportY);
        const startX = -gridWidth / 2 + slotSize / 2;
        const startY = -gridHeight / 2 + slotSize / 2;
        entries.forEach(([key, config], index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const slot = this.createCharacterSlot(
                key,
                config,
                slotSize,
                key === this.selectedCharacterKey,
                unlockedCharacterKeys.has(key)
            );
            slot.setPosition(startX + col * (slotSize + gap), startY + row * (slotSize + gap));
            gridContent.add(slot);
        });
        panel.add(gridContent);

        const actionButtonY = height - safeY - (isCompact ? 28 : 24);
        const actionGap = isCompact ? 14 : 18;
        const actionWidth = Math.min(Math.max(Math.floor((width - safeX * 2 - actionGap) / 2), 150), 220);
        const actionHeight = isCompact ? 44 : 46;
        const canAffordSelectedUnlock = (getMetaProgress(this).dynamon ?? 0) >= selectedCharacterUnlockCost;
        const canBuySelectedCharacter = selectedCharacterUnlockType === 'dynamon' && canAffordSelectedUnlock;
        const confirmLabel = selectedCharacterUnlocked
            ? 'CONFIRM'
            : (selectedCharacterUnlockType === 'dynamon' ? `UNLOCK ${selectedCharacterUnlockCost}` : 'CHALLENGE LOCKED');
        this.uiRoot.add([
            createPixelButton(this, width / 2 - actionWidth / 2 - actionGap / 2, actionButtonY, actionWidth, actionHeight, 'BACK', () => this.setMode('main'), {
                fontSize: isCompact ? '14px' : '16px',
                textColor: SHOP_HUB_COLORS.text,
                fill: SHOP_HUB_COLORS.buttonFill,
                inner: SHOP_HUB_COLORS.buttonInner,
                activeFill: SHOP_HUB_COLORS.buttonActiveFill,
                activeInner: SHOP_HUB_COLORS.buttonActiveInner,
                border: SHOP_HUB_COLORS.border,
                activeBorder: SHOP_HUB_COLORS.borderBright
            }),
            createPixelButton(this, width / 2 + actionWidth / 2 + actionGap / 2, actionButtonY, actionWidth, actionHeight, confirmLabel, () => {
                if (selectedCharacterUnlocked) {
                    this.setMode('maps');
                    return;
                }
                if (selectedCharacterUnlockType !== 'dynamon') {
                    return;
                }
                this.purchaseCharacterUnlock(this.selectedCharacterKey);
            }, {
                fontSize: isCompact ? '14px' : '16px',
                textColor: selectedCharacterUnlocked
                    ? SHOP_HUB_COLORS.text
                    : (canBuySelectedCharacter ? '#ffe0b0' : '#c3a69c'),
                fill: selectedCharacterUnlocked
                    ? SHOP_HUB_COLORS.buttonFill
                    : (canBuySelectedCharacter ? 0x3b2b1f : 0x2a2525),
                inner: selectedCharacterUnlocked
                    ? SHOP_HUB_COLORS.buttonInner
                    : (canBuySelectedCharacter ? 0x5a4030 : 0x393133),
                activeFill: selectedCharacterUnlocked
                    ? SHOP_HUB_COLORS.buttonActiveFill
                    : (canBuySelectedCharacter ? 0x4a3528 : 0x403638),
                activeInner: selectedCharacterUnlocked
                    ? SHOP_HUB_COLORS.buttonActiveInner
                    : (canBuySelectedCharacter ? 0x6a4c38 : 0x4b4143),
                border: selectedCharacterUnlocked
                    ? SHOP_HUB_COLORS.border
                    : (canBuySelectedCharacter ? 0xd6a66f : UI_COLORS.disabled),
                activeBorder: selectedCharacterUnlocked
                    ? SHOP_HUB_COLORS.borderBright
                    : (canBuySelectedCharacter ? 0xffd2a0 : UI_COLORS.disabled)
            })
        ]);
    }

    renderMapSelect() {
        const { width, height, safeX, safeY, isPortrait, isCompact } = this.getResponsiveMetrics();
        const maps = getAvailableMaps();
        const compactPortrait = isPortrait && isCompact;
        this.mapOptionKeys = maps.map((mapEntry) => mapEntry.id);
        const panelWidth = Math.min(width - safeX * 2, isPortrait ? 420 : 920);
        const panelHeight = Math.min(height - safeY * 2 - 18, isPortrait ? 680 : 560);
        const panel = createPixelPanel(this, width / 2, height / 2 + (isPortrait ? 6 : 10), panelWidth, panelHeight, {
            fill: SHOP_HUB_COLORS.panelInner,
            fillDark: SHOP_HUB_COLORS.panelOuter,
            border: SHOP_HUB_COLORS.border
        });
        this.uiRoot.add(panel);
        panel.add(createPixelText(this, 0, -panelHeight / 2 + 26, 'MAP SELECT', {
            fontSize: isCompact ? '16px' : '18px',
            color: SHOP_HUB_COLORS.title
        }));

        const contentTop = -panelHeight / 2 + 68;
        const footerHeight = isCompact ? 108 : 92;
        const previewWidth = isPortrait ? panelWidth - 28 : Math.min(300, Math.floor(panelWidth * 0.34));
        const previewHeight = isPortrait ? 156 : Math.min(216, panelHeight - 180);
        const gridAreaWidth = isPortrait ? panelWidth - 28 : panelWidth - previewWidth - 38;
        const gridAreaHeight = isPortrait
            ? panelHeight - previewHeight - footerHeight - 86
            : panelHeight - footerHeight - 92;
        const columns = Math.min(5, maps.length);
        const rows = Math.max(1, Math.ceil(maps.length / columns));
        const gap = isCompact ? 8 : 12;
        const slotSizeByWidth = Math.floor((gridAreaWidth - gap * (columns - 1)) / columns);
        const slotSizeByHeight = Math.floor((gridAreaHeight - gap * (rows - 1)) / rows);
        const slotSize = Math.max(72, Math.min(slotSizeByWidth, slotSizeByHeight, compactPortrait ? 104 : isCompact ? 116 : 126));
        const gridWidth = columns * slotSize + (columns - 1) * gap;
        const gridHeight = rows * slotSize + Math.max(0, rows - 1) * gap;

        const previewX = isPortrait ? 0 : panelWidth / 2 - previewWidth / 2 - 12;
        const previewY = isPortrait ? contentTop + previewHeight / 2 : 14;
        const previewPanel = createPixelPanel(this, previewX, previewY, previewWidth, previewHeight, {
            fill: SHOP_HUB_COLORS.panelAccent,
            fillDark: SHOP_HUB_COLORS.panelOuter,
            border: SHOP_HUB_COLORS.border
        });
        panel.add(previewPanel);

        const selectedMap = getMapDefinition(this.selectedMapKey);
        const mapInfoText = selectedMap?.description ?? '';
        previewPanel.add(this.add.text(0, -previewHeight / 2 + 18, mapInfoText, {
            fontFamily: 'monospace',
            fontSize: isCompact ? '10px' : '11px',
            color: SHOP_HUB_COLORS.dimText,
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: previewWidth - 26, useAdvancedWrap: true }
        }).setOrigin(0.5, 0));

        const gridViewportX = isPortrait ? 0 : -panelWidth / 2 + 18 + gridAreaWidth / 2;
        const gridViewportY = isPortrait
            ? contentTop + previewHeight + 18 + gridHeight / 2
            : contentTop + gridAreaHeight / 2;
        const gridContent = this.add.container(gridViewportX, gridViewportY);
        const startX = -gridWidth / 2 + slotSize / 2;
        const startY = -gridHeight / 2 + slotSize / 2;
        maps.forEach((mapEntry, index) => {
            const definition = getMapDefinition(mapEntry.id);
            const col = index % columns;
            const row = Math.floor(index / columns);
            const slot = this.createMapSlot(mapEntry.id, definition, mapEntry.id === this.selectedMapKey, slotSize);
            slot.setPosition(startX + col * (slotSize + gap), startY + row * (slotSize + gap));
            gridContent.add(slot);
        });
        panel.add(gridContent);

        const actionButtonY = height - safeY - (isCompact ? 28 : 24);
        const actionGap = isCompact ? 14 : 18;
        const actionWidth = Math.min(Math.max(Math.floor((width - safeX * 2 - actionGap) / 2), 150), 230);
        const actionHeight = isCompact ? 44 : 46;
        this.uiRoot.add([
            createPixelButton(this, width / 2 - actionWidth / 2 - actionGap / 2, actionButtonY, actionWidth, actionHeight, 'BACK', () => this.setMode('characters'), {
                fontSize: isCompact ? '14px' : '16px',
                textColor: SHOP_HUB_COLORS.text,
                fill: SHOP_HUB_COLORS.buttonFill,
                inner: SHOP_HUB_COLORS.buttonInner,
                activeFill: SHOP_HUB_COLORS.buttonActiveFill,
                activeInner: SHOP_HUB_COLORS.buttonActiveInner,
                border: SHOP_HUB_COLORS.border,
                activeBorder: SHOP_HUB_COLORS.borderBright
            }),
            createPixelButton(this, width / 2 + actionWidth / 2 + actionGap / 2, actionButtonY, actionWidth, actionHeight, 'START HUNT', () => this.startGame(), {
                fontSize: isCompact ? '14px' : '16px',
                textColor: SHOP_HUB_COLORS.text,
                fill: SHOP_HUB_COLORS.buttonFill,
                inner: SHOP_HUB_COLORS.buttonInner,
                activeFill: SHOP_HUB_COLORS.buttonActiveFill,
                activeInner: SHOP_HUB_COLORS.buttonActiveInner,
                border: SHOP_HUB_COLORS.border,
                activeBorder: SHOP_HUB_COLORS.borderBright
            })
        ]);
    }

    renderSettings() {
        const { width, height, safeX, isCompact, isPortrait } = this.getResponsiveMetrics();
        const isMobileLandscape = !isPortrait && isCompact;
        const showFullscreenButton = true;
        const panelWidth = Math.min(width - safeX * 2, isPortrait ? 400 : (isMobileLandscape ? 560 : 460));
        const panelHeight = Math.min(
            height - 24,
            showFullscreenButton
                ? (isMobileLandscape ? 320 : (isCompact ? 500 : 470))
                : (isMobileLandscape ? 284 : (isCompact ? 410 : 390))
        );
        const panel = createPixelPanel(this, width / 2, height / 2, panelWidth, panelHeight, {
            fill: SHOP_HUB_COLORS.panelInner,
            fillDark: SHOP_HUB_COLORS.panelOuter,
            border: SHOP_HUB_COLORS.border
        });
        this.uiRoot.add(panel);
        const titleY = -panelHeight / 2 + (isMobileLandscape ? 30 : 56);
        panel.add(createPixelText(this, 0, titleY, 'SETTINGS', {
            fontSize: isCompact ? '16px' : '18px',
            color: SHOP_HUB_COLORS.title
        }));
        const settings = getAudioSettings(this);
        const gameplay = getGameplaySettings(this);
        const toggleX = -Math.min(isMobileLandscape ? 88 : 110, panelWidth * (isMobileLandscape ? 0.21 : 0.25));
        const actionButtonHeight = isCompact ? 44 : 42;
        const fullscreenButtonHeight = isCompact ? 42 : 40;
        const bottomPadding = isMobileLandscape ? 18 : (isCompact ? 26 : 24);
        const actionGap = isCompact ? 16 : 14;
        const stackedActionBlockHeight = (showFullscreenButton ? fullscreenButtonHeight + actionGap : 0) + actionButtonHeight;
        const contentTopY = titleY + (isMobileLandscape ? 44 : 84);
        const contentBottomY = isMobileLandscape
            ? (panelHeight / 2 - bottomPadding - actionButtonHeight - 18)
            : (panelHeight / 2 - bottomPadding - stackedActionBlockHeight - 22);
        const rowCount = 4;
        const rowGap = Math.max(isMobileLandscape ? 42 : 50, Math.floor((contentBottomY - contentTopY) / Math.max(1, rowCount - 1)));
        const firstRowY = contentTopY;
        const musicToggle = createPixelToggle(this, toggleX, firstRowY + (rowGap * 0), 'MUSIC', settings.musicEnabled, (value) => {
            updateAudioSetting(this, 'musicEnabled', value);
        });
        const sfxToggle = createPixelToggle(this, toggleX, firstRowY + (rowGap * 1), 'SFX', settings.sfxEnabled, (value) => {
            updateAudioSetting(this, 'sfxEnabled', value);
        });
        const dmgCycle = createPixelCycle(this, toggleX, firstRowY + (rowGap * 2), 'DMG TEXT', ['full', 'reduced', 'off'], gameplay.damageNumbersMode ?? 'full', (next) => {
            updateGameplaySetting(this, 'damageNumbersMode', next);
        });
        const dmgCapCycle = createPixelCycle(this, toggleX, firstRowY + (rowGap * 3), 'DMG CAP', ['merge', 'replace', 'unlimited'], gameplay.damageTextCapMode ?? 'merge', (next) => {
            updateGameplaySetting(this, 'damageTextCapMode', next);
        });
        panel.add([musicToggle, sfxToggle, dmgCycle, dmgCapCycle]);

        const isFullscreen = this.scale.isFullscreen === true;
        if (isMobileLandscape) {
            const actionY = panelHeight / 2 - bottomPadding - actionButtonHeight / 2;
            const compactGap = 14;
            const sideButtonWidth = Math.floor((panelWidth - 40 - compactGap) / 2);
            if (showFullscreenButton) {
                panel.add(createPixelButton(
                    this,
                    -sideButtonWidth / 2 - compactGap / 2,
                    actionY,
                    sideButtonWidth,
                    fullscreenButtonHeight,
                    isFullscreen ? 'EXIT FULL' : 'FULLSCREEN',
                    () => {
                        this.toggleFullscreen();
                        this.time.delayedCall(50, () => this.render());
                    },
                    {
                        fontSize: '12px',
                        textColor: SHOP_HUB_COLORS.text,
                        fill: SHOP_HUB_COLORS.buttonFill,
                        inner: SHOP_HUB_COLORS.buttonInner,
                        activeFill: SHOP_HUB_COLORS.buttonActiveFill,
                        activeInner: SHOP_HUB_COLORS.buttonActiveInner,
                        border: SHOP_HUB_COLORS.border,
                        activeBorder: SHOP_HUB_COLORS.borderBright
                    }
                ));
            }
            panel.add(createPixelButton(
                this,
                showFullscreenButton ? (sideButtonWidth / 2 + compactGap / 2) : 0,
                actionY,
                showFullscreenButton ? sideButtonWidth : Math.min(220, panelWidth - 40),
                actionButtonHeight,
                'BACK',
                () => this.setMode('main'),
                {
                    fontSize: '14px',
                    textColor: SHOP_HUB_COLORS.text,
                    fill: SHOP_HUB_COLORS.buttonFill,
                    inner: SHOP_HUB_COLORS.buttonInner,
                    activeFill: SHOP_HUB_COLORS.buttonActiveFill,
                    activeInner: SHOP_HUB_COLORS.buttonActiveInner,
                    border: SHOP_HUB_COLORS.border,
                    activeBorder: SHOP_HUB_COLORS.borderBright
                }
            ));
            return;
        }

        const backButtonY = panelHeight / 2 - bottomPadding - actionButtonHeight / 2;
        const fullscreenButtonY = backButtonY - actionButtonHeight / 2 - actionGap - fullscreenButtonHeight / 2;
        if (showFullscreenButton) {
            panel.add(createPixelButton(
                this,
                0,
                fullscreenButtonY,
                Math.min(240, panelWidth - 48),
                fullscreenButtonHeight,
                isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN',
                () => {
                    this.toggleFullscreen();
                    this.time.delayedCall(50, () => this.render());
                },
                {
                    fontSize: isCompact ? '13px' : '14px',
                    textColor: SHOP_HUB_COLORS.text,
                    fill: SHOP_HUB_COLORS.buttonFill,
                    inner: SHOP_HUB_COLORS.buttonInner,
                    activeFill: SHOP_HUB_COLORS.buttonActiveFill,
                    activeInner: SHOP_HUB_COLORS.buttonActiveInner,
                    border: SHOP_HUB_COLORS.border,
                    activeBorder: SHOP_HUB_COLORS.borderBright
                }
            ));
        }
        panel.add(createPixelButton(this, 0, backButtonY, Math.min(220, panelWidth - 40), actionButtonHeight, 'BACK', () => this.setMode('main'), {
            fontSize: isCompact ? '14px' : '16px',
            textColor: SHOP_HUB_COLORS.text,
            fill: SHOP_HUB_COLORS.buttonFill,
            inner: SHOP_HUB_COLORS.buttonInner,
            activeFill: SHOP_HUB_COLORS.buttonActiveFill,
            activeInner: SHOP_HUB_COLORS.buttonActiveInner,
            border: SHOP_HUB_COLORS.border,
            activeBorder: SHOP_HUB_COLORS.borderBright
        }));
    }

    renderUpgradeMenu() {
        const { width, height, safeX, safeY, isCompact, isPortrait } = this.getResponsiveMetrics();
        const upgradeLevels = getMetaUpgradeLevels(this);
        this.ensureMetaUpgradeTexturesLoaded();
        const panelWidth = Math.min(width - safeX * 2, isPortrait ? 430 : 900);
        const panelHeight = Math.min(height - safeY * 2 - 18, isPortrait ? 700 : 620);
        const panel = createPixelPanel(this, width / 2, height / 2 + 8, panelWidth, panelHeight, {
            fill: SHOP_HUB_COLORS.panelInner,
            fillDark: SHOP_HUB_COLORS.panelOuter,
            border: SHOP_HUB_COLORS.border
        });
        this.uiRoot.add(panel);
        panel.add(createPixelText(this, 0, -panelHeight / 2 + 26, 'UPGRADE', {
            fontSize: isCompact ? '16px' : '18px',
            color: SHOP_HUB_COLORS.title
        }));

        const contentTop = -panelHeight / 2 + 120;
        const contentHeight = panelHeight - 220;
        const contentWidth = panelWidth - 20;
        const tabY = contentTop - 18;
        const tabWidth = isPortrait ? 106 : 120;
        const tabGap = 12;
        const activeGroupKey = META_UPGRADE_GROUPS.some((group) => group.key === this.selectedUpgradeGroupKey)
            ? this.selectedUpgradeGroupKey
            : META_UPGRADE_GROUPS[0]?.key;
        this.selectedUpgradeGroupKey = activeGroupKey;
        const tabStartX = -((META_UPGRADE_GROUPS.length * tabWidth) + ((META_UPGRADE_GROUPS.length - 1) * tabGap)) / 2 + tabWidth / 2;
        const tabButtons = [];
        META_UPGRADE_GROUPS.forEach((group, index) => {
            const isActive = group.key === activeGroupKey;
            const button = createPixelButton(
                this,
                tabStartX + index * (tabWidth + tabGap),
                tabY,
                tabWidth,
                30,
                group.label.toUpperCase(),
                () => {
                    this.selectedUpgradeGroupKey = group.key;
                    this.render();
                },
                {
                    fontSize: isCompact ? '10px' : '11px',
                    textColor: SHOP_HUB_COLORS.text,
                    fill: isActive ? 0x30454f : SHOP_HUB_COLORS.buttonFill,
                    inner: isActive ? 0x3b5663 : SHOP_HUB_COLORS.buttonInner,
                    activeFill: 0x30454f,
                    activeInner: 0x3b5663,
                    border: isActive ? SHOP_HUB_COLORS.borderBright : SHOP_HUB_COLORS.border,
                    activeBorder: SHOP_HUB_COLORS.borderBright
                }
            );
            tabButtons.push(button);
        });

        const contentPanel = createPixelPanel(this, 0, contentTop + contentHeight / 2 + 8, contentWidth, contentHeight - 16, {
            fill: 0x11181c,
            fillDark: 0x0b1013,
            border: SHOP_HUB_COLORS.border
        });
        panel.add(contentPanel);
        panel.add(tabButtons);

        const activeGroup = META_UPGRADE_GROUPS.find((group) => group.key === activeGroupKey) ?? META_UPGRADE_GROUPS[0];
        const activeUpgrades = META_UPGRADE_CONFIG.filter((entry) => entry.group === activeGroup?.key);

        const cardWidth = isPortrait ? contentWidth - 26 : Math.floor((contentWidth - 44) / 2);
        const cardHeight = 138;
        const columnGap = 18;
        const rowGap = 18;
        const columns = isPortrait ? 1 : 2;
        const totalGridWidth = columns * cardWidth + (columns - 1) * columnGap;
        const viewportTop = -contentHeight / 2 + 34;
        const viewportHeight = contentHeight - 62;
        const totalRows = Math.ceil(activeUpgrades.length / columns);
        const totalContentHeight = Math.max(
            viewportHeight,
            Math.max(0, totalRows - 1) * (cardHeight + rowGap) + cardHeight
        );
        const maxScroll = Math.max(0, totalContentHeight - viewportHeight);
        const currentScroll = Phaser.Math.Clamp(this.upgradeScrollOffsets[activeGroupKey] ?? 0, 0, maxScroll);
        this.upgradeScrollOffsets[activeGroupKey] = currentScroll;
        const listViewport = this.add.container(0, 0);
        const viewportBackground = this.add.graphics();
        viewportBackground.fillStyle(0x1b2a31, 0.98);
        viewportBackground.fillRect(-contentWidth / 2 + 6, viewportTop, contentWidth - 24, viewportHeight);
        viewportBackground.lineStyle(2, 0x3f5c69, 0.95);
        viewportBackground.strokeRect(-contentWidth / 2 + 6, viewportTop, contentWidth - 24, viewportHeight);
        listViewport.add(viewportBackground);
        const listContent = this.add.container(0, 0);
        listViewport.add(listContent);
        contentPanel.add(listViewport);
        contentPanel.bringToTop(listViewport);
        const cards = [];
        activeUpgrades.forEach((upgrade, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const baseX = columns === 1 ? 0 : (-totalGridWidth / 2 + cardWidth / 2);
            const x = columns === 1 ? 0 : baseX + col * (cardWidth + columnGap);
            const baseY = viewportTop + cardHeight / 2 + row * (cardHeight + rowGap);
            const card = this.createMetaUpgradeCard(upgrade, upgradeLevels, x, baseY - currentScroll, cardWidth, cardHeight);
            card.setData('baseY', baseY);
            listContent.add(card);
            cards.push(card);
        });
        this.updateUpgradeCardViewport(cards, currentScroll, viewportTop, viewportHeight, cardHeight);
        if (this.upgradeWheelHandler) {
            this.input.off('wheel', this.upgradeWheelHandler);
            this.upgradeWheelHandler = null;
        }
        if (maxScroll > 0) {
            const scrollTrack = this.add.graphics();
            const trackX = contentWidth / 2 - 12;
            const trackHeight = viewportHeight;
            scrollTrack.fillStyle(0x1a252b, 0.95);
            scrollTrack.fillRoundedRect(trackX, viewportTop, 6, trackHeight, 4);
            scrollTrack.lineStyle(1, 0x51656f, 1);
            scrollTrack.strokeRoundedRect(trackX, viewportTop, 6, trackHeight, 4);
            const thumbHeight = Math.max(28, Math.round((viewportHeight / totalContentHeight) * trackHeight));
            const thumbTravel = Math.max(0, trackHeight - thumbHeight);
            const thumbY = viewportTop + Math.round((currentScroll / maxScroll) * thumbTravel);
            scrollTrack.fillStyle(0xa8d6ea, 0.95);
            scrollTrack.fillRoundedRect(trackX, thumbY, 6, thumbHeight, 4);
            listViewport.add(scrollTrack);
            const hitArea = this.add.rectangle(trackX + 3, viewportTop + viewportHeight / 2, 18, viewportHeight, 0xffffff, 0.001)
                .setInteractive();
            const applyScroll = (nextOffset) => {
                const clamped = Phaser.Math.Clamp(nextOffset, 0, maxScroll);
                this.upgradeScrollOffsets[activeGroupKey] = clamped;
                this.updateUpgradeCardViewport(cards, clamped, viewportTop, viewportHeight, cardHeight);
                const nextThumbY = viewportTop + Math.round((clamped / maxScroll) * thumbTravel);
                scrollTrack.clear();
                scrollTrack.fillStyle(0x1a252b, 0.95);
                scrollTrack.fillRoundedRect(trackX, viewportTop, 6, trackHeight, 4);
                scrollTrack.lineStyle(1, 0x51656f, 1);
                scrollTrack.strokeRoundedRect(trackX, viewportTop, 6, trackHeight, 4);
                scrollTrack.fillStyle(0xa8d6ea, 0.95);
                scrollTrack.fillRoundedRect(trackX, nextThumbY, 6, thumbHeight, 4);
            };
            this.upgradeWheelHandler = (pointer, _currentlyOver, _dx, dy) => {
                const localX = pointer.x - panel.x;
                const localY = pointer.y - panel.y;
                const viewportLeft = -contentWidth / 2 + 6;
                const viewportRight = viewportLeft + (contentWidth - 24);
                const viewportBottom = viewportTop + viewportHeight;
                if (localX < viewportLeft || localX > viewportRight || localY < viewportTop || localY > viewportBottom) {
                    return;
                }
                applyScroll((this.upgradeScrollOffsets[activeGroupKey] ?? 0) + dy * 0.55);
            };
            this.input.on('wheel', this.upgradeWheelHandler);
            let dragStartY = 0;
            let dragStartOffset = 0;
            hitArea.on('pointerdown', (pointer) => {
                dragStartY = pointer.y;
                dragStartOffset = this.upgradeScrollOffsets[activeGroupKey] ?? 0;
            });
            hitArea.on('pointermove', (pointer) => {
                if (!pointer.isDown) return;
                applyScroll(dragStartOffset - (pointer.y - dragStartY));
            });
            listViewport.add(hitArea);
            listViewport.bringToTop(scrollTrack);
            listViewport.bringToTop(hitArea);
        }
        contentPanel.bringToTop(listViewport);
        tabButtons.forEach((button) => panel.bringToTop(button));

        this.uiRoot.add(createPixelButton(this, width / 2, height - safeY - (isCompact ? 28 : 24), Math.min(220, panelWidth - 40), isCompact ? 44 : 42, 'BACK', () => this.setMode('main'), {
            fontSize: isCompact ? '14px' : '16px',
            textColor: SHOP_HUB_COLORS.text,
            fill: SHOP_HUB_COLORS.buttonFill,
            inner: SHOP_HUB_COLORS.buttonInner,
            activeFill: SHOP_HUB_COLORS.buttonActiveFill,
            activeInner: SHOP_HUB_COLORS.buttonActiveInner,
            border: SHOP_HUB_COLORS.border,
            activeBorder: SHOP_HUB_COLORS.borderBright
        }));
    }

    supportsFullscreen() {
        const fullscreenTarget = document.getElementById('game-container') ?? document.documentElement ?? this.game?.canvas;
        const documentSupportsFullscreen = Boolean(
            document.fullscreenEnabled
            || document.webkitFullscreenEnabled
            || document.msFullscreenEnabled
        );
        return Boolean(fullscreenTarget && documentSupportsFullscreen);
    }

    async lockLandscapeOrientation() {
        try {
            if (screen.orientation?.lock) {
                await screen.orientation.lock('landscape');
            }
        } catch (_error) {
            // Mobile browsers may reject orientation lock unless fullscreen succeeds.
        }
    }

    async requestElementFullscreen(element) {
        if (!element) return false;
        try {
            if (typeof element.requestFullscreen === 'function') {
                await element.requestFullscreen({ navigationUI: 'hide' });
                return true;
            }
        } catch (_error) {
            // Try vendor-prefixed APIs below.
        }
        try {
            if (typeof element.webkitRequestFullscreen === 'function') {
                element.webkitRequestFullscreen();
                return true;
            }
        } catch (_error) {
            // Ignore and continue fallback chain.
        }
        try {
            if (typeof element.msRequestFullscreen === 'function') {
                element.msRequestFullscreen();
                return true;
            }
        } catch (_error) {
            // Ignore and continue fallback chain.
        }
        return false;
    }

    async toggleFullscreen() {
        const fullscreenTarget = document.getElementById('game-container') ?? document.documentElement ?? this.game?.canvas;
        const canvas = this.game?.canvas;
        if (!fullscreenTarget && !canvas) return;
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
            return;
        }
        window.scrollTo(0, 1);
        let enteredFullscreen = false;
        if (this.supportsFullscreen()) {
            const target = fullscreenTarget ?? canvas;
            if (target && typeof this.scale.startFullscreen === 'function') {
                try {
                    this.scale.startFullscreen(target);
                    enteredFullscreen = true;
                } catch (_error) {
                    enteredFullscreen = false;
                }
            }
        }
        if (!enteredFullscreen) {
            enteredFullscreen = await this.requestElementFullscreen(fullscreenTarget);
        }
        if (!enteredFullscreen && canvas && canvas !== fullscreenTarget) {
            enteredFullscreen = await this.requestElementFullscreen(canvas);
        }
        await this.lockLandscapeOrientation();
        if (!enteredFullscreen) {
            this.scale.refresh();
        }
    }

    renderCredits() {
        const { width, height, safeX, safeY, isCompact, isPortrait } = this.getResponsiveMetrics();
        const panelWidth = Math.min(width - safeX * 2, isPortrait ? 420 : 560);
        const panelHeight = Math.min(height - safeY * 2 - 24, isCompact ? 420 : 460);
        const panel = createPixelPanel(this, width / 2, height / 2 + 6, panelWidth, panelHeight, {
            fill: SHOP_HUB_COLORS.panelInner,
            fillDark: SHOP_HUB_COLORS.panelOuter,
            border: SHOP_HUB_COLORS.border
        });
        this.uiRoot.add(panel);

        panel.add(createPixelText(this, 0, -panelHeight / 2 + 30, 'CREDITS', {
            fontSize: isCompact ? '16px' : '18px',
            color: SHOP_HUB_COLORS.title
        }));

        const sections = [
            { title: 'Game', lines: ['Game by DK', 'Contact: dkhoankieu@gmail.com'] }
        ];

        const sectionStartY = -panelHeight / 2 + 82;
        const sectionGap = isCompact ? 76 : 88;
        sections.forEach((section, index) => {
            const y = sectionStartY + index * sectionGap;
            panel.add(createPixelText(this, 0, y, section.title.toUpperCase(), {
                fontSize: isCompact ? '12px' : '13px',
                color: SHOP_HUB_COLORS.title,
                strokeThickness: 3
            }));
            section.lines.forEach((line, lineIndex) => {
                panel.add(createPixelText(this, 0, y + 24 + lineIndex * 20, line, {
                    fontSize: isCompact ? '12px' : '13px',
                    color: SHOP_HUB_COLORS.text,
                    strokeThickness: 3
                }));
            });
        });

        this.uiRoot.add(createPixelButton(this, width / 2, height - safeY - (isCompact ? 28 : 24), Math.min(220, panelWidth - 40), isCompact ? 44 : 42, 'BACK', () => this.setMode('main'), {
            fontSize: isCompact ? '14px' : '16px',
            textColor: SHOP_HUB_COLORS.text,
            fill: SHOP_HUB_COLORS.buttonFill,
            inner: SHOP_HUB_COLORS.buttonInner,
            activeFill: SHOP_HUB_COLORS.buttonActiveFill,
            activeInner: SHOP_HUB_COLORS.buttonActiveInner,
            border: SHOP_HUB_COLORS.border,
            activeBorder: SHOP_HUB_COLORS.borderBright
        }));
    }

    createCharacterSlot(key, config, size, selected, unlocked = true) {
        const container = this.add.container(0, 0);
        const frame = this.add.graphics();
        const borderColor = selected ? SHOP_HUB_COLORS.borderBright : SHOP_HUB_COLORS.border;
        frame.fillStyle(SHOP_HUB_COLORS.panelOuter, 0.88);
        frame.fillRect(-size / 2, -size / 2, size, size);
        frame.lineStyle(2, 0x000000, 1);
        frame.strokeRect(-size / 2, -size / 2, size, size);
        frame.lineStyle(2, borderColor, 1);
        frame.strokeRect(-size / 2 + 2, -size / 2 + 2, size - 4, size - 4);
        frame.fillStyle(selected ? 0x8cc4dc : SHOP_HUB_COLORS.panelAccent, selected ? 0.18 : 0.16);
        frame.fillRect(-size / 2 + 6, -size / 2 + 6, size - 12, size - 12);
        const sprite = this.createCharacterPreview(key, 0, -Math.max(6, size * 0.07), Math.max(36, Math.floor(size * 0.48)));
        if (!unlocked) {
            sprite.setAlpha(0.38);
            sprite.setTint(0x5f6770);
        }
        const label = createPixelText(this, 0, size / 2 - 12, config.label ?? key, {
            fontSize: size <= 64 ? '8px' : '10px',
            color: selected ? SHOP_HUB_COLORS.title : SHOP_HUB_COLORS.dimText,
            strokeThickness: 2
        });
        const unlockType = getCharacterUnlockType(key);
        if (!unlocked) {
            const lockShade = this.add.graphics();
            lockShade.fillStyle(0x090b0d, 0.48);
            lockShade.fillRect(-size / 2 + 4, -size / 2 + 4, size - 8, size - 8);
            const lockText = createPixelText(this, 0, -4, 'LOCK', {
                fontSize: size <= 64 ? '8px' : '9px',
                color: '#ffd7a6',
                strokeThickness: 2
            });
            const hintText = createPixelText(this, 0, 10, unlockType === 'challenge' ? 'GOAL' : `${getCharacterUnlockCost(key)}`, {
                fontSize: size <= 64 ? '8px' : '9px',
                color: '#ffe9c8',
                strokeThickness: 2
            });
            container.add([lockShade, lockText, hintText]);
        }
        const hitArea = this.add.rectangle(0, 0, size, size, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => {
            this.selectedCharacterKey = key;
            this.render();
        });
        container.add([frame, sprite, label, hitArea]);
        return container;
    }

    updateUpgradeCardViewport(cards = [], scrollOffset = 0, viewportTop = 0, viewportHeight = 0, cardHeight = 0) {
        const viewportBottom = viewportTop + viewportHeight;
        cards.forEach((card) => {
            const baseY = Number(card.getData('baseY') ?? 0);
            const y = baseY - scrollOffset;
            card.y = y;
            const cardTop = y - cardHeight / 2;
            const cardBottom = y + cardHeight / 2;
            card.setVisible(cardTop >= viewportTop && cardBottom <= viewportBottom);
        });
    }

    createPassiveInfoBadge(x, y, passiveText, options = {}) {
        const normalizedPassiveText = typeof passiveText === 'string' ? passiveText.trim() : '';
        if (!normalizedPassiveText) {
            return null;
        }

        const compact = options.compact === true;
        const badgeSize = compact ? 16 : 18;
        const panelWidth = Math.max(110, options.panelWidth ?? PASSIVE_INFO_PANEL_MAX_WIDTH);
        const tooltipPadding = compact ? 8 : 10;
        const tooltipTextStyle = {
            fontFamily: 'monospace',
            fontSize: compact ? '9px' : '10px',
            color: '#fff3cf',
            align: 'left',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: panelWidth - tooltipPadding * 2, useAdvancedWrap: true }
        };

        const container = this.add.container(x, y);
        const badge = this.add.graphics();
        badge.fillStyle(SHOP_HUB_COLORS.panelOuter, 0.95);
        badge.fillRoundedRect(-badgeSize / 2, -badgeSize / 2, badgeSize, badgeSize, 4);
        badge.lineStyle(2, SHOP_HUB_COLORS.borderBright, 1);
        badge.strokeRoundedRect(-badgeSize / 2, -badgeSize / 2, badgeSize, badgeSize, 4);
        const badgeText = createPixelText(this, 0, 1, 'i', {
            fontSize: compact ? '10px' : '11px',
            color: SHOP_HUB_COLORS.title,
            strokeThickness: 2
        });
        const tooltipText = this.add.text(0, 0, `Passive\n${normalizedPassiveText}`, tooltipTextStyle)
            .setOrigin(0.5, 0);
        const tooltipHeight = Math.max(44, tooltipText.height + tooltipPadding * 2 + 8);
        const tooltip = this.add.container(0, -badgeSize / 2 - 10);
        const tooltipBackground = this.add.graphics();
        tooltipBackground.fillStyle(SHOP_HUB_COLORS.panelOuter, 0.96);
        tooltipBackground.fillRoundedRect(-panelWidth / 2, -tooltipHeight, panelWidth, tooltipHeight, 8);
        tooltipBackground.lineStyle(2, SHOP_HUB_COLORS.border, 1);
        tooltipBackground.strokeRoundedRect(-panelWidth / 2, -tooltipHeight, panelWidth, tooltipHeight, 8);
        tooltipText.setPosition(0, -tooltipHeight + tooltipPadding);
        tooltip.add([tooltipBackground, tooltipText]);
        tooltip.setVisible(false);

        const hitArea = this.add.rectangle(0, 0, badgeSize + 6, badgeSize + 6, 0xffffff, 0.001)
            .setInteractive({ useHandCursor: true });
        hitArea.on('pointerover', () => {
            tooltip.setVisible(true);
        });
        hitArea.on('pointerout', () => {
            tooltip.setVisible(false);
        });
        hitArea.on('pointerdown', (pointer) => {
            pointer.event?.stopPropagation?.();
            tooltip.setVisible(!tooltip.visible);
        });

        container.add([badge, badgeText, tooltip, hitArea]);
        return container;
    }

    createCharacterPreview(key, x, y, displaySize = 70) {
        const resolvedKey = CHARACTER_CONFIG[key] ? key : DEFAULT_CHARACTER_KEY;
        const assetConfig = CHARACTER_ASSET_CONFIG[resolvedKey];
        const atlasKey = assetConfig?.atlas?.key;
        const frameName = assetConfig?.animations?.idle?.frames?.[0]
            ?? assetConfig?.animations?.move?.frames?.[0]
            ?? 'image.png';
        if (!atlasKey || !this.textures.exists(atlasKey)) {
            return createPixelText(this, x, y, '?', {
                fontSize: `${Math.max(20, Math.floor(displaySize * 0.55))}px`,
                color: '#fff1c9',
                strokeThickness: 4
            }).setOrigin(0.5);
        }
        return this.add.sprite(x, y, atlasKey, frameName)
            .setDisplaySize(displaySize, displaySize)
            .setOrigin(0.5);
    }

    createMapSlot(mapKey, definition, selected, size = 120) {
        const container = this.add.container(0, 0);
        const fillColor = MAP_THEME_COLORS[mapKey] ?? SHOP_HUB_COLORS.border;
        const iconTextureKey = MAP_ICON_KEYS[mapKey];
        const hasIconTexture = Boolean(iconTextureKey && this.textures.exists(iconTextureKey));
        const frame = this.add.graphics();
        frame.fillStyle(SHOP_HUB_COLORS.panelOuter, 0.9);
        frame.fillRect(-size / 2, -size / 2, size, size);
        frame.fillStyle(fillColor, selected ? 0.16 : 0.08);
        frame.fillRect(-size / 2 + 8, -size / 2 + 8, size - 16, size - 16);
        frame.lineStyle(2, 0x000000, 1);
        frame.strokeRect(-size / 2, -size / 2, size, size);
        frame.lineStyle(2, selected ? SHOP_HUB_COLORS.borderBright : SHOP_HUB_COLORS.border, 1);
        frame.strokeRect(-size / 2 + 2, -size / 2 + 2, size - 4, size - 4);
        const label = createPixelText(this, 0, -size / 2 + 20, definition?.label ?? mapKey, {
            fontSize: size <= 108 ? '7px' : size <= 120 ? '9px' : '10px',
            color: selected ? SHOP_HUB_COLORS.title : SHOP_HUB_COLORS.dimText,
            strokeThickness: 2
        });
        const initials = definition?.label?.split(' ').map(part => part[0]).join('').slice(0, 2) ?? mapKey.slice(0, 2).toUpperCase();
        const icon = hasIconTexture
            ? this.add.image(0, 8, iconTextureKey).setDisplaySize(size - 28, size - 42).setOrigin(0.5)
            : createPixelText(this, 0, 8, initials, {
                fontSize: size <= 120 ? '26px' : '30px',
                color: '#fff1c9',
                strokeThickness: 4
            });
        const hitArea = this.add.rectangle(0, 0, size, size, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => {
            this.selectedMapKey = mapKey;
            this.render();
        });
        container.add([frame, icon, label, hitArea]);
        return container;
    }

    createMetaUpgradeCard(upgrade, upgradeLevels, x, y, width, height) {
        const container = this.add.container(x, y);
        const level = getMetaUpgradeLevel(upgradeLevels, upgrade.key);
        const maxLevel = getMetaUpgradeMaxLevel(upgrade);
        const nextCost = getMetaUpgradeNextCost(upgrade, level);
        const totalValue = getMetaUpgradeTotalValue(upgrade, level);
        const nextValue = getMetaUpgradeTotalValue(upgrade, Math.min(level + 1, maxLevel));
        const currentDynamon = Math.max(0, Math.floor(getMetaProgress(this).dynamon ?? 0));
        const canBuy = nextCost !== null && currentDynamon >= nextCost;
        const isMaxed = level >= maxLevel;

        const panel = createPixelPanel(this, 0, 0, width, height, {
            fill: 0x213039,
            fillDark: 0x0f1519,
            border: isMaxed ? SHOP_HUB_COLORS.borderBright : SHOP_HUB_COLORS.border
        });
        const iconPlate = this.add.graphics();
        iconPlate.fillStyle(isMaxed ? 0x3b5c68 : 0x1b252b, 0.98);
        iconPlate.fillRoundedRect(-width / 2 + 16, -height / 2 + 16, 52, 52, 10);
        iconPlate.lineStyle(2, isMaxed ? SHOP_HUB_COLORS.borderBright : SHOP_HUB_COLORS.border, 1);
        iconPlate.strokeRoundedRect(-width / 2 + 16, -height / 2 + 16, 52, 52, 10);
        const icon = this.textures.exists(upgrade.iconKey)
            ? this.add.image(-width / 2 + 42, -height / 2 + 42, upgrade.iconKey).setDisplaySize(34, 34).setOrigin(0.5)
            : createPixelText(this, -width / 2 + 42, -height / 2 + 42, '?', {
                fontSize: '18px',
                color: SHOP_HUB_COLORS.title,
                strokeThickness: 3
            });
        const title = createPixelText(this, -width / 2 + 84, -height / 2 + 24, upgrade.label, {
            fontSize: '11px',
            color: SHOP_HUB_COLORS.title,
            originX: 0,
            strokeThickness: 3
        });
        const maxText = createPixelText(this, -width / 2 + 84, -height / 2 + 44, `Max ${upgrade.maxText}`, {
            fontSize: '9px',
            color: SHOP_HUB_COLORS.dimText,
            originX: 0,
            strokeThickness: 2
        });
        const levelBadge = this.add.graphics();
        levelBadge.fillStyle(isMaxed ? 0x294c3c : 0x162126, 0.95);
        levelBadge.fillRoundedRect(width / 2 - 74, -height / 2 + 14, 60, 22, 8);
        levelBadge.lineStyle(2, isMaxed ? 0x9de2b0 : SHOP_HUB_COLORS.border, 1);
        levelBadge.strokeRoundedRect(width / 2 - 74, -height / 2 + 14, 60, 22, 8);
        const levelText = createPixelText(this, width / 2 - 44, -height / 2 + 25, `${level}/${maxLevel}`, {
            fontSize: '10px',
            color: isMaxed ? '#e9ffd7' : SHOP_HUB_COLORS.title,
            strokeThickness: 3
        });

        const progressY = -height / 2 + 56;
        const progressStartX = -width / 2 + 84;
        const pipGap = 6;
        for (let index = 0; index < maxLevel; index += 1) {
            const pipX = progressStartX + index * (18 + pipGap);
            const pip = this.add.graphics();
            const filled = index < level;
            pip.fillStyle(filled ? 0x8cc4dc : 0x2a3a42, 1);
            pip.fillRoundedRect(pipX, progressY, 18, 8, 4);
            pip.lineStyle(1, filled ? 0xa8d6ea : 0x51656f, 1);
            pip.strokeRoundedRect(pipX, progressY, 18, 8, 4);
            container.add(pip);
        }

        const currentText = createPixelText(this, -width / 2 + 16, 6, `Current ${formatMetaUpgradeValue(upgrade, totalValue)}`, {
            fontSize: '10px',
            color: SHOP_HUB_COLORS.text,
            originX: 0,
            strokeThickness: 3
        });
        const nextText = createPixelText(this, -width / 2 + 16, 26, isMaxed ? 'Fully upgraded' : `Next ${formatMetaUpgradeValue(upgrade, nextValue)}`, {
            fontSize: '10px',
            color: isMaxed ? '#fff4d0' : '#a7e6b8',
            originX: 0,
            strokeThickness: 3
        });
        const hintText = createPixelText(this, -width / 2 + 16, 46, upgrade.bonusText, {
            fontSize: '9px',
            color: SHOP_HUB_COLORS.dimText,
            originX: 0,
            strokeThickness: 2
        });
        const costBadge = this.add.graphics();
        const costBadgeColor = isMaxed ? 0x294c3c : canBuy ? 0x3a3020 : 0x2a2323;
        const costBorderColor = isMaxed ? 0x9de2b0 : canBuy ? 0xe6be78 : 0x8f6f6f;
        costBadge.fillStyle(costBadgeColor, 0.96);
        costBadge.fillRoundedRect(-width / 2 + 14, height / 2 - 34, 96, 22, 8);
        costBadge.lineStyle(2, costBorderColor, 1);
        costBadge.strokeRoundedRect(-width / 2 + 14, height / 2 - 34, 96, 22, 8);
        const costText = createPixelText(this, -width / 2 + 62, height / 2 - 23, isMaxed ? 'MAXED' : `${Math.floor(nextCost ?? 0)} DYN`, {
            fontSize: '10px',
            color: isMaxed ? '#e9ffd7' : canBuy ? '#fff1c9' : '#e4c0c0',
            strokeThickness: 3
        });
        const statusText = createPixelText(
            this,
            width / 2 - 66,
            height / 2 - 50,
            isMaxed ? 'FULLY UPGRADED' : canBuy ? 'READY TO BUY' : 'NOT ENOUGH DYNAMON',
            {
                fontSize: '8px',
                color: isMaxed ? '#b8ffd1' : canBuy ? '#fff1c9' : '#ff9e9e',
                strokeThickness: 2
            }
        );

        const buttonLabel = isMaxed ? 'MAX' : 'UPGRADE';
        const button = createPixelButton(this, width / 2 - 58, height / 2 - 23, 96, 28, buttonLabel, () => {
            if (!isMaxed) {
                this.purchaseMetaUpgrade(upgrade.key);
            }
        }, {
            fontSize: '11px',
            textColor: canBuy || isMaxed ? SHOP_HUB_COLORS.text : '#8c989f',
            fill: canBuy || isMaxed ? SHOP_HUB_COLORS.buttonFill : 0x1d2529,
            inner: canBuy || isMaxed ? SHOP_HUB_COLORS.buttonInner : 0x232b30,
            activeFill: SHOP_HUB_COLORS.buttonActiveFill,
            activeInner: SHOP_HUB_COLORS.buttonActiveInner,
            border: isMaxed ? SHOP_HUB_COLORS.borderBright : (canBuy ? SHOP_HUB_COLORS.border : UI_COLORS.disabled),
            activeBorder: SHOP_HUB_COLORS.borderBright
        });
        if (!canBuy && !isMaxed) {
            button.getAll().forEach((child) => child.setAlpha?.(0.72));
        }
        container.add([panel, iconPlate, icon, title, maxText, levelBadge, levelText, currentText, nextText, hintText, costBadge, costText, statusText, button]);
        return container;
    }

    ensureMetaUpgradeTexturesLoaded() {
        if (this.metaTextureLoadPending) return;
        const missing = META_UPGRADE_CONFIG.filter((upgrade) => upgrade?.iconKey && upgrade?.iconPath && !this.textures.exists(upgrade.iconKey));
        if (!missing.length) return;
        this.metaTextureLoadPending = true;
        this.load.reset();
        missing.forEach((upgrade) => {
            this.load.image(upgrade.iconKey, upgrade.iconPath);
        });
        this.load.once(Phaser.Loader.Events.COMPLETE, () => {
            this.metaTextureLoadPending = false;
            if (this.scene.isActive('MainMenuScene')) {
                this.render();
            }
        });
        this.load.start();
    }

    handleKeyboardNavigation(event) {
        if (!event) return;
        const { keyCode } = event;
        const codes = Phaser.Input.Keyboard.KeyCodes;

        if (this.mode === 'characters') {
            if ([codes.LEFT, codes.RIGHT, codes.UP, codes.DOWN, codes.ENTER, codes.ESC].includes(keyCode)) {
                event.preventDefault();
            }
            if (keyCode === codes.ESC) {
                this.setMode('main');
                return;
            }
            if (keyCode === codes.ENTER) {
                if (isCharacterUnlocked(this, this.selectedCharacterKey)) {
                    this.setMode('maps');
                } else {
                    if (getCharacterUnlockType(this.selectedCharacterKey) === 'dynamon') {
                        this.purchaseCharacterUnlock(this.selectedCharacterKey);
                    }
                }
                return;
            }
            this.handleCharacterGridNavigation(keyCode);
            return;
        }

        if (this.mode === 'maps') {
            if ([codes.LEFT, codes.RIGHT, codes.UP, codes.DOWN, codes.ENTER, codes.ESC].includes(keyCode)) {
                event.preventDefault();
            }
            if (keyCode === codes.ESC) {
                this.setMode('characters');
                return;
            }
            if (keyCode === codes.ENTER) {
                this.startGame();
                return;
            }
            this.handleMapNavigation(keyCode);
            return;
        }

        if (this.mode === 'upgrade') {
            if (keyCode === codes.ESC) {
                event.preventDefault();
                this.setMode('main');
            }
        }

    }

    handleCharacterGridNavigation(keyCode) {
        if (!this.characterGridKeys.length) return;
        const codes = Phaser.Input.Keyboard.KeyCodes;
        const currentIndex = Math.max(0, this.characterGridKeys.indexOf(this.selectedCharacterKey));
        const columns = Math.max(1, this.characterGridColumns);
        let nextIndex = currentIndex;

        if (keyCode === codes.LEFT) {
            nextIndex = Math.max(0, currentIndex - 1);
        } else if (keyCode === codes.RIGHT) {
            nextIndex = Math.min(this.characterGridKeys.length - 1, currentIndex + 1);
        } else if (keyCode === codes.UP) {
            nextIndex = Math.max(0, currentIndex - columns);
        } else if (keyCode === codes.DOWN) {
            nextIndex = Math.min(this.characterGridKeys.length - 1, currentIndex + columns);
        }

        if (nextIndex !== currentIndex) {
            this.selectedCharacterKey = this.characterGridKeys[nextIndex];
            this.render();
        }
    }

    handleMapNavigation(keyCode) {
        if (!this.mapOptionKeys.length) return;
        const codes = Phaser.Input.Keyboard.KeyCodes;
        const currentIndex = Math.max(0, this.mapOptionKeys.indexOf(this.selectedMapKey));
        let nextIndex = currentIndex;

        if (keyCode === codes.LEFT || keyCode === codes.UP) {
            nextIndex = Math.max(0, currentIndex - 1);
        } else if (keyCode === codes.RIGHT || keyCode === codes.DOWN) {
            nextIndex = Math.min(this.mapOptionKeys.length - 1, currentIndex + 1);
        }

        if (nextIndex !== currentIndex) {
            this.selectedMapKey = this.mapOptionKeys[nextIndex];
            this.render();
        }
    }

    getResponsiveMetrics() {
        const width = this.scale.width;
        const height = this.scale.height;
        const isPortrait = height >= width;
        const isCompact = width < 520 || height < 720;
        return {
            width,
            height,
            isPortrait,
            isCompact,
            safeX: Math.max(14, Math.floor(width * 0.05)),
            safeY: Math.max(14, Math.floor(height * 0.04))
        };
    }

    attachVerticalScroll(parent, x, y, width, height, content, contentHeight) {
        const maskGraphics = this.add.graphics();
        maskGraphics.fillStyle(0xffffff, 1);
        maskGraphics.fillRect(x - width / 2, y - height / 2, width, height);
        maskGraphics.setVisible(false);
        parent.add(maskGraphics);
        content.setMask(maskGraphics.createGeometryMask());
        if (contentHeight <= height) {
            return;
        }
        const hitArea = this.add.rectangle(x, y, width, height, 0xffffff, 0.001).setInteractive();
        parent.add(hitArea);
        const minY = -(contentHeight - height) / 2;
        const maxY = (contentHeight - height) / 2;
        content.y = maxY;
        hitArea.on('wheel', (_pointer, _dx, dy) => {
            content.y = Phaser.Math.Clamp(content.y - dy * 0.35, minY, maxY);
        });
        let dragStartY = 0;
        let contentStartY = 0;
        hitArea.on('pointerdown', (pointer) => {
            dragStartY = pointer.y;
            contentStartY = content.y;
        });
        hitArea.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;
            content.y = Phaser.Math.Clamp(contentStartY + (pointer.y - dragStartY), minY, maxY);
        });
    }

    attachTopAnchoredVerticalScroll(parent, x, topY, width, height, content, contentHeight) {
        const maskGraphics = this.add.graphics();
        maskGraphics.fillStyle(0xffffff, 1);
        maskGraphics.fillRect(x - width / 2, topY, width, height);
        maskGraphics.setVisible(false);
        parent.add(maskGraphics);
        content.setMask(maskGraphics.createGeometryMask());
        if (contentHeight <= height) {
            content.y = topY;
            return;
        }
        const hitArea = this.add.rectangle(x, topY + height / 2, width, height, 0xffffff, 0.001).setInteractive();
        parent.add(hitArea);
        const minY = topY - (contentHeight - height);
        const maxY = topY;
        content.y = topY;
        hitArea.on('wheel', (_pointer, _dx, dy) => {
            content.y = Phaser.Math.Clamp(content.y - dy * 0.35, minY, maxY);
        });
        let dragStartY = 0;
        let contentStartY = 0;
        hitArea.on('pointerdown', (pointer) => {
            dragStartY = pointer.y;
            contentStartY = content.y;
        });
        hitArea.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;
            content.y = Phaser.Math.Clamp(contentStartY + (pointer.y - dragStartY), minY, maxY);
        });
    }

    attachHorizontalScroll(parent, x, y, width, height, content, contentWidth) {
        const maskGraphics = this.add.graphics();
        maskGraphics.fillStyle(0xffffff, 1);
        maskGraphics.fillRect(x - width / 2, y - height / 2, width, height);
        maskGraphics.setVisible(false);
        parent.add(maskGraphics);
        content.setMask(maskGraphics.createGeometryMask());
        if (contentWidth <= width) {
            return;
        }
        const hitArea = this.add.rectangle(x, y, width, height, 0xffffff, 0.001).setInteractive();
        parent.add(hitArea);
        const minX = -(contentWidth - width) / 2;
        const maxX = (contentWidth - width) / 2;
        content.x = maxX;
        hitArea.on('wheel', (_pointer, _dx, dy) => {
            content.x = Phaser.Math.Clamp(content.x - dy * 0.45, minX, maxX);
        });
        let dragStartX = 0;
        let contentStartX = 0;
        hitArea.on('pointerdown', (pointer) => {
            dragStartX = pointer.x;
            contentStartX = content.x;
        });
        hitArea.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;
            content.x = Phaser.Math.Clamp(contentStartX + (pointer.x - dragStartX), minX, maxX);
        });
    }

    setMode(mode) {
        this.mode = mode;
        this.render();
    }

    handleMetaProgressChanged() {
        this.syncChallengeCharacterUnlocks();
        if (this.scene.isActive('MainMenuScene')) {
            this.render();
        }
    }

    syncChallengeCharacterUnlocks() {
        const levels = getMetaUpgradeLevels(this);
        Object.entries(CHARACTER_CONFIG).forEach(([characterKey, characterConfig]) => {
            if (isCharacterUnlocked(this, characterKey)) return;
            if (characterConfig?.unlockType !== 'challenge') return;
            const requirement = characterConfig?.unlockRequirement ?? null;
            if (requirement?.type !== 'max_meta_upgrade') return;
            const upgrade = META_UPGRADE_CONFIG.find((entry) => entry.key === requirement.upgradeKey);
            if (!upgrade) return;
            const currentLevel = getMetaUpgradeLevel(levels, upgrade.key);
            const maxLevel = getMetaUpgradeMaxLevel(upgrade);
            if (currentLevel >= maxLevel) {
                unlockCharacter(this, characterKey);
            }
        });
    }

    purchaseMetaUpgrade(upgradeKey) {
        const upgrade = META_UPGRADE_CONFIG.find((entry) => entry.key === upgradeKey);
        if (!upgrade) return false;
        const levels = getMetaUpgradeLevels(this);
        const level = getMetaUpgradeLevel(levels, upgrade.key);
        const maxLevel = getMetaUpgradeMaxLevel(upgrade);
        if (level >= maxLevel) return false;
        const nextCost = getMetaUpgradeNextCost(upgrade, level);
        if (!Number.isFinite(nextCost) || (getMetaProgress(this).dynamon ?? 0) < nextCost) {
            return false;
        }
        spendDynamon(this, nextCost);
        setMetaUpgradeLevels(this, {
            ...levels,
            [upgrade.key]: level + 1
        });
        this.syncChallengeCharacterUnlocks();
        this.render();
        return true;
    }

    purchaseCharacterUnlock(characterKey) {
        const key = String(characterKey ?? '').trim();
        if (!key || isCharacterUnlocked(this, key)) return true;
        if (getCharacterUnlockType(key) !== 'dynamon') return false;
        const unlockCost = getCharacterUnlockCost(key);
        if ((getMetaProgress(this).dynamon ?? 0) < unlockCost) {
            return false;
        }
        spendDynamon(this, unlockCost);
        unlockCharacter(this, key);
        this.selectedCharacterKey = key;
        this.render();
        return true;
    }

    startGame() {
        if (!isCharacterUnlocked(this, this.selectedCharacterKey)) return;
        this.registry.set('selectedCharacterKey', this.selectedCharacterKey);
        this.registry.set('selectedMapKey', this.selectedMapKey);
        this.registry.set('debugMode', this.debugMode);
        this.registry.set('hasStartedGame', true);
        this.scene.start('MainScene');
    }
}
