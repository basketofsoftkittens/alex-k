import moment, { Duration, Moment } from 'moment';

export function formatForApi(at: Date | Moment): string {
  return moment(at).format('DDMMMYYYY');
}

export function formatForDisplay(at: Date | Moment): string {
  return moment(at).format('YYYY.MM.DD');
}

export function parseFromApi(dateStr: string): Moment {
  return moment(dateStr, 'DDMMMYYYY').startOf('day');
}

export function parseFromDisplay(dateStr?: string): Moment | undefined {
  if (!dateStr) {
    return;
  }
  try {
    const m = moment(dateStr, 'YYYY.MM.DD').startOf('day');
    if (m.isValid()) {
      return m;
    }
  } catch (_e) {
    return;
  }
}

export function formatDuration(duration: Duration): string {
  const hours = Math.floor(duration.asHours());
  const minsStr = `${duration.minutes()}m`;
  if (hours > 0) {
    return `${hours}h${minsStr}`;
  }
  return minsStr;
}

export function sumDurations(durations: Duration[]): Duration {
  const total = moment.duration(0, 'seconds');
  durations.forEach(duration => total.add(duration));
  return total;
}
