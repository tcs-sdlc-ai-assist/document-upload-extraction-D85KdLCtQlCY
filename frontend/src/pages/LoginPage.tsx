import React, { useState, useCallback, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/types/types';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  if (isAuthenticated) {
    navigate(from, { replace: true });
  }

  const validateForm = useCallback((): string | null => {
    if (!email.trim()) {
      return 'Email is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (email.trim().length > 128) {
      return 'Email must be at most 128 characters.';
    }

    if (!password) {
      return 'Password is required.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (password.length > 64) {
      return 'Password must be at most 64 characters.';
    }

    return null;
  }, [email, password]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsSubmitting(true);

      try {
        await login(email.trim(), password);
        navigate(from, { replace: true });
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError && apiError.message) {
          setError(apiError.message);
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, login, navigate, from, validateForm],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access Document Upload & Extraction
          </p>
        </div>

        <form
          className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-sm border border-gray-200"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Login form"
        >
          {error && (
            <div
              className="bg-red-50 border border-red-200 rounded-lg p-4"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center space-x-3">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={128}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isSubmitting
                    ? 'bg-gray-50 cursor-not-allowed opacity-50'
                    : 'bg-white border-gray-300'
                }`}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={64}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isSubmitting
                    ? 'bg-gray-50 cursor-not-allowed opacity-50'
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              isSubmitting
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                  aria-hidden="true"
                ></div>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>

          {error && (
            <p id="login-error" className="sr-only">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;