// entities/Projectile.js
import Phaser from 'phaser';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, config) {
        super(scene, x, y, texture);
        this.config = config;
        this.damage = config.damage;
        this.speed = config.projectileSpeed;
        this.range = config.range;
        this.startX = x;
        this.startY = y;
        this.knockback = config.knockback || 0;
        this.effects = config.effects || [];
    }

    fire(targetX, targetY) {
        this.scene.physics.add.existing(this);
        this.scene.add.existing(this);

        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
        this.setRotation(angle);
    }

    update() {
        // Check range
        const distance = Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y);
        if (distance > this.range) {
            this.destroy();
        }
    }
}