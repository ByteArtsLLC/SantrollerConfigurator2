import { useEffect, useState } from 'react';
import { IconDownload } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@mantine/core';

export const RELEASES_URL = 'https://github.com/Santroller/SantrollerConfigurator2/releases/latest';
const LATEST_RELEASE_API =
  'https://api.github.com/repos/Santroller/SantrollerConfigurator2/releases/latest';

export type DesktopOs = 'windows' | 'mac' | 'linux';

// Which installer to offer. The desktop app doesn't run on phones and tablets, so none there.
export function desktopOs(): DesktopOs | undefined {
  const agent = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod/.test(agent)) {
    return undefined;
  }
  if (/Windows/.test(agent)) {
    return 'windows';
  }
  if (/Macintosh|Mac OS X/.test(agent)) {
    // iPads ask for the desktop site, but have a touch screen
    return navigator.maxTouchPoints > 1 ? undefined : 'mac';
  }
  if (/Linux|X11|CrOS/.test(agent)) {
    return 'linux';
  }
  return undefined;
}

// Linux has a few kinds of package, so it gets the release page to pick one from
const INSTALLER_SUFFIX: Partial<Record<DesktopOs, string>> = {
  windows: '-setup.exe',
  mac: '.dmg',
};

// Only shown on the website, to get the desktop app. Links straight to the installer for this
// computer when it can find it, and to the latest release otherwise.
export function DesktopDownloadButton() {
  const { t } = useTranslation();
  const [os] = useState(desktopOs);
  const [href, setHref] = useState(RELEASES_URL);

  useEffect(() => {
    const suffix = os && INSTALLER_SUFFIX[os];
    if (!suffix) {
      return;
    }
    fetch(LATEST_RELEASE_API)
      .then((response) => (response.ok ? response.json() : undefined))
      .then((release?: { assets?: { name: string; browser_download_url: string }[] }) => {
        const asset = release?.assets?.find((a) => a.name.endsWith(suffix));
        if (asset) {
          setHref(asset.browser_download_url);
        }
      })
      .catch(() => {});
  }, [os]);

  if ('isTauri' in window || !os) {
    return null;
  }
  return (
    <Button
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="default"
      leftSection={<IconDownload size={18} />}
    >
      {t(`connect.downloadDesktop.${os}`)}
    </Button>
  );
}
