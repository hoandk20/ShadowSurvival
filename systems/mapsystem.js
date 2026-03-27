import { getAvailableMaps, getMapDefinition, DEFAULT_MAP_KEY } from '../config/map.js';

export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.tilemap = null;
        this.tilemaps = [];
        this.mapLayers = [];
        this.mapColliders = [];
        this.currentMapKey = null;
        this.currentDefinition = null;
    }

    preloadMaps() {
        Object.values(getAvailableMaps()).forEach((mapEntry) => {
            const definition = getMapDefinition(mapEntry.id);
            if (!definition) return;
            if (definition.jsonPath) {
                this.scene.load.tilemapTiledJSON(definition.mapKey, definition.jsonPath);
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
        if (this.scene.game && this.scene.game.renderer) {
            this.scene.game.renderer.pixelArt = true;
        }
        this.scene.cameras.main.roundPixels = true;

        const tilemap = this.scene.make.tilemap({ key: definition.mapKey });
        this.tilemaps = [tilemap];
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
        tilesets.forEach((tileset) => {
            const sourceTileset = (definition.tilesets ?? []).find((entry) => entry.name === tileset.name);
            const textureKey = sourceTileset?.imageKey ?? tileset.name;
            const texture = this.scene.textures.get(textureKey);
            if (texture) {
                texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
            }
        });
        const layers = this.resolveRuntimeLayers(tilemap, definition);
        layers.forEach((layerInfo) => {
            const layer = tilemap.createLayer(
                layerInfo.name,
                layerTilesets,
                layerInfo.offsetX ?? 0,
                layerInfo.offsetY ?? 0
            );
            if (!layer) {
                console.warn(`[MapManager] Failed to create layer "${layerInfo.name}" for map "${definition.mapKey}"`);
                return;
            }
            layer.setDepth(layerInfo.depth ?? 0);
            if (layerInfo.collidable) {
                layer.setCollisionByExclusion([-1], true);
            }
            this.mapLayers.push({ info: layerInfo, layer });
        });
        this.tilemap = tilemap;
        this.currentMapKey = mapKey;
        this.currentDefinition = definition;
        this.ensureBackgroundLayer();
        this.applyWorldBounds();
        return definition;
    }

    clearMap() {
        this.mapLayers.forEach(({ layer }) => {
            if (layer && layer.destroy) {
                layer.destroy();
            }
        });
        this.mapLayers = [];
        this.mapColliders.forEach((collider) => {
            if (collider && collider.destroy) {
                collider.destroy();
            }
        });
        this.mapColliders = [];
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
            width: this.tilemap.widthInPixels,
            height: this.tilemap.heightInPixels
        };
    }

    applyWorldBounds() {
        const { width, height } = this.getMapSize();
        if (!width || !height) return;
        this.scene.physics.world.setBounds(0, 0, width, height, true, true, true, true);
        this.scene.cameras.main.setBounds(0, 0, width, height);
    }

    enableObjectCollisions(gameObject) {
        if (!gameObject) return;
        this.mapLayers.forEach(({ info, layer }) => {
            if (info.collidable && layer) {
                const collider = this.scene.physics.add.collider(gameObject, layer);
                if (collider) {
                    this.mapColliders.push(collider);
                }
            }
        });
    }

    getMapList() {
        return getAvailableMaps();
    }

    getCurrentMap() {
        return this.currentDefinition ?? getMapDefinition(this.currentMapKey ?? DEFAULT_MAP_KEY);
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
