/**
 * The steps of the panel's sign-in form, the same as the theme's sign-in: the username or e-mail is
 * asked first and sent alone, and the password field appears only when the platform says it needs
 * one. An account that signs in another way (a link code, a plugin's own method) never sees it.
 * Pure, so the rules have tests.
 */

/**
 * The first submit carries no password; the platform answers `LOGIN_IS_INVALID` to it when the
 * account signs in with one. That answer is the cue to ask for the password, not an error.
 *
 * @param {string} code the error code of the sign-in answer
 * @param {boolean} passwordAsked whether the password field is already there
 */
export function asksForPassword(code, passwordAsked) {
  return String(code || '').toUpperCase() === 'LOGIN_IS_INVALID' && !passwordAsked;
}

/**
 * Whether the form can be sent: an identifier always, a password once it is asked for, and the
 * extra field of the step the form is on.
 *
 * @param {object} form
 * @param {string} form.usernameOrEmail
 * @param {string} form.password
 * @param {boolean} form.passwordAsked
 * @param {boolean} [form.emailRequired] the platform wants an e-mail for this account
 * @param {string} [form.registerEmail]
 * @param {boolean} [form.usernameRequired] the account has to pick a username
 * @param {string} [form.newUsername]
 */
export function canSubmitLogin({
  usernameOrEmail,
  password,
  passwordAsked,
  emailRequired = false,
  registerEmail = '',
  usernameRequired = false,
  newUsername = '',
}) {
  return (
    String(usernameOrEmail || '').trim().length > 0 &&
    (!passwordAsked || String(password || '').length > 0) &&
    (!emailRequired || String(registerEmail || '').trim().length > 0) &&
    (!usernameRequired || String(newUsername || '').trim().length > 0)
  );
}
