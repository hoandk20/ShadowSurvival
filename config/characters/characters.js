// config/characters/characters.js
export const CHARACTER_CONFIG = {
    lumina: {
        label: 'Lumina',
        description: 'Radiant brawler who mirrors the Warlock build and skills.',
        assetKey: 'lumina',
        atlas: {
            key: 'lumina_atlas',
            texture: 'assets/player/lumina/lumina.png',
            atlasJSON: 'assets/player/lumina/lumina.json'
        },
        defaultSkill: 'heavenfall',
        speed: 150,
        size: { width: 40, height: 40 },
        animations: {
            idle: {
                frames: ['idle0.png', 'idle1.png', 'idle2.png'],
                frameRate: 5,
                loop: true
            },
            move: {
                frames: ['move0.png', 'move1.png', 'move2.png'],
                frameRate: 5,
                loop: true
            }
        }
    }
    ,
    aqua: {
        label: 'Aqua',
        description: 'Waterborn echo of Lumina with the same combat flow.',
        assetKey: 'aqua',
        atlas: {
            key: 'aqua_atlas',
            texture: 'assets/player/aqua/aqua.png',
            atlasJSON: 'assets/player/aqua/aqua.json'
        },
        defaultSkill: 'nova',
        speed: 100,
        size: { width: 40, height: 40 },
        animations: {
            idle: {
                frames: ['idle0.png', 'idle1.png', 'idle2.png'],
                frameRate: 4,
                loop: true
            },
            move: {
                frames: ['move0.png', 'move1.png', 'move2.png'],
                frameRate: 4,
                loop: true
            }
        }
    }
    ,
    radian: {
        label: 'Radian',
        description: 'Radiant echo of Aqua with identical movement and skills.',
        assetKey: 'radian',
        atlas: {
            key: 'radian_atlas',
            texture: 'assets/player/radian/radian.png',
            atlasJSON: 'assets/player/radian/radian.json'
        },
        defaultSkill: 'charm',
        speed: 150,
        size: { width: 40, height: 40 },
        animations: {
            idle: {
                frames: ['idle0.png', 'idle1.png', 'idle2.png'],
                frameRate: 5,
                loop: true
            },
            move: {
                frames: ['move0.png', 'move1.png', 'move2.png'],
                frameRate: 5,
                loop: true
            }
        }
    }
    ,
    frost: {
        label: 'Frost',
        description: 'Icy twin of Lumina wielding the same heavenly burst.',
        assetKey: 'frost',
        atlas: {
            key: 'frost_atlas',
            texture: 'assets/player/frost/frost.png',
            atlasJSON: 'assets/player/frost/frost.json'
        },
        defaultSkill: 'ice',
        speed: 150,
        size: { width: 40, height: 40 },
        animations: {
            idle: {
                frames: ['idle0.png', 'idle1.png', 'idle2.png'],
                frameRate: 5,
                loop: true
            },
            move: {
                frames: ['move0.png', 'move1.png', 'move2.png'],
                frameRate: 5,
                loop: true
            }
        }
    }
    ,
    holy: {
        label: 'Holy',
        description: 'Radiant brawler who mirrors Lumina and shares the Aura discipline.',
        assetKey: 'holy',
        atlas: {
            key: 'holy_atlas',
            texture: 'assets/player/holy/holy.png',
            atlasJSON: 'assets/player/holy/holy.json'
        },
        defaultSkill: 'aura',
        speed: 210,
        size: { width: 40, height: 40 },
        animations: {
            idle: {
                frames: ['idle0.png', 'idle1.png', 'idle2.png'],
                frameRate: 4,
                loop: true
            },
            move: {
                frames: ['move0.png', 'move1.png', 'move2.png'],
                frameRate: 4,
                loop: true
            }
        }
    }
    ,
    elf: {
        label: 'Elf',
        description: 'Radiant brawler with the same form as Lumina but preferring Avada.',
        assetKey: 'elf',
        atlas: {
            key: 'elf_atlas',
            texture: 'assets/player/elf/elf.png',
            atlasJSON: 'assets/player/elf/elf.json'
        },
        defaultSkill: 'avada',
        speed: 215,
        size: { width: 40, height: 40 },
        animations: {
            idle: {
                frames: ['idle0.png', 'idle1.png', 'idle2.png'],
                frameRate: 5,
                loop: true
            },
            move: {
                frames: ['move0.png', 'move1.png', 'move2.png'],
                frameRate: 5,
                loop: true
            }
        }
    }
    ,
    raiji: {
        label: 'Raiji',
        description: 'Lightning-born fighter sharing Lumina’s flow with thunder skills.',
        assetKey: 'raiji',
        atlas: {
            key: 'raiji_atlas',
            texture: 'assets/player/raiji/raiji.png',
            atlasJSON: 'assets/player/raiji/raiji.json'
        },
        defaultSkill: 'thuner',
        speed: 225,
        size: { width: 40, height: 40 },
        animations: {
            idle: {
                frames: ['idle0.png', 'idle1.png', 'idle2.png'],
                frameRate: 5,
                loop: true
            },
            move: {
                frames: ['move0.png', 'move1.png', 'move2.png'],
                frameRate: 5,
                loop: true
            }
        }
    }
    ,
    warden: {
        label: 'Warden',
        description: 'Armored defender mirroring the Elf form but wielding fire skills.',
        assetKey: 'warden',
        atlas: {
            key: 'warden_atlas',
            texture: 'assets/player/warden/warden.png',
            atlasJSON: 'assets/player/warden/warden.json'
        },
        defaultSkill: 'fire',
        speed: 190,
        size: { width: 40, height: 40 },
        animations: {
            idle: {
                frames: ['idle0.png', 'idle1.png', 'idle2.png'],
                frameRate: 5,
                loop: true
            },
            move: {
                frames: ['move0.png', 'move1.png', 'move2.png'],
                frameRate: 5,
                loop: true
            }
        }
    }
    ,
    grum: {
        label: 'Grum',
        description: 'Heavy sentinel echoing Aqua but defaults to Iron Fist.',
        assetKey: 'grum',
        atlas: {
            key: 'grum_atlas',
            texture: 'assets/player/grum/grum.png',
            atlasJSON: 'assets/player/grum/grum.json'
        },
        defaultSkill: 'iron_first',
        speed: 185,
        size: { width: 45, height: 45 },
        animations: {
            idle: {
                frames: ['idle0.png', 'idle1.png', 'idle2.png'],
                frameRate: 4,
                loop: true
            },
            move: {
                frames: ['move0.png', 'move1.png', 'move2.png'],
                frameRate: 4,
                loop: true
            }
        }
    }
};

export const DEFAULT_CHARACTER_KEY = 'lumina';

export const CHARACTER_KEYS = Object.keys(CHARACTER_CONFIG);

export function getCharacterConfig(key) {
    return CHARACTER_CONFIG[key] ?? CHARACTER_CONFIG[DEFAULT_CHARACTER_KEY];
}
