// scenes/MainScene.js
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import MiniBossEnemy from '../entities/miniboss/MiniBossEnemy.js';
import GiantRockBoss from '../entities/boss/GiantRockBoss.js';
import PlantBoss from '../entities/boss/PlantBoss.js';
import BlackWidowBoss from '../entities/boss/BlackWidowBoss.js';
import { ENEMIES } from '../config/enemies.js';
import { SKILL_CONFIG } from '../config/skill.js';
import { CHARACTER_CONFIG, DEFAULT_CHARACTER_KEY } from '../config/characters/characters.js';
import { SUPPORTER_CONFIG, SUPPORTER_KEYS } from '../config/supporters.js';
import MapManager from '../systems/mapsystem.js';
import LootSystem from '../systems/LootSystem.js';
import { DEFAULT_MAP_KEY } from '../config/map.js';
import { SHOP_ITEM_CONFIG, getConditionalShopExcludeIds, getRandomShopItemStock, getShopItemConfig } from '../config/shopItems.js';
import { getRandomPreShopCards } from '../config/preShopCards.js';
import { preloadAllAssets, createAllAnimations } from '../utils/animationSystem.js';
import {
    getScenarioEnemyHealthMultiplier,
    getStageScenario,
    getScenarioSpawnRate,
    getScenarioSpawnInterval,
    getScenarioWaveDurationSeconds,
    getScenarioWavePlan,
    getUnlockedEnemyTypes,
} from '../config/stageScenarios.js';
import CriticalHitEffect from '../entities/effects/CriticalHitEffect.js';
import SkillBehaviorPipeline from '../systems/skills/SkillBehaviorPipeline.js';
import SupporterSystem from '../systems/SupporterSystem.js';
import PlayerPartySystem from '../systems/PlayerPartySystem.js';
import PlayerRunState from '../systems/PlayerRunState.js';
import TargetingSystem from '../systems/TargetingSystem.js';
import StatusEffectSystem from '../systems/status/StatusEffectSystem.js';
import { ensureAudioSettings, installAudioUnlock, isAudioUnlocked, isMusicEnabled, playSfx } from '../utils/audioSettings.js';
import EnemyProjectile from '../entities/EnemyProjectile.js';
import GhostSummon from '../entities/summons/GhostSummon.js';

const SPAWN_PADDING = 50;
const DESPAWN_MARGIN = 150;
const MAX_ACTIVE_SKILLS = 6;
const SKILL_HIT_CHECK_INTERVAL_MS = 50;
const DEBUG_DEFAULT_HP_OVERRIDE = 10000;
const MAP_WAVE_COUNT = 20;
const ENEMIES_PER_WAVE = 1;
const INITIAL_WAVE_SPAWN_BURST = 1;
const SHOP_REROLL_COST = 10;
const SUPPORTER_SELECTION_REROLL_COST = 10;
const SUPPORTER_SELECTION_MAX_REROLLS = 2;
const PRE_SHOP_CARD_SELECTION_REROLL_COST = 10;
const PRE_SHOP_CARD_SELECTION_MAX_REROLLS = 2;
const WAVE_START_DELAY_MS = 2000;

function createEnemyInstance(scene, x, y, enemyType, options = {}) {
    if (enemyType === 'giant_rock') {
        return new GiantRockBoss(scene, x, y);
    }
    if (enemyType === 'plant') {
        return new PlantBoss(scene, x, y);
    }
    if (enemyType === 'black_widow') {
        return new BlackWidowBoss(scene, x, y);
    }
    const isMiniBoss = Boolean(options.isMiniBoss ?? options.waveSpawnEntry?.isMiniBoss);
    if (isMiniBoss && (enemyType === 'ailen' || enemyType === 'skeleton')) {
        return new MiniBossEnemy(scene, x, y, enemyType);
    }
    return new Enemy(scene, x, y, enemyType);
}

export default class MainScene extends Phaser.Scene {
    get activeSkillKey() {
        return this.getPrimaryRunState()?.activeSkillKey ?? null;
    }

    set activeSkillKey(value) {
        const runState = this.getPrimaryRunState();
        if (runState) {
            runState.activeSkillKey = value;
        }
    }

    get activeSkillKeys() {
        return this.getPrimaryRunState()?.activeSkillKeys ?? [];
    }

    set activeSkillKeys(value) {
        const runState = this.getPrimaryRunState();
        if (runState) {
            runState.activeSkillKeys = Array.isArray(value) ? value : [];
        }
    }

    get skillObjectSpawnCounts() {
        return this.getPrimaryRunState()?.skillObjectSpawnCounts ?? {};
    }

    set skillObjectSpawnCounts(value) {
        const runState = this.getPrimaryRunState();
        if (runState) {
            runState.skillObjectSpawnCounts = value ?? {};
        }
    }

    get skillHitCounts() {
        return this.getPrimaryRunState()?.skillHitCounts ?? {};
    }

    set skillHitCounts(value) {
        const runState = this.getPrimaryRunState();
        if (runState) {
            runState.skillHitCounts = value ?? {};
        }
    }

    get totalMovedDistance() {
        return this.getPrimaryRunState()?.totalMovedDistance ?? 0;
    }

    set totalMovedDistance(value) {
        const runState = this.getPrimaryRunState();
        if (runState) {
            runState.totalMovedDistance = Number.isFinite(value) ? value : 0;
        }
    }

    get killCount() {
        return this.getPrimaryRunState()?.killCount ?? 0;
    }

    set killCount(value) {
        const runState = this.getPrimaryRunState();
        if (runState) {
            runState.killCount = Number.isFinite(value) ? value : 0;
        }
    }

    constructor() {
        super('MainScene');
        this.mapManager = new MapManager(this);
        this.currentMapMusic = null;
        this.currentMapMusicKey = null;
        this.touchMoveState = null;
        this.touchControlsEnabled = false;
        this.debugSpawnIntervalOverrideMs = null;
        this.skillHitCheckTimer = 0;
        this.playerLootOverlaps = new Map();
        this.isShopOpen = false;
        this.shopPauseStartedAt = null;
        this.shopPausedDurationMs = 0;
        this.maxWaveCount = MAP_WAVE_COUNT;
        this.waveEnemyCount = ENEMIES_PER_WAVE;
        this.currentWaveNumber = 1;
        this.waveSpawnRemaining = ENEMIES_PER_WAVE;
        this.waveKillCount = 0;
        this.waveShopPending = false;
        this.waveSystemEnabled = true;
        this.waveStartPending = false;
        this.isRunComplete = false;
        this.isTransitioningToMenu = false;
        this.currentWavePlan = null;
        this.currentWaveConfig = null;
        this.currentWaveDurationSeconds = 45;
        this.currentWaveElapsedMs = 0;
        this.waveEnding = false;
        this.waveSpawnQueue = [];
        this.shopOpenReason = null;
        this.waveShopDelayTimer = null;
        this.waveStartDelayTimer = null;
        this.debugPlayerHealthOverride = 0;
        this.debugSkillEffectSelections = {};
        this.debugSkillEffectTargetKey = null;
        this.debugSupporterEffectSelections = {};
        this.isChoosingSupporter = false;
        this.shopRerollsRemaining = 0;
        this.supporterSelectionRerollsRemaining = 0;
        this.preShopCardSelectionRerollsRemaining = 0;

        // Keep summon counts stable even if a summon expires while the owning skill is gated by range checks.
        this.ghostSummonMaintainTimerMs = 0;
    }

    preload() {
        this.mapManager.preloadMaps();
        // Auto preload all assets from config
        preloadAllAssets(this);
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;
        this.isGameOver = false;
        this.isTransitioningToMenu = false;
        this.debugMode = this.registry.get('debugMode') === true;
        this.waveSystemEnabled = !this.debugMode;
        this.debugEnemyHealthOverride = this.debugMode ? DEBUG_DEFAULT_HP_OVERRIDE : 0;
        this.debugPlayerHealthOverride = this.debugMode ? DEBUG_DEFAULT_HP_OVERRIDE : 0;
        this.debugPlayerSpeedOverride = 0;
        this.selectedSupporterKey = null;
        this.registry.set('selectedSupporterKey', null);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
        ensureAudioSettings(this.registry);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.input.keyboard.on('keydown-ESC', this.handlePauseToggle, this);
        this.setupTouchControls();

        // Create all animations from config
        createAllAnimations(this);
        const selectedMapKey = this.registry.get('selectedMapKey') ?? DEFAULT_MAP_KEY;
        this.stageScenario = getStageScenario(selectedMapKey);
        const scenarioWavePlans = Array.isArray(this.stageScenario?.wavePlans) ? this.stageScenario.wavePlans : [];
        if (scenarioWavePlans.length > 0) {
            this.maxWaveCount = scenarioWavePlans.length;
        }
        const mapDef = this.mapManager.loadMap(selectedMapKey);
        this.audioUnlockCleanup = installAudioUnlock(this, () => {
            if (!this.scene.isActive('MainScene')) return;
            this.syncMapMusic(this.mapManager.currentMapDefinition ?? mapDef);
        });
        if (mapDef) {
            this.mapManager.applyWorldBounds();
            const isMobileDevice = Boolean(this.sys.game.device.os.android || this.sys.game.device.os.iOS);
            this.cameras.main.setZoom(isMobileDevice ? 1.2 : 2);
            this.syncMapMusic(mapDef);
        }
        this.cameras.main.setBackgroundColor('#808080');
        this.activeCharacterKey = this.registry.get('selectedCharacterKey') ?? DEFAULT_CHARACTER_KEY;
        const initialCharacter = CHARACTER_CONFIG[this.activeCharacterKey];
        this.skillInputs = {};
        this.characterInputs = {};
        this.playerPartySystem = new PlayerPartySystem(this);
        this.targetingSystem = new TargetingSystem(this);
        this.statusEffectSystem = new StatusEffectSystem(this);

        // Create player
        const worldBounds = this.physics.world.bounds || { centerX: width / 2, centerY: height / 2 };
        const spawnX = worldBounds.centerX ?? width / 2;
        const spawnY = worldBounds.centerY ?? height / 2;
        const resolvedSpawn = this.resolvePlayerSpawnPoint(spawnX, spawnY);
        this.player = new Player(this, resolvedSpawn.x, resolvedSpawn.y, this.activeCharacterKey);
        if (this.debugMode) {
            this.player.gold = 9999;
        }
        this.player.selectedSupporterKey = this.selectedSupporterKey;
        const primaryRunState = new PlayerRunState({
            playerId: this.player.playerId,
            characterKey: this.activeCharacterKey,
            activeSkillKey: initialCharacter?.defaultSkill ?? 'thunder',
            activeSkillKeys: [initialCharacter?.defaultSkill ?? 'thunder']
        });
        this.playerPartySystem.registerPlayer(this.player, { isPrimary: true, runState: primaryRunState });
        this.add.existing(this.player);
        this.physics.add.existing(this.player);
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(1000);
        this.children.bringToTop(this.player);
        this.mapManager.enableObjectCollisions(this.player);
        this.playerHitEffect = new CriticalHitEffect(this, {
            glowColors: [0x112240, 0x123966, 0x0f71d4, 0x8bf1ff],
            rayLineColor: 0x8cf8ff,
            sparkTints: [0x55d2ff, 0x82ecff, 0xbce8ff],
            sparkScale: { min: 0.15, max: 0.3 },
            sparkDuration: { min: 120, max: 260 }
        });
        this.skillBehaviorPipeline = new SkillBehaviorPipeline(this);
        this.supporterSystem = new SupporterSystem(this);
        this.lootSystem = new LootSystem(this);
        this.refreshPlayerInteractionBindings();
        this.player.once('player-dead', () => this.handlePlayerDeath());
        this.supporterSystem.syncPlayerSupporter(this.player);

        if (!this.scene.isActive('HudScene')) {
            this.scene.launch('HudScene');
        }
        this.scene.bringToTop('HudScene');

        this.cameraFollowTarget = this.add.zone(this.player.x, this.player.y, 1, 1);
        this.cameras.main.startFollow(this.cameraFollowTarget, false, 1, 1);
        this.cameras.main.setDeadzone(0, 0);

        this.enemies = this.physics.add.group();
        this.separationZones = this.physics.add.group();
        this.enemyProjectiles = this.add.group();
        this.summons = this.physics.add.group();
        this.showEnemyHP = false;
        this.despawnMargin = DESPAWN_MARGIN;
        this.respawnPool = 0;
        this.initializeEnemySpawnStatus();
        this.maxEnemiesOnMap = 25;
        this.events.on('enemy-dead', this.handleEnemyDeath, this);
        this.resetWaveProgress(1);
        this.scheduleWaveStart();

        // Create skills group
        this.skills = this.add.group();
        this.physics.add.collider(
            this.player,
            this.enemies,
            this.onPlayerHitEnemy,
            this.blockPlayerAgainstEnemy,
            this
        );
        this.physics.add.collider(this.enemies, this.enemies, null, this.shouldProcessEnemyCollision, this);
        this.physics.add.overlap(this.separationZones, this.enemies, this.handleSeparationZoneOverlap, null, this);
        this.setupDebugMenu();

        this.spawnTimer = 0;
        this.spawnInterval = getScenarioSpawnInterval(this.stageScenario, 500);
        this.isChoosingCard = false;
        this.upgradeOverlay = null;
        this.upgradeContainer = null;
        this.levelUpCards = [];
        this.cardFocusIndex = 0;
        this.keyboardNavigationActive = false;
        this.runStartTime = this.time.now;
        this.levelUpPausedDurationMs = 0;
        this.levelUpPauseStartedAt = null;
        this.isShopOpen = false;
        this.shopPauseStartedAt = null;
        this.shopPausedDurationMs = 0;
        this.isRunComplete = false;
        this.registry.set('hasStartedGame', true);
    }

    resolvePlayerSpawnPoint(centerX, centerY) {
        const mapManager = this.mapManager;
        if (!mapManager?.isCollidableAtWorldXY) {
            return { x: centerX, y: centerY };
        }

        const isFree = (x, y) => !mapManager.isCollidableAtWorldXY(x, y);
        if (isFree(centerX, centerY)) {
            return { x: centerX, y: centerY };
        }

        const step = 16;
        const maxRadiusSteps = 20;
        for (let radius = 1; radius <= maxRadiusSteps; radius += 1) {
            const d = radius * step;
            const candidates = [
                [centerX + d, centerY],
                [centerX - d, centerY],
                [centerX, centerY + d],
                [centerX, centerY - d],
                [centerX + d, centerY + d],
                [centerX + d, centerY - d],
                [centerX - d, centerY + d],
                [centerX - d, centerY - d]
            ];
            for (const [x, y] of candidates) {
                if (isFree(x, y)) {
                    return { x, y };
                }
            }
        }

        return { x: centerX, y: centerY };
    }

    ensureGhostSummons(owner) {
        if (!owner?.active || owner.isDead) return;
        // Ghost summons are a Radian-only mechanic.
        if ((owner.characterKey ?? null) !== 'radian') return;
        const desired = Math.max(0, Math.round(owner.getSkillObjectCount?.('ghost_summon') ?? 0));
        if (desired <= 0 || !this.summons?.getChildren) return;
        const lifetimeMs = Math.max(0, Math.round(owner.getSkillConfig?.('ghost_summon')?.summonLifetimeMs ?? 20000));
        const existing = this.summons.getChildren().filter((s) => s?.active && s?.owner === owner);
        const missing = desired - existing.length;
        if (missing <= 0) return;
        const textureKey = this.textures?.exists?.('ghost_summon_cast_0') ? 'ghost_summon_cast_0' : '__WHITE';
        for (let i = 0; i < missing; i += 1) {
            const idx = existing.length + i;
            const ghost = new GhostSummon(this, owner, idx, { textureKey, skillKey: 'ghost_summon', lifetimeMs });
            this.add.existing(ghost);
            this.physics.add.existing(ghost);
            ghost.body?.setAllowGravity?.(false);
            const radius = Math.max(10, Math.round(Math.min(ghost.displayWidth ?? 20, ghost.displayHeight ?? 20) * 0.35));
            ghost.body?.setCircle?.(radius);
            ghost.body?.setImmovable?.(true);
            this.summons.add(ghost);
        }
    }

