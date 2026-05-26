import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, CardBody, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import AlertMessage from '../components/AlertMessage';
import NameCorrectionScoreChart from '../components/NameCorrectionScoreChart';
import StatCard from '../components/StatCard';
import { api } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import { rememberDateOfBirth, resolveDateOfBirth } from '../utils/dateOfBirth';

export default function CalculatorPage() {
  const { user, updateUser } = useAuth();
  const savedDob = resolveDateOfBirth(user);
  const defaultFullName = user?.profile?.source?.fullName || user?.name || '';
  const [form, setForm] = useState({
    fullName: defaultFullName,
    dateOfBirth: savedDob
  });
  const [profile, setProfile] = useState(user?.profile || null);
  const [fullName, setFullName] = useState(defaultFullName);
  const [nameScores, setNameScores] = useState(user?.profile?.nameCorrectionSuggestions || []);
  const [error, setError] = useState('');
  const [scoreError, setScoreError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingScores, setLoadingScores] = useState(false);
  const scoreRequestRef = useRef(0);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await api.createProfile(form);
      setProfile(data.profile);
      setFullName(data.profile.source?.fullName || form.fullName);
      setNameScores(data.profile.nameCorrectionSuggestions || []);
      rememberDateOfBirth(form.dateOfBirth);
      updateUser({ ...user, dateOfBirth: form.dateOfBirth, profile: data.profile });
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function refreshNameScores(nextFullName = fullName) {
    const name = nextFullName.trim();

    if (!name || name.length < 2 || !(form.dateOfBirth || savedDob)) {
      return;
    }

    const requestId = scoreRequestRef.current + 1;
    scoreRequestRef.current = requestId;
    setScoreError('');
    setLoadingScores(true);

    try {
      const data = await api.nameScore({
        name,
        dateOfBirth: form.dateOfBirth || savedDob
      });

      if (requestId === scoreRequestRef.current) {
        setNameScores(data.suggestions || [data.suggestion]);
      }
    } catch (nextError) {
      if (requestId === scoreRequestRef.current) {
        setScoreError(nextError.message);
      }
    } finally {
      if (requestId === scoreRequestRef.current) {
        setLoadingScores(false);
      }
    }
  }

  function handleCheckScore(event) {
    event.preventDefault();
    refreshNameScores(fullName);
  }

  useEffect(() => {
    if (!fullName || fullName.length < 2 || !(form.dateOfBirth || savedDob)) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      refreshNameScores(fullName);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [fullName, form.dateOfBirth, savedDob]);

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Calculator</p>
          <h1>Create a numerology profile</h1>
        </div>
      </div>

      <Row className="g-3">
        <Col lg="5">
          <Card className="panel-card">
            <CardBody>
              <AlertMessage message={error} />
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Full name</Label>
                  <Input name="fullName" value={form.fullName} onChange={updateField} required minLength={2} />
                </FormGroup>
                <FormGroup>
                  <Label>Date of birth</Label>
                  <Input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} required readOnly={Boolean(savedDob)} />
                  {savedDob && <small className="text-muted">Auto-filled from your saved profile.</small>}
                </FormGroup>
                <Button color="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Calculating...' : 'Calculate profile'}
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
                  <h4>Result summary</h4>
                  <p className="lead-copy">{profile.interpretation}</p>
                  <p className="text-muted mb-0">
                    Lucky colors: {profile.luckyColors.join(', ')}. Lucky days: {profile.luckyDays.join(', ')}.
                  </p>
                </CardBody>
              </Card>
              <Card className="panel-card mt-3">
                <CardBody>
                  <h4>Name correction suggestions</h4>
                  <AlertMessage message={scoreError} />
                  <Form onSubmit={handleCheckScore} className="mb-3">
                    <Row className="g-2 align-items-end">
                      <Col md="8">
                        <FormGroup className="mb-0">
                          <Label>Enter Name to Evaluate</Label>
                          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <Button color="primary" className="w-100" disabled={loadingScores || !fullName.trim()}>
                          {loadingScores ? 'Checking...' : 'Check Score'}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                  <div className="tag-group">
                    {nameScores.map((suggestion) => (
                      <span className="soft-tag" key={suggestion.name}>
                        {suggestion.name}: {suggestion.originalName || suggestion.name} - {suggestion.score}
                      </span>
                    ))}
                  </div>
                </CardBody>
              </Card>
              <Card className="panel-card mt-3">
                <CardBody>
                  <h4>Name correction score</h4>
                  <p className="text-muted">Compare current and suggested name options by numerology score.</p>
                  <NameCorrectionScoreChart suggestions={nameScores} />
                </CardBody>
              </Card>
            </>
          ) : (
            <Card className="panel-card empty-state">
              <CardBody>
                <h4>Ready when you are</h4>
                <p className="text-muted">Your calculated profile will appear here after submission.</p>
              </CardBody>
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
}
