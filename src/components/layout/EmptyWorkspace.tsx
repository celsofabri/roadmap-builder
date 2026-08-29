import { useRoadmapStore } from '@/store/roadmapStore';
import { MapIcon } from '@/components/shared/Icon';
import styles from './EmptyWorkspace.module.scss';

export function EmptyWorkspace() {
  const roadmaps = useRoadmapStore((s) => s.roadmaps);
  const hasRoadmaps = roadmaps.length > 0;

  return (
    <div className={styles.wrap}>
      <span className={styles.mark}>
        <MapIcon size={26} />
      </span>
      <h1 className={styles.title}>
        {hasRoadmaps ? 'Selecione um roadmap' : 'Comece pelo primeiro roadmap'}
      </h1>
      <p className={styles.subtitle}>
        {hasRoadmaps
          ? 'Escolha um roadmap no menu lateral para visualizar objetivos, épicos e iniciativas na lista ou na timeline.'
          : 'Crie um roadmap no menu lateral para organizar objetivos, épicos e iniciativas do seu time em uma timeline visual.'}
      </p>
      <p className={styles.hint}>
        Dica: arraste as barras na timeline para ajustar datas e mover itens entre objetivos.
      </p>
    </div>
  );
}
