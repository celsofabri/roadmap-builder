// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTeamMemberStore } from '@/store/teamMemberStore';
import { Modal } from './Modal';
import { OwnersField } from './OwnersField';

function Harness({ initial = [], onChange }: { initial?: string[]; onChange: (o: string[]) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="f">Responsáveis</label>
      <OwnersField
        id="f"
        value={value}
        onChange={(o) => {
          setValue(o);
          onChange(o);
        }}
        hint="Dica"
      />
    </>
  );
}

// jsdom has no AnimationEvent, so React listens for the webkit-prefixed name; fire both.
function endExitAnimation() {
  const overlay = screen.getByRole('presentation');
  fireEvent(overlay, new Event('animationend', { bubbles: true }));
  fireEvent(overlay, new Event('webkitAnimationEnd', { bubbles: true }));
}

beforeEach(() => {
  useTeamMemberStore.setState({ members: [] });
});

describe('OwnersField', () => {
  it('is reachable through its label and shows the hint and default placeholder', () => {
    render(<Harness onChange={() => {}} />);
    expect(screen.getByLabelText('Responsáveis')).toHaveAttribute('placeholder', 'Nome da pessoa e Enter');
    expect(screen.getByText('Dica')).toBeInTheDocument();
  });

  it('reports the full list through onChange, trimming and keeping order', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    const input = screen.getByLabelText('Responsáveis');
    await user.type(input, ' Ana {Enter}');
    await user.type(input, 'Bruno,');
    await user.type(input, 'ANA{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['Ana', 'Bruno']);
  });

  it('exposes chips as a labelled list and removes by button', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={['Ana', 'Bruno']} onChange={onChange} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Remover Ana' }));
    expect(onChange).toHaveBeenLastCalledWith(['Bruno']);
  });

  it('removing a chip is not undone by the blur commit of a pending draft', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={['Ana']} onChange={onChange} />);
    await user.type(screen.getByLabelText('Responsáveis'), 'Bob');
    await user.click(screen.getByRole('button', { name: 'Remover Ana' }));
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(screen.queryByRole('button', { name: 'Remover Ana' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remover Bob' })).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(['Bob']);
  });

  it('keeps focus on the field input after removing a chip', async () => {
    const user = userEvent.setup();
    render(<Harness initial={['Ana', 'Bruno']} onChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Remover Ana' }));
    expect(screen.getByLabelText('Responsáveis')).toHaveFocus();
  });
  it('does not reopen the suggestion list when focus returns after removing a chip', async () => {
    useTeamMemberStore.setState({ members: [{ id: 'm1', workspaceId: 'w1', name: 'Carla Nunes', createdAt: '', updatedAt: '' }] });
    const user = userEvent.setup();
    render(<Harness initial={['Ana']} onChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Remover Ana' }));
    const input = screen.getByLabelText('Responsáveis');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    // Still opens on real interaction afterwards.
    await user.type(input, 'Car');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('Escape with the list open closes only the list, not the surrounding modal', async () => {
    useTeamMemberStore.setState({ members: [{ id: 'm1', workspaceId: 'w1', name: 'Carla Nunes', createdAt: '', updatedAt: '' }] });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal title="Editar" onClose={onClose}>
        <Harness onChange={() => {}} />
      </Modal>,
    );
    const input = screen.getByLabelText('Responsáveis');
    await user.type(input, 'Car');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    // The modal's exit animation (which triggers onClose) must not have started.
    endExitAnimation();
    expect(onClose).not.toHaveBeenCalled();
    expect(input).toHaveValue('Car');
    // A second Escape (list closed) still closes the modal via the stack.
    await user.keyboard('{Escape}');
    endExitAnimation();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('scrolls the list and the active option into view with block "nearest" (no smooth)', async () => {
    useTeamMemberStore.setState({
      members: [
        { id: 'm1', workspaceId: 'w1', name: 'Carla Nunes', createdAt: '', updatedAt: '' },
        { id: 'm2', workspaceId: 'w1', name: 'Caio Lima', createdAt: '', updatedAt: '' },
      ],
    });
    const calls: Array<{ el: Element; arg: unknown }> = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (this: Element, arg?: boolean | ScrollIntoViewOptions) {
      calls.push({ el: this, arg });
    };
    try {
      const user = userEvent.setup();
      render(<Harness onChange={() => {}} />);
      const input = screen.getByLabelText('Responsáveis');
      await user.type(input, 'Ca');
      const list = screen.getByRole('listbox');
      expect(calls.some((c) => c.el === list && JSON.stringify(c.arg) === '{"block":"nearest"}')).toBe(true);
      expect(calls.some((c) => c.el === input)).toBe(true);
      calls.length = 0;
      await user.keyboard('{ArrowDown}');
      const active = screen.getAllByRole('option')[1];
      expect(calls.some((c) => c.el === active && JSON.stringify(c.arg) === '{"block":"nearest"}')).toBe(true);
      // Hovering does not scroll.
      calls.length = 0;
      await user.hover(screen.getAllByRole('option')[0]);
      expect(calls).toHaveLength(0);
      // Escape still closes only the list.
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });
});
