# Rune Pixel Survivors

`Rune Pixel Survivors` is a browser-based survivor-action game built with `Phaser 3` and plain `ES modules`.

This README is intentionally config-first: the numbers below match the current game configuration in the repo.

## Current Status

Implemented now:

- single-player gameplay loop
- multiple playable characters
- character unlock system in the menu using `dynamon`, map-clear conditions, and meta-upgrade conditions
- character-specific passives and per-character level growth
- flexible `base stats + bonus stats` system
- permanent meta-upgrade system using `dynamon`
- skill system with `projectile` and `melee`
- supporter companion system
- status effect framework
- timed scenario spawn scaling
- wave-based run flow with shop breaks between waves
- pre-shop stat card choice before each shop
- shop stock, reroll, and lock persistence flow
- runtime debug panel for gameplay iteration
- hit feedback juice: screen shake and brief slow-motion / freeze-frame style timeScale moments on key events (not on every hit)

Not implemented as a shipped feature:

- real multiplayer / co-op
- active in-run level-up card roll flow on level-up in the current build
- deeper UI polish pass (transitions, more juice, consistency across overlays)
- late-game visual clarity pass (stacked VFX readability, telegraph contrast, effect density controls)
- richer audio layering/mix pass (currently music defaults to OFF; SFX is ON)

See [COOP_DECISION.md](./COOP_DECISION.md) for co-op planning notes.

## Core Config Files

- stats: [config/stats.js](./config/stats.js)
- characters: [config/characters/characters.js](./config/characters/characters.js)
- skills: [config/skill.js](./config/skill.js)
- supporters: [config/supporters.js](./config/supporters.js)
- pre-shop cards: [config/preShopCards.js](./config/preShopCards.js)
- meta upgrades: [config/metaUpgrades.js](./config/metaUpgrades.js)
- enemies: [config/enemies.js](./config/enemies.js)
- status effects: [config/statusEffects.js](./config/statusEffects.js)
- scenarios: [config/stageScenarios.js](./config/stageScenarios.js)

## Stat System

Characters and enemies now use `shared base stats + per-unit bonus stats`.

### Player Base Stats

Source: [config/stats.js](./config/stats.js)

| Stat | Key | Current base |
| --- | --- | ---: |
| HP | `hp` | 100 |
| Armor | `armor` | 1 |
| Armor Pierce | `armorPierce` | 0 |
| Skill Range | `skillRange` | 0 |
| Move Speed | `moveSpeed` | 105 |
| Knockback Multiplier | `knockbackMultiplier` | 1 |
| Damage Multiplier | `damageMultiplier` | 1 |
| Attack Speed | `attackSpeed` | 1 |
| Crit Chance | `critChance` | 0.1 |
| Crit Multiplier | `critMultiplier` | 1.5 |
| Area Size Multiplier | `areaSizeMultiplier` | 1 |
| Projectile Count | `projectileCount` | 1 |
| Effect Chance | `effectChance` | 0 |
| Effect Damage Multiplier | `effectDamageMultiplier` | 1 |
| Effect Duration Multiplier | `effectDurationMultiplier` | 1 |
| Shock Chain Count | `shockChainCount` | 0 |
| Pickup Range Multiplier | `pickupRangeMultiplier` | 1 |
| XP Gain Multiplier | `xpGainMultiplier` | 1 |
| Gold Gain Multiplier | `goldGainMultiplier` | 1 |
| HP Regen / sec | `healthRegenPerSecond` | 0 |
| Lifesteal | `lifesteal` | 0 |
| Shield | `shield` | 0 |
| Dodge | `dodge` | 0 |

Pickup note:

- current base loot pickup radius is `50`
- the actual pickup radius is `50 x pickupRangeMultiplier`
- `effectDamageMultiplier` now also scales supporter buff strength such as `Fairy` heal aura and some shield-related support effects

### Loot Values

Source: [config/items.js](./config/items.js)

- `xp_orb`: `22 XP`
- `gold_coin`: `2 gold`
- `health_flask`: `18 HP`

### Runtime Player Bonus Fields

Current runtime bonus fields used by `Player`:

- `bonusMaxHealthFlat`
- `bonusMaxHealthPercent`
- `bonusArmor`
- `bonusSkillRange`
- `bonusSpeedFlat`
- `bonusSpeedPercent`
- `bonusKnockbackMultiplier`
- `globalCritChanceBonus`
- `globalProjectileSpeedMultiplier`
- `globalSkillAreaMultiplier`
- per-skill stores such as `skillDamageBonusPercent`, `skillDamageFlatBonus`, `skillCooldownOffsets`, `skillAreaMultipliers`, `skillProjectileSpeedMultipliers`, `skillExplosionRadiusMultipliers`, `skillStunDurationMultipliers`, `skillEffectDurationBonuses`, `skillKnockbackCountBonuses`

### Enemy Base Stats

Source: [config/stats.js](./config/stats.js)

