export default class GhostSummon extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, owner, index = 0, options = {}) {
        const textureKey = options.textureKey ?? '__WHITE';
        super(scene, owner?.x ?? 0, owner?.y ?? 0, textureKey);
        this.scene = scene;
        this.owner = owner;
        this.ownerPlayerId = owner?.playerId ?? null;
        this.skillKey = options.skillKey ?? null;
        this.summonIndex = index;
        this.orbitRadius = options.orbitRadius ?? 34;
        this.orbitSpeed = options.orbitSpeed ?? 2.2; // radians per second
        this.baseAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.angleOffset = 0;

        this.baseMoveSpeedMultiplier = options.moveSpeedMultiplier ?? 1;
        this.moveSpeed = options.moveSpeed ?? 170;
        // Visual-only scaling (used for loot-like pop + attack squash).
        this.visualScale = { x: 1, y: 1 };
        this.spawnPopTween = null;
        this.attackSquashTween = null;
        this.attackBounceTween = null;
        this.lifetimeMs = Math.max(0, Math.round(options.lifetimeMs ?? 0));
        this.spawnedAt = scene?.time?.now ?? 0;
        this.despawning = false;
        this.aggroRange = options.aggroRange ?? 180;
        this.attackRange = options.attackRange ?? 18;
        this.baseAttackCooldownMs = options.attackCooldownMs ?? 750;
        this.lastAttackAt = -Infinity;

        this.target = null;
        this.setDepth((owner?.depth ?? 1000) - 1);
        this.setAlpha(0.92);
        this.setBlendMode(Phaser.BlendModes.ADD);
        // Keep summon roughly player-sized for readability.
        this.baseDisplayWidth = owner?.baseWidth ?? owner?.displayWidth ?? 22;
        this.baseDisplayHeight = owner?.baseHeight ?? owner?.displayHeight ?? 22;
        this.setDisplaySize(this.baseDisplayWidth, this.baseDisplayHeight);

