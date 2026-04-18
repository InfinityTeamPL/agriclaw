import { SignupForm } from './SignupForm';

export default function SignupPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  return <SignupForm googleEnabled={googleEnabled} />;
}