| Stat | Key | Current base |
| --- | --- | ---: |
| HP | `maxHealth` | 10 |
| Damage | `damage` | 15 |
| Move Speed | `moveSpeed` | 60 |
| Armor | `armor` | 2 |
| Effect Resist | `effectResist` | 0 |
| Attack Cooldown | `attackCooldown` | 500 |
| Attack Range | `attackRange` | 10 |
| Knockback Resist | `knockbackResist` | 1 |
| Stun Resist | `stunResist` | 1 |
| Ghost Duration | `ghostDuration` | 900 |
| Scale | `scale` | 1 |

## Character Roster

All values below are the final current values after `base stats + statsBonus`.

Source: [config/characters/characters.js](./config/characters/characters.js)

Character unlock note:

- free by default: `Lumina`, `Knight`
- `Witch` unlocks permanently by clearing `maprock_field`
- `Radian` unlocks permanently by clearing `church_sanctuary`
- `Asian Dragon` unlocks permanently by clearing `inside_church`
- `Assasin` unlocks permanently by maxing the `Crit Chance` meta upgrade
- all other locked characters are unlocked permanently from the character select menu using `dynamon`

Current unlock costs:

| Character | Cost |
| --- | ---: |
| `Aqua` | `260` |
| `Frost` | `360` |
| `Bodoi` | `520` |
| `Gambler` | `580` |
| `Raiji` | `640` |
| `Warden` | `700` |
| `Werewolf` | `780` |

Current character passive note:

- `Lumina`: `skillRange +40`; level growth `+1 HP`, `+2 shooting_star damage` per level
- `Knight`: `dodge +20%`
- `Aqua`: `Tidal Flow (water hits build Flow; at 5 stacks the next water cast triggers a freezing Splash Burst)`; level growth `+6 HP`, `+1.5% area size`, `+1.5% projectile speed` per level
- `Radian`: `Ghost Summon calls forth spirits that persistently hunt nearby enemies`; level growth `+5 HP`, `+1 ghost_summon damage` per level
- `Frost`: `casts Frost Zone (tick damage + brief freeze after repeated hits)`; level growth `+5 HP`, `+1.5% effect chance`, `+1 frost_zone damage` per level
- `Witch`: `casts Ritual Zone (slow + tick damage)`; level growth `+4 HP`, `+1.5% effect damage`, `+1% crit chance` per level
- `Asian Dragon`: `Flame explodes for 30% bonus damage and leaves a burn cloud`; level growth `+4 HP`, `+1 flame damage`, `+1% effect damage` per level
- `Bodoi`: `Mu Coi auto-aims, chains once, and triggers a small burst when it redirects`; level growth `+4 HP`, `+1 mu_coi damage`, `+1.5% projectile speed` per level
- `Gambler`: `Loaded Deck (+8% crit chance; Card Toss fires a 3-card fan with the center card aiming true)`; level growth `+4 HP`, `+1 card_toss damage`, `+1% crit chance` per level
- `Raiji`: `Static Surge (+1 shock chain and sharper lightning crits)`; level growth `+4 HP`, `+1 thunder damage`, `+1% crit chance` per level
- `Warden`: `Detention Mark (marks last 6s; fire prioritizes marked targets; hit 2 triggers a small explosion and brief root, then resets)`
- `Assasin`: `Phantom Slash (critical stab hits trigger a ghostly ambush slash for 35% bonus damage about once every 0.7s, cutting through a nearby enemy)`
- `Werewolf`: `Below 50% HP: +15% attack speed, +10 move speed, +8% lifesteal; hits against bleeding targets heal 1.5% max HP`; level growth `+5 HP`, `+2 move speed`, `+2 claw damage` per level

| Character | Default skill | Style | HP | Armor | Move Speed | Crit Chance |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Lumina | `shooting_star` | ranged | 75 | 1 | 105 | 0.1 |
| Aqua | `nova` | ranged | 140 | 1 | 105 | 0.1 |
| Radian | `ghost_summon` | ranged | 105 | 1 | 105 | 0.1 |
| Frost | `frost_zone` | ranged | 100 | 1 | 108 | 0.1 |
| Witch | `ritual_zone` | ranged | 75 | 1 | 112 | 0.35 |
| Asian Dragon | `flame` | ranged | 75 | 1 | 112 | 0.1 |
| Bodoi | `mu_coi` | ranged | 80 | 1 | 112 | 0.1 |
| Gambler | `card_toss` | ranged | 85 | 1 | 110 | 0.18 |
| Raiji | `thunder` | ranged | 75 | 2 | 113 | 0.12 |
| Warden | `fire` | ranged | 110 | 2 | 103 | 0.1 |
| Werewolf | `claw` | melee | 135 | 2 | 107 | 0.18 |
| Assasin | `stab` | melee | 85 | 1 | 115 | 0.2 |
| Knight | `slash` | melee | 120 | 3 | 100 | 0.1 |

## Skill Mechanics

Main runtime files:

