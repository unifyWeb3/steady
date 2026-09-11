export function createRequestGeneration() {
  let current = 0;
  return Object.freeze({
    start() {
      current += 1;
      return current;
    },
    isCurrent(generation) {
      return generation === current;
    },
    invalidate() {
      current += 1;
    },
  });
}
