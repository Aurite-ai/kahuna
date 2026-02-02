/**
 * RegisterPage - Email/password registration form with confirmation.
 *
 * On success: redirects to home page
 * On failure: displays error message
 */
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthApiError, useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation for password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email, password);
      navigate('/');
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '1rem',
      }}
    >
      <h1>Register</h1>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          maxWidth: '300px',
        }}
      >
        {error && (
          <div
            style={{
              color: 'red',
              padding: '0.5rem',
              backgroundColor: '#fee',
              borderRadius: '4px',
            }}
          >
            {error}
          </div>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            style={{ padding: '0.5rem' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={isSubmitting}
            style={{ padding: '0.5rem' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          Confirm Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isSubmitting}
            style={{ padding: '0.5rem' }}
          />
        </label>

        <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem' }}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p style={{ marginTop: '1rem' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
