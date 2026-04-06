import {
    createBackdrop,
    createPixelButton,
    createPixelPanel,
    createPixelText
} from './ui/PixelSceneHelpers.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
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
            fill: 0x2b1515,
            fillDark: 0x1a0d0d,
            border: 0xc66a6a
        });
        this.add.existing(panel);
        panel.add(createPixelText(this, 0, -panelHeight / 2 + 34, 'GAME OVER', {
            fontSize: isCompact ? '20px' : '22px',
            color: '#ffd8d8'
        }));

        const stats = [
            `TIME SURVIVED: ${data.timeSurvived ?? '00:00'}`,
            `ENEMIES KILLED: ${data.enemiesKilled ?? 0}`,
            `LEVEL REACHED: ${data.levelReached ?? 1}`
        ];
        stats.forEach((line, index) => {
            panel.add(createPixelText(this, 0, -36 + index * (isCompact ? 40 : 42), line, {
                fontSize: isCompact ? '13px' : '14px',
                color: index === 0 ? '#ffd8d8' : '#ffc2c2'
            }));
        });

        panel.add(createPixelButton(this, 0, 86, buttonWidth, buttonHeight, 'RETRY', () => {
            this.scene.stop('HudScene');
            this.scene.stop('MainScene');
            this.scene.stop('GameOverScene');
            this.scene.start('MainScene');
        }, {
            fontSize: isCompact ? '15px' : '16px'
        }));
        panel.add(createPixelButton(this, 0, 144, buttonWidth, buttonHeight, 'BACK TO MENU', () => {
            this.scene.stop('HudScene');
            this.scene.stop('MainScene');
            this.scene.stop('GameOverScene');
            this.scene.start('MainMenuScene');
        }, {
            fontSize: isCompact ? '15px' : '16px'
        }));
    }
}
