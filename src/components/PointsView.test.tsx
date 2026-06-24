import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PointsView } from './PointsView';
import type { Point } from '../domain/types';

const points: Point[] = [
  {
    id: 'point-1',
    paperId: 'paper-1',
    title: 'Radical pathway',
    note: 'Mechanistic proposal',
    anchor: { kind: 'text', pageIndex: 2, rects: [], exact: 'A radical intermediate is proposed.', prefix: '', suffix: '' },
    sourceSummary: 'Page 3 — Discussion',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

describe('PointsView', () => {
  it('filters by source text and exposes source navigation', async () => {
    const user = userEvent.setup();
    const onJump = vi.fn();
    render(<PointsView points={points} onFocus={vi.fn()} onJump={onJump} onDelete={vi.fn()} />);

    await user.type(screen.getByRole('searchbox'), 'intermediate');
    expect(screen.getByText('Radical pathway')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Jump to source' }));
    expect(onJump).toHaveBeenCalledWith(points[0]);
  });

  it('shows a useful empty state', () => {
    render(<PointsView points={[]} onFocus={vi.fn()} onJump={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('No points yet')).toBeInTheDocument();
  });
});
