import { CHARACTER_CONFIG, DEFAULT_CHARACTER_KEY } from '../config/characters/characters.js';
import { CHARACTER_ASSET_CONFIG } from '../config/assets.js';
import { DEFAULT_MAP_KEY, getAvailableMaps, getMapDefinition } from '../config/map.js';
import { SKILL_CONFIG } from '../config/skill.js';
import { DEFAULT_AUDIO_SETTINGS, ensureAudioSettings, getAudioSettings, updateAudioSetting } from '../utils/audioSettings.js';
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
        this.registry.set('audioSettings', { ...DEFAULT_AUDIO_SETTINGS, ...ensureAudioSettings(this.registry) });
        this.selectedCharacterKey = this.registry.get('selectedCharacterKey') ?? DEFAULT_CHARACTER_KEY;
        this.selectedMapKey = this.registry.get('selectedMapKey') ?? DEFAULT_MAP_KEY;
        this.debugMode = this.registry.get('debugMode') === true;
        this.setDebugPanelVisible(false);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
        this.input.keyboard.on('keydown', this.handleKeyboardNavigation, this);
        this.render();
        this.scale.on('resize', this.render, this);
    }

    shutdown() {
        this.destroyRenderTree();
        this.setDebugPanelVisible(false);
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
        this.sparkField = createSparkField(this, width / 2, height / 2, width * 0.68, height * 0.68, metrics.isCompact ? 12 : 18);

        this.uiRoot = this.add.container(0, 0);
        this.uiRoot.add(createPixelText(this, width / 2, metrics.safeY + 24, 'SHADOW SURVIVORS', {
            fontSize: metrics.isCompact ? '22px' : metrics.isPortrait ? '26px' : '32px',
            color: '#ffe7ab',
            strokeThickness: 5
        }));
        this.uiRoot.add(createPixelText(this, width / 2, metrics.safeY + 56, 'RETRO FANTASY HUNT', {
            fontSize: metrics.isCompact ? '11px' : '12px',
            color: UI_COLORS.dimText,
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
        const totalHeight = buttonHeight * 5 + buttonGap * 4;
        const buttonY = Math.max(safeY + 120, height / 2 - totalHeight / 2 + buttonHeight / 2);
        const hasRunState = this.registry.get('hasStartedGame') ?? false;
        const buttons = [
            { label: 'START GAME', action: () => this.beginNewRun(false) },
            { label: 'START DEBUG MODE', action: () => this.beginNewRun(true) },
            { label: 'CONTINUE', action: () => this.startGame(), disabled: !hasRunState },
            { label: 'SETTINGS', action: () => this.setMode('settings') },
            { label: 'CREDITS', action: () => this.setMode('credits') }
        ];

        buttons.forEach((entry, index) => {
            const button = createPixelButton(this, width / 2, buttonY + index * (buttonHeight + buttonGap), buttonWidth, buttonHeight, entry.label, () => {
                if (!entry.disabled) entry.action();
            }, {
                fontSize: isCompact ? '15px' : '17px',
                textColor: entry.disabled ? '#9f947e' : UI_COLORS.text,
                border: entry.disabled ? UI_COLORS.disabled : UI_COLORS.gold
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
        const panelWidth = Math.min(isPortrait ? width - safeX * 2 : width - safeX * 2, isPortrait ? 420 : 920);
        const panelHeight = Math.min(height - safeY * 2 - 18, isPortrait ? 680 : 560);
        const panel = createPixelPanel(this, width / 2, height / 2 + (isPortrait ? 8 : 12), panelWidth, panelHeight);
        this.uiRoot.add(panel);
        panel.add(createPixelText(this, 0, -panelHeight / 2 + 26, 'CHARACTER SELECT', {
            fontSize: isCompact ? '16px' : '18px',
            color: '#ffe9b8'
        }));

        const entries = Object.entries(CHARACTER_CONFIG);
        const contentTop = -panelHeight / 2 + 68;
        const footerHeight = isCompact ? 108 : 92;
        const previewWidth = isPortrait ? panelWidth - 28 : Math.min(300, Math.floor(panelWidth * 0.34));
        const previewHeight = isPortrait ? 236 : Math.min(388, panelHeight - 84);
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
            fill: 0x211722
        });
        panel.add(previewPanel);
        const selectedCharacter = CHARACTER_CONFIG[this.selectedCharacterKey];
        previewPanel.add(createPixelText(this, 0, -previewHeight / 2 + 26, selectedCharacter.label ?? this.selectedCharacterKey, {
            fontSize: isCompact ? '16px' : '18px',
            color: '#fff0c5'
        }));
        previewPanel.add(this.createCharacterPreview(this.selectedCharacterKey, 0, isPortrait ? -52 : -72, isPortrait ? 70 : 88));
        previewPanel.add(this.add.text(0, isPortrait ? -8 : -18, selectedCharacter.description ?? '', {
            fontFamily: 'monospace',
            fontSize: isCompact ? '10px' : '11px',
            color: UI_COLORS.dimText,
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: previewWidth - 32, useAdvancedWrap: true }
        }).setOrigin(0.5, 0));
        const skillKey = selectedCharacter.defaultSkill ?? 'thunder';
        const skillCfg = SKILL_CONFIG[skillKey] ?? {};
        const stats = [
            `HP: 10000`,
            `DAMAGE: ${skillCfg.damage ?? 0}`,
            `SKILL: ${(skillCfg.label ?? skillKey).toUpperCase()}`,
            `SPEED: ${selectedCharacter.speed ?? 0}`
        ];
        stats.forEach((line, index) => {
            previewPanel.add(createPixelText(this, 0, (isPortrait ? 64 : 82) + index * (isCompact ? 18 : 22), line, {
                fontSize: isCompact ? '12px' : '13px',
                color: index === 2 ? '#ffd888' : UI_COLORS.text
            }));
        });

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
                fontSize: isCompact ? '14px' : '16px'
            }),
            createPixelButton(this, width / 2 + actionWidth / 2 + actionGap / 2, actionButtonY, actionWidth, actionHeight, 'CONFIRM', () => this.setMode('maps'), {
                fontSize: isCompact ? '14px' : '16px'
            })
        ]);
    }

    renderMapSelect() {
        const { width, height, safeX, safeY, isPortrait, isCompact } = this.getResponsiveMetrics();
        const maps = getAvailableMaps();
        this.mapOptionKeys = maps.map((mapEntry) => mapEntry.id);
        const panelWidth = Math.min(width - safeX * 2, isPortrait ? 420 : 920);
        const panelHeight = Math.min(height - safeY * 2 - 18, isPortrait ? 520 : 420);
        const panel = createPixelPanel(this, width / 2, height / 2 + (isPortrait ? 6 : 10), panelWidth, panelHeight);
        this.uiRoot.add(panel);
        panel.add(createPixelText(this, 0, -160, 'MAP SELECT', {
            fontSize: isCompact ? '16px' : '18px',
            color: '#ffe9b8'
        }));

        const gap = isCompact ? 14 : 18;
        const availableWidth = panelWidth - 40;
        const slotSize = Math.max(96, Math.min(Math.floor((availableWidth - gap * (maps.length - 1)) / maps.length), isCompact ? 128 : 150));
        const contentWidth = maps.length * slotSize + Math.max(0, maps.length - 1) * gap;
        const stripY = -22;
        const mapContent = this.add.container(0, stripY);
        const startX = -contentWidth / 2 + slotSize / 2;
        maps.forEach((mapEntry, index) => {
            const definition = getMapDefinition(mapEntry.id);
            const x = startX + index * (slotSize + gap);
            const slot = this.createMapSlot(mapEntry.id, definition, mapEntry.id === this.selectedMapKey, slotSize);
            slot.setPosition(x, 0);
            mapContent.add(slot);
        });
        panel.add(mapContent);

        const selectedMap = getMapDefinition(this.selectedMapKey);
        panel.add(createPixelText(this, 0, isPortrait ? 98 : 110, (selectedMap?.label ?? this.selectedMapKey).toUpperCase(), {
            fontSize: isCompact ? '15px' : '16px',
            color: '#fff0c5'
        }));
        panel.add(createPixelText(this, 0, isPortrait ? 130 : 142, selectedMap?.description ?? '', {
            fontSize: isCompact ? '11px' : '12px',
            color: UI_COLORS.dimText
        }).setWordWrapWidth(Math.min(420, panelWidth - 36)));

        const actionButtonY = height - safeY - (isCompact ? 28 : 24);
        const actionGap = isCompact ? 14 : 18;
        const actionWidth = Math.min(Math.max(Math.floor((width - safeX * 2 - actionGap) / 2), 150), 230);
        const actionHeight = isCompact ? 44 : 46;
        this.uiRoot.add([
            createPixelButton(this, width / 2 - actionWidth / 2 - actionGap / 2, actionButtonY, actionWidth, actionHeight, 'BACK', () => this.setMode('characters'), {
                fontSize: isCompact ? '14px' : '16px'
            }),
            createPixelButton(this, width / 2 + actionWidth / 2 + actionGap / 2, actionButtonY, actionWidth, actionHeight, 'START HUNT', () => this.startGame(), {
                fontSize: isCompact ? '14px' : '16px'
            })
        ]);
    }

    renderSettings() {
        const { width, height, safeX, isCompact, isPortrait } = this.getResponsiveMetrics();
        const panelWidth = Math.min(width - safeX * 2, isPortrait ? 400 : 460);
        const panelHeight = isCompact ? 320 : 300;
        const panel = createPixelPanel(this, width / 2, height / 2, panelWidth, panelHeight);
        this.uiRoot.add(panel);
        panel.add(createPixelText(this, 0, -96, 'SETTINGS', {
            fontSize: isCompact ? '16px' : '18px',
            color: '#ffe9b8'
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
        this.uiRoot.add(createPixelButton(this, width / 2, height / 2 + panelHeight / 2 - 34, Math.min(220, panelWidth - 40), isCompact ? 44 : 42, 'BACK', () => this.setMode('main'), {
            fontSize: isCompact ? '14px' : '16px'
        }));
    }

    renderCredits() {
        const { width, height, safeX, safeY, isCompact, isPortrait } = this.getResponsiveMetrics();
        const panelWidth = Math.min(width - safeX * 2, isPortrait ? 420 : 560);
        const panelHeight = Math.min(height - safeY * 2 - 24, isCompact ? 420 : 460);
        const panel = createPixelPanel(this, width / 2, height / 2 + 6, panelWidth, panelHeight, {
            fill: 0x201720
        });
        this.uiRoot.add(panel);

        panel.add(createPixelText(this, 0, -panelHeight / 2 + 30, 'CREDITS', {
            fontSize: isCompact ? '16px' : '18px',
            color: '#ffe9b8'
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
                color: '#ffd888',
                strokeThickness: 3
            }));
            section.lines.forEach((line, lineIndex) => {
                panel.add(createPixelText(this, 0, y + 24 + lineIndex * 20, line, {
                    fontSize: isCompact ? '12px' : '13px',
                    color: UI_COLORS.text,
                    strokeThickness: 3
                }));
            });
        });

        this.uiRoot.add(createPixelButton(this, width / 2, height - safeY - (isCompact ? 28 : 24), Math.min(220, panelWidth - 40), isCompact ? 44 : 42, 'BACK', () => this.setMode('main'), {
            fontSize: isCompact ? '14px' : '16px'
        }));
    }

    createCharacterSlot(key, config, size, selected) {
        const container = this.add.container(0, 0);
        const frame = this.add.graphics();
        const borderColor = selected ? UI_COLORS.goldBright : UI_COLORS.border;
        frame.fillStyle(0x150f16, 0.88);
        frame.fillRect(-size / 2, -size / 2, size, size);
        frame.lineStyle(2, 0x000000, 1);
        frame.strokeRect(-size / 2, -size / 2, size, size);
        frame.lineStyle(2, borderColor, 1);
        frame.strokeRect(-size / 2 + 2, -size / 2 + 2, size - 4, size - 4);
        frame.fillStyle(selected ? 0xf9d87a : 0x6f5938, selected ? 0.12 : 0.08);
        frame.fillRect(-size / 2 + 6, -size / 2 + 6, size - 12, size - 12);
        const sprite = this.createCharacterPreview(key, 0, -Math.max(6, size * 0.07), Math.max(36, Math.floor(size * 0.48)));
        const label = createPixelText(this, 0, size / 2 - 12, config.label ?? key, {
            fontSize: size <= 64 ? '8px' : '10px',
            color: selected ? '#fff0c5' : UI_COLORS.dimText,
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

    createCharacterPreview(key, x, y, displaySize = 70) {
        const assetConfig = CHARACTER_ASSET_CONFIG[key];
        const atlasKey = assetConfig?.atlas?.key;
        const frameName = assetConfig?.animations?.idle?.frames?.[0]
            ?? assetConfig?.animations?.move?.frames?.[0]
            ?? 'image.png';
        return this.add.sprite(x, y, atlasKey, frameName)
            .setDisplaySize(displaySize, displaySize)
            .setOrigin(0.5);
    }

    createMapSlot(mapKey, definition, selected, size = 120) {
        const container = this.add.container(0, 0);
        const fillColor = MAP_THEME_COLORS[mapKey] ?? UI_COLORS.gold;
        const iconTextureKey = MAP_ICON_KEYS[mapKey];
        const hasIconTexture = Boolean(iconTextureKey && this.textures.exists(iconTextureKey));
        const frame = this.add.graphics();
        frame.fillStyle(0x151018, 0.9);
        frame.fillRect(-size / 2, -size / 2, size, size);
        frame.fillStyle(fillColor, selected ? 0.16 : 0.08);
        frame.fillRect(-size / 2 + 8, -size / 2 + 8, size - 16, size - 16);
        frame.lineStyle(2, 0x000000, 1);
        frame.strokeRect(-size / 2, -size / 2, size, size);
        frame.lineStyle(2, selected ? UI_COLORS.goldBright : UI_COLORS.border, 1);
        frame.strokeRect(-size / 2 + 2, -size / 2 + 2, size - 4, size - 4);
        const label = createPixelText(this, 0, -size / 2 + 20, definition?.label ?? mapKey, {
            fontSize: size <= 120 ? '9px' : '10px',
            color: selected ? '#fff0c5' : UI_COLORS.dimText,
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
