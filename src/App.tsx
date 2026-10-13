import '@mantine/core/styles.css';

import { lazy, Suspense } from 'react';
import { MantineProvider } from '@mantine/core';
import { Router } from './Router';

// Only the desktop app needs these, so they stay out of the web build's main bundle
const DevicePicker = lazy(() => import('./desktop/DevicePicker'));
const UpdatePrompt = lazy(() => import('./desktop/UpdatePrompt'));
const WebviewBackground = lazy(() => import('./desktop/WebviewBackground'));
const isDesktop = 'isTauri' in window;

export default function App() {
  return (
    <MantineProvider defaultColorScheme="auto" deduplicateInlineStyles>
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
