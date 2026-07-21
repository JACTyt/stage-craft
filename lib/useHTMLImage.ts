import { useEffect, useState } from 'react';

export function useHTMLImage(src?: string): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement>();

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) setImage(img);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return src ? image : undefined;
}
