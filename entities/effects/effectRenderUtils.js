export function resolveEffectDepth(referenceDepth, offset = 0, options = {}) {
    const fallbackDepth = Number.isFinite(options.fallbackDepth) ? options.fallbackDepth : 0;
    const base = Number.isFinite(referenceDepth) ? referenceDepth : fallbackDepth;
    const safeOffset = Number.isFinite(offset) ? offset : 0;
    const raw = base + safeOffset;
    const minDepth = Number.isFinite(options.minDepth) ? options.minDepth : 0;
    const maxDepth = Number.isFinite(options.maxDepth) ? options.maxDepth : 55;
    if (raw < minDepth) return minDepth;
    if (raw > maxDepth) return maxDepth;
    return raw;
}

