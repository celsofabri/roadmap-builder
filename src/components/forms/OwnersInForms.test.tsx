// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTeamMemberStore } from '@/store/teamMemberStore';
import { EpicForm } from './EpicForm';
import { InitiativeForm } from './InitiativeForm';

const range = { startDate: '2026-01-01', endDate: '2026-12-31' };

beforeEach(() => {
  useTeamMemberStore.setState({
    members: [
      { id: 'm1', workspaceId: 'w', name: 'Ana Souza', createdAt: '', updatedAt: '' },
      { id: 'm2', workspaceId: 'w', name: 'Bruno Lima', createdAt: '', updatedAt: '' },
    ],
  });
});

function renderEpic(initial?: { owners?: string[] }) {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(
    <EpicForm
      initial={initial ? { title: 'Épico', startDate: '2026-02-02', endDate: '2026-03-31', ...initial } : undefined}
      parentRange={range}
      objectiveColor="#2563eb"
      onSubmit={onSubmit}
      onClose={() => {}}
    />,
  );
  return { user, onSubmit };
}

function renderInitiative(initial?: { owners?: string[] }) {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(
    <InitiativeForm
      initial={initial ? { title: 'Iniciativa', startDate: '2026-02-02', endDate: '2026-03-31', ...initial } : undefined}
      parentRange={range}
      onSubmit={onSubmit}
      onClose={() => {}}
    />,
  );
  return { user, onSubmit };
}

describe('EpicForm owners', () => {
  it('has a labelled "Responsáveis" field (accessibility)', () => {
    renderEpic();
    expect(screen.getByLabelText('Responsáveis (opcional)')).toHaveRole('combobox');
  });

  it('saves several owners picked from suggestions, in order (O1)', async () => {
    const { user, onSubmit } = renderEpic();
    await user.type(screen.getByLabelText('Título'), 'Novo épico');
    await user.click(screen.getByLabelText(/Responsáveis/));
    await user.click(screen.getByRole('option', { name: /Ana Souza/ }));
    await user.keyboard('{ArrowDown}'); // picking closes the list; reopen for the next one
    await user.click(screen.getByRole('option', { name: /Bruno Lima/ }));
    await user.click(screen.getByRole('button', { name: 'Criar épico' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].owners).toEqual(['Ana Souza', 'Bruno Lima']);
    expect('owner' in onSubmit.mock.calls[0][0]).toBe(false);
  });

  it('accepts a free-typed name that is not on the team (O3)', async () => {
    const { user, onSubmit } = renderEpic();
    await user.type(screen.getByLabelText('Título'), 'E');
    await user.type(screen.getByLabelText(/Responsáveis/), 'Dani Externo{Enter}');
    await user.click(screen.getByRole('button', { name: 'Criar épico' }));
    expect(onSubmit.mock.calls[0][0].owners).toEqual(['Dani Externo']);
  });

  it('shows the owners of an existing (migrated) epic as chips (O9)', () => {
    renderEpic({ owners: ['Ana Souza'] });
    expect(screen.getByRole('button', { name: 'Remover Ana Souza' })).toBeInTheDocument();
  });

  it('removing one chip keeps the others (O5)', async () => {
    const { user, onSubmit } = renderEpic({ owners: ['Ana Souza', 'Bruno Lima'] });
    await user.click(screen.getByRole('button', { name: 'Remover Ana Souza' }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(onSubmit.mock.calls[0][0].owners).toEqual(['Bruno Lima']);
  });

  it('saves without the field when every chip is removed (O6)', async () => {
    const { user, onSubmit } = renderEpic({ owners: ['Ana Souza'] });
    await user.click(screen.getByRole('button', { name: 'Remover Ana Souza' }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(onSubmit.mock.calls[0][0].owners).toBeUndefined();
  });

  it('Enter inside the owners field does not submit the form (O4)', async () => {
    const { user, onSubmit } = renderEpic();
    await user.type(screen.getByLabelText('Título'), 'E');
    await user.type(screen.getByLabelText(/Responsáveis/), 'Carla{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('saves an uncommitted draft typed before clicking save (blur commits it synchronously)', async () => {
    const { user, onSubmit } = renderEpic({ owners: ['Ana Souza'] });
    await user.type(screen.getByLabelText('Responsáveis (opcional)'), 'Carla');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    // Previously pinned as a loss (blur commit deferred 150ms, cancelled on unmount).
    // The commit now happens on blur itself, before the click that submits.
    expect(onSubmit.mock.calls[0][0].owners).toEqual(['Ana Souza', 'Carla']);
  });
});

describe('InitiativeForm owners', () => {
  it('saves an uncommitted draft typed before clicking save', async () => {
    const { user, onSubmit } = renderInitiative({ owners: ['Ana Souza'] });
    await user.type(screen.getByLabelText('Responsáveis (opcional)'), 'Carla');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(onSubmit.mock.calls[0][0].owners).toEqual(['Ana Souza', 'Carla']);
  });

  it('saves several owners (O2)', async () => {
    const { user, onSubmit } = renderInitiative();
    await user.type(screen.getByLabelText('Título'), 'I');
    const input = screen.getByLabelText('Responsáveis (opcional)');
    await user.type(input, 'Ana Souza,');
    await user.type(input, 'Bruno Lima{Enter}');
    await user.click(screen.getByRole('button', { name: 'Criar iniciativa' }));
    expect(onSubmit.mock.calls[0][0].owners).toEqual(['Ana Souza', 'Bruno Lima']);
  });

  it('ignores duplicates and blanks (O7, O8)', async () => {
    const { user, onSubmit } = renderInitiative({ owners: ['Ana Souza'] });
    const input = screen.getByLabelText('Responsáveis (opcional)');
    await user.type(input, 'ana souza ,');
    await user.type(input, '   ,');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(onSubmit.mock.calls[0][0].owners).toEqual(['Ana Souza']);
  });

  it('prefills chips and removes all on request (O6, O9)', async () => {
    const { user, onSubmit } = renderInitiative({ owners: ['Bruno Lima'] });
    await user.click(screen.getByRole('button', { name: 'Remover Bruno Lima' }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(onSubmit.mock.calls[0][0].owners).toBeUndefined();
  });
});