    clearGhostSummons(owner) {
        if (!owner || !this.summons?.getChildren) return;
        const children = this.summons.getChildren();
        children.forEach((s) => {
            if (!s?.active) return;
            if (s.owner !== owner) return;
            this.summons.remove?.(s, false, false);
            s.destroy?.();
        });
    }

    getGhostSummonTarget(owner, summon) {
        if (!owner?.active || owner.isDead) return null;
        const enemies = this.enemies?.getChildren?.() ?? [];
        const activeEnemies = enemies.filter((e) => e?.active && !e.isDead);
        if (!activeEnemies.length) return null;

        // If a boss/miniboss exists, all ghosts prioritize it.
        const bossTarget = activeEnemies.find((e) => Boolean(e.isBoss || e.isMiniBoss || e.isFinalBoss)) ?? null;
        if (bossTarget) return bossTarget;

        const range = summon?.aggroRange ?? 180;
        const rangeSq = range * range;
        const candidates = activeEnemies
            .map((enemy) => {
                const dx = enemy.x - (summon?.x ?? 0);
                const dy = enemy.y - (summon?.y ?? 0);
                const distSq = (dx * dx) + (dy * dy);
                return { enemy, distSq };
            })
            .filter((entry) => entry.distSq <= rangeSq)
            .sort((a, b) => a.distSq - b.distSq)
            .map((entry) => entry.enemy);

        if (!candidates.length) return null;

        // Spread targets across ghosts (when possible) for normal enemies.
        const used = new Set();
        const summons = this.summons?.getChildren?.() ?? [];
        summons.forEach((s) => {
            if (!s?.active || s === summon) return;
            if (s.owner !== owner) return;
            if (s.target?.active && !s.target.isDead) used.add(s.target);
        });

        const unusedCandidate = candidates.find((enemy) => !used.has(enemy));
        return unusedCandidate ?? candidates[0] ?? null;
    }

    getPrimaryPlayer() {
        return this.playerPartySystem?.getPrimaryPlayer?.() ?? this.player ?? null;
    }

    getPrimaryRunState() {
        return this.playerPartySystem?.getRunState?.() ?? null;
    }

    getActivePlayers() {
        const players = this.playerPartySystem?.getAllPlayers?.() ?? [];
        return players.length ? players : (this.player ? [this.player] : []);
    }

    getActiveBossEnemy() {
        const enemies = this.enemies?.getChildren?.() ?? [];
        const activeBosses = enemies.filter((enemy) => enemy?.active && enemy.isFinalBoss && !enemy.isDead);
        if (!activeBosses.length) return null;
        return activeBosses[0];
    }

    getBossHudInfo() {
        return this.getActiveBossEnemy()?.getBossHudInfo?.() ?? null;
    }

    getPlayerById(playerId) {
        return this.playerPartySystem?.getPlayerById?.(playerId) ?? null;
    }

    getRunStateForPlayer(playerOrId) {
        return this.playerPartySystem?.getRunState?.(playerOrId) ?? null;
    }

    resolvePlayerRunContext(playerOrId = null, runState = null) {
        const resolvedPlayer = playerOrId ?? this.getPrimaryPlayer();
        const resolvedRunState = runState ?? this.getRunStateForPlayer(resolvedPlayer) ?? this.getPrimaryRunState();
        return {
            player: resolvedPlayer,
            runState: resolvedRunState
        };
    }

    getSourceOwnerContext(source = null) {
        const ownerPlayer = source?.ownerPlayerId
            ? (this.getPlayerById(source.ownerPlayerId) ?? null)
            : null;
        return this.resolvePlayerRunContext(ownerPlayer);
    }

    registerPlayerInteractions(player) {
        if (!player?.body || !this.physics || !this.lootSystem?.itemGroup) return;
        const playerId = player.playerId ?? player.name ?? `${player.x}_${player.y}`;
        if (this.playerLootOverlaps.has(playerId)) return;
        const overlap = this.physics.add.overlap(player, this.lootSystem.itemGroup, this.handleItemPickup, null, this);
        this.playerLootOverlaps.set(playerId, overlap);
    }

    unregisterPlayerInteractions(playerOrId) {
        const playerId = typeof playerOrId === 'string' ? playerOrId : playerOrId?.playerId;
        if (!playerId) return;
        const overlap = this.playerLootOverlaps.get(playerId);
        overlap?.destroy?.();
        this.playerLootOverlaps.delete(playerId);
    }

    clearPlayerInteractionBindings() {
        this.playerLootOverlaps.forEach((overlap) => overlap?.destroy?.());
        this.playerLootOverlaps.clear();
    }

    refreshPlayerInteractionBindings() {
        const activePlayers = this.getActivePlayers();
        const activePlayerIds = new Set(activePlayers.map((player) => player?.playerId).filter(Boolean));
        this.playerLootOverlaps.forEach((_overlap, playerId) => {
            if (!activePlayerIds.has(playerId)) {
                this.unregisterPlayerInteractions(playerId);
            }
        });
        activePlayers.forEach((player) => this.registerPlayerInteractions(player));
    }

    getNearestPlayerTarget(x, y, options = {}) {
        return this.targetingSystem?.getNearestPlayer?.(x, y, options) ?? this.getPrimaryPlayer();
    }

    getPartyCenter(options = {}) {
        return this.targetingSystem?.getPartyCenter?.(options) ?? new Phaser.Math.Vector2(this.player?.x ?? 0, this.player?.y ?? 0);
    }

    updateCameraFollowTarget() {
        if (!this.cameraFollowTarget) return;
        const center = this.getPartyCenter();
        this.cameraFollowTarget.setPosition(center.x, center.y);
    }

    update(time, delta) {
        if (this.isGameOver) return;
        if (this.isChoosingCard) return;
        if (this.isShopOpen) return;
        if (this.isRunComplete) return;
        if (this.waveSystemEnabled && !this.waveStartPending && !this.waveEnding) {
            this.currentWaveElapsedMs += delta;
            if (this.hasCurrentWaveTimedOut()) {
                this.endCurrentWave('timeout');
                return;
            }
        }
        if (typeof this.debugSpawnIntervalOverrideMs === 'number' && this.debugSpawnIntervalOverrideMs > 0) {
            this.spawnInterval = this.debugSpawnIntervalOverrideMs;
        } else {
            const currentSpawnRate = getScenarioSpawnRate(this, this.stageScenario, 1000 / Math.max(1, this.spawnInterval));
            this.spawnInterval = Math.max(1, Math.round(1000 / currentSpawnRate));
        }
        // Update player
        this.player.update(time, delta);
        this.applyDebugPlayerSpeedOverride();
        this.applyDebugPlayerHealthOverride();

        // Maintain ghost summons so they respawn after expiring (e.g. 20s lifetime) even if the cast is range-gated.
        this.ghostSummonMaintainTimerMs += (delta ?? 0);
        if (this.ghostSummonMaintainTimerMs >= 250) {
            this.ghostSummonMaintainTimerMs = 0;
            const players = this.getActivePlayers();
            players.forEach((p) => {
                const desired = p?.getSkillObjectCount?.('ghost_summon') ?? 0;
                if (desired > 0) this.ensureGhostSummons(p);
            });
        }

        this.mapManager.ensureSegmentsAroundWorldX(this.player.x);
        this.updateCameraFollowTarget();
        if ((this.debugEnemyHealthOverride ?? 0) > 0) {
            this.applyDebugEnemyHealthOverrideToAllEnemies();
        }
        this.despawnOffscreenEnemies();
        if (!this.waveStartPending && this.waveSystemEnabled && this.respawnPool > 0 && this.canSpawnMoreEnemies() && this.waveSpawnRemaining > 0) {
            this.respawnPool -= 1;
            this.spawnNextWaveEnemy();
        }
        this.spawnTimer += delta;
        if (this.debugMode && this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer -= this.spawnInterval;
            if (this.canSpawnMoreEnemies()) {
                this.spawnRandomEnemy(null, { countsTowardWave: false });
            }
        } else if (!this.waveStartPending && this.waveSystemEnabled && this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer -= this.spawnInterval;
            if (this.canSpawnMoreEnemies() && this.waveSpawnRemaining > 0) {
                this.spawnNextWaveEnemy();
            }
        }
        // Update enemies
        const enemyChildren = this.enemies.getChildren();
        this.enemies.children.each(enemy => {
            enemy.update(time, delta, this.getActivePlayers(), enemyChildren);
        });
        this.enemyProjectiles.children.each((projectile) => {
            projectile?.update?.(time, delta, this.getActivePlayers());
        });
        if (this.summons?.children?.each) {
            this.summons.children.each((summon) => {
                const desired = summon?.owner?.getSkillObjectCount?.('ghost_summon') ?? 0;
                summon?.update?.(time, delta, desired);
            });
        }

        this.skills.children.each(skill => {
            if (skill && typeof skill.update === 'function') {
                skill.update(time, delta);
            }
        });
        this.supporterSystem?.update?.(time, delta);
        this.skillHitCheckTimer += delta;
        if (this.skillHitCheckTimer >= SKILL_HIT_CHECK_INTERVAL_MS) {
            this.skillHitCheckTimer %= SKILL_HIT_CHECK_INTERVAL_MS;
            this.checkSkillHits();
        }
        this.updateEnemyCountDisplay();
    }

    updateMapBounds() {
        if (!this.mapManager) return;
        const { width: mapWidth, height: mapHeight } = this.mapManager.getMapSize();
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    }

    despawnOffscreenEnemies() {
        const view = this.cameras.main.worldView;
        const margin = this.despawnMargin;
        this.enemies.children.each(enemy => {
            if (!enemy || !enemy.body) return;
            if (enemy.isBoss || enemy.isMiniBoss || enemy.isFinalBoss) return;
            const outLeft = enemy.x < view.left - margin;
            const outRight = enemy.x > view.right + margin;
            const outTop = enemy.y < view.top - margin;
            const outBottom = enemy.y > view.bottom + margin;
            if (outLeft || outRight || outTop || outBottom) {
                const shouldRespawnWaveEnemy = enemy.countsTowardWave && !enemy.isDead && this.waveSystemEnabled;
                if (shouldRespawnWaveEnemy) {
                    this.waveSpawnRemaining += 1;
                    this.requeueWaveEnemy(enemy);
                    this.respawnPool += 1;
                }
                enemy.destroy();
            }
        });
    }

    checkSkillHits() {
        const skills = this.skills.getChildren();

        for (const skill of skills) {
            if (!skill.active) continue;
            if ((skill.damage ?? 0) <= 0) continue;
            if (skill.config?.visualOnly) continue;
            const skillBounds = skill.getBounds();
            const enemies = this.getNearbyEnemiesForSkill(skill, skillBounds);
            for (const enemy of enemies) {
                if (!enemy.active) continue;
                if (Phaser.Geom.Intersects.RectangleToRectangle(skillBounds, enemy.getBounds())) {
                    this.onSkillHitEnemy(skill, enemy);
                    if (!skill.active) {
                        break;
                    }
                }
            }
        }
    }

    getNearbyEnemiesForSkill(skill, skillBounds = skill?.getBounds?.()) {
        if (!skill || !skillBounds || !this.enemies?.getChildren) return [];
        const halfWidth = skillBounds.width * 0.5;
        const halfHeight = skillBounds.height * 0.5;
        const queryRadius = Math.max(halfWidth, halfHeight) + 24;
        const overlapBodies = this.physics?.overlapCirc?.(skill.x, skill.y, queryRadius, true, true);
        if (Array.isArray(overlapBodies) && overlapBodies.length) {
            return overlapBodies
                .map((body) => body?.gameObject)
                .filter((enemy, index, array) => enemy && this.enemies.contains?.(enemy) && array.indexOf(enemy) === index);
        }

        const enemies = this.enemies.getChildren();
        const nearbyEnemies = [];
        const minX = skillBounds.left - 24;
        const maxX = skillBounds.right + 24;
        const minY = skillBounds.top - 24;
        const maxY = skillBounds.bottom + 24;
        for (const enemy of enemies) {
            if (!enemy?.active) continue;
            if (enemy.x < minX || enemy.x > maxX || enemy.y < minY || enemy.y > maxY) continue;
            nearbyEnemies.push(enemy);
        }
        return nearbyEnemies;
    }

    spawnEnemyProjectile(enemy, target, options = {}) {
        if (!enemy?.active || !target?.active) return null;
        const projectile = new EnemyProjectile(this, enemy, target, options);
        this.enemyProjectiles.add(projectile);
        return projectile;
    }

    spawnEnemyProjectileDirection(enemy, x, y, dirX, dirY, options = {}) {
        if (!enemy?.active) return null;
        const projectile = new EnemyProjectile(this, enemy, {
            active: true,
            x: x + dirX,
            y: y + dirY
        }, {
            ...options,
            spawnX: x,
            spawnY: y,
            directionX: dirX,
            directionY: dirY
        });
        this.enemyProjectiles.add(projectile);
        return projectile;
    }

    onSkillHitEnemy(skill, enemy) {
        if (!skill.active) return;
        if (skill.config?.dropFromSky && skill.dropTarget && enemy !== skill.dropTarget) {
            return;
        }
        if (skill.recordHit && !skill.recordHit(enemy)) return;
        const ownerContext = this.getSourceOwnerContext(skill);
        if (skill.skillType) {
            const ownerRunState = ownerContext.runState;
            if (ownerRunState) {
                ownerRunState.skillHitCounts = ownerRunState.skillHitCounts ?? {};
                ownerRunState.skillHitCounts[skill.skillType] = (ownerRunState.skillHitCounts[skill.skillType] ?? 0) + 1;
            }
        }
        this.skillBehaviorPipeline?.processHit(skill, enemy);
    }


    onPlayerHitEnemy(player, enemy) {
        if (!player || !enemy) return;
        enemy.handlePlayerContact?.(player, this.time.now);
    }

    handleItemPickup(player, item) {
        if (!item || typeof item.collect !== 'function') return;
        if (typeof item.canBeCollectedBy === 'function' && !item.canBeCollectedBy(player)) {
            return;
        }
        item.collect(player);
    }

    blockPlayerAgainstEnemy(player, enemy) {
        if (!player || !player.body) {
            return true;
        }
        return true;
    }

    applyKnockbackDamage(target, skillConfig, direction) {
        if (!target || !skillConfig || !direction) return;
        const extraDamage = (skillConfig.damage ?? 0) * 0.4;
        const radius = skillConfig.knockbackDistance ?? 100;
        const enemies = this.enemies.getChildren?.() ?? [];
        const forward = direction.clone().normalize();
        const trailingDamage = extraDamage + Math.round((target.maxHealth ?? 0) * 0.4);
        enemies.forEach(enemy => {
            if (!enemy || enemy === target || enemy.isDead) return;
            const toEnemy = new Phaser.Math.Vector2(enemy.x - target.x, enemy.y - target.y);
            const proj = toEnemy.dot(forward);
            if (proj <= 0 || proj > radius) return;
            const perpDist = Math.abs(toEnemy.x * forward.y - toEnemy.y * forward.x);
            const maxPerp = (enemy.displayWidth || enemy.body?.width || 32) / 2;
            if (perpDist > maxPerp) return;
            enemy.takeDamage(trailingDamage, 0, null, null, { fromChainDamage: true }, skillConfig);
        });
    }

    handleEnemySeparation(enemyA, enemyB) {
        if (!enemyA || !enemyB) return true;
        if (!enemyA.body || !enemyB.body) return true;
        const overlapX = enemyA.body.width / 2 + enemyB.body.width / 2 - Math.abs(enemyA.x - enemyB.x);
        const overlapY = enemyA.body.height / 2 + enemyB.body.height / 2 - Math.abs(enemyA.y - enemyB.y);
        if (overlapX <= 0 && overlapY <= 0) return true;
        const pushStrength = 100;
        const dir = new Phaser.Math.Vector2(enemyA.x - enemyB.x, enemyA.y - enemyB.y);
        if (dir.lengthSq() === 0) {
            dir.set(Math.random() - 0.5, Math.random() - 0.5);
        }
        dir.normalize();
        const push = dir.scale(pushStrength * Math.max(overlapX, overlapY));
        enemyA.body.setVelocity(push.x, push.y);
        enemyB.body.setVelocity(-push.x, -push.y);
        return true;
    }

