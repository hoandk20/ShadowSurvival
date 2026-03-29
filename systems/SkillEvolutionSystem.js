import { SKILL_CONFIG } from '../config/skill.js';
import { SKILL_EVOLUTION_CONFIG, getPassiveEvolutionConfig } from '../config/skillEvolution.js';

export default class SkillEvolutionSystem {
    constructor(scene) {
        this.scene = scene;
    }

    processAvailableEvolutions() {
        const evolutions = this.getEligibleEvolutions();
        evolutions.forEach((entry) => this.applyEvolution(entry));
        return evolutions;
    }

    getEligibleEvolutions() {
        const scene = this.scene;
        const player = scene?.player;
        if (!scene || !player) return [];

        const activeSkillKeys = Array.isArray(scene.activeSkillKeys) ? scene.activeSkillKeys : [];
        const inventoryItemLevels = scene.inventoryItemLevels ?? {};
        const characterKey = scene.activeCharacterKey ?? player.characterKey;
        const defaultSkillKey = player.getDefaultSkillKey?.() ?? null;

        return SKILL_EVOLUTION_CONFIG.filter((entry) => {
            if (!entry?.sourceSkillKey || !entry?.evolvedSkillKey) return false;
            if (!SKILL_CONFIG[entry.evolvedSkillKey]) return false;
            if (entry.characterKey && entry.characterKey !== characterKey) return false;
            if (!activeSkillKeys.includes(entry.sourceSkillKey)) return false;
            if (activeSkillKeys.includes(entry.evolvedSkillKey)) return false;
            if (entry.onlyDefaultSkill && defaultSkillKey !== entry.sourceSkillKey) return false;
            const requiredInventoryKey = entry.inventoryKey ?? entry.sourceSkillKey;
            const requiredLevel = Math.max(1, entry.requiredLevel ?? 8);
            if ((inventoryItemLevels[requiredInventoryKey] ?? 0) < requiredLevel) return false;
            if (entry.passiveEvolutionKey && player.hasPassiveEvolution?.(entry.passiveEvolutionKey)) return false;
            return true;
        });
    }

    applyEvolution(entry) {
        const scene = this.scene;
        const player = scene?.player;
        if (!scene || !player) return false;

        const didReplace = player.replaceSkill(entry.sourceSkillKey, entry.evolvedSkillKey);
        if (!didReplace) return false;

        if (entry.evolvedSkillOverrides) {
            player.setSkillRuntimeOverrides?.(entry.evolvedSkillKey, entry.evolvedSkillOverrides);
        }
        this.renameInventoryEntry(entry);
        this.activatePassiveEvolution(entry.passiveEvolutionKey);
        this.showEvolutionAnnouncement(entry);
        return true;
    }

    renameInventoryEntry(entry) {
        const inventoryKey = entry.inventoryKey ?? entry.sourceSkillKey;
        const inventoryEntry = this.scene.inventoryItems?.find((item) => item.inventoryKey === inventoryKey);
        if (!inventoryEntry) return;
        inventoryEntry.name = SKILL_CONFIG[entry.evolvedSkillKey]?.label ?? inventoryEntry.name;
    }

    activatePassiveEvolution(passiveEvolutionKey) {
        if (!passiveEvolutionKey) return false;
        const passiveConfig = getPassiveEvolutionConfig(passiveEvolutionKey);
        if (!passiveConfig) return false;
        return this.scene.player?.activateHiddenPassiveEvolution?.(passiveEvolutionKey, passiveConfig) ?? false;
    }

    showEvolutionAnnouncement(entry) {
        const fromLabel = SKILL_CONFIG[entry.sourceSkillKey]?.label ?? entry.sourceSkillKey;
        const toLabel = SKILL_CONFIG[entry.evolvedSkillKey]?.label ?? entry.evolvedSkillKey;
        const x = this.scene.player?.x ?? this.scene.scale.width / 2;
        const y = (this.scene.player?.y ?? this.scene.scale.height / 2) - 42;
        const text = this.scene.add.text(x, y, `${fromLabel} -> ${toLabel}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#fff1b3',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(1600);

        this.scene.tweens.add({
            targets: text,
            y: y - 28,
            alpha: 0,
            duration: 900,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy()
        });
    }
}
