import { invoke } from '@tauri-apps/api/core';

// The system webviews don't download files or open new windows, so do those for them: downloads
// go through a save dialog, and links out of the app open in the browser.

async function saveDownload(link: HTMLAnchorElement) {
  const name = link.download || new URL(link.href).pathname.split('/').pop() || 'download';
  const data = new Uint8Array(await (await fetch(link.href)).arrayBuffer());
  await invoke('save_file', data, { headers: { 'x-file-name': name } });
}

function isExternal(link: HTMLAnchorElement) {
  return /^(https?|mailto):/.test(link.protocol) && link.origin !== window.location.origin;
}

export function installLinkHandlers() {
  // Capturing, so it happens before react-router sees the click
  document.addEventListener(
    'click',
    (e) => {
      const link = (e.target as Element | null)?.closest?.('a');
      if (!link || !link.href || e.defaultPrevented) {
        return;
      }
      if (link.hasAttribute('download')) {
        e.preventDefault();
        saveDownload(link).catch(console.error);
      } else if (isExternal(link)) {
        e.preventDefault();
        invoke('plugin:opener|open_url', { url: link.href }).catch(console.error);
      }
    },
    true
  );
}