    handleSeparationZoneOverlap(zone, enemy) {
        if (!zone || !enemy || !enemy.body) return;
        const dx = enemy.x - zone.x;
        const dy = enemy.y - zone.y;
        const dir = new Phaser.Math.Vector2(dx, dy);
        if (dir.lengthSq() === 0) dir.set(Math.random() - 0.5, Math.random() - 0.5);
        dir.normalize();
        const strength = 120;
        enemy.body.setVelocity(dir.x * strength, dir.y * strength);
    }

    setupDebugMenu() {
        const panel = document.getElementById('debug-panel');
        if (!panel) return;
        panel.style.display = this.debugMode ? 'flex' : 'none';
        if (!this.debugMode) {
            return;
        }
        const toggleButton = panel.querySelector('#debug-panel-toggle');
        if (toggleButton && !toggleButton.dataset.bound) {
            toggleButton.dataset.bound = 'true';
            const syncToggleLabel = () => {
                toggleButton.textContent = panel.classList.contains('collapsed') ? 'Show' : 'Hide';
            };
            toggleButton.addEventListener('click', () => {
                panel.classList.toggle('collapsed');
                syncToggleLabel();
            });
            syncToggleLabel();
        }
        const enemyContainer = panel.querySelector('#enemy-list');
        if (!enemyContainer) return;
        enemyContainer.innerHTML = '';
        this.skillInputs = {};
        this.characterInputs = {};
        const enemySection = enemyContainer.closest('.panel-section');
        enemyContainer.classList.add('panel-list');
        const skillSection = panel.querySelector('#skill-section');
        if (skillSection) {
            skillSection.style.display = 'none';
        }
        const existingEnemyCountLabels = Array.from(panel.querySelectorAll('#enemy-count-display'));
        existingEnemyCountLabels.slice(1).forEach((label) => label.remove());
        const enemyCountLabel = existingEnemyCountLabels[0] ?? document.createElement('div');
        enemyCountLabel.id = 'enemy-count-display';
        enemyCountLabel.classList.add('panel-text');
        enemyCountLabel.textContent = 'Enemies on map: 0';
        if (enemySection) {
            enemySection.insertBefore(enemyCountLabel, enemyContainer);
        } else {
            panel.appendChild(enemyCountLabel);
        }
        this.enemyCountDisplay = enemyCountLabel;
        let characterSection = panel.querySelector('#character-section');
        if (!characterSection) {
            characterSection = document.createElement('div');
            characterSection.id = 'character-section';
            characterSection.classList.add('panel-section');
            if (enemySection) {
                panel.insertBefore(characterSection, enemySection);
            } else {
                panel.appendChild(characterSection);
            }
        }
        characterSection.innerHTML = '';
        const charTitle = document.createElement('div');
        charTitle.classList.add('panel-title');
        charTitle.textContent = 'Characters';
        characterSection.appendChild(charTitle);
        const charList = document.createElement('div');
        charList.classList.add('panel-list');
        characterSection.appendChild(charList);
        Object.entries(CHARACTER_CONFIG).forEach(([key, config]) => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'character-selector';
            input.value = key;
            input.checked = key === this.activeCharacterKey;
            input.addEventListener('change', () => {
                if (input.checked) {
                    this.switchCharacter(key);
                }
            });
            label.appendChild(input);
            label.appendChild(document.createTextNode(config.label || key));
            charList.appendChild(label);
            this.characterInputs[key] = input;
        });

        let supporterSection = panel.querySelector('#supporter-section');
        if (!supporterSection) {
            supporterSection = document.createElement('div');
            supporterSection.id = 'supporter-section';
            supporterSection.classList.add('panel-section');
            if (enemySection) {
                panel.insertBefore(supporterSection, enemySection);
            } else {
                panel.appendChild(supporterSection);
            }
        }
        supporterSection.innerHTML = '';
        const supporterTitle = document.createElement('div');
        supporterTitle.classList.add('panel-title');
        supporterTitle.textContent = 'Supporters';
        supporterSection.appendChild(supporterTitle);

        const supporterLabel = document.createElement('label');
        supporterLabel.textContent = 'Active Supporter';
        supporterLabel.style.display = 'flex';
        supporterLabel.style.flexDirection = 'column';
        supporterLabel.style.gap = '4px';
        supporterLabel.style.fontSize = '12px';
        const supporterSelect = document.createElement('select');
        supporterSelect.style.padding = '4px';
        supporterSelect.style.borderRadius = '4px';
        supporterSelect.style.background = '#222';
        supporterSelect.style.color = '#fff';
        supporterSelect.style.border = '1px solid rgba(255,255,255,0.2)';
        const noSupporterOption = document.createElement('option');
        noSupporterOption.value = '';
        noSupporterOption.textContent = 'None';
        noSupporterOption.selected = !this.selectedSupporterKey;
        supporterSelect.appendChild(noSupporterOption);
        SUPPORTER_KEYS.forEach((supporterKey) => {
            const option = document.createElement('option');
            option.value = supporterKey;
            option.textContent = SUPPORTER_CONFIG[supporterKey]?.label ?? supporterKey;
            option.selected = supporterKey === this.selectedSupporterKey;
            supporterSelect.appendChild(option);
        });
        supporterSelect.addEventListener('change', () => {
            this.setSelectedSupporterKey(supporterSelect.value || null);
        });
        supporterLabel.appendChild(supporterSelect);
        supporterSection.appendChild(supporterLabel);

        let bossSection = panel.querySelector('#boss-section');
        if (!bossSection) {
            bossSection = document.createElement('div');
            bossSection.id = 'boss-section';
            bossSection.classList.add('panel-section');
            if (enemySection) {
                panel.insertBefore(bossSection, enemySection);
            } else {
                panel.appendChild(bossSection);
            }
        }
        bossSection.innerHTML = '';
        const bossTitle = document.createElement('div');
        bossTitle.classList.add('panel-title');
        bossTitle.textContent = 'Boss';
        bossSection.appendChild(bossTitle);

        const bossActions = document.createElement('div');
        bossActions.classList.add('panel-list');
        bossActions.style.display = 'flex';
        bossActions.style.flexDirection = 'column';
        bossActions.style.gap = '6px';
        bossSection.appendChild(bossActions);

        const spawnGiantRockButton = document.createElement('button');
        spawnGiantRockButton.type = 'button';
        spawnGiantRockButton.textContent = 'Spawn Giant Rock';
        spawnGiantRockButton.style.padding = '6px 8px';
        spawnGiantRockButton.style.borderRadius = '4px';
        spawnGiantRockButton.style.background = '#5b3426';
        spawnGiantRockButton.style.color = '#fff2db';
        spawnGiantRockButton.style.border = '1px solid rgba(255,255,255,0.2)';
        spawnGiantRockButton.style.cursor = 'pointer';
        spawnGiantRockButton.addEventListener('click', () => {
            this.spawnEnemyNearPlayer('giant_rock', 180, { isBoss: true });
        });
        bossActions.appendChild(spawnGiantRockButton);

        const spawnPlantBossButton = document.createElement('button');
        spawnPlantBossButton.type = 'button';
        spawnPlantBossButton.textContent = 'Spawn Plant Boss';
        spawnPlantBossButton.style.padding = '6px 8px';
        spawnPlantBossButton.style.borderRadius = '4px';
        spawnPlantBossButton.style.background = '#2f5b26';
        spawnPlantBossButton.style.color = '#efffdb';
        spawnPlantBossButton.style.border = '1px solid rgba(255,255,255,0.2)';
        spawnPlantBossButton.style.cursor = 'pointer';
        spawnPlantBossButton.addEventListener('click', () => {
            this.spawnEnemyNearPlayer('plant', 180, { isBoss: true });
        });
        bossActions.appendChild(spawnPlantBossButton);

        const spawnBlackWidowButton = document.createElement('button');
        spawnBlackWidowButton.type = 'button';
        spawnBlackWidowButton.textContent = 'Spawn Black Widow';
        spawnBlackWidowButton.style.padding = '6px 8px';
        spawnBlackWidowButton.style.borderRadius = '4px';
        spawnBlackWidowButton.style.background = '#5b2631';
        spawnBlackWidowButton.style.color = '#ffe7ee';
        spawnBlackWidowButton.style.border = '1px solid rgba(255,255,255,0.2)';
        spawnBlackWidowButton.style.cursor = 'pointer';
        spawnBlackWidowButton.addEventListener('click', () => {
            this.spawnEnemyNearPlayer('black_widow', 180, { isBoss: true });
        });
        bossActions.appendChild(spawnBlackWidowButton);

        Object.entries(ENEMIES).forEach(([type, config]) => {
            this.enemySpawnStatus[type] = this.enemySpawnStatus[type] ?? false;
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = this.enemySpawnStatus[type];
            input.addEventListener('change', () => {
                this.enemySpawnStatus[type] = input.checked;
            });
            label.appendChild(input);
            label.appendChild(document.createTextNode(config.name || type));
            enemyContainer.appendChild(label);
        });
        const clearButton = panel.querySelector('#clear-enemies-btn');
        if (clearButton) {
            clearButton.onclick = () => this.clearEnemies();
        }

        let skillEffectSection = panel.querySelector('#skill-effect-section');
        if (!skillEffectSection) {
            skillEffectSection = document.createElement('div');
            skillEffectSection.id = 'skill-effect-section';
            skillEffectSection.classList.add('panel-section');
            panel.appendChild(skillEffectSection);
        }
        skillEffectSection.innerHTML = '';
        const skillEffectTitle = document.createElement('div');
        skillEffectTitle.classList.add('panel-title');
        skillEffectTitle.textContent = 'Skill Effects';
        skillEffectSection.appendChild(skillEffectTitle);

        const activeSkillKeys = this.player?.getActiveSkillKeys?.() ?? this.activeSkillKeys ?? [];
        const effectTargetSelect = document.createElement('select');
        effectTargetSelect.style.padding = '4px';
        effectTargetSelect.style.borderRadius = '4px';
        effectTargetSelect.style.background = '#222';
        effectTargetSelect.style.color = '#fff';
        effectTargetSelect.style.border = '1px solid rgba(255,255,255,0.2)';
        const fallbackTargetKey = activeSkillKeys.includes(this.debugSkillEffectTargetKey)
            ? this.debugSkillEffectTargetKey
            : (this.activeSkillKey ?? activeSkillKeys[0] ?? null);
        this.debugSkillEffectTargetKey = fallbackTargetKey;
        activeSkillKeys.forEach((skillKey) => {
            const option = document.createElement('option');
            option.value = skillKey;
            option.textContent = SKILL_CONFIG[skillKey]?.label ?? skillKey;
            option.selected = skillKey === fallbackTargetKey;
            effectTargetSelect.appendChild(option);
        });
        skillEffectSection.appendChild(effectTargetSelect);

        const effectList = document.createElement('div');
        effectList.classList.add('panel-list');
        skillEffectSection.appendChild(effectList);
        const effectDefinitions = this.getDebugSkillEffectDefinitions();
        const renderSkillEffectOptions = (skillKey) => {
            effectList.innerHTML = '';
            const selection = this.getDebugSkillEffectSelection(skillKey);
            Object.entries(effectDefinitions).forEach(([effectKey, definition]) => {
                const label = document.createElement('label');
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = `skill-effect-${skillKey}`;
                input.value = effectKey;
                input.checked = Boolean(selection[effectKey]);
                input.addEventListener('change', () => {
                    Object.keys(selection).forEach((key) => {
                        selection[key] = false;
                    });
                    if (input.checked) {
                        selection[effectKey] = true;
                    }
                    this.applyDebugSkillEffectOverride(skillKey);
                });
                label.appendChild(input);
                label.appendChild(document.createTextNode(definition.label));
                effectList.appendChild(label);
            });

            const clearButton = document.createElement('button');
            clearButton.type = 'button';
            clearButton.textContent = 'Clear Effect';
            clearButton.style.padding = '4px 6px';
            clearButton.style.borderRadius = '4px';
            clearButton.style.background = '#333';
            clearButton.style.color = '#fff';
            clearButton.style.border = '1px solid rgba(255,255,255,0.2)';
            clearButton.style.cursor = 'pointer';
            clearButton.addEventListener('click', () => {
                Object.keys(selection).forEach((key) => {
                    selection[key] = false;
                });
                this.applyDebugSkillEffectOverride(skillKey);
                renderSkillEffectOptions(skillKey);
            });
            effectList.appendChild(clearButton);
        };
        if (fallbackTargetKey) {
            renderSkillEffectOptions(fallbackTargetKey);
        }
        effectTargetSelect.addEventListener('change', () => {
            this.debugSkillEffectTargetKey = effectTargetSelect.value || null;
            renderSkillEffectOptions(this.debugSkillEffectTargetKey);
        });

        const currentSupporterKey = this.player?.characterKey ? (this.supporterSystem?.getSupporterForPlayer?.(this.player.playerId)?.supporterKey ?? null) : null;
        if (currentSupporterKey) {
            const supporterEffectSection = document.createElement('div');
            supporterEffectSection.classList.add('panel-section');
            const supporterEffectTitle = document.createElement('div');
            supporterEffectTitle.classList.add('panel-title');
            supporterEffectTitle.textContent = 'Supporter Effects';
            supporterEffectSection.appendChild(supporterEffectTitle);
            const supporterEffectList = document.createElement('div');
            supporterEffectList.classList.add('panel-list');
            supporterEffectSection.appendChild(supporterEffectList);
            const renderSupporterEffectOptions = (supporterKey) => {
                supporterEffectList.innerHTML = '';
                const selection = this.getDebugSupporterEffectSelection(supporterKey);
                Object.entries(effectDefinitions).forEach(([effectKey, definition]) => {
                    const label = document.createElement('label');
                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = `supporter-effect-${supporterKey}`;
                    input.value = effectKey;
                    input.checked = Boolean(selection[effectKey]);
                    input.addEventListener('change', () => {
                        Object.keys(selection).forEach((key) => {
                            selection[key] = false;
                        });
                        if (input.checked) {
                            selection[effectKey] = true;
                        }
                        this.applyDebugSupporterEffectOverride(supporterKey);
                    });
                    label.appendChild(input);
                    label.appendChild(document.createTextNode(definition.label));
                    supporterEffectList.appendChild(label);
                });
                const clearButton = document.createElement('button');
                clearButton.type = 'button';
                clearButton.textContent = 'Clear Supporter Effect';
                clearButton.style.padding = '4px 6px';
                clearButton.style.borderRadius = '4px';
                clearButton.style.background = '#333';
                clearButton.style.color = '#fff';
                clearButton.style.border = '1px solid rgba(255,255,255,0.2)';
                clearButton.style.cursor = 'pointer';
                clearButton.addEventListener('click', () => {
                    Object.keys(selection).forEach((key) => {
                        selection[key] = false;
                    });
                    this.applyDebugSupporterEffectOverride(supporterKey);
                    renderSupporterEffectOptions(supporterKey);
                });
                supporterEffectList.appendChild(clearButton);
            };
            renderSupporterEffectOptions(currentSupporterKey);
            skillEffectSection.appendChild(supporterEffectSection);
        }

        let mapSection = panel.querySelector('#map-section');
        if (!mapSection) {
            mapSection = document.createElement('div');
            mapSection.id = 'map-section';
            mapSection.classList.add('panel-section');
            panel.appendChild(mapSection);
        }
        mapSection.innerHTML = '';
        const mapTitle = document.createElement('div');
        mapTitle.classList.add('panel-title');
        mapTitle.textContent = 'Map';
        mapSection.appendChild(mapTitle);

