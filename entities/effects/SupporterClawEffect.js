export default class SupporterClawEffect {
    constructor(scene) {
        this.scene = scene;
    }

    spawnArcSweep(fromPoint, target, options = {}) {
        if (!this.scene || !target) return;
        const direction = options.direction?.clone?.() ?? new Phaser.Math.Vector2(1, 0);
        if (direction.lengthSq() === 0) {
            direction.set(1, 0);
        }
        direction.normalize();

        const color = options.color ?? 0xf4f1df;
        const glowColor = options.glowColor ?? 0xffffff;
        const depth = options.depth ?? ((target.depth ?? 20) + 6);
        const duration = options.duration ?? 150;
        const radius = Math.max(12, options.arcRadius ?? options.length ?? 28);
        const lineWidth = Math.max(2, options.arcWidth ?? options.slashWidth ?? 6);
        const centerX = (fromPoint?.x ?? target.x ?? 0) + direction.x * Math.max(10, radius * 0.55);
        const centerY = (fromPoint?.y ?? target.y ?? 0) + direction.y * Math.max(8, radius * 0.35);
        const facingAngle = Math.atan2(direction.y, direction.x);
        const halfArc = Phaser.Math.DegToRad(Math.max(10, Math.min(180, options.arcDegrees ?? 180)) * 0.5);
        const startAngle = facingAngle - halfArc;
        const endAngle = facingAngle + halfArc;

        const glowArc = this.scene.add.graphics();
        glowArc.setDepth(depth);
        glowArc.setBlendMode(Phaser.BlendModes.ADD);
        glowArc.lineStyle(lineWidth + 3, glowColor, 0.35);
        glowArc.beginPath();
        glowArc.arc(centerX, centerY, radius, startAngle, endAngle, false);
        glowArc.strokePath();

        const slashArc = this.scene.add.graphics();
        slashArc.setDepth(depth + 1);
        slashArc.setBlendMode(Phaser.BlendModes.ADD);
        slashArc.lineStyle(lineWidth, color, 0.95);
        slashArc.beginPath();
        slashArc.arc(centerX, centerY, radius, startAngle, endAngle, false);
        slashArc.strokePath();

        const tipFlash = this.scene.add.circle(
            centerX + Math.cos(endAngle) * radius,
            centerY + Math.sin(endAngle) * radius,
            options.impactRadius ?? 10,
            color,
            options.impactAlpha ?? 0.22
        );
        tipFlash.setDepth(depth + 2);
        tipFlash.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
            targets: [glowArc, slashArc, tipFlash],
            alpha: 0,
            scaleX: 1.08,
            scaleY: 1.08,
            duration,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                glowArc.destroy();
                slashArc.destroy();
                tipFlash.destroy();
            }
        });
    }

    spawn(fromPoint, target, options = {}) {
        if (!this.scene || !target) return;
        if (options.style === 'arcSweep') {
            this.spawnArcSweep(fromPoint, target, options);
            return;
        }
        const color = options.color ?? 0xff6b7d;
        const glowColor = options.glowColor ?? 0xffd3d9;
        const depth = options.depth ?? ((target.depth ?? 20) + 6);
        const slashLength = options.length ?? 18;
        const slashSpacing = options.spacing ?? 6;
        const slashWidth = options.slashWidth ?? 3;
        const duration = options.duration ?? 150;
        const slashCount = Math.max(1, options.slashCount ?? 3);
        const angle = options.angle ?? Phaser.Math.FloatBetween(-0.55, -0.2);
        const centerX = target.x ?? fromPoint?.x ?? 0;
        const centerY = target.y ?? fromPoint?.y ?? 0;
        const offsetX = options.offsetX ?? Phaser.Math.Between(-4, 4);
        const offsetY = options.offsetY ?? Phaser.Math.Between(-6, 4);

        const centerOffset = (slashCount - 1) / 2;
        for (let index = 0; index < slashCount; index += 1) {
            const slash = this.scene.add.rectangle(
                centerX + offsetX + ((index - centerOffset) * slashSpacing),
                centerY + offsetY + ((index - centerOffset) * 2),
                slashWidth,
                slashLength,
                color,
                0.95
            );
            slash.setRotation(angle);
            slash.setDepth(depth + index);
            slash.setBlendMode(Phaser.BlendModes.ADD);
            slash.setStrokeStyle(1, glowColor, 0.95);

            this.scene.tweens.add({
                targets: slash,
                alpha: 0,
                scaleX: 0.35,
                scaleY: 1.25,
                x: slash.x + Phaser.Math.Between(6, 10),
                y: slash.y - Phaser.Math.Between(4, 8),
                duration,
                ease: 'Cubic.easeOut',
                onComplete: () => slash.destroy()
            });
        }

        const impact = this.scene.add.circle(centerX, centerY, options.impactRadius ?? 9, color, options.impactAlpha ?? 0.28);
        impact.setDepth(depth - 1);
        impact.setBlendMode(Phaser.BlendModes.ADD);
        this.scene.tweens.add({
            targets: impact,
            alpha: 0,
            scaleX: 1.6,
            scaleY: 1.25,
            duration: Math.max(120, duration - 10),
            ease: 'Quad.easeOut',
            onComplete: () => impact.destroy()
        });
    }
}
