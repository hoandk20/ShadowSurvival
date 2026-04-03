export default class PlayerPartySystem {
    constructor(scene) {
        this.scene = scene;
        this.players = new Map();
        this.runStates = new Map();
        this.primaryPlayerId = null;
        this.nextId = 1;
    }

    createPlayerId(prefix = 'player') {
        const safePrefix = String(prefix || 'player').replace(/[^a-zA-Z0-9_]/g, '_');
        const id = `${safePrefix}_${this.nextId}`;
        this.nextId += 1;
        return id;
    }

    registerPlayer(player, { isPrimary = false, runState = null } = {}) {
        if (!player) return null;
        const playerId = player.playerId ?? this.createPlayerId(player.characterKey ?? player.type ?? 'player');
        player.playerId = playerId;
        this.players.set(playerId, player);
        if (runState) {
            runState.playerId = playerId;
            this.runStates.set(playerId, runState);
        }
        if (isPrimary || !this.primaryPlayerId) {
            this.primaryPlayerId = playerId;
        }
        return player;
    }

    unregisterPlayer(playerOrId) {
        const playerId = typeof playerOrId === 'string' ? playerOrId : playerOrId?.playerId;
        if (!playerId) return;
        this.players.delete(playerId);
        this.runStates.delete(playerId);
        if (this.primaryPlayerId !== playerId) return;
        this.primaryPlayerId = this.players.keys().next().value ?? null;
    }

    getPrimaryPlayer() {
        return this.primaryPlayerId ? (this.players.get(this.primaryPlayerId) ?? null) : null;
    }

    getAllPlayers() {
        return Array.from(this.players.values()).filter(Boolean);
    }

    getPlayerById(playerId) {
        if (!playerId) return null;
        return this.players.get(playerId) ?? null;
    }

    getRunState(playerOrId = null) {
        const playerId = typeof playerOrId === 'string'
            ? playerOrId
            : (playerOrId?.playerId ?? this.primaryPlayerId);
        if (!playerId) return null;
        return this.runStates.get(playerId) ?? null;
    }
}
