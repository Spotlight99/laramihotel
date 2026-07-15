'use client';

import { useCallback, useEffect, useState } from 'react';

export function useClipboard(resetDelay = 1500) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), resetDelay);
    return () => window.clearTimeout(timer);
  }, [copied, resetDelay]);

  const copyText = useCallback(async (value: string) => {
    if (!value) return false;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        return true;
      }
    } catch {
      // fall through to manual fallback
    }

    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setCopied(true);
    return true;
  }, []);

  return { copied, copyText };
}
