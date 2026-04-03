import SupporterOrbEffect from './effects/SupporterOrbEffect.js';
import { applyDamageVariance } from '../utils/damageVariance.js';

export default class SupporterOrb extends Phaser.GameObjects.Arc {
    constructor(scene, supporter, target, options = {}) {
        super(
            scene,
            supporter.x,
            supporter.y,
            options.radius ?? 4,
            0,
            360,
            false,
            options.color ?? 0xffffff,
            1
        );
        this.scene = scene;
        this.supporter = supporter;
        this.target = target;
        this.speed = Math.max(80, options.speed ?? 240);
        this.damage = Math.max(1, options.damage ?? 8);
        this.lifeMs = Math.max(200, options.lifetimeMs ?? 2000);
        this.ownerPlayerId = supporter.ownerPlayerId ?? null;
        this.ownerEntityId = supporter.ownerEntityId ?? null;
        this.ownerSkillKey = `supporter_${supporter.supporterKey ?? 'orb'}`;
        this.attackTags = Array.from(new Set([
            ...(Array.isArray(options.tags) ? options.tags : []),
            'supporter',
            'orb',
            'hit'
        ]));
        this.elapsedMs = 0;
        this.setStrokeStyle(2, options.glowColor ?? 0xffffff, 0.95);
        this.setDepth((supporter.depth ?? 40) + 2);
        scene.add.existing(this);
        this.effect = new SupporterOrbEffect(scene, this, {
            trailColor: options.trailColor ?? options.color ?? 0xffffff,
            burstColor: options.burstColor ?? options.glowColor ?? options.color ?? 0xffffff
        });
        this.effect.spawnLaunchPulse();
    }

    update(time, delta) {
        if (!this.active) return;
        this.elapsedMs += delta;
        if (this.elapsedMs >= this.lifeMs) {
            this.destroy();
            return;
        }

        if (!this.target?.active || this.target?.isDead) {
            this.target = this.scene?.supporterSystem?.getNearestEnemyToPoint?.(
                this.x,
                this.y,
                this.supporter?.config?.attackRange ?? 220
            ) ?? null;
        }

        if (!this.target) {
            this.destroy();
            return;
        }

        const direction = new Phaser.Math.Vector2(this.target.x - this.x, this.target.y - this.y);
        if (direction.lengthSq() > 0) {
            direction.normalize();
        }
        const moveDistance = (this.speed * delta) / 1000;
        this.x += direction.x * moveDistance;
        this.y += direction.y * moveDistance;
        this.effect?.update?.(time, delta);

        const hitRadius = (this.target.displayWidth ?? this.target.body?.width ?? 24) * 0.35 + (this.radius ?? 4);
        if (Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) > hitRadius) {
            return;
        }

        const hitDirection = new Phaser.Math.Vector2(this.target.x - this.supporter.x, this.target.y - this.supporter.y);
        if (hitDirection.lengthSq() > 0) {
            hitDirection.normalize();
        }
        const directDamage = applyDamageVariance(this.damage);
        const damageResult = this.target.takeDamage(directDamage, 0, hitDirection, this, {
            attackTags: this.attackTags
        }, null);
        const hitEvent = {
            target: this.target,
            sourceOwner: this.supporter.owner ?? null,
            source: this,
            ownerPlayerId: this.ownerPlayerId ?? null,
            attackTags: this.attackTags,
            isCritical: false,
            damage: directDamage,
            damageTaken: damageResult?.healthDamage ?? directDamage,
            absorbedDamage: damageResult?.absorbedDamage ?? 0,
            didKill: Boolean(damageResult?.didKill),
            direction: hitDirection,
            force: 0
        };
        this.scene?.statusEffectSystem?.applyConfiguredEffects?.(this.supporter.config?.statusEffects ?? [], {
            ...hitEvent,
            trigger: 'onHit'
        });
        if (damageResult?.didKill) {
            this.scene?.statusEffectSystem?.applyConfiguredEffects?.(this.supporter.config?.statusEffects ?? [], {
                ...hitEvent,
                trigger: 'onKill'
            });
        }
        this.scene?.statusEffectSystem?.notifyHit?.(hitEvent);
        if ((damageResult?.healthDamage ?? 0) > 0) {
            this.scene?.skillBehaviorPipeline?.effects?.showDamageText?.(this.target, damageResult.healthDamage, {
                color: '#fff1a1',
                fontSize: '7px'
            });
        }
        this.effect?.spawnImpactBurst?.(this.target.x, this.target.y);
        this.destroy();
    }

    destroy(fromScene) {
        this.effect = null;
        super.destroy(fromScene);
    }
}
