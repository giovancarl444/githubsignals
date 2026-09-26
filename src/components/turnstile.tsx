'use client';
import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}
export function Turnstile({
  action,
  onToken,
  resetKey,
}: {
  action: string;
  onToken: (token: string) => void;
  resetKey: number;
}) {
  const node = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const callback = useRef(onToken);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);
  const render = useCallback(() => {
    if (!node.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(node.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      theme: 'dark',
      action,
      callback: (token: string) => callback.current(token),
      'expired-callback': () => callback.current(''),
      'error-callback': () => callback.current(''),
    });
  }, [action]);
  useEffect(() => {
    if (ready) render();
    return () => {
      if (widget.current) {
        window.turnstile?.remove(widget.current);
        widget.current = null;
      }
    };
  }, [ready, render]);
  useEffect(() => {
    if (widget.current) {
      window.turnstile?.reset(widget.current);
      callback.current('');
    }
  }, [resetKey]);
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
      />
      <div ref={node} className="verification" aria-label="Anti-spam verification" />
    </>
  );
}
