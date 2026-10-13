import { create } from 'zustand';

// Lets the Connect page ask UpdatePrompt to look for an update right away, without pulling the
// updater plugin into the web build
export type UpdateCheckStatus = 'idle' | 'checking' | 'upToDate' | 'failed';

export const useUpdateCheck = create<{ requests: number; status: UpdateCheckStatus }>(() => ({
  requests: 0,
  status: 'idle',
}));

export function requestUpdateCheck() {
  useUpdateCheck.setState((state) => ({ requests: state.requests + 1, status: 'checking' }));
}
