export const elapsed = (start: number) => `${((performance.now() - start) / 1000).toFixed(1)}s`
