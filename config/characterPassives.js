const WEREWOLF_LOW_HEALTH_THRESHOLD = 0.5;
const WEREWOLF_LOW_HEALTH_ATTACK_SPEED_MULTIPLIER = 1.15;
const WEREWOLF_LOW_HEALTH_SPEED_BONUS = 10;
const WEREWOLF_LOW_HEALTH_LIFESTEAL_BONUS = 0.08;
const WEREWOLF_BLEED_HIT_HEAL_RATIO = 0.015;
const WEREWOLF_BLOODLUST_EMBER_TINTS = Object.freeze([0xff3b3b, 0xff7a2f, 0xffcf7a]);

function ensurePassiveState(player) {
    player.characterPassiveState = player.characterPassiveState ?? {};
    return player.characterPassiveState;
}

function destroyWerewolfBloodlustAura(werewolfState) {
    if (!werewolfState) return;
    werewolfState.bloodlustEmberEvent?.remove?.();
    werewolfState.bloodlustEmberEvent = null;
}

function ensureWerewolfBloodlustAura(player, werewolfState) {
    const scene = player?.scene;
    if (!scene?.add || !scene?.tweens) return;
    if (werewolfState.bloodlustEmberEvent?.getProgress) return;

    const spawnEmbers = () => {
        if (!player?.active || player?.isDead) return;
        const baseHeight = Math.max(18, Math.round((player.baseHeight ?? player.displayHeight ?? 30) * 0.55));
        const originX = player.x;
        const originY = player.y - baseHeight * 0.25;
        const emberCount = 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < emberCount; i += 1) {
            const tint = Phaser.Utils.Array.GetRandom(WEREWOLF_BLOODLUST_EMBER_TINTS);
            const ember = scene.add.circle(
                originX + Phaser.Math.Between(-10, 10),
                originY + Phaser.Math.Between(-6, 6),
                Phaser.Math.Between(2, 4),
                tint,
                0.32
            );
            ember.setBlendMode(Phaser.BlendModes.ADD);
            ember.setDepth((player.depth ?? 0) + 1);

            scene.tweens.add({
                targets: ember,
                y: ember.y - Phaser.Math.Between(18, 30),
                x: ember.x + Phaser.Math.Between(-6, 6),
                alpha: 0,
                scaleX: { from: 1, to: 1.8 },
                scaleY: { from: 1, to: 1.8 },
                duration: Phaser.Math.Between(280, 420),
                ease: 'Cubic.easeOut',
                onComplete: () => ember.destroy()
            });
        }
    };

    werewolfState.bloodlustEmberEvent = scene.time?.addEvent?.({
        delay: 90,
        loop: true,
        callback: spawnEmbers
    }) ?? null;
}

function updateWerewolfPassiveState(player) {
    if (!player) return;
    const passiveState = ensurePassiveState(player);
    const maxHealth = Math.max(1, player.maxHealth ?? 1);
    const healthRatio = Phaser.Math.Clamp((player.health ?? maxHealth) / maxHealth, 0, 1);
    const shouldBeActive = healthRatio < WEREWOLF_LOW_HEALTH_THRESHOLD;
    const werewolfState = passiveState.werewolf ?? {
        lowHealthActive: false,
        appliedLifestealBonus: 0,
        appliedSpeedBonus: 0,
        bloodlustEmberEvent: null
    };
    passiveState.werewolf = werewolfState;
    if (werewolfState.lowHealthActive === shouldBeActive) return;
    werewolfState.lowHealthActive = shouldBeActive;

    if (shouldBeActive) {
        player.attackSpeedMultiplier = Math.max(
            0.1,
            (player.attackSpeedMultiplier ?? 1) * WEREWOLF_LOW_HEALTH_ATTACK_SPEED_MULTIPLIER
        );
        werewolfState.appliedSpeedBonus = WEREWOLF_LOW_HEALTH_SPEED_BONUS;
        player.bonusSpeedFlat += werewolfState.appliedSpeedBonus;
        werewolfState.appliedLifestealBonus = WEREWOLF_LOW_HEALTH_LIFESTEAL_BONUS;
        player.lifesteal = Math.max(0, (player.lifesteal ?? 0) + werewolfState.appliedLifestealBonus);
        player.updateSpeedFromConfig?.();
        ensureWerewolfBloodlustAura(player, werewolfState);
        return;
    }

    destroyWerewolfBloodlustAura(werewolfState);
    player.attackSpeedMultiplier = Math.max(
        0.1,
        (player.attackSpeedMultiplier ?? 1) / WEREWOLF_LOW_HEALTH_ATTACK_SPEED_MULTIPLIER
    );
    if (werewolfState.appliedSpeedBonus !== 0) {
        player.bonusSpeedFlat -= werewolfState.appliedSpeedBonus;
        werewolfState.appliedSpeedBonus = 0;
        player.updateSpeedFromConfig?.();
    }
    if (werewolfState.appliedLifestealBonus !== 0) {
        player.lifesteal = Math.max(0, (player.lifesteal ?? 0) - werewolfState.appliedLifestealBonus);
        werewolfState.appliedLifestealBonus = 0;
    }
}

const CHARACTER_PASSIVES = {
    werewolf: {
        onUpdate(player) {
            updateWerewolfPassiveState(player);
            const werewolfState = ensurePassiveState(player).werewolf ?? null;
            if (!werewolfState) return;
            if (!player?.active || player?.isDead) {
                destroyWerewolfBloodlustAura(werewolfState);
                return;
            }
            if (werewolfState.lowHealthActive) {
                ensureWerewolfBloodlustAura(player, werewolfState);
                return;
            }
            destroyWerewolfBloodlustAura(werewolfState);
        },
        onTakeDamage(player) {
            updateWerewolfPassiveState(player);
        },
        onHeal(player) {
            updateWerewolfPassiveState(player);
        },
        onCharacterSet(player) {
            const previous = ensurePassiveState(player).werewolf ?? null;
            if (previous) {
                destroyWerewolfBloodlustAura(previous);
            }
            ensurePassiveState(player).werewolf = {
                lowHealthActive: false,
                appliedLifestealBonus: 0,
                appliedSpeedBonus: 0,
                bloodlustEmberEvent: null
            };
            updateWerewolfPassiveState(player);
        },
        onSyncLevelGrowth(player) {
            updateWerewolfPassiveState(player);
        },
        onHitDealt(player, event = {}) {
            const target = event.target ?? null;
            if (!target?.active || target?.isDead) return;
            const damageTaken = Math.max(0, Number(event.damageTaken ?? event.damage ?? 0) || 0);
            if (damageTaken <= 0) return;
            if (!target?.statusEffects?.hasEffect?.('bleed')) return;
            const healAmount = Math.max(1, Math.round((player.maxHealth ?? 1) * WEREWOLF_BLEED_HIT_HEAL_RATIO));
            player.heal?.(healAmount);
        }
    }
};

export function getCharacterPassive(characterKey) {
    if (!characterKey) return null;
    return CHARACTER_PASSIVES[characterKey] ?? null;
}
