# Shadow Survivors

`Shadow Survivors` is a browser-based survivor-action game built with `Phaser 3` and plain `ES modules`.

This README is intentionally config-first: the numbers below match the current game configuration in the repo.

## Current Status

Implemented now:

- single-player gameplay loop
- multiple playable characters
- flexible `base stats + bonus stats` system
- skill system with `projectile` and `melee`
- supporter companion system
- status effect framework
- timed scenario spawn scaling
- wave-based run flow with shop breaks between waves
- pre-shop stat card choice before each shop
- shop stock, reroll, and lock persistence flow
- runtime debug panel for gameplay iteration

Not implemented as a shipped feature:

- real multiplayer / co-op
- active in-run level-up card roll flow on level-up in the current build

See [COOP_DECISION.md](./COOP_DECISION.md) for co-op planning notes.

## Core Config Files

- stats: [config/stats.js](./config/stats.js)
- characters: [config/characters/characters.js](./config/characters/characters.js)
- skills: [config/skill.js](./config/skill.js)
- supporters: [config/supporters.js](./config/supporters.js)
- pre-shop cards: [config/preShopCards.js](./config/preShopCards.js)
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

Current character passive note:

- `Lumina`: `skillRange +40`
- `Knight`: `dodge +20%`

| Character | Default skill | Style | HP | Armor | Move Speed | Crit Chance |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Lumina | `shooting_star` | ranged | 75 | 1 | 105 | 0.1 |
| Aqua | `nova` | ranged | 140 | 1 | 105 | 0.1 |
| Radian | `charm` | ranged | 100 | 1 | 105 | 0.1 |
| Frost | `ice` | ranged | 100 | 1 | 108 | 0.1 |
| Witch | `avada` | ranged | 75 | 1 | 112 | 0.1 |
| Asian Dragon | `flame` | ranged | 75 | 1 | 112 | 0.1 |
| Bodoi | `mu_coi` | ranged | 75 | 1 | 112 | 0.1 |
| Gambler | `card_toss` | ranged | 80 | 1 | 108 | 0.1 |
| Raiji | `thunder` | ranged | 70 | 2 | 115 | 0.1 |
| Warden | `fire` | ranged | 100 | 2 | 105 | 0.1 |
| Werewolf | `claw` | melee | 135 | 2 | 107 | 0.18 |
| Assasin | `stab` | melee | 90 | 1 | 113 | 0.22 |
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
- `charm` and `ghost` now behave as normal `projectile` skills

## Skill Table

Source: [config/skill.js](./config/skill.js)

### Projectile Skills

| Skill | Damage | Cooldown | Duration | Range | Speed | Hitbox | Targeting / Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `nova` | 18 | 1400 | 800 | 140 | 400 | `20x8` | straight projectile |
| `aqua_stream` | 15 | 700 | 900 | 130 | 200 | `40x25` | rotating multi-projectile |
| `ice` | 8 | 2000 | 800 | 120 | 1000 | `30x10` | auto-aim, `iceTrail`, stun `2000ms` |
| `shooting_star` | 24 | 1000 | 1600 | 140 | 800 | `40x15` | auto-aim projectile, destroy on hit |
| `sky_fall` | 30 | 700 | 1800 | 130 | 2000 | `40x40` | sky drop, `cometTail`, destroy on hit |
| `astral` | 300 | 5000 | 1800 | 140 | 300 | `150x150` | sky drop, auto explode at viewport center, `cometTailAstral` |
| `fire` | 20 | 1800 | 3000 | 110 | 200 | `20x20` | homing |
| `avada` | 15 | 3000 | 1800 | 150 | 800 | `30x5` | auto-aim, distinct targets |
| `flame` | 22 | 2500 | 1800 | 130 | 200 | `50x30` | auto-aim |
| `blueflame` | 70 | 1300 | 1500 | 150 | 260 | `70x30` | auto-aim, distinct targets |
| `code` | 15 | 3000 | 1800 | 140 | 150 | `10x10` | auto-aim, hidden sprite, `codeProjectile` |
| `mu_coi` | 15 | 3000 | 8000 | 140 | 80 | `12x12` | auto-aim, bounce on hit |
| `card_toss` | 5 | 1500 | 1800 | 110 | 700 | `10x15` | auto-aim fan, spin |
| `card_shot` | 20 | 1000 | 2000 | 120 | 720 | `18x24` | auto-aim distinct targets, spin |
| `god_card` | 35 | 0 | 2200 | 130 | 760 | `18x24` | auto-aim distinct targets, spin |

### Melee Skills

