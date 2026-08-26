import { endOfMonthISO, startOfMonthISO } from '@/utils/dateUtils';

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
      <div className="flex items-center gap-3">
        <label className="flex-1 text-sm text-slate-600">
          Início
          <input
            type={inputType}
            value={startValue}
            disabled={disabled}
            onChange={(e) => handleStartChange(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label className="flex-1 text-sm text-slate-600">
          Fim
          <input
            type={inputType}
            value={endValue}
            disabled={disabled}
            onChange={(e) => handleEndChange(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
