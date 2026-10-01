// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TeamMember } from '@/types/roadmap.types';
import { OwnerAvatarStack } from './OwnerAvatarStack';

const members: TeamMember[] = [
  { id: 'm1', workspaceId: 'w', name: 'Ana Souza', photoDataUrl: 'data:image/png;base64,AAAA', createdAt: '', updatedAt: '' },
];
const six = ['Ana Souza', 'Bruno Lima', 'Carla Nunes', 'Dani Externo', 'Edu Reis', 'Fabi Dias'];

describe('OwnerAvatarStack', () => {
  it('renders nothing without owners', () => {
    const { container } = render(<OwnerAvatarStack owners={[]} members={members} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows every owner when there is no max, without a badge', () => {
    render(<OwnerAvatarStack owners={six} members={members} />);
    expect(screen.getAllByTitle(/./)).toHaveLength(6);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('collapses the extras into "+N" when over max (O15)', () => {
    render(<OwnerAvatarStack owners={six} members={members} max={3} />);
    expect(screen.getAllByTitle(/./)).toHaveLength(3);
    expect(screen.getByText('+3')).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not show a badge when owners equal max', () => {
    render(<OwnerAvatarStack owners={six.slice(0, 3)} members={members} max={3} />);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('names the group after ALL owners, including the hidden ones', () => {
    render(<OwnerAvatarStack owners={six} members={members} max={2} />);
    expect(screen.getByRole('group', { name: `Responsáveis: ${six.join(', ')}` })).toBeInTheDocument();
  });

  it('keeps the name on each avatar (title) and uses the member photo when registered (O19)', () => {
    const { container } = render(<OwnerAvatarStack owners={['Ana Souza', 'ana externa']} members={members} />);
    expect(screen.getByTitle('Ana Souza').tagName).toBe('IMG');
    expect(container.querySelector('img')).toHaveAttribute('src', members[0].photoDataUrl);
    expect(screen.getByTitle('ana externa').tagName).toBe('SPAN');
  });

  it('matches photos case-insensitively', () => {
    const { container } = render(<OwnerAvatarStack owners={['ANA SOUZA']} members={members} />);
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('treats max < 1 as 1 so the first owner is always visible', () => {
    render(<OwnerAvatarStack owners={six} members={members} max={0} />);
    expect(screen.getAllByTitle(/./)).toHaveLength(1);
    expect(screen.getByText('+5')).toBeInTheDocument();
  });
});
