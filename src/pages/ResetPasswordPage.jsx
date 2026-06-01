import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Form, FormGroup, Input, Label } from 'reactstrap';
import AlertMessage from '../components/AlertMessage';
import { api } from '../services/api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await api.resetPassword({ token, password: form.password });
      setMessage(data.message);
      setForm({ password: '', confirmPassword: '' });
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h2>Create new password</h2>
      <p className="text-muted mb-4">Choose a new password with at least 8 characters.</p>
      <AlertMessage message={error} />
      <AlertMessage message={message} color="success" />
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>New password</Label>
          <Input name="password" type="password" value={form.password} onChange={updateField} required minLength={8} />
        </FormGroup>
        <FormGroup>
          <Label>Confirm password</Label>
          <Input name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} required minLength={8} />
        </FormGroup>
        <Button color="primary" className="w-100" disabled={isSubmitting || !token}>
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </Button>
      </Form>
      <p className="auth-switch">
        Back to <Link to="/login">sign in</Link>
      </p>
    </>
  );
}
