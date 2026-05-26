import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import AlertMessage from '../components/AlertMessage';
import { api } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import { rememberDateOfBirth, resolveDateOfBirth } from '../utils/dateOfBirth';

export default function ForecastPage() {
  const { user, updateUser } = useAuth();
  const savedDob = resolveDateOfBirth(user);
  const [form, setForm] = useState({ dateOfBirth: savedDob, forecastDate: '' });
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastAutoForecastDobRef = React.useRef('');

  useEffect(() => {
    if (!savedDob) {
      return;
    }

    setForm((current) => ({
      ...current,
      dateOfBirth: current.dateOfBirth || savedDob
    }));
  }, [savedDob]);

  async function loadForecast({ dateOfBirth, forecastDate = '', auto = false }) {
    if (!dateOfBirth) {
      return;
    }

    if (auto && lastAutoForecastDobRef.current === dateOfBirth) {
      return;
    }

    if (auto) {
      lastAutoForecastDobRef.current = dateOfBirth;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const payload = Object.fromEntries(Object.entries({ dateOfBirth, forecastDate }).filter(([, value]) => value));
      const data = await api.forecast(payload);
      setForecast(data.forecast);
      if (dateOfBirth) {
        rememberDateOfBirth(dateOfBirth);
        if (user?.dateOfBirth !== dateOfBirth) {
          updateUser({ ...user, dateOfBirth });
        }
      }
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    const dateOfBirth = form.dateOfBirth || savedDob;

    if (!dateOfBirth || form.forecastDate) {
      return;
    }

    loadForecast({ dateOfBirth, auto: true });
  }, [form.dateOfBirth, form.forecastDate, savedDob]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    loadForecast({
      dateOfBirth: form.dateOfBirth || savedDob,
      forecastDate: form.forecastDate
    });
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Forecast</p>
          <h1>Daily guidance</h1>
        </div>
      </div>

      <Row className="g-3">
        <Col lg="5">
          <Card className="panel-card">
            <CardBody>
              <AlertMessage message={error} />
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Date of birth</Label>
                  <Input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} readOnly={Boolean(savedDob)} />
                  {savedDob && <small className="text-muted">Using saved DOB from your profile.</small>}
                </FormGroup>
                <FormGroup>
                  <Label>Forecast date</Label>
                  <Input name="forecastDate" type="date" value={form.forecastDate} onChange={updateField} />
                </FormGroup>
                <Button color="primary" type="submit" disabled={isSubmitting || !(form.dateOfBirth || savedDob)}>
                  {isSubmitting ? 'Loading...' : 'Get forecast'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col lg="7">
          <Card className="panel-card h-100">
            <CardBody>
              {forecast ? (
                <>
                  <div className="forecast-number">{forecast.personalDay}</div>
                  <h4>{forecast.focusArea}</h4>
                  <p className="lead-copy">{forecast.explanation}</p>
                  <Row className="g-3">
                    <Col md="6">
                      <div className="mini-panel">
                        <span>Lucky time slots</span>
                        <strong>{(forecast.luckyTimeSlots || []).join(', ')}</strong>
                      </div>
                    </Col>
                    <Col md="6">
                      <div className="mini-panel">
                        <span>Avoid time slots</span>
                        <strong>{(forecast.avoidTimeSlots || []).join(', ')}</strong>
                      </div>
                    </Col>
                  </Row>
                </>
              ) : (
                <div className="empty-state compact">
                  <h4>No forecast yet</h4>
                  <p className="text-muted">Use your saved profile or enter a date of birth to generate today’s focus.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
}
