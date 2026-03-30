import { CARD_CONFIG } from '../../config/card.js';
import { SKILL_CONFIG } from '../../config/skill.js';
import { SKILL_EVOLUTION_CONFIG } from '../../config/skillEvolution.js';
import { HIDDEN_SKILL_UNLOCK_CONFIG } from '../../config/hiddenSkillUnlocks.js';

function getSkillKeyForInventoryItem(item) {
    const inventoryKey = item?.inventoryKey ?? null;
    if (!inventoryKey) return null;
    const match = CARD_CONFIG.find((card) => {
        if (card?.cardType !== 'skill') return false;
        if ((card.inventoryKey ?? card.key) !== inventoryKey) return false;
        const effects = Array.isArray(card.effects) ? card.effects : [];
        return effects.some((effect) => effect?.type === 'skillUnlock' || effect?.type === 'skillUnlockIgnoreCap');
    });
    const unlockEffect = match?.effects?.find((effect) => effect?.type === 'skillUnlock' || effect?.type === 'skillUnlockIgnoreCap');
    return unlockEffect?.skillKey ?? null;
}

function getInventoryItemLabel(inventoryKey) {
    if (!inventoryKey) return 'Item';
    const match = CARD_CONFIG.find((card) => (card?.inventoryKey ?? card?.key) === inventoryKey);
    return match?.inventoryName ?? match?.name ?? inventoryKey;
}

function resolveCurrentSkillKeyForInventoryItem(item, activeSkillKeys = []) {
    const baseSkillKey = getSkillKeyForInventoryItem(item);
    if (!baseSkillKey) return null;

    let currentSkillKey = baseSkillKey;
    let advanced = true;
    while (advanced) {
        advanced = false;

        SKILL_EVOLUTION_CONFIG.forEach((entry) => {
            const targetSkillKey = entry.evolvedSkillKey ?? entry.unlockSkillKey;
            if (!targetSkillKey) return;
            if (entry.sourceSkillKey !== currentSkillKey) return;
            if (!activeSkillKeys.includes(targetSkillKey)) return;
            currentSkillKey = targetSkillKey;
            advanced = true;
        });

        HIDDEN_SKILL_UNLOCK_CONFIG.forEach((entry) => {
            if (entry.kind !== 'replaceSkill') return;
            if (entry.sourceSkillKey !== currentSkillKey) return;
            if (!activeSkillKeys.includes(entry.targetSkillKey)) return;
            currentSkillKey = entry.targetSkillKey;
            advanced = true;
        });
    }

    return currentSkillKey;
}