- [entities/Player.js](./entities/Player.js)
- [entities/Skill.js](./entities/Skill.js)
- [systems/skills/SkillBehaviorPipeline.js](./systems/skills/SkillBehaviorPipeline.js)
- [systems/skills/behaviors/directHitBehavior.js](./systems/skills/behaviors/directHitBehavior.js)

### Ranged Skill Rules

Current projectile behavior:

- ranged skills use `category: 'projectile'`
- projectile skills now only auto-cast if at least one enemy is inside that skill's configured range
- the range check uses `overlapCirc`, squared-distance checks, and viewport filtering
- projectile skills still need to physically reach or overlap enemies to hit
- ranged skills do not auto-hit instantly
- default knockback is currently disabled for all skills at config-normalize level

### Melee Skill Rules

Current melee behavior:

- melee skills use `category: 'melee'`
- `claw` and `stab` auto-hit the nearest valid enemy in melee range
- `slash` uses an arc target mode and can hit multiple enemies in a 180-degree frontal sweep
- melee skills do not fly like projectiles
- melee hit VFX is now tied to the skill itself, not just to the character
- melee VFX only appears when the actual hitting skill is a melee skill
- enemy melee attacks now also require a short in-range engage delay before windup, so brief contact does not instantly start a hit

### Projectile Variant Rules

- `thunder` now behaves as a normal `projectile` skill with `attackStyle: 'chain_lightning_strike'`
- `charm` behaves as a normal `projectile` skill (auto-aim projectile volley)
- `ghost_summon` is a summon-style skill (Radian default)

## Skill Table

Source: [config/skill.js](./config/skill.js)

### Projectile Skills

| Skill | Damage | Cooldown | Duration | Range | Speed | Hitbox | Targeting / Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `ritual_zone` | 24 | 2300 | 1500 | 160 | - | - | places a cursed ritual zone, ticks every `400ms`, slow `0.65` |
| `frost_zone` | 20 | 2200 | 1500 | 150 | - | - | places a frost zone, ticks every `320ms`, no slow, freezes briefly after `4` hits on the same target |
| `nova` | 16 | 1400 | 800 | 140 | 400 | `20x8` | straight projectile |
| `shooting_star` | 22 | 1000 | 1600 | 140 | 800 | `40x15` | auto-aim projectile, destroy on hit |
| `fire` | 18 | 1800 | 10000 | 120 | 260 | `20x20` | homing, prioritizes marked targets, hit 1 marks for `6s`, hit 2 detonates and briefly roots |
| `flame` | 22 | 2500 | 1800 | 130 | 240 | `50x30` | auto-aim, 30% on-hit explosion, leaves a burn cloud |
| `code` | 15 | 3000 | 1800 | 140 | 150 | `10x10` | auto-aim, hidden sprite, `codeProjectile` |
| `mu_coi` | 18 | 2000 | 8000 | 140 | 500 | `12x12` | auto-aim, small green-gold burst on chain, retargets once to another enemy on hit, then disappears |
| `card_toss` | 18 | 1500 | 1800 | 145 | 400 | `10x15` | auto-aim 3-card fan, spin |

### Melee Skills

| Skill | Damage | Cooldown | Duration | Melee Range | Cast Gap | Hitbox | Current hit effect |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `claw` | 22 | 1200 | 1200 | 34 | 22 | `20x40` | blood wolf slash |
| `stab` | 18 | 820 | 900 | 30 | 20 | `18x34` | knife-like single slash |
| `slash` | 24 | 1700 | 1000 | 38 | 24 | `44x44` | 180-degree knight slash arc |

### Projectile Variant Skills

| Skill | Category | Damage | Cooldown | Duration | Key behavior |
| --- | --- | ---: | ---: | ---: | --- |
| `thunder` | projectile | 14 | 1000 | 300 | chain lightning strike with direct projectile chaining disabled; shock still handles spread |
| `charm` | projectile | 18 | 3000 | 2000 | auto-aim projectile volley |

### Important Skill Notes

- current projectile ranges are intentionally compressed into the `110-150` band
- melee ranges are currently `34`, `30`, and `38`
- extra projectiles no longer deal full duplicate damage
- if `projectileCount = 1`, the skill still deals `100%` base damage
- if `projectileCount > 1`, each projectile uses `baseDamage / projectileCount + 0.1 x baseDamage`
- default explosion is not assigned to any skill right now
- `explosion` exists as a status effect config, ready to be attached later
- normalized skill knockback currently defaults to `100`

### Summon Skills

- `ghost_summon` is a Radian-only summon skill (default spawns `2` ghosts, ghost base damage `13`, and scales with `projectileCount`)
- ghosts are melee summons that try to spread targets (but prioritize bosses when present)
- ghosts expire after `20s` and are re-summoned in a loop

## Shop Items

Source: [config/shopItems.js](./config/shopItems.js)

Current shop item groups:

- `stat`
- `hybrid`
- `effect`
- `utility`
- `unlock_element`

