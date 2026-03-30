import { SKILL_CONFIG } from '../config/skill.js';
import { HIDDEN_SKILL_UNLOCK_CONFIG } from '../config/hiddenSkillUnlocks.js';

export default class HiddenSkillUnlockSystem {
    constructor(scene) {
        this.scene = scene;
        this.completedUnlockKeys = new Set();
        this.killAnchors = new Map();
    }

    process() {
        this.applyLockedStates();
        const unlocks = this.getEligibleUnlocks();
        unlocks.forEach((entry) => this.applyUnlock(entry));
        return unlocks;
    }

    applyLockedStates() {
        const scene = this.scene;
        const player = scene?.player;
        if (!scene || !player) return;

        HIDDEN_SKILL_UNLOCK_CONFIG.forEach((entry) => {
            if (entry.kind !== 'unlockFeature' || !entry.skillKey) return;
            const shouldLock = !this.completedUnlockKeys.has(entry.key) && player.hasSkill?.(entry.skillKey);
            if (shouldLock) {
                player.setHiddenSkillFeatureOverride?.(entry.skillKey, entry.key, entry.lockedOverrides ?? {});
            } else {
                player.clearHiddenSkillFeatureOverride?.(entry.skillKey, entry.key);
            }
        });
    }

    getEligibleUnlocks() {
        const scene = this.scene;
        const player = scene?.player;
        if (!scene || !player) return [];

        const activeSkillKeys = Array.isArray(scene.activeSkillKeys) ? scene.activeSkillKeys : [];
        const inventoryItemLevels = scene.inventoryItemLevels ?? {};
        const killCount = scene.killCount ?? 0;
        const characterKey = scene.activeCharacterKey ?? player.characterKey;
        const defaultSkillKey = player.getDefaultSkillKey?.() ?? null;
        const level = player.level ?? 1;

        return HIDDEN_SKILL_UNLOCK_CONFIG.filter((entry) => {
            if (!entry?.key || this.completedUnlockKeys.has(entry.key)) return false;
            const targetSkillKey = entry.targetSkillKey ?? entry.skillKey ?? null;
            if (targetSkillKey && !SKILL_CONFIG[targetSkillKey]) return false;
            if (entry.characterKey && entry.characterKey !== characterKey) return false;
            if (typeof entry.requiredKills === 'number') {
                let effectiveKillCount = killCount;
                if (entry.requiredKillsFromSkillKey) {
                    if (!player.hasSkill?.(entry.requiredKillsFromSkillKey)) {
                        this.killAnchors.delete(entry.key);
                        return false;
                    }
                    if (!this.killAnchors.has(entry.key)) {
                        this.killAnchors.set(entry.key, killCount);
                    }
                    effectiveKillCount = Math.max(0, killCount - (this.killAnchors.get(entry.key) ?? killCount));
                }
                if (effectiveKillCount < Math.max(1, entry.requiredKills)) return false;
            }
            if (typeof entry.requiredLevel === 'number' && level < Math.max(1, entry.requiredLevel)) return false;
            if (entry.inventoryKey || entry.requiredItemLevel !== undefined) {
                const requiredInventoryKey = entry.inventoryKey ?? targetSkillKey;
                const requiredItemLevel = Math.max(1, entry.requiredItemLevel ?? 1);
                if ((inventoryItemLevels[requiredInventoryKey] ?? 0) < requiredItemLevel) return false;
            }
            if (entry.requiredSkillKey && !player.hasSkill?.(entry.requiredSkillKey)) return false;
            if (Array.isArray(entry.requiredAnySkillKeys) && entry.requiredAnySkillKeys.length) {
                const hasAnySkill = entry.requiredAnySkillKeys.some((skillKey) => player.hasSkill?.(skillKey));
                if (!hasAnySkill) return false;
            }

            switch (entry.kind) {
                case 'replaceSkill':
                    if (!entry.sourceSkillKey || !entry.targetSkillKey) return false;
                    if (!activeSkillKeys.includes(entry.sourceSkillKey)) return false;
                    if (activeSkillKeys.includes(entry.targetSkillKey)) return false;
                    if (entry.onlyDefaultSkill && defaultSkillKey !== entry.sourceSkillKey) return false;
                    return true;
                case 'unlockSkill':
                    if (!entry.targetSkillKey) return false;
                    return !player.hasSkill?.(entry.targetSkillKey);
                case 'unlockFeature':
                    return Boolean(entry.skillKey && player.hasSkill?.(entry.skillKey));
                default:
                    return false;
            }
        });
    }

    applyUnlock(entry) {
        const scene = this.scene;
        const player = scene?.player;
        if (!scene || !player) return false;

        let didApply = false;
        if (entry.kind === 'replaceSkill') {
            didApply = player.replaceSkill(entry.sourceSkillKey, entry.targetSkillKey);
        } else if (entry.kind === 'unlockSkill') {
            didApply = player.unlockSkill(entry.targetSkillKey, { ignoreCap: entry.ignoreCap === true });
        } else if (entry.kind === 'unlockFeature') {
            player.clearHiddenSkillFeatureOverride?.(entry.skillKey, entry.key);
            didApply = true;
        }

        if (!didApply) return false;
        this.completedUnlockKeys.add(entry.key);
        this.killAnchors.delete(entry.key);
        this.showAnnouncement(entry);
        return true;
    }

    showAnnouncement(entry) {
        const sourceKey = entry.sourceSkillKey ?? entry.skillKey ?? null;
        const targetKey = entry.targetSkillKey ?? entry.label ?? null;
        const fromLabel = sourceKey ? (SKILL_CONFIG[sourceKey]?.label ?? sourceKey) : 'Hidden';
        const toLabel = entry.label ?? (targetKey ? (SKILL_CONFIG[targetKey]?.label ?? targetKey) : 'Unlocked');
        const x = this.scene.player?.x ?? this.scene.scale.width / 2;
        const y = (this.scene.player?.y ?? this.scene.scale.height / 2) - 42;
        const text = this.scene.add.text(x, y, `${fromLabel} -> ${toLabel}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#9ee7ff',
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
