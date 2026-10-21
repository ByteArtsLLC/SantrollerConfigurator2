import '@mantine/core/styles.css';

import { lazy, Suspense, useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { applySellerFavicon } from '@/components/SettingsContext/sellerFavicon';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { Router } from './Router';
import { theme } from './theme';

// Only the desktop app needs these, so they stay out of the web build's main bundle
const DevicePicker = lazy(() => import('./desktop/DevicePicker'));
const UpdatePrompt = lazy(() => import('./desktop/UpdatePrompt'));
const WebviewBackground = lazy(() => import('./desktop/WebviewBackground'));
const isDesktop = 'isTauri' in window;

export default function App() {
  const favicon = useConfigStore((state) => state.toolInfo?.favicon);
  useEffect(() => applySellerFavicon(favicon), [favicon]);

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto" deduplicateInlineStyles>
      <Router />
      {isDesktop && (
        <Suspense>
          <DevicePicker />
          <UpdatePrompt />
          <WebviewBackground />
        </Suspense>
      )}
    </MantineProvider>
  );
}
