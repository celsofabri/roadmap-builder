// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeRoadmap } from '@/test/fixtures';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useTeamMemberStore } from '@/store/teamMemberStore';
import type { Epic, Initiative } from '@/types/roadmap.types';
import { EpicBar } from './EpicBar';
import { InitiativeBar } from './InitiativeBar';
import { RoadmapDetail } from './RoadmapDetail';

const six = ['Ana Souza', 'Bruno Lima', 'Carla Nunes', 'Dani Externo', 'Edu Reis', 'Fabi Dias'];

const epic = (owners?: string[]): Epic => ({
  id: 'e1',
  title: 'Épico X',
  startDate: '2026-01-05',
  endDate: '2026-03-31',
  status: 'planned',
  owners,
  initiatives: [],
});
const initiative = (owners?: string[]): Initiative => ({
  id: 'i1',
  title: 'Iniciativa Y',
  startDate: '2026-01-05',
  endDate: '2026-02-13',
  owners,
});

function renderEpicBar(owners: string[] | undefined, showOwner = true) {
  render(
    <EpicBar
      epic={epic(owners)}
      objectiveId="o1"
      color="#2563eb"
      showOwner={showOwner}
      dayWidth={10}
      snapDays={1}
      periodStart="2026-01-01"
      onClick={() => {}}
    />,
  );
  return screen.getByRole('button', { name: /Épico X/ });
}

function renderInitiativeBar(owners: string[] | undefined, showOwner = true) {
  render(
    <InitiativeBar
      initiative={initiative(owners)}
      epicId="e1"
      color="#93c5fd"
      showOwner={showOwner}
      dayWidth={10}
      snapDays={1}
      periodStart="2026-01-01"
      top={0}
      onClick={() => {}}
    />,
  );
  return screen.getByRole('button', { name: /Iniciativa Y/ });
}

beforeEach(() => {
  localStorage.clear();
  useTeamMemberStore.setState({
    members: [
      { id: 'm1', workspaceId: 'w', name: 'Ana Souza', photoDataUrl: 'data:image/png;base64,AAAA', createdAt: '', updatedAt: '' },
      { id: 'm2', workspaceId: 'w', name: 'Bruno Lima', photoDataUrl: 'data:image/png;base64,BBBB', createdAt: '', updatedAt: '' },
    ],
  });
});

describe('EpicBar owners', () => {
  it('shows at most 3 avatars plus "+3" for 6 owners, and lists all in the tooltip (O15)', () => {
    const bar = renderEpicBar(six);
    expect(within(bar).getAllByTitle(/./)).toHaveLength(3);
    expect(within(bar).getByText('+3')).toBeInTheDocument();
    expect(bar).toHaveAttribute('title', expect.stringContaining(`Responsáveis: ${six.join(', ')}`));
    expect(within(bar).getByText('Épico X')).toBeInTheDocument();
  });

  it('single owner: one avatar, "Responsável: X" tooltip (matches previous behavior)', () => {
    const bar = renderEpicBar(['Ana Souza']);
    expect(within(bar).getAllByTitle(/./)).toHaveLength(1);
    expect(within(bar).queryByText(/^\+/)).not.toBeInTheDocument();
    expect(bar).toHaveAttribute('title', expect.stringContaining('Responsável: Ana Souza'));
  });

  it('no owners: no avatar and no owner line in the tooltip (O6)', () => {
    const bar = renderEpicBar(undefined);
    expect(within(bar).queryAllByTitle(/./)).toHaveLength(0);
    expect(bar.getAttribute('title')).not.toMatch(/Responsáve/);
  });

  it('showOwner=false hides avatars but keeps the tooltip info (O14)', () => {
    const bar = renderEpicBar(['Ana Souza', 'Bruno Lima'], false);
    expect(within(bar).queryAllByTitle(/./)).toHaveLength(0);
  });

  it('uses each member photo and falls back to initials for unknown names (O18, O19)', () => {
    const bar = renderEpicBar(['Ana Souza', 'Bruno Lima', 'Pessoa Removida']);
    expect(bar.querySelectorAll('img')).toHaveLength(2);
    expect(within(bar).getByTitle('Pessoa Removida').tagName).toBe('SPAN');
  });
});

describe('InitiativeBar owners', () => {
  it('shows at most 2 avatars plus "+N" and the full list in the tooltip (O15)', () => {
    const bar = renderInitiativeBar(six.slice(0, 5));
    expect(within(bar).getAllByTitle(/./)).toHaveLength(2);
    expect(within(bar).getByText('+3')).toBeInTheDocument();
    expect(bar).toHaveAttribute('title', expect.stringContaining(`Responsáveis: ${six.slice(0, 5).join(', ')}`));
  });

  it('hides avatars when showOwner is off (O14)', () => {
    const bar = renderInitiativeBar(['Ana Souza'], false);
    expect(within(bar).queryAllByTitle(/./)).toHaveLength(0);
  });
});

describe('RoadmapDetail list view', () => {
  function renderDetail() {
    const roadmap = makeRoadmap();
    roadmap.objectives[0].epics[0].owners = six.slice(0, 4);
    roadmap.objectives[0].epics[0].initiatives[0].owners = six.slice(0, 4);
    useRoadmapStore.setState({ activeRoadmap: roadmap });
    render(<RoadmapDetail />);
    return userEvent.setup();
  }

  it('lists every owner of epics and initiatives, in order, with accessible names (O17)', async () => {
    const user = renderDetail();
    await user.click(screen.getByRole('tab', { name: /Lista/ }));
    const groups = screen.getAllByRole('group', { name: `Responsáveis: ${six.slice(0, 4).join(', ')}` });
    // 1 epic + 1 initiative in the list view (the timeline bars hide theirs inside buttons).
    const inList = groups.filter((g) => g.closest('button') === null);
    expect(inList).toHaveLength(2);
    for (const group of inList) {
      expect(within(group).getAllByTitle(/./).map((el) => el.getAttribute('title'))).toEqual(six.slice(0, 4));
      expect(within(group).queryByText(/^\+/)).not.toBeInTheDocument();
    }
  });

  it('the "Responsáveis" toggle hides every owner avatar and remembers the choice (O14)', async () => {
    const user = renderDetail();
    await user.click(screen.getByRole('tab', { name: /Lista/ }));
    const toggle = screen.getByRole('button', { name: /Responsáveis/ });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryAllByRole('group', { name: /^Responsáveis:/ })).toHaveLength(0);
    expect(localStorage.getItem('roadmap-builder:show-owners')).toBe('0');
  });
});
