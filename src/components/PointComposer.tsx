import { useState } from 'react';

type PointComposerProps = {
  pageIndex: number;
  onSave: (draft: {
    title: string;
    note?: string;
    excerpt: string;
    pageIndex: number;
    sourceSummary: string;
  }) => Promise<void>;
  onClose: () => void;
};

export function PointComposer({ pageIndex, onSave, onClose }: PointComposerProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [sourceSummary, setSourceSummary] = useState(`Page ${pageIndex + 1} — Text`);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Add a short general-idea title.');
      return;
    }
    await onSave({ title, note, excerpt, pageIndex, sourceSummary });
    onClose();
  };

  return (
    <div className="sheet-backdrop" role="presentation">
      <form className="point-sheet" onSubmit={submit} aria-label="Create point">
        <div className="sheet-heading">
          <div>
            <p className="eyebrow">Source-linked point</p>
            <h2>Capture the idea</h2>
          </div>
          <button type="button" className="quiet-button" onClick={onClose}>
            Close
          </button>
        </div>
        <label>
          General-idea title
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What does this passage mean to you?"
          />
        </label>
        <label>
          Source excerpt
          <textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="Paste selected PDF text for this first app slice."
            rows={3}
          />
        </label>
        <label>
          Note <span className="optional">optional</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
          />
        </label>
        <label>
          Source description
          <input
            value={sourceSummary}
            onChange={(event) => setSourceSummary(event.target.value)}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="primary-button">
          Save point
        </button>
      </form>
    </div>
  );
}
