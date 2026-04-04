const KNIGHT_SLASH_PARTICLE_KEY = 'knight_slash_particle_fx';
const KNIGHT_SLASH_STREAK_KEY = 'knight_slash_streak_fx';

const DEFAULT_CONFIG = {
    radius: 34,
    arcDegrees: 180,
    duration: 170,
    particleLifespan: 180,
    quantity: 22,
    speedMin: 70,
    speedMax: 210,
    scaleFrom: 0.7,
    scaleTo: 0,
    alphaFrom: 0.95,
    alphaTo: 0,
    tint: 0xf4f1df,
    glowTint: 0xfff7d6,
    streakTint: 0xffffff,
    forwardOffset: 16,
    sweepRotationDegrees: 20,
    flashWidth: 7,
    flashAlpha: 0.92,
    fillAlpha: 0.12,
    streakCount: 6,
    streakLength: 22,
    streakWidth: 3,
    streakTravelMin: 12,
    streakTravelMax: 26,
    centerFlashRadius: 8,
    depthOffset: 10
};

function ensureKnightSlashTextures(scene) {
    if (!scene.textures.exists(KNIGHT_SLASH_PARTICLE_KEY)) {
        const particleTexture = scene.textures.createCanvas(KNIGHT_SLASH_PARTICLE_KEY, 6, 6);
        const particleCtx = particleTexture.context;
        particleCtx.clearRect(0, 0, 6, 6);
        particleCtx.fillStyle = '#ffffff';
        particleCtx.fillRect(1, 1, 4, 4);
        particleTexture.refresh();
    }

    if (!scene.textures.exists(KNIGHT_SLASH_STREAK_KEY)) {
        const streakTexture = scene.textures.createCanvas(KNIGHT_SLASH_STREAK_KEY, 16, 4);
        const streakCtx = streakTexture.context;
        const gradient = streakCtx.createLinearGradient(0, 2, 16, 2);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.65)');
        gradient.addColorStop(1, 'rgba(255,255,255,1)');
        streakCtx.clearRect(0, 0, 16, 4);
        streakCtx.fillStyle = gradient;
        streakCtx.fillRect(0, 1, 16, 2);
        streakTexture.refresh();
    }
}

function buildArcPoints(radius, startAngle, endAngle, stepCount = 18) {
    const points = [{ x: 0, y: 0 }];
    const steps = Math.max(6, stepCount);
    for (let index = 0; index <= steps; index += 1) {
        const t = index / steps;
        const angle = Phaser.Math.Interpolation.Linear([startAngle, endAngle], t);
        points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        });
    }
    return points;
}

