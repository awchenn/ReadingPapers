import { useEffect, useRef, useState } from 'react';
import {
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
  type OnProgressParameters,
  type RenderTask
} from 'pdfjs-dist';
import { debugEvent, serializeError } from '../debug/instrumentation';
import type { Paper } from '../domain/types';
import { getDocument } from '../pdf/pdfjs';

type PdfReaderProps = {
  paper: Paper;
  targetPageIndex: number;
  onPageChange: (pageIndex: number) => void;
  onLoaded: (pageCount: number) => void;
};

export function PdfReader({
  paper,
  targetPageIndex,
  onPageChange,
  onLoaded
}: PdfReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [documentProxy, setDocumentProxy] = useState<PDFDocumentProxy | null>(null);
  const [pageIndex, setPageIndex] = useState(targetPageIndex);
  const [status, setStatus] = useState('Loading paper…');

  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | undefined;
    const started = performance.now();
    debugEvent('pdf-renderer', 'document-load-start', {
      paperId: paper.id,
      filename: paper.filename,
      declaredBytes: paper.byteLength,
      blobSize: paper.pdfBlob.size,
      blobType: paper.pdfBlob.type
    });
    void paper.pdfBlob
      .arrayBuffer()
      .then((data) => {
        debugEvent('pdf-renderer', 'blob-read-complete', {
          paperId: paper.id,
          byteLength: data.byteLength,
          sizeMatches: data.byteLength === paper.byteLength
        });
        task = getDocument({ data });
        task.onProgress = ({ loaded, total }: OnProgressParameters) => {
          debugEvent('pdf-renderer', 'document-load-progress', {
            paperId: paper.id,
            loaded,
            total,
            percent: total ? Math.round((loaded / total) * 1000) / 10 : undefined
          }, 'debug');
        };
        return task.promise;
      })
      .then((pdf: PDFDocumentProxy) => {
        if (cancelled) return;
        setDocumentProxy(pdf);
        onLoaded(pdf.numPages);
        setStatus('');
        debugEvent('pdf-renderer', 'document-load-complete', {
          paperId: paper.id,
          numPages: pdf.numPages,
          fingerprints: pdf.fingerprints,
          durationMs: Math.round((performance.now() - started) * 10) / 10
        });
      })
      .catch((error) => {
        debugEvent('pdf-renderer', 'document-load-failed', {
          paperId: paper.id,
          cancelled,
          error: serializeError(error),
          durationMs: Math.round((performance.now() - started) * 10) / 10
        }, 'error');
        if (!cancelled) setStatus('This PDF could not be rendered.');
      });
    return () => {
      cancelled = true;
      debugEvent('pdf-renderer', 'document-load-cleanup', {
        paperId: paper.id,
        taskCreated: Boolean(task)
      }, 'debug');
      void task?.destroy();
    };
  }, [paper.id, paper.pdfBlob, onLoaded]);

  useEffect(() => {
    setPageIndex(targetPageIndex);
    onPageChange(targetPageIndex);
    debugEvent('pdf-renderer', 'target-page-updated', {
      paperId: paper.id,
      targetPageIndex
    }, 'debug');
  }, [paper.id, targetPageIndex, onPageChange]);

  useEffect(() => {
    if (!documentProxy || !canvasRef.current) return;
    let cancelled = false;
    let renderTask: RenderTask | undefined;
    const renderStarted = performance.now();
    debugEvent('pdf-renderer', 'page-render-start', {
      paperId: paper.id,
      pageIndex,
      pageNumber: pageIndex + 1
    }, 'debug');

    void documentProxy.getPage(pageIndex + 1).then((page) => {
      if (cancelled || !canvasRef.current) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const availableWidth = Math.min(920, window.innerWidth - 40);
      const viewport = page.getViewport({
        scale: Math.max(0.5, availableWidth / baseViewport.width)
      });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      debugEvent('pdf-renderer', 'page-render-geometry', {
        paperId: paper.id,
        pageIndex,
        availableWidth,
        baseWidth: baseViewport.width,
        baseHeight: baseViewport.height,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        outputScale: ratio,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      }, 'debug');
      renderTask = page.render({ canvas, canvasContext: context, viewport });
      return renderTask.promise;
    }).then(() => {
      if (!cancelled) {
        debugEvent('pdf-renderer', 'page-render-complete', {
          paperId: paper.id,
          pageIndex,
          durationMs: Math.round((performance.now() - renderStarted) * 10) / 10
        });
      }
    }).catch((error: unknown) => {
      if (
        !cancelled &&
        (!(error instanceof Error) || error.name !== 'RenderingCancelledException')
      ) {
        debugEvent('pdf-renderer', 'page-render-failed', {
          paperId: paper.id,
          pageIndex,
          error: serializeError(error),
          durationMs: Math.round((performance.now() - renderStarted) * 10) / 10
        }, 'error');
        setStatus('This page could not be rendered.');
      } else {
        debugEvent('pdf-renderer', 'page-render-cancelled', {
          paperId: paper.id,
          pageIndex
        }, 'debug');
      }
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [documentProxy, pageIndex, paper.id]);

  const move = (next: number) => {
    debugEvent('pdf-renderer', 'page-navigation', {
      paperId: paper.id,
      fromPageIndex: pageIndex,
      toPageIndex: next
    });
    setPageIndex(next);
    onPageChange(next);
  };

  return (
    <section className="pdf-reader" aria-label="PDF reader">
      <div className="pdf-toolbar">
        <button
          type="button"
          onClick={() => move(pageIndex - 1)}
          disabled={pageIndex === 0}
        >
          Previous
        </button>
        <span>
          Page {pageIndex + 1} of {(documentProxy?.numPages ?? paper.pageCount) || '—'}
        </span>
        <button
          type="button"
          onClick={() => move(pageIndex + 1)}
          disabled={!documentProxy || pageIndex + 1 >= documentProxy.numPages}
        >
          Next
        </button>
      </div>
      {status && <p className="reader-status">{status}</p>}
      <div className="canvas-stage">
        <canvas ref={canvasRef} aria-label={`Page ${pageIndex + 1}`} />
      </div>
    </section>
  );
}