| Skill | Damage | Cooldown | Duration | Melee Range | Cast Gap | Hitbox | Current hit effect |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `claw` | 22 | 1200 | 1200 | 34 | 22 | `20x40` | blood wolf slash |
| `stab` | 20 | 850 | 900 | 30 | 20 | `18x34` | knife-like single slash |
| `slash` | 24 | 1100 | 1000 | 38 | 24 | `44x44` | 180-degree knight slash arc |

### Projectile Variant Skills

| Skill | Category | Damage | Cooldown | Duration | Key behavior |
| --- | --- | ---: | ---: | ---: | --- |
| `thunder` | projectile | 12 | 1000 | 300 | chain lightning strike |
| `charm` | projectile | 18 | 3000 | 2000 | auto-aim projectile volley |
| `ghost` | projectile | 18 | 2200 | 1800 | auto-aim projectile volley |

### Important Skill Notes

- current projectile ranges are intentionally compressed into the `110-150` band
- melee ranges are currently `34`, `30`, and `38`
- extra projectiles no longer deal full duplicate damage
- if `projectileCount = 1`, the skill still deals `100%` base damage
- if `projectileCount > 1`, each projectile uses `baseDamage / projectileCount + 0.1 x baseDamage`
- default explosion is not assigned to any skill right now
- `explosion` exists as a status effect config, ready to be attached later
- normalized skill knockback currently defaults to `30`

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
- each reroll costs `10` gold
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

| Item | Cost | Current modifiers |
| --- | ---: | --- |
| `Iron Sword` | `43` | `damageMultiplier +0.1`, `skillRange -5` |
| `Sharpened Blade` | `43` | `critChance +0.05` |
| `Heavy Edge` | `43` | `critMultiplier +0.1`, `skillRange -10` |
| `Quick Gloves` | `45` | `attackSpeed +0.18`, `moveSpeed -5` |
| `Battle Focus` | `51` | `damageMultiplier +0.1`, `critChance +0.08`, `armor -10` |
| `Steel Armor` | `42` | `armor +3`, `hp -10` |
| `Vital Ring` | `42` | `hp +30`, `armor -1` |
| `Regeneration Charm` | `42` | `healthRegenPerSecond +1`, `hp -10` |
| `Blood Pendant` | `45` | `lifesteal +0.05`, `attackSpeed -0.1` |
| `Guardian Core` | `60` | `shield +25`, `xpGainMultiplier +0.2`, `armor -1` |
| `Swift Boots` | `40` | `moveSpeed +15`, `attackSpeed -0.05` |
| `Wide Grip` | `42` | `effectDamageMultiplier +0.1`, `damageMultiplier -0.05` |
| `Extended Core` | `47` | `skillRange +10`, `moveSpeed -5` |
| `Extra Barrel` | `70` | `projectileCount +1`, `+1 projectile, but lowers damage per shot` |
| `Cooldown Module` | `40` | `attackSpeed +0.15`, `healthRegenPerSecond -0.5` |
| `Combat Injector` | `47` | `attackSpeed +0.08`, `damageMultiplier +0.08`, `effectDamageMultiplier -0.1` |
| `Force Core` | `47` | `knockbackMultiplier +0.4`, `damageMultiplier +0.05`, `hp -10` |

### Hybrid Items

| Item | Cost | Current modifiers |
| --- | ---: | --- |
| `Glass Cannon` | `40` | `damageMultiplier +0.2`, `armor -10` |
| `Berserker Blood` | `40` | `dodge +15%`, `hp -20` |
| `Sniper Scope` | `40` | `critChance +0.15`, `attackSpeed -0.25` |
| `Heavy Payload` | `40` | `projectileCount +1`, `damageMultiplier +0.1`, `attackSpeed -0.15` |
| `Overcharged Reactor` | `39` | `skillRange +10`, `attackSpeed -0.15` |
| `Unstable Shield` | `33` | `shield +30`, `armor -2` |
| `Speed Injector` | `33` | `moveSpeed +20`, `damageMultiplier -0.15` |
| `Overgrowth Engine` | `33` | `areaSizeMultiplier +0.2`, `attackSpeed -0.1` |
| `Time Distorter` | `38` | `armor -2`, `dodge +10%` |
| `Abyssal Catalyst` | `33` | `damageMultiplier +0.35`, `effectDamageMultiplier +0.25`, `healthRegenPerSecond -4` |
| `Singularity Field` | `32` | `areaSizeMultiplier +0.5`, `knockbackMultiplier +0.5`, `damageMultiplier -0.15` |
| `Phantom Stride` | `40` | `moveSpeed +30`, `pickupRangeMultiplier +0.4`, `armor -4` |
| `Rotheart Sigil` | `32` | `effectChance +0.25`, `effectDamageMultiplier +0.3`, `damageMultiplier -0.2` |
| `Fractured Tempo` | `33` | `attackSpeed +0.4`, `damageMultiplier -0.25`, `knockbackMultiplier -0.3` |
| `Vampire Pact` | `32` | `lifesteal +0.1`, `hp -50` |
| `Reckless Core` | `32` | `critMultiplier +0.2`, `hp -15` |
| `Impact Engine` | `50` | `knockbackMultiplier +0.3`, `damageMultiplier +0.1` |

