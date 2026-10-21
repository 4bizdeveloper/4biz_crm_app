import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
} from '../src/lib/lead-validation.ts';

test('normalizes email casing and surrounding whitespace', () => {
  assert.equal(normalizeEmail('  SALES@Example.COM  '), 'sales@example.com');
});

test('validates email syntax', () => {
  assert.equal(isValidEmail('sales@example.com'), true);
  assert.equal(isValidEmail('not-an-email'), false);
});

test('normalizes phone punctuation without inventing a country code', () => {
  assert.equal(normalizePhone('+971 (50) 123-4567'), '971501234567');
  assert.equal(normalizePhone(''), '');
});

test('requires at least seven digits for a phone contact', () => {
  assert.equal(isValidPhone('+971 50 123 4567'), true);
  assert.equal(isValidPhone('123-45'), false);
});
