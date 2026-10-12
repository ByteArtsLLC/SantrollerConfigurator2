// Browsers throttle timers on a hidden tab to once a second, and to once a minute after a few minutes,
// which is far slower than the firmware's keepalive timeout. Timers inside a worker aren't throttled like
// that, so the worker does the timing and the page just reacts to its messages.
const workerSource = `
const timers = new Map();
onmessage = (e) => {
  const { id, ms } = e.data;
  if (ms === undefined) {
    clearInterval(timers.get(id));
    timers.delete(id);
    return;
  }
  timers.set(id, setInterval(() => postMessage(id), ms));
};
`;

export type KeepaliveTimer = number;

const callbacks = new Map<KeepaliveTimer, () => void>();
// Used when workers aren't available (tests, or a page that blocks blob workers)
const fallbacks = new Map<KeepaliveTimer, ReturnType<typeof setInterval>>();
let worker: Worker | null | undefined;
let nextId = 1;

function getWorker() {
  if (worker === undefined) {
    try {
      const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
      worker = new Worker(url);
      worker.onmessage = (e: MessageEvent<KeepaliveTimer>) => callbacks.get(e.data)?.();
    } catch {
      worker = null;
    }
  }
  return worker;
}

export function startKeepaliveTimer(callback: () => void, ms: number): KeepaliveTimer {
  const id = nextId++;
  const w = getWorker();
  if (w) {
    callbacks.set(id, callback);
    w.postMessage({ id, ms });
  } else {
    fallbacks.set(id, setInterval(callback, ms));
  }
  return id;
}

export function stopKeepaliveTimer(id: KeepaliveTimer | undefined) {
  if (id === undefined) {
    return;
  }
  if (callbacks.delete(id)) {
    worker?.postMessage({ id });
  }
  clearInterval(fallbacks.get(id));
  fallbacks.delete(id);
}