### Effect Items

| Item | Cost | Current modifiers / bonuses |
| --- | ---: | --- |
| `Toxic Catalyst` | `56` | `effectChance +0.2`, `effectDamageMultiplier +0.15`, `dodge -7%` |
| `Lingering Curse` | `73` | `attackSpeed +0.2`, `effectDurationMultiplier +0.25` |
| `Chain Amplifier` | `59` | `shock.chainCount +1`, only rolls if `shock` is active |
| `Flame` | `56` | `burn.explodeOnMaxStacks = true`, only rolls if `burn` is active |
| `Frozen Edge` | `56` | `freeze.bonusCritDamageToFrozen +0.35`, only rolls if `freeze` is active |
| `Venom Trail` | `55` | `hp -20`, `poison.spawnTrail = true`, leaves a poison trail even without `Poison Core` |
| `Elemental Overload` | `58` | `effectChance +0.12`, `effectDamageMultiplier +0.12`, `damageMultiplier -0.12` |
| `Shockwave Core` | `50` | `shock.chainDamageBonus +0.15`, only rolls if `shock` is active |

### Unlock Element Items

| Item | Cost | Current unlock |
| --- | ---: | --- |
| `Fire Core` | `70` | unlock `burn` on the current skill, `30%` effect chance |
| `Ice Core` | `70` | unlock `freeze` on the current skill, `40%` effect chance |
| `Poison Core` | `70` | unlock `poison` on the current skill, `30%` effect chance |
| `Shock Core` | `70` | unlock `shock` on the current skill, `30%` effect chance |
| `Afang` | `70` | unlock `bleed` on the current skill, `30%` effect chance |
| `Explore Core` | `70` | add `explosion` as a bonus on-hit effect without replacing the current main status effect |

### Utility Items

| Item | Cost | Current modifiers |
| --- | ---: | --- |
| `Magnet Core` | `50` | `pickupRangeMultiplier +0.5` |
| `Golden Idol` | `72` | `goldGainMultiplier +0.25`, `damageMultiplier -0.1` |
| `Greed Engine` | `72` | `goldGainMultiplier +0.35`, `hp -20` |

Armor note:

- player armor can now go below `0`
- negative armor increases damage taken from enemy attacks by the same amount
- example: `armor = -5` means an enemy hit deals `+5` extra damage

## Status Effects

Source: [config/statusEffects.js](./config/statusEffects.js)

| Effect | Current default stats |
| --- | --- |
| `burn` | `durationMs: 4000`, `damageRatioPerTick: 0.3`, `minDamagePerTick: 5`, `reapplyDelayMs: 400`, `maxStacks: 6` |
| `shock` | `durationMs: 2000`, `slowDurationMs: 2000`, `slowMultiplier: 0.7`, `chainCount: 3`, `chainRadius: 120`, `chainDamageRatios: [0.75, 0.5, 0.25]`, `chainStepDelayMs: 90`, `maxStacks: 4` |
| `freeze` | `durationMs: 1500`, `mode: 'stun'`, `slowMultiplier: 0`, `maxStacks: 1` |
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
- melee supporters use `movementStyle: 'melee_follow'` instead of orbiting while engaging enemies
- melee supporters use `attackArea` around the player to decide when to chase and when to return
- `blood_wolf` and `rock` currently use melee follow with `attackArea: 100`

