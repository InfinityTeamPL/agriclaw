import { LoginForm } from './LoginForm';

export default function LoginPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  return <LoginForm googleEnabled={googleEnabled} />;
}
