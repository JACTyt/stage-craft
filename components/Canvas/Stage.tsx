'use client';

import { useEffect, useRef } from 'react';
import { Layer, Stage as KonvaStage, Transformer } from 'react-konva';
import type Konva from 'konva';
import { useSceneStore } from '@/lib/sceneStore';
import ElementRenderer from '@/components/Canvas/ElementRenderer';

const STAGE_WIDTH = 1000;
const STAGE_HEIGHT = 700;

export default function Stage() {
  const scene = useSceneStore((s) => s.scene);
  const selectedElementId = useSceneStore((s) => s.selectedElementId);
  const selectElement = useSceneStore((s) => s.selectElement);
  const deleteElement = useSceneStore((s) => s.deleteElement);
  const addElement = useSceneStore((s) => s.addElement);
  const addElementFromCharacter = useSceneStore((s) => s.addElementFromCharacter);
  const keepRatio = useSceneStore((s) => s.keepRatio);

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef<Map<string, Konva.Group>>(new Map());

  const registerNode = (id: string, node: Konva.Group | null) => {
    if (node) nodeRefs.current.set(id, node);
    else nodeRefs.current.delete(id);
  };

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const node = selectedElementId ? nodeRefs.current.get(selectedElementId) : null;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedElementId, scene.elements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        deleteElement(selectedElementId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, deleteElement]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    stage.setPointersPositions(e);
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const characterJson = e.dataTransfer.getData('application/json+character');
    if (characterJson) {
      try {
        addElementFromCharacter(JSON.parse(characterJson), pos);
      } catch {
        // ignore malformed drag payloads
      }
      return;
    }

    const registryId = e.dataTransfer.getData('text/registry-id');
    if (registryId) addElement(registryId, pos);
  };

  const sortedLayers = [...scene.layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      className="inline-block rounded-lg border border-neutral-300 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <KonvaStage
        ref={stageRef}
        width={STAGE_WIDTH}
        height={STAGE_HEIGHT}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) selectElement(null);
        }}
      >
        {sortedLayers.map((layer) => (
          <Layer key={layer.id} visible={layer.visible} listening={!layer.locked}>
            {scene.elements
              .filter((el) => el.layerId === layer.id)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((el) => (
                <ElementRenderer
                  key={el.id}
                  element={el}
                  skin={scene.activeSkin}
                  isSelected={el.id === selectedElementId}
                  onSelect={() => selectElement(el.id)}
                  registerNode={registerNode}
                />
              ))}
          </Layer>
        ))}
        <Layer>
          <Transformer
            ref={transformerRef}
            keepRatio={keepRatio}
            rotateEnabled
            onTransformEnd={() => {
              if (!selectedElementId) return;
              const node = nodeRefs.current.get(selectedElementId);
              if (!node) return;
              useSceneStore.getState().rotateElement(selectedElementId, node.rotation());
              useSceneStore
                .getState()
                .scaleElement(selectedElementId, node.scaleX(), node.scaleY());
            }}
          />
        </Layer>
      </KonvaStage>
    </div>
  );
}
