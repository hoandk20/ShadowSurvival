// config/map.js

const MAPROCK_KEY = 'maprock_field';
const CHURCH_KEY = 'church_sanctuary';
const INSIDE_CHURCH_KEY = 'inside_church';
const MAP_BASE_PATH = 'assets/map';
const MUSIC_BASE_PATH = 'assets/music';

const MAP_DEFINITIONS = {
    maprock_field: {
        id: MAPROCK_KEY,
        label: 'MapRock Plateau',
        description: 'A ruined stone field layered with broken ground, props, and blocking terrain.',
        mapKey: MAPROCK_KEY,
        infiniteHorizontal: true,
        alternatingMirroredChunks: true,
        activeSegmentRadius: 2,
        preloadSegmentRadius: 2,
        segmentLoadMarginTiles: 12,
        music: {
            key: 'bgm_maprock_the_weight_of_stone',
            path: `${MUSIC_BASE_PATH}/The_Weight_of_Stone.mp3`,
            loop: true,
            volume: 0.45
        },
        format: 'tiled',
        jsonPath: `${MAP_BASE_PATH}/maprock/maprock.json`,
        tilesets: [
            {
                name: 'zombie_woman',
                imageKey: 'maprock_tilesheet',
                imagePath: `${MAP_BASE_PATH}/maprock/maprock.png`,
                tileWidth: 16,
                tileHeight: 16
            }
        ],
        layers: [
            { name: 'Layout1', depth: 0, collidable: false },
            { name: 'Layout 2', depth: 1, collidable: false },
            { name: 'block', depth: 2, collidable: true },
            { name: 'object1', depth: 3, collidable: false },
            { name: 'object2', depth: 4, collidable: false }
        ]
    },
    church_sanctuary: {
        id: CHURCH_KEY,
        label: 'Church Sanctuary',
        description: 'The Church Sanctuary has fallen. After the Shadow Collapse, the graves opened—and the dead rose.Nothing here rests anymore.',
        mapKey: CHURCH_KEY,
        infiniteHorizontal: true,
        alternatingMirroredChunks: true,
        activeSegmentRadius: 2,
        preloadSegmentRadius: 2,
        segmentLoadMarginTiles: 12,
        music: {
            key: 'bgm_church_sunlight_on_cold_stone',
            path: `${MUSIC_BASE_PATH}/Sunlight_on_Cold_Stone.mp3`,
            loop: true,
            volume: 0.45
        },
        format: 'tiled',
        jsonPath: `${MAP_BASE_PATH}/Church/Church.json`,
        tilesets: [
            {
                name: '1',
                imageKey: 'church_tilesheet',
                imagePath: `${MAP_BASE_PATH}/Church/Church.png`,
                tileWidth: 16,
                tileHeight: 16
            }
        ],
        layers: [
            { name: 'ground1', depth: 0, collidable: false },
            { name: 'ground2', depth: 1, collidable: false },
            { name: 'block', depth: 2, collidable: true },
            { name: 'object', depth: 3, collidable: false }
        ]
    },
    inside_church: {
        id: INSIDE_CHURCH_KEY,
        label: 'Inside Church',
        description: 'A once-sacred church now consumed by decay. Sealed during the plague, it became the birthplace of something far darker.',
        mapKey: INSIDE_CHURCH_KEY,
        infiniteHorizontal: true,
        activeSegmentRadius: 2,
        preloadSegmentRadius: 2,
        segmentLoadMarginTiles: 12,
        music: {
            key: 'bgm_inside_church_canticle_of_light',
            path: `${MUSIC_BASE_PATH}/Canticle_of_Light.mp3`,
            loop: true,
            volume: 0.45
        },
        format: 'tiled',
        jsonPath: `${MAP_BASE_PATH}/InsideChurch/InsideChurch.json`,
        tilesets: [
            {
                name: 'zombie_woman',
                imageKey: 'inside_church_tilesheet',
                imagePath: `${MAP_BASE_PATH}/InsideChurch/InsideChurch.png`,
                tileWidth: 16,
                tileHeight: 16
            }
        ],
        layers: [
            { name: 'ground1', depth: 0, collidable: false },
            { name: 'ground2', depth: 1, collidable: false },
            { name: 'block', depth: 2, collidable: true },
            { name: 'object1', depth: 3, collidable: false },
            { name: 'object2', depth: 4, collidable: false }
        ]
    }
};

export const DEFAULT_MAP_KEY = MAPROCK_KEY;

export function getMapDefinition(mapKey) {
    return MAP_DEFINITIONS[mapKey];
}

export function getAvailableMaps() {
    return Object.values(MAP_DEFINITIONS).map(({ id, label, description }) => ({ id, label, description }));
}

export default MAP_DEFINITIONS;
