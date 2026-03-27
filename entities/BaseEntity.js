// entities/BaseEntity.js
import { STATE_PRIORITIES } from '../config/animationConfig.js';

export default class BaseEntity extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, type) {
        super(scene, x, y, texture);
        this.type = type;
        this.state = null;
        this.isAttacking = false;
        this.isHurting = false;
        this.isDead = false;
        // State initialization will be performed after entity is added to scene
    }

    setState(newState) {
        if (this.isDead && newState !== 'dead') return;
        if (this.isStunned && newState !== 'dead') return;
        if (!this.scene?.anims) return;
        if (newState === this.state) return;

        const newPriority = STATE_PRIORITIES[newState] || 0;
        const currentPriority = STATE_PRIORITIES[this.state] || 0;

        if (newPriority < currentPriority && (this.isAttacking || this.isHurting)) return;

        this.state = newState;
        this.playAnimation(newState);
    }

    playAnimation(state) {
        const scene = this.scene;
        if (!scene) return;
        const animKey = `${this.type}_${state}`;
        const fallbackKey = `${this.type}_move`;
        let actualAnimKey = scene.anims.exists(animKey) ? animKey : fallbackKey;
        if (!scene.anims.exists(actualAnimKey)) {
            return;
        }
        const isSameAnim = this.anims.currentAnim && this.anims.currentAnim.key === actualAnimKey;
        if (isSameAnim) {
            if (this.anims.isPaused) {
                this.anims.resume();
            }
            return;
        }

        this.anims.play(actualAnimKey);

        // Note: Loop info is handled in animation creation, but for completion:
        // Avoid direct call to anim.currentAnim.on(), use sprite event listener
        const anim = this.scene.anims.get(animKey);
        if (anim && anim.repeat === 0) {
            this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (sprite, animation) => {
                if (animation.key !== animKey) return;
                if (state === 'attack') this.isAttacking = false;
                if (state === 'hurt') this.isHurting = false;
                if (state === 'dead') this.isDead = true;
                this.onAnimationComplete(state);
            });
        }

        if (state === 'attack') this.isAttacking = true;
        if (state === 'hurt') this.isHurting = true;
    }

    onAnimationComplete(state) {
        // Override in subclasses
        if (state === 'attack' || state === 'hurt') {
            this.setState('idle');
        }
    }

    syncBodySize() {
        // Default does nothing; subclasses (like Enemy) enforce their own hitbox
    }

    update(time, delta) {
        // Override in subclasses
    }
}
