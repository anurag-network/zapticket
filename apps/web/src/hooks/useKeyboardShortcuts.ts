import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (event.key !== 'Escape') return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'n', ctrl: true, handler: () => {}, description: 'Create new ticket' },
  { key: 'f', ctrl: true, handler: () => {}, description: 'Focus search' },
  { key: 'j', handler: () => {}, description: 'Next ticket' },
  { key: 'k', handler: () => {}, description: 'Previous ticket' },
  { key: 'o', handler: () => {}, description: 'Open selected ticket' },
  { key: 'c', handler: () => {}, description: 'Add comment' },
  { key: 'r', handler: () => {}, description: 'Reply to ticket' },
  { key: 'e', handler: () => {}, description: 'Edit ticket' },
  { key: 'a', handler: () => {}, description: 'Assign ticket' },
  { key: 's', handler: () => {}, description: 'Change status' },
  { key: 'p', handler: () => {}, description: 'Change priority' },
  { key: 'l', handler: () => {}, description: 'Add label/tags' },
  { key: 'm', handler: () => {}, description: 'Merge tickets' },
  { key: 'Escape', handler: () => {}, description: 'Close modal' },
];
