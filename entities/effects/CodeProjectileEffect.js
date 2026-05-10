import { resolveEffectDepth } from './effectRenderUtils.js';

const DEFAULT_CONFIG = {
    glyphs: ['0', '1', '{', '}', '<', '>', '/', '\\', '_', '=', 'if', '=>', '&&', '||'],
    headText: '</>',
    headFontSize: '14px',
    trailFontSize: '10px',
    headColor: '#c8ffb0',
    trailColor: '#7dff9c',
    glowColor: 0x39ff6f,
    coreColor: 0x16351b,
    alphaMultiplier: 0.75,
    spawnInterval: 35,
    trailLifetime: 420,
    trailDistance: 12
};

export default class CodeProjectileEffect {
    constructor(scene, skill, config = {}) {
        this.scene = scene;
        this.skill = skill;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config
        };
        const alphaMul = Phaser.Math.Clamp(this.config.alphaMultiplier ?? 1, 0, 1);
        this.lastSpawnTime = 0;
        this.lastGlyphSwapTime = 0;
        this.glyphIndex = 0;
        this.container = scene.add.container(skill.x, skill.y)
            .setDepth(resolveEffectDepth(skill.depth, 8, { maxDepth: 55, fallbackDepth: 30 }));
        this.container.setAlpha(alphaMul);

        this.shadow = scene.add.rectangle(0, 0, 20, 12, this.config.coreColor, 0.33);
        this.shadow.setStrokeStyle(1, 0x0d190f, 0.9);

        this.glow = scene.add.circle(0, 0, 10, this.config.glowColor, 0.22);
        this.glow.setBlendMode(Phaser.BlendModes.ADD);
        this.glowBaseRadius = this.glow.radius;

        this.core = scene.add.circle(0, 0, 4, 0xd6ff9c, 0.85);
        this.core.setBlendMode(Phaser.BlendModes.ADD);
        this.coreBaseRadius = this.core.radius;

        this.head = scene.add.text(0, 0, this.config.headText, {
            fontFamily: 'monospace',
            fontSize: this.config.headFontSize,
            fontStyle: 'bold',
            color: this.config.headColor,
            stroke: '#08170b',
            strokeThickness: 3,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#63ff89',
                blur: 8,
                fill: true
            }
        }).setOrigin(0.5);
        this.head.setBlendMode(Phaser.BlendModes.ADD);
        this.head.setAlpha(0.95);

        this.container.add([this.shadow, this.glow, this.core, this.head]);

        const alphaPulse = scene.tweens.add({
            targets: [this.glow, this.core],
            alpha: { from: 0.7, to: 0.95 },
            duration: 180,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        const glowPulse = scene.tweens.add({
            targets: this.glow,
            radius: this.glowBaseRadius * 1.18,
            duration: 180,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        const corePulse = scene.tweens.add({
            targets: this.core,
            radius: this.coreBaseRadius * 1.18,
            duration: 180,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.pulseTween = { stop: () => { alphaPulse.stop(); glowPulse.stop(); corePulse.stop(); } };
    }

    update(time) {
        if (!this.skill?.active) return;
        this.container.setPosition(this.skill.x, this.skill.y);
        this.container.setRotation(this.skill.rotation ?? 0);
        if (time - this.lastGlyphSwapTime >= 70) {
            this.lastGlyphSwapTime = time;
            this.glyphIndex = (this.glyphIndex + 1) % this.config.glyphs.length;
            this.head.setText(this.config.glyphs[this.glyphIndex]);
        }

        if (time - this.lastSpawnTime < this.config.spawnInterval) return;
        this.lastSpawnTime = time;
        this.spawnTrail();
    }

    spawnTrail() {
        const dir = this.skill.direction?.clone?.() ?? new Phaser.Math.Vector2(1, 0);
        if (dir.lengthSq() === 0) {
            dir.set(1, 0);
        }
        dir.normalize();

        const trailOffset = dir.clone().negate().scale(this.config.trailDistance);
        const glyph = Phaser.Math.RND.pick(this.config.glyphs);
        const trail = this.scene.add.text(
            this.skill.x + trailOffset.x + Phaser.Math.Between(-2, 2),
            this.skill.y + trailOffset.y + Phaser.Math.Between(-2, 2),
            glyph,
            {
                fontFamily: 'monospace',
                fontSize: this.config.trailFontSize,
                fontStyle: 'bold',
                color: this.config.trailColor,
                stroke: '#071009',
                strokeThickness: 2,
                shadow: {
                    offsetX: 0,
                    offsetY: 0,
                    color: '#58ff7f',
                    blur: 6,
                    fill: true
                }
            }
        ).setOrigin(0.5);

        trail.setRotation(this.skill.rotation ?? 0);
        trail.setDepth(this.container.depth - 1);
        trail.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            y: trail.y + Phaser.Math.Between(3, 7),
            duration: this.config.trailLifetime,
            ease: 'Quad.easeOut',
            onComplete: () => trail.destroy()
        });
    }

    destroy() {
        this.pulseTween?.stop();
        this.pulseTween = null;
        this.container?.destroy(true);
        this.container = null;
    }
}
