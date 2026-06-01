import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Form, FormGroup, Input, Label } from 'reactstrap';
import AlertMessage from '../components/AlertMessage';
import { api } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');
    setIsSubmitting(true);

    try {
      const data = await api.forgotPassword({ email });
      setMessage(data.message);
      setResetUrl(data.resetUrl || '');
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h2>Reset password</h2>
      <p className="text-muted mb-4">Enter your account email to request a password reset link.</p>
      <AlertMessage message={error} />
      <AlertMessage message={message} color="success" />
      {resetUrl && (
        <AlertMessage
          message={
            <>
              Local reset link: <Link to={new URL(resetUrl).pathname}>Open reset page</Link>
            </>
          }
          color="info"
        />
      )}
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Email</Label>
          <Input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </FormGroup>
        <Button color="primary" className="w-100" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </Button>
      </Form>
      <p className="auth-switch">
        Remembered it? <Link to="/login">Sign in</Link>
      </p>
    </>
  );
}
