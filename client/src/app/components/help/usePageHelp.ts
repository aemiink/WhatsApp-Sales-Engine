import { useEffect, useMemo, useState } from 'react';
import { PageHelpContent, PageHelpKey, helpContentMap } from './help-content';

const STORAGE_PREFIX = 'wse_help_seen_';

function readSeen(pageKey: PageHelpKey): boolean {
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${pageKey}`) === 'true';
  } catch {
    return false;
  }
}

function writeSeen(pageKey: PageHelpKey): void {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${pageKey}`, 'true');
  } catch {
    // Local storage failures should not block UI usage.
  }
}

interface UsePageHelpResult {
  content: PageHelpContent | null;
  isOpen: boolean;
  open: () => void;
  close: (markAsSeen?: boolean) => void;
}

export function usePageHelp(pageKey?: PageHelpKey): UsePageHelpResult {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!pageKey) {
      setIsOpen(false);
      return;
    }

    const alreadySeen = readSeen(pageKey);
    if (!alreadySeen) {
      setIsOpen(true);
    }
  }, [pageKey]);

  const content = useMemo(() => {
    if (!pageKey) {
      return null;
    }

    return helpContentMap[pageKey] ?? null;
  }, [pageKey]);

  return {
    content,
    isOpen,
    open: () => {
      if (!pageKey) {
        return;
      }
      setIsOpen(true);
    },
    close: (markAsSeen = true) => {
      if (pageKey && markAsSeen) {
        writeSeen(pageKey);
      }
      setIsOpen(false);
    },
  };
}
