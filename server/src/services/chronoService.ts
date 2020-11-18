import moment, { Moment, Duration } from 'moment';

export function formatForApi(at: Date | Moment): string {
  return moment(at).format('DDMMMYYYY');
}

export function formatForDisplay(at: Date | Moment): string {
  return moment(at).format('YYYY.MM.DD');
}

export function parseFromApi(dateStr?: string): Moment | undefined {
  if (dateStr) {
    const m = moment(dateStr, 'DDMMMYYYY').startOf('day');
    if (!m.isValid()) {
      throw new Error('invalid date format, expected DDMMMYYYY');
    }
    return m;
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
