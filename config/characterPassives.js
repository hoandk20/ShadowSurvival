const WEREWOLF_LOW_HEALTH_THRESHOLD = 0.5;
const WEREWOLF_LOW_HEALTH_ATTACK_SPEED_MULTIPLIER = 1.15;
const WEREWOLF_LOW_HEALTH_SPEED_BONUS = 10;
const WEREWOLF_LOW_HEALTH_LIFESTEAL_BONUS = 0.08;
const WEREWOLF_BLEED_HIT_HEAL_RATIO = 0.015;
const WEREWOLF_BLOODLUST_EMBER_TINTS = Object.freeze([0xff3b3b, 0xff7a2f, 0xffcf7a]);
const AQUA_TIDAL_MAX_STACKS = 5;
const AQUA_TIDAL_AREA_PER_STACK = 0.04;
const AQUA_TIDAL_PROJECTILE_SPEED_PER_STACK = 0.03;
const AQUA_SPLASH_BURST_RADIUS = 68;
const AQUA_SPLASH_BURST_DAMAGE_RATIO = 0.5;
const AQUA_SPLASH_BURST_FREEZE_DURATION_MS = 700;
const ASSASIN_PHANTOM_SLASH_DAMAGE_RATIO = 0.35;
const ASSASIN_PHANTOM_SLASH_COOLDOWN_MS = 700;
const ASSASIN_PHANTOM_SLASH_SEARCH_RADIUS = 84;

function findAssasinPhantomSlashTarget(player, primaryTarget) {
    const scene = player?.scene;
    const enemies = scene?.enemies?.getChildren?.() ?? [];
    const radiusSq = ASSASIN_PHANTOM_SLASH_SEARCH_RADIUS * ASSASIN_PHANTOM_SLASH_SEARCH_RADIUS;
    let nearestOther = null;
    let nearestOtherDistanceSq = Number.POSITIVE_INFINITY;

    enemies.forEach((enemy) => {
        if (!enemy?.active || enemy.isDead) return;
        const dx = enemy.x - primaryTarget.x;
        const dy = enemy.y - primaryTarget.y;
        const distanceSq = (dx * dx) + (dy * dy);
        if (distanceSq > radiusSq) return;
        if (enemy === primaryTarget) return;
        if (distanceSq >= nearestOtherDistanceSq) return;
        nearestOther = enemy;
        nearestOtherDistanceSq = distanceSq;
    });

    return nearestOther ?? primaryTarget ?? null;
}

