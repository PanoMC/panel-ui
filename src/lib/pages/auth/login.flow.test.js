import { describe, expect, test } from 'bun:test';

import { asksForPassword, canSubmitLogin } from './login.flow.js';

describe('sign-in steps', () => {
  test('the identifier alone can be sent first', () => {
    expect(canSubmitLogin({ usernameOrEmail: 'steve', password: '', passwordAsked: false })).toBe(
      true,
    );
    expect(canSubmitLogin({ usernameOrEmail: '  ', password: '', passwordAsked: false })).toBe(
      false,
    );
  });

  test('once the password is asked for it is needed', () => {
    expect(canSubmitLogin({ usernameOrEmail: 'steve', password: '', passwordAsked: true })).toBe(
      false,
    );
    expect(canSubmitLogin({ usernameOrEmail: 'steve', password: 'x', passwordAsked: true })).toBe(
      true,
    );
  });

  test('the extra field of a step is needed too', () => {
    const base = { usernameOrEmail: 'steve', password: 'x', passwordAsked: true };

    expect(canSubmitLogin({ ...base, emailRequired: true, registerEmail: ' ' })).toBe(false);
    expect(canSubmitLogin({ ...base, emailRequired: true, registerEmail: 'a@b.c' })).toBe(true);
    expect(canSubmitLogin({ ...base, usernameRequired: true })).toBe(false);
    expect(canSubmitLogin({ ...base, usernameRequired: true, newUsername: 'alex' })).toBe(true);
  });

  test('LOGIN_IS_INVALID to the first submit asks for the password, later it is an error', () => {
    expect(asksForPassword('LOGIN_IS_INVALID', false)).toBe(true);
    expect(asksForPassword('login_is_invalid', false)).toBe(true);
    expect(asksForPassword('LOGIN_IS_INVALID', true)).toBe(false);
    expect(asksForPassword('LINK_CODE_REQUIRED', false)).toBe(false);
    expect(asksForPassword('', false)).toBe(false);
  });
});
