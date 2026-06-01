import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, CardBody, Col, Form, FormGroup, Input, Label, Row, Table } from 'reactstrap';
import AlertMessage from '../components/AlertMessage';
import { api } from '../services/api';
import { useAuth } from '../utils/AuthContext';

const ascendants = [
  '',
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces'
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getActionColor(action) {
  if (action === 'BUY') {
    return 'success';
  }

  if (action === 'SELL') {
    return 'danger';
  }

  if (action === 'AVOID') {
    return 'warning';
  }

  return 'secondary';
}

function getRiskColor(risk) {
  if (risk === 'HIGH') {
    return 'danger';
  }

  if (risk === 'LOW') {
    return 'success';
  }

  return 'secondary';
}

function getRowClass(item) {
  if (item.risk === 'HIGH') {
    return 'trade-row-high';
  }

  if (item.action === 'BUY') {
    return 'trade-row-buy';
  }

  if (item.action === 'SELL') {
    return 'trade-row-sell';
  }

  return '';
}

function parseScore(notes = '') {
  const match = /Score:\s*(-?\d+)/.exec(notes);
  return match ? Number(match[1]) : null;
}

function getScoreColor(score) {
  if (score === null) {
    return 'secondary';
  }

  if (score >= 4) {
    return 'success';
  }

  if (score <= -1) {
    return 'danger';
  }

  return 'warning';
}

function ScoreNotes({ notes }) {
  const score = parseScore(notes);

  return (
    <div className="trade-score-notes">
      <Badge color={getScoreColor(score)}>{score === null ? 'Score unavailable' : `Score ${score}`}</Badge>
    </div>
  );
}

function getScriptAction(item, analysis) {
  const isBestBuy = item.timeBlock === analysis.summary.bestBuyWindow;
  const isBestExit = item.timeBlock === analysis.summary.bestExitWindow;

  if (item.risk === 'HIGH' || item.action === 'AVOID') {
    return 'Strict Avoid';
  }

  if (isBestExit) {
    return 'Trim / Exit';
  }

  if (isBestBuy && item.type === 'Amrit') {
    return 'Best Buy / Scale';
  }

  if (item.action === 'BUY' && item.type === 'Labh') {
    return 'Buy / Accumulate';
  }

  if (item.action === 'BUY') {
    return 'Buy / Add';
  }

  if (item.action === 'SELL') {
    return 'Monitor / Trim';
  }

  return 'Neutral Monitor';
}

function getSpecificInstruction(item, analysis) {
  const isBestExit = item.timeBlock === analysis.summary.bestExitWindow;
  const hasAsset = Boolean(analysis.assetAnalysis?.asset);
  const resistance = analysis.assetAnalysis?.resistance;
  const support = analysis.assetAnalysis?.support;

  if (item.risk === 'HIGH' || item.action === 'AVOID') {
    return item.type === 'Kaal' || item.type === 'Udveg' ? 'Sit out, hedge, or minimize exposure' : 'Avoid new entries and protect open risk';
  }

  if (isBestExit) {
    return hasAsset && resistance ? `Book profits near resistance around ${resistance}` : 'Book profits into the close';
  }

  if (item.action === 'BUY' && item.type === 'Amrit') {
    return hasAsset && support ? `Scale strongest entries near support around ${support}` : 'Aggressive entries for the day';
  }

  if (item.action === 'BUY' && item.type === 'Labh') {
    return hasAsset && support ? `Early positioning on dips near ${support}` : 'Early positioning on any dips';
  }

  if (item.action === 'BUY') {
    return 'Add positions only if momentum builds';
  }

  if (item.action === 'SELL') {
    return 'Light profit-taking or reduce exposure';
  }

  return 'Selective momentum trades only';
}

export default function CleanTrade() {
  const { user } = useAuth();
  const savedAscendant = user?.astrologyProfile?.ascendant?.westernName || '';
  const [form, setForm] = useState({
    targetDate: todayIso(),
    location: 'Cumming, Georgia, USA',
    asset: 'AVGO',
    ascendant: savedAscendant
  });
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoRanRef = useRef(false);
  const requestIdRef = useRef(0);

  const hasAsset = Boolean(analysis?.assetAnalysis?.asset);
  const hasAscendant = Boolean(analysis?.input?.ascendant && analysis?.ascendantInsights);
  const disclaimer = useMemo(() => 'Timing intelligence only. This is not investment, trading, tax, or financial advice.', []);

  function updateField(event) {
    const { name, value } = event.target;
    const nextValue = name === 'asset' ? value.toUpperCase().split(/[\s,]+/)[0] : value;

    setForm((current) => ({ ...current, [name]: nextValue }));
  }

  async function runAnalysis(nextForm, { auto = false } = {}) {
    if (isSubmitting) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        targetDate: nextForm.targetDate,
        location: nextForm.location || 'Cumming, Georgia, USA',
        asset: nextForm.asset.trim() || undefined,
        ascendant: nextForm.ascendant || savedAscendant || undefined,
        saveHistory: !auto
      };
      const data = await api.cleanTradeAnalysis(payload);

      if (requestId === requestIdRef.current) {
        setAnalysis(data);
      }
    } catch (nextError) {
      if (requestId === requestIdRef.current) {
        setError(auto ? `Default analysis failed: ${nextError.message}` : nextError.message);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSubmitting(false);
      }
    }
  }

  useEffect(() => {
    setForm((current) => ({
      ...current,
      location: current.location || 'Cumming, Georgia, USA',
      ascendant: current.ascendant || savedAscendant
    }));
  }, [savedAscendant]);

  useEffect(() => {
    if (autoRanRef.current || !form.targetDate) {
      return;
    }

    autoRanRef.current = true;
    runAnalysis(form, { auto: true });
  }, [form]);

  async function handleSubmit(event) {
    event.preventDefault();
    runAnalysis(form);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Clean Trade</p>
          <h1>Clean Trade Engine</h1>
        </div>
      </div>

      <Row className="g-3">
        <Col lg="4">
          <Card className="panel-card">
            <CardBody>
              <h4>Input panel</h4>
              <p className="text-muted">{disclaimer}</p>
              <AlertMessage message={error} />
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Target date</Label>
                  <Input name="targetDate" type="date" value={form.targetDate} onChange={updateField} required />
                </FormGroup>
                <FormGroup>
                  <Label>Location</Label>
                  <Input name="location" value={form.location} onChange={updateField} placeholder="Cumming, Georgia, USA" />
                </FormGroup>
                <FormGroup>
                  <Label>Asset</Label>
                  <Input name="asset" value={form.asset} onChange={updateField} placeholder="AVGO" maxLength={16} />
                  <small className="text-muted">Use one asset symbol at a time.</small>
                </FormGroup>
                <FormGroup>
                  <Label>Ascendant</Label>
                  <Input name="ascendant" type="select" value={form.ascendant} onChange={updateField}>
                    {ascendants.map((item) => (
                      <option value={item} key={item || 'blank'}>
                        {item || 'None'}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
                <Button color="primary" disabled={isSubmitting} className="w-100">
                  {isSubmitting ? 'Analyzing...' : 'Run analysis'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col lg="8">
          {!analysis && (
            <Card className="panel-card empty-state compact">
              <CardBody>
                <h4>{isSubmitting ? 'Initializing clean trade analysis...' : 'No clean trade analysis yet'}</h4>
                <p className="text-muted mb-0">
                  {isSubmitting
                    ? 'Generating default timing windows from the best available date, location, and ascendant.'
                    : 'Adjust the criteria and run the engine to generate timing windows from sunrise to sunset.'}
                </p>
              </CardBody>
            </Card>
          )}

          {analysis && (
            <>
              <Row className="g-3">
                <Col md="4">
                  <Card className="stat-card trade-summary-card trade-buy">
                    <CardBody>
                      <div className="stat-label">Best Buy Window</div>
                      <strong>{analysis.summary.bestBuyWindow}</strong>
                    </CardBody>
                  </Card>
                </Col>
                <Col md="4">
                  <Card className="stat-card trade-summary-card trade-sell">
                    <CardBody>
                      <div className="stat-label">Best Exit Window</div>
                      <strong>{analysis.summary.bestExitWindow}</strong>
                    </CardBody>
                  </Card>
                </Col>
                <Col md="4">
                  <Card className="stat-card trade-summary-card trade-risk">
                    <CardBody>
                      <div className="stat-label">Highest Risk Window</div>
                      <strong>{analysis.summary.highestRiskWindow}</strong>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              <Card className="panel-card mt-3">
                <CardBody>
                  <h4>Chronological Trading Script</h4>
                  <div className="table-responsive">
                    <Table className="trade-table trade-script-table align-middle">
                      <thead>
                        <tr>
                          <th>Sequence</th>
                          <th>Time Block</th>
                          <th>Action Type</th>
                          <th>Specific Instructions</th>
                          <th>Risk Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.choghadiyaTable.map((item, index) => (
                          <tr className={getRowClass(item)} key={`${item.timeBlock}-${item.type}`}>
                            <td>{index + 1}</td>
                            <td>{item.timeBlock}</td>
                            <td>
                              <strong>{getScriptAction(item, analysis)}</strong>
                            </td>
                            <td>
                              {getSpecificInstruction(item, analysis)}
                            </td>
                            <td>
                              <Badge color={getRiskColor(item.risk)}>{item.risk}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </CardBody>
              </Card>

              <Row className="g-3 mt-1">
                {hasAsset && (
                  <Col lg="6">
                    <Card className="panel-card h-100">
                      <CardBody>
                        <h4>Asset analysis</h4>
                        <div className="profile-summary-list">
                          <div>
                            <span>Used asset</span>
                            <strong>{analysis.assetAnalysis.asset}</strong>
                          </div>
                          <div>
                            <span>Current price</span>
                            <strong>{analysis.assetAnalysis.currentPrice || 'Unavailable'}</strong>
                          </div>
                          <div>
                            <span>Support</span>
                            <strong>{analysis.assetAnalysis.support}</strong>
                          </div>
                          <div>
                            <span>Resistance</span>
                            <strong>{analysis.assetAnalysis.resistance}</strong>
                          </div>
                          <div>
                            <span>Trend bias</span>
                            <strong>{analysis.assetAnalysis.trendBias}</strong>
                          </div>
                          <div>
                            <span>Data source</span>
                            <strong>{analysis.assetAnalysis.dataSource || 'Unavailable'}</strong>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                )}

                <Col lg={hasAsset ? '6' : '12'}>
                  <Card className="panel-card h-100">
                    <CardBody>
                      <h4>Risk panel</h4>
                      <div className="mini-panel mb-3">
                        <strong>{analysis.riskEngine.rahuKaal}</strong>
                      </div>
                      <h5>High risk zones</h5>
                      {analysis.riskEngine.highRiskZones.length ? (
                        <div className="table-responsive mb-3">
                          <Table className="trade-table align-middle mb-0">
                            <thead>
                              <tr>
                                <th>Time Block</th>
                                <th>Risk</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analysis.riskEngine.highRiskZones.map((zone) => {
                                const item = typeof zone === 'string' ? { timeBlock: zone.split(': ')[0], risk: 'HIGH', notes: zone } : zone;

                                return (
                                  <tr className="trade-row-high" key={`${item.timeBlock}-${item.notes}`}>
                                    <td>{item.timeBlock}</td>
                                    <td>
                                      <Badge color={getRiskColor(item.risk || 'HIGH')}>{item.risk || 'HIGH'}</Badge>
                                    </td>
                                    <td>
                                      <ScoreNotes notes={item.notes} />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-muted">No high risk zones found.</p>
                      )}
                      <h5>Safe zones</h5>
                      {analysis.riskEngine.safeZones.length ? (
                        <div className="tag-group">
                          {analysis.riskEngine.safeZones.map((zone) => (
                            <span className="soft-tag day" key={zone}>
                              {zone}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted mb-0">No low-risk BUY safe zones found.</p>
                      )}
                    </CardBody>
                  </Card>
                </Col>

                {hasAscendant && (
                  <Col xs="12">
                    <Card className="panel-card">
                      <CardBody>
                        <h4>Ascendant panel</h4>
                        <p className="lead-copy mb-0">{analysis.ascendantInsights}</p>
                      </CardBody>
                    </Card>
                  </Col>
                )}
              </Row>
            </>
          )}
        </Col>
      </Row>
    </>
  );
}
