import { endOfMonthISO, startOfMonthISO } from '@/utils/dateUtils';
import styles from './DateRangePicker.module.scss';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  /** 'month' picks whole calendar months (used for roadmap period). 'day' picks specific days (epics/initiatives). */
  mode?: 'day' | 'month';
  error?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  mode = 'day',
  error,
  disabled,
}: DateRangePickerProps) {
  const inputType = mode === 'month' ? 'month' : 'date';
  const startValue = mode === 'month' ? startDate.slice(0, 7) : startDate;
  const endValue = mode === 'month' ? endDate.slice(0, 7) : endDate;

  function handleStartChange(value: string) {
    if (!value) return;
    const nextStart = mode === 'month' ? startOfMonthISO(`${value}-01`) : value;
    onChange({ startDate: nextStart, endDate });
  }

  function handleEndChange(value: string) {
    if (!value) return;
    const nextEnd = mode === 'month' ? endOfMonthISO(`${value}-01`) : value;
    onChange({ startDate, endDate: nextEnd });
  }

  return (
    <div>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Início</span>
          <input
            type={inputType}
            value={startValue}
            disabled={disabled}
            onChange={(e) => handleStartChange(e.target.value)}
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Fim</span>
          <input
            type={inputType}
            value={endValue}
            disabled={disabled}
            onChange={(e) => handleEndChange(e.target.value)}
            className={styles.input}
          />
        </label>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
