import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, startOfTodayInAppTz, todayInAppTz, toDateString } from './date';

// Prague is UTC+2 in summer (CEST) and UTC+1 in winter (CET)
const today = (iso: string) => toDateString(todayInAppTz(new Date(iso)));

test('just after midnight in Prague (summer) is already the next day', () => {
  assert.equal(today('2026-10-09T22:30:00Z'), '2026-10-10'); // 00:30 in Prague
});

test('late evening in Prague (summer) is still the same day', () => {
  assert.equal(today('2026-10-09T21:30:00Z'), '2026-10-09'); // 23:30 in Prague
});

test('winter time uses UTC+1', () => {
  assert.equal(today('2026-01-15T23:30:00Z'), '2026-01-16'); // 00:30 in Prague
  assert.equal(today('2026-01-15T22:30:00Z'), '2026-01-15'); // 23:30 in Prague
});

test('result is a date-only value at UTC midnight', () => {
  assert.equal(todayInAppTz(new Date('2026-10-09T12:00:00Z')).toISOString(), '2026-10-09T00:00:00.000Z');
});

test('addDays handles month and year ends', () => {
  assert.equal(toDateString(addDays(new Date('2026-12-30T00:00:00Z'), 3)), '2027-01-02');
  assert.equal(toDateString(addDays(new Date('2028-02-28T00:00:00Z'), 1)), '2028-02-29');
});

const start = (iso: string) => startOfTodayInAppTz(new Date(iso)).toISOString();

test('start of today in Prague: summer is 22:00 UTC the day before', () => {
  assert.equal(start('2026-10-10T12:00:00Z'), '2026-10-09T22:00:00.000Z');
  assert.equal(start('2026-10-09T22:30:00Z'), '2026-10-09T22:00:00.000Z'); // 00:30 in Prague
});

test('start of today in Prague: winter is 23:00 UTC the day before', () => {
  assert.equal(start('2026-01-15T12:00:00Z'), '2026-01-14T23:00:00.000Z');
});

test('start of today on daylight saving change days', () => {
  assert.equal(start('2026-03-29T12:00:00Z'), '2026-03-28T23:00:00.000Z'); // clocks go forward at 02:00
  assert.equal(start('2026-10-25T12:00:00Z'), '2026-10-24T22:00:00.000Z'); // clocks go back at 03:00
});