Current runtime shop notes:

- normal shop stock shows `5` items at a time
- shop reroll has no hard limit
- reroll cost starts at `10` gold and doubles each time inside the same shop: `10 -> 20 -> 40 -> ...`
- reroll cost resets to `10` at the next wave shop
- reroll is disabled when the player does not have enough gold
- reroll type uses relative weights: `stat 0.5`, `hybrid 0.35`, `effect 0.1`, `utility 0.05`, `unlock_element 0.1`
- current approximate per-slot odds are: `stat 45.45%`, `hybrid 31.82%`, `effect 9.09%`, `utility 4.55%`, `unlock_element 9.09%`
- items can be purchased by clicking directly on the item card
- item price text turns red when the player cannot afford it
- after buying an item, that slot stays empty until reroll or the next wave shop
- buying the same item again later increases that item's future price by `20%` per purchase in the current run
- each item card has a `lock / unlock` icon below the price
- locked items survive rerolls
- when a new wave shop opens, only locked items are preserved
- unlocked items are rerolled completely on the next wave shop
- bought items can appear again later, but duplicate items do not appear in the same shop stock at the same time
- some effect items only appear if their matching status effect is currently active on the player's skill
- debug shop shows all items and disables lock behavior

### Stat Items

New armor item notes:

- `Iron Armo`: a cheap armor pickup that adds defense but slows movement
- `Ice Armo`: a premium armor pickup that adds heavy defense but slows attack speed

| Item | Cost | Current modifiers |
| --- | ---: | --- |
| `Iron Sword` | `43` | `damageMultiplier +0.07`, `skillRange -5` |
| `Sharpened Blade` | `43` | `critChance +0.03` |
| `Heavy Edge` | `43` | `critMultiplier +0.08`, `skillRange -5` |
| `Quick Gloves` | `45` | `attackSpeed +0.08`, `moveSpeed -5` |
| `Battle Focus` | `51` | `damageMultiplier +0.08`, `critChance +0.08`, `armor -3` |
| `Steel Armor` | `42` | `armor +2`, `hp -10` |
| `Iron Armo` | `50` | `armor +2`, `moveSpeed -5` |
| `Ice Armo` | `100` | `armor +3`, `attackSpeed -0.15` |
| `Vital Ring` | `42` | `hp +20`, `armor -1` |
| `Regeneration Charm` | `42` | `healthRegenPerSecond +1`, `hp -10` |
| `Blood Pendant` | `45` | `lifesteal +0.05`, `attackSpeed -0.1` |
| `Guardian Core` | `60` | `shield +25`, `xpGainMultiplier +0.2`, `armor -1` |
| `Swift Boots` | `40` | `moveSpeed +1`, `attackSpeed -0.05` |
| `Wide Grip` | `42` | `effectDamageMultiplier +0.1`, `damageMultiplier -0.05` |
| `Extended Core` | `47` | `skillRange +10`, `moveSpeed -5` |
| `Extra Barrel` | `70` | `projectileCount +1`, `+1 projectile, but lowers damage per shot` |
| `Cooldown Module` | `40` | `attackSpeed +0.08`, `healthRegenPerSecond -0.3` |
| `Combat Injector` | `47` | `attackSpeed +0.08`, `damageMultiplier +0.08`, `effectDamageMultiplier -0.1` |
| `Force Core` | `47` | `knockbackMultiplier +0.4`, `damageMultiplier +0.05`, `hp -10` |

### Hybrid Items

| Item | Cost | Current modifiers |
| --- | ---: | --- |
| `Glass Cannon` | `40` | `damageMultiplier +0.1`, `armor -5` |
| `Berserker Blood` | `40` | `dodge +15%`, `hp -20` |
| `Sniper Scope` | `40` | `critChance +0.1`, `attackSpeed -0.15` |
| `Heavy Payload` | `40` | `projectileCount +1`, `attackSpeed -0.15` |
| `Overcharged Reactor` | `40` | `skillRange +10`, `attackSpeed -0.15` |
| `Unstable Shield` | `40` | `shield +30`, `armor -2` |
| `Speed Injector` | `40` | `moveSpeed +10`, `damageMultiplier -0.1` |
| `Overgrowth Engine` | `40` | `areaSizeMultiplier +0.2`, `attackSpeed -0.1` |
| `Time Distorter` | `40` | `armor -2`, `dodge +10%` |
| `Abyssal Catalyst` | `40` | `damageMultiplier +0.8`, `effectDamageMultiplier +0.8`, `healthRegenPerSecond -1.5` |
| `Singularity Field` | `40` | `areaSizeMultiplier +0.5`, `knockbackMultiplier +0.5`, `damageMultiplier -0.15` |
| `Phantom Stride` | `40` | `moveSpeed +10`, `pickupRangeMultiplier +0.15`, `armor -2` |
| `Rotheart Sigil` | `40` | `effectChance +0.15`, `effectDamageMultiplier +0.1`, `damageMultiplier -0.1` |
| `Fractured Tempo` | `40` | `attackSpeed +0.15`, `damageMultiplier -0.05`, `knockbackMultiplier -0.2` |
| `Vampire Pact` | `40` | `lifesteal +0.05`, `hp -20` |
| `Reckless Core` | `40` | `critMultiplier +0.15`, `hp -15` |
| `Impact Engine` | `50` | `knockbackMultiplier +0.3`, `damageMultiplier +0.05` |

