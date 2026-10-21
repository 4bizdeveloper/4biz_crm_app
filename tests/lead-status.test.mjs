import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionLeadStatus,
  serializeLead,
  toApiLeadStatus,
  toPrismaLeadStatus,
} from '../src/lib/lead-status.ts';

test('maps API Follow-up status to Prisma enum and back', () => {
  assert.equal(toPrismaLeadStatus('Follow-up'), 'Follow_up');
  assert.equal(toApiLeadStatus('Follow_up'), 'Follow-up');
  assert.deepEqual(serializeLead({ id: 'lead-1', status: 'Follow_up' }), { id: 'lead-1', status: 'Follow-up' });
});

test('rejects unsupported statuses', () => {
  assert.equal(toPrismaLeadStatus('In Review'), null);
  assert.equal(toPrismaLeadStatus('not-a-status'), null);
});

test('allows valid forward status transitions', () => {
  assert.equal(canTransitionLeadStatus('New', 'Assigned'), true);
  assert.equal(canTransitionLeadStatus('Assigned', 'Qualified'), true);
  assert.equal(canTransitionLeadStatus('Qualified', 'Converted'), true);
});

test('blocks invalid transitions from terminal statuses', () => {
  assert.equal(canTransitionLeadStatus('Converted', 'Assigned'), false);
  assert.equal(canTransitionLeadStatus('Disqualified', 'Qualified'), false);
});

test('allows admin override and no-op status updates', () => {
  assert.equal(canTransitionLeadStatus('Converted', 'Assigned', true), true);
  assert.equal(canTransitionLeadStatus('Contacted', 'Contacted'), true);
});
