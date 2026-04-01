export function normalizeRotation(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function aabbIntersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function normalizeRect(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number
): Rect {
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  return { x, y, width, height };
}
