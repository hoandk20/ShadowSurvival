export default class TargetingSystem {
    constructor(scene) {
        this.scene = scene;
        this.tempVector = new Phaser.Math.Vector2(0, 0);
    }

    getPrimaryPlayer() {
        return this.scene?.getPrimaryPlayer?.() ?? this.scene?.player ?? null;
    }

    getActivePlayers() {
        return this.scene?.getActivePlayers?.() ?? (this.getPrimaryPlayer() ? [this.getPrimaryPlayer()] : []);
    }

    getNearestPlayer(x, y, options = {}) {
        const includeInactive = options.includeInactive === true;
        const players = this.getActivePlayers();
        let nearest = null;
        let nearestDistanceSq = Number.POSITIVE_INFINITY;

        for (const player of players) {
            if (!player) continue;
            if (!includeInactive && (!player.active || player.isDead)) continue;
            const dx = player.x - x;
            const dy = player.y - y;
            const distanceSq = (dx * dx) + (dy * dy);
            if (distanceSq >= nearestDistanceSq) continue;
            nearest = player;
            nearestDistanceSq = distanceSq;
        }

        return nearest ?? this.getPrimaryPlayer();
    }

    getPartyCenter(options = {}) {
        const includeInactive = options.includeInactive === true;
        const players = this.getActivePlayers().filter((player) => {
            if (!player) return false;
            if (includeInactive) return true;
            return player.active && !player.isDead;
        });

        if (!players.length) {
            const primary = this.getPrimaryPlayer();
            return this.tempVector.set(primary?.x ?? 0, primary?.y ?? 0);
        }

        let minX = players[0].x;
        let maxX = players[0].x;
        let minY = players[0].y;
        let maxY = players[0].y;

        for (let i = 1; i < players.length; i += 1) {
            const player = players[i];
            minX = Math.min(minX, player.x);
            maxX = Math.max(maxX, player.x);
            minY = Math.min(minY, player.y);
            maxY = Math.max(maxY, player.y);
        }

        return this.tempVector.set((minX + maxX) / 2, (minY + maxY) / 2);
    }
}
