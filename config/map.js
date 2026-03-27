// config/map.js

const MAPROCK_KEY = 'maprock_field';
const CHURCH_KEY = 'church_sanctuary';
const MAP_BASE_PATH = 'assets/map';

const MAP_DEFINITIONS = {
    maprock_field: {
        id: MAPROCK_KEY,
        label: 'MapRock Plateau',
        description: 'Detailed MapRock export with layered tilesets and collision blocks.',
        mapKey: MAPROCK_KEY,
        format: 'tiled',
        jsonPath: `${MAP_BASE_PATH}/maprock/maprock.json`,
        tilesets: [
            {
                name: 'spritefusion',
                imageKey: 'maprock_tilesheet',
                imagePath: `${MAP_BASE_PATH}/maprock/maprock.png`,
                tileWidth: 16,
                tileHeight: 16
            }
        ],
        layers: [
            { name: 'background', depth: 0, collidable: false },
            { name: 'background2', depth: 1, collidable: false },
            { name: 'Object', depth: 2, collidable: false },
            { name: 'Block', depth: 3, collidable: true }
        ]
    },
    church_sanctuary: {
        id: CHURCH_KEY,
        label: 'Church Sanctuary',
        description: 'Tiled-format church map with layered ground, props, and blocking walls.',
        mapKey: CHURCH_KEY,
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
