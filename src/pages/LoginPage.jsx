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
      <p className="text-muted mb-4">Sign in to continue to your numerology dashboard.</p>
      <AlertMessage message={error} />
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Email</Label>
          <Input name="email" type="email" value={form.email} onChange={updateField} required />
        </FormGroup>
        <FormGroup>
          <Label>Password</Label>
          <Input name="password" type="password" value={form.password} onChange={updateField} required />
        </FormGroup>
        <Button color="primary" className="w-100" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </Form>
      <p className="auth-switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </>
  );
}
