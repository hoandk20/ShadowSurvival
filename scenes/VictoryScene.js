import {
    createBackdrop,
    createPixelButton,
    createPixelPanel,
    createPixelText
} from './ui/PixelSceneHelpers.js';
import { t, translateText } from '../utils/languageSettings.js';

export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create(data = {}) {
        const width = this.scale.width;
        const height = this.scale.height;
        const safeX = Math.max(14, Math.floor(width * 0.05));
        const isCompact = width < 520 || height < 720;
        const panelWidth = Math.min(width - safeX * 2, 460);
        const panelHeight = isCompact ? 380 : 340;
        const buttonWidth = Math.min(panelWidth - 46, 230);
        const buttonHeight = isCompact ? 44 : 38;
        createBackdrop(this, 0.78);
        const panel = createPixelPanel(this, width / 2, height / 2, panelWidth, panelHeight, {
            fill: 0x1f2b1f,
            fillDark: 0x141c14,
            border: 0x9bc27d
        });
        this.add.existing(panel);
        panel.add(createPixelText(this, 0, -panelHeight / 2 + 34, 'YOU WIN', {
            fontSize: isCompact ? '20px' : '22px',
            color: '#f3ffe7'
        }));

        const stats = [
            t(this, 'time_survived', { time: data.timeSurvived ?? '00:00' }),
            t(this, 'enemies_killed', { count: data.enemiesKilled ?? 0 }),
            t(this, 'level_reached', { level: data.levelReached ?? 1 })
        ];
        stats.forEach((line, index) => {
            panel.add(createPixelText(this, 0, -36 + index * (isCompact ? 40 : 42), line, {
                fontSize: isCompact ? '13px' : '14px',
                color: index === 0 ? '#f3ffe7' : '#d9f6dd'
            }));
        });

        if (data.unlockedCharacterLabel) {
            panel.add(createPixelText(this, 0, isCompact ? 90 : 88, t(this, 'unlocked_character', {
                label: translateText(this, data.unlockedCharacterLabel)
            }), {
                fontSize: isCompact ? '12px' : '13px',
                color: '#ffd79a'
            }));
        }

        panel.add(createPixelButton(this, 0, data.unlockedCharacterLabel ? 120 : 86, buttonWidth, buttonHeight, 'RETRY', () => {
            this.scene.stop('HudScene');
            this.scene.stop('MainScene');
            this.scene.stop('VictoryScene');
            this.scene.start('MainScene');
        }, {
            fontSize: isCompact ? '15px' : '16px'
        }));
        panel.add(createPixelButton(this, 0, data.unlockedCharacterLabel ? 178 : 144, buttonWidth, buttonHeight, 'BACK TO MENU', () => {
            this.scene.stop('HudScene');
            this.scene.stop('MainScene');
            this.scene.stop('VictoryScene');
            this.scene.start('MainMenuScene');
        }, {
            fontSize: isCompact ? '15px' : '16px'
        }));
    }
}
