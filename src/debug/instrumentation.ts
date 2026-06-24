const STORAGE_KEY = 'connected-reader:debug-events';
const SESSION_KEY = 'connected-reader:debug-session';
const MAX_EVENTS = 1000;

export type DebugLevel = 'debug' | 'info' | 'warn' | 'error';

export type DebugEvent = {
  id: number;
  timestamp: string;
  elapsedMs: number;
  sessionId: string;
  level: DebugLevel;
  area: string;
  event: string;
  data?: unknown;
};

export type DebugReport = {
  generatedAt: string;
  sessionId: string;
  app: {
    mode: string;
    version: string;
    url: string;
  };
  environment: Record<string, unknown>;
  events: DebugEvent[];
};

export type ConnectedReaderDebugApi = {
  help: () => void;
  events: () => DebugEvent[];
  report: () => DebugReport;
  reportText: () => string;
  copyReport: () => Promise<string>;
  print: () => DebugReport;
  latestError: () => DebugEvent | undefined;
  clear: () => void;
  log: (event: string, data?: unknown) => void;
};

declare global {
  interface Window {
    ConnectedReaderDebug: ConnectedReaderDebugApi;
    __CONNECTED_READER_DEBUG__: ConnectedReaderDebugApi;
  }
}

const startedAt = performance.now();
let nextId = 1;
let installed = false;

function safeSessionStorage(): Storage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

function createSessionId(): string {
  const storage = safeSessionStorage();
  const existing = storage?.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;
  storage?.setItem(SESSION_KEY, id);
  return id;
}

const sessionId = createSessionId();

function readPersistedEvents(): DebugEvent[] {
  try {
    const raw = safeSessionStorage()?.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DebugEvent[];
    nextId = Math.max(0, ...parsed.map((entry) => entry.id)) + 1;
    return parsed.slice(-MAX_EVENTS);
  } catch {
    return [];
  }
}

const eventBuffer: DebugEvent[] = readPersistedEvents();

export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause ? serializeValue(error.cause) : undefined
    };
  }
  return { thrownValue: serializeValue(error) };
}

function serializeValue(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[maximum depth]';
  if (value instanceof Error) return serializeError(value);
  if (value instanceof File) {
    return {
      kind: 'File',
      name: value.name,
      type: value.type,
      size: value.size,
      lastModified: value.lastModified
    };
  }
  if (value instanceof Blob) {
    return { kind: 'Blob', type: value.type, size: value.size };
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item, depth + 1));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeValue(item, depth + 1)])
    );
  }
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function') return `[function ${value.name || 'anonymous'}]`;
  return value;
}

function persistEvents(): void {
  try {
    safeSessionStorage()?.setItem(STORAGE_KEY, JSON.stringify(eventBuffer));
  } catch (error) {
    console.warn('[ConnectedReader][debug] Could not persist diagnostic events', error);
  }
}

export function debugEvent(
  area: string,
  event: string,
  data?: unknown,
  level: DebugLevel = 'info'
): DebugEvent {
  const entry: DebugEvent = {
    id: nextId++,
    timestamp: new Date().toISOString(),
    elapsedMs: Math.round((performance.now() - startedAt) * 10) / 10,
    sessionId,
    level,
    area,
    event,
    data: data === undefined ? undefined : serializeValue(data)
  };
  eventBuffer.push(entry);
  if (eventBuffer.length > MAX_EVENTS) {
    eventBuffer.splice(0, eventBuffer.length - MAX_EVENTS);
  }
  persistEvents();

  const method = level === 'debug' ? 'debug' : level;
  console[method](`[ConnectedReader][${area}] ${event}`, entry.data ?? '');
  return entry;
}

function environmentSnapshot(): Record<string, unknown> {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    online: navigator.onLine,
    cookieEnabled: navigator.cookieEnabled,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemoryGiB: nav.deviceMemory,
    secureContext: window.isSecureContext,
    crossOriginIsolated: window.crossOriginIsolated,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    },
    capabilities: {
      indexedDB: 'indexedDB' in window,
      serviceWorker: 'serviceWorker' in navigator,
      storageManager: 'storage' in navigator,
      persistentStorage: typeof navigator.storage?.persist === 'function',
      randomUUID: typeof globalThis.crypto?.randomUUID === 'function',
      fileArrayBuffer: typeof File.prototype.arrayBuffer === 'function',
      worker: typeof Worker !== 'undefined'
    }
  };
}

function createReport(): DebugReport {
  return {
    generatedAt: new Date().toISOString(),
    sessionId,
    app: {
      mode: import.meta.env.MODE,
      version: '0.1.0',
      url: window.location.href
    },
    environment: environmentSnapshot(),
    events: [...eventBuffer]
  };
}

const api: ConnectedReaderDebugApi = {
  help: () => {
    console.info(
      [
        'Connected Reader debugging commands:',
        'ConnectedReaderDebug.events()      // structured event history',
        'ConnectedReaderDebug.latestError() // most recent error event',
        'ConnectedReaderDebug.report()      // full object report',
        'ConnectedReaderDebug.reportText()  // copy-ready JSON text',
        'await ConnectedReaderDebug.copyReport() // copy JSON to clipboard',
        'ConnectedReaderDebug.print()       // print and return the full report',
        'ConnectedReaderDebug.clear()       // clear this tab\'s diagnostic history'
      ].join('\n')
    );
  },
  events: () => [...eventBuffer],
  report: createReport,
  reportText: () => JSON.stringify(createReport(), null, 2),
  copyReport: async () => {
    const text = JSON.stringify(createReport(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      console.info('[ConnectedReader][debug] Diagnostic report copied to clipboard.');
    } catch (error) {
      console.warn(
        '[ConnectedReader][debug] Clipboard copy failed; returning the report text instead.',
        error
      );
    }
    return text;
  },
  print: () => {
    const report = createReport();
    console.info('[ConnectedReader][debug] Full diagnostic report', report);
    console.table(
      report.events.map(({ id, timestamp, level, area, event, elapsedMs }) => ({
        id,
        timestamp,
        level,
        area,
        event,
        elapsedMs
      }))
    );
    return report;
  },
  latestError: () => [...eventBuffer].reverse().find((entry) => entry.level === 'error'),
  clear: () => {
    eventBuffer.length = 0;
    nextId = 1;
    persistEvents();
    console.info('[ConnectedReader][debug] Diagnostic history cleared.');
  },
  log: (event, data) => {
    debugEvent('manual', event, data, 'info');
  }
};

export function installDebugInstrumentation(): void {
  if (installed) return;
  installed = true;
  window.ConnectedReaderDebug = api;
  window.__CONNECTED_READER_DEBUG__ = api;

  window.addEventListener('error', (event) => {
    debugEvent(
      'global',
      'window-error',
      {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: serializeError(event.error)
      },
      'error'
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    debugEvent(
      'global',
      'unhandled-rejection',
      { reason: serializeError(event.reason) },
      'error'
    );
  });

  debugEvent('app', 'instrumentation-installed', {
    existingEventCount: eventBuffer.length,
    environment: environmentSnapshot()
  });
  api.help();

  if (navigator.storage?.estimate) {
    void navigator.storage
      .estimate()
      .then((estimate) => debugEvent('storage', 'estimate', estimate, 'debug'))
      .catch((error) =>
        debugEvent('storage', 'estimate-failed', serializeError(error), 'warn')
      );
  }
}