### Effect Items

New effect item note:

- `Fire Coat`: grants bonus HP and emits a periodic fire aura that damages and burns nearby enemies

| Item | Cost | Current modifiers / bonuses |
| --- | ---: | --- |
| `Toxic Catalyst` | `56` | `effectChance +0.1`, `effectDamageMultiplier +0.1`, `dodge -7%` |
| `Lingering Curse` | `73` | `attackSpeed +0.8`, `effectDurationMultiplier +0.8` |
| `Chain Amplifier` | `79` | `shockChainCount +1`, only rolls if `shock` is active |
| `Flame` | `56` | `burn.explodeOnMaxStacks = true`, only rolls if `burn` is active |
| `Venom Trail` | `55` | `hp -20`, `effectDamageMultiplier +0.1`, `poison.spawnTrail = true`, leaves a poison trail even without `Poison Core` |
| `Fire Coat` | `100` | `hp +20`, `armor -2`, every `1s` pulses fire in `radius 70`, deals damage equal to `15%` of owner max HP, and applies `burn` on each pulse |
| `Elemental Overload` | `58` | `effectChance +0.1`, `effectDamageMultiplier +0.1`, `damageMultiplier -0.1` |
| `Shockwave Core` | `50` | `shock.chainDamageBonus +0.05`, only rolls if `shock` is active |

### Unlock Element Items

| Item | Cost | Current unlock |
| --- | ---: | --- |
| `Fire Core` | `70` | unlock `burn` on the current skill, `50%` effect chance |
| `Ice Core` | `70` | unlock `freeze` on the current skill, `50%` effect chance |
| `Poison Core` | `70` | unlock `poison` on the current skill, `50%` effect chance |
| `Shock Core` | `70` | unlock `shock` on the current skill, `50%` effect chance |
| `Aim Core` | `70` | unlock `mark` on the current skill, `50%` effect chance |
| `Afang` | `70` | unlock `bleed` on the current skill, `50%` effect chance |
| `Explore Core` | `70` | add `explosion` as a bonus on-hit effect without replacing the current main status effect, explosion radius `59` |

### Utility Items

| Item | Cost | Current modifiers |
| --- | ---: | --- |
| `Magnet Core` | `70` | `pickupRangeMultiplier +0.15` |
| `Golden Idol` | `72` | `goldGainMultiplier +0.1`, `damageMultiplier -0.1` |
| `Greed Engine` | `72` | `goldGainMultiplier +0.1`, `hp -20` |

Armor note:

- player armor can now go below `0`
- negative armor increases damage taken from enemy attacks by the same amount
- example: `armor = -5` means an enemy hit deals `+5` extra damage

## Status Effects

Source: [config/statusEffects.js](./config/statusEffects.js)

| Effect | Current default stats |
| --- | --- |
| `burn` | `durationMs: 4000`, `damageRatioPerTick: 0.3`, `minDamagePerTick: 5`, `reapplyDelayMs: 400`, `maxStacks: 6` |
| `shock` | `durationMs: 2000`, `slowDurationMs: 2000`, `slowMultiplier: 0.7`, `chainCount: 2`, `chainRadius: 120`, `chainDamageRatios: [0.75, 0.5, 0.25]`, `chainStepDelayMs: 90`, `maxStacks: 4` |
| `freeze` | `durationMs: 1500`, `mode: 'stun'`, `slowMultiplier: 0`, `maxStacks: 1` |
| `petrify` | `durationMs: 700`, `mode: 'stun'`, `slowMultiplier: 0`, `maxStacks: 1` |
| `ritual_slow` | `durationMs: 650`, `slowMultiplier: 0.65`, `maxStacks: 1` |
| `root` | `durationMs: 550`, `speedMultiplier: 0`, `maxStacks: 1` |
| `poison` | `durationMs: 4000`, `damageRatioPerTick: 0.3`, `minDamagePerTick: 5`, `trailIntervalMs: 700`, `trailDamage: 4`, `antiHealMultiplier: 0.35`, `reapplyDelayMs: 400`, `maxStacks: 6` |
| `shield` | `durationMs: 0`, `capacity: 50`, `refillIntervalMs: 10000`, `maxStacks: 1` |
| `bleed` | `durationMs: 4000`, `damageRatioPerTick: 0.3`, `minDamagePerTick: 5`, `burstDamage: 10`, `reapplyDelayMs: 400`, `maxStacks: 10` |
| `mark` | `durationMs: 5000`, `damageIncreasePerStack: 0.25`, `maxStacks: 1` |
| `explosion` | `durationMs: 0`, `radius: 45`, `damageRatio: 0.5`, `maxStacks: 1` |