| Supporter | Style | Range / Interval | Damage / Support | Passive |
| --- | --- | --- | --- | --- |
| `blackcat` | orb | range `140`, cooldown `1350` | damage `25`, speed `300` | `goldGainMultiplier +0.15`, `critChance +0.05` |
| `blood_wolf` | claw slash | range `20`, cooldown `900`, attack area `100` | damage `30` | `lifesteal +0.1`, melee characters gain `attackSpeed +0.3` |
| `fairy` | heal aura | interval `15000` | heal `35` | `healthRegenPerSecond +1`, `maxHealthPercent +0.1` |
| `bluebird` | orb | range `150`, cooldown `1250` | damage `26`, speed `340` | `projectileSpeedPercent +0.2`, `armorPierce +0.2` |
| `eye_monster` | orb | range `130`, cooldown `1500` | damage `28`, speed `260` | `skillRange +30`, `critMultiplier +0.1`, `mark on hit 100%` |
| `dragon_ice` | orb | range `145`, cooldown `1300` | damage `29`, speed `320` | `freeze on hit 100%`, `effectDurationMultiplier +0.3` |
| `fire_spirite` | orb | range `135`, cooldown `1100` | damage `27`, speed `360` | `burn on hit 100%`, `effectDamageMultiplier +0.3` |
| `shock_mouse` | chain lightning | range `150`, cooldown `1150` | damage `31`, speed `380` | `shock on hit 100%`, `shockChainCountBonus +2`, `attackSpeed +0.1` |
| `poison_ball` | orb | range `140`, cooldown `1200` | damage `27`, speed `320` | `poison on hit 100%`, `effectDurationMultiplier +0.2`, `effectDamageMultiplier +0.1` |
| `shield_drone` | armor aura | interval `2200` | armor `+8` | `armor +1`, `shieldResetAmount 20` every `10s` |
| `rock` | claw slash | range `20`, cooldown `2000`, attack area `100` | damage `35` | `knockbackMultiplier +0.1`, `armor +5`, gray explosion on hit `30%` |

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
- enemy hit feedback is still active via damage tint and damage text
- health number text above enemies is hidden by default

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

- `maprock_field` now runs a scripted `10`-wave plan
- other maps can still use scenario unlock timelines
- there is no weighted spawn system anymore
- each wave shows a `WAVE N` banner and waits about `2s` before enemies start spawning
- each wave also shows a centered countdown timer at the top of the screen
- a wave ends when either its timer expires or all wave enemies are killed
- when a wave ends by timeout, remaining enemies from that wave are cleared
- map rock wave composition is currently:
  - wave `1`: `30s`, `worm` up to `999`, `20 HP`
  - wave `2`: `30s`, `worm` up to `999`, `22 HP`
  - wave `3`: `45s`, `worm` up to `999`, `23 HP`
  - wave `4`: `45s`, `worm` up to `999`, `50 HP`
  - wave `5`: open-ended boss clear, `35 worm`, `60 HP` plus `3 kitsume`, `2000 HP / 50 damage`
  - wave `6`: `45s`, `worm` up to `999`, `100 HP` plus `bat` up to `999`, `100 HP` and `10 eyes`
  - wave `7`: `45s`, `worm` up to `999`, `100 HP` plus `bat` up to `999`, `100 HP` and `10 eyes`
  - wave `8`: `45s`, `worm` up to `999`, `100 HP` plus `bat` up to `999`, `100 HP` and `10 eyes`
  - wave `9`: `45s`, `mummy` up to `999`, `100 HP` plus `bat` up to `999`, `100 HP` and `10 eyes`
  - wave `10`: `45s`, `25 mummy`, `100 HP` plus `25 bat`, `100 HP`, `10 eyes`, and `3 skeleton`, `8000 HP / 50 damage`
- the maximum number of enemies alive on the map at once is currently `25`
- about `2s` after a wave ends, the shop flow begins
- before the shop opens, the game now rolls `4` stat cards and the player picks `1`
- pre-shop card reroll costs `10` gold and allows up to `3` rerolls
- pre-shop card rarity unlocks are: before wave `5` only `normal`, from wave `5` `epic`, from wave `10` `legendary`
- pre-shop card rarity weights are currently:
  - before wave `5`: `Normal 100%`
  - wave `5-9`: `Normal 66.67%`, `Epic 33.33%`
  - wave `10+`: `Normal 60%`, `Epic 30%`, `Legendary 10%`
- if the player still has no supporter, clearing wave `3` opens a supporter selection popup before the shop
- the supporter selection popup at wave `3` shows `4` options and supports rerolling up to `3` times for `10` gold each
- after the supporter popup at wave `3`, the pre-shop card choice still appears before the shop
- when the shop opens, all active enemies and enemy projectiles are cleared
- after leaving the shop, the next wave begins
- normal shop shows `5` items
- reroll costs `10` gold
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

## Audio

Default audio config:

- music: `off`
- SFX: `on`

Source: [utils/audioSettings.js](./utils/audioSettings.js)

## Summary

`Shadow Survivors` currently ships as a config-driven single-player survivor game with:

- shared stat bases for player and enemy
- a mixed roster of ranged and melee characters
- projectile and melee skill styles
- attack and support supporters with explicit numeric configs
- pre-shop stat card picks with rarity-based upgrades
- a wave shop with reroll and lock persistence
- a dedicated status effect framework with current default values documented above
- scripted wave flow on map rock, plus shop breaks between waves

If you change balance numbers, update the matching config files first, then refresh this README so the documentation stays equal to the live data.
