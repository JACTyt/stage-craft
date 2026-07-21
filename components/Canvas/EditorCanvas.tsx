'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSceneStore } from '@/lib/sceneStore';
import type { RegistryEntry, Scene } from '@/types/scene';
import Toolbar from '@/components/Canvas/Toolbar';
import LayersPanel from '@/components/Canvas/LayersPanel';
import Stage from '@/components/Canvas/Stage';
import TilesetImportModal from '@/components/Canvas/TilesetImportModal';
import SaveLoadControls from '@/components/Canvas/SaveLoadControls';
import GameMasterChat from '@/components/Canvas/GameMasterChat';
import CharacterRosterPanel from '@/components/Canvas/CharacterRosterPanel';
import CharactersPanel from '@/components/Canvas/CharactersPanel';
import NotesPanel from '@/components/Canvas/NotesPanel';
import LorePanel from '@/components/Canvas/LorePanel';
import RulesPanel from '@/components/Canvas/RulesPanel';
import SidePanelRail from '@/components/Canvas/SidePanelRail';

export default function EditorCanvas() {
  const searchParams = useSearchParams();
  const sceneId = searchParams.get('scene');
  const scene = useSceneStore((s) => s.scene);
  const replaceScene = useSceneStore((s) => s.replaceScene);
  const renameScene = useSceneStore((s) => s.renameScene);
  const setActiveSkin = useSceneStore((s) => s.setActiveSkin);
  const activeTheme = useSceneStore((s) => s.activeTheme);
  const setActiveTheme = useSceneStore((s) => s.setActiveTheme);
  const snapToGrid = useSceneStore((s) => s.snapToGrid);
  const snapToSockets = useSceneStore((s) => s.snapToSockets);
  const toggleSnapToGrid = useSceneStore((s) => s.toggleSnapToGrid);
  const toggleSnapToSockets = useSceneStore((s) => s.toggleSnapToSockets);
  const keepRatio = useSceneStore((s) => s.keepRatio);
  const toggleKeepRatio = useSceneStore((s) => s.toggleKeepRatio);

  const [elementsOpen, setElementsOpen] = useState(true);
  const [rosterOpen, setRosterOpen] = useState(true);
  const [charactersOpen, setCharactersOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [loreOpen, setLoreOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(true);
  const [gmOpen, setGmOpen] = useState(true);

  useEffect(() => {
    if (!sceneId) return;
    fetch(`/api/scenes/${sceneId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        replaceScene(data.scene as Scene, (data.customEntries as RegistryEntry[]) ?? []);
      })
      .catch(() => {});
    // Only load once per scene id from the URL, not on every scene edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId]);

  return (
    <div className="flex h-screen flex-col gap-3 bg-neutral-100 p-3 dark:bg-neutral-950">
      <header className="flex items-center justify-between rounded-lg border border-neutral-300 bg-white px-4 py-2 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          {scene.collectionId && (
            <Link
              href={`/collections/${scene.collectionId}`}
              className="text-xs text-neutral-400 hover:underline"
            >
              ← Campaign
            </Link>
          )}
          <input
            value={scene.name}
            onChange={(e) => renameScene(e.target.value)}
            title="Scene name"
            className="rounded border border-transparent bg-transparent px-1 text-lg font-semibold text-neutral-800 hover:border-neutral-300 focus:border-blue-400 focus:outline-none dark:text-neutral-100 dark:hover:border-neutral-700"
          />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" checked={snapToSockets} onChange={toggleSnapToSockets} />
            Snap to sockets
          </label>
          <label className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" checked={snapToGrid} onChange={toggleSnapToGrid} />
            Snap to grid
          </label>
          <label className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" checked={keepRatio} onChange={toggleKeepRatio} />
            Keep ratio (resize)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 dark:text-neutral-400">Theme</span>
            <div className="flex overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
              {(['fantasy', 'sci-fi', 'custom'] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setActiveTheme(theme)}
                  className={`px-3 py-1 capitalize ${
                    activeTheme === theme
                      ? 'bg-purple-600 text-white'
                      : 'bg-transparent text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 dark:text-neutral-400">Skin</span>
            <div className="flex overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
              {(['tactical', 'illustrated'] as const).map((skin) => (
                <button
                  key={skin}
                  type="button"
                  onClick={() => setActiveSkin(skin)}
                  className={`px-3 py-1 capitalize ${
                    scene.activeSkin === skin
                      ? 'bg-blue-600 text-white'
                      : 'bg-transparent text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  }`}
                >
                  {skin}
                </button>
              ))}
            </div>
          </div>
          <TilesetImportModal />
          <SaveLoadControls />
        </div>
      </header>

      <div className="flex flex-1 gap-3 overflow-hidden">
        <SidePanelRail
          items={[
            { key: 'elements', label: 'Elements', open: elementsOpen, onToggle: () => setElementsOpen((v) => !v) },
            ...(scene.collectionId
              ? [
                  { key: 'roster', label: 'Roster', open: rosterOpen, onToggle: () => setRosterOpen((v) => !v) },
                  {
                    key: 'characters',
                    label: 'Characters',
                    open: charactersOpen,
                    onToggle: () => setCharactersOpen((v) => !v),
                  },
                  { key: 'notes', label: 'Notes', open: notesOpen, onToggle: () => setNotesOpen((v) => !v) },
                  { key: 'lore', label: 'Lore', open: loreOpen, onToggle: () => setLoreOpen((v) => !v) },
                  { key: 'rules', label: 'Rules', open: rulesOpen, onToggle: () => setRulesOpen((v) => !v) },
                ]
              : []),
          ]}
        />
        {elementsOpen && <Toolbar />}
        {scene.collectionId && rosterOpen && <CharacterRosterPanel collectionId={scene.collectionId} />}
        {scene.collectionId && charactersOpen && <CharactersPanel collectionId={scene.collectionId} />}
        {scene.collectionId && notesOpen && <NotesPanel collectionId={scene.collectionId} />}
        {scene.collectionId && loreOpen && <LorePanel collectionId={scene.collectionId} />}
        {scene.collectionId && rulesOpen && <RulesPanel collectionId={scene.collectionId} />}
        <div className="flex-1 overflow-auto">
          <Stage />
        </div>
        {layersOpen && <LayersPanel />}
        {gmOpen && <GameMasterChat />}
        <SidePanelRail
          items={[
            { key: 'layers', label: 'Layers', open: layersOpen, onToggle: () => setLayersOpen((v) => !v) },
            { key: 'gm', label: 'Game Master', open: gmOpen, onToggle: () => setGmOpen((v) => !v) },
          ]}
        />
      </div>
    </div>
  );
}
