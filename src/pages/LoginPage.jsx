import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Form, FormGroup, Input, Label } from 'reactstrap';
import AlertMessage from '../components/AlertMessage';
import { api } from '../services/api';
import { useAuth } from '../utils/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await api.login(form);
      signIn(data);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h2>Welcome back</h2>
      <p className="text-muted mb-4">Sign in to continue to your AstroNumerix dashboard.</p>
      <AlertMessage message={error} />
      <Form className="auth-login-form" onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Email</Label>
          <Input name="email" type="email" value={form.email} onChange={updateField} required />
        </FormGroup>
        <FormGroup>
          <Label>Password</Label>
          <Input name="password" type="password" value={form.password} onChange={updateField} required />
        </FormGroup>
        <Button color="primary" className="w-100 auth-enter-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Enter Dashboard'}
        </Button>
      </Form>
      <div className="auth-login-links">
        <Link to="/forgot-password">Forgot password?</Link>
        <Link to="/register">Create new account</Link>
      </div>
    </>
  );
}
