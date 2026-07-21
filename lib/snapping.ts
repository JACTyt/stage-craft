import type { ElementInstance, RegistryEntry, SnapDirection, SnapPoint } from '@/types/scene';

const SOCKET_SNAP_THRESHOLD = 24; // px
const OPPOSITE_DOT_THRESHOLD = -0.9; // world direction vectors must point roughly at each other

const DIRECTION_VECTORS: Record<SnapDirection, { x: number; y: number }> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

function rotateVector(v: { x: number; y: number }, rotationDeg: number) {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

function worldSnapPoint(pos: { x: number; y: number }, rotation: number, point: SnapPoint) {
  const offset = rotateVector({ x: point.x, y: point.y }, rotation);
  const direction = rotateVector(DIRECTION_VECTORS[point.direction], rotation);
  return { x: pos.x + offset.x, y: pos.y + offset.y, direction };
}

export interface PlacedElement {
  element: ElementInstance;
  entry: RegistryEntry;
}

/**
 * Finds the best nearby socket match for a dragged element and returns the
 * position it should snap to, or null if nothing is close enough to connect.
 */
export function computeSocketSnap(
  draggedPos: { x: number; y: number },
  draggedRotation: number,
  draggedEntry: RegistryEntry,
  others: PlacedElement[]
): { x: number; y: number } | null {
  const draggedPoints = draggedEntry.snapPoints;
  if (!draggedPoints || draggedPoints.length === 0) return null;

  let best: { x: number; y: number; distance: number } | null = null;

  for (const point of draggedPoints) {
    const worldA = worldSnapPoint(draggedPos, draggedRotation, point);

    for (const { element: otherElement, entry: otherEntry } of others) {
      if (!otherEntry.snapPoints) continue;

      for (const otherPoint of otherEntry.snapPoints) {
        const worldB = worldSnapPoint(
          { x: otherElement.x, y: otherElement.y },
          otherElement.rotation,
          otherPoint
        );

        const dot = worldA.direction.x * worldB.direction.x + worldA.direction.y * worldB.direction.y;
        if (dot > OPPOSITE_DOT_THRESHOLD) continue; // not facing each other

        const dx = worldB.x - worldA.x;
        const dy = worldB.y - worldA.y;
        const distance = Math.hypot(dx, dy);
        if (distance > SOCKET_SNAP_THRESHOLD) continue;

        if (!best || distance < best.distance) {
          best = { x: draggedPos.x + dx, y: draggedPos.y + dy, distance };
        }
      }
    }
  }

  return best ? { x: best.x, y: best.y } : null;
}

export function computeGridSnap(pos: { x: number; y: number }, gridSize: number) {
  return {
    x: Math.round(pos.x / gridSize) * gridSize,
    y: Math.round(pos.y / gridSize) * gridSize,
  };
}
