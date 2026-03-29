export default function stunOnHitBehavior(context) {
    const { skill, target } = context;
    if (!context.directHit || !target?.active) return;

    const stunDuration = skill.stunDuration ?? skill.config?.stunDuration ?? 0;
    if (stunDuration <= 0) return;

    const rawColor = skill.config?.stunColor ?? 0x000000;
    const tintColor = typeof rawColor === 'string'
        ? Phaser.Display.Color.HexStringToColor(rawColor).color
        : rawColor;
    target.applyStun?.(stunDuration, tintColor);
}
