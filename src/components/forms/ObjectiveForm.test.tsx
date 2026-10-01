// @vitest-environment jsdom
// Characterization tests for the multi-owner field as it behaved inline in ObjectiveForm.
// They were written BEFORE extracting OwnersField (T2) and must keep passing unchanged.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTeamMemberStore } from '@/store/teamMemberStore';
import { ObjectiveForm } from './ObjectiveForm';

function renderForm(initialOwners?: string[]) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(
    <ObjectiveForm
      initial={initialOwners ? { title: 'Meta', owners: initialOwners } : undefined}
      onSubmit={onSubmit}
      onClose={onClose}
    />,
  );
  const input = screen.getByRole('combobox');
  return { user, onSubmit, input: input as HTMLInputElement };
}

function chipRemoveButtons() {
  return screen.queryAllByRole('button', { name: /^Remover / });
}

beforeEach(() => {
  useTeamMemberStore.setState({
    members: [
      { id: 'm1', workspaceId: 'w', name: 'Ana Souza', createdAt: '', updatedAt: '' },
      { id: 'm2', workspaceId: 'w', name: 'Bruno Lima', createdAt: '', updatedAt: '' },
    ],
  });
});

describe('ObjectiveForm owners field (characterization)', () => {
  it('Enter turns the draft into a chip, clears it and does NOT submit the form', async () => {
    const { user, onSubmit, input } = renderForm();
    await user.type(input, 'Dani Externo{Enter}');
    expect(screen.getByRole('button', { name: 'Remover Dani Externo' })).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('comma adds the draft as a chip', async () => {
    const { user, input } = renderForm();
    await user.type(input, 'Carla,');
    expect(screen.getByRole('button', { name: 'Remover Carla' })).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('blur commits a pending draft', async () => {
    const { user, input } = renderForm();
    await user.type(input, 'Carla');
    await user.tab();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remover Carla' })).toBeInTheDocument(),
    );
  });

  it('saves an uncommitted draft typed before clicking save', async () => {
    const { user, onSubmit, input } = renderForm(['Ana Souza']);
    await user.type(input, 'Carla');
    await user.click(screen.getByRole('button', { name: /Salvar|Criar/ }));
    expect(onSubmit.mock.calls[0][0].owners).toEqual(['Ana Souza', 'Carla']);
  });

  it('Backspace on an empty draft removes the last chip', async () => {
    const { user, input } = renderForm(['Ana Souza', 'Bruno Lima']);
    await user.click(input);
    await user.keyboard('{Backspace}');
    expect(chipRemoveButtons().map((b) => b.getAttribute('aria-label'))).toEqual(['Remover Ana Souza']);
  });

  it('Backspace with text in the draft only edits the text', async () => {
    const { user, input } = renderForm(['Ana Souza']);
    await user.type(input, 'ab{Backspace}');
    expect(input).toHaveValue('a');
    expect(chipRemoveButtons()).toHaveLength(1);
  });

  it('ignores a case-insensitive duplicate and clears the draft', async () => {
    const { user, input } = renderForm(['Ana Souza']);
    await user.type(input, 'ana souza {Enter}');
    expect(chipRemoveButtons()).toHaveLength(1);
    expect(input).toHaveValue('');
  });

  it('ignores an empty or whitespace-only draft without error', async () => {
    const { user, input } = renderForm();
    await user.type(input, '   ,');
    expect(chipRemoveButtons()).toHaveLength(0);
    await user.tab();
    await new Promise((resolve) => setTimeout(resolve, 200)); // blur commit is delayed 150ms
    expect(chipRemoveButtons()).toHaveLength(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Enter on an empty draft with no suggestions available adds nothing', async () => {
    useTeamMemberStore.setState({ members: [] });
    const { user, input } = renderForm();
    await user.type(input, '  {Enter}');
    expect(chipRemoveButtons()).toHaveLength(0);
  });

  // Existing behavior worth pinning: with the dropdown open, Enter picks the highlighted option.
  it('Enter with the dropdown open and an empty draft picks the highlighted suggestion', async () => {
    const { user, input } = renderForm();
    await user.click(input);
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Remover Ana Souza' })).toBeInTheDocument();
  });

  it('the remove button of a chip removes only that owner', async () => {
    const { user } = renderForm(['Ana Souza', 'Bruno Lima']);
    await user.click(screen.getByRole('button', { name: 'Remover Ana Souza' }));
    expect(chipRemoveButtons().map((b) => b.getAttribute('aria-label'))).toEqual(['Remover Bruno Lima']);
  });

  it('picking a suggestion adds the member and stops offering it', async () => {
    const { user, input } = renderForm();
    await user.click(input);
    await user.click(screen.getByRole('option', { name: /Ana Souza/ }));
    expect(screen.getByRole('button', { name: 'Remover Ana Souza' })).toBeInTheDocument();
    await user.keyboard('{ArrowDown}'); // reopen the dropdown
    expect(screen.queryByRole('option', { name: /Ana Souza/ })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Bruno Lima/ })).toBeInTheDocument();
  });

  it('submits owners in insertion order, and omits the field when empty', async () => {
    const first = renderForm(['Ana Souza']);
    await first.user.type(first.input, 'Bruno Lima{Enter}');
    await first.user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(first.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ owners: ['Ana Souza', 'Bruno Lima'] }),
    );
  });

  it('submits owners as undefined when there are none', async () => {
    const { user, onSubmit } = renderForm();
    await user.type(screen.getByLabelText('Título'), 'Meta');
    await user.click(screen.getByRole('button', { name: 'Criar objetivo' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].owners).toBeUndefined();
  });
});
