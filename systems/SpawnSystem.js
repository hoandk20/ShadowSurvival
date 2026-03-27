// systems/SpawnSystem.js
import Enemy from '../entities/Enemy.js';
import { ELITE_CONFIGS, ELITE_SPAWN_TIERS, ELITE_SPAWN_SETTINGS } from '../config/elites.js';

export default class SpawnSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.enemyPool = this.scene.physics.add.group({
            classType: Enemy,
            maxSize: 300, // Pool size for 200+ enemies
            runChildUpdate: true
        });
        this.spawnTimer = 0;
        this.spawnRate = 1000; // ms between spawns
        this.maxEnemies = 150;
        this.currentEnemies = 0;
    }

    update(time, delta) {
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnRate && this.currentEnemies < this.maxEnemies) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }
    }

    spawnEnemy(enemyKey = 'zombie') {
        const enemy = this.enemyPool.get();
        if (enemy) {
            // Spawn at random edge
            const side = Math.floor(Math.random() * 4);
            let x, y;
            switch (side) {
                case 0: // Top
                    x = Math.random() * 800;
                    y = -50;
                    break;
                case 1: // Right
                    x = 850;
                    y = Math.random() * 600;
                    break;
                case 2: // Bottom
                    x = Math.random() * 800;
                    y = 650;
                    break;
                case 3: // Left
                    x = -50;
                    y = Math.random() * 600;
                    break;
            }
            enemy.spawn(x, y, this.player);
            this.currentEnemies++;
        }
    }

    onEnemyDespawn() {
        this.currentEnemies--;
    }
}
