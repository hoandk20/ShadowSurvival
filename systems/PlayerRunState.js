export default class PlayerRunState {
    constructor({
        playerId = null,
        characterKey = null,
        activeSkillKey = null,
        activeSkillKeys = []
    } = {}) {
        this.playerId = playerId;
        this.characterKey = characterKey;
        this.activeSkillKey = activeSkillKey;
        this.activeSkillKeys = Array.isArray(activeSkillKeys) ? [...activeSkillKeys] : [];
        this.skillObjectSpawnCounts = {};
        this.skillHitCounts = {};
        this.totalMovedDistance = 0;
        this.killCount = 0;
        this.shopPurchasedItemIds = [];
        this.shopPurchasedItems = [];
        this.shopCurrentStockIds = [];
        this.shopEffectBonuses = {};
        this.shopSpecialFlags = {};
    }
}
