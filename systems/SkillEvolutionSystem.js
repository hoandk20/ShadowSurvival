import { SKILL_CONFIG } from '../config/skill.js';
import { SKILL_EVOLUTION_CONFIG } from '../config/skillEvolution.js';

export default class SkillEvolutionSystem {
    constructor(scene) {
        this.scene = scene;
        this.pendingEliteKillRequirements = new Map();
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
        const skillObjectSpawnCounts = scene.skillObjectSpawnCounts ?? {};
        const skillHitCounts = scene.skillHitCounts ?? {};
        const killCount = scene.killCount ?? 0;
        const eliteKillCount = scene.eliteKillCount ?? 0;
        const characterKey = scene.activeCharacterKey ?? player.characterKey;
        const defaultSkillKey = player.getDefaultSkillKey?.() ?? null;

        return SKILL_EVOLUTION_CONFIG.filter((entry) => {
            if (!entry?.sourceSkillKey) return false;
            const targetSkillKey = entry.evolvedSkillKey ?? entry.unlockSkillKey;
            if (!targetSkillKey || !SKILL_CONFIG[targetSkillKey]) return false;
            const requirementKey = entry.key ?? `${entry.sourceSkillKey}->${targetSkillKey}`;

            const meetsBaseRequirements = !(
                (entry.characterKey && entry.characterKey !== characterKey)
                || !activeSkillKeys.includes(entry.sourceSkillKey)
                || activeSkillKeys.includes(targetSkillKey)
                || (entry.onlyDefaultSkill && defaultSkillKey !== entry.sourceSkillKey)
                || (typeof entry.requiredKills === 'number' && killCount < Math.max(1, entry.requiredKills))
                || (
                    typeof entry.requiredSkillObjectSpawns === 'number'
                    && (skillObjectSpawnCounts[entry.sourceSkillKey] ?? 0) < Math.max(1, entry.requiredSkillObjectSpawns)
                )
                || (
                    typeof entry.requiredSkillHits === 'number'
                    && (skillHitCounts[entry.sourceSkillKey] ?? 0) < Math.max(1, entry.requiredSkillHits)
                )
                || (
                    entry.requiredLevel !== undefined
                    && (inventoryItemLevels[entry.inventoryKey ?? entry.sourceSkillKey] ?? 0) < Math.max(1, entry.requiredLevel)
                )
            );

            if (!meetsBaseRequirements) {
                this.pendingEliteKillRequirements.delete(requirementKey);
                return false;
            }

            if (typeof entry.requiredEliteKillsAfterReady === 'number') {
                const requiredEliteKills = Math.max(1, entry.requiredEliteKillsAfterReady);
                const armedAtEliteKills = this.pendingEliteKillRequirements.get(requirementKey);
                if (armedAtEliteKills === undefined) {
                    this.pendingEliteKillRequirements.set(requirementKey, eliteKillCount);
                    return false;
                }
                return (eliteKillCount - armedAtEliteKills) >= requiredEliteKills;
            }

            return true;
        });
    }

    applyEvolution(entry) {
        const scene = this.scene;
        const player = scene?.player;
        if (!scene || !player) return false;

        const targetSkillKey = entry.evolvedSkillKey ?? entry.unlockSkillKey;
        if (!targetSkillKey) return false;
        const lockedObjectCount = entry.lockObjectCountOnEvolution
            ? player.getSkillObjectCount?.(entry.sourceSkillKey) ?? 1
            : null;
        const didApply = entry.evolvedSkillKey
            ? player.replaceSkill(entry.sourceSkillKey, entry.evolvedSkillKey)
            : player.unlockSkill(entry.unlockSkillKey, { ignoreCap: true });
        if (!didApply) return false;

        const evolvedOverrides = {
            ...(entry.evolvedSkillOverrides ?? {})
        };
        if (lockedObjectCount !== null) {
            evolvedOverrides.defaultObjects = lockedObjectCount;
            evolvedOverrides.maxObjects = lockedObjectCount;
        }
        if (Object.keys(evolvedOverrides).length) {
            player.setSkillRuntimeOverrides?.(targetSkillKey, evolvedOverrides);
        }
        if (entry.evolvedSkillKey) {
            this.renameInventoryEntry(entry);
        }
        this.pendingEliteKillRequirements.delete(entry.key ?? `${entry.sourceSkillKey}->${targetSkillKey}`);
        this.showEvolutionAnnouncement(entry);
        return true;
    }

    renameInventoryEntry(entry) {
        const inventoryKey = entry.renameInventoryKey ?? entry.inventoryKey ?? entry.sourceSkillKey;
        const inventoryEntry = this.scene.inventoryItems?.find((item) => item.inventoryKey === inventoryKey);
        if (!inventoryEntry) return;
        inventoryEntry.name = SKILL_CONFIG[entry.evolvedSkillKey]?.label ?? inventoryEntry.name;
    }

    showEvolutionAnnouncement(entry) {
        const fromLabel = SKILL_CONFIG[entry.sourceSkillKey]?.label ?? entry.sourceSkillKey;
        const targetSkillKey = entry.evolvedSkillKey ?? entry.unlockSkillKey;
        const toLabel = SKILL_CONFIG[targetSkillKey]?.label ?? targetSkillKey;
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
