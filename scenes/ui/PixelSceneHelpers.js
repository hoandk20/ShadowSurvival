export const UI_COLORS = {
    gold: 0xd8b15a,
    goldBright: 0xf8d67f,
    ember: 0xff9b54,
    ink: 0x110d12,
    panel: 0x1b1420,
    panelDark: 0x140f17,
    panelLite: 0x2b2031,
    border: 0x4d3b25,
    accent: 0x7d2f2f,
    ice: 0x8fd3ff,
    forest: 0x5f8f56,
    crimson: 0xb84c4c,
    disabled: 0x605a62,
    text: '#f5e6c8',
    dimText: '#c8bba4'
};

export function createBackdrop(scene, alpha = 0.5) {
    return scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x050307, alpha)
        .setOrigin(0)
        .setScrollFactor(0);
}

export function createPixelPanel(scene, x, y, width, height, options = {}) {
    const container = scene.add.container(x, y);
    const bg = scene.add.graphics();
    const fill = options.fill ?? UI_COLORS.panel;
    const fillDark = options.fillDark ?? UI_COLORS.panelDark;
    const border = options.border ?? UI_COLORS.gold;
    bg.fillStyle(fillDark, options.outerAlpha ?? 0.88);
    bg.fillRect(-width / 2, -height / 2, width, height);
    bg.fillStyle(fill, options.innerAlpha ?? 0.92);
    bg.fillRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8);
    bg.lineStyle(2, 0x000000, 1);
    bg.strokeRect(-width / 2, -height / 2, width, height);
    bg.lineStyle(2, border, 1);
    bg.strokeRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4);
    bg.lineStyle(1, UI_COLORS.panelLite, 0.9);
    bg.strokeRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12);
    container.add(bg);
    return container;
}

export function createPixelText(scene, x, y, text, options = {}) {
    return scene.add.text(x, y, text, {
        fontFamily: options.fontFamily ?? 'monospace',
        fontSize: options.fontSize ?? '16px',
        color: options.color ?? UI_COLORS.text,
        stroke: options.stroke ?? '#000000',
        strokeThickness: options.strokeThickness ?? 4,
        align: options.align ?? 'center'
    }).setOrigin(options.originX ?? 0.5, options.originY ?? 0.5);
}

export function createPixelButton(scene, x, y, width, height, label, onClick, options = {}) {
    const container = scene.add.container(x, y);
    const bg = scene.add.graphics();
    const glow = scene.add.rectangle(0, 0, width + 10, height + 10, options.glowColor ?? UI_COLORS.ember, 0)
        .setOrigin(0.5);
    const text = createPixelText(scene, 0, 0, label, {
        fontSize: options.fontSize ?? '16px',
        color: options.textColor ?? UI_COLORS.text,
        strokeThickness: 3
    });
    const hitArea = scene.add.rectangle(0, 0, width, height, 0xffffff, 0.001).setOrigin(0.5);

    const redraw = (state = 'idle') => {
        const fill = state === 'active' ? (options.activeFill ?? 0x3f2b20) : (options.fill ?? UI_COLORS.panelDark);
        const inner = state === 'active' ? (options.activeInner ?? 0x5f4229) : (options.inner ?? UI_COLORS.panel);
        const border = state === 'active' ? (options.activeBorder ?? UI_COLORS.goldBright) : (options.border ?? UI_COLORS.gold);
        bg.clear();
        bg.fillStyle(fill, 0.92);
        bg.fillRect(-width / 2, -height / 2, width, height);
        bg.fillStyle(inner, 0.95);
        bg.fillRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8);
        bg.lineStyle(2, 0x000000, 1);
        bg.strokeRect(-width / 2, -height / 2, width, height);
        bg.lineStyle(2, border, 1);
        bg.strokeRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4);
        bg.lineStyle(1, state === 'active' ? UI_COLORS.goldBright : UI_COLORS.border, 1);
        bg.strokeRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12);
        text.setColor(state === 'active' ? '#fff4d0' : (options.textColor ?? UI_COLORS.text));
        glow.setAlpha(state === 'active' ? 0.16 : 0);
    };

    redraw();
    hitArea.setInteractive({ useHandCursor: true })
        .on('pointerover', () => redraw('active'))
        .on('pointerout', () => redraw('idle'))
        .on('pointerdown', () => onClick?.());

    container.add([glow, bg, text, hitArea]);
    container.setData('redraw', redraw);
    container.setData('text', text);
    container.setSize(width, height);
    return container;
}

export function createPixelToggle(scene, x, y, label, value, onToggle) {
    const container = scene.add.container(x, y);
    const labelText = createPixelText(scene, -60, 0, label, {
        fontSize: '14px',
        originX: 0,
        color: UI_COLORS.text
    });
    const button = createPixelButton(scene, 88, 0, 78, 28, value ? 'ON' : 'OFF', () => {
        const next = !button.getData('value');
        button.getData('setValue')?.(next);
        onToggle?.(next);
    }, {
        fontSize: '13px',
        fill: value ? 0x22301f : 0x342121,
        inner: value ? 0x314c2b : 0x4c2a2a,
        activeFill: value ? 0x2f4728 : 0x553030,
        activeInner: value ? 0x3d6434 : 0x6a3c3c,
        border: value ? UI_COLORS.forest : UI_COLORS.crimson,
        activeBorder: value ? 0x8fd37f : 0xff8a7a,
        textColor: value ? '#ddffd0' : '#ffd6d0'
    });
    const setValue = (next) => {
        button.setData('value', next);
        button.getData('text')?.setText(next ? 'ON' : 'OFF');
        button.getData('redraw')?.(next ? 'active' : 'idle');
    };
    button.setData('setValue', setValue);
    button.setData('value', value);
    container.add([labelText, button]);
    return container;
}

export function createSparkField(scene, x, y, width, height, count = 12, tint = UI_COLORS.ember) {
    const container = scene.add.container(x, y);
    const tweens = [];
    for (let i = 0; i < count; i += 1) {
        const spark = scene.add.rectangle(
            Phaser.Math.Between(-width / 2, width / 2),
            Phaser.Math.Between(-height / 2, height / 2),
            2,
            Phaser.Math.Between(2, 4),
            tint,
            Phaser.Math.FloatBetween(0.18, 0.42)
        ).setOrigin(0.5);
        container.add(spark);
        const tween = scene.tweens.add({
            targets: spark,
            y: spark.y - Phaser.Math.Between(8, 22),
            alpha: 0,
            duration: Phaser.Math.Between(900, 1800),
            repeat: -1,
            delay: Phaser.Math.Between(0, 1200),
            onRepeat: () => {
                spark.x = Phaser.Math.Between(-width / 2, width / 2);
                spark.y = Phaser.Math.Between(-height / 2, height / 2);
                spark.alpha = Phaser.Math.FloatBetween(0.18, 0.42);
            }
        });
        tweens.push(tween);
    }
    container.once?.(Phaser.GameObjects.Events.DESTROY, () => {
        tweens.forEach((tween) => tween?.remove?.());
    });
    return container;
}
