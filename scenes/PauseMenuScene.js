import { getAudioSettings, updateAudioSetting } from '../utils/audioSettings.js';
import { getGameplaySettings, updateGameplaySetting } from '../utils/gameplaySettings.js';
import { ensureLanguageSettings, updateLanguageSetting } from '../utils/languageSettings.js';
import {
    createBackdrop,
    createPixelButton,
    createPixelCycle,
    createPixelPanel,
    createPixelText,
    createPixelToggle
} from './ui/PixelSceneHelpers.js';

const SHOP_HUB_COLORS = {
    panelOuter: 0x11171b,
    panelInner: 0x1b252b,
    border: 0x7e99a8,
    title: '#e7f4ff',
    text: '#d9f6ff',
    buttonFill: 0x25343d,
    buttonInner: 0x30454f,
    buttonActiveFill: 0x30454f,
    buttonActiveInner: 0x3b5663,
    buttonBorder: 0x7e99a8,
    buttonActiveBorder: 0xa8d6ea
};

export default class PauseMenuScene extends Phaser.Scene {
    constructor() {
        super('PauseMenuScene');
        this.mode = 'pause';
    }

    create() {
        this.mode = 'pause';
        this.isClosing = false;
        this.render();
        this.input.keyboard.on('keydown-ESC', this.handleEsc, this);
        this.scale.on('resize', this.render, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    }

    shutdown() {
        this.input.keyboard.off('keydown-ESC', this.handleEsc, this);
        this.scale.off('resize', this.render, this);
    }

    handleEsc(event) {
        event?.preventDefault?.();
        if (this.mode === 'settings') {
            this.mode = 'pause';
            this.render();
            return;
        }
        this.resumeGame();
    }

    render() {
        if (this.isClosing) return;
        this.children.removeAll(true);
        const width = this.scale.width;
        const height = this.scale.height;
        const isPortrait = height >= width;
        const isCompact = width < 520 || height < 720;
        const isMobileLandscape = !isPortrait && isCompact;
        const safeX = Math.max(14, Math.floor(width * 0.05));
        const panelWidth = Math.min(width - safeX * 2, isMobileLandscape ? 560 : 420);
        const panelHeight = this.mode === 'settings'
            ? (isMobileLandscape ? 300 : (isCompact ? 360 : 330))
            : (isCompact ? 340 : 300);
        const buttonWidth = Math.min(panelWidth - 44, 250);
        const buttonHeight = isCompact ? 44 : 38;
        createBackdrop(this, 0.7);
        const panel = createPixelPanel(this, width / 2, height / 2, panelWidth, panelHeight, {
            fill: SHOP_HUB_COLORS.panelInner,
            fillDark: SHOP_HUB_COLORS.panelOuter,
            border: SHOP_HUB_COLORS.border
        });
        panel.add(createPixelText(this, 0, -panelHeight / 2 + (isMobileLandscape && this.mode === 'settings' ? 24 : 28), this.mode === 'settings' ? 'SETTINGS' : 'PAUSED', {
            fontSize: isCompact ? '16px' : '18px',
            color: SHOP_HUB_COLORS.title
        }));
        this.add.existing(panel);

        if (this.mode === 'pause') {
            panel.add(createPixelButton(this, 0, -30, buttonWidth, buttonHeight, 'RESUME', () => this.resumeGame(), {
                fontSize: isCompact ? '15px' : '16px',
                textColor: SHOP_HUB_COLORS.text,
                fill: SHOP_HUB_COLORS.buttonFill,
                inner: SHOP_HUB_COLORS.buttonInner,
                activeFill: SHOP_HUB_COLORS.buttonActiveFill,
                activeInner: SHOP_HUB_COLORS.buttonActiveInner,
                border: SHOP_HUB_COLORS.buttonBorder,
                activeBorder: SHOP_HUB_COLORS.buttonActiveBorder
            }));
            panel.add(createPixelButton(this, 0, 28, buttonWidth, buttonHeight, 'SETTINGS', () => {
                this.mode = 'settings';
                this.render();
            }, {
                fontSize: isCompact ? '15px' : '16px',
                textColor: SHOP_HUB_COLORS.text,
                fill: SHOP_HUB_COLORS.buttonFill,
                inner: SHOP_HUB_COLORS.buttonInner,
                activeFill: SHOP_HUB_COLORS.buttonActiveFill,
                activeInner: SHOP_HUB_COLORS.buttonActiveInner,
                border: SHOP_HUB_COLORS.buttonBorder,
                activeBorder: SHOP_HUB_COLORS.buttonActiveBorder
            }));
            panel.add(createPixelButton(this, 0, 86, buttonWidth, buttonHeight, 'QUIT TO MENU', () => this.quitToMenu(), {
                fontSize: isCompact ? '15px' : '16px',
                textColor: SHOP_HUB_COLORS.text,
                fill: SHOP_HUB_COLORS.buttonFill,
                inner: SHOP_HUB_COLORS.buttonInner,
                activeFill: SHOP_HUB_COLORS.buttonActiveFill,
                activeInner: SHOP_HUB_COLORS.buttonActiveInner,
                border: SHOP_HUB_COLORS.buttonBorder,
                activeBorder: SHOP_HUB_COLORS.buttonActiveBorder
            }));
        } else {
            const settings = getAudioSettings(this);
            const gameplay = getGameplaySettings(this);
            const language = ensureLanguageSettings(this.registry).language;
            const toggleX = -Math.min(isMobileLandscape ? 88 : 100, panelWidth * (isMobileLandscape ? 0.22 : 0.24));
            const titleY = -panelHeight / 2 + (isMobileLandscape ? 24 : 28);
            const contentTopY = titleY + (isMobileLandscape ? 42 : 54);
            const backButtonHeight = isCompact ? 42 : 36;
            const contentBottomY = panelHeight / 2 - backButtonHeight - (isMobileLandscape ? 18 : 24);
            const rowGap = Math.max(isMobileLandscape ? 30 : 38, Math.floor((contentBottomY - contentTopY) / 4));

            panel.add(createPixelToggle(this, toggleX, contentTopY + rowGap * 0, 'MUSIC', settings.musicEnabled, (value) => {
                updateAudioSetting(this, 'musicEnabled', value);
                const mainScene = this.scene.get('MainScene');
                mainScene?.syncMapMusic?.(mainScene?.mapManager?.getCurrentMap?.());
            }));
            panel.add(createPixelToggle(this, toggleX, contentTopY + rowGap * 1, 'SFX', settings.sfxEnabled, (value) => {
                updateAudioSetting(this, 'sfxEnabled', value);
            }));
            panel.add(createPixelCycle(this, toggleX, contentTopY + rowGap * 2, 'DMG TEXT', ['full', 'reduced', 'off'], gameplay.damageNumbersMode ?? 'full', (next) => {
                updateGameplaySetting(this, 'damageNumbersMode', next);
            }));
            panel.add(createPixelCycle(this, toggleX, contentTopY + rowGap * 3, 'DMG CAP', ['merge', 'replace', 'unlimited'], gameplay.damageTextCapMode ?? 'merge', (next) => {
                updateGameplaySetting(this, 'damageTextCapMode', next);
            }));
            panel.add(createPixelCycle(this, toggleX, contentTopY + rowGap * 4, 'LANGUAGE', ['en', 'vi'], language, (next) => {
                updateLanguageSetting(this, next);
                this.render();
            }, {
                languageLabels: true
            }));
            panel.add(createPixelButton(this, 0, panelHeight / 2 - (isMobileLandscape ? 28 : 34), Math.min(buttonWidth, 180), backButtonHeight, 'BACK', () => {
                this.mode = 'pause';
                this.render();
            }, {
                fontSize: isCompact ? '14px' : '15px',
                textColor: SHOP_HUB_COLORS.text,
                fill: SHOP_HUB_COLORS.buttonFill,
                inner: SHOP_HUB_COLORS.buttonInner,
                activeFill: SHOP_HUB_COLORS.buttonActiveFill,
                activeInner: SHOP_HUB_COLORS.buttonActiveInner,
                border: SHOP_HUB_COLORS.buttonBorder,
                activeBorder: SHOP_HUB_COLORS.buttonActiveBorder
            }));
        }
    }

    resumeGame() {
        const mainScene = this.scene.get('MainScene');
        mainScene?.physics?.world?.resume?.();
        this.scene.resume('MainScene');
        this.scene.resume('HudScene');
        this.scene.stop();
    }

    quitToMenu() {
        if (this.isClosing) return;
        this.isClosing = true;
        this.input.keyboard.off('keydown-ESC', this.handleEsc, this);
        this.scale.off('resize', this.render, this);

        const mainScene = this.scene.get('MainScene');
        this.scene.resume('MainScene');
        mainScene?.quitToMainMenu?.();
    }
}
