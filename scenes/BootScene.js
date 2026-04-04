import { getAvailableMaps, getMapDefinition } from '../config/map.js';
import { preloadAllAssets } from '../utils/animationSystem.js';
import { UI_COLORS, createBackdrop, createPixelPanel, createPixelText } from './ui/PixelSceneHelpers.js';

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
const SHOP_HUB_COLORS = {
    panelOuter: 0x11171b,
    panelInner: 0x1b252b,
    border: 0x7e99a8,
    title: '#e7f4ff',
    subtitle: '#b7d0db',
    text: '#d9f6ff',
    fill: 0x30454f,
    fillBorder: 0xa8d6ea
};

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
        this.progressBar = null;
        this.progressLabel = null;
        this.progressValueText = null;
    }

    preload() {
        this.cameras.main.roundPixels = true;
        this.createLoadingUi();
        this.bindLoaderEvents();
        this.preloadMenuAssets();
        this.preloadMapAssets();
        preloadAllAssets(this);
    }

    create() {
        this.scene.start('MainMenuScene');
    }

    createLoadingUi() {
        const width = this.scale.width;
        const height = this.scale.height;
        createBackdrop(this, 0.92);
        const panelWidth = Math.min(width - 32, 420);
        const panelHeight = 168;
        const panel = createPixelPanel(this, width / 2, height / 2, panelWidth, panelHeight, {
            fill: SHOP_HUB_COLORS.panelInner,
            fillDark: SHOP_HUB_COLORS.panelOuter,
            border: SHOP_HUB_COLORS.border
        });
        panel.add(createPixelText(this, 0, -42, 'LOADING', {
            fontSize: width < 640 ? '18px' : '22px',
            color: SHOP_HUB_COLORS.title
        }));
        this.progressLabel = createPixelText(this, 0, -12, 'Preparing assets...', {
            fontSize: '12px',
            color: SHOP_HUB_COLORS.subtitle
        });
        this.progressBar = this.add.graphics();
        this.progressValueText = createPixelText(this, 0, 42, '0%', {
            fontSize: '14px',
            color: SHOP_HUB_COLORS.text
        });
        panel.add([this.progressLabel, this.progressBar, this.progressValueText]);
        this.drawProgressBar(0);
    }

    bindLoaderEvents() {
        this.load.on('progress', (value) => {
            this.drawProgressBar(value);
        });
        this.load.on('complete', () => {
            this.drawProgressBar(1);
            if (this.progressLabel) {
                this.progressLabel.setText('Ready');
            }
        });
    }

    drawProgressBar(progress) {
        if (!this.progressBar) return;
        const clamped = Phaser.Math.Clamp(progress ?? 0, 0, 1);
        const width = Math.min(this.scale.width - 72, 300);
        const height = 22;
        const x = -width / 2;
        const y = 8;

        this.progressBar.clear();
        this.progressBar.fillStyle(UI_COLORS.ink, 0.95);
        this.progressBar.fillRect(x, y, width, height);
        this.progressBar.fillStyle(SHOP_HUB_COLORS.panelOuter, 1);
        this.progressBar.fillRect(x + 3, y + 3, width - 6, height - 6);
        this.progressBar.fillStyle(SHOP_HUB_COLORS.fill, 1);
        this.progressBar.fillRect(x + 4, y + 4, Math.max(0, (width - 8) * clamped), height - 8);
        this.progressBar.lineStyle(2, 0x000000, 1);
        this.progressBar.strokeRect(x, y, width, height);
        this.progressBar.lineStyle(2, SHOP_HUB_COLORS.fillBorder, 1);
        this.progressBar.strokeRect(x + 2, y + 2, width - 4, height - 4);

        if (this.progressValueText) {
            this.progressValueText.setText(`${Math.round(clamped * 100)}%`);
        }
    }

    preloadMenuAssets() {
        if (!this.textures.exists(MENU_BACKGROUND_KEY)) {
            this.load.image(MENU_BACKGROUND_KEY, 'assets/menu/background.png');
        }
        Object.entries(MAP_ICON_PATHS).forEach(([mapKey, path]) => {
            const textureKey = MAP_ICON_KEYS[mapKey];
            if (!textureKey || this.textures.exists(textureKey)) return;
            this.load.image(textureKey, path);
        });
    }

    preloadMapAssets() {
        Object.values(getAvailableMaps()).forEach((mapEntry) => {
            const definition = getMapDefinition(mapEntry.id);
            if (!definition) return;
            if (definition.jsonPath) {
                this.load.tilemapTiledJSON(definition.mapKey, definition.jsonPath);
            }
            if (definition.music?.key && definition.music?.path && !this.cache.audio.exists(definition.music.key)) {
                this.load.audio(definition.music.key, definition.music.path);
            }
            (definition.tilesets ?? []).forEach((tileset) => {
                if (!tileset.imageKey || !tileset.imagePath || this.textures.exists(tileset.imageKey)) return;
                this.load.image(tileset.imageKey, tileset.imagePath);
            });
        });
    }
}
