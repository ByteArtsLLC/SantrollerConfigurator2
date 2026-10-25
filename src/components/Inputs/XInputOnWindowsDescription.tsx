import { useTranslation } from 'react-i18next';
import { Anchor } from '@mantine/core';

const isDesktop = 'isTauri' in window;

// DirectInput caches pad names per VID/PID, so swapping between HID and XInput can leave joy.cpl showing
// the pad blank. The desktop app clears that cache itself, browsers can't, so they get a .reg file instead
export function XInputOnWindowsDescription() {
  const { t } = useTranslation();
  return (
    <>
      {t('main.xinput_on_windows.description')}
      {!isDesktop && (
        <>
          {' '}
          <Anchor href="/santroller-clear-joystick-cache.reg" download inherit>
            {t('main.xinput_on_windows.clear_cache')}
          </Anchor>
        </>
      )}
    </>
  );
}