export default class KnightSlashEffect {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { ...DEFAULT_CONFIG, ...config };
        ensureKnightSlashTextures(scene);
    }

    resolveConfig(options = {}) {
        return {
            ...this.config,
            ...options
        };
    }

    resolveDirection(fromPoint, options = {}) {
        const direction = options.direction?.clone?.()
            ?? fromPoint?.lastMoveDirection?.clone?.()
            ?? new Phaser.Math.Vector2(fromPoint?.flipX ? -1 : 1, 0);
        if (direction.lengthSq() === 0) {
            direction.set(fromPoint?.flipX ? -1 : 1, 0);
        }
        return direction.normalize();
    }

    spawnArcFlash(container, config) {
        const halfArcRadians = Phaser.Math.DegToRad(config.arcDegrees * 0.5);
        const startAngle = -halfArcRadians;
        const endAngle = halfArcRadians;
        const radius = config.radius;
        const glowArc = this.scene.add.graphics();
        const slashArc = this.scene.add.graphics();
        const fillArc = this.scene.add.graphics();
        const centerFlash = this.scene.add.circle(0, 0, config.centerFlashRadius, config.glowTint, 0.22);

        const arcPoints = buildArcPoints(radius, startAngle, endAngle, Math.round(config.arcDegrees / 10));
        fillArc.fillStyle(config.glowTint, config.fillAlpha);
        fillArc.fillPoints(arcPoints, true);

        glowArc.lineStyle(config.flashWidth + 4, config.glowTint, 0.32);
        glowArc.beginPath();
        glowArc.arc(0, 0, radius, startAngle, endAngle, false);
        glowArc.strokePath();

        slashArc.lineStyle(config.flashWidth, config.tint, config.flashAlpha);
        slashArc.beginPath();
        slashArc.arc(0, 0, radius, startAngle, endAngle, false);
        slashArc.strokePath();

        container.add([fillArc, glowArc, slashArc, centerFlash]);

        const startRotation = container.rotation - Phaser.Math.DegToRad(config.sweepRotationDegrees);
        const endRotation = container.rotation + Phaser.Math.DegToRad(config.sweepRotationDegrees * 0.35);
        container.rotation = startRotation;

        this.scene.tweens.add({
            targets: container,
            rotation: endRotation,
            scaleX: 1.04,
            scaleY: 1.04,
            alpha: 0,
            duration: config.duration,
            ease: 'Cubic.easeOut',
            onComplete: () => container.destroy(true)
        });
    }

    spawnBurstParticles(originX, originY, facingAngle, config, depth) {
        const emitter = this.scene.add.particles(originX, originY, KNIGHT_SLASH_PARTICLE_KEY, {
            lifespan: config.particleLifespan,
            quantity: 0,
            speed: { min: config.speedMin, max: config.speedMax },
            scale: { start: config.scaleFrom, end: config.scaleTo },
            alpha: { start: config.alphaFrom, end: config.alphaTo },
            angle: {
                min: Phaser.Math.RadToDeg(facingAngle) - (config.arcDegrees * 0.5),
                max: Phaser.Math.RadToDeg(facingAngle) + (config.arcDegrees * 0.5)
            },
            blendMode: Phaser.BlendModes.ADD,
            tint: [config.tint, config.glowTint],
            emitting: false
        });
        emitter.setDepth(depth);
        emitter.explode(config.quantity, originX, originY);
        this.scene.time.delayedCall(config.particleLifespan + 40, () => emitter.destroy());
    }

    spawnStreaks(originX, originY, facingAngle, config, depth) {
        for (let index = 0; index < config.streakCount; index += 1) {
            const arcT = (index + 0.5) / Math.max(1, config.streakCount);
            const arcOffset = Phaser.Math.Linear(-(config.arcDegrees * 0.5), config.arcDegrees * 0.5, arcT);
            const angle = facingAngle + Phaser.Math.DegToRad(arcOffset);
            const startRadius = Phaser.Math.FloatBetween(config.radius * 0.35, config.radius * 0.92);
            const travel = Phaser.Math.FloatBetween(config.streakTravelMin, config.streakTravelMax);
            const startX = originX + Math.cos(angle) * startRadius;
            const startY = originY + Math.sin(angle) * startRadius;
            const streak = this.scene.add.image(startX, startY, KNIGHT_SLASH_STREAK_KEY);
            streak.setTint(config.streakTint);
            streak.setBlendMode(Phaser.BlendModes.ADD);
            streak.setDepth(depth + 1);
            streak.setRotation(angle + Phaser.Math.DegToRad(Phaser.Math.FloatBetween(55, 85)));
            streak.setDisplaySize(config.streakLength, config.streakWidth);

            this.scene.tweens.add({
                targets: streak,
                x: startX + Math.cos(angle) * travel,
                y: startY + Math.sin(angle) * travel,
                alpha: 0,
                scaleX: 0.6,
                scaleY: 0.2,
                duration: Math.max(90, config.duration - 10),
                ease: 'Quad.easeOut',
                onComplete: () => streak.destroy()
            });
        }
    }

    spawn(fromPoint, target, options = {}) {
        if (!this.scene || !fromPoint) return;
        const config = this.resolveConfig(options);
        const direction = this.resolveDirection(fromPoint, options);
        const facingAngle = Math.atan2(direction.y, direction.x);
        const originX = fromPoint.x + direction.x * config.forwardOffset;
        const originY = fromPoint.y + direction.y * (config.forwardOffset * 0.55);
        const depth = options.depth ?? ((target?.depth ?? fromPoint?.depth ?? 20) + (config.depthOffset ?? 10));

        const container = this.scene.add.container(originX, originY);
        container.setDepth(depth);
        container.rotation = facingAngle;

        this.spawnArcFlash(container, config);
        this.spawnBurstParticles(originX, originY, facingAngle, config, depth);
        this.spawnStreaks(originX, originY, facingAngle, config, depth);
    }
}