        const mapSelect = document.createElement('select');
        mapSelect.id = 'map-selector';
        mapSelect.style.padding = '4px';
        mapSelect.style.borderRadius = '4px';
        mapSelect.style.background = '#222';
        mapSelect.style.color = '#fff';
        mapSelect.style.border = '1px solid rgba(255,255,255,0.2)';
        const mapList = this.mapManager?.getMapList?.() ?? [];
        const currentMapId = this.mapManager?.getCurrentMap?.()?.id ?? DEFAULT_MAP_KEY;
        mapList.forEach((mapEntry) => {
            const option = document.createElement('option');
            option.value = mapEntry.id;
            option.textContent = mapEntry.label || mapEntry.id;
            if (mapEntry.id === currentMapId) {
                option.selected = true;
            }
            mapSelect.appendChild(option);
        });
        mapSelect.addEventListener('change', () => {
            const mapDef = this.mapManager.loadMap(mapSelect.value);
            if (mapDef) {
                this.registry.set('selectedMapKey', mapSelect.value);
                this.stageScenario = getStageScenario(mapSelect.value);
                this.updateMapBounds();
                this.mapManager.enableObjectCollisions(this.player);
                this.mapManager.enableObjectCollisions(this.enemies);
                this.repositionPlayerForCurrentMap();
                this.updateCameraFollowTarget();
                this.cameras.main.startFollow(this.cameraFollowTarget ?? this.player, false, 1, 1);
                this.cameras.main.centerOn(this.cameraFollowTarget?.x ?? this.player.x, this.cameraFollowTarget?.y ?? this.player.y);
                this.syncMapMusic(mapDef);
            }
        });
        mapSection.appendChild(mapSelect);

        let uiSection = panel.querySelector('#ui-section');
        if (!uiSection) {
            uiSection = document.createElement('div');
            uiSection.id = 'ui-section';
            uiSection.classList.add('panel-section');
            panel.appendChild(uiSection);
        }
        uiSection.innerHTML = '';
        const uiTitle = document.createElement('div');
        uiTitle.classList.add('panel-title');
        uiTitle.textContent = 'Options';
        uiSection.appendChild(uiTitle);
        const hpLabel = document.createElement('label');
        const hpToggle = document.createElement('input');
        hpToggle.type = 'checkbox';
        hpToggle.id = 'toggle-enemy-hp';
        hpToggle.checked = this.showEnemyHP;
        hpToggle.addEventListener('change', () => this.setShowEnemyHP(hpToggle.checked));
        hpLabel.appendChild(hpToggle);
        hpLabel.appendChild(document.createTextNode('Show enemy number'));
        uiSection.appendChild(hpLabel);

        const spawnIntervalLabel = document.createElement('label');
        spawnIntervalLabel.textContent = 'Spawn interval (ms)';
        spawnIntervalLabel.style.display = 'flex';
        spawnIntervalLabel.style.flexDirection = 'column';
        spawnIntervalLabel.style.gap = '4px';
        spawnIntervalLabel.style.fontSize = '12px';
        const spawnIntervalInput = document.createElement('input');
        spawnIntervalInput.type = 'number';
        spawnIntervalInput.min = '1';
        spawnIntervalInput.step = '50';
        spawnIntervalInput.value = String(Math.max(1, Math.round(this.debugSpawnIntervalOverrideMs ?? this.spawnInterval ?? 500)));
        spawnIntervalInput.style.padding = '4px';
        spawnIntervalInput.style.borderRadius = '4px';
        spawnIntervalInput.style.background = '#222';
        spawnIntervalInput.style.color = '#fff';
        spawnIntervalInput.style.border = '1px solid rgba(255,255,255,0.2)';
        spawnIntervalInput.addEventListener('change', () => {
            const nextValue = Number(spawnIntervalInput.value);
            if (!Number.isFinite(nextValue) || nextValue <= 0) {
                spawnIntervalInput.value = String(Math.max(1, Math.round(this.debugSpawnIntervalOverrideMs ?? this.spawnInterval ?? 500)));
                return;
            }
            this.debugSpawnIntervalOverrideMs = Math.max(1, Math.round(nextValue));
            this.spawnInterval = this.debugSpawnIntervalOverrideMs;
            spawnIntervalInput.value = String(this.debugSpawnIntervalOverrideMs);
        });
        spawnIntervalLabel.appendChild(spawnIntervalInput);
        uiSection.appendChild(spawnIntervalLabel);

        const playerSpeedLabel = document.createElement('label');
        playerSpeedLabel.textContent = 'Player Speed';
        playerSpeedLabel.style.display = 'flex';
        playerSpeedLabel.style.flexDirection = 'column';
        playerSpeedLabel.style.gap = '4px';
        playerSpeedLabel.style.fontSize = '12px';
        const playerSpeedInput = document.createElement('input');
        playerSpeedInput.type = 'number';
        playerSpeedInput.min = '0';
        playerSpeedInput.step = '5';
        playerSpeedInput.value = String(Math.max(0, Math.round(this.debugPlayerSpeedOverride ?? 0)));
        playerSpeedInput.style.padding = '4px';
        playerSpeedInput.style.borderRadius = '4px';
        playerSpeedInput.style.background = '#222';
        playerSpeedInput.style.color = '#fff';
        playerSpeedInput.style.border = '1px solid rgba(255,255,255,0.2)';
        const applyPlayerSpeedInput = () => {
            const nextValue = Number(playerSpeedInput.value);
            if (!Number.isFinite(nextValue) || nextValue < 0) {
                playerSpeedInput.value = String(Math.max(0, Math.round(this.debugPlayerSpeedOverride ?? 0)));
                return;
            }
            this.debugPlayerSpeedOverride = Math.max(0, Math.round(nextValue));
            playerSpeedInput.value = String(this.debugPlayerSpeedOverride);
            this.applyDebugPlayerSpeedOverride();
        };
        playerSpeedInput.addEventListener('change', applyPlayerSpeedInput);
        playerSpeedInput.addEventListener('input', applyPlayerSpeedInput);
        playerSpeedLabel.appendChild(playerSpeedInput);
        uiSection.appendChild(playerSpeedLabel);

        const playerHpOverrideLabel = document.createElement('label');
        playerHpOverrideLabel.textContent = 'Player HP';
        playerHpOverrideLabel.style.display = 'flex';
        playerHpOverrideLabel.style.flexDirection = 'column';
        playerHpOverrideLabel.style.gap = '4px';
        playerHpOverrideLabel.style.fontSize = '12px';
        const playerHpOverrideInput = document.createElement('input');
        playerHpOverrideInput.type = 'number';
        playerHpOverrideInput.min = '0';
        playerHpOverrideInput.step = '50';
        playerHpOverrideInput.value = String(Math.max(0, Math.round(this.debugPlayerHealthOverride ?? 0)));
        playerHpOverrideInput.style.padding = '4px';
        playerHpOverrideInput.style.borderRadius = '4px';
        playerHpOverrideInput.style.background = '#222';
        playerHpOverrideInput.style.color = '#fff';
        playerHpOverrideInput.style.border = '1px solid rgba(255,255,255,0.2)';
        const applyPlayerHpOverrideInput = () => {
            const nextValue = Number(playerHpOverrideInput.value);
            if (!Number.isFinite(nextValue) || nextValue < 0) {
                playerHpOverrideInput.value = String(Math.max(0, Math.round(this.debugPlayerHealthOverride ?? 0)));
                return;
            }
            this.debugPlayerHealthOverride = Math.max(0, Math.round(nextValue));
            playerHpOverrideInput.value = String(this.debugPlayerHealthOverride);
            this.applyDebugPlayerHealthOverride();
        };
        playerHpOverrideInput.addEventListener('change', applyPlayerHpOverrideInput);
        playerHpOverrideInput.addEventListener('input', applyPlayerHpOverrideInput);
        playerHpOverrideLabel.appendChild(playerHpOverrideInput);
        uiSection.appendChild(playerHpOverrideLabel);

        const enemyHpOverrideLabel = document.createElement('label');
        enemyHpOverrideLabel.textContent = 'Enemy HP';
        enemyHpOverrideLabel.style.display = 'flex';
        enemyHpOverrideLabel.style.flexDirection = 'column';
        enemyHpOverrideLabel.style.gap = '4px';
        enemyHpOverrideLabel.style.fontSize = '12px';
        const enemyHpOverrideInput = document.createElement('input');
        enemyHpOverrideInput.type = 'number';
        enemyHpOverrideInput.min = '0';
        enemyHpOverrideInput.step = '100';
        enemyHpOverrideInput.value = String(Math.max(0, Math.round(this.debugEnemyHealthOverride ?? 0)));
        enemyHpOverrideInput.style.padding = '4px';
        enemyHpOverrideInput.style.borderRadius = '4px';
        enemyHpOverrideInput.style.background = '#222';
        enemyHpOverrideInput.style.color = '#fff';
        enemyHpOverrideInput.style.border = '1px solid rgba(255,255,255,0.2)';
        const applyEnemyHpOverrideInput = () => {
            const nextValue = Number(enemyHpOverrideInput.value);
            if (!Number.isFinite(nextValue) || nextValue < 0) {
                enemyHpOverrideInput.value = String(Math.max(0, Math.round(this.debugEnemyHealthOverride ?? 0)));
                return;
            }
            this.debugEnemyHealthOverride = Math.max(0, Math.round(nextValue));
            enemyHpOverrideInput.value = String(this.debugEnemyHealthOverride);
            this.applyDebugEnemyHealthOverrideToAllEnemies();
        };
        enemyHpOverrideInput.addEventListener('change', applyEnemyHpOverrideInput);
        enemyHpOverrideInput.addEventListener('input', applyEnemyHpOverrideInput);
        enemyHpOverrideLabel.appendChild(enemyHpOverrideInput);
        uiSection.appendChild(enemyHpOverrideLabel);

