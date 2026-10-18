import { Navigate } from 'react-router-dom';
import { useConfigStore } from '../SettingsContext/SettingsContext';

export function RequireDevice({ children }: { children: React.ReactNode }) {
  const connected = useConfigStore((state) => state.connected);
  // Without the controller's config there is nothing to edit, the connect page says why
  const configLoadError = useConfigStore((state) => state.configLoadError);
  if (!connected || configLoadError) {
    return <Navigate to="/" />;
  }
  return children;
}
