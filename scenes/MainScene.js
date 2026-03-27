// scenes/MainScene.js
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import { CARD_CONFIG } from '../config/card.js';
import { ENEMIES } from '../config/enemies.js';
import { SKILL_CONFIG } from '../config/skill.js';
import { CHARACTER_CONFIG, DEFAULT_CHARACTER_KEY } from '../config/characters/characters.js';
import MapManager from '../systems/mapsystem.js';
import LootSystem from '../systems/LootSystem.js';
import DamageText from '../entities/DamageText.js';
import { DEFAULT_MAP_KEY } from '../config/map.js';
import { preloadAllAssets, createAllAnimations } from '../utils/animationSystem.js';
import { ELITE_CONFIGS, ELITE_KILL_MILESTONES } from '../config/elites.js';
import CriticalHitEffect from '../entities/effects/CriticalHitEffect.js';

const SPAWN_PADDING = 100;
const DESPAWN_MARGIN = 300;

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.mapManager = new MapManager(this);
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

        // Create all animations from config
        createAllAnimations(this);
        const mapDef = this.mapManager.loadMap(DEFAULT_MAP_KEY);
        if (mapDef) {
            this.mapManager.applyWorldBounds();
            this.cameras.main.setZoom(2);
        }
        this.cameras.main.setBackgroundColor('#808080');
        this.activeCharacterKey = DEFAULT_CHARACTER_KEY;
        const initialCharacter = CHARACTER_CONFIG[this.activeCharacterKey];
        this.activeSkillKey = initialCharacter?.defaultSkill ?? 'thunder';
        this.skillInputs = {};
        this.characterInputs = {};

        // Create player
        const worldBounds = this.physics.world.bounds || { centerX: width / 2, centerY: height / 2 };
        const spawnX = worldBounds.centerX ?? width / 2;
        const spawnY = worldBounds.centerY ?? height / 2;
        this.player = new Player(this, spawnX, spawnY, this.activeCharacterKey);
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
            sparkScale: { min: 0.3, max: 0.6 },
            sparkDuration: { min: 120, max: 260 }
        });
        this.lootSystem = new LootSystem(this);
        this.physics.add.overlap(this.player, this.lootSystem.itemGroup, this.handleItemPickup, null, this);
        this.player.once('player-dead', () => this.handlePlayerDeath());

        if (!this.scene.isActive('HudScene')) {
            this.scene.launch('HudScene');
        }
        this.scene.bringToTop('HudScene');

        this.cameras.main.startFollow(this.player, false, 0.08, 0.08);
        this.cameras.main.setDeadzone(0, 0);

        this.enemies = this.physics.add.group();
        this.separationZones = this.physics.add.group();
        this.showEnemyHP = false;
        this.despawnMargin = DESPAWN_MARGIN;
        this.respawnPool = 0;
        this.initializeEnemySpawnStatus();
        this.killCount = 0;
        this.eliteMilestonesTriggered = new Set();
        this.maxEnemiesOnMap = 150;
        this.events.on('enemy-dead', this.handleEnemyDeath, this);
        for (let i = 0; i < 5; i++) {
            this.spawnRandomEnemy();
            if (!this.canSpawnMoreEnemies()) break;
        }

        // Create skills group
        this.skills = this.add.group();
        this.physics.add.collider(
            this.player,
            this.enemies,
            this.onPlayerHitEnemy,
            this.blockPlayerAgainstEnemy,
            this
        );
        this.physics.add.collider(this.enemies, this.enemies, this.handleEnemyCollision, null, this);
        this.physics.add.overlap(this.separationZones, this.enemies, this.handleSeparationZoneOverlap, null, this);
        this.setupDebugMenu();

        this.spawnTimer = 0;
        this.spawnInterval = 500; // spawn every 0.5 second
        this.isChoosingCard = false;
        this.upgradeOverlay = null;
        this.upgradeContainer = null;
        this.levelUpQueue = 0;
        this.cardSelectionCounts = {};
        this.levelUpCards = [];
        this.cardFocusIndex = 0;
        this.keyboardNavigationActive = false;
        this.input.keyboard.on('keydown', this.handleCardNavigation, this);
    }

    update(time, delta) {
        if (this.isGameOver) return;
        if (this.isChoosingCard) return;
        // Update player
        this.player.update(time, delta);

        this.despawnOffscreenEnemies();
        if (this.respawnPool > 0 && this.canSpawnMoreEnemies()) {
            this.respawnPool -= 1;
            this.spawnRandomEnemy();
        }
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer -= this.spawnInterval;
            if (this.canSpawnMoreEnemies()) {
                this.spawnRandomEnemy();
            }
        }
        // Update enemies
        const enemyChildren = this.enemies.getChildren();
        this.enemies.children.each(enemy => {
            enemy.update(time, delta, this.player, enemyChildren);
        });

        this.skills.children.each(skill => {
            if (skill && typeof skill.update === 'function') {
                skill.update(time, delta);
            }
        });
        this.checkSkillHits();
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
            const outLeft = enemy.x < view.left - margin;
            const outRight = enemy.x > view.right + margin;
            const outTop = enemy.y < view.top - margin;
            const outBottom = enemy.y > view.bottom + margin;
            if (outLeft || outRight || outTop || outBottom) {
                if (enemy.isElite) {
                    return; // keep elites alive
                }
                enemy.destroy();
                this.respawnPool += 1;
            }
        });
    }

    checkSkillHits() {
        const skills = this.skills.getChildren();
        const enemies = this.enemies.getChildren();

        for (const skill of skills) {
            if (!skill.active) continue;
            const skillBounds = skill.getBounds();
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

    onSkillHitEnemy(skill, enemy) {
        if (!skill.active) return;
        if (skill.recordHit && !skill.recordHit(enemy)) return;
        if (skill.config?.dropFromSky && skill.dropTarget && enemy !== skill.dropTarget) {
            return;
        }
        if (enemy && enemy.takeDamage) {
            const force = skill.config?.knockback ?? 0;
            const distance = skill.config?.knockbackDistance ?? 0;
            const limit = skill.config?.numberKnockback ?? Infinity;
            const currentHits = skill.knockbackCount ?? 0;
            if (currentHits >= limit) {
                return;
            }
            skill.knockbackCount = currentHits + 1;
            const dir = new Phaser.Math.Vector2(enemy.x - skill.x, enemy.y - skill.y);
            if (dir.lengthSq() === 0) dir.set(1, 0);
            dir.normalize();
            const roll = skill.rollCriticalDamage();
            skill.damage = roll.value;
            enemy.takeDamage(skill.damage, force, dir, skill, { damageSource: skill }, skill.config);
            const stunDuration = skill.config?.stunDuration ?? 0;
            if (stunDuration > 0) {
                const rawColor = skill.config?.stunColor ?? 0x000000;
                const tintColor = typeof rawColor === 'string'
                    ? Phaser.Display.Color.HexStringToColor(rawColor).color
                    : rawColor;
                enemy.applyStun?.(stunDuration, tintColor);
            }
            new DamageText(this, enemy.x, enemy.y - (enemy.body?.height ?? 20), roll.value, {
                color: roll.isCritical ? (skill.critColor ?? '#ffde59') : '#ffde59',
                fontSize: '14px'
            });
        }
        if (skill.config?.destroyOnHit) {
            skill.destroy();
        }
    }


    onPlayerHitEnemy(player, enemy) {
        if (!player || !enemy) return;
        if (player.takeDamage && !player.isDead) {
            player.takeDamage(enemy.damage ?? 10);
            const effectConfig = {
                glowColors: enemy.attackGlowColors ?? [0x000000, 0x110000],
                rayLineColor: enemy.attackEffectTint ?? 0x000000,
                sparkTints: enemy.attackSparkTints ?? [0x000000]
            };
            this.playerHitEffect?.spawn(player, effectConfig);
        }
    }

    handleItemPickup(player, item) {
        if (!item || typeof item.collect !== 'function') return;
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
        console.log('separation', enemyA.type, enemyA.body.width, enemyA.body.height);
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
        const skillContainer = panel.querySelector('#skill-list');
        const enemyContainer = panel.querySelector('#enemy-list');
        if (!skillContainer || !enemyContainer) return;
        skillContainer.innerHTML = '';
        enemyContainer.innerHTML = '';
        this.skillInputs = {};
        this.characterInputs = {};
        const enemySection = enemyContainer.closest('.panel-section');
        skillContainer.classList.add('panel-list');
        enemyContainer.classList.add('panel-list');
        const enemyCountLabel = document.createElement('div');
        enemyCountLabel.id = 'enemy-count-display';
        enemyCountLabel.classList.add('panel-text');
        enemyCountLabel.textContent = 'Enemies on map: 0';
        if (enemySection) {
            enemySection.insertBefore(enemyCountLabel, enemyContainer);
        } else {
            panel.appendChild(enemyCountLabel);
        }
        this.enemyCountDisplay = enemyCountLabel;
        Object.entries(SKILL_CONFIG).forEach(([key, config]) => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'skill-selector';
            input.value = key;
            input.checked = key === this.activeSkillKey;
            input.addEventListener('change', () => {
                if (input.checked) {
                    this.activeSkillKey = key;
                }
            });
            label.appendChild(input);
            label.appendChild(document.createTextNode(config.label || key));
            this.skillInputs[key] = input;
            skillContainer.appendChild(label);
        });
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
            clearButton.addEventListener('click', () => this.clearEnemies());
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
                this.updateMapBounds();
                this.mapManager.enableObjectCollisions(this.player);
                this.mapManager.enableObjectCollisions(this.enemies);
                this.repositionPlayerForCurrentMap();
                this.cameras.main.startFollow(this.player, false, 0.08, 0.08);
                this.cameras.main.centerOn(this.player.x, this.player.y);
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
        hpLabel.appendChild(document.createTextNode('Show enemy HP'));
        uiSection.appendChild(hpLabel);
        this.updateEnemyCountDisplay();
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

    switchCharacter(characterKey) {
        const config = CHARACTER_CONFIG[characterKey];
        if (!config) return;
        this.activeCharacterKey = characterKey;
        const defaultSkill = config.defaultSkill ?? 'thunder';
        const chosenSkill = this.player?.setCharacter?.(characterKey) ?? defaultSkill;
        this.activeSkillKey = chosenSkill;
        Object.entries(this.characterInputs ?? {}).forEach(([key, input]) => {
            input.checked = key === characterKey;
        });
        Object.entries(this.skillInputs ?? {}).forEach(([key, input]) => {
            input.checked = key === this.activeSkillKey;
        });
    }

    updateEnemyCountDisplay() {
        if (!this.enemyCountDisplay) return;
        const enemies = this.enemies ? this.enemies.getChildren() : [];
        const activeCount = enemies.filter(enemy => enemy && enemy.active).length;
        this.enemyCountDisplay.textContent = `Enemies on map: ${activeCount}`;
    }

    spawnRandomEnemy(type) {
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
        if (!this.canSpawnMoreEnemies()) return;
        const enemy = new Enemy(this, x, y, enemyType);
        this.enemies.add(enemy);
        this.add.existing(enemy);
        this.mapManager.enableObjectCollisions(enemy);
        if (enemy?.setHealthVisible) {
            enemy.setHealthVisible(this.showEnemyHP);
        }
    }

    handleEnemyDeath({ enemy }) {
        if (!enemy) return;
        this.killCount += 1;
        this.tryTriggerEliteKillMilestone();
    }

    tryTriggerEliteKillMilestone() {
        for (const milestone of ELITE_KILL_MILESTONES) {
            if (this.killCount >= milestone.kills && !this.eliteMilestonesTriggered.has(milestone.kills)) {
                this.eliteMilestonesTriggered.add(milestone.kills);
                const spawnCount = Math.max(1, milestone.spawnCount ?? 1);
                for (let i = 0; i < spawnCount; i++) {
                    this.spawnEliteFromId(milestone.eliteId);
                }
                return;
            }
        }
    }

    spawnEliteFromId(eliteId) {
        const eliteConfig = ELITE_CONFIGS.find(cfg => cfg.id === eliteId);
        if (!eliteConfig) return;
        const position = this.getSpawnEdgePosition();
        if (!position) return;
        const enemy = new Enemy(this, position.x, position.y, eliteConfig.baseMonsterId);
        enemy.isElite = true;
        enemy.eliteConfig = eliteConfig;
        enemy.eliteAbilities = [...(eliteConfig.specialAbilities ?? [])];
        enemy.scaleSize = eliteConfig.scaleSize ?? 1;
        enemy.setTint(eliteConfig.tint ?? 0xffcc00);
        enemy.maxHealth = enemy.health = Math.round((enemy.maxHealth || enemy.health) * (eliteConfig.hpMultiplier ?? 1));
        enemy.damage = Math.round((enemy.damage ?? 10) * (eliteConfig.damageMultiplier ?? 1));
        enemy.speed = (enemy.speed ?? 100) * (eliteConfig.speedMultiplier ?? 1);
        this.enemies.add(enemy);
        this.add.existing(enemy);
        this.mapManager.enableObjectCollisions(enemy);
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

    spawnEnemyNearPlayer(type, distance = 120) {
        if (!this.player || !type) return;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const x = this.player.x + Math.cos(angle) * distance;
        const y = this.player.y + Math.sin(angle) * distance;
        const enemy = new Enemy(this, x, y, type);
        this.enemies.add(enemy);
        this.add.existing(enemy);
        this.mapManager.enableObjectCollisions(enemy);
        if (enemy?.setHealthVisible) {
            enemy.setHealthVisible(this.showEnemyHP);
        }
    }

    pickEnemyTypeForSpawn() {
        const spawnOptions = this.getSpawnableEnemyTypes();
        if (!spawnOptions.length) return null;
        const totalWeight = spawnOptions.reduce((sum, [, cfg]) => sum + (cfg.spawnWeight ?? 0), 0);
        if (totalWeight <= 0) return spawnOptions[0][0];
        let roll = Math.random() * totalWeight;
        for (const [type, cfg] of spawnOptions) {
            const weight = cfg.spawnWeight ?? 0;
            if (roll < weight) {
                return type;
            }
            roll -= weight;
        }
        return spawnOptions[spawnOptions.length - 1][0];
    }

    getSpawnableEnemyTypes() {
        const level = this.player?.level ?? 1;
        return Object.entries(ENEMIES).filter(([type, cfg]) => {
            const enabled = this.enemySpawnStatus[type] ?? false;
            const minLevel = cfg.unlockLevel ?? 1;
            return enabled && level >= minLevel && (cfg.spawnWeight ?? 0) > 0;
        });
    }

    queueLevelUp() {
        this.levelUpQueue += 1;
        this.tryPresentLevelUpCards();
    }

    tryPresentLevelUpCards() {
        if (this.levelUpQueue <= 0 || this.isChoosingCard) return;
        this.levelUpQueue -= 1;
        this.presentLevelUpCards();
    }

    presentLevelUpCards() {
        if (this.isChoosingCard) return;
        const baseCards = this.getWeightedCards(3);
        if (!baseCards.length) {
            this.levelUpQueue = 0;
            return;
        }
        this.isChoosingCard = true;
        this.physics.world.pause();
        const hudScene = this.scene.get('HudScene');
        hudScene?.showLevelUpSelection?.(baseCards, (selected) => this.onCardSelected(selected));
        this.upgradeOverlay = hudScene?.levelUpOverlay ?? null;
        this.upgradeContainer = hudScene?.levelUpContainer ?? null;
        this.levelUpCards = hudScene?.levelUpCards ?? [];
        this.cardFocusIndex = 0;
        this.keyboardNavigationActive = false;
        this.updateCardFocus();
    }

    onCardSelected(cardConfig) {
        if (!this.isChoosingCard) return;
        this.clearCardFocus();
        this.isChoosingCard = false;
        const hudScene = this.scene.get('HudScene');
        hudScene?.hideLevelUpSelection?.();
        this.upgradeOverlay = null;
        this.upgradeContainer = null;
        this.levelUpCards = [];
        if (this.physics.world.isPaused) {
            this.physics.world.resume();
        }
        if (this.player?.applyCardEffect) {
            this.player.applyCardEffect(cardConfig);
        }
        if (cardConfig?.key) {
            this.cardSelectionCounts[cardConfig.key] = (this.cardSelectionCounts[cardConfig.key] ?? 0) + 1;
        }
        if (this.levelUpQueue > 0) {
            this.time.delayedCall(250, () => {
                this.tryPresentLevelUpCards();
            });
        }
    }

    handleCardNavigation(event) {
        if (!this.isChoosingCard || !this.levelUpCards.length) return;
        const total = this.levelUpCards.length;
        const { LEFT, RIGHT, A, D, ENTER, SPACE } = Phaser.Input.Keyboard.KeyCodes;
        let handled = false;
        if ([LEFT, A, RIGHT, D, ENTER, SPACE].includes(event.keyCode)) {
            this.keyboardNavigationActive = true;
        }
        if (event.keyCode === LEFT || event.keyCode === A) {
            this.cardFocusIndex = Phaser.Math.Wrap(this.cardFocusIndex - 1, 0, total);
            handled = true;
        } else if (event.keyCode === RIGHT || event.keyCode === D) {
            this.cardFocusIndex = Phaser.Math.Wrap(this.cardFocusIndex + 1, 0, total);
            handled = true;
        } else if (event.keyCode === ENTER || event.keyCode === SPACE) {
            const focusedCard = this.levelUpCards[this.cardFocusIndex];
            if (focusedCard) {
                this.onCardSelected(focusedCard.cardConfig);
            }
            handled = true;
        }
        if (handled) {
            this.updateCardFocus();
            event.preventDefault();
        }
    }

    updateCardFocus() {
        if (!this.levelUpCards.length) return;
        if (!this.keyboardNavigationActive) {
            this.levelUpCards.forEach(card => card.setFocus(false));
            return;
        }
        this.levelUpCards.forEach((card, index) => card.setFocus(index === this.cardFocusIndex));
    }

    clearCardFocus() {
        if (this.levelUpCards.length) {
            this.levelUpCards.forEach(card => card.setFocus(false));
        }
        this.levelUpCards = [];
        this.cardFocusIndex = 0;
        this.keyboardNavigationActive = false;
    }

    handlePlayerDeath() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.physics.world.pause();
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        this.add.text(centerX, centerY, 'GAME OVER', {
            fontSize: '32px',
            color: '#ff0000',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    }

    getWeightedCards(count) {
        let pool = this.getAvailableCardPool();
        if (!pool.length) {
            this.cardSelectionCounts = {};
            pool = this.getAvailableCardPool();
        }
        const picks = [];
        const desired = Math.min(count, pool.length);
        const groupBuckets = new Map();
        pool.forEach(card => {
            const groupKey = card.group ?? card.key;
            if (!groupBuckets.has(groupKey)) {
                groupBuckets.set(groupKey, []);
            }
            groupBuckets.get(groupKey).push(card);
        });
        const usedGroups = new Set();

        while (picks.length < desired) {
            const candidateGroups = Array.from(groupBuckets.entries())
                .filter(([groupKey]) => !usedGroups.has(groupKey));
            if (!candidateGroups.length) break;
            const groupEntries = candidateGroups.map(([groupKey, cards]) => {
                const totalWeight = cards.reduce((sum, card) => sum + (card.weight ?? 1), 0);
                return { groupKey, cards, totalWeight };
            });
            const totalGroupWeight = groupEntries.reduce((sum, entry) => sum + entry.totalWeight, 0);
            let roll = Math.random() * totalGroupWeight;
            const selectedGroup = groupEntries.find(entry => {
                if (roll < entry.totalWeight) return true;
                roll -= entry.totalWeight;
                return false;
            }) || groupEntries[0];
            let chosenCard = selectedGroup.cards[0];
            let innerRoll = Math.random() * selectedGroup.totalWeight;
            for (const card of selectedGroup.cards) {
                const cardWeight = card.weight ?? 1;
                if (innerRoll < cardWeight) {
                    chosenCard = card;
                    break;
                }
                innerRoll -= cardWeight;
            }
            const groupKey = selectedGroup.groupKey;
            for (let i = pool.length - 1; i >= 0; i--) {
                const candidate = pool[i];
                const candidateGroup = candidate.group ?? candidate.key;
                if (candidateGroup === groupKey) {
                    pool.splice(i, 1);
                }
            }
            picks.push(chosenCard);
            usedGroups.add(groupKey);
            groupBuckets.delete(groupKey);
        }
        return picks;
    }

    getAvailableCardPool() {
        const activeSkillCfg = SKILL_CONFIG[this.activeSkillKey] || {};
        const allowMultipleObject = activeSkillCfg.multipleObject !== false;
        const maxObjects = this.player?.getSkillObjectMaxCount(this.activeSkillKey) ?? 1;
        const currentObjects = this.player?.getSkillObjectCount(this.activeSkillKey) ?? 1;
        return CARD_CONFIG
            .filter(card => {
                const selected = this.cardSelectionCounts[card.key] ?? 0;
                const limit = card.stackLimit ?? Infinity;
                return selected < limit;
            })
            .filter(card => {
                if (card.effect?.type === 'skillObject') {
                    if (!allowMultipleObject) {
                        return false;
                    }
                    if (currentObjects >= maxObjects) {
                        return false;
                    }
                }
                return true;
            })
            .map(card => ({ ...card }));
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
