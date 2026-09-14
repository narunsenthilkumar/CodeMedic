export function add(a: number, b: number): number {
  return a + b;
}

// Notice: Exported function name is 'calcScore', NOT 'calculateScore'
export function calcScore(points: number[]): number {
  return points.reduce((acc, curr) => acc + curr, 0);
}
