import Item from '../entities/Item.js';
import { ITEM_CONFIG, getLootTableForEnemy } from '../config/items.js';
import { LOOT_CONFIG } from '../config/loot.js';

export default class LootSystem {
    constructor(scene) {
        this.scene = scene;
        this.itemGroup = this.scene.physics.add.group();
        this.ensureItemTextures();
    }

    ensureItemTextures() {
        Object.entries(ITEM_CONFIG).forEach(([itemKey, config]) => {
            const textureKey = config.textureKey ?? itemKey;
            if (!textureKey) return;
            if (config.assetPath) {
                return; // custom texture provided by asset
            }
            if (this.scene.textures.exists(textureKey)) return;
            const size = config.size ?? 20;
            const canvas = this.scene.textures.createCanvas(textureKey, size, size);
            const ctx = canvas.context;
            ctx.clearRect(0, 0, size, size);
            ctx.fillStyle = this.toCss(config.outerColor ?? 0xffffff);
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = this.toCss(config.innerColor ?? 0x000000);
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            canvas.refresh();
        });
    }

    toCss(value) {
        const integer = Number(value) >>> 0;
        return `#${integer.toString(16).padStart(6, '0')}`;
    }

    buildLootTable(enemyType, enemy = null) {
        const baseTable = getLootTableForEnemy(enemyType) ?? [];
        if (!enemy?.isElite) {
            return baseTable;
        }
        const eliteTable = this.scene?.stageScenario?.elite?.lootTable;
        if (!Array.isArray(eliteTable) || !eliteTable.length) {
            return baseTable;
        }
        const merged = new Map();
        baseTable.forEach((entry) => {
            if (entry?.itemKey) {
                merged.set(entry.itemKey, { ...entry });
            }
        });
        eliteTable.forEach((entry) => {
            if (entry?.itemKey) {
                merged.set(entry.itemKey, { ...entry });
            }
        });
        return Array.from(merged.values());
    }

    spawnLoot(enemyType, x, y, enemy = null) {
        const table = this.buildLootTable(enemyType, enemy);
        if (!table?.length) return;
        table.forEach(entry => {
            if (Math.random() > entry.chance) return;
            const amount = Phaser.Math.Between(entry.minAmount, entry.maxAmount ?? entry.minAmount);
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const radius = Phaser.Math.Between(6, 20);
            this.spawnItem(
                entry.itemKey,
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                amount
            );
        });
    }

    spawnItem(itemKey, x, y, amount = 1) {
        const config = ITEM_CONFIG[itemKey];
        if (!config) return null;
        const maxGroundItems = LOOT_CONFIG.maxGroundItems ?? 500;
        const activeGroundItems = this.itemGroup?.countActive?.(true) ?? 0;
        if (activeGroundItems >= maxGroundItems) {
            return null;
        }
        const item = new Item(this.scene, x, y, itemKey, amount);
        this.itemGroup.add(item);
        return item;
    }
}
