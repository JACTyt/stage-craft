'use client';

import { useRef, useState } from 'react';
import { useSceneStore } from '@/lib/sceneStore';
import { readImageAsDataUrl } from '@/lib/imageUtils';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PanelFrame from '@/components/Canvas/PanelFrame';

export default function SceneSettings() {
  const [error, setError] = useState<string | null>(null);
  const scene = useSceneStore((s) => s.scene);
  const setSceneSize = useSceneStore((s) => s.setSceneSize);
  const setBackgroundImage = useSceneStore((s) => s.setBackgroundImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackgroundFile = async (file: File) => {
    setError(null);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setBackgroundImage(dataUrl);
    } catch {
      setError('Could not process that image.');
    }
  };

  return (
    <PanelFrame title="Scene" defaultWidth={256}>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          Canvas size
        </p>
        <div className="flex items-center gap-2">
          <label className="flex flex-1 items-center gap-1.5 text-sm text-foreground-muted">
            W
            <Input
              type="number"
              min={200}
              value={scene.width}
              onChange={(e) => setSceneSize(Number(e.target.value), scene.height)}
              className="w-full"
            />
          </label>
          <label className="flex flex-1 items-center gap-1.5 text-sm text-foreground-muted">
            H
            <Input
              type="number"
              min={200}
              value={scene.height}
              onChange={(e) => setSceneSize(scene.width, Number(e.target.value))}
              className="w-full"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          Background image
        </p>
        {scene.backgroundImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic user-uploaded data URL, not a static asset
          <img
            src={scene.backgroundImageUrl}
            alt="Scene background"
            className="h-24 w-full rounded border border-border object-cover"
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleBackgroundFile(file);
            e.target.value = '';
          }}
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-xs">
            Upload
          </Button>
          {scene.backgroundImageUrl && (
            <Button variant="secondary" onClick={() => setBackgroundImage(undefined)} className="text-xs">
              Remove
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </PanelFrame>
  );
}
