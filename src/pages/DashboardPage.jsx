import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, Col, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import AlertMessage from '../components/AlertMessage';
import StatCard from '../components/StatCard';
import { api } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import { resolveDateOfBirth } from '../utils/dateOfBirth';

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState('');
  const profile = user?.profile;
  const savedDob = resolveDateOfBirth(user);

  useEffect(() => {
    let active = true;

    async function refreshUser() {
      try {
        const data = await api.me();
        if (active) {
          updateUser(data.user);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError.message);
        }
      }
    }

    refreshUser();

    return () => {
      active = false;
    };
  }, [updateUser]);

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Your numerology profile</h1>
        </div>
        <Button color="primary" tag={Link} to="/calculator">
          New calculation
        </Button>
      </div>

      <AlertMessage message={error} />

      {!profile && (
        <Card className="panel-card">
          <CardBody>
            <h4>No profile yet</h4>
            <p className="text-muted">Calculate your first profile to populate your dashboard numbers, lucky colors, and lucky days.</p>
            <Button color="primary" tag={Link} to="/calculator">
              Open calculator
            </Button>
          </CardBody>
        </Card>
      )}

      {profile && (
        <>
          <Row className="g-3">
            <Col xs="6" md="4">
              <StatCard label="Psychic Number" value={profile.psychic} tone="blue" />
            </Col>
            <Col xs="6" md="4">
              <StatCard label="Destiny Number" value={profile.destiny} tone="green" />
            </Col>
            <Col xs="12" md="4">
              <StatCard label="Name Number" value={profile.nameNumber} tone="rose" />
            </Col>
          </Row>

          <Row className="g-3 mt-1">
            <Col lg="7">
              <Card className="panel-card h-100">
                <CardBody>
                  <h4>Interpretation</h4>
                  <p className="lead-copy">{profile.interpretation}</p>
                  <div className="profile-source">
                    <span>{profile.source?.fullName}</span>
                    <span>{savedDob || profile.source?.dateOfBirth}</span>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col lg="5">
              <Card className="panel-card h-100">
                <CardBody>
                  <h4>Lucky signals</h4>
                  <div className="tag-group">
                    {profile.luckyColors?.map((color) => (
                      <span className="soft-tag" key={color}>
                        {color}
                      </span>
                    ))}
                  </div>
                  <div className="tag-group mt-3">
                    {profile.luckyDays?.map((day) => (
                      <span className="soft-tag day" key={day}>
                        {day}
                      </span>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Row className="g-3 mt-1">
        <Col md="4">
          <Card className="panel-card h-100">
            <CardBody>
              <h4>Clean Trade</h4>
              <p className="text-muted">Review timing windows, risk zones, and optional asset context for trade planning.</p>
              <Button color="primary" outline tag={Link} to="/clean-trade">
                Open Clean Trade
              </Button>
            </CardBody>
          </Card>
        </Col>
        <Col md="4">
          <Card className="panel-card h-100">
            <CardBody>
              <h4>Calculator</h4>
              <p className="text-muted">Create or refresh your saved numerology profile with name and birth date inputs.</p>
              <Button color="primary" outline tag={Link} to="/calculator">
                Open calculator
              </Button>
            </CardBody>
          </Card>
        </Col>
        <Col md="4">
          <Card className="panel-card h-100">
            <CardBody>
              <h4>Daily forecast</h4>
              <p className="text-muted">Generate a daily focus from your birth date and forecast date.</p>
              <Button color="primary" outline tag={Link} to="/forecast">
                Open forecast
              </Button>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-1">
        <Col md="4">
          <Card className="panel-card h-100">
            <CardBody>
              <h4>Compatibility</h4>
              <p className="text-muted">Compare two names or numbers for energetic alignment.</p>
              <Button color="primary" outline tag={Link} to="/compatibility">
                Open compatibility
              </Button>
            </CardBody>
          </Card>
        </Col>
        <Col md="4">
          <Card className="panel-card h-100">
            <CardBody>
              <h4>Lo Shu Grid</h4>
              <p className="text-muted">Map birth date digits into the classic 3x3 Lo Shu grid.</p>
              <Button color="primary" outline tag={Link} to="/loshu">
                Open Lo Shu Grid
              </Button>
            </CardBody>
          </Card>
        </Col>
        <Col md="4">
          <Card className="panel-card h-100">
            <CardBody>
              <h4>Profile</h4>
              <p className="text-muted">Manage account details, birth data, and saved numerology or Vedic indicators.</p>
              <Button color="primary" outline tag={Link} to="/profile">
                Open profile
              </Button>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
}
