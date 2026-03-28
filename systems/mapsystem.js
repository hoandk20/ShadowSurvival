import { getAvailableMaps, getMapDefinition, DEFAULT_MAP_KEY } from '../config/map.js';

export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.tilemap = null;
        this.tilemaps = [];
        this.mapLayers = [];
        this.segmentLayers = new Map();
        this.mapColliders = [];
        this.objectColliders = new Map();
        this.currentMapKey = null;
        this.currentDefinition = null;
        this.collisionVersion = 0;
        this.segmentWidth = 0;
        this.segmentHeight = 0;
        this.segmentRange = { min: 0, max: 0 };
    }

    preloadMaps() {
        Object.values(getAvailableMaps()).forEach((mapEntry) => {
            const definition = getMapDefinition(mapEntry.id);
            if (!definition) return;
            if (definition.jsonPath) {
                this.scene.load.tilemapTiledJSON(definition.mapKey, definition.jsonPath);
            }
            if (definition.music?.key && definition.music?.path && !this.scene.cache.audio.exists(definition.music.key)) {
                this.scene.load.audio(definition.music.key, definition.music.path);
            }
            (definition.tilesets ?? []).forEach((tileset) => {
                if (tileset.imagePath && tileset.imageKey) {
                    this.scene.load.image(tileset.imageKey, tileset.imagePath);
                }
            });
        });
    }

    loadMap(mapKey = DEFAULT_MAP_KEY) {
        const definition = getMapDefinition(mapKey);
        if (!definition) {
            return null;
        }
        this.clearMap();
        this.currentMapKey = mapKey;
        this.currentDefinition = definition;
        if (this.scene.game && this.scene.game.renderer) {
            this.scene.game.renderer.pixelArt = true;
        }
        this.scene.cameras.main.roundPixels = true;

        if (definition.infiniteHorizontal) {
            const baseTilemap = this.createMapSegment(definition, 0);
            this.tilemap = baseTilemap;
            this.segmentWidth = baseTilemap?.widthInPixels ?? 0;
            this.segmentHeight = baseTilemap?.heightInPixels ?? 0;
            this.segmentRange = { min: 0, max: 0 };
            const preloadRadius = Math.max(definition.preloadSegmentRadius ?? 1, 0);
            this.syncSegmentWindow(0, preloadRadius);
        } else {
            const tilemap = this.createMapSegment(definition, 0);
            this.tilemap = tilemap;
            this.segmentWidth = tilemap?.widthInPixels ?? 0;
            this.segmentHeight = tilemap?.heightInPixels ?? 0;
            this.segmentRange = { min: 0, max: 0 };
        }
        this.normalizeLayerDepths();
        this.ensureBackgroundLayer();
        this.applyWorldBounds();
        return definition;
    }

    clearMap() {
        this.collisionVersion += 1;
        this.mapLayers.forEach(({ layer }) => {
            if (layer && layer.destroy) {
                layer.destroy();
            }
        });
        this.mapLayers = [];
        this.segmentLayers.clear();
        this.mapColliders.forEach((collider) => {
            if (collider && collider.destroy) {
                collider.destroy();
            }
        });
        this.mapColliders = [];
        this.objectColliders.clear();
        this.tilemaps.forEach((map) => {
            if (map && map.destroy) {
                map.destroy();
            }
        });
        this.tilemaps = [];
        this.tilemap = null;
        if (this.backgroundRect) {
            this.backgroundRect.destroy();
            this.backgroundRect = null;
        }
        this.currentDefinition = null;
        this.currentMapKey = null;
        this.segmentWidth = 0;
        this.segmentHeight = 0;
        this.segmentRange = { min: 0, max: 0 };
    }

    ensureBackgroundLayer() {
        const definition = this.getCurrentMap() ?? getMapDefinition(DEFAULT_MAP_KEY);
        if (!definition) return;
        if (this.backgroundRect) {
            this.backgroundRect.destroy();
            this.backgroundRect = null;
        }
        const { width, height } = this.getMapSize();
        if (!width || !height) return;
        this.backgroundRect = this.scene.add.rectangle(0, 0, width, height, 0x51554e, 1).setOrigin(0).setDepth(-10);
    }

    getMapSize() {
        if (!this.tilemap) {
            return { width: 0, height: 0 };
        }
        return {
            width: this.currentDefinition?.infiniteHorizontal
                ? (this.segmentRange.max - this.segmentRange.min + 1) * this.segmentWidth
                : this.tilemap.widthInPixels,
            height: this.segmentHeight || this.tilemap.heightInPixels
        };
    }

    applyWorldBounds() {
        const { width, height } = this.getMapSize();
        if (!width || !height) return;
        const originX = this.currentDefinition?.infiniteHorizontal
            ? this.segmentRange.min * this.segmentWidth
            : 0;
        this.scene.physics.world.setBounds(originX, 0, width, height, true, true, true, true);
        this.scene.cameras.main.setBounds(originX, 0, width, height);
        if (this.backgroundRect) {
            this.backgroundRect.setPosition(originX, 0);
            this.backgroundRect.setSize(width, height);
        }
    }

    normalizeLayerDepths() {
        if (this.backgroundRect) {
            this.backgroundRect.setDepth(-10);
        }
        this.mapLayers.forEach(({ info, layer }, index) => {
            if (!layer) return;
            layer.setDepth(info?.depth ?? index);
        });
    }

    enableObjectCollisions(gameObject) {
        if (!gameObject) return;
        const targets = typeof gameObject.getChildren === 'function'
            ? gameObject.getChildren()
            : Array.isArray(gameObject)
                ? gameObject
                : [gameObject];
        targets.forEach((target) => {
            if (!target || typeof target !== 'object') return;
            if (target._mapCollisionVersion === this.collisionVersion && this.objectColliders.has(target)) return;
            this.removeObjectCollisions(target);
            const colliders = [];
            this.mapLayers.forEach(({ info, layer }) => {
                if (info.collidable && layer) {
                    const collider = this.scene.physics.add.collider(target, layer);
                    if (collider) {
                        colliders.push(collider);
                    }
                }
            });
            target._mapCollisionVersion = this.collisionVersion;
            this.objectColliders.set(target, colliders);
            this.refreshMapColliderRegistry();
        });
    }

    removeObjectCollisions(gameObject) {
        if (!gameObject) return;
        const targets = typeof gameObject.getChildren === 'function'
            ? gameObject.getChildren()
            : Array.isArray(gameObject)
                ? gameObject
                : [gameObject];
        targets.forEach((target) => {
            if (!target) return;
            const colliders = this.objectColliders.get(target);
            if (Array.isArray(colliders)) {
                colliders.forEach((collider) => {
                    if (collider && collider.destroy) {
                        collider.destroy();
                    }
                });
            }
            this.objectColliders.delete(target);
            this.refreshMapColliderRegistry();
            if (target._mapCollisionVersion === this.collisionVersion) {
                target._mapCollisionVersion = null;
            }
        });
    }

    getMapList() {
        return getAvailableMaps();
    }

    getCurrentMap() {
        return this.currentDefinition ?? getMapDefinition(this.currentMapKey ?? DEFAULT_MAP_KEY);
    }

    ensureSegmentsAroundWorldX(worldX) {
        if (!this.currentDefinition?.infiniteHorizontal || !this.segmentWidth) return false;
        const currentSegment = Math.floor(worldX / this.segmentWidth);
        const marginTiles = this.currentDefinition.segmentLoadMarginTiles ?? 8;
        const marginPixels = marginTiles * (this.tilemap?.tileWidth ?? 16);
        const segmentStartX = currentSegment * this.segmentWidth;
        const segmentEndX = segmentStartX + this.segmentWidth;
        let changed = false;

        if (worldX <= segmentStartX + marginPixels) {
            changed = this.syncSegmentWindow(currentSegment - 1) || changed;
        }
        if (worldX >= segmentEndX - marginPixels) {
            changed = this.syncSegmentWindow(currentSegment + 1) || changed;
        }
        return changed;
    }

    createMapSegment(definition, segmentIndex) {
        const tilemap = this.scene.make.tilemap({ key: definition.mapKey });
        const runtimeTilesets = this.buildRuntimeTilesets(tilemap, definition);
        const tilesets = runtimeTilesets.map((tileset) => {
            return tilemap.addTilesetImage(
                tileset.name,
                tileset.imageKey,
                tileset.tileWidth,
                tileset.tileHeight
            );
        }).filter(Boolean);
        const layerTilesets = tilesets.length === 1 ? tilesets[0] : tilesets;
        const segmentOffsetX = segmentIndex * tilemap.widthInPixels;
        const isMirroredSegment = Boolean(
            definition.alternatingMirroredChunks
            && Math.abs(segmentIndex % 2) === 1
        );
        const layers = this.resolveRuntimeLayers(tilemap, definition);
        const createdLayers = [];

        tilesets.forEach((tileset) => {
            const sourceTileset = (definition.tilesets ?? []).find((entry) => entry.name === tileset.name);
            const textureKey = sourceTileset?.imageKey ?? tileset.name;
            const texture = this.scene.textures.get(textureKey);
            if (texture) {
                texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
            }
        });

        layers.forEach((layerInfo) => {
            const layer = tilemap.createLayer(
                layerInfo.name,
                layerTilesets,
                segmentOffsetX + (layerInfo.offsetX ?? 0),
                layerInfo.offsetY ?? 0
            );
            if (!layer) {
                console.warn(`[MapManager] Failed to create layer "${layerInfo.name}" for map "${definition.mapKey}"`);
                return;
            }
            if (isMirroredSegment) {
                this.mirrorTileLayerContents(layer);
            }
            layer.setDepth(layerInfo.depth ?? 0);
            if (layerInfo.collidable) {
                layer.setCollisionByExclusion([-1], true);
            }
            const layerEntry = { info: layerInfo, layer, segmentIndex };
            this.mapLayers.push(layerEntry);
            createdLayers.push(layerEntry);
        });

        this.tilemaps.push(tilemap);
        this.segmentLayers.set(segmentIndex, { tilemap, layers: createdLayers });
        return tilemap;
    }

    mirrorTileLayerContents(layer) {
        const rows = layer?.layer?.data;
        if (!Array.isArray(rows) || !rows.length) return;

        rows.forEach((row) => {
            if (!Array.isArray(row) || row.length < 2) return;
            const indexes = row.map((tile) => tile?.index ?? -1);
            const flipsX = row.map((tile) => tile?.flipX ?? false);
            const flipsY = row.map((tile) => tile?.flipY ?? false);
            const rotations = row.map((tile) => tile?.rotation ?? 0);

            row.forEach((tile, columnIndex) => {
                if (!tile) return;
                const sourceIndex = row.length - 1 - columnIndex;
                tile.index = indexes[sourceIndex];
                tile.flipX = !flipsX[sourceIndex];
                tile.flipY = flipsY[sourceIndex];
                tile.rotation = rotations[sourceIndex];
            });
        });
    }

    ensureHorizontalSegment(segmentIndex) {
        if (!this.currentDefinition?.infiniteHorizontal) return false;
        if (this.segmentLayers.has(segmentIndex)) return false;
        const tilemap = this.createMapSegment(this.currentDefinition, segmentIndex);
        if (!this.tilemap) {
            this.tilemap = tilemap;
        }
        this.segmentWidth = this.segmentWidth || tilemap?.widthInPixels || 0;
        this.segmentHeight = Math.max(this.segmentHeight || 0, tilemap?.heightInPixels || 0);
        this.segmentRange.min = Math.min(this.segmentRange.min, segmentIndex);
        this.segmentRange.max = Math.max(this.segmentRange.max, segmentIndex);
        return true;
    }

    syncSegmentWindow(centerSegment, radius = this.currentDefinition?.activeSegmentRadius ?? 1) {
        if (!this.currentDefinition?.infiniteHorizontal) return false;
        const normalizedRadius = Math.max(radius, 0);
        const minSegment = centerSegment - normalizedRadius;
        const maxSegment = centerSegment + normalizedRadius;
        let changed = false;

        for (let segmentIndex = minSegment; segmentIndex <= maxSegment; segmentIndex += 1) {
            changed = this.ensureHorizontalSegment(segmentIndex) || changed;
        }

        const existingSegments = Array.from(this.segmentLayers.keys());
        existingSegments.forEach((segmentIndex) => {
            if (segmentIndex < minSegment || segmentIndex > maxSegment) {
                this.destroyHorizontalSegment(segmentIndex);
                changed = true;
            }
        });

        if (changed) {
            this.recalculateSegmentRange();
            this.normalizeLayerDepths();
            this.refreshCollisionBindings();
            this.applyWorldBounds();
        }
        return changed;
    }

    destroyHorizontalSegment(segmentIndex) {
        const segment = this.segmentLayers.get(segmentIndex);
        if (!segment) return false;

        segment.layers.forEach(({ layer }) => {
            if (layer?.destroy) {
                layer.destroy();
            }
        });
        this.mapLayers = this.mapLayers.filter((entry) => entry.segmentIndex !== segmentIndex);
        if (segment.tilemap?.destroy) {
            segment.tilemap.destroy();
        }
        this.tilemaps = this.tilemaps.filter((tilemap) => tilemap !== segment.tilemap);
        this.segmentLayers.delete(segmentIndex);
        if (this.tilemap === segment.tilemap) {
            this.tilemap = this.tilemaps[0] ?? null;
        }
        return true;
    }

    recalculateSegmentRange() {
        const segmentIndexes = Array.from(this.segmentLayers.keys()).sort((a, b) => a - b);
        if (!segmentIndexes.length) {
            this.segmentRange = { min: 0, max: 0 };
            this.tilemap = null;
            return;
        }
        this.segmentRange = {
            min: segmentIndexes[0],
            max: segmentIndexes[segmentIndexes.length - 1]
        };
        if (!this.tilemap) {
            this.tilemap = this.segmentLayers.get(segmentIndexes[0])?.tilemap ?? null;
        }
    }

    refreshCollisionBindings() {
        this.collisionVersion += 1;
        const collisionTargets = Array.from(this.objectColliders.keys());
        collisionTargets.forEach((target) => {
            this.removeObjectCollisions(target);
            target._mapCollisionVersion = null;
        });
        collisionTargets.forEach((target) => {
            this.enableObjectCollisions(target);
        });
        this.refreshMapColliderRegistry();
    }

    refreshMapColliderRegistry() {
        this.mapColliders = Array.from(this.objectColliders.values()).flat();
    }

    buildRuntimeTilesets(tilemap, definition) {
        const configTilesets = Array.isArray(definition.tilesets) ? definition.tilesets : [];
        const mapTilesets = Array.isArray(tilemap?.tilesets) ? tilemap.tilesets : [];

        return mapTilesets.map((mapTileset, index) => {
            const configTileset = configTilesets.find((entry) => entry.name === mapTileset.name) ?? configTilesets[index] ?? {};
            return {
                name: mapTileset.name,
                imageKey: configTileset.imageKey ?? mapTileset.image,
                tileWidth: configTileset.tileWidth ?? mapTileset.tilewidth ?? mapTileset.tileWidth ?? 16,
                tileHeight: configTileset.tileHeight ?? mapTileset.tileheight ?? mapTileset.tileHeight ?? 16
            };
        });
    }

    resolveRuntimeLayers(tilemap, definition) {
        const configLayers = Array.isArray(definition.layers) ? definition.layers : [];
        const configByName = new Map(
            configLayers.map((layer) => [String(layer.name || '').toLowerCase(), layer])
        );
        const mapLayers = Array.isArray(tilemap?.layers) ? tilemap.layers : [];
        let tileLayerIndex = 0;

        return mapLayers
            .filter((layer) => !layer?.type || layer.type === 'tilelayer')
            .map((layer, index) => {
                const configLayer = configByName.get(String(layer?.name || '').toLowerCase()) ?? configLayers[tileLayerIndex] ?? {};
                const colliderProperty = Array.isArray(layer?.properties)
                    ? layer.properties.find((property) => property?.name === 'collider')
                    : null;

                tileLayerIndex += 1;

                return {
                    name: layer?.name ?? configLayer.name ?? `Layer ${index + 1}`,
                    depth: configLayer.depth ?? layer?.depth ?? index,
                    collidable: colliderProperty?.value ?? configLayer.collidable ?? layer?.collidable ?? false,
                    offsetX: layer?.x ?? configLayer.offsetX ?? 0,
                    offsetY: layer?.y ?? configLayer.offsetY ?? 0
                };
            });
    }
}
