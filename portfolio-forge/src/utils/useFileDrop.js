import { useEffect, useRef, useState } from 'react';

// Drag-and-drop for file pickers. Returns props to spread on the drop area plus a `dragging` flag.
// While a page using this hook is open, a file dropped OUTSIDE the zone is ignored instead of
// making the browser navigate away to the file.
export function useFileDrop(onFiles, { multiple = false } = {}) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  useEffect(() => {
    const stop = (e) => { if (e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files')) e.preventDefault(); };
    window.addEventListener('dragover', stop);
    window.addEventListener('drop', stop);
    return () => { window.removeEventListener('dragover', stop); window.removeEventListener('drop', stop); };
  }, []);

  const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
  return {
    dragging,
    dropProps: {
      onDragEnter: (e) => { if (!hasFiles(e)) return; e.preventDefault(); depth.current += 1; setDragging(true); },
      onDragOver: (e) => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; },
      onDragLeave: (e) => { if (!hasFiles(e)) return; depth.current = Math.max(0, depth.current - 1); if (depth.current === 0) setDragging(false); },
      onDrop: (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault(); depth.current = 0; setDragging(false);
        const files = [...e.dataTransfer.files];
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      },
    },
  };
}