function triggerAssasinPhantomSlash(player, event = {}) {
    const scene = player?.scene;
    const target = event.target ?? null;
    const source = event.source ?? null;
    if (!scene?.statusEffectSystem || !target?.active || target?.isDead || !source) return;

    const phantomTarget = findAssasinPhantomSlashTarget(player, target);
    if (!phantomTarget?.active || phantomTarget?.isDead) return;

    const damage = Math.max(
        1,
        Math.round((event.damageTaken ?? event.damage ?? source.baseDamage ?? 1) * ASSASIN_PHANTOM_SLASH_DAMAGE_RATIO)
    );
    const direction = new Phaser.Math.Vector2(phantomTarget.x - player.x, phantomTarget.y - player.y);
    if (direction.lengthSq() === 0) {
        direction.set(player.flipX ? -1 : 1, 0);
    } else {
        direction.normalize();
    }

    const ambushOffset = 20;
    const spawnX = phantomTarget.x + (direction.x * ambushOffset);
    const spawnY = phantomTarget.y + (direction.y * ambushOffset);
    const strikeX = phantomTarget.x - (direction.x * 18);
    const strikeY = phantomTarget.y - (direction.y * 18);
    const slashVector = new Phaser.Math.Vector2(strikeX - spawnX, strikeY - spawnY);
    if (slashVector.lengthSq() > 0) {
        slashVector.normalize();
    } else {
        slashVector.set(direction.x === 0 ? 1 : direction.x, direction.y);
    }

    const effectDepth = Math.max(phantomTarget.depth ?? 0, player.depth ?? 0, 20) + 8;
    const shadow = scene.add.sprite(
        spawnX,
        spawnY,
        player.texture?.key ?? source.texture?.key,
        player.frame?.name ?? source.frame?.name ?? null
    );
    shadow.setDepth(effectDepth);
    shadow.setOrigin(player.originX ?? 0.5, player.originY ?? 0.5);
    shadow.setFlipX(Boolean(slashVector.x < 0));
    shadow.setFlipY(Boolean(player.flipY));
    shadow.setDisplaySize(
        player.displayWidth || player.width || 20,
        player.displayHeight || player.height || 22
    );
    shadow.setTint(0xffffff);
    shadow.setAlpha(0.98);
    shadow.setBlendMode(Phaser.BlendModes.ADD);

    const pulse = scene.add.circle(phantomTarget.x, phantomTarget.y, 10, 0xdde7ff, 0.18);
    pulse.setDepth(effectDepth - 1);
    pulse.setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
        targets: shadow,
        x: strikeX,
        y: strikeY,
        alpha: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 260,
        ease: 'Cubic.easeIn',
        onComplete: () => shadow.destroy()
    });
    scene.tweens.add({
        targets: pulse,
        alpha: 0,
        scaleX: 1.7,
        scaleY: 1.7,
        duration: 260,
        ease: 'Cubic.easeOut',
        onComplete: () => pulse.destroy()
    });

    player.spawnMeleeHitEffect?.(phantomTarget, { direction: slashVector, skill: source });
    scene.statusEffectSystem.applyOwnedDamage(phantomTarget, damage, {
        source,
        sourceOwner: player,
        ownerPlayerId: player.playerId,
        ownerSkillKey: source.skillType ?? event.source?.ownerSkillKey ?? null,
        direction: slashVector,
        force: 0,
        tags: ['melee', 'phantom_slash', 'assasin'],
        showDamageText: true,
        damageTextColor: '#dfe6ff',
        damageTextFontSize: '7px'
    });
}

function isAquaWaterSkill(player, skillKey = null) {
    if (!player || !skillKey) return false;
    const skillConfig = player.getSkillConfig?.(skillKey) ?? null;
    const tags = Array.isArray(skillConfig?.tags) ? skillConfig.tags : [];
    return tags.includes('water');
}

function ensureAquaPassiveState(player) {
    const passiveState = ensurePassiveState(player);
    const aquaState = passiveState.aqua ?? {
        flowStacks: 0,
        burstReady: false,
        burstArmed: false,
        armedCastToken: null,
        stackLabel: null
    };
    passiveState.aqua = aquaState;
    return aquaState;
}

function destroyAquaStackLabel(aquaState) {
    aquaState?.stackLabel?.destroy?.();
    if (aquaState) {
        aquaState.stackLabel = null;
    }
}

function ensureAquaStackLabel(player) {
    const scene = player?.scene;
    if (!scene?.add) return null;
    const aquaState = ensureAquaPassiveState(player);
    if (aquaState.stackLabel?.active) return aquaState.stackLabel;
    aquaState.stackLabel = scene.add.text(player.x, player.y, '', {
        fontSize: '5px',
        fontFamily: '"Press Start 2P", "PixelFont", monospace',
        color: '#d9fbff',
        stroke: '#000000',
        strokeThickness: 3,
        resolution: 2,
        align: 'center'
    })
        .setOrigin(0.5)
        .setDepth((player.depth ?? 0) + 210)
        .setVisible(false);
    return aquaState.stackLabel;
}

