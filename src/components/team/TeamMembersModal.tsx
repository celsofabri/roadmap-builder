import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { OwnerAvatar } from '@/components/shared/OwnerAvatar';
import { TeamMemberForm } from '@/components/team/TeamMemberForm';
import { useTeamMemberStore } from '@/store/teamMemberStore';
import { PencilIcon, PlusIcon, TrashIcon } from '@/components/shared/Icon';
import sharedStyles from '@/styles/shared.module.scss';
import styles from './TeamMembersModal.module.scss';

interface TeamMembersModalProps {
  workspaceName: string;
  onClose: () => void;
}

type View = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; id: string };

export function TeamMembersModal({ workspaceName, onClose }: TeamMembersModalProps) {
  const members = useTeamMemberStore((s) => s.members);
  const createMember = useTeamMemberStore((s) => s.createMember);
  const updateMember = useTeamMemberStore((s) => s.updateMember);
  const deleteMember = useTeamMemberStore((s) => s.deleteMember);

  const [view, setView] = useState<View>({ mode: 'list' });
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const editingMember = view.mode === 'edit' ? members.find((m) => m.id === view.id) : undefined;

  return (
    <Modal
      title={
        view.mode === 'list'
          ? `Time — ${workspaceName}`
          : view.mode === 'create'
            ? 'Novo responsável'
            : 'Editar responsável'
      }
      onClose={onClose}
    >
      {view.mode === 'list' ? (
        <div className={styles.wrap}>
          <p className={styles.hint}>
            Cadastre aqui as pessoas do time. Elas ficam disponíveis pra escolher como
            responsáveis em objetivos, épicos e iniciativas, sem precisar digitar o nome toda vez.
          </p>

          {members.length === 0 ? (
            <p className={styles.empty}>Nenhum responsável cadastrado ainda.</p>
          ) : (
            <ul className={styles.list}>
              {members.map((member) => (
                <li key={member.id} className={styles.item}>
                  <OwnerAvatar name={member.name} photoDataUrl={member.photoDataUrl} size={32} />
                  <span className={styles.itemName}>{member.name}</span>
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={sharedStyles.iconButton}
                      onClick={() => setView({ mode: 'edit', id: member.id })}
                      aria-label={`Editar ${member.name}`}
                    >
                      <PencilIcon size={14} />
                    </button>
                    <button
                      type="button"
                      className={sharedStyles.iconButtonDanger}
                      onClick={() => setPendingDelete({ id: member.id, name: member.name })}
                      aria-label={`Remover ${member.name}`}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className={styles.addButton}
            onClick={() => setView({ mode: 'create' })}
          >
            <PlusIcon size={14} />
            Adicionar responsável
          </button>
        </div>
      ) : (
        <TeamMemberForm
          initial={editingMember}
          submitLabel={view.mode === 'create' ? 'Adicionar responsável' : 'Salvar alterações'}
          onCancel={() => setView({ mode: 'list' })}
          onSubmit={(input) => {
            if (view.mode === 'edit') {
              updateMember(view.id, input);
            } else {
              createMember(input);
            }
            setView({ mode: 'list' });
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Remover responsável"
          message={`"${pendingDelete.name}" será removido do time. Objetivos, épicos e iniciativas que já apontam pra essa pessoa continuam com o nome, só deixam de mostrar a foto e de sugerir esse nome ao digitar.`}
          confirmLabel="Remover"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteMember(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </Modal>
  );
}
