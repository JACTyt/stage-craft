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
import SceneSettings from '@/components/Canvas/SceneSettings';
import SaveLoadControls from '@/components/Canvas/SaveLoadControls';
import GameMasterChat from '@/components/Canvas/GameMasterChat';
import CharactersPanel from '@/components/Canvas/CharactersPanel';
import NotesPanel from '@/components/Canvas/NotesPanel';
import LorePanel from '@/components/Canvas/LorePanel';
import RulesPanel from '@/components/Canvas/RulesPanel';
import SidePanelRail from '@/components/Canvas/SidePanelRail';
import Checkbox from '@/components/ui/Checkbox';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { ArrowLeft, Blocks, BookOpen, Layers, ScrollText, Settings, StickyNote, UserCog, Bot } from 'lucide-react';

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
  const [charactersOpen, setCharactersOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [loreOpen, setLoreOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(true);
  const [gmOpen, setGmOpen] = useState(true);
  const [sceneSettingsOpen, setSceneSettingsOpen] = useState(false);

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
    <div className="flex h-screen flex-col gap-3 bg-background p-3">
      <header className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-2">
          {scene.collectionId && (
            <Link
              href={`/collections/${scene.collectionId}`}
              className="flex items-center gap-0.5 text-xs text-foreground-muted hover:underline"
            >
              <ArrowLeft className="h-3 w-3" /> Campaign
            </Link>
          )}
          <input
            value={scene.name}
            onChange={(e) => renameScene(e.target.value)}
            title="Scene name"
            className="rounded border border-transparent bg-transparent px-1 font-display text-lg font-semibold uppercase tracking-wide text-foreground hover:border-border focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1.5 text-foreground">
            <Checkbox checked={snapToSockets} onChange={toggleSnapToSockets} />
            Snap to sockets
          </label>
          <label className="flex items-center gap-1.5 text-foreground">
            <Checkbox checked={snapToGrid} onChange={toggleSnapToGrid} />
            Snap to grid
          </label>
          <label className="flex items-center gap-1.5 text-foreground">
            <Checkbox checked={keepRatio} onChange={toggleKeepRatio} />
            Keep ratio (resize)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-foreground-muted">Theme</span>
            <div className="flex overflow-hidden rounded-md border border-border">
              {(['fantasy', 'sci-fi', 'custom'] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setActiveTheme(theme)}
                  className={`px-3 py-1 capitalize ${
                    activeTheme === theme
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-transparent text-foreground-muted hover:bg-surface-raised'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground-muted">Skin</span>
            <div className="flex overflow-hidden rounded-md border border-border">
              {(['tactical', 'illustrated'] as const).map((skin) => (
                <button
                  key={skin}
                  type="button"
                  onClick={() => setActiveSkin(skin)}
                  className={`px-3 py-1 capitalize ${
                    scene.activeSkin === skin
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-transparent text-foreground-muted hover:bg-surface-raised'
                  }`}
                >
                  {skin}
                </button>
              ))}
            </div>
          </div>
          <TilesetImportModal />
          <SaveLoadControls />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 gap-3 overflow-hidden">
        <SidePanelRail
          items={[
            { key: 'elements', label: 'Elements', icon: Blocks, open: elementsOpen, onToggle: () => setElementsOpen((v) => !v) },
            ...(scene.collectionId
              ? [
                  {
                    key: 'characters',
                    label: 'Characters',
                    icon: UserCog,
                    open: charactersOpen,
                    onToggle: () => setCharactersOpen((v) => !v),
                  },
                  { key: 'notes', label: 'Notes', icon: StickyNote, open: notesOpen, onToggle: () => setNotesOpen((v) => !v) },
                  { key: 'lore', label: 'Lore', icon: BookOpen, open: loreOpen, onToggle: () => setLoreOpen((v) => !v) },
                  { key: 'rules', label: 'Rules', icon: ScrollText, open: rulesOpen, onToggle: () => setRulesOpen((v) => !v) },
                ]
              : []),
          ]}
        />
        {elementsOpen && <Toolbar />}
        {scene.collectionId && charactersOpen && <CharactersPanel collectionId={scene.collectionId} />}
        {scene.collectionId && notesOpen && <NotesPanel collectionId={scene.collectionId} />}
        {scene.collectionId && loreOpen && <LorePanel collectionId={scene.collectionId} />}
        {scene.collectionId && rulesOpen && <RulesPanel collectionId={scene.collectionId} />}
        <div className="flex-1 overflow-auto rounded-lg bg-surface p-2">
          <Stage />
        </div>
        {sceneSettingsOpen && <SceneSettings />}
        {layersOpen && <LayersPanel />}
        {gmOpen && <GameMasterChat />}
        <SidePanelRail
          items={[
            {
              key: 'scene',
              label: 'Scene',
              icon: Settings,
              open: sceneSettingsOpen,
              onToggle: () => setSceneSettingsOpen((v) => !v),
            },
            { key: 'layers', label: 'Layers', icon: Layers, open: layersOpen, onToggle: () => setLayersOpen((v) => !v) },
            { key: 'gm', label: 'Game Master', icon: Bot, open: gmOpen, onToggle: () => setGmOpen((v) => !v) },
          ]}
        />
      </div>
    </div>
  );
}