function updateAquaStackLabel(player) {
    const aquaState = ensureAquaPassiveState(player);
    const label = ensureAquaStackLabel(player);
    if (!label) return;
    if (!player?.active || player?.isDead) {
        label.setVisible(false);
        return;
    }

    const stacks = Phaser.Math.Clamp(aquaState.flowStacks ?? 0, 0, AQUA_TIDAL_MAX_STACKS);
    if (stacks <= 0) {
        label.setVisible(false);
        return;
    }

    const baseOffsetY = Math.max(player.displayHeight ?? player.height ?? 0, player.body?.height ?? 0) * 0.5 + 10;
    label
        .setPosition(player.x, player.y - baseOffsetY)
        .setText(`${stacks}`)
        .setColor(stacks >= AQUA_TIDAL_MAX_STACKS ? '#ff6b6b' : '#d9fbff')
        .setVisible(true)
        .setDepth((player.depth ?? 0) + 210);
}

function syncAquaPassiveBonuses(player) {
    const aquaState = ensureAquaPassiveState(player);
    const flowStacks = Phaser.Math.Clamp(aquaState.flowStacks ?? 0, 0, AQUA_TIDAL_MAX_STACKS);
    aquaState.flowStacks = flowStacks;
    player.characterPassiveAreaMultiplier = 1 + flowStacks * AQUA_TIDAL_AREA_PER_STACK;
    player.characterPassiveProjectileSpeedMultiplier = 1 + flowStacks * AQUA_TIDAL_PROJECTILE_SPEED_PER_STACK;
    aquaState.burstReady = flowStacks >= AQUA_TIDAL_MAX_STACKS && !aquaState.burstArmed;
}

function setAquaFlowStacks(player, nextStacks, options = {}) {
    const aquaState = ensureAquaPassiveState(player);
    const previousStacks = aquaState.flowStacks ?? 0;
    aquaState.flowStacks = Phaser.Math.Clamp(nextStacks, 0, AQUA_TIDAL_MAX_STACKS);
    syncAquaPassiveBonuses(player);
    if (options.showText !== true || previousStacks === aquaState.flowStacks) return;
}

