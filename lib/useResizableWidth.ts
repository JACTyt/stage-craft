import { useCallback, useRef, useState } from 'react';

/**
 * Tracks a panel's pixel width, adjustable by dragging a handle.
 * `handleSide` is which edge of the panel the handle sits on: 'right' for panels
 * anchored to the left of the screen (dragging right grows them), 'left' for panels
 * anchored to the right of the screen (dragging left grows them).
 */
export function useResizableWidth(
  defaultWidth: number,
  minWidth = 180,
  maxWidth = 480,
  handleSide: 'left' | 'right' = 'right'
) {
  const [width, setWidth] = useState(defaultWidth);
  const dragStart = useRef<{ x: number; width: number } | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragStart.current = { x: e.clientX, width };

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStart.current) return;
        const delta = moveEvent.clientX - dragStart.current.x;
        const signedDelta = handleSide === 'right' ? delta : -delta;
        setWidth(Math.min(maxWidth, Math.max(minWidth, dragStart.current.width + signedDelta)));
      };

      const onMouseUp = () => {
        dragStart.current = null;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [width, minWidth, maxWidth, handleSide]
  );

  return { width, onMouseDown };
}
