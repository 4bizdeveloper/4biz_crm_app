import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessLeadBranch } from '../src/lib/branch-access.ts';

test('allows a user to access leads in their assigned branch', () => {
  assert.equal(canAccessLeadBranch({ isAdmin: false, branch: 'Dubai' }, 'Dubai'), true);
});

test('blocks cross-branch access when an employee branch is assigned', () => {
  assert.equal(canAccessLeadBranch({ isAdmin: false, branch: 'Dubai' }, 'Abu Dhabi'), false);
});

test('preserves access for Super Admin and legacy users without branch data', () => {
  assert.equal(canAccessLeadBranch({ isAdmin: true, branch: null }, 'Abu Dhabi'), true);
  assert.equal(canAccessLeadBranch({ isAdmin: false, branch: null }, 'Abu Dhabi'), true);
});
