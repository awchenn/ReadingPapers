import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { OnProgressParameters } from 'pdfjs-dist';
import { ConnectedView } from './components/ConnectedView';
import { PointComposer } from './components/PointComposer';
import { PointsView } from './components/PointsView';
import { debugEvent, serializeError } from './debug/instrumentation';
import type { AppView } from './domain/types';
import { pdfImportErrorMessage } from './pdf/errors';
import { useReaderStore } from './store/useReaderStore';

const PdfReader = lazy(async () => ({
  default: (await import('./components/PdfReader')).PdfReader
}));

const navItems: Array<{ id: AppView; label: string }> = [
  { id: 'reader', label: 'Reader' },
  { id: 'points', label: 'Points' },
  { id: 'connected', label: 'Connected' }
];

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [importError, setImportError] = useState('');
  const [debugCopyStatus, setDebugCopyStatus] = useState('Copy debug report');
  const {
    paper,
    points,
    connections,
    activeView,
    activePointId,
    targetPageIndex,
    loading,
    error,
    hydrate,
    importPaper,
    createPoint,
    deletePoint,
    createConnection,
    setActiveView,
    focusPoint,
    jumpToPoint
  } = useReaderStore();

  useEffect(() => {
    debugEvent('app', 'hydrate-requested', undefined, 'debug');
    void hydrate();
  }, [hydrate]);

  const handleImport = async (file?: File) => {
    const started = performance.now();
    let phase = 'file-selection';
    let byteLength: number | undefined;
    let headerHex: string | undefined;
    const fileMetadata = file
      ? {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          lastModifiedIso: new Date(file.lastModified).toISOString()
        }
      : undefined;

    debugEvent('pdf-import', 'started', { file: fileMetadata });
    if (!file) {
      debugEvent('pdf-import', 'no-file-selected', undefined, 'warn');
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      debugEvent('pdf-import', 'rejected-by-file-type', { file: fileMetadata }, 'warn');
      setImportError('Choose a PDF file.');
      return;
    }
    if (
      paper &&
      !window.confirm(
        'Replace the active paper? Its locally saved points and connections will be deleted.'
      )
    ) {
      debugEvent('pdf-import', 'replacement-cancelled', { file: fileMetadata });
      return;
    }
    setImportError('');
    try {
      // Read while the browser's file-picker handle is still live. Some embedded
      // browsers revoke lazy file access as soon as the input is cleared.
      phase = 'read-file-bytes';
      const readStarted = performance.now();
      debugEvent('pdf-import', 'file-read-start', { file: fileMetadata }, 'debug');
      const data = await file.arrayBuffer();
      byteLength = data.byteLength;
      const header = new Uint8Array(data.slice(0, 16));
      headerHex = Array.from(header)
        .map((value) => value.toString(16).padStart(2, '0'))
        .join(' ');
      const headerText = Array.from(header)
        .map((value) => (value >= 32 && value <= 126 ? String.fromCharCode(value) : '.'))
        .join('');
      debugEvent('pdf-import', 'file-read-complete', {
        declaredSize: file.size,
        byteLength,
        sizeMatches: file.size === byteLength,
        headerHex,
        headerText,
        pdfHeaderPresent: headerText.startsWith('%PDF-'),
        durationMs: Math.round((performance.now() - readStarted) * 10) / 10
      });

      phase = 'load-pdfjs-module';
      const moduleStarted = performance.now();
      debugEvent('pdf-import', 'pdfjs-module-load-start', undefined, 'debug');
      const { getDocument } = await import('./pdf/pdfjs');
      const { GlobalWorkerOptions } = await import('pdfjs-dist');
      debugEvent('pdf-import', 'pdfjs-module-load-complete', {
        workerSrc: GlobalWorkerOptions.workerSrc,
        durationMs: Math.round((performance.now() - moduleStarted) * 10) / 10
      });

      phase = 'parse-pdf';
      const task = getDocument({ data });
      debugEvent('pdf-import', 'loading-task-created', {
        workerSrc: GlobalWorkerOptions.workerSrc
      });
      task.onProgress = ({ loaded, total }: OnProgressParameters) => {
        debugEvent(
          'pdf-import',
          'loading-progress',
          {
            loaded,
            total,
            percent: total ? Math.round((loaded / total) * 1000) / 10 : undefined
          },
          'debug'
        );
      };
      task.onPassword = (_updatePassword: (password: string) => void, reason: number) => {
        debugEvent('pdf-import', 'password-requested', { reason }, 'warn');
      };
      const pdf = await task.promise;
      debugEvent('pdf-import', 'document-opened', {
        numPages: pdf.numPages,
        fingerprints: pdf.fingerprints,
        loadingTaskDestroyed: task.destroyed
      });

      phase = 'persist-paper';
      const persistenceStarted = performance.now();
      debugEvent('pdf-import', 'persistence-start', {
        file: fileMetadata,
        pageCount: pdf.numPages
      });
      await importPaper(file, pdf.numPages);
      debugEvent('pdf-import', 'persistence-complete', {
        durationMs: Math.round((performance.now() - persistenceStarted) * 10) / 10
      });

      phase = 'destroy-validation-task';
      await task.destroy();
      debugEvent('pdf-import', 'validation-task-destroyed', undefined, 'debug');
      setImportError('');
      debugEvent('pdf-import', 'completed', {
        file: fileMetadata,
        byteLength,
        durationMs: Math.round((performance.now() - started) * 10) / 10
      });
    } catch (error) {
      console.error('PDF import failed', error);
      debugEvent(
        'pdf-import',
        'failed',
        {
          phase,
          file: fileMetadata,
          byteLength,
          headerHex,
          durationMs: Math.round((performance.now() - started) * 10) / 10,
          error: serializeError(error)
        },
        'error'
      );
      setImportError(pdfImportErrorMessage(error));
    }
  };

  const handleLoaded = useCallback(() => undefined, []);

  if (loading) {
    return <main className="loading-screen">Opening your local workspace…</main>;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">C</span>
          <div>
            <strong>Connected Reader</strong>
            <span>{paper?.filename ?? 'Local-first PDF notes'}</span>
          </div>
        </div>
        <button type="button" className="quiet-button" onClick={() => inputRef.current?.click()}>
          {paper ? 'Replace paper' : 'Import PDF'}
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            debugEvent('pdf-import', 'input-change', {
              fileCount: input.files?.length ?? 0,
              file
            });
            void handleImport(file).finally(() => {
              input.value = '';
              debugEvent('pdf-import', 'input-cleared-after-import', undefined, 'debug');
            });
          }}
        />
      </header>

      {(error || importError) && (
        <div className="error-banner" role="alert">
          <span>{error || importError}</span>
          <button
            type="button"
            onClick={() => {
              void window.ConnectedReaderDebug.copyReport().then(() => {
                setDebugCopyStatus('Copied');
                window.setTimeout(() => setDebugCopyStatus('Copy debug report'), 2000);
              });
            }}
          >
            {debugCopyStatus}
          </button>
        </div>
      )}

      {!paper ? (
        <main className="welcome-view">
          <p className="eyebrow">Read closely. Keep the trail.</p>
          <h1>Ideas stay connected to their source.</h1>
          <p>
            Import one text-based PDF. Your paper, points, and connections stay in this browser.
          </p>
          <button type="button" className="primary-button" onClick={() => inputRef.current?.click()}>
            Import your first PDF
          </button>
          <p className="privacy-note">No upload. No account. No automatic interpretation.</p>
        </main>
      ) : (
        <>
          <nav className="desktop-nav" aria-label="Workspace views">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={activeView === item.id ? 'page' : undefined}
                onClick={() => setActiveView(item.id)}
              >
                {item.label}
                {item.id === 'points' && <span>{points.length}</span>}
              </button>
            ))}
          </nav>

          <main className="workspace">
            {activeView === 'reader' && (
              <div className="reader-view">
                <Suspense fallback={<p className="reader-status">Opening reader…</p>}>
                  <PdfReader
                    paper={paper}
                    targetPageIndex={targetPageIndex}
                    onPageChange={setCurrentPageIndex}
                    onLoaded={handleLoaded}
                  />
                </Suspense>
                <button type="button" className="floating-action" onClick={() => setComposerOpen(true)}>
                  Create point
                </button>
              </div>
            )}
            {activeView === 'points' && (
              <PointsView
                points={points}
                onFocus={(id) => focusPoint(id)}
                onJump={jumpToPoint}
                onDelete={deletePoint}
              />
            )}
            {activeView === 'connected' && (
              <ConnectedView
                points={points}
                connections={connections}
                activePointId={activePointId}
                onFocus={(id) => focusPoint(id)}
                onJump={jumpToPoint}
                onConnect={createConnection}
              />
            )}
          </main>

          <nav className="mobile-nav" aria-label="Workspace views">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={activeView === item.id ? 'page' : undefined}
                onClick={() => setActiveView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </>
      )}

      {composerOpen && paper && (
        <PointComposer
          pageIndex={currentPageIndex}
          onClose={() => setComposerOpen(false)}
          onSave={async (draft) => {
            await createPoint(draft);
          }}
        />
      )}
    </div>
  );
}
