import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Form, FormGroup, Input, Label } from 'reactstrap';
import AlertMessage from '../components/AlertMessage';
import { api } from '../services/api';
import { geocodeBirthLocation } from '../services/geocoding';
import { useAuth } from '../utils/AuthContext';

export default function RegisterPage() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    dateOfBirth: '',
    birthTime: '',
    birthLocationText: '',
    birthLocation: null
  });
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [isLookingUpLocation, setIsLookingUpLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'birthLocationText' ? { birthLocation: null } : {})
    }));
  }

  async function lookupLocation() {
    setError('');
    setLocationStatus('');

    if (!form.birthLocationText.trim()) {
      setLocationStatus('Enter a birth location to look up coordinates.');
      return;
    }

    setIsLookingUpLocation(true);

    try {
      const birthLocation = await geocodeBirthLocation(form.birthLocationText);

      if (!birthLocation) {
        setLocationStatus('No matching location found. Astrology calculation will be skipped unless the location is resolved.');
        return;
      }

      setForm((current) => ({
        ...current,
        birthLocationText: birthLocation.name,
        birthLocation
      }));
      setLocationStatus('Location resolved for astrology calculation.');
    } catch (nextError) {
      setLocationStatus('Location lookup failed. You can still create the account without astrology calculation.');
    } finally {
      setIsLookingUpLocation(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        dateOfBirth: form.dateOfBirth || undefined,
        birthTime: form.birthTime || undefined,
        birthLocation: form.birthLocation || undefined
      };
      const data = await api.register(payload);
      signIn(data);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h2>Create account</h2>
      <p className="text-muted mb-4">Register securely and save your latest calculations.</p>
      <AlertMessage message={error} />
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Name</Label>
          <Input name="name" value={form.name} onChange={updateField} required minLength={2} />
        </FormGroup>
        <FormGroup>
          <Label>Email</Label>
          <Input name="email" type="email" value={form.email} onChange={updateField} required />
        </FormGroup>
        <FormGroup>
          <Label>Password</Label>
          <Input name="password" type="password" value={form.password} onChange={updateField} required minLength={8} />
        </FormGroup>
        <FormGroup>
          <Label>Date of birth</Label>
          <Input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} />
        </FormGroup>
        <FormGroup>
          <Label>Birth time</Label>
          <Input name="birthTime" type="time" value={form.birthTime} onChange={updateField} />
        </FormGroup>
        <FormGroup>
          <Label>Birth location</Label>
          <div className="location-lookup">
            <Input name="birthLocationText" value={form.birthLocationText} onChange={updateField} placeholder="City, state, country" />
            <Button color="primary" outline type="button" disabled={isLookingUpLocation || !form.birthLocationText.trim()} onClick={lookupLocation}>
              {isLookingUpLocation ? 'Finding...' : 'Find'}
            </Button>
          </div>
          {locationStatus && <small className="text-muted">{locationStatus}</small>}
        </FormGroup>
        <Button color="primary" className="w-100" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create account'}
        </Button>
      </Form>
      <p className="auth-switch">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </>
  );
}
