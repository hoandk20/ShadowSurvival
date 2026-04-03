# Co-op Progression Proposal

## Current Status

Co-op is **not implemented yet** in the project.

This document is currently a **design proposal / planning note** for a future co-op direction.
It should be read as:

- intended architecture
- recommended rules
- refactor targets for future implementation

It should **not** be read as a description of a completed gameplay system.

## Proposed Direction

The current proposal is:

- `per-player progression`
- `shared world`

This would mean each player owns their own build and progression, while all players exist in the same combat space.

## What Would Be Shared

If co-op is implemented with this model, these systems should likely be shared across the session:

- map
- enemy spawns
- waves
- elite events
- stage scaling
- world state
- room state
- final run result

Optional shared reward after the run:

- meta currency / account reward

## What Would Be Per Player

If co-op is implemented with this model, these systems should likely belong to each player individually:

- XP
- level
- level-up timing
- card choices
- inventory
- skill unlocks
- skill evolutions
- hidden unlock progress
- hit counts
- kill counts used for evolutions
- moved distance
- cooldown state
- runtime skill overrides
- shields
- summons created from that player's skills

## Why This Proposal

This currently looks like the best fit for the codebase and the likely future co-op plan.

Benefits:

- every player can keep a distinct build
- evolution conditions stay clear and deterministic
- the new `PlayerRunState` direction fits naturally
- easier to scale to 2+ players without constant design conflicts
- avoids arguments such as "who gets the level-up card"

This direction also preserves one of the strongest parts of the current game:

- each character has a unique progression path and identity

## Why Not Shared Progression

Shared progression would likely create major design problems:

- who chooses cards when the team levels up
- whether XP is pooled or individual
- who owns the 10-slot inventory
- whether skill evolution conditions count team-wide or per owner
- whether all characters become homogenized because the party shares one build

It would also make balancing much harder.

## Proposed System-by-System Rules

These are **recommended future rules**, not currently implemented rules.

### XP

Proposed rule:

- XP is per player
- whoever collects XP gets it

Implication:

- each player levels independently

### Level Up

Proposed rule:

- level-up triggers per player
- card selection belongs to the player who leveled up

Implication:

- no global level-up queue for the full party

### Cards

Proposed rule:

- cards are drawn from the leveling player's own progression state
- card requirements check that player's build only

Implication:

- `cardSelectionCounts`, inventory limits, and card unlock conditions must be stored per player

### Inventory

Proposed rule:

- each player has their own inventory
- item levels are not shared between teammates

Implication:

- evolution conditions that depend on item level remain simple and owner-specific

### Skill Evolution

Proposed rule:

- skill evolution is owned by the player who owns the skill
- all evolution counters are per player

This includes:

- hit counts
- kill counts
- moved distance
- spawned object counts

Implication:

- no team-wide evolution progress

### Loot

Proposed rule:

- loot is shared in the world, but each drop is temporarily reserved for the player who caused the kill
- while reserved, only that player can magnetize or collect it
- after the short reserve window expires, the drop becomes public and any player can collect it

Proposed reserve window:

- `2000ms`

Recommended implementation options:

- shared physical drops with short owner priority
- or per-player instanced XP if testing shows pickup competition still feels bad

Recommended first version:

- shared drops
- killer priority first, then public pickup

That would keep implementation simple, avoid ambiguous race conditions, and fit per-player progression better than pure first-touch wins.

### Summons

Proposed rule:

- summons belong to the player whose skill created them

Implication:

- summon ownership must always be tracked with `ownerPlayerId`
- summon-triggered evolution counters should credit the owner player, not the whole team

### HUD

Proposed rule:

- HUD should become player-aware

Options:

- single-player: current full HUD
- online co-op: each client shows only their own full HUD, plus minimal teammate info

Recommendation:

- keep one full HUD for the local player
- add smaller teammate summary panels later for online rooms

### Camera

Proposed rule:

- gameplay targeting can still use party-aware helpers such as `party center`
- online clients should each use their own local camera/view presentation

### Difficulty Scaling

Proposed rule:

- world difficulty scales by party size
- progression does not

Example scaling axes:

- enemy HP
- spawn rate
- elite frequency

### Death / Game Over

Proposed rule:

- the run ends only when the whole team is dead

Optional later extension:

- revive system
- downed state

## Technical Impact

If the project moves forward with this co-op model, the following refactor direction is recommended.

### Should Become Per-Player

- `PlayerRunState`
- inventory
- active skills
- skill runtime overrides
- hit counters
- kill counters used for evolution
- moved distance
- card draw history
- level-up queue

### Can Likely Stay Shared

- map state
- spawn scheduler
- enemy pools
- wave timeline
- elite milestone timeline
- music
- background VFX

## Immediate Development Guidance

For future implementation work, these are the recommended rules:

1. If the data changes because of one player's actions only, store it per player.
2. If the data defines the combat space or stage state, keep it shared.
3. Every spawned gameplay object should know its owner:
   - `ownerPlayerId`
   - `ownerEntityId`
   - optionally `ownerSkillKey`
4. Evolution counters should always be credited to the owner player.
5. UI should never assume one global inventory or one global skill tree.

## Recommended Next Refactors

Before real co-op implementation, these still look like the highest-value prep tasks:

1. Move level-up queue and card selection flow into per-player state.
2. Move inventory and card pool logic fully off `MainScene` scene-global access.
3. Convert loot pickup and reward application to owner-aware flow.
4. Add player-aware HUD blocks.
5. Add party-size difficulty scaling rules to stage scenarios and room flow.

## Summary

The current co-op direction for the project is still only an idea / proposal:

- `shared world`
- `per-player progression`

This is not a completed feature yet.
It is the current recommended foundation for future co-op work, while preserving the project's survivors-style character identity and keeping implementation risk relatively low.
