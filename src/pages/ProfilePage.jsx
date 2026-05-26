import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import AlertMessage from '../components/AlertMessage';
import StatCard from '../components/StatCard';
import { api } from '../services/api';
import { geocodeBirthLocation } from '../services/geocoding';
import { useAuth } from '../utils/AuthContext';
import { resolveDateOfBirth } from '../utils/dateOfBirth';

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const profile = user?.profile;
  const [form, setForm] = useState({
    name: user?.name || '',
    dateOfBirth: resolveDateOfBirth(user),
    birthTime: user?.birthTime || '',
    birthLocationText: user?.birthLocation?.name || '',
    birthLocation: user?.birthLocation || null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [isLookingUpLocation, setIsLookingUpLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      dateOfBirth: resolveDateOfBirth(user),
      birthTime: user?.birthTime || '',
      birthLocationText: user?.birthLocation?.name || '',
      birthLocation: user?.birthLocation || null
    });
  }, [user]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'birthLocationText' ? { birthLocation: null } : {})
    }));
  }

  function validate() {
    if (form.name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }

    if (form.dateOfBirth && !isIsoDate(form.dateOfBirth)) {
      return 'Date of birth must be YYYY-MM-DD';
    }

    return '';
  }

  async function lookupLocation() {
    setError('');
    setSuccess('');
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
      setLocationStatus('Location lookup failed. Existing saved location will be kept if available.');
    } finally {
      setIsLookingUpLocation(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationError = validate();
    setError(validationError);
    setSuccess('');

    if (validationError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await api.updateCurrentUser({
        name: form.name.trim(),
        dateOfBirth: form.dateOfBirth || null,
        birthTime: form.birthTime || null,
        birthLocation: form.birthLocation || null
      });
      updateUser(data.user);
      setSuccess('Profile updated successfully.');
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>Account settings</h1>
        </div>
      </div>

      <Row className="g-3">
        <Col lg="5">
          <Card className="panel-card">
            <CardBody>
              <h4>Account summary</h4>
              <div className="profile-summary-list">
                <div>
                  <span>Name</span>
                  <strong>{user?.name || 'Not set'}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{user?.email}</strong>
                </div>
                <div>
                  <span>Date of birth</span>
                  <strong>{resolveDateOfBirth(user) || 'Not set'}</strong>
                </div>
                <div>
                  <span>Birth time</span>
                  <strong>{user?.birthTime || 'Not set'}</strong>
                </div>
                <div>
                  <span>Birth location</span>
                  <strong>{user?.birthLocation?.name || 'Not set'}</strong>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="panel-card mt-3">
            <CardBody>
              <h4>Edit profile</h4>
              <AlertMessage message={error} />
              <AlertMessage message={success} color="success" />
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Name</Label>
                  <Input name="name" value={form.name} onChange={updateField} required minLength={2} />
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
                <Button color="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save changes'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col lg="7">
          {profile ? (
            <>
              <Row className="g-3">
                <Col md="4">
                  <StatCard label="Psychic" value={profile.psychic} />
                </Col>
                <Col md="4">
                  <StatCard label="Destiny" value={profile.destiny} tone="green" />
                </Col>
                <Col md="4">
                  <StatCard label="Name" value={profile.nameNumber} tone="rose" />
                </Col>
              </Row>

              <Card className="panel-card mt-3">
                <CardBody>
                  <h4>Saved numerology profile</h4>
                  <p className="lead-copy">{profile.interpretation}</p>
                  <div className="tag-group mb-3">
                    {(profile.luckyColors || []).map((color) => (
                      <span className="soft-tag" key={color}>
                        {color}
                      </span>
                    ))}
                  </div>
                  <div className="tag-group">
                    {(profile.luckyDays || []).map((day) => (
                      <span className="soft-tag day" key={day}>
                        {day}
                      </span>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </>
          ) : (
            <Card className="panel-card empty-state">
              <CardBody>
                <h4>No numerology profile yet</h4>
                <p className="text-muted">Create a profile calculation to save your core numbers, lucky colors, and interpretation.</p>
                <Button color="primary" tag={Link} to="/calculator">
                  Open calculator
                </Button>
              </CardBody>
            </Card>
          )}

          {user?.astrologyProfile && (
            <Card className="panel-card mt-3">
              <CardBody>
                <h4>Vedic birth indicators</h4>
                <Row className="g-3">
                  <Col md="6">
                    <div className="mini-panel">
                      <span>Ascendant</span>
                      <strong>
                        {user.astrologyProfile.ascendant?.name} ({user.astrologyProfile.ascendant?.westernName})
                      </strong>
                    </div>
                  </Col>
                  <Col md="6">
                    <div className="mini-panel">
                      <span>Birth Rashi</span>
                      <strong>
                        {user.astrologyProfile.birthRashi?.name} ({user.astrologyProfile.birthRashi?.westernName})
                      </strong>
                    </div>
                  </Col>
                </Row>
                <div className="tag-group mt-3">
                  <span className="soft-tag">Moon sign: {user.astrologyProfile.moonSign?.name}</span>
                  <span className="soft-tag day">Location: {user.astrologyProfile.source?.birthLocation?.name}</span>
                </div>
                <p className="text-muted mt-3 mb-0">{user.astrologyProfile.calculationNotes}</p>
              </CardBody>
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
}