function buildProgressEntries(hudScene, item) {
    const scene = hudScene.mainScene;
    const player = scene?.player;
    if (!scene || !player || !item) return [];

    const inventoryKey = item.inventoryKey ?? null;
    const activeSkillKeys = Array.isArray(scene.activeSkillKeys) ? scene.activeSkillKeys : [];
    const skillKey = resolveCurrentSkillKeyForInventoryItem(item, activeSkillKeys);
    const inventoryLevels = scene.inventoryItemLevels ?? {};
    const skillObjectSpawnCounts = scene.skillObjectSpawnCounts ?? {};
    const skillHitCounts = scene.skillHitCounts ?? {};
    const totalMovedDistance = scene.totalMovedDistance ?? 0;
    const evolutionSystem = scene.skillEvolutionSystem;
    const hiddenSystem = scene.hiddenSkillUnlockSystem;
    const completedHidden = hiddenSystem?.completedUnlockKeys ?? new Set();
    const pendingElite = evolutionSystem?.pendingEliteKillRequirements ?? new Map();
    const killAnchors = hiddenSystem?.killAnchors ?? new Map();
    const skillHitAnchors = hiddenSystem?.skillHitAnchors ?? new Map();
    const killCount = scene.killCount ?? 0;
    const eliteKillCount = scene.eliteKillCount ?? 0;

    const entries = [];
    const pushEntry = (title, lines = [], completed = false) => {
        entries.push({ title, lines, completed });
    };

    SKILL_EVOLUTION_CONFIG.forEach((entry) => {
        const targetSkillKey = entry.evolvedSkillKey ?? entry.unlockSkillKey;
        const relatesToItem = inventoryKey && (
            entry.inventoryKey === inventoryKey
            || entry.renameInventoryKey === inventoryKey
        );
        const relatesToSkill = skillKey && (
            entry.sourceSkillKey === skillKey
            || targetSkillKey === skillKey
        );
        if (!relatesToItem && !relatesToSkill) return;

        const requirementKey = entry.key ?? `${entry.sourceSkillKey}->${targetSkillKey}`;
        const completed = activeSkillKeys.includes(targetSkillKey);
        if (completed) return;
        if (entry.sourceSkillKey && !activeSkillKeys.includes(entry.sourceSkillKey)) return;

        const lines = [];
        if (entry.requiredLevel !== undefined) {
            const requiredInventoryKey = entry.inventoryKey ?? entry.sourceSkillKey;
            const requiredLevel = Math.max(1, entry.requiredLevel);
            const currentLevel = inventoryLevels[requiredInventoryKey] ?? 0;
            lines.push(`${getInventoryItemLabel(requiredInventoryKey)} Lv ${Math.min(currentLevel, requiredLevel)}/${requiredLevel}`);
        }
        if (typeof entry.requiredKills === 'number') {
            lines.push(`Kill ${Math.min(killCount, entry.requiredKills)}/${entry.requiredKills}`);
        }
        if (typeof entry.requiredSkillObjectSpawns === 'number') {
            const progress = skillObjectSpawnCounts[entry.sourceSkillKey] ?? 0;
            lines.push(`Card ${Math.min(progress, entry.requiredSkillObjectSpawns)}/${entry.requiredSkillObjectSpawns}`);
        }
        if (typeof entry.requiredSkillHits === 'number') {
            const progress = skillHitCounts[entry.sourceSkillKey] ?? 0;
            lines.push(`Hit ${Math.min(progress, entry.requiredSkillHits)}/${entry.requiredSkillHits}`);
        }
        if (typeof entry.requiredEliteKillsAfterReady === 'number') {
            const armedAt = pendingElite.get(requirementKey);
            const progress = armedAt === undefined ? 0 : Math.max(0, eliteKillCount - armedAt);
            lines.push(`Elite ${Math.min(progress, entry.requiredEliteKillsAfterReady)}/${entry.requiredEliteKillsAfterReady}`);
        }
        pushEntry('Evolution Progress', lines, completed);
    });

    HIDDEN_SKILL_UNLOCK_CONFIG.forEach((entry) => {
        const targetSkillKey = entry.targetSkillKey ?? entry.skillKey ?? null;
        const relatesToItem = inventoryKey && entry.inventoryKey === inventoryKey;
        const relatesToSkill = skillKey && (
            entry.sourceSkillKey === skillKey
            || targetSkillKey === skillKey
            || entry.requiredKillsFromSkillKey === skillKey
            || entry.requiredHitsFromSkillKey === skillKey
            || entry.requiredSkillKey === skillKey
            || entry.requiredAnySkillKeys?.includes(skillKey)
        );
        if (!relatesToItem && !relatesToSkill) return;

        const completed = completedHidden.has(entry.key);
        if (completed) return;
        if (entry.sourceSkillKey && !activeSkillKeys.includes(entry.sourceSkillKey)) return;
        if (entry.requiredSkillKey && !player.hasSkill?.(entry.requiredSkillKey)) return;
        if (Array.isArray(entry.requiredAnySkillKeys) && entry.requiredAnySkillKeys.length) {
            const hasAnySkill = entry.requiredAnySkillKeys.some((key) => player.hasSkill?.(key));
            if (!hasAnySkill) return;
        }

        const lines = [];
        if (typeof entry.requiredKills === 'number') {
            let progress = killCount;
            if (entry.requiredKillsFromSkillKey) {
                const anchor = killAnchors.get(entry.key) ?? killCount;
                progress = Math.max(0, killCount - anchor);
            }
            lines.push(`Kill ${Math.min(progress, entry.requiredKills)}/${entry.requiredKills}`);
        }
        if (typeof entry.requiredLevel === 'number') {
            const level = player.level ?? 1;
            lines.push(`Player Lv ${Math.min(level, entry.requiredLevel)}/${entry.requiredLevel}`);
        }
        if (entry.inventoryKey || entry.requiredItemLevel !== undefined) {
            const requiredInventoryKey = entry.inventoryKey ?? targetSkillKey;
            const requiredItemLevel = Math.max(1, entry.requiredItemLevel ?? 1);
            const currentLevel = inventoryLevels[requiredInventoryKey] ?? 0;
            lines.push(`${getInventoryItemLabel(requiredInventoryKey)} Lv ${Math.min(currentLevel, requiredItemLevel)}/${requiredItemLevel}`);
        }
        if (typeof entry.requiredSkillHits === 'number') {
            const sourceSkillKey = entry.requiredHitsFromSkillKey ?? entry.requiredSkillKey ?? skillKey;
            let progress = skillHitCounts[sourceSkillKey] ?? 0;
            if (entry.requiredHitsFromSkillKey) {
                const anchor = skillHitAnchors.get(entry.key) ?? progress;
                progress = Math.max(0, progress - anchor);
            }
            lines.push(`Hit ${Math.min(progress, entry.requiredSkillHits)}/${entry.requiredSkillHits}`);
        }
        if (typeof entry.requiredMovedDistance === 'number') {
            lines.push(`Move ${Math.floor(Math.min(totalMovedDistance, entry.requiredMovedDistance))}/${entry.requiredMovedDistance}`);
        }
        pushEntry('Evolution Progress', lines, completed);
    });

    return entries.slice(0, 1);
}