Current framework notes:

- each skill currently supports up to `1` configured status effect entry
- supporters also currently support a single effect slot in debug flow
- explosion is now a status effect, not a legacy skill behavior
- skills currently have no default explosion attached

## Supporters

Main files:

- [config/supporters.js](./config/supporters.js)
- [entities/Supporter.js](./entities/Supporter.js)
- [entities/SupporterOrb.js](./entities/SupporterOrb.js)
- [systems/SupporterSystem.js](./systems/SupporterSystem.js)

Current supporter mechanics:

- the run starts with no supporter by default
- after clearing wave `3`, the game presents a supporter choice popup before the shop opens
- the wave `3` supporter popup currently shows `4` supporter cards
- supporter reroll costs `10` gold, starts with `3` rerolls, and is disabled at `0`
- attack supporters now use attack ranges in the `120-150` band
- attack styles include normal `orb`, `claw_slash`, and `chain_lightning`
- support styles include `heal_aura` and `armor_aura`
- supporter damage, attack speed, effect duration, and effect damage now scale from the player stats/items
- support-style supporters can also attack while keeping their buff behavior
- support-style supporter hits currently reduce their own buff cooldown by `0.5s`
- multi-projectile effect supporters now try to split shots across different nearby enemies before reusing the same target
- melee supporters use `movementStyle: 'melee_follow'` instead of orbiting while engaging enemies
- melee supporters use `attackArea` around the player to decide when to chase and when to return
- `blood_wolf` and `rock` currently use melee follow with `attackArea: 100`

| Supporter | Style | Range / Interval | Damage / Support | Passive |
| --- | --- | --- | --- | --- |
| `blackcat` | orb | range `140`, cooldown `1350` | damage `25`, speed `300` | `goldGainMultiplier +0.2`, `critChance +0.05` |
| `blood_wolf` | claw slash | range `20`, cooldown `1500`, attack area `100` | damage `30`, always applies `bleed` | `lifesteal +0.1`, melee characters gain `attackSpeed +0.3` |
| `fairy` | heal aura | interval `15000` | heal `25` base, scales with `effectDamageMultiplier`, each hit reduces buff cooldown by `0.5s` | `healthRegenPerSecond +1`, `maxHealthPercent +0.1` |
| `bluebird` | orb | range `150`, cooldown `1250` | damage `26`, speed `340` | `projectileSpeedPercent +0.2`, `armorPierce +0.2` |
| `eye_monster` | orb | range `130`, cooldown `1500` | damage `28`, speed `260` | `skillRange +30`, `critMultiplier +0.1`, `mark on hit 100%` |
| `dragon_ice` | orb | range `145`, cooldown `1300` | damage `29`, speed `320` | `freeze on hit 100%`, `effectDurationMultiplier +0.3` |
| `fire_spirite` | orb | range `135`, cooldown `1100` | damage `27`, speed `360` | `burn on hit 100%`, `effectDamageMultiplier +0.3` |
| `shock_mouse` | chain lightning | range `150`, cooldown `1150` | damage `31`, speed `380` | `shock on hit 100%`, `shockChainCountBonus +1`, `attackSpeed +0.1` |
| `poison_ball` | orb | range `140`, cooldown `1200` | damage `27`, speed `320` | `poison on hit 100%`, `effectDurationMultiplier +0.2`, `effectDamageMultiplier +0.1` |
| `shield_drone` | armor aura | interval `2200` | armor `+8` base, scales with `effectDamageMultiplier`, each hit reduces buff cooldown by `0.5s` | `armor +1`, `shieldResetAmount 20` every `15s` |
| `rock` | claw slash | range `20`, cooldown `2000`, attack area `100` | damage `35` | `knockbackMultiplier +0.3`, `armor +5`, gray explosion on hit `30%` |

## Enemy Config

Main files:

- [config/enemies.js](./config/enemies.js)
- [entities/Enemy.js](./entities/Enemy.js)

Current important notes:

- all enemies derive from shared enemy base stats
- enemies are now split into `combatType: 'melee'` and `combatType: 'ranged'`
- shared enemy base armor is currently `2`
- melee enemies use delayed attacks with a short windup instead of dealing damage instantly on contact
- default melee enemies now use an engage delay of about `90ms` and a windup of about `110ms`
- attack presentation is further split by `attackStyle`, so melee and ranged enemies can have multiple attack variants
- `dash_lunge` enemies now telegraph, dash through other enemies, and can still damage the player while passing through
- current runtime no longer uses `spawnWeight`
- `maprock_field` now uses a scripted wave plan instead of unlocked-enemy random spawn
- `church_sanctuary` now also uses a scripted wave plan in the same style as `maprock_field`
- enemy hit feedback is still active via damage tint and damage text
- health number text above enemies is hidden by default
- `succubus` now uses a `burst shooter` ranged style
- `lamia` uses a poison trap cloud ranged style
- `firer` uses a fire trap cloud ranged style
- `ailen` uses a sniper ranged style, and `ailen` miniboss can summon `bomber`
- `bomber` is configured as `explode on contact` with a `200ms` contact fuse

