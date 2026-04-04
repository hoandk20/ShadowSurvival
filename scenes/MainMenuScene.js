import { CHARACTER_CONFIG, DEFAULT_CHARACTER_KEY } from '../config/characters/characters.js';
import { CHARACTER_ASSET_CONFIG } from '../config/assets.js';
import { DEFAULT_MAP_KEY, getAvailableMaps, getMapDefinition } from '../config/map.js';
import { DEFAULT_AUDIO_SETTINGS, ensureAudioSettings, getAudioSettings, installAudioUnlock, updateAudioSetting } from '../utils/audioSettings.js';
import {
    UI_COLORS,
    createBackdrop,
    createPixelButton,
    createPixelPanel,
    createPixelText,
    createPixelToggle,
    createSparkField
} from './ui/PixelSceneHelpers.js';

const MENU_BACKGROUND_KEY = 'menu_background';
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
    }

    preload() {
        if (!this.textures.exists(MENU_BACKGROUND_KEY)) {
            this.load.image(MENU_BACKGROUND_KEY, 'assets/menu/background.png');
        }
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
        const initialCharacterKey = this.registry.get('selectedCharacterKey') ?? DEFAULT_CHARACTER_KEY;
        this.selectedCharacterKey = CHARACTER_CONFIG[initialCharacterKey] ? initialCharacterKey : DEFAULT_CHARACTER_KEY;
        const initialMapKey = this.registry.get('selectedMapKey') ?? DEFAULT_MAP_KEY;
        this.selectedMapKey = getMapDefinition(initialMapKey) ? initialMapKey : DEFAULT_MAP_KEY;
        this.debugMode = this.registry.get('debugMode') === true;
        this.setDebugPanelVisible(false);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
        this.audioUnlockCleanup = installAudioUnlock(this);
        this.input.keyboard.on('keydown', this.handleKeyboardNavigation, this);
        this.render();
        this.scale.on('resize', this.render, this);
    }

    shutdown() {
        this.destroyRenderTree();
        this.setDebugPanelVisible(false);
        this.audioUnlockCleanup?.();
        this.audioUnlockCleanup = null;
        this.input.keyboard.off('keydown', this.handleKeyboardNavigation, this);
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
        this.uiRoot.add(createPixelText(this, width / 2, metrics.safeY + 24, 'SHADOW SURVIVORS', {
            fontSize: metrics.isCompact ? '22px' : metrics.isPortrait ? '26px' : '32px',
            color: SHOP_HUB_COLORS.title,
            strokeThickness: 5
        }));
        this.uiRoot.add(createPixelText(this, width / 2, metrics.safeY + 56, 'RETRO FANTASY HUNT', {
            fontSize: metrics.isCompact ? '11px' : '12px',
            color: SHOP_HUB_COLORS.dimText,
            strokeThickness: 3
        }));

        if (this.mode === 'main') {
            this.renderMainMenu();
        } else if (this.mode === 'characters') {
            this.renderCharacterSelect();
        } else if (this.mode === 'maps') {
            this.renderMapSelect();
        } else if (this.mode === 'settings') {
            this.renderSettings();
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
            { label: 'SETTINGS', action: () => this.setMode('settings') },
            { label: 'CREDITS', action: () => this.setMode('credits') }
        ];
        const totalHeight = buttonHeight * buttons.length + buttonGap * Math.max(0, buttons.length - 1);
        const buttonY = Math.max(safeY + 120, height / 2 - totalHeight / 2 + buttonHeight / 2);

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

        const entries = Object.entries(CHARACTER_CONFIG);
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
        const compactPortrait = isPortrait && isCompact;
        previewPanel.add(createPixelText(this, 0, -previewHeight / 2 + 26, selectedCharacter.label ?? this.selectedCharacterKey, {
            fontSize: isCompact ? '16px' : '18px',
            color: SHOP_HUB_COLORS.title
        }));
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
            const slot = this.createCharacterSlot(key, config, slotSize, key === this.selectedCharacterKey);
            slot.setPosition(startX + col * (slotSize + gap), startY + row * (slotSize + gap));
            gridContent.add(slot);
        });
        panel.add(gridContent);

        const actionButtonY = height - safeY - (isCompact ? 28 : 24);
        const actionGap = isCompact ? 14 : 18;
        const actionWidth = Math.min(Math.max(Math.floor((width - safeX * 2 - actionGap) / 2), 150), 220);
        const actionHeight = isCompact ? 44 : 46;
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
            createPixelButton(this, width / 2 + actionWidth / 2 + actionGap / 2, actionButtonY, actionWidth, actionHeight, 'CONFIRM', () => this.setMode('maps'), {
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
        const showFullscreenButton = true;
        const panelWidth = Math.min(width - safeX * 2, isPortrait ? 400 : 460);
        const panelHeight = showFullscreenButton
            ? (isCompact ? 382 : 360)
            : (isCompact ? 320 : 300);
        const panel = createPixelPanel(this, width / 2, height / 2, panelWidth, panelHeight, {
            fill: SHOP_HUB_COLORS.panelInner,
            fillDark: SHOP_HUB_COLORS.panelOuter,
            border: SHOP_HUB_COLORS.border
        });
        this.uiRoot.add(panel);
        panel.add(createPixelText(this, 0, -96, 'SETTINGS', {
            fontSize: isCompact ? '16px' : '18px',
            color: SHOP_HUB_COLORS.title
        }));
        const settings = getAudioSettings(this);
        const toggleX = -Math.min(110, panelWidth * 0.25);
        const musicToggle = createPixelToggle(this, toggleX, -28, 'MUSIC', settings.musicEnabled, (value) => {
            updateAudioSetting(this, 'musicEnabled', value);
        });
        const sfxToggle = createPixelToggle(this, toggleX, 42, 'SFX', settings.sfxEnabled, (value) => {
            updateAudioSetting(this, 'sfxEnabled', value);
        });
        panel.add([musicToggle, sfxToggle]);
        const backButtonY = height / 2 + panelHeight / 2 - 34;
        if (showFullscreenButton) {
            const isFullscreen = this.scale.isFullscreen === true;
            panel.add(createPixelButton(
                this,
                0,
                panelHeight / 2 - 74,
                Math.min(240, panelWidth - 48),
                isCompact ? 42 : 40,
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
        this.uiRoot.add(createPixelButton(this, width / 2, backButtonY, Math.min(220, panelWidth - 40), isCompact ? 44 : 42, 'BACK', () => this.setMode('main'), {
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

    toggleFullscreen() {
        const fullscreenTarget = document.getElementById('game-container') ?? document.documentElement ?? this.game?.canvas;
        const canvas = this.game?.canvas;
        if (!fullscreenTarget && !canvas) return;
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
            return;
        }
        if (this.supportsFullscreen()) {
            const target = fullscreenTarget ?? canvas;
            if (target && typeof this.scale.startFullscreen === 'function') {
                this.scale.startFullscreen(target);
                return;
            }
        }
        if (fullscreenTarget && typeof fullscreenTarget.requestFullscreen === 'function') {
            fullscreenTarget.requestFullscreen();
            return;
        }
        if (fullscreenTarget && typeof fullscreenTarget.webkitRequestFullscreen === 'function') {
            fullscreenTarget.webkitRequestFullscreen();
            return;
        }
        if (fullscreenTarget && typeof fullscreenTarget.msRequestFullscreen === 'function') {
            fullscreenTarget.msRequestFullscreen();
            return;
        }
        if (canvas && typeof canvas.requestFullscreen === 'function') {
            canvas.requestFullscreen();
            return;
        }
        if (canvas && typeof canvas.webkitRequestFullscreen === 'function') {
            canvas.webkitRequestFullscreen();
            return;
        }
        if (canvas && typeof canvas.msRequestFullscreen === 'function') {
            canvas.msRequestFullscreen();
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
            { title: 'Game', lines: ['Game by DK', 'Contact: dkhoankieu@gmail.com'] },
            { title: 'Graphics', lines: ['Self-made / AI generated'] },
            { title: 'Music', lines: ['AI generated'] },
            { title: 'Tools', lines: ['Phaser, TexturePacker'] }
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

    createCharacterSlot(key, config, size, selected) {
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
        const label = createPixelText(this, 0, size / 2 - 12, config.label ?? key, {
            fontSize: size <= 64 ? '8px' : '10px',
            color: selected ? SHOP_HUB_COLORS.title : SHOP_HUB_COLORS.dimText,
            strokeThickness: 2
        });
        const hitArea = this.add.rectangle(0, 0, size, size, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => {
            this.selectedCharacterKey = key;
            this.render();
        });
        container.add([frame, sprite, label, hitArea]);
        return container;
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
                this.setMode('maps');
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

    startGame() {
        this.registry.set('selectedCharacterKey', this.selectedCharacterKey);
        this.registry.set('selectedMapKey', this.selectedMapKey);
        this.registry.set('debugMode', this.debugMode);
        this.registry.set('hasStartedGame', true);
        this.scene.start('MainScene');
    }
}