function triggerAquaSplashBurst(player, event = {}) {
    const scene = player?.scene;
    const target = event.target ?? null;
    if (!scene?.statusEffectSystem || !target?.active || target?.isDead) return;

    const source = event.source ?? null;
    const sourceSkillKey = source?.skillType ?? source?.ownerSkillKey ?? null;
    const baseDamage = Math.max(
        1,
        Math.round((event.damageTaken ?? event.damage ?? player.getStatusEffectDamageSnapshot?.(sourceSkillKey) ?? 1) * AQUA_SPLASH_BURST_DAMAGE_RATIO)
    );
    const enemies = scene.enemies?.getChildren?.() ?? [];
    const radiusSq = AQUA_SPLASH_BURST_RADIUS * AQUA_SPLASH_BURST_RADIUS;
    const attackTags = Array.from(new Set([...(event.attackTags ?? []), 'water', 'splash_burst', 'tidal_flow']));

    const pulse = scene.add.circle(target.x, target.y, Math.max(12, AQUA_SPLASH_BURST_RADIUS * 0.3), 0x66dbff, 0.32);
    pulse.setDepth(Math.max(target.depth ?? 0, 35) + 3);
    pulse.setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
        targets: pulse,
        radius: AQUA_SPLASH_BURST_RADIUS,
        alpha: 0,
        duration: 180,
        ease: 'Cubic.easeOut',
        onComplete: () => pulse.destroy()
    });

    enemies.forEach((enemy) => {
        if (!enemy?.active || enemy.isDead) return;
        const dx = enemy.x - target.x;
        const dy = enemy.y - target.y;
        if ((dx * dx) + (dy * dy) > radiusSq) return;

        scene.statusEffectSystem.applyOwnedDamage(enemy, baseDamage, {
            source,
            sourceOwner: player,
            ownerPlayerId: player.playerId,
            ownerSkillKey: sourceSkillKey,
            tags: attackTags,
            showDamageText: true,
            damageTextColor: '#8deaff',
            damageTextFontSize: '7px'
        });
        scene.statusEffectSystem.applyEffect(enemy, 'freeze', {
            ownerPlayerId: player.playerId,
            source,
            durationMs: AQUA_SPLASH_BURST_FREEZE_DURATION_MS,
            slowMultiplier: 0,
            tags: ['water', 'splash_burst', 'freeze']
        });
    });
}

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
    aqua: {
        onCharacterSet(player) {
            const aquaState = ensureAquaPassiveState(player);
            aquaState.flowStacks = 0;
            aquaState.burstReady = false;
            aquaState.burstArmed = false;
            aquaState.armedCastToken = null;
            syncAquaPassiveBonuses(player);
            updateAquaStackLabel(player);
        },
        onUpdate(player) {
            updateAquaStackLabel(player);
        },
        onBeforeSkillCast(player, event = {}) {
            const skillType = event.skillType ?? null;
            if (!isAquaWaterSkill(player, skillType)) return null;
            const aquaState = ensureAquaPassiveState(player);
            if (!aquaState.burstReady || aquaState.flowStacks < AQUA_TIDAL_MAX_STACKS) return null;

            const castToken = `${skillType}:${player.scene?.time?.now ?? Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
            aquaState.burstReady = false;
            aquaState.burstArmed = true;
            aquaState.armedCastToken = castToken;
            return {
                skillObjectData: {
                    aquaSplashBurst: true,
                    aquaCastToken: castToken
                }
            };
        },
        onHitDealt(player, event = {}) {
            const target = event.target ?? null;
            if (!target) return;
            const damageTaken = Math.max(0, Number(event.damageTaken ?? event.damage ?? 0) || 0);
            if (damageTaken <= 0) return;
            const skillType = event.source?.skillType ?? event.source?.ownerSkillKey ?? null;
            if (!isAquaWaterSkill(player, skillType)) return;

            const aquaState = ensureAquaPassiveState(player);
            const isBurstHit = aquaState.burstArmed
                && event.source?.aquaSplashBurst === true
                && event.source?.aquaCastToken
                && event.source.aquaCastToken === aquaState.armedCastToken;

            if (isBurstHit) {
                triggerAquaSplashBurst(player, event);
                aquaState.burstArmed = false;
                aquaState.armedCastToken = null;
                setAquaFlowStacks(player, 0, { showText: true });
                return;
            }

            if ((aquaState.flowStacks ?? 0) >= AQUA_TIDAL_MAX_STACKS) return;
            setAquaFlowStacks(player, (aquaState.flowStacks ?? 0) + 1, { showText: true });
        },
        onCleanup(player) {
            const aquaState = ensurePassiveState(player).aqua ?? null;
            destroyAquaStackLabel(aquaState);
        }
    },
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
    },
    assasin: {
        onCharacterSet(player) {
            ensurePassiveState(player).assasin = {
                phantomSlashReadyAt: 0
            };
        },
        onHitDealt(player, event = {}) {
            const target = event.target ?? null;
            const source = event.source ?? null;
            if (!target?.active || target?.isDead || !source) return;
            if (source?.skillType !== 'stab' && source?.config?.category !== 'melee') return;

            const damageTaken = Math.max(0, Number(event.damageTaken ?? event.damage ?? 0) || 0);
            if (damageTaken <= 0) return;
            if (event.isCritical !== true) return;

            const passiveState = ensurePassiveState(player);
            const assasinState = passiveState.assasin ?? { phantomSlashReadyAt: 0 };
            passiveState.assasin = assasinState;

            const now = player.scene?.time?.now ?? Date.now();
            if (now < (assasinState.phantomSlashReadyAt ?? 0)) return;
            assasinState.phantomSlashReadyAt = now + ASSASIN_PHANTOM_SLASH_COOLDOWN_MS;
            triggerAssasinPhantomSlash(player, event);
        }
    }
};

export function getCharacterPassive(characterKey) {
    if (!characterKey) return null;
    return CHARACTER_PASSIVES[characterKey] ?? null;
}