        const openShopButton = document.createElement('button');
        openShopButton.type = 'button';
        openShopButton.textContent = 'Open Shop';
        openShopButton.style.padding = '6px 8px';
        openShopButton.style.borderRadius = '4px';
        openShopButton.style.background = '#6b4a22';
        openShopButton.style.color = '#fff7dd';
        openShopButton.style.border = '1px solid rgba(255,255,255,0.2)';
        openShopButton.style.cursor = 'pointer';
        openShopButton.addEventListener('click', () => {
            if (this.isGameOver || this.isChoosingCard || this.isShopOpen) return;
            this.presentShopOverlay('manual');
        });
        uiSection.appendChild(openShopButton);
        this.updateEnemyCountDisplay();
    }

    getDebugSkillEffectDefinitions() {
        return {
            burn: {
                label: 'Burn',
                tags: ['fire'],
                statusEffects: [
                    {
                        key: 'burn',
                        trigger: 'onHit',
                        target: 'target'
                    }
                ]
            },
            freeze: {
                label: 'Freeze',
                tags: ['ice'],
                statusEffects: [
                    {
                        key: 'freeze',
                        trigger: 'onHit',
                        target: 'target'
                    }
                ]
            },
            shock: {
                label: 'Shock',
                tags: ['lightning'],
                statusEffects: [
                    {
                        key: 'shock',
                        trigger: 'onHit',
                        target: 'target'
                    }
                ]
            },
            poison: {
                label: 'Poison',
                tags: ['poison'],
                statusEffects: [
                    {
                        key: 'poison',
                        trigger: 'onHit',
                        target: 'target'
                    }
                ]
            },
            bleed: {
                label: 'Bleed',
                tags: ['physical'],
                statusEffects: [
                    {
                        key: 'bleed',
                        trigger: 'onHit',
                        target: 'target'
                    }
                ]
            },
            explosion: {
                label: 'Explosion',
                tags: ['explosion'],
                statusEffects: [
                    {
                        key: 'explosion',
                        trigger: 'onHit',
                        target: 'target'
                    }
                ]
            },
            shield: {
                label: 'Shield',
                tags: ['shield'],
                statusEffects: [
                    {
                        key: 'shield',
                        trigger: 'onCast',
                        target: 'self'
                    }
                ]
            },
            mark: {
                label: 'Mark',
                tags: ['mark'],
                statusEffects: [
                    {
                        key: 'mark',
                        trigger: 'onHit',
                        target: 'target'
                    }
                ]
            }
        };
    }

    getDebugSkillEffectSelection(skillKey) {
        if (!skillKey) return {};
        this.debugSkillEffectSelections[skillKey] = this.debugSkillEffectSelections[skillKey] ?? {};
        return this.debugSkillEffectSelections[skillKey];
    }

    getDebugSupporterEffectSelection(supporterKey) {
        if (!supporterKey) return {};
        this.debugSupporterEffectSelections[supporterKey] = this.debugSupporterEffectSelections[supporterKey] ?? {};
        return this.debugSupporterEffectSelections[supporterKey];
    }

    buildDebugSkillEffectOverride(skillKey) {
        const selection = this.getDebugSkillEffectSelection(skillKey);
        const definitions = this.getDebugSkillEffectDefinitions();
        const selectedEntry = Object.entries(selection)
            .filter(([, enabled]) => enabled)
            .map(([effectKey]) => definitions[effectKey])
            .find(Boolean);
        if (!selectedEntry) {
            return null;
        }
        return {
            tags: Array.from(new Set(selectedEntry.tags ?? [])),
            statusEffects: (selectedEntry.statusEffects ?? []).slice(0, 1)
        };
    }

    applyDebugSkillEffectOverride(skillKey) {
        if (!skillKey || !this.player?.setSkillRuntimeOverrides) return;
        const existingOverride = this.player.skillRuntimeConfigOverrides?.[skillKey] ?? {};
        const nextOverride = { ...existingOverride };
        const debugOverride = this.buildDebugSkillEffectOverride(skillKey);
        if (!debugOverride) {
            if (Object.prototype.hasOwnProperty.call(nextOverride, 'tags')) {
                delete nextOverride.tags;
            }
            if (Object.prototype.hasOwnProperty.call(nextOverride, 'statusEffects')) {
                delete nextOverride.statusEffects;
            }
        } else {
            nextOverride.tags = debugOverride.tags;
            nextOverride.statusEffects = debugOverride.statusEffects;
        }
        this.player.setSkillRuntimeOverrides(skillKey, nextOverride);
    }

    buildDebugSupporterEffectOverride(supporterKey) {
        const selection = this.getDebugSupporterEffectSelection(supporterKey);
        const definitions = this.getDebugSkillEffectDefinitions();
        const selectedEntry = Object.entries(selection)
            .filter(([, enabled]) => enabled)
            .map(([effectKey]) => definitions[effectKey])
            .find(Boolean);
        if (!selectedEntry) {
            return {};
        }
        return {
            tags: Array.from(new Set(selectedEntry.tags ?? [])),
            statusEffects: (selectedEntry.statusEffects ?? []).slice(0, 1)
        };
    }

    applyDebugSupporterEffectOverride(supporterKey) {
        if (!supporterKey) return;
        const supporter = this.supporterSystem?.getSupporterForPlayer?.(this.player?.playerId ?? null);
        const debugOverride = this.buildDebugSupporterEffectOverride(supporterKey);
        supporter?.setRuntimeOverrides?.(debugOverride);
    }

    repositionPlayerForCurrentMap() {
        if (!this.player || !this.mapManager) return;
        const { width, height } = this.mapManager.getMapSize();
        if (!width || !height) return;
        const x = width / 2;
        const y = height / 2;
        this.player.setPosition(x, y);
        this.player.setVelocity(0, 0);
        this.player.setVisible(true);
        this.player.setActive(true);
        this.player.setDepth(1000);
        this.children.bringToTop(this.player);
        this.player.body?.reset?.(x, y);
        this.player.body?.updateFromGameObject?.();
    }

    setSelectedSupporterKey(supporterKey = null) {
        const nextSupporterKey = supporterKey && SUPPORTER_CONFIG[supporterKey] ? supporterKey : null;
        this.selectedSupporterKey = nextSupporterKey;
        this.registry.set('selectedSupporterKey', nextSupporterKey);
        if (this.player) {
            this.player.selectedSupporterKey = nextSupporterKey;
        }
        this.supporterSystem?.syncPlayerSupporter?.(this.player, nextSupporterKey);
        if (this.debugMode) {
            this.setupDebugMenu();
        }
    }

    switchCharacter(characterKey) {
        const config = CHARACTER_CONFIG[characterKey];
        if (!config) return;
        this.activeCharacterKey = characterKey;
        const runState = this.getPrimaryRunState();
        if (runState) {
            runState.characterKey = characterKey;
        }
        this.registry.set('selectedCharacterKey', characterKey);
        const defaultSkill = config.defaultSkill ?? 'thunder';
        const chosenSkill = this.player?.setCharacter?.(characterKey) ?? defaultSkill;
        if (this.player) {
            this.player.selectedSupporterKey = this.selectedSupporterKey;
        }
        this.supporterSystem?.syncPlayerSupporter?.(this.player, this.selectedSupporterKey);
        this.applyDebugPlayerSpeedOverride();
        this.applyDebugPlayerHealthOverride();
        this.ensureDefaultSkillInventoryEntry(this.player, runState, characterKey);
        this.activeSkillKeys = [chosenSkill];
        this.activeSkillKey = chosenSkill;
        this.debugSkillEffectTargetKey = chosenSkill;
        this.applyDebugSkillEffectOverride(chosenSkill);
        Object.entries(this.characterInputs ?? {}).forEach(([key, input]) => {
            input.checked = key === characterKey;
        });
        if (this.player) {
            if (characterKey !== 'radian') {
                this.clearGhostSummons(this.player);
            } else {
                this.ensureGhostSummons(this.player);
            }
        }
        if (this.debugMode) {
            this.setupDebugMenu();
        }
    }

    updateEnemyCountDisplay() {
        if (!this.enemyCountDisplay) return;
        const enemies = this.enemies ? this.enemies.getChildren() : [];
        const activeCount = enemies.filter(enemy => enemy && enemy.active).length;
        this.enemyCountDisplay.textContent = `Enemies on map: ${activeCount}`;
    }

    applyDebugPlayerSpeedOverride() {
        if (!this.player?.active) return;
        const overrideSpeed = Math.max(0, Math.round(this.debugPlayerSpeedOverride ?? 0));
        if (overrideSpeed <= 0) {
            this.player.updateSpeedFromConfig?.();
            return;
        }
        this.player.speed = overrideSpeed;
    }

    applyDebugPlayerHealthOverride() {
        if (!this.player?.active) return;
        const baseHealthFromConfig = this.player.characterStats?.hp ?? this.player.characterConfig?.hp ?? this.player.maxHealth ?? 1;
        const baseMaxHealth = Math.max(
            1,
            Math.round((baseHealthFromConfig * (1 + (this.player.bonusMaxHealthPercent ?? 0))) + (this.player.bonusMaxHealthFlat ?? 0))
        );
        const overrideHp = Math.max(0, Math.round(this.debugPlayerHealthOverride ?? 0));
        const nextMaxHealth = overrideHp > 0 ? overrideHp : baseMaxHealth;
        const previousMaxHealth = Math.max(this.player.maxHealth ?? nextMaxHealth, 1);
        const healthRatio = Phaser.Math.Clamp((this.player.health ?? nextMaxHealth) / previousMaxHealth, 0, 1);
        this.player.maxHealth = nextMaxHealth;
        this.player.health = Phaser.Math.Clamp(Math.round(nextMaxHealth * healthRatio), 0, nextMaxHealth);
        this.player.displayedHealth = this.player.health;
    }

    applyDebugEnemyHealthOverride(enemy, options = {}) {
        if (!enemy?.active || typeof enemy.applyRuntimeStats !== 'function') return;
        const baseStats = enemy.baseStats ?? enemy.currentStats ?? null;
        const baseMaxHealth = Math.max(1, Math.round(baseStats?.maxHealth ?? enemy.maxHealth ?? 1));
        const overrideHp = Math.max(0, Math.round(this.debugEnemyHealthOverride ?? 0));
        const nextMaxHealth = overrideHp > 0 ? overrideHp : baseMaxHealth;
        enemy.applyRuntimeStats({
            maxHealth: nextMaxHealth,
            damage: enemy.currentStats?.damage ?? enemy.damage,
            speed: enemy.currentStats?.speed ?? enemy.speed,
            scale: enemy.currentStats?.scale ?? enemy.scaleSize ?? 1,
            knockbackResist: enemy.currentStats?.knockbackResist ?? enemy.knockbackResist ?? 1,
            stunResist: enemy.currentStats?.stunResist ?? enemy.stunResist ?? 1
        }, {
            preserveHealthRatio: options.preserveHealthRatio !== false
        });
    }

    applyDebugEnemyHealthOverrideToAllEnemies() {
        const enemies = this.enemies?.getChildren?.() ?? [];
        enemies.forEach((enemy) => this.applyDebugEnemyHealthOverride(enemy, { preserveHealthRatio: true }));
    }

    spawnEnemyAtPosition(x, y, enemyType, options = {}) {
        const ignoreSpawnCap = options.ignoreSpawnCap === true;
        if (!enemyType || (!ignoreSpawnCap && !this.canSpawnMoreEnemies())) return null;
        const enemy = createEnemyInstance(this, x, y, enemyType, options);
        enemy.isBoss = Boolean(options.isBoss ?? options.waveSpawnEntry?.isBoss ?? enemy.isBoss);
        enemy.isMiniBoss = Boolean(options.isMiniBoss ?? options.waveSpawnEntry?.isMiniBoss ?? enemy.isMiniBoss);
        enemy.syncCollisionBodyTraits?.();
        enemy.countsTowardWave = options.countsTowardWave === true;
        enemy.waveNumber = enemy.countsTowardWave ? (options.waveNumber ?? this.currentWaveNumber) : null;
        enemy.waveSpawnEntry = options.waveSpawnEntry ? {
            enemyType: options.waveSpawnEntry.enemyType ?? enemyType,
            statsOverride: options.waveSpawnEntry.statsOverride ? { ...options.waveSpawnEntry.statsOverride } : null,
            isBoss: Boolean(options.waveSpawnEntry.isBoss),
            isMiniBoss: Boolean(options.waveSpawnEntry.isMiniBoss)
        } : null;
        const healthMultiplier = getScenarioEnemyHealthMultiplier(this, this.stageScenario);
        if (healthMultiplier !== 1 && !enemy.isFinalBoss) {
            enemy.applyRuntimeStats?.({
                maxHealth: Math.max(1, Math.round((enemy.maxHealth ?? 1) * healthMultiplier)),
                damage: enemy.damage,
                speed: enemy.speed,
                scale: enemy.scaleSize ?? 1
            }, { preserveHealthRatio: false });
            enemy.captureBaseStats?.();
        }
        if (options.statsOverride && typeof enemy.applyRuntimeStats === 'function') {
            enemy.applyRuntimeStats({
                maxHealth: options.statsOverride.maxHealth ?? enemy.maxHealth,
                damage: options.statsOverride.damage ?? enemy.damage,
                speed: options.statsOverride.speed ?? enemy.speed,
                scale: options.statsOverride.scale ?? enemy.scaleSize ?? 1,
                armor: options.statsOverride.armor ?? enemy.armor,
                effectResist: options.statsOverride.effectResist ?? enemy.effectResist,
                attackCooldown: options.statsOverride.attackCooldown ?? enemy.attackCooldown,
                attackRange: options.statsOverride.attackRange ?? enemy.attackRange,
                knockbackResist: options.statsOverride.knockbackResist ?? enemy.knockbackResist,
                stunResist: options.statsOverride.stunResist ?? enemy.stunResist,
                ghostDuration: options.statsOverride.ghostDuration ?? enemy.ghostDuration
            }, { preserveHealthRatio: false });
            enemy.captureBaseStats?.();
        }
        this.applyDebugEnemyHealthOverride(enemy, { preserveHealthRatio: false });
        this.enemies.add(enemy);
        this.add.existing(enemy);
        this.mapManager.enableObjectCollisions(enemy);
        if (enemy?.setHealthVisible) {
            enemy.setHealthVisible(this.showEnemyHP);
        }
        if (options.chestSpawned) {
            const chestSpawnTint = options.chestSpawnHighlightTint ?? 0xb06cff;
            enemy.applyStatusHighlight?.(chestSpawnTint);
            enemy.setTint?.(chestSpawnTint);
            this.cameras?.main?.shake?.(110, 0.003);
            this.skillBehaviorPipeline?.effects?.spawnExplosion?.(enemy.x, enemy.y, (enemy.depth ?? 20) + 2, {
                coreRadius: 8,
                outerRadius: 18,
                ringRadius: 30,
                coreColor: 0xf4d8ff,
                outerColor: 0xb06cff,
                ringColor: 0x7b2cbf,
                emberColor: 0xd6a8ff,
                emberCount: 8,
                emberDistance: { min: 8, max: 24 },
                emberDuration: { min: 140, max: 260 }
            });
        }
        return enemy;
    }

    spawnRandomEnemy(type, options = {}) {
        const enemyType = type || this.pickEnemyTypeForSpawn();
        if (!enemyType) return;
        const view = this.cameras.main.worldView;
        const padding = SPAWN_PADDING;
        let x;
        let y;
        const side = Phaser.Math.Between(0, 3);
        switch (side) {
            case 0: // top
                x = Phaser.Math.Between(view.left - padding, view.right + padding);
                y = view.top - padding;
                break;
            case 1: // right
                x = view.right + padding;
                y = Phaser.Math.Between(view.top - padding, view.bottom + padding);
                break;
            case 2: // bottom
                x = Phaser.Math.Between(view.left - padding, view.right + padding);
                y = view.bottom + padding;
                break;
            default: // left
                x = view.left - padding;
                y = Phaser.Math.Between(view.top - padding, view.bottom + padding);
                break;
        }
        const enemy = this.spawnEnemyAtPosition(x, y, enemyType, options);
        if (enemy?.countsTowardWave) {
            this.waveSpawnRemaining = Math.max(0, this.waveSpawnRemaining - 1);
        }
    }

    resetWaveProgress(waveNumber = 1) {
        this.currentWaveNumber = Phaser.Math.Clamp(Math.round(waveNumber), 1, this.maxWaveCount);
        this.currentWaveConfig = Array.isArray(this.stageScenario?.wavePlans)
            ? (this.stageScenario.wavePlans[this.currentWaveNumber - 1] ?? null)
            : null;
        this.currentWavePlan = this.buildWavePlanEntries(this.currentWaveNumber);
        this.currentWaveDurationSeconds = getScenarioWaveDurationSeconds(this.stageScenario, this.currentWaveNumber, 45);
        this.currentWaveElapsedMs = 0;
        this.waveEnemyCount = this.currentWavePlan.length || ENEMIES_PER_WAVE;
        this.waveSpawnQueue = this.currentWavePlan.map((entry) => ({
            enemyType: entry.enemyType,
            statsOverride: entry.statsOverride ? { ...entry.statsOverride } : null,
            isBoss: Boolean(entry.isBoss),
            isMiniBoss: Boolean(entry.isMiniBoss)
        }));
        this.waveSpawnRemaining = this.waveEnemyCount;
        this.waveKillCount = 0;
        this.waveShopPending = false;
        this.respawnPool = 0;
        this.waveStartPending = false;
        this.waveEnding = false;
    }

    scheduleWaveStart() {
        if (!this.waveSystemEnabled || this.isGameOver || this.isRunComplete) return;
        this.waveStartDelayTimer?.remove?.(false);
        this.waveStartPending = true;
        this.spawnTimer = 0;
        this.scene.get('HudScene')?.showWaveAnnouncement?.({
            waveNumber: this.currentWaveNumber,
            durationMs: Math.max(700, WAVE_START_DELAY_MS - 250)
        });
        this.waveStartDelayTimer = this.time.delayedCall(WAVE_START_DELAY_MS, () => {
            this.waveStartDelayTimer = null;
            if (!this.waveSystemEnabled || this.isGameOver || this.isRunComplete || this.isShopOpen) {
                this.waveStartPending = false;
                return;
            }
            this.waveStartPending = false;
            this.currentWaveElapsedMs = 0;
            this.spawnWaveBurst(INITIAL_WAVE_SPAWN_BURST);
        });
    }

    spawnWaveBurst(count = INITIAL_WAVE_SPAWN_BURST) {
        const spawnCount = Math.min(
            Math.max(0, Math.round(count)),
            this.waveSpawnRemaining,
            Math.max(0, this.maxEnemiesOnMap - (this.enemies?.countActive?.(true) ?? 0))
        );
        for (let index = 0; index < spawnCount; index += 1) {
            this.spawnNextWaveEnemy();
        }
    }

    buildWavePlanEntries(waveNumber = this.currentWaveNumber) {
        const scenarioWavePlan = getScenarioWavePlan(this.stageScenario, waveNumber);
        if (!Array.isArray(scenarioWavePlan) || !scenarioWavePlan.length) {
            return [];
        }
        const hasWeightedEntries = scenarioWavePlan.some((group) => (
            Number.isFinite(group?.weight) && (group.weight ?? 0) > 0
        ));
        if (hasWeightedEntries) {
            return this.buildWeightedWavePlanEntries(scenarioWavePlan);
        }
        const entries = [];
        scenarioWavePlan.forEach((group) => {
            const count = Math.max(0, Math.round(group?.count ?? 0));
            const enemyType = group?.enemyType;
            if (!enemyType || count <= 0) return;
            for (let index = 0; index < count; index += 1) {
                entries.push({
                    enemyType,
                    statsOverride: group?.statsOverride ? { ...group.statsOverride } : null,
                    isBoss: Boolean(group?.isBoss),
                    isMiniBoss: Boolean(group?.isMiniBoss)
                });
            }
        });
        return entries;
    }

    buildWeightedWavePlanEntries(scenarioWavePlan = []) {
        const weightedGroups = scenarioWavePlan
            .map((group) => ({
                enemyType: group?.enemyType ?? null,
                remaining: Math.max(0, Math.round(group?.count ?? 0)),
                weight: Math.max(0, Number(group?.weight ?? 0) || 0),
                statsOverride: group?.statsOverride ? { ...group.statsOverride } : null,
                isBoss: Boolean(group?.isBoss),
                isMiniBoss: Boolean(group?.isMiniBoss)
            }))
            .filter((group) => group.enemyType && group.remaining > 0);

        const totalEntries = weightedGroups.reduce((sum, group) => sum + group.remaining, 0);
        const entries = [];

        while (entries.length < totalEntries) {
            const availableGroups = weightedGroups.filter((group) => group.remaining > 0);
            if (!availableGroups.length) break;
            const totalWeight = availableGroups.reduce((sum, group) => {
                return sum + Math.max(0, group.weight > 0 ? group.weight : 1);
            }, 0);
            let roll = Math.random() * Math.max(totalWeight, 1);
            let selectedGroup = availableGroups[availableGroups.length - 1];

            for (const group of availableGroups) {
                roll -= Math.max(0, group.weight > 0 ? group.weight : 1);
                if (roll <= 0) {
                    selectedGroup = group;
                    break;
                }
            }

            selectedGroup.remaining -= 1;
            entries.push({
                enemyType: selectedGroup.enemyType,
                statsOverride: selectedGroup.statsOverride ? { ...selectedGroup.statsOverride } : null,
                isBoss: selectedGroup.isBoss,
                isMiniBoss: selectedGroup.isMiniBoss
            });
        }

        return entries;
    }

    spawnNextWaveEnemy() {
        if (!this.waveSystemEnabled || this.waveSpawnRemaining <= 0 || !this.canSpawnMoreEnemies()) return null;
        const nextEntry = this.waveSpawnQueue.shift?.() ?? null;
        if (nextEntry?.enemyType) {
            return this.spawnRandomEnemy(nextEntry.enemyType, {
                countsTowardWave: true,
                waveNumber: this.currentWaveNumber,
                statsOverride: nextEntry.statsOverride,
                isBoss: nextEntry.isBoss,
                isMiniBoss: nextEntry.isMiniBoss,
                waveSpawnEntry: nextEntry
            });
        }
        return this.spawnRandomEnemy(null, { countsTowardWave: true, waveNumber: this.currentWaveNumber });
    }

    requeueWaveEnemy(enemy) {
        if (!enemy?.waveSpawnEntry || !Array.isArray(this.waveSpawnQueue)) return;
        this.waveSpawnQueue.unshift({
            enemyType: enemy.waveSpawnEntry.enemyType,
            statsOverride: enemy.waveSpawnEntry.statsOverride ? { ...enemy.waveSpawnEntry.statsOverride } : null,
            isBoss: Boolean(enemy.waveSpawnEntry.isBoss),
            isMiniBoss: Boolean(enemy.waveSpawnEntry.isMiniBoss)
        });
    }

    isCurrentWaveCleared() {
        if (!this.waveSystemEnabled || this.waveEnding) return false;
        const activeWaveEnemies = (this.enemies?.getChildren?.() ?? []).filter((enemy) => {
            return enemy?.active
                && !enemy?.isDead
                && enemy?.countsTowardWave
                && enemy?.waveNumber === this.currentWaveNumber;
        });
        if (this.currentWaveConfig?.clearWhenBossesDefeated) {
            const activeWaveBosses = activeWaveEnemies.filter((enemy) => enemy?.isBoss || enemy?.isMiniBoss || enemy?.isFinalBoss);
            const queuedWaveBosses = (this.waveSpawnQueue ?? []).filter((entry) => {
                return Boolean(entry?.isBoss || entry?.isMiniBoss);
            });
            return activeWaveBosses.length === 0 && queuedWaveBosses.length === 0;
        }
        return this.waveKillCount >= this.waveEnemyCount
            && this.waveSpawnRemaining <= 0
            && activeWaveEnemies.length === 0;
    }

    canSpawnChestEnemyReward() {
        if (!this.waveSystemEnabled) return true;
        if (this.waveStartPending || this.waveEnding || this.waveShopPending || this.isShopOpen || this.isRunComplete || this.isGameOver) {
            return false;
        }
        return this.getCurrentWaveRemainingMs() > 5000;
    }

    hasCurrentWaveTimedOut() {
        if (!this.waveSystemEnabled || this.waveStartPending || this.waveEnding) return false;
        return this.getCurrentWaveRemainingMs() <= 0;
    }

    getCurrentWaveRemainingMs() {
        const durationMs = Math.max(0, Math.round((this.currentWaveDurationSeconds ?? 0) * 1000));
        if (durationMs <= 0) return 0;
        return Math.max(0, durationMs - Math.max(0, this.currentWaveElapsedMs ?? 0));
    }

    clearActiveWaveEnemies() {
        const activeEnemies = this.enemies?.getChildren?.() ?? [];
        activeEnemies.forEach((enemy) => {
            if (!enemy?.active || enemy?.isDead) return;
            if (!enemy.countsTowardWave || enemy.waveNumber !== this.currentWaveNumber) return;
            enemy.countsTowardWave = false;
            enemy.destroy();
        });
        this.respawnPool = 0;
    }

    clearActiveWaveLoot() {
        this.lootSystem?.clearGroundItems?.();
    }

    clearTimedOutWaveRemnants() {
        this.waveSpawnRemaining = 0;
        this.waveSpawnQueue = [];
        this.spawnTimer = 0;
        this.respawnPool = 0;
        this.clearAllActiveEnemiesAndProjectiles();
        this.clearActiveWaveLoot();
    }

    endCurrentWave(reason = 'cleared') {
        if (!this.waveSystemEnabled || this.waveEnding || this.waveShopPending || this.isShopOpen || this.isRunComplete) return;
        this.waveEnding = true;
        this.waveSpawnRemaining = 0;
        this.waveSpawnQueue = [];
        this.waveKillCount = this.waveEnemyCount;
        if (reason === 'timeout') {
            this.clearTimedOutWaveRemnants();
            this.time.delayedCall(0, () => {
                if (!this.scene.isActive('MainScene') || !this.waveEnding) return;
                this.clearTimedOutWaveRemnants();
            });
            this.time.delayedCall(50, () => {
                if (!this.scene.isActive('MainScene') || !this.waveEnding) return;
                this.clearTimedOutWaveRemnants();
            });
        }
        this.handleWaveCleared();
    }

    handleWaveCleared() {
        if (!this.waveSystemEnabled || this.waveShopPending || this.isShopOpen || this.isRunComplete) return;
        if (this.currentWaveNumber >= this.maxWaveCount) {
            this.handleRunVictory();
            return;
        }
        this.waveShopPending = true;
        this.waveShopDelayTimer?.remove?.(false);
        this.waveShopDelayTimer = this.time.delayedCall(2000, () => {
            this.waveShopDelayTimer = null;
            if (!this.waveSystemEnabled || this.isShopOpen || this.isRunComplete || this.isGameOver) {
                this.waveShopPending = false;
                return;
            }
            if (!this.waveEnding && !this.isCurrentWaveCleared()) {
                this.waveShopPending = false;
                return;
            }
            if (this.shouldPresentSupporterSelection()) {
                this.presentSupporterSelection();
                return;
            }
            if (this.shouldPresentPreShopCardSelection()) {
                this.presentPreShopCardSelection();
                return;
            }
            this.presentShopOverlay('wave_clear');
        });
    }

    handleRunVictory() {
        if (this.isRunComplete || this.isGameOver) return;
        this.isRunComplete = true;
        this.waveShopPending = false;
        this.resetTouchMoveState();
        this.physics.world.pause();
        this.scene.pause('HudScene');
        const elapsedMs = this.getTotalRunMs();
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        const victoryPayload = {
            timeSurvived: `${minutes}:${seconds}`,
            enemiesKilled: this.killCount ?? 0,
            levelReached: this.player?.level ?? 1
        };
        this.time.delayedCall(800, () => {
            if (!this.scene.isActive('MainScene')) return;
            this.scene.launch('VictoryScene', victoryPayload);
            this.scene.pause();
        });
    }

    handleEnemyDeath({ enemy, source }) {
        if (!enemy) return;
        playSfx(this, 'sfx_enemy_kill', { volume: 0.25 });
        const ownerContext = this.getSourceOwnerContext(source);
        const ownerRunState = ownerContext.runState;
        if (ownerRunState) {
            ownerRunState.killCount = (ownerRunState.killCount ?? 0) + 1;
        }
        if (enemy.countsTowardWave) {
            this.waveKillCount = Math.min(this.waveEnemyCount, this.waveKillCount + 1);
        }
        if (this.isCurrentWaveCleared()) {
            this.endCurrentWave('cleared');
        }
    }

    handlePauseToggle(event) {
        if (this.isGameOver || this.isChoosingCard || this.isChoosingSupporter || this.isShopOpen) return;
        if (this.scene.isActive('PauseMenuScene')) return;
        event?.preventDefault?.();
        this.resetTouchMoveState();
        this.physics.world.pause();
        this.scene.pause('HudScene');
        this.scene.launch('PauseMenuScene');
        this.scene.pause();
    }

    shouldProcessEnemyCollision(enemyA, enemyB) {
        if (!enemyA?.active || !enemyB?.active) return false;
        if (enemyA === enemyB) return false;
        if (enemyA.isDashAttacking || enemyB.isDashAttacking) {
            return false;
        }
        return true;
    }

    quitToMainMenu() {
        if (this.isTransitioningToMenu) return;
        this.isTransitioningToMenu = true;
        this.resetTouchMoveState();
        this.physics?.world?.resume?.();
        this.scene.stop('HudScene');
        this.scene.stop('PauseMenuScene');
        this.time.delayedCall(0, () => {
            if (!this.scene.isActive('MainScene') && !this.scene.isPaused('MainScene')) {
                return;
            }
            this.scene.start('MainMenuScene');
        });
    }

    syncMapMusic(mapDef) {
        const nextMusicKey = mapDef?.music?.key ?? null;
        const musicEnabled = isMusicEnabled(this);
        const canPlayNextMusic = Boolean(nextMusicKey && this.cache.audio.exists(nextMusicKey) && musicEnabled && isAudioUnlocked(this));

        if (!canPlayNextMusic) {
            if (this.currentMapMusic) {
                this.currentMapMusic.stop();
                this.currentMapMusic.destroy();
                this.currentMapMusic = null;
                this.currentMapMusicKey = null;
            }
            return;
        }

        if (this.currentMapMusicKey === nextMusicKey && this.currentMapMusic) {
            if (!this.currentMapMusic.isPlaying) {
                this.currentMapMusic.play();
            }
            return;
        }

        if (this.currentMapMusic) {
            this.currentMapMusic.stop();
            this.currentMapMusic.destroy();
            this.currentMapMusic = null;
            this.currentMapMusicKey = null;
        }
        this.currentMapMusic = this.sound.add(nextMusicKey, {
            loop: mapDef?.music?.loop ?? true,
            volume: mapDef?.music?.volume ?? 0.4
        });
        this.currentMapMusic.play();
        this.currentMapMusicKey = nextMusicKey;
    }

    shutdown() {
        this.waveShopDelayTimer?.remove?.(false);
        this.waveShopDelayTimer = null;
        this.waveStartDelayTimer?.remove?.(false);
        this.waveStartDelayTimer = null;
        this.clearPlayerInteractionBindings();
        this.input.keyboard.off('keydown-ESC', this.handlePauseToggle, this);
        this.input.keyboard.off('keydown', this.handleCardNavigation, this);
        this.input.off('pointerdown', this.handleTouchPointerDown, this);
        this.input.off('pointermove', this.handleTouchPointerMove, this);
        this.input.off('pointerup', this.handleTouchPointerUp, this);
        this.input.off('pointerupoutside', this.handleTouchPointerUp, this);
        this.events.off('enemy-dead', this.handleEnemyDeath, this);
        this.audioUnlockCleanup?.();
        this.audioUnlockCleanup = null;
        const panel = document.getElementById('debug-panel');
        if (panel) {
            panel.style.display = 'none';
        }
        if (this.currentMapMusic) {
            this.currentMapMusic.stop();
            this.currentMapMusic.destroy();
            this.currentMapMusic = null;
            this.currentMapMusicKey = null;
        }
        this.time?.removeAllEvents?.();
        this.playerHitEffect?.destroy?.();
        this.playerHitEffect = null;
        this.cameraFollowTarget?.destroy?.();
        this.cameraFollowTarget = null;
        this.skills?.destroy?.(true);
        this.skills = null;
        this.enemyProjectiles?.destroy?.(true);
        this.enemyProjectiles = null;
        this.enemies?.destroy?.(true);
        this.enemies = null;
        this.separationZones?.destroy?.(true);
        this.separationZones = null;
        this.lootSystem?.itemGroup?.destroy?.(true);
        this.lootSystem = null;
        this.statusEffectSystem?.destroy?.();
        this.statusEffectSystem = null;
        this.mapManager?.clearMap?.();
        this.supporterSystem?.destroy?.();
        this.supporterSystem = null;
    }

    setupTouchControls() {
        this.touchControlsEnabled = Boolean(this.sys.game.device.input.touch);
        this.touchMoveState = {
            active: false,
            pointerId: null,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deadzone: 12,
            maxDistance: 64
        };
        if (!this.touchControlsEnabled) return;
        this.input.on('pointerdown', this.handleTouchPointerDown, this);
        this.input.on('pointermove', this.handleTouchPointerMove, this);
        this.input.on('pointerup', this.handleTouchPointerUp, this);
        this.input.on('pointerupoutside', this.handleTouchPointerUp, this);
    }

    handleTouchPointerDown(pointer) {
        if (!this.touchControlsEnabled || !pointer) return;
        if (!pointer.wasTouch && !pointer.pointerType?.includes?.('touch')) return;
        if (this.touchMoveState?.active) return;
        const hudScene = this.scene.get('HudScene');
        if (hudScene?.isPointOverHud?.(pointer.x, pointer.y)) return;

        this.touchMoveState.active = true;
        this.touchMoveState.pointerId = pointer.id;
        this.touchMoveState.startX = pointer.x;
        this.touchMoveState.startY = pointer.y;
        this.touchMoveState.currentX = pointer.x;
        this.touchMoveState.currentY = pointer.y;
    }

    handleTouchPointerMove(pointer) {
        if (!this.touchControlsEnabled || !pointer) return;
        if (!this.touchMoveState?.active || this.touchMoveState.pointerId !== pointer.id) return;
        this.touchMoveState.currentX = pointer.x;
        this.touchMoveState.currentY = pointer.y;
    }

    handleTouchPointerUp(pointer) {
        if (!this.touchControlsEnabled || !pointer) return;
        if (!this.touchMoveState?.active || this.touchMoveState.pointerId !== pointer.id) return;
        this.resetTouchMoveState();
    }

    resetTouchMoveState() {
        if (!this.touchMoveState) return;
        this.touchMoveState.active = false;
        this.touchMoveState.pointerId = null;
        this.touchMoveState.currentX = this.touchMoveState.startX;
        this.touchMoveState.currentY = this.touchMoveState.startY;
    }

    getTouchMoveVector() {
        if (!this.touchControlsEnabled || !this.touchMoveState?.active) {
            return { x: 0, y: 0, magnitude: 0, active: false };
        }
        const dx = this.touchMoveState.currentX - this.touchMoveState.startX;
        const dy = this.touchMoveState.currentY - this.touchMoveState.startY;
        const vector = new Phaser.Math.Vector2(dx, dy);
        const distance = vector.length();
        if (distance <= this.touchMoveState.deadzone) {
            return { x: 0, y: 0, magnitude: 0, active: true };
        }
        vector.normalize();
        const magnitude = Phaser.Math.Clamp(distance / this.touchMoveState.maxDistance, 0, 1);
        return { x: vector.x, y: vector.y, magnitude, active: true };
    }

    getSpawnEdgePosition() {
        const view = this.cameras.main.worldView;
        const padding = SPAWN_PADDING;
        const side = Phaser.Math.Between(0, 3);
        let x;
        let y;
        switch (side) {
            case 0:
                x = Phaser.Math.Between(view.left - padding, view.right + padding);
                y = view.top - padding;
                break;
            case 1:
                x = view.right + padding;
                y = Phaser.Math.Between(view.top - padding, view.bottom + padding);
                break;
            case 2:
                x = Phaser.Math.Between(view.left - padding, view.right + padding);
                y = view.bottom + padding;
                break;
            default:
                x = view.left - padding;
                y = Phaser.Math.Between(view.top - padding, view.bottom + padding);
                break;
        }
        return { x, y };
    }

    spawnEnemyNearPlayer(type, distance = 120, options = {}) {
        if (!this.player || !type) return;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const x = this.player.x + Math.cos(angle) * distance;
        const y = this.player.y + Math.sin(angle) * distance;
        this.spawnEnemyAtPosition(x, y, type, options);
    }

    pickEnemyTypeForSpawn() {
        const spawnOptions = this.getSpawnableEnemyTypes();
        if (!spawnOptions.length) return null;
        const randomIndex = Phaser.Math.Between(0, spawnOptions.length - 1);
        return spawnOptions[randomIndex][0];
    }

    getSpawnableEnemyTypes() {
        const unlockedEnemyTypes = getUnlockedEnemyTypes(this, this.stageScenario);
        return Object.entries(ENEMIES).filter(([type, cfg]) => {
            const enabled = this.debugMode
                ? (this.enemySpawnStatus[type] ?? false)
                : true;
            const isUnlocked = this.debugMode
                ? true
                : (unlockedEnemyTypes ? unlockedEnemyTypes.has(type) : true);
            return enabled && isUnlocked;
        });
    }

    updateCardFocus() {}

    clearCardFocus() {
        this.levelUpCards = [];
        this.cardFocusIndex = 0;
        this.keyboardNavigationActive = false;
    }

    shouldPresentSupporterSelection() {
        return this.waveSystemEnabled
            && this.currentWaveNumber === 3
            && !this.selectedSupporterKey
            && !this.isChoosingSupporter;
    }

    shouldPresentPreShopCardSelection() {
        return this.waveSystemEnabled
            && !this.isChoosingCard
            && !this.isGameOver
            && !this.isShopOpen;
    }

    getRandomSupporterChoices(count = 4) {
        const supporterKeys = Phaser.Utils.Array.Shuffle([...SUPPORTER_KEYS]);
        return supporterKeys.slice(0, Math.max(1, Math.min(count, supporterKeys.length)));
    }

    getRandomPreShopCardChoices(count = 4) {
        return getRandomPreShopCards(count, this.currentWaveNumber);
    }

    presentSupporterSelection() {
        if (this.isChoosingSupporter || this.isGameOver) return;
        this.supporterSelectionRerollsRemaining = SUPPORTER_SELECTION_MAX_REROLLS;
        const choices = this.getRandomSupporterChoices(4);
        if (!choices.length) {
            this.presentShopOverlay('wave_clear');
            return;
        }
        this.isChoosingSupporter = true;
        this.beginLevelUpTimerPause();
        this.player?.setVelocity?.(0, 0);
        this.physics.world.pause();
        this.resetTouchMoveState();
        const hudScene = this.scene.get('HudScene');
        hudScene?.showSupporterSelection?.({
            supporterKeys: choices,
            gold: Math.max(0, Math.floor(this.player?.gold ?? 0)),
            rerollCost: SUPPORTER_SELECTION_REROLL_COST,
            rerollRemaining: this.supporterSelectionRerollsRemaining,
            onSelect: (supporterKey) => this.onSupporterSelected(supporterKey),
            onReroll: () => this.rerollSupporterSelection()
        });
    }

    rerollSupporterSelection() {
        if (!this.isChoosingSupporter || !this.player) return;
        if ((this.supporterSelectionRerollsRemaining ?? 0) <= 0) return;
        if (!this.player.spendGold?.(SUPPORTER_SELECTION_REROLL_COST)) return;
        this.supporterSelectionRerollsRemaining = Math.max(0, (this.supporterSelectionRerollsRemaining ?? 0) - 1);
        const choices = this.getRandomSupporterChoices(4);
        const hudScene = this.scene.get('HudScene');
        hudScene?.showSupporterSelection?.({
            supporterKeys: choices,
            gold: Math.max(0, Math.floor(this.player?.gold ?? 0)),
            rerollCost: SUPPORTER_SELECTION_REROLL_COST,
            rerollRemaining: this.supporterSelectionRerollsRemaining,
            onSelect: (supporterKey) => this.onSupporterSelected(supporterKey),
            onReroll: () => this.rerollSupporterSelection()
        });
    }

    onSupporterSelected(supporterKey = null) {
        if (!this.isChoosingSupporter) return;
        this.isChoosingSupporter = false;
        this.supporterSelectionRerollsRemaining = 0;
        this.endLevelUpTimerPause();
        this.scene.get('HudScene')?.hideSupporterSelection?.();
        this.setSelectedSupporterKey(supporterKey);
        if (this.physics.world.isPaused) {
            this.physics.world.resume();
        }
        this.time.delayedCall(0, () => {
            if (!this.isGameOver && !this.isShopOpen) {
                if (this.shouldPresentPreShopCardSelection()) {
                    this.presentPreShopCardSelection();
                    return;
                }
                this.presentShopOverlay('wave_clear');
            }
        });
    }

    presentPreShopCardSelection() {
        if (this.isChoosingCard || this.isGameOver || this.isShopOpen) return;
        const cards = this.getRandomPreShopCardChoices(4);
        if (!cards.length) {
            this.presentShopOverlay('wave_clear');
            return;
        }
        this.isChoosingCard = true;
        this.preShopCardSelectionRerollsRemaining = PRE_SHOP_CARD_SELECTION_MAX_REROLLS;
        this.beginLevelUpTimerPause();
        this.player?.setVelocity?.(0, 0);
        this.lootSystem?.clearGroundItems?.();
        this.clearAllActiveEnemiesAndProjectiles();
        this.physics.world.pause();
        this.resetTouchMoveState();
        const hudScene = this.scene.get('HudScene');
        hudScene?.showPreShopCardSelection?.({
            cards,
            gold: Math.max(0, Math.floor(this.player?.gold ?? 0)),
            rerollCost: PRE_SHOP_CARD_SELECTION_REROLL_COST,
            rerollRemaining: this.preShopCardSelectionRerollsRemaining,
            onSelect: (cardConfig) => this.onPreShopCardSelected(cardConfig),
            onReroll: () => this.rerollPreShopCardSelection()
        });
    }

    rerollPreShopCardSelection() {
        if (!this.isChoosingCard || !this.player) return;
        if ((this.preShopCardSelectionRerollsRemaining ?? 0) <= 0) return;
        if (!this.player.spendGold?.(PRE_SHOP_CARD_SELECTION_REROLL_COST)) return;
        this.preShopCardSelectionRerollsRemaining = Math.max(0, (this.preShopCardSelectionRerollsRemaining ?? 0) - 1);
        const cards = this.getRandomPreShopCardChoices(4);
        const hudScene = this.scene.get('HudScene');
        hudScene?.showPreShopCardSelection?.({
            cards,
            gold: Math.max(0, Math.floor(this.player?.gold ?? 0)),
            rerollCost: PRE_SHOP_CARD_SELECTION_REROLL_COST,
            rerollRemaining: this.preShopCardSelectionRerollsRemaining,
            onSelect: (cardConfig) => this.onPreShopCardSelected(cardConfig),
            onReroll: () => this.rerollPreShopCardSelection()
        });
    }

    onPreShopCardSelected(cardConfig = null) {
        if (!this.isChoosingCard) return;
        this.isChoosingCard = false;
        this.preShopCardSelectionRerollsRemaining = 0;
        this.endLevelUpTimerPause();
        this.scene.get('HudScene')?.hidePreShopCardSelection?.();
        if (cardConfig) {
            this.player?.applyCardEffect?.(cardConfig);
        }
        if (this.physics.world.isPaused) {
            this.physics.world.resume();
        }
        this.time.delayedCall(0, () => {
            if (!this.isGameOver && !this.isShopOpen) {
                this.presentShopOverlay('wave_clear');
            }
        });
    }

    handlePlayerDeath() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.resetTouchMoveState();
        this.physics.world.pause();
        this.scene.pause('HudScene');
        if (this.player?.active) {
            this.skillBehaviorPipeline?.effects?.spawnAshDissolve?.(this.player, (this.player.depth ?? 1000) + 2, {
                duration: 1850,
                riseDistance: 18,
                driftX: 6,
                particleCount: 18,
                particleSpreadX: 24,
                glowRadius: 22,
                glowAlpha: 0.28,
                spiritScale: 0.9,
                spiritAlpha: 0.6
            });
            this.player.body?.stop?.();
            if (this.player.body) {
                this.player.body.enable = false;
            }
            this.player.setVisible(false);
            this.player.setActive(false);
        }
        const elapsedMs = this.getTotalRunMs();
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        const gameOverPayload = {
            timeSurvived: `${minutes}:${seconds}`,
            enemiesKilled: this.killCount ?? 0,
            levelReached: this.player?.level ?? 1
        };
        this.time.delayedCall(2000, () => {
            if (!this.scene.isActive('MainScene')) return;
            this.scene.launch('GameOverScene', gameOverPayload);
            this.scene.pause();
        });
    }

    beginLevelUpTimerPause() {
        if (this.levelUpPauseStartedAt !== null) return;
        this.levelUpPauseStartedAt = this.time.now;
    }

    endLevelUpTimerPause() {
        if (this.levelUpPauseStartedAt === null) return;
        this.levelUpPausedDurationMs += Math.max(0, this.time.now - this.levelUpPauseStartedAt);
        this.levelUpPauseStartedAt = null;
    }

    beginShopTimerPause() {
        if (this.shopPauseStartedAt !== null) return;
        this.shopPauseStartedAt = this.time.now;
    }

    endShopTimerPause() {
        if (this.shopPauseStartedAt === null) return;
        this.shopPausedDurationMs += Math.max(0, this.time.now - this.shopPauseStartedAt);
        this.shopPauseStartedAt = null;
    }

    clearAllActiveEnemiesAndProjectilesPass() {
        const activeEnemies = this.enemies?.getChildren?.() ?? [];
        activeEnemies.forEach((enemy) => {
            if (!enemy?.active) return;
            enemy.countsTowardWave = false;
            enemy.destroy();
        });
        const activeProjectiles = this.enemyProjectiles?.getChildren?.() ?? [];
        activeProjectiles.forEach((projectile) => {
            if (!projectile?.active) return;
            projectile.destroy();
        });
        this.respawnPool = 0;
    }

    clearAllActiveEnemiesAndProjectiles() {
        this.clearAllActiveEnemiesAndProjectilesPass();
        this.time?.delayedCall?.(0, () => {
            if (!this.scene.isActive('MainScene')) return;
            this.clearAllActiveEnemiesAndProjectilesPass();
        });
    }

    presentShopOverlay(reason = 'manual') {
        if (this.isGameOver || this.isChoosingCard || this.isChoosingSupporter || this.isShopOpen) return;
        this.isShopOpen = true;
        this.shopOpenReason = reason;
        this.resetTouchMoveState();
        this.beginShopTimerPause();
        this.player?.setVelocity?.(0, 0);
        this.lootSystem?.clearGroundItems?.();
        this.clearAllActiveEnemiesAndProjectiles();
        if (this.player) {
            this.player.health = Math.max(0, Math.round(this.player.maxHealth ?? this.player.health ?? 0));
            this.player.displayedHealth = this.player.health;
        }
        this.physics.world.pause();
        if (reason === 'wave_clear') {
            this.prepareShopStockForNextWave();
        }
        this.ensureShopStock();
        const hudScene = this.scene.get('HudScene');
        hudScene?.showShopOverlay?.({
            ...this.buildShopOverlayState(),
            onContinue: () => this.continueFromShopOverlay(),
            onReroll: () => this.rerollShopStock(),
            onToggleLock: (item) => this.toggleShopItemLock(item?.id ?? item),
            onPurchase: (item) => this.purchaseShopItem(item?.id ?? item)
        });
    }

    continueFromShopOverlay() {
        if (!this.isShopOpen) return;
        this.isShopOpen = false;
        this.endShopTimerPause();
        const hudScene = this.scene.get('HudScene');
        hudScene?.hideShopOverlay?.();
        this.spawnTimer = 0;
        const shopReason = this.shopOpenReason;
        this.shopOpenReason = null;
        if (shopReason === 'wave_clear' && this.waveSystemEnabled) {
            this.waveShopPending = false;
            if (this.currentWaveNumber >= this.maxWaveCount) {
                this.isRunComplete = true;
            } else {
                this.resetWaveProgress(this.currentWaveNumber + 1);
                this.scheduleWaveStart();
            }
        }
        if (this.physics.world.isPaused) {
            this.physics.world.resume();
        }
    }

    getTotalRunMs() {
        const now = this.time.now;
        const baseElapsed = Math.max(0, now - (this.runStartTime ?? now));
        const activeLevelUpPauseElapsed = this.levelUpPauseStartedAt === null
            ? 0
            : Math.max(0, now - this.levelUpPauseStartedAt);
        const activeShopPauseElapsed = this.shopPauseStartedAt === null
            ? 0
            : Math.max(0, now - this.shopPauseStartedAt);
        return Math.max(
            0,
            baseElapsed
                - (this.levelUpPausedDurationMs ?? 0)
                - activeLevelUpPauseElapsed
                - (this.shopPausedDurationMs ?? 0)
                - activeShopPauseElapsed
        );
    }

    getElapsedRunMs() {
        return this.getTotalRunMs();
    }

    getWeightedCards() {
        return [];
    }

    getAvailableCardPool() {
        return [];
    }

    applySkillInventoryWeightBonus(cardConfig) {
        return cardConfig;
    }

    getInventoryKeyFromCard() {
        return null;
    }

    findStarterInventoryCardForSkill() {
        return null;
    }

    ensureDefaultSkillInventoryEntry() {}

    getInventoryMaxLevel() {
        return 1;
    }

    isCardAllowedByInventory() {
        return false;
    }

    addCardToInventory() {}

    ensureShopRunState(runState = null) {
        const resolvedRunState = runState ?? this.getPrimaryRunState();
        if (!resolvedRunState) return null;
        resolvedRunState.shopPurchasedItemIds = Array.isArray(resolvedRunState.shopPurchasedItemIds)
            ? resolvedRunState.shopPurchasedItemIds
            : [];
        resolvedRunState.shopPurchaseCounts = resolvedRunState.shopPurchaseCounts ?? {};
        resolvedRunState.shopPurchasedItems = Array.isArray(resolvedRunState.shopPurchasedItems)
            ? resolvedRunState.shopPurchasedItems
            : [];
        resolvedRunState.shopCurrentRerollCost = Math.max(0, Math.floor(resolvedRunState.shopCurrentRerollCost ?? SHOP_REROLL_COST));
        resolvedRunState.shopCurrentStockIds = Array.isArray(resolvedRunState.shopCurrentStockIds)
            ? resolvedRunState.shopCurrentStockIds
            : [];
        resolvedRunState.shopLockedItemIds = Array.isArray(resolvedRunState.shopLockedItemIds)
            ? resolvedRunState.shopLockedItemIds
            : [];
        resolvedRunState.shopEffectBonuses = resolvedRunState.shopEffectBonuses ?? {};
        resolvedRunState.shopSpecialFlags = resolvedRunState.shopSpecialFlags ?? {};
        return resolvedRunState;
    }

    getShopItemPurchaseCount(itemId, runState = null) {
        const resolvedRunState = this.ensureShopRunState(runState);
        if (!resolvedRunState || !itemId) return 0;
        return Math.max(0, Math.floor(resolvedRunState.shopPurchaseCounts?.[itemId] ?? 0));
    }

    getShopItemRuntimeCost(itemConfig, runState = null) {
        if (!itemConfig) return 0;
        const baseCost = Math.max(0, Math.floor(itemConfig.cost ?? 0));
        const purchaseCount = this.getShopItemPurchaseCount(itemConfig.id, runState);
        return Math.max(0, Math.round(baseCost * Math.pow(1.2, purchaseCount)));
    }

    hasReachedShopItemPurchaseLimit(itemConfig, runState = null) {
        if (!itemConfig?.id) return false;
        const maxPurchases = Number.isFinite(itemConfig.maxPurchases)
            ? Math.max(1, Math.floor(itemConfig.maxPurchases))
            : null;
        if (!maxPurchases) return false;
        return this.getShopItemPurchaseCount(itemConfig.id, runState) >= maxPurchases;
    }

    prepareShopStockForNextWave(playerOrId = null, runState = null) {
        const context = this.resolvePlayerRunContext(playerOrId, runState);
        const resolvedRunState = this.ensureShopRunState(context.runState);
        if (!resolvedRunState || this.debugMode) return;
        resolvedRunState.shopCurrentRerollCost = SHOP_REROLL_COST;
        const lockedSet = new Set(resolvedRunState.shopLockedItemIds ?? []);
        resolvedRunState.shopCurrentStockIds = (resolvedRunState.shopCurrentStockIds ?? [])
            .slice(0, 5)
            .map((itemId) => (itemId && lockedSet.has(itemId) ? itemId : null));
        resolvedRunState.shopLockedItemIds = resolvedRunState.shopCurrentStockIds.filter(Boolean);
    }

    getCurrentSkillEffectKeys(player = null) {
        const resolvedPlayer = player ?? this.getPrimaryPlayer();
        if (!resolvedPlayer?.getActiveSkillKey || !resolvedPlayer?.getSkillConfig) return null;
        const activeSkillKey = resolvedPlayer.getActiveSkillKey();
        if (!activeSkillKey) return [];
        const activeSkillConfig = resolvedPlayer.getSkillConfig(activeSkillKey) ?? {};
        const configuredEffects = [
            ...(Array.isArray(activeSkillConfig.statusEffects) ? activeSkillConfig.statusEffects : []),
            ...(Array.isArray(activeSkillConfig.bonusStatusEffects) ? activeSkillConfig.bonusStatusEffects : [])
        ];
        return Array.from(new Set(configuredEffects.map((entry) => entry?.key ?? entry?.effectKey).filter(Boolean)));
    }

    getUnlockElementShopExcludeIds(player = null) {
        const currentEffectKeys = this.getCurrentSkillEffectKeys(player);
        if (!currentEffectKeys.length) return [];
        const effectKeySet = new Set(currentEffectKeys);
        return SHOP_ITEM_CONFIG
            .filter((item) => item.type === 'unlock_element' && effectKeySet.has(item.unlockElement?.effectKey))
            .map((item) => item.id);
    }

    buildUnlockElementSkillOverride(unlockElement = null) {
        const effectKey = unlockElement?.effectKey ?? null;
        if (!effectKey) return null;
        const tags = Array.isArray(unlockElement?.tags) ? unlockElement.tags : [];
        const statusEntry = unlockElement?.statusEntry;
        if (statusEntry && typeof statusEntry === 'object') {
            return {
                tags: Array.from(new Set(tags)),
                statusEffects: [
                    {
                        ...statusEntry,
                        key: statusEntry.key ?? effectKey
                    }
                ]
            };
        }
        return {
            tags: Array.from(new Set(tags)),
            statusEffects: [
                {
                    key: effectKey,
                    trigger: 'onHit',
                    target: 'target',
                    chance: Math.max(0, Math.min(1, unlockElement?.chance ?? 0.2))
                }
            ]
        };
    }

    applyUnlockElementItemToPlayer(player = null, itemConfig = null) {
        const resolvedPlayer = player ?? this.getPrimaryPlayer();
        const unlockElement = itemConfig?.unlockElement ?? null;
        if (!resolvedPlayer?.setSkillRuntimeOverrides || !resolvedPlayer?.getActiveSkillKey || !unlockElement?.effectKey) {
            return false;
        }
        const activeSkillKey = resolvedPlayer.getActiveSkillKey();
        if (!activeSkillKey) return false;
        const existingOverride = resolvedPlayer.skillRuntimeConfigOverrides?.[activeSkillKey] ?? {};
        const builtOverride = this.buildUnlockElementSkillOverride(unlockElement) ?? {};
        const mergedTags = Array.from(new Set([
            ...(Array.isArray(existingOverride.tags) ? existingOverride.tags : []),
            ...(Array.isArray(builtOverride.tags) ? builtOverride.tags : [])
        ]));
        const nextOverride = {
            ...existingOverride,
            ...builtOverride,
            tags: mergedTags
        };
        if (unlockElement.mode === 'hit_explosion') {
            nextOverride.bonusStatusEffects = Array.isArray(builtOverride.statusEffects)
                ? builtOverride.statusEffects.slice(0, 1)
                : [];
            if (Array.isArray(existingOverride.statusEffects)) {
                nextOverride.statusEffects = existingOverride.statusEffects;
            } else {
                delete nextOverride.statusEffects;
            }
        }
        resolvedPlayer.setSkillRuntimeOverrides(activeSkillKey, nextOverride);
        return true;
    }

    buildShopItemEffects(itemConfig = null) {
        const modifiers = itemConfig?.modifiers ?? {};
        const effects = [];
        Object.entries(modifiers).forEach(([key, value]) => {
            switch (key) {
                case 'damageMultiplier':
                    effects.push({ type: 'damage', value });
                    break;
                case 'critChance':
                    effects.push({ type: 'critChance', value });
                    break;
                case 'critMultiplier':
                    effects.push({ type: 'critMultiplier', value });
                    break;
                case 'attackSpeed':
                    effects.push({ type: 'attackSpeed', value });
                    break;
                case 'armor':
                    effects.push({ type: 'armor', value });
                    break;
                case 'armorPierce':
                    effects.push({ type: 'armorPierce', value });
                    break;
                case 'skillRange':
                    effects.push({ type: 'skillRange', value });
                    break;
                case 'hp':
                    effects.push({ type: 'maxHealth', value });
                    break;
                case 'healthRegenPerSecond':
                    effects.push({ type: 'healthRegenPerSecond', value });
                    break;
                case 'lifesteal':
                    effects.push({ type: 'lifesteal', value });
                    break;
                case 'shield':
                    effects.push({ type: 'shieldGrant', value });
                    break;
                case 'dodge':
                    effects.push({ type: 'dodge', value });
                    break;
                case 'moveSpeed':
                    effects.push({ type: 'speed', value });
                    break;
                case 'areaSizeMultiplier':
                    effects.push({ type: 'allSkillAreaPercent', value });
                    break;
                case 'projectileCount':
                    effects.push({ type: 'allSkillObjects', value });
                    break;
                case 'knockbackMultiplier':
                    effects.push({ type: 'knockbackPercent', value });
                    break;
                case 'effectChance':
                    effects.push({ type: 'effectChance', value });
                    break;
                case 'effectDamageMultiplier':
                    effects.push({ type: 'effectDamageMultiplier', value });
                    break;
                case 'effectDurationMultiplier':
                    effects.push({ type: 'effectDurationMultiplier', value });
                    break;
                case 'shockChainCount':
                    effects.push({ type: 'shockChainCount', value });
                    break;
                case 'pickupRangeMultiplier':
                    effects.push({ type: 'lootMagnetRadiusPercent', value });
                    break;
                case 'goldGainMultiplier':
                    effects.push({ type: 'goldGainMultiplier', value });
                    break;
                case 'xpGainMultiplier':
                    effects.push({ type: 'xpGainPercent', value });
                    break;
                default:
            }
        });
        return effects;
    }

    buildShopOverlayState(playerOrId = null, runState = null) {
        const context = this.resolvePlayerRunContext(playerOrId, runState);
        const resolvedRunState = this.ensureShopRunState(context.runState);
        const lockedIds = new Set(resolvedRunState?.shopLockedItemIds ?? []);
        const stockIds = this.debugMode
            ? (resolvedRunState?.shopCurrentStockIds ?? [])
            : (resolvedRunState?.shopCurrentStockIds ?? []).slice(0, 5);
        const items = stockIds
            .map((itemId) => {
                const itemConfig = getShopItemConfig(itemId);
                if (!itemConfig) return null;
                return {
                    ...itemConfig,
                    cost: this.getShopItemRuntimeCost(itemConfig, resolvedRunState),
                    locked: lockedIds.has(itemConfig.id)
                };
            });
        const purchasedItems = Object.entries(resolvedRunState?.shopPurchaseCounts ?? {})
            .map(([itemId, count]) => {
                const itemConfig = getShopItemConfig(itemId);
                if (!itemConfig || count <= 0) return null;
                return {
                    ...itemConfig,
                    stackCount: Math.max(1, Math.floor(count))
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name));
        return {
            gold: Math.max(0, Math.floor(context.player?.gold ?? 0)),
            items,
            purchasedItems,
            rerollCost: Math.max(0, Math.floor(resolvedRunState?.shopCurrentRerollCost ?? SHOP_REROLL_COST)),
            rerollRemaining: null,
            debugMode: this.debugMode === true
        };
    }

    ensureShopStock(playerOrId = null, runState = null) {
        const context = this.resolvePlayerRunContext(playerOrId, runState);
        const resolvedRunState = this.ensureShopRunState(context.runState);
        if (!resolvedRunState) return [];
        if (this.debugMode) {
            resolvedRunState.shopCurrentStockIds = SHOP_ITEM_CONFIG.map((item) => item.id);
            resolvedRunState.shopLockedItemIds = [];
            return resolvedRunState.shopCurrentStockIds;
        }
        const currentStockIds = (resolvedRunState.shopCurrentStockIds ?? [])
            .slice(0, 5)
            .map((itemId) => (getShopItemConfig(itemId) ? itemId : null));
        while (currentStockIds.length < 5) {
            currentStockIds.push(null);
        }
        const lockedSet = new Set(
            (resolvedRunState.shopLockedItemIds ?? [])
                .filter((itemId) => currentStockIds.includes(itemId) && getShopItemConfig(itemId))
        );
        const existingStockIds = currentStockIds.filter(Boolean);
        const missingCount = Math.max(0, currentStockIds.filter((itemId) => !itemId).length);
        if (missingCount > 0) {
            const extraItems = getRandomShopItemStock(missingCount, [
                ...existingStockIds,
                ...this.getUnlockElementShopExcludeIds(context.player),
                ...getConditionalShopExcludeIds(this.getCurrentSkillEffectKeys(context.player), context.player?.characterKey ?? null),
                ...SHOP_ITEM_CONFIG
                    .filter((item) => this.hasReachedShopItemPurchaseLimit(item, resolvedRunState))
                    .map((item) => item.id)
            ]);
            let fillIndex = 0;
            for (let i = 0; i < currentStockIds.length && fillIndex < extraItems.length; i += 1) {
                if (currentStockIds[i]) continue;
                currentStockIds[i] = extraItems[fillIndex].id;
                fillIndex += 1;
            }
        }
        resolvedRunState.shopCurrentStockIds = currentStockIds.slice(0, 5);
        resolvedRunState.shopLockedItemIds = resolvedRunState.shopCurrentStockIds
            .filter((itemId) => lockedSet.has(itemId));
        return resolvedRunState.shopCurrentStockIds;
    }

    purchaseShopItem(itemId, playerOrId = null, runState = null) {
        const itemConfig = getShopItemConfig(itemId);
        const context = this.resolvePlayerRunContext(playerOrId, runState);
        const resolvedRunState = this.ensureShopRunState(context.runState);
        const player = context.player;
        if (!itemConfig || !resolvedRunState || !player) {
            return this.buildShopOverlayState(player, resolvedRunState);
        }
        if (this.hasReachedShopItemPurchaseLimit(itemConfig, resolvedRunState)) {
            return this.buildShopOverlayState(player, resolvedRunState);
        }
        const runtimeCost = this.getShopItemRuntimeCost(itemConfig, resolvedRunState);
        if (!player.spendGold?.(runtimeCost)) {
            return this.buildShopOverlayState(player, resolvedRunState);
        }

        const effects = this.buildShopItemEffects(itemConfig);
        effects.forEach((effect) => player.applyEffect?.(effect, { shopItemConfig: itemConfig }));
        if (itemConfig.type === 'unlock_element') {
            this.applyUnlockElementItemToPlayer(player, itemConfig);
        }

        resolvedRunState.shopPurchasedItemIds.push(itemConfig.id);
        resolvedRunState.shopPurchaseCounts[itemConfig.id] = this.getShopItemPurchaseCount(itemConfig.id, resolvedRunState) + 1;
        resolvedRunState.shopPurchasedItems.push({
            itemId: itemConfig.id,
            name: itemConfig.name,
            type: itemConfig.type,
            cost: runtimeCost
        });
        if (itemConfig.effectBonuses) {
            resolvedRunState.shopEffectBonuses[itemConfig.id] = {
                ...(resolvedRunState.shopEffectBonuses[itemConfig.id] ?? {}),
                ...itemConfig.effectBonuses
            };
        }
        if (itemConfig.special) {
            resolvedRunState.shopSpecialFlags[itemConfig.id] = {
                ...(resolvedRunState.shopSpecialFlags[itemConfig.id] ?? {}),
                ...itemConfig.special
            };
        }

        resolvedRunState.shopCurrentStockIds = (resolvedRunState.shopCurrentStockIds ?? [])
            .slice(0, 5)
            .map((shopItemId) => (shopItemId === itemConfig.id ? null : shopItemId));
        resolvedRunState.shopLockedItemIds = (resolvedRunState.shopLockedItemIds ?? [])
            .filter((shopItemId) => shopItemId !== itemConfig.id);
        return this.buildShopOverlayState(player, resolvedRunState);
    }

    rerollShopStock(playerOrId = null, runState = null) {
        const context = this.resolvePlayerRunContext(playerOrId, runState);
        const resolvedRunState = this.ensureShopRunState(context.runState);
        const player = context.player;
        if (!resolvedRunState || !player) {
            return this.buildShopOverlayState(player, resolvedRunState);
        }
        if (this.debugMode) {
            return this.buildShopOverlayState(player, resolvedRunState);
        }
        const currentStockIds = (resolvedRunState.shopCurrentStockIds ?? [])
            .slice(0, 5)
            .filter((itemId) => getShopItemConfig(itemId));
        const lockedSet = new Set(resolvedRunState.shopLockedItemIds ?? []);
        const lockedCount = currentStockIds.filter((itemId) => lockedSet.has(itemId)).length;
        if (currentStockIds.length > 0 && lockedCount >= currentStockIds.length) {
            return this.buildShopOverlayState(player, resolvedRunState);
        }
        const rerollCost = Math.max(0, Math.floor(resolvedRunState.shopCurrentRerollCost ?? SHOP_REROLL_COST));
        if (!player.spendGold?.(rerollCost)) {
            return this.buildShopOverlayState(player, resolvedRunState);
        }
        resolvedRunState.shopCurrentRerollCost = Math.max(SHOP_REROLL_COST, rerollCost * 2);

        const currentStockWithSlots = (resolvedRunState.shopCurrentStockIds ?? [])
            .slice(0, 5)
            .map((itemId) => (getShopItemConfig(itemId) ? itemId : null));
        while (currentStockWithSlots.length < 5) {
            currentStockWithSlots.push(null);
        }
        const preservedIds = currentStockWithSlots.filter((itemId) => itemId && lockedSet.has(itemId));
        const nextItems = getRandomShopItemStock(
            currentStockWithSlots.length - preservedIds.length,
            [
                ...preservedIds,
                ...this.getUnlockElementShopExcludeIds(player),
                ...getConditionalShopExcludeIds(this.getCurrentSkillEffectKeys(player), player?.characterKey ?? null),
                ...SHOP_ITEM_CONFIG
                    .filter((item) => this.hasReachedShopItemPurchaseLimit(item, resolvedRunState))
                    .map((item) => item.id)
            ]
        );
        let nextIndex = 0;
        resolvedRunState.shopCurrentStockIds = currentStockWithSlots.map((itemId) => {
            if (itemId && lockedSet.has(itemId)) {
                return itemId;
            }
            const nextItem = nextItems[nextIndex] ?? null;
            nextIndex += 1;
            return nextItem?.id ?? null;
        });
        return this.buildShopOverlayState(player, resolvedRunState);
    }

    toggleShopItemLock(itemId, playerOrId = null, runState = null) {
        const itemConfig = getShopItemConfig(itemId);
        const context = this.resolvePlayerRunContext(playerOrId, runState);
        const resolvedRunState = this.ensureShopRunState(context.runState);
        if (!itemConfig || !resolvedRunState || this.debugMode) {
            return this.buildShopOverlayState(context.player, resolvedRunState);
        }
        const currentStockIds = (resolvedRunState.shopCurrentStockIds ?? []).slice(0, 5);
        if (!currentStockIds.includes(itemConfig.id)) {
            return this.buildShopOverlayState(context.player, resolvedRunState);
        }
        const lockedSet = new Set(resolvedRunState.shopLockedItemIds ?? []);
        if (lockedSet.has(itemConfig.id)) {
            lockedSet.delete(itemConfig.id);
        } else {
            lockedSet.add(itemConfig.id);
        }
        resolvedRunState.shopLockedItemIds = currentStockIds.filter((stockItemId) => lockedSet.has(stockItemId));
        return this.buildShopOverlayState(context.player, resolvedRunState);
    }

    initializeEnemySpawnStatus() {
        this.enemySpawnStatus = {};
        Object.keys(ENEMIES).forEach(type => {
            this.enemySpawnStatus[type] = false;
        });
    }

    setShowEnemyHP(enabled) {
        this.showEnemyHP = Boolean(enabled);
        this.enemies.children.each(enemy => {
            if (enemy?.setHealthVisible) {
                enemy.setHealthVisible(this.showEnemyHP);
            }
        });
    }

    canSpawnMoreEnemies() {
        if (!this.enemies) return false;
        const activeEnemies = this.enemies.countActive(true);
        return activeEnemies < this.maxEnemiesOnMap;
    }

    clearEnemies() {
        this.enemies.children.each(enemy => {
            enemy.destroy();
        });
    }
}
