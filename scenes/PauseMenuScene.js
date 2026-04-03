import { getAudioSettings, updateAudioSetting } from '../utils/audioSettings.js';
import {
    createBackdrop,
    createPixelButton,
    createPixelPanel,
    createPixelText,
    createPixelToggle
} from './ui/PixelSceneHelpers.js';

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
        const isCompact = width < 520 || height < 720;
        const safeX = Math.max(14, Math.floor(width * 0.05));
        const panelWidth = Math.min(width - safeX * 2, 420);
        const panelHeight = this.mode === 'settings'
            ? (isCompact ? 300 : 270)
            : (isCompact ? 340 : 300);
        const buttonWidth = Math.min(panelWidth - 44, 250);
        const buttonHeight = isCompact ? 44 : 38;
        createBackdrop(this, 0.7);
        const panel = createPixelPanel(this, width / 2, height / 2, panelWidth, panelHeight);
        panel.add(createPixelText(this, 0, -panelHeight / 2 + 28, this.mode === 'settings' ? 'SETTINGS' : 'PAUSED', {
            fontSize: isCompact ? '16px' : '18px'
        }));
        this.add.existing(panel);

        if (this.mode === 'pause') {
            panel.add(createPixelButton(this, 0, -30, buttonWidth, buttonHeight, 'RESUME', () => this.resumeGame(), {
                fontSize: isCompact ? '15px' : '16px'
            }));
            panel.add(createPixelButton(this, 0, 28, buttonWidth, buttonHeight, 'SETTINGS', () => {
                this.mode = 'settings';
                this.render();
            }, {
                fontSize: isCompact ? '15px' : '16px'
            }));
            panel.add(createPixelButton(this, 0, 86, buttonWidth, buttonHeight, 'QUIT TO MENU', () => this.quitToMenu(), {
                fontSize: isCompact ? '15px' : '16px'
            }));
        } else {
            const settings = getAudioSettings(this);
            const toggleX = -Math.min(100, panelWidth * 0.24);
            panel.add(createPixelToggle(this, toggleX, -20, 'MUSIC', settings.musicEnabled, (value) => {
                updateAudioSetting(this, 'musicEnabled', value);
                this.scene.get('MainScene')?.syncMapMusic?.(this.scene.get('MainScene')?.mapManager?.getCurrentMap?.());
            }));
            panel.add(createPixelToggle(this, toggleX, 44, 'SFX', settings.sfxEnabled, (value) => {
                updateAudioSetting(this, 'sfxEnabled', value);
            }));
            panel.add(createPixelButton(this, 0, panelHeight / 2 - 34, Math.min(buttonWidth, 180), isCompact ? 42 : 36, 'BACK', () => {
                this.mode = 'pause';
                this.render();
            }, {
                fontSize: isCompact ? '14px' : '15px'
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
