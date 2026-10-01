import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import './DragHandle.css';

interface DragHandleProps {
  label: string;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setRef: (element: HTMLElement | null) => void;
}

/** The only part of a sortable item that starts a drag, so its inputs stay usable. */
export function DragHandle({ label, attributes, listeners, setRef }: DragHandleProps) {
  return (
    <button className="drag-handle" type="button" aria-label={label} ref={setRef} {...attributes} {...listeners}>
      <svg className="drag-handle-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M5 2h2v2H5zm4 0h2v2H9zM5 7h2v2H5zm4 0h2v2H9zm-4 5h2v2H5zm4 0h2v2H9z" />
      </svg>
    </button>
  );
}