Current notable per-enemy overrides from [config/enemies.js](./config/enemies.js):

- many melee enemies now sit in the `80-90` move speed band
- `skeleton` and `kitsume`: final move speed `90`, `attackRange 200`, `attackCooldown 900`, `attackStyle: dash_lunge`
- `succubus`, `lamia`, `widow`, `bat`: final move speed `83`
- `worm`, `rat`, `slime`, `mummy`, `zombie_woman`, `moth_woman`, `demonbat`, and most bosses: final move speed `80`
- `zombie_woman`: `knockbackResist +8`
- most melee enemies now effectively attack at range `10`
- `eyes`: `behavior: ranged`, final `damage: 14`, `moveSpeed: 55`, `attackCooldown: 850`, `attackRange: 190`, preferred range `200`, enemy projectile speed `230`
- `medusa`, `minotau`, `baphomet`, `dino`, `bugmonster`, `cursed_maiden`: marked as bosses

## Scenario / Shop / Debug

Current runtime flow:

- `maprock_field` now runs a scripted `20`-wave plan
- `church_sanctuary` now also runs a scripted `20`-wave plan with a different enemy roster
- `inside_church` now also runs a scripted `20`-wave plan (same structure as `church_sanctuary`, different roster)
- maps can define an `atmosphere` overlay in [config/map.js](./config/map.js) to darken just the tilemap background while keeping players/enemies/telegraphs bright (fixed-screen `MULTIPLY` rectangle with a low depth)
- weighted wave spawn is supported inside scripted wave plans
- each wave shows a `WAVE N` banner and waits about `2s` before enemies start spawning
- each wave also shows a centered countdown timer at the top of the screen
- a wave ends when either its timer expires or all wave enemies are killed
- when a wave ends by timeout, remaining enemies from that wave are cleared
- `maprock_field` progression is:
  - waves `1-5`: `worm`, wave `5` miniboss `kitsume`
  - waves `6-10`: add `bat` and `eyes`, wave `10` miniboss `skeleton`
  - waves `11-15`: add `bomber`, wave `15` miniboss mix `kitsume + skeleton`
  - waves `16-20`: add `mummy`, wave `20` includes `giant_rock`
- `church_sanctuary` mirrors the same 20-wave structure with roster swaps:
  - `kitsume -> ailen`
  - `giant_rock -> plant`
  - `worm -> slime`
  - `bat -> widow`
  - `eyes -> succubus + lamia`
  - `mummy -> bugmonster`
- `inside_church` uses the same 20-wave structure with its own roster swaps:
  - `slime -> dino`
  - `bugmonster -> moth_woman`
  - `lamia -> firer`
  - wave `5` miniboss: `medusa` (instead of `ailen`)
  - wave `10` miniboss: `minotau` (instead of `skeleton`)
  - wave `20` boss: `black_widow` (instead of `plant`)
- the maximum number of enemies alive on the map at once is currently `25`
- about `2s` after a wave ends, the shop flow begins
- before the shop opens, the game now rolls `4` stat cards and the player picks `1`
- pre-shop card reroll costs `10` gold and allows up to `3` rerolls
- pre-shop card rarity unlocks are: before wave `5` only `normal`, from wave `5` `epic`, from wave `10` `legendary`
- pre-shop card rarity weights are currently:
  - before wave `5`: `Normal 100%`
  - wave `5-9`: `Normal 66.67%`, `Epic 33.33%`
  - wave `10+`: `Normal 60%`, `Epic 30%`, `Legendary 10%`
- if the player still has no supporter, clearing wave `1` opens a supporter selection popup before the shop
- the supporter selection popup at wave `1` shows `4` options and supports rerolling up to `3` times for `10` gold each
- after the supporter popup at wave `1`, the pre-shop card choice still appears before the shop
- when the shop opens, all active enemies and enemy projectiles are cleared
- after leaving the shop, the next wave begins
- normal shop shows `5` items
- reroll cost doubles during the same shop and resets on the next wave
- locked shop items persist across rerolls and across wave transitions
- elite spawn system is removed

### Pre-Shop Cards

Source: [config/preShopCards.js](./config/preShopCards.js)

- each pre-shop card roll shows `4` unique stat types
- the same stat type cannot appear twice in the same roll, even across rarities
- rarity order is weighted as `normal > epic > legendary`, currently `60 / 30 / 10` after wave `10`
- rarity colors are `gray`, `green`, and `orange`

