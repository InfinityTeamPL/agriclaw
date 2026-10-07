import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  // Suspense wymagany przez useSearchParams w LoginForm (callbackUrl, ?error=).
  return (
    <Suspense fallback={null}>
      <LoginForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
