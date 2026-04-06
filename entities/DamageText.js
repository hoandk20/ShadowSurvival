export default class DamageText extends Phaser.GameObjects.Text {
    static MAX_LIVE = 60;
    static MERGE_RADIUS_PX = 28;
    static #sceneQueues = new WeakMap(); // scene -> DamageText[]

    static #getQueue(scene) {
        const existing = this.#sceneQueues.get(scene) ?? [];
        // Prune dead entries
        const pruned = existing.filter((t) => t?.active && !t.destroyed);
        this.#sceneQueues.set(scene, pruned);
        return pruned;
    }

    static #enqueue(scene, text) {
        const queue = this.#getQueue(scene);
        queue.push(text);
        this.#sceneQueues.set(scene, queue);
    }

    static #remove(scene, text) {
        const queue = this.#getQueue(scene);
        const next = queue.filter((t) => t !== text);
        this.#sceneQueues.set(scene, next);
    }

    static createOrMerge(scene, x, y, value, options = {}) {
        if (!scene) return null;
        const queue = this.#getQueue(scene);
        const rounded = Math.round(value);
        const color = options.color ?? '#ffde59';
        const capMode = String(options.capMode ?? 'merge'); // merge | replace | unlimited

        if (capMode === 'unlimited' || queue.length < DamageText.MAX_LIVE) {
            return new DamageText(scene, x, y, rounded, options);
        }

        if (capMode === 'replace') {
            const oldest = queue[0] ?? null;
            if (oldest?.active) {
                oldest.resetTo(x, y, rounded, options);
                DamageText.#remove(scene, oldest);
                DamageText.#enqueue(scene, oldest);
                return oldest;
            }
            return new DamageText(scene, x, y, rounded, options);
        }

        // Prefer merging into a nearby text with the same color.
        let best = null;
        let bestDistSq = Number.POSITIVE_INFINITY;
        const radius = DamageText.MERGE_RADIUS_PX;
        const radiusSq = radius * radius;
        for (const t of queue) {
            if (!t?.active) continue;
            if ((t.__damageTextColor ?? null) !== color) continue;
            const dx = (t.x ?? 0) - x;
            const dy = (t.y ?? 0) - y;
            const distSq = (dx * dx) + (dy * dy);
            if (distSq > radiusSq || distSq >= bestDistSq) continue;
            best = t;
            bestDistSq = distSq;
        }
        if (best) {
            best.addValue(rounded, { x, y, options });
            // Move to back (most recently updated)
            DamageText.#remove(scene, best);
            DamageText.#enqueue(scene, best);
            return best;
        }

        // No merge target found: reuse the oldest entry.
        const oldest = queue[0] ?? null;
        if (oldest?.active) {
            oldest.resetTo(x, y, rounded, options);
            DamageText.#remove(scene, oldest);
            DamageText.#enqueue(scene, oldest);
            return oldest;
        }

        // Fallback: create new (queue will self-prune).
        return new DamageText(scene, x, y, rounded, options);
    }

    constructor(scene, x, y, value, options = {}) {
        const textConfig = {
            fontSize: options.fontSize ?? '7px',
            fontFamily: options.fontFamily ?? '"Press Start 2P", "PixelFont", monospace',
            color: options.color ?? '#ffde59',
            stroke: options.stroke ?? '#000000',
            strokeThickness: options.strokeThickness ?? 2,
            align: 'center',
            resolution: 2
        };
        const displayValue = Math.round(value);
        super(scene, x, y, `-${displayValue}`, textConfig);
        scene.add.existing(this);
        this.setOrigin(0.5);
        this.setDepth(options.depth ?? 60);
        this.__damageValue = displayValue;
        this.__damageTextColor = textConfig.color;
        this.__rise = options.rise ?? 30;
        this.__duration = options.duration ?? 600;
        this.__tween = null;
        this.playTweenFrom(y);
        DamageText.#enqueue(scene, this);
        this.once(Phaser.GameObjects.Events.DESTROY, () => {
            DamageText.#remove(scene, this);
        });
    }

    playTweenFrom(startY) {
        this.__tween?.stop?.();
        this.__tween = this.scene.tweens.add({
            targets: this,
            y: startY - (this.__rise ?? 30),
            alpha: 0,
            duration: this.__duration ?? 600,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.destroy();
            }
        });
    }

    addValue(deltaValue, { x = this.x, y = this.y, options = {} } = {}) {
        const next = Math.max(0, Math.round((this.__damageValue ?? 0) + Math.round(deltaValue)));
        this.__damageValue = next;
        this.setText(`-${next}`);
        // Pull the merged text toward the new hit location for clarity.
        this.setPosition(x, y);
        this.setAlpha(1);
        // Slight punch so merging is noticeable.
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 80,
            yoyo: true,
            ease: 'Quad.easeOut'
        });
        // Refresh timing a bit so it doesn't vanish immediately after a merge.
        if (typeof options.rise === 'number') this.__rise = options.rise;
        if (typeof options.duration === 'number') this.__duration = options.duration;
        this.playTweenFrom(y);
    }

    resetTo(x, y, value, options = {}) {
        const textConfig = {
            fontSize: options.fontSize ?? '7px',
            fontFamily: options.fontFamily ?? '"Press Start 2P", "PixelFont", monospace',
            color: options.color ?? '#ffde59',
            stroke: options.stroke ?? '#000000',
            strokeThickness: options.strokeThickness ?? 2,
            align: 'center',
            resolution: 2
        };
        const displayValue = Math.round(value);
        this.__damageValue = displayValue;
        this.__damageTextColor = textConfig.color;
        this.__rise = options.rise ?? 30;
        this.__duration = options.duration ?? 600;
        this.setStyle(textConfig);
        this.setDepth(options.depth ?? 60);
        this.setText(`-${displayValue}`);
        this.setPosition(x, y);
        this.setAlpha(1);
        this.setScale(1);
        this.playTweenFrom(y);
    }
}
