import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import MainScene from './scenes/MainScene.js';
import HudScene from './scenes/HudScene.js';
import PauseMenuScene from './scenes/PauseMenuScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    pixelArt: true,
    antialias: false,
    antialiasGL: false,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [BootScene, MainMenuScene, MainScene, HudScene, PauseMenuScene, GameOverScene, VictoryScene]
};

new Phaser.Game(config);
