import moment from 'moment';
import { formatForApi, formatForDisplay, parseFromApi, formatDuration, sumDurations } from 'services/chronoService';

describe('chronoService.formatForApi', () => {
  it('formats date', () => {
    expect(formatForApi(new Date(2020, 0, 1))).toEqual('01Jan2020');
  });
  it('formats moment', () => {
    expect(formatForApi(moment([2020, 0, 1]))).toEqual('01Jan2020');
  });
});

describe('chronoService.formatForDisplay', () => {
  it('formats date', () => {
    expect(formatForDisplay(new Date(2020, 0, 1))).toEqual('2020.01.01');
  });
  it('formats moment', () => {
    expect(formatForDisplay(moment([2020, 0, 1]))).toEqual('2020.01.01');
  });
});

describe('chronoService.parseFromApi', () => {
  it('handles no input', () => {
    expect(parseFromApi(undefined)).toBeUndefined();
  });
  it('parses valid string', () => {
    expect(parseFromApi('01Jan2020')?.unix()).toEqual(moment([2020, 0, 1]).unix());
  });
  it('pins to start of day', () => {
    const m = parseFromApi('01Jan2020');
    expect(m?.hour()).toEqual(0);
    expect(m?.minute()).toEqual(0);
    expect(m?.second()).toEqual(0);
    expect(m?.millisecond()).toEqual(0);
  });
  it('returns undefined on invalid string', () => {
    expect(() => parseFromApi('not a date')).toThrow();
  });
});

describe('chronoService.formatDuration', () => {
  it('formats zero time', () => {
    expect(formatDuration(moment.duration(0, 'minutes'))).toEqual('0m');
  });
  it('formats non-integer minutes', () => {
    expect(formatDuration(moment.duration(0.3, 'minutes'))).toEqual('0m');
    expect(formatDuration(moment.duration(0.7, 'minutes'))).toEqual('0m');
    expect(formatDuration(moment.duration(1.333, 'hours'))).toEqual('1h19m');
  });
  it('formats less than an hour', () => {
    expect(formatDuration(moment.duration(5, 'minutes'))).toEqual('5m');
  });
  it('formats an hour', () => {
    expect(formatDuration(moment.duration(1, 'hour'))).toEqual('1h0m');
  });
  it('formats more than an hour', () => {
    expect(formatDuration(moment.duration(2.5, 'hours'))).toEqual('2h30m');
  });
  it('formats 24 hours', () => {
    expect(formatDuration(moment.duration(24, 'hours'))).toEqual('24h0m');
  });
  it('formats more than 24 hours', () => {
    expect(formatDuration(moment.duration(27.5, 'hours'))).toEqual('27h30m');
  });
});

describe('chronoService.sumDurations', () => {
  it('sums', () => {
    expect(
      sumDurations([
        moment.duration(0, 'minutes'),
        moment.duration(2, 'minutes'),
        moment.duration(3, 'minutes'),
      ]).asSeconds(),
    ).toEqual(moment.duration(5, 'minutes').asSeconds());
  });
});
