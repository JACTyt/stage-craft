'use client';

import { Circle, Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { ElementInstance, Skin } from '@/types/scene';
import { resolveRegistryEntry, useSceneStore } from '@/lib/sceneStore';
import { computeGridSnap, computeSocketSnap, type PlacedElement } from '@/lib/snapping';
import { useHTMLImage } from '@/lib/useHTMLImage';

interface ElementRendererProps {
  element: ElementInstance;
  skin: Skin;
  isSelected: boolean;
  onSelect: () => void;
  registerNode: (id: string, node: Konva.Group | null) => void;
}

export default function ElementRenderer({
  element,
  skin,
  isSelected,
  onSelect,
  registerNode,
}: ElementRendererProps) {
  const moveElement = useSceneStore((s) => s.moveElement);
  const allElements = useSceneStore((s) => s.scene.elements);
  const gridSize = useSceneStore((s) => s.scene.gridSize);
  const snapToGrid = useSceneStore((s) => s.snapToGrid);
  const snapToSockets = useSceneStore((s) => s.snapToSockets);
  const customEntries = useSceneStore((s) => s.customEntries);
  const entry = resolveRegistryEntry(element.registryId, customEntries);
  const visual = entry?.visualBySkin[skin];
  const htmlImage = useHTMLImage(visual?.imageUrl);

  if (!entry || !visual) return null;

  const { width, height } = entry.defaultSize;

  const applySnap = (node: Konva.Group) => {
    const pos = { x: node.x(), y: node.y() };

    if (snapToSockets) {
      const others: PlacedElement[] = allElements
        .filter((el) => el.id !== element.id)
        .flatMap((el) => {
          const otherEntry = resolveRegistryEntry(el.registryId, customEntries);
          return otherEntry ? [{ element: el, entry: otherEntry }] : [];
        });
      const socketSnap = computeSocketSnap(pos, element.rotation, entry, others);
      if (socketSnap) {
        node.position(socketSnap);
        return;
      }
    }

    if (snapToGrid) {
      node.position(computeGridSnap(pos, gridSize));
    }
  };

  return (
    <Group
      ref={(node) => registerNode(element.id, node)}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragMove={(e) => applySnap(e.target as Konva.Group)}
      onDragEnd={(e) => moveElement(element.id, e.target.x(), e.target.y())}
    >
      {visual.imageUrl ? (
        <>
          {htmlImage && (
            <KonvaImage
              image={htmlImage}
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
            />
          )}
          {isSelected && (
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              stroke="#facc15"
              strokeWidth={3}
              listening={false}
            />
          )}
        </>
      ) : visual.shape === 'circle' ? (
        <Circle
          radius={width / 2}
          fill={element.color ?? visual.fill}
          stroke={isSelected ? '#facc15' : visual.stroke}
          strokeWidth={isSelected ? 3 : 1.5}
        />
      ) : (
        <Rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          fill={element.color ?? visual.fill}
          stroke={isSelected ? '#facc15' : visual.stroke}
          strokeWidth={isSelected ? 3 : 1.5}
          cornerRadius={4}
        />
      )}
      <Text
        x={-width / 2}
        y={-6}
        width={width}
        align="center"
        text={element.characterSheet?.name ?? visual.label}
        fontSize={11}
        fill="#111827"
        listening={false}
        scaleX={1 / (Math.abs(element.scaleX) || 1)}
        scaleY={1 / (Math.abs(element.scaleY) || 1)}
      />
      {element.characterSheet && (
        <Group x={-width / 2} y={-height / 2 - 10} listening={false}>
          <Rect width={width} height={5} fill="#3f3f46" cornerRadius={2} />
          <Rect
            width={
              width *
              Math.max(0, Math.min(1, element.characterSheet.hp / (element.characterSheet.maxHp || 1)))
            }
            height={5}
            fill={
              element.characterSheet.hp / (element.characterSheet.maxHp || 1) > 0.5
                ? '#22c55e'
                : element.characterSheet.hp / (element.characterSheet.maxHp || 1) > 0.25
                  ? '#eab308'
                  : '#ef4444'
            }
            cornerRadius={2}
          />
        </Group>
      )}
    </Group>
  );
}