        this.playSpawnPopBounce();
    }

    spawnSuctionVfx(target) {
        const scene = this.scene;
        if (!scene?.add?.graphics || !scene?.tweens) return;
        if (!target?.active) return;

        const x1 = target.x ?? 0;
        const y1 = target.y ?? 0;
        const x2 = this.x ?? 0;
        const y2 = this.y ?? 0;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const nx = dx / dist;
        const ny = dy / dist;
        const px = -ny;
        const py = nx;

        const g = scene.add.graphics();
        g.setDepth(Math.max((target.depth ?? 0) + 12, (this.depth ?? 0) + 12));
        g.setAlpha(0.75);
        g.setBlendMode(Phaser.BlendModes.ADD);

        // Soft white "suction streak" (multi-line) from target -> ghost.
        g.lineStyle(6, 0xffffff, 0.22);
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.strokePath();

        g.lineStyle(3, 0xffffff, 0.18);
        g.beginPath();
        g.moveTo(x1 + (px * 6), y1 + (py * 6));
        g.lineTo(x2 + (px * 3), y2 + (py * 3));
        g.strokePath();

        g.lineStyle(3, 0xffffff, 0.14);
        g.beginPath();
        g.moveTo(x1 - (px * 6), y1 - (py * 6));
        g.lineTo(x2 - (px * 3), y2 - (py * 3));
        g.strokePath();

        // Small intake pulse at the ghost.
        const pulse = scene.add.circle(x2, y2, 7, 0xffffff, 0.16);
        pulse.setDepth(g.depth + 1);
        pulse.setBlendMode(Phaser.BlendModes.ADD);

        scene.tweens.add({
            targets: [g, pulse],
            alpha: 0,
            duration: 260,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                g.destroy();
                pulse.destroy();
            }
        });
        scene.tweens.add({
            targets: pulse,
            scale: 2.2,
            duration: 260,
            ease: 'Quad.easeOut'
        });
    }

    playSpawnPopBounce() {
        if (!this.scene?.tweens || !this.active) return;
        this.spawnPopTween?.stop?.();
        this.visualScale.x = 0.55;
        this.visualScale.y = 0.55;
        this.spawnPopTween = this.scene.tweens.add({
            targets: this.visualScale,
            x: 1,
            y: 1,
            duration: 260,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.spawnPopTween = null;
            }
        });
    }

    playAttackSquashBounce() {
        if (!this.scene?.tweens || !this.active) return;
        this.attackSquashTween?.stop?.();
        this.attackBounceTween?.stop?.();
        this.attackSquashTween = this.scene.tweens.add({
            targets: this.visualScale,
            x: 1.16,
            y: 0.84,
            duration: 70,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.attackSquashTween = null;
                if (!this.active || !this.scene?.tweens) return;
                this.attackBounceTween = this.scene.tweens.add({
                    targets: this.visualScale,
                    x: 1.05,
                    y: 0.95,
                    duration: 140,
                    ease: 'Back.easeOut',
                    yoyo: true,
                    onComplete: () => {
                        this.attackBounceTween = null;
                        if (!this.active) return;
                        this.visualScale.x = 1;
                        this.visualScale.y = 1;
                    }
                });
            }
        });
    }

    resolveTarget() {
        const scene = this.scene;
        if (scene?.getGhostSummonTarget) {
            return scene.getGhostSummonTarget(this.owner, this);
        }
        return null;
    }

    getAttackCooldownMs() {
        const speedMul = Math.max(0.1, Number(this.owner?.attackSpeedMultiplier ?? 1) || 1);
        return Math.max(120, Math.round(this.baseAttackCooldownMs / speedMul));
    }

    getDamageSnapshot() {
        if (!this.owner?.getDamageSnapshotForSkill || !this.skillKey) return 0;
        return Math.max(1, this.owner.getDamageSnapshotForSkill(this.skillKey));
    }

    tryAttack(timeNow) {
        const target = this.target;
        if (!target?.active || target.isDead) return;
        if ((timeNow - this.lastAttackAt) < this.getAttackCooldownMs()) return;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        if ((dx * dx) + (dy * dy) > this.attackRange * this.attackRange) return;
        this.lastAttackAt = timeNow;
        this.playAttackSquashBounce();
        this.spawnSuctionVfx(target);

        const direction = new Phaser.Math.Vector2(dx, dy);
        if (direction.lengthSq() === 0) direction.set(1, 0);
        direction.normalize();
        const damage = this.getDamageSnapshot();
        const attackTags = ['summon', 'ghost', 'hit', this.skillKey].filter(Boolean);
        const skillConfig = this.owner?.getSkillConfig?.(this.skillKey) ?? {};
        const force = 0;
        const source = {
            owner: this.owner,
            ownerPlayerId: this.ownerPlayerId,
            skillType: this.skillKey,
            tags: ['summon', 'ghost']
        };
        const result = target.takeDamage(
            damage,
            force,
            direction,
            source,
            {
                damageSource: source,
                ownerPlayerId: this.ownerPlayerId,
                attackTags,
                isCritical: false
            },
            skillConfig
        ) ?? { healthDamage: damage, absorbedDamage: 0, didKill: false };

        const effects = this.scene?.skillBehaviorPipeline?.effects;
        effects?.showDamageText?.(target, damage, {
            color: '#ffde59',
            fontSize: '7px'
        });

        const hitEvent = {
            target,
            sourceOwner: this.owner ?? null,
            source,
            ownerPlayerId: this.ownerPlayerId,
            attackTags,
            isCritical: false,
            damage,
            damageTaken: result.healthDamage ?? damage,
            absorbedDamage: result.absorbedDamage ?? 0,
            didKill: Boolean(result.didKill),
            direction,
            force
        };

        const primaryStatusEffects = Array.isArray(skillConfig.statusEffects) ? skillConfig.statusEffects : [];
        const bonusStatusEffects = Array.isArray(skillConfig.bonusStatusEffects) ? skillConfig.bonusStatusEffects : [];
        this.scene?.statusEffectSystem?.applyConfiguredEffects?.(primaryStatusEffects, { ...hitEvent, trigger: 'onHit' });
        this.scene?.statusEffectSystem?.applyConfiguredEffects?.(bonusStatusEffects, { ...hitEvent, trigger: 'onHit' });
        this.scene?.statusEffectSystem?.notifyHit?.(hitEvent);
    }

    update(time, delta, desiredCount = 1) {
        if (!this.active || !this.owner?.active || this.owner.isDead) return;
        const timeNow = this.scene?.time?.now ?? time ?? 0;
        if (!this.despawning && this.lifetimeMs > 0 && (timeNow - this.spawnedAt) >= this.lifetimeMs) {
            this.despawning = true;
            this.body?.setVelocity?.(0, 0);
            this.spawnPopTween?.stop?.();
            this.attackSquashTween?.stop?.();
            this.attackBounceTween?.stop?.();
            this.scene?.tweens?.add?.({
                targets: this,
                alpha: 0,
                scaleX: 0.65,
                scaleY: 0.65,
                duration: 220,
                ease: 'Cubic.easeIn',
                onComplete: () => this.destroy()
            });
            return;
        }
        if (this.despawning) return;
        const desired = Math.max(1, Math.round(desiredCount));
        this.angleOffset = (Math.PI * 2 * (this.summonIndex % desired)) / desired;

        // Floating "bounce" so it feels like it's flying (purely visual).
        const bob = Math.sin((timeNow / 180) + this.summonIndex) * 0.08; // scale factor
        this.setDisplaySize(
            Math.max(6, Math.round(this.baseDisplayWidth * (1 + bob) * (this.visualScale?.x ?? 1))),
            Math.max(6, Math.round(this.baseDisplayHeight * (1 + bob) * (this.visualScale?.y ?? 1)))
        );

        // Ghost move speed tracks owner movement speed.
        const ownerSpeed = Math.max(1, Number(this.owner?.speed ?? 105) || 105);
        this.moveSpeed = Math.max(40, Math.round(ownerSpeed * this.baseMoveSpeedMultiplier));

        // Re-evaluate target periodically so summons can spread out.
        this.__retargetMs = (this.__retargetMs ?? 0) + (delta ?? 0);
        const shouldRetarget = this.__retargetMs >= 220;
        if (shouldRetarget || !this.target?.active || this.target.isDead) {
            this.__retargetMs = 0;
            this.target = this.resolveTarget() ?? this.target;
        }

        if (this.target?.active && !this.target.isDead) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distSq = (dx * dx) + (dy * dy);
            if (distSq > this.attackRange * this.attackRange) {
                const direction = new Phaser.Math.Vector2(dx, dy);
                if (direction.lengthSq() > 0) direction.normalize();
                const vx = direction.x * this.moveSpeed;
                const vy = direction.y * this.moveSpeed;
                this.body?.setVelocity?.(vx, vy);
                if (Math.abs(vx) > 0.01) {
                    this.setFlipX(vx < 0);
                }
            } else {
                this.body?.setVelocity?.(0, 0);
            }
            this.tryAttack(timeNow);
            return;
        }

        // Orbit owner when idle.
        const orbitAngle = this.baseAngle + this.angleOffset + ((timeNow / 1000) * this.orbitSpeed);
        const nextX = (this.owner.x ?? 0) + Math.cos(orbitAngle) * this.orbitRadius;
        const nextY = (this.owner.y ?? 0) + Math.sin(orbitAngle) * (this.orbitRadius * 0.6);
        const floatY = Math.sin((timeNow / 120) + (this.summonIndex * 1.3)) * 3;
        this.setPosition(nextX, nextY + floatY);
        const orbitDirX = Math.cos(orbitAngle + (Math.PI / 2));
        if (Math.abs(orbitDirX) > 0.01) {
            this.setFlipX(orbitDirX < 0);
        }
        this.body?.setVelocity?.(0, 0);
    }
}
