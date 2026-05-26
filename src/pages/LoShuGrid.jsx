import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, CardBody, Col, FormGroup, Input, Label, Row } from 'reactstrap';
import AlertMessage from '../components/AlertMessage';
import { analyzeLoShuGrid } from '../services/loshu';
import { useAuth } from '../utils/AuthContext';
import { rememberDateOfBirth, resolveDateOfBirth } from '../utils/dateOfBirth';

const gridLayout = [4, 9, 2, 3, 5, 7, 8, 1, 6];

const remedySections = [
  {
    key: 'missingNumbersRemedies',
    title: 'Missing Numbers Remedies',
    tone: 'weakness',
    empty: 'No missing number remedies are needed for this grid.'
  },
  {
    key: 'weakAreaGuidance',
    title: 'Weak Area Guidance',
    tone: 'guidance',
    empty: 'No weak areas were detected from missing numbers.'
  },
  {
    key: 'behavioralSuggestions',
    title: 'Behavioral Suggestions',
    tone: 'guidance',
    empty: 'No behavioral corrections are needed from missing numbers.'
  },
  {
    key: 'lifestyleRecommendations',
    title: 'Lifestyle Recommendations',
    tone: 'guidance',
    empty: 'No lifestyle recommendations are needed from missing numbers.'
  }
];

