import { useEffect } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useComputedColorScheme, useMantineTheme } from '@mantine/core';

// The webview shows its own background wherever the page hasn't been painted yet, like when
// scrolling quickly in WebKitGTK. It is white by default, so match it to the page instead.
export default function WebviewBackground() {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme('light');
  const color = colorScheme === 'dark' ? theme.colors.dark[7] : theme.white;

  useEffect(() => {
    getCurrentWebviewWindow().setBackgroundColor(color).catch(console.error);
  }, [color]);

  return null;
}