export function hideInventoryEvolutionPreview(hudScene) {
    hudScene.inventoryPreviewContainer?.destroy(true);
    hudScene.inventoryPreviewContainer = null;
    hudScene.inventoryPreviewPanel = null;
    hudScene.inventoryPreviewIcon = null;
    hudScene.inventoryPreviewTitle = null;
    hudScene.inventoryPreviewLevel = null;
    hudScene.inventoryPreviewLines = [];
    hudScene.inventoryPreviewItemKey = null;
}

export function layoutInventoryEvolutionPreview(hudScene) {
    if (!hudScene.inventoryPreviewContainer || !hudScene.inventoryExpanded) return;
    hudScene.inventoryPreviewContainer.setPosition(hudScene.scale.width / 2, hudScene.scale.height / 2);
}

export function showInventoryEvolutionPreview(hudScene, item) {
    if (!item) return;
    const progressEntries = buildProgressEntries(hudScene, item);
    const width = hudScene.scale.width;
    const height = hudScene.scale.height;
    const panelWidth = Math.min(340, width - 32);
    const lineHeight = 18;
    const headerHeight = 88;
    const bodyLineCount = Math.max(1, progressEntries.reduce((sum, entry) => sum + 1 + entry.lines.length, 0));
    const panelHeight = Math.min(height - 48, headerHeight + bodyLineCount * lineHeight + 28);

    hudScene.inventoryPreviewContainer?.destroy(true);
    hudScene.inventoryPreviewLines = [];
    hudScene.inventoryPreviewItemKey = item.inventoryKey;

    const textureKey = hudScene.textures.exists(`card_icon_${item.cardKey}`)
        ? `card_icon_${item.cardKey}`
        : '__missing_texture__';

    const container = hudScene.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(1302);
    const panel = hudScene.add.rectangle(0, 0, panelWidth, panelHeight, 0x15110e, 0.97)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0x9d7c49, 1);
    const icon = hudScene.add.image(-panelWidth / 2 + 30, -panelHeight / 2 + 30, textureKey)
        .setOrigin(0.5)
        .setDisplaySize(34, 34);
    const title = hudScene.add.text(-panelWidth / 2 + 58, -panelHeight / 2 + 16, item.name ?? item.inventoryKey, {
        fontSize: '16px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: '#fff1c7',
        stroke: '#000000',
        strokeThickness: 3,
        wordWrap: { width: panelWidth - 90 }
    }).setOrigin(0, 0);
    const level = hudScene.add.text(-panelWidth / 2 + 58, -panelHeight / 2 + 42, `Lv ${item.level ?? 1}`, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#cfd6dc',
        stroke: '#000000',
        strokeThickness: 2
    }).setOrigin(0, 0);

    container.add([panel, icon, title, level]);

    let textY = -panelHeight / 2 + 72;
    if (!progressEntries.length) {
        const emptyText = hudScene.add.text(-panelWidth / 2 + 16, textY, 'No evolution progress for this item.', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#c8c0b8',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: panelWidth - 32 }
        }).setOrigin(0, 0);
        hudScene.inventoryPreviewLines.push(emptyText);
        container.add(emptyText);
    } else {
        progressEntries.forEach((entry) => {
            const titleText = hudScene.add.text(-panelWidth / 2 + 16, textY, entry.title, {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#ffe0a3',
                stroke: '#000000',
                strokeThickness: 2,
                wordWrap: { width: panelWidth - 32 }
            }).setOrigin(0, 0);
            container.add(titleText);
            hudScene.inventoryPreviewLines.push(titleText);
            textY += lineHeight;

            entry.lines.forEach((line) => {
                const lineText = hudScene.add.text(-panelWidth / 2 + 24, textY, line, {
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#d7dbe0',
                    stroke: '#000000',
                    strokeThickness: 2,
                    wordWrap: { width: panelWidth - 40 }
                }).setOrigin(0, 0);
                container.add(lineText);
                hudScene.inventoryPreviewLines.push(lineText);
                textY += lineHeight;
            });

            textY += 4;
        });
    }

    hudScene.inventoryPreviewContainer = container;
    hudScene.inventoryPreviewPanel = panel;
    hudScene.inventoryPreviewIcon = icon;
    hudScene.inventoryPreviewTitle = title;
    hudScene.inventoryPreviewLevel = level;
    layoutInventoryEvolutionPreview(hudScene);
}

export function toggleInventoryEvolutionPreview(hudScene, item) {
    if (!item?.inventoryKey) return;
    if (hudScene.inventoryPreviewItemKey === item.inventoryKey && hudScene.inventoryPreviewContainer?.visible) {
        hideInventoryEvolutionPreview(hudScene);
        return;
    }
    showInventoryEvolutionPreview(hudScene, item);
}

export function syncInventoryEvolutionPreview(hudScene, items = []) {
    if (!hudScene.inventoryPreviewItemKey) return;
    const previewItem = items.find((item) => item?.inventoryKey === hudScene.inventoryPreviewItemKey);
    if (previewItem) {
        showInventoryEvolutionPreview(hudScene, previewItem);
        return;
    }
    hideInventoryEvolutionPreview(hudScene);
}
