import React, { useState } from 'react';
import { Button, Card, CardBody, Col, Form, FormGroup, Input, Label, Progress, Row } from 'reactstrap';
import AlertMessage from '../components/AlertMessage';
import { api } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import { rememberDateOfBirth, resolveDateOfBirth } from '../utils/dateOfBirth';

export default function CompatibilityPage() {
  const { user, updateUser } = useAuth();
  const savedDob = resolveDateOfBirth(user);
  const [form, setForm] = useState({ first: savedDob, second: '' });
  const [result, setResult] = useState(null);
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
      const data = await api.compatibility(form);
      setResult(data.compatibility);
      if (form.first) {
        rememberDateOfBirth(form.first);
        updateUser({ ...user, dateOfBirth: form.first });
      }
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
          <p className="eyebrow">Compatibility</p>
          <h1>Compare two energies</h1>
        </div>
      </div>

      <Row className="g-3">
        <Col lg="5">
          <Card className="panel-card">
            <CardBody>
              <AlertMessage message={error} />
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Your date of birth</Label>
                  <Input name="first" type="date" value={form.first} onChange={updateField} required readOnly={Boolean(savedDob)} />
                  {savedDob && <small className="text-muted">Auto-filled from your profile.</small>}
                </FormGroup>
                <FormGroup>
                  <Label>Second person date of birth</Label>
                  <Input name="second" type="date" value={form.second} onChange={updateField} required />
                </FormGroup>
                <Button color="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Calculating...' : 'Calculate score'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col lg="7">
          <Card className="panel-card h-100">
            <CardBody>
              {result ? (
                <>
                  <div className="score-line">
                    <span>{result.compatibilityScore}</span>
                    <small>/100</small>
                  </div>
                  <Progress value={result.compatibilityScore} className="mb-4" />
                  <p className="lead-copy">{result.explanation}</p>
                  <Row className="g-3">
                    <Col md="6">
                      <div className="mini-panel">
                        <span>First number</span>
                        <strong>{result.firstNumber}</strong>
                      </div>
                    </Col>
                    <Col md="6">
                      <div className="mini-panel">
                        <span>Second number</span>
                        <strong>{result.secondNumber}</strong>
                      </div>
                    </Col>
                  </Row>
                </>
              ) : (
                <div className="empty-state compact">
                  <h4>No comparison yet</h4>
                  <p className="text-muted">Enter two names or numerology numbers to see the compatibility score.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
}
