import {
  addMonths,
  differenceInCalendarDays,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * All dates in this app are "civil" dates (no time-of-day, no timezone).
 * We always parse/format via date-fns using local time so that a stored
 * "2026-06-01" never shifts to a different calendar day.
 */

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromISODate(iso: string): Date {
  return parseISO(iso);
}

export function monthStartISO(date: Date): string {
  return toISODate(startOfMonth(date));
}

export function monthEndISO(date: Date): string {
  return toISODate(endOfMonth(date));
}

/** First day of the month containing the given ISO date. */
export function startOfMonthISO(iso: string): string {
  return monthStartISO(fromISODate(iso));
}

/** Last day of the month containing the given ISO date. */
export function endOfMonthISO(iso: string): string {
  return monthEndISO(fromISODate(iso));
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

/** Whether `inner` is fully contained within `outer` (inclusive). */
export function isRangeWithin(inner: DateRange, outer: DateRange): boolean {
  return inner.startDate >= outer.startDate && inner.endDate <= outer.endDate;
}

/** List of month-start Dates spanning the period, inclusive. */
export function getMonthsInPeriod(period: DateRange): Date[] {
  return eachMonthOfInterval({
    start: fromISODate(period.startDate),
    end: fromISODate(period.endDate),
  });
}

/** List of week-start Dates (Monday) spanning the period, inclusive. */
export function getWeeksInPeriod(period: DateRange): Date[] {
  return eachWeekOfInterval(
    {
      start: fromISODate(period.startDate),
      end: fromISODate(period.endDate),
    },
    { weekStartsOn: 1 },
  );
}

export function addMonthsISO(iso: string, amount: number): string {
  return toISODate(addMonths(fromISODate(iso), amount));
}

export function startOfWeekISO(iso: string): string {
  return toISODate(startOfWeek(fromISODate(iso), { weekStartsOn: 1 }));
}

/** Number of calendar days between two ISO dates (b - a). */
export function diffInDaysISO(a: string, b: string): number {
  return differenceInCalendarDays(fromISODate(b), fromISODate(a));
}

export function formatMonthLabel(date: Date): string {
  return format(date, 'MMM yyyy', { locale: ptBR });
}

export function formatDateLabel(iso: string): string {
  return format(fromISODate(iso), "d 'de' MMM 'de' yyyy", { locale: ptBR });
}

export function formatShortDateLabel(iso: string): string {
  return format(fromISODate(iso), 'dd/MM/yyyy', { locale: ptBR });
}