function formatDob(value) {
  if (!value) {
    return '';
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    return value;
  }

  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${day}-${month}-${year}`;
}

export default function LoShuGrid() {
  const { user, updateUser } = useAuth();
  const savedDob = resolveDateOfBirth(user);
  const [dob, setDob] = useState(savedDob);
  const [loshuData, setLoshuData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const resultsRef = useRef(null);
  const requestIdRef = useRef(0);
  const lastRequestedDobRef = useRef('');

  useEffect(() => {
    if (!savedDob) {
      return;
    }

    setDob((currentDob) => currentDob || savedDob);
  }, [savedDob]);

  async function fetchAnalysis({ nextDob = dob || savedDob, scrollToResults = false, force = false } = {}) {
    const analysisDob = nextDob || savedDob;

    if (!analysisDob) {
      setLoshuData(null);
      setError('');
      return;
    }

    if (!force && lastRequestedDobRef.current === analysisDob) {
      return;
    }

    lastRequestedDobRef.current = analysisDob;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError('');

    try {
      const data = await analyzeLoShuGrid({ dob: formatDob(analysisDob) });
      if (requestId !== requestIdRef.current) {
        return;
      }

      setLoshuData(data);
      rememberDateOfBirth(analysisDob);
      if (user?.dateOfBirth !== analysisDob) {
        updateUser({ ...user, dateOfBirth: analysisDob });
      }

      if (scrollToResults) {
        window.requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    } catch (nextError) {
      if (requestId === requestIdRef.current) {
        setLoshuData(null);
        setError(nextError.message);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!dob) {
      setLoshuData(null);
      setError('');
      return;
    }

    fetchAnalysis({ nextDob: dob });
  }, [dob]);

  function getCellClass(number) {
    if (!loshuData) {
      return 'loshu-cell';
    }

    if (loshuData.missingNumbers.includes(number)) {
      return 'loshu-cell missing';
    }

    if (loshuData.repeatedNumbers.includes(number)) {
      return 'loshu-cell repeated';
    }

    return 'loshu-cell present';
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Lo Shu Grid</p>
          <h1>Birth date energy map</h1>
        </div>
      </div>

      <Row className="g-3">
        <Col lg="5">
          <Card className="panel-card">
            <CardBody>
              <AlertMessage message={error} />
              <FormGroup className="mb-0">
                <Label>Date of birth</Label>
                <Input name="dob" type="date" value={dob} onChange={(event) => setDob(event.target.value)} required />
                <small className="text-muted">
                  {dob ? 'Live analysis updates automatically when this date changes.' : 'Enter DOB once to start live Lo Shu analysis.'}
                </small>
              </FormGroup>
              <Button color="primary" className="mt-3" disabled={loading || !dob} onClick={() => fetchAnalysis({ scrollToResults: true, force: true })}>
                {loading ? 'Analyzing...' : 'View Analysis'}
              </Button>
            </CardBody>
          </Card>
        </Col>

        <Col lg="7">
          <Card className="panel-card h-100">
            <CardBody>
              {loshuData ? (
                <>
                  <div className="loshu-grid" aria-label="Lo Shu grid analysis">
                    {gridLayout.map((number) => (
                      <div className={getCellClass(number)} key={number}>
                        <span>{number}</span>
                        <strong>{loshuData.grid[number]}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="loshu-legend">
                    <span className="legend-item missing">Missing</span>
                    <span className="legend-item repeated">Repeated</span>
                    <span className="legend-item present">Present</span>
                  </div>
                </>
              ) : (
                <div className="empty-state compact">
                  <h4>No grid yet</h4>
                  <p className="text-muted">Please enter your Date of Birth to view analysis</p>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {loshuData && (
        <Row className="g-3 mt-1" innerRef={resultsRef}>
          <Col lg="6">
            <Card className="panel-card h-100">
              <CardBody>
                <h4>Strengths</h4>
                <div className="tag-group mb-3">
                  {loshuData.presentNumbers?.length ? (
                    loshuData.presentNumbers.map((number) => (
                      <span className="soft-tag loshu-present-tag" key={number}>
                        Number {number}
                      </span>
                    ))
                  ) : (
                    <span className="soft-tag">Balanced distribution</span>
                  )}
                </div>
                {loshuData.strengths.length ? (
                  <ul className="insight-list">
                    {loshuData.strengths.map((strength) => (
                      <li key={strength}>{strength}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mb-0">No single number dominates this grid.</p>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col lg="6">
            <Card className="panel-card h-100">
              <CardBody>
                <h4>Weaknesses</h4>
                <div className="tag-group mb-3">
                  {loshuData.missingNumbers.length || loshuData.overRepeatedNumbers?.length ? (
                    [...loshuData.missingNumbers, ...(loshuData.overRepeatedNumbers || [])].map((number) => (
                      <span className="soft-tag loshu-missing-tag" key={number}>
                        {loshuData.missingNumbers.includes(number) ? 'Missing' : 'Over-repeated'} {number}
                      </span>
                    ))
                  ) : (
                    <span className="soft-tag">No missing numbers</span>
                  )}
                </div>
                {loshuData.weaknesses.length ? (
                  <ul className="insight-list">
                    {loshuData.weaknesses.map((weakness) => (
                      <li key={weakness}>{weakness}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted mb-0">All Lo Shu numbers are represented.</p>
                )}
              </CardBody>
            </Card>
          </Col>

          <Col xs="12">
            <Card className="panel-card">
              <CardBody>
                <h4>Interpretation</h4>
                <p className="lead-copy mb-0">{loshuData.interpretation}</p>
              </CardBody>
            </Card>
          </Col>

          <Col xs="12">
            <div className="section-heading">
              <p className="eyebrow">Remedies</p>
              <h2>Weakness correction and improvement</h2>
            </div>
          </Col>

          {remedySections.map((section) => {
            const items = loshuData.remedies?.[section.key] || [];

            return (
              <Col lg="6" key={section.key}>
                <Card className={`panel-card remedy-card remedy-${section.tone} h-100`}>
                  <CardBody>
                    <h4>{section.title}</h4>
                    {items.length ? (
                      <ul className="insight-list">
                        {items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted mb-0">{section.empty}</p>
                    )}
                  </CardBody>
                </Card>
              </Col>
            );
          })}

          <Col xs="12">
            <Card className="panel-card remedy-card remedy-affirmation">
              <CardBody>
                <h4>Affirmations</h4>
                {loshuData.remedies?.affirmations?.length ? (
                  <Row className="g-3">
                    {loshuData.remedies.affirmations.map((affirmation) => (
                      <Col md="6" xl="4" key={affirmation}>
                        <div className="affirmation-card">{affirmation}</div>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <p className="text-muted mb-0">This grid is balanced; use gratitude and consistency to maintain it.</p>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
}
