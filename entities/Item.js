import { ITEM_CONFIG } from '../config/items.js';
import { LOOT_CONFIG } from '../config/loot.js';
import { playSfx } from '../utils/audioSettings.js';

const ITEM_DESPAWN_VIEW_MARGIN = 300;
const ITEM_MAX_LIFETIME_MS = 3 * 60 * 1000;
const XP_ORB_VISUAL_TIERS = [
    { minValue: 0, tint: 0xffffff, scale: 1 },
    { minValue: 40, tint: 0x8ff7ff, scale: 1.08 },
    { minValue: 90, tint: 0x6fd6ff, scale: 1.16 },
    { minValue: 180, tint: 0x7ea7ff, scale: 1.26 },
    { minValue: 320, tint: 0xc48dff, scale: 1.4 },
    { minValue: 520, tint: 0xffd76f, scale: 1.58 }
];

export default class Item extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, itemKey, amount = 1, options = {}) {
        const config = ITEM_CONFIG[itemKey] ?? {};
        const textureKey = config.textureKey ?? itemKey;
        super(scene, x, y, textureKey);
        this.scene = scene;
        this.config = config;
        this.amount = Math.max(1, amount);
        this.valueMultiplier = config.baseValue ?? 1;
        this.collected = false;
        this.isMagnetized = false;
        this.spawnTime = scene.time?.now ?? 0;
        this.ownerPlayerId = options.ownerPlayerId ?? null;
        this.ownershipReserveMs = Math.max(0, options.ownershipReserveMs ?? LOOT_CONFIG.ownershipReserveMs ?? 0);
        this.reservedUntil = this.ownerPlayerId ? (this.spawnTime + this.ownershipReserveMs) : 0;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.body.setBounce(0.2, 0.2);
        this.body.setDrag(10, 10);
        this.body.setCollideWorldBounds(true);
        this.setDepth(12);
        this.setOrigin(0.5);
        const displaySize = Math.max(config.displaySize ?? config.size ?? 16, 8);
        const naturalWidth = this.frame?.realWidth ?? this.frame?.width ?? this.texture?.source?.[0]?.width ?? 32;
        const naturalHeight = this.frame?.realHeight ?? this.frame?.height ?? this.texture?.source?.[0]?.height ?? 32;
        const maxNatural = Math.max(naturalWidth, naturalHeight, 1);
        const displayScale = config.displayScale ?? 1;
        const finalDisplaySize = Math.max(displaySize * displayScale, 1);
        this.baseDisplaySize = finalDisplaySize;
        this.setDisplaySize(finalDisplaySize, finalDisplaySize);
        this.setAlpha(config.alpha ?? 0.95);
        const size = finalDisplaySize;
        if (this.body?.setCircle) {
            const radius = size / 2;
            this.body.setCircle(radius, (this.displayWidth - radius) / 2, (this.displayHeight - radius) / 2);
        }
        this.refreshVisualState();
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        this.releaseOwnershipIfExpired(time);
        if (this.hasExpired(time)) {
            this.destroy();
            return;
        }
        if (this.shouldDespawnOffscreen()) {
            this.destroy();
            return;
        }
        if (this.isMagnetized) {
            return;
        }
    }

    shouldDespawnOffscreen() {
        if (!this.active || this.collected || this.isMagnetized) return false;
        const worldView = this.scene?.cameras?.main?.worldView;
        if (!worldView) return false;
        const margin = ITEM_DESPAWN_VIEW_MARGIN;
        return this.x < worldView.left - margin
            || this.x > worldView.right + margin
            || this.y < worldView.top - margin
            || this.y > worldView.bottom + margin;
    }

    hasExpired(time) {
        if (!this.active || this.collected) return false;
        const now = typeof time === 'number' ? time : (this.scene?.time?.now ?? 0);
        return (now - this.spawnTime) >= ITEM_MAX_LIFETIME_MS;
    }

    collect(player) {
        if (this.collected || !player || !this.canBeCollectedBy(player)) return;
        this.collected = true;
        if (this.body) {
            this.body.enable = false;
            this.body.stop();
        }
        this.setActive(false);
        this.setVisible(false);
        this.applyTo(player);
    }

    applyTo(player) {
        if (!player || player.isDead) {
            this.destroy();
            return;
        }
        playSfx(this.scene, 'sfx_coin', { volume: 0.35 });
        const type = this.config?.type;
        const effectiveValue = this.getEffectiveValue();
        switch (type) {
            case 'xp':
                player.addXP(effectiveValue);
                break;
            case 'gold':
                player.addGold(effectiveValue);
                break;
            case 'health':
                player.heal(effectiveValue);
                break;
            default:
                player.addXP?.(effectiveValue);
        }
        this.playPickupText();
        this.destroy();
    }

    getEffectiveValue() {
        return Math.max(1, Math.round(this.amount * (this.valueMultiplier ?? 1)));
    }

    canMergeWith(other) {
        return Boolean(
            other
            && other !== this
            && other.active
            && !other.collected
            && this.active
            && !this.collected
            && this.config?.type === 'xp'
            && other.config?.type === 'xp'
            && this.texture?.key === other.texture?.key
            && (this.ownerPlayerId ?? null) === (other.ownerPlayerId ?? null)
            && (this.reservedUntil ?? 0) === (other.reservedUntil ?? 0)
        );
    }

    absorb(other) {
        if (!this.canMergeWith(other)) return false;
        this.amount += other.amount ?? 0;
        this.spawnTime = Math.max(this.spawnTime ?? 0, other.spawnTime ?? 0);
        this.refreshVisualState();
        other.collected = true;
        other.destroy();
        return true;
    }

    releaseOwnershipIfExpired(time = null) {
        if (!this.ownerPlayerId) return;
        const now = typeof time === 'number' ? time : (this.scene?.time?.now ?? 0);
        if (now < (this.reservedUntil ?? 0)) return;
        this.ownerPlayerId = null;
        this.reservedUntil = 0;
    }

    isReservedForOtherPlayer(player, time = null) {
        if (!player || !this.ownerPlayerId) return false;
        const playerId = player.playerId ?? null;
        if (!playerId || playerId === this.ownerPlayerId) return false;
        const now = typeof time === 'number' ? time : (this.scene?.time?.now ?? 0);
        return now < (this.reservedUntil ?? 0);
    }

    canBeCollectedBy(player, time = null) {
        return !this.isReservedForOtherPlayer(player, time);
    }

    canBeMagnetizedBy(player, time = null) {
        return this.canBeCollectedBy(player, time);
    }

    refreshVisualState() {
        if (this.config?.type !== 'xp') return;
        const effectiveValue = this.getEffectiveValue();
        let selectedTier = XP_ORB_VISUAL_TIERS[0];
        XP_ORB_VISUAL_TIERS.forEach((tier) => {
            if (effectiveValue >= tier.minValue) {
                selectedTier = tier;
            }
        });
        this.setTint(selectedTier.tint);
        const nextSize = Math.max(1, this.baseDisplaySize * selectedTier.scale);
        this.setDisplaySize(nextSize, nextSize);
        if (this.body?.setCircle) {
            const radius = nextSize / 2;
            this.body.setCircle(radius, (this.displayWidth - radius) / 2, (this.displayHeight - radius) / 2);
        }
    }

    playPickupText() {
        const text = this.scene.add.text(this.x, this.y - 12, `+${this.getEffectiveValue()}`, {
            fontSize: '7px',
            fontFamily: 'Arial',
            color: this.config.pickupTextColor ?? '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5).setDepth(70);
        this.scene.tweens.add({
            targets: text,
            y: text.y - 20,
            alpha: 0,
            duration: 420,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy()
        });
    }
}
