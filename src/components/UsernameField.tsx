/**
 * Password managers (iOS Keychain, Google Password Manager) only suggest and save
 * a new password when the form also contains the account's username. This field
 * carries it invisibly on forms where the user doesn't type their email.
 */
export default function UsernameField({ email }: { email: string }) {
  return (
    <input
      type="email"
      name="username"
      autoComplete="username"
      value={email}
      readOnly
      tabIndex={-1}
      aria-hidden
      className="sr-only"
    />
  );
}