| Card | Normal | Epic | Legendary |
| --- | ---: | ---: | ---: |
| HP | `+10` | `+20` | `+30` |
| Armor | `+1` | `+2` | `+3` |
| Damage | `+3%` | `+7%` | `+10%` |
| Effect Damage | `+5%` | `+7%` | `+10%` |
| Attack Speed | `+5%` | `+7%` | `+10%` |
| Crit Chance | `+3%` | `+5%` | `+7%` |
| Move Speed | `+3%` | `+7%` | `+10%` |
| Regen | `+0.3` | `+0.5` | `+0.7` |
| Lifesteal | `+1%` | `+2%` | `+3%` |
| Dodge | `+3%` | `+5%` | `+7%` |

Debug tooling currently supports:

- character switching
- supporter switching
- enemy toggles
- spawn interval override
- player HP override
- enemy HP override
- skill effect override per active skill
- supporter effect override
- manual shop opening

Current debug defaults:

- normal mode player gold starts at `0`
- debug mode player gold starts at `9999`
- player HP starts at `10000`
- enemy HP starts at `10000`

### Meta Progression (Dynamon)

- the game tracks an out-of-run currency `dynamon`
- `dynamon` is currently persisted via `localStorage` through `utils/metaProgress.js` (designed so it can be swapped to an account-backed provider later)
- clearing a wave grants `+7..10 dynamon`
- the main menu now includes an `UPGRADE` screen for permanent stat upgrades
- permanent upgrade definitions live in [config/metaUpgrades.js](./config/metaUpgrades.js)
- current local default meta save starts at `10000 dynamon`
- challenge-based character unlocks currently include:
  - `Witch`: clear `maprock_field`
  - `Radian`: clear `church_sanctuary`
  - `Asian Dragon`: clear `inside_church`
  - `Assasin`: max the `Crit Chance` meta upgrade
- permanent reroll upgrades currently affect:
  - pre-shop rerolls
  - supporter rerolls
  - normal shop reroll discount with a current floor of `6` gold

### Permanent Meta Upgrades

Source: [config/metaUpgrades.js](./config/metaUpgrades.js)

Current permanent upgrade groups:

- `Survival`
- `Economy`
- `Combat`

#### Survival

| Stat | Bonus mỗi level | Max | Cost |
| --- | ---: | ---: | --- |
| Max HP | `+6 HP` | `+30 HP` | `120 / 180 / 260 / 360 / 500` |
| Armor | `+0.4` | `+2` | `160 / 230 / 320 / 440 / 600` |
| Regen | `+0.12 HP/s` | `+0.6 HP/s` | `120 / 180 / 260 / 360 / 500` |
| Pickup Range | `+6%` | `+30%` | `120 / 180 / 260 / 360 / 500` |

#### Economy

| Stat | Bonus mỗi level | Max | Cost |
| --- | ---: | ---: | --- |
| Gold Gain | `+3%` | `+15%` | `160 / 230 / 320 / 440 / 600` |
| XP Gain | `+4%` | `+20%` | `160 / 230 / 320 / 440 / 600` |
| Shop Reroll Discount | `-1 gold` | `-5 gold` | `160 / 230 / 320 / 440 / 600` |
| Pre-shop Reroll | `Lv1: +1 reroll`, `Lv2: +1 reroll` | `+2 reroll` | `420 / 680` |
| Supporter Reroll | `Lv1: +1 reroll`, `Lv2: +1 reroll` | `+2 reroll` | `500 / 780` |

#### Combat

| Stat | Bonus mỗi level | Max | Cost |
| --- | ---: | ---: | --- |
| Damage | `+2.5%` | `+12.5%` | `160 / 230 / 320 / 440 / 600` |
| Attack Speed | `+2%` | `+10%` | `160 / 230 / 320 / 440 / 600` |
| Crit Chance | `+1.5%` | `+7.5%` | `160 / 230 / 320 / 440 / 600` |
| Effect Chance | `+2%` | `+10%` | `160 / 230 / 320 / 440 / 600` |

## Audio

Default audio config:

- music: `off`
- SFX: `on`

Source: [utils/audioSettings.js](./utils/audioSettings.js)

Settings persistence:

- audio settings are persisted via `localStorage`
- gameplay settings such as `DMG TEXT` and `DMG CAP` are also persisted via `localStorage`

Additional source:

- [utils/gameplaySettings.js](./utils/gameplaySettings.js)

## Summary

`Rune Pixel Survivors` currently ships as a config-driven single-player survivor game with:

- shared stat bases for player and enemy
- a mixed roster of ranged and melee characters
- a permanent character unlock layer using both `dynamon` purchases and challenge conditions
- projectile and melee skill styles
- attack and support supporters with explicit numeric configs
- a permanent meta-upgrade layer driven by `dynamon`
- pre-shop stat card picks with rarity-based upgrades
- a wave shop with reroll and lock persistence
- a dedicated status effect framework with current default values documented above
- scripted wave flow on map rock, plus shop breaks between waves

If you change balance numbers, update the matching config files first, then refresh this README so the documentation stays equal to the live data.
