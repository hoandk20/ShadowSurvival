// systems/CombatSystem.js
export default class CombatSystem {
    constructor(scene) {
        this.scene = scene;
        this.weapons = [];
    }

    addWeapon(weapon) {
        this.weapons.push(weapon);
    }

    update(time, targetX, targetY) {
        this.weapons.forEach(weapon => {
            weapon.fire(time, targetX, targetY);
        });
    }
}