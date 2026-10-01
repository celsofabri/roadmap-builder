// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRoadmap } from '@/test/fixtures';
import { computeFit } from '@/utils/fullscreenFit';
import { rangeSpanBusinessDays } from '@/utils/dateUtils';
import { TimelineSnapshot } from './TimelineSnapshot';

const viewport = { width: 1280, height: 720 };

function mockStageHeight(height: number) {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(height);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1280);
}

describe('TimelineSnapshot', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders every objective, epic and initiative', () => {
    render(<TimelineSnapshot roadmap={makeRoadmap()} showOwners showTodayLine viewport={viewport} />);
    expect(screen.getAllByTestId('snapshot-lane')).toHaveLength(1);
    expect(screen.getAllByTestId('snapshot-epic')).toHaveLength(2);
    expect(screen.getAllByTestId('snapshot-initiative')).toHaveLength(2);
    expect(screen.getByText('Iniciativa')).toBeInTheDocument();
    expect(screen.getByText('Épico 2')).toBeInTheDocument();
  });

  it('F4: is read-only (no buttons, links or button roles)', () => {
    const { container } = render(
      <TimelineSnapshot roadmap={makeRoadmap()} showOwners showTodayLine viewport={viewport} />,
    );
    expect(container.querySelectorAll('button, a, [role="button"], input')).toHaveLength(0);
  });

  it('F14: objective without epics shows the empty message', () => {
    const roadmap = makeRoadmap();
    roadmap.objectives[0].epics = [];
    render(<TimelineSnapshot roadmap={roadmap} showOwners showTodayLine viewport={viewport} />);
    expect(screen.getByText('Nenhum épico neste objetivo.')).toBeInTheDocument();
  });

  it('shows name, period, updated-at date and the status legend in the header', () => {
    render(<TimelineSnapshot roadmap={makeRoadmap()} showOwners showTodayLine viewport={viewport} />);
    expect(screen.getByText('Roadmap de teste')).toBeInTheDocument();
    expect(screen.getByText(/01\/01\/2026 – 31\/12\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Atualizado em 0[12]\/01\/2026/)).toBeInTheDocument();
    expect(screen.getByText('Planejado')).toBeInTheDocument();
  });

  it('data-fit-scale matches computeFit for the measured height', () => {
    mockStageHeight(1440);
    const roadmap = makeRoadmap();
    render(<TimelineSnapshot roadmap={roadmap} showOwners showTodayLine viewport={viewport} />);
    const expected = computeFit({
      viewportW: viewport.width,
      viewportH: viewport.height,
      naturalH: 1440,
      totalDays: rangeSpanBusinessDays(roadmap.period),
    });
    expect(expected.scale).toBeCloseTo(0.5, 5);
    expect(screen.getByTestId('timeline-snapshot')).toHaveAttribute(
      'data-fit-scale',
      expected.scale.toFixed(3),
    );
  });

  it('F11: owners are shown only when showOwners is on', () => {
    const { rerender } = render(
      <TimelineSnapshot roadmap={makeRoadmap()} showOwners showTodayLine viewport={viewport} />,
    );
    expect(screen.getByText('Carla Nunes')).toBeInTheDocument(); // objective chip
    expect(screen.getAllByRole('group', { name: /Responsáveis:/ }).length).toBeGreaterThan(0);
    rerender(
      <TimelineSnapshot roadmap={makeRoadmap()} showOwners={false} showTodayLine viewport={viewport} />,
    );
    expect(screen.queryByText('Carla Nunes')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('group', { name: /Responsáveis:/ })).toHaveLength(0);
  });

  describe('F12: today line', () => {
    it('is drawn when today is inside the period and the toggle is on', () => {
      const roadmap = makeRoadmap({ period: { startDate: '2020-01-01', endDate: '2099-12-31' } });
      render(<TimelineSnapshot roadmap={roadmap} showOwners showTodayLine viewport={viewport} />);
      expect(screen.getByTestId('snapshot-today-line')).toBeInTheDocument();
    });

    it('is hidden when the toggle is off or today is outside the period', () => {
      const inside = makeRoadmap({ period: { startDate: '2020-01-01', endDate: '2099-12-31' } });
      const { rerender } = render(
        <TimelineSnapshot roadmap={inside} showOwners showTodayLine={false} viewport={viewport} />,
      );
      expect(screen.queryByTestId('snapshot-today-line')).not.toBeInTheDocument();
      const outside = makeRoadmap({ period: { startDate: '2001-01-01', endDate: '2001-12-31' } });
      rerender(<TimelineSnapshot roadmap={outside} showOwners showTodayLine viewport={viewport} />);
      expect(screen.queryByTestId('snapshot-today-line')).not.toBeInTheDocument();
    });
  });

  it('forces the monthly ruler (12 cells for a year) and labels each when wide enough', () => {
    render(<TimelineSnapshot roadmap={makeRoadmap()} showOwners showTodayLine viewport={viewport} />);
    expect(screen.getByTitle('jan 2026')).toHaveTextContent('jan 2026');
    expect(screen.getByTitle('dez 2026')).toBeInTheDocument();
  });

  it('works unmeasured (zero viewport) without throwing', () => {
    render(
      <TimelineSnapshot
        roadmap={makeRoadmap()}
        showOwners
        showTodayLine
        viewport={{ width: 0, height: 0 }}
      />,
    );
    expect(screen.getByTestId('timeline-snapshot')).toHaveAttribute('data-fit-scale', '1.000');
  });
});
