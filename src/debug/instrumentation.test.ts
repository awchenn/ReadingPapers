import { beforeEach, describe, expect, it } from 'vitest';
import {
  debugEvent,
  installDebugInstrumentation,
  serializeError
} from './instrumentation';

describe('debug instrumentation', () => {
  beforeEach(() => {
    installDebugInstrumentation();
    window.ConnectedReaderDebug.clear();
  });

  it('records structured, copy-ready events', () => {
    debugEvent('pdf-import', 'bytes-read', { byteLength: 839275 });

    const report = window.ConnectedReaderDebug.report();
    expect(report.events).toHaveLength(1);
    expect(report.events[0]).toMatchObject({
      area: 'pdf-import',
      event: 'bytes-read',
      data: { byteLength: 839275 }
    });
    expect(JSON.parse(window.ConnectedReaderDebug.reportText()).events).toHaveLength(1);
  });

  it('serializes error names, messages, and stacks', () => {
    const serialized = serializeError(new TypeError('bad PDF worker'));
    expect(serialized).toMatchObject({ name: 'TypeError', message: 'bad PDF worker' });
    expect(serialized.stack).toEqual(expect.any(String));
  });

  it('keeps the latest error easy to retrieve', () => {
    debugEvent('db', 'open', undefined, 'info');
    debugEvent('pdf-import', 'failed', { name: 'InvalidPDFException' }, 'error');
    expect(window.ConnectedReaderDebug.latestError()?.event).toBe('failed');
  });
});
