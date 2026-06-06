import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, CardBody, Col, Form, FormGroup, Input, Label, Row, Table } from 'reactstrap';
import AlertMessage from '../components/AlertMessage';
import { api } from '../services/api';
import { buildStockOutlook, normalizeTicker, validateTicker } from '../services/stockOutlook';

function getToneColor(tone) {
  if (tone === 'buy') {
    return 'success';
  }

  if (tone === 'trim') {
    return 'danger';
  }

  return 'warning';
}

function getSentimentTone(sentiment = '') {
  const value = sentiment.toLowerCase();

  if (value.includes('bullish')) {
    return 'buy';
  }

  if (value.includes('bearish')) {
    return 'trim';
  }

  return 'hold';
}

export default function StockOutlook() {
  const [assetInput, setAssetInput] = useState('AVGO');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outlook, setOutlook] = useState(null);
  const autoRanRef = useRef(false);
  const generatedDate = useMemo(() => new Date().toLocaleDateString(), [outlook?.asset]);

  function updateAsset(event) {
    setAssetInput(normalizeTicker(event.target.value));
  }

  async function fetchOutlook(symbol, { saveHistory = true, showFallback = true } = {}) {
    setAssetInput(symbol);
    setIsSubmitting(true);

    try {
      const data = await api.stockOutlook({ asset: symbol, saveHistory, allowFallback: false });
      setOutlook(data);
    } catch (nextError) {
      if (showFallback) {
        setOutlook(buildStockOutlook(symbol));
        setNotice(`Live market data unavailable: ${nextError.message}. Showing fallback outlook.`);
      } else {
        setOutlook(null);
        setNotice(`Live market data unavailable for ${symbol}. Generate again later or try another asset.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function generateOutlookForAsset() {
    const symbol = normalizeTicker(assetInput);
    const validationMessage = validateTicker(symbol);

    if (validationMessage) {
      setError(validationMessage);
      setNotice('');
      setOutlook(null);
      return;
    }

    setError('');
    setNotice('');
    fetchOutlook(symbol, { saveHistory: true, showFallback: true });
  }

  function handleSubmit(event) {
    event.preventDefault();
    generateOutlookForAsset();
  }

  useEffect(() => {
    if (autoRanRef.current) {
      return;
    }

    autoRanRef.current = true;
    fetchOutlook('AVGO', { saveHistory: false, showFallback: false });
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Stock Outlook</p>
          <h1>Stock Outlook Dashboard</h1>
        </div>
      </div>

      <Row className="g-3">
        <Col lg="4">
          <Card className="panel-card">
            <CardBody>
              <h4>Input panel</h4>
              <p className="text-muted">Short-term market dashboard for the next 1-2 weeks.</p>
              <AlertMessage message={error} />
              <AlertMessage message={notice} color="warning" />
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Asset symbol</Label>
                  <Input name="asset" value={assetInput} onChange={updateAsset} placeholder="AVGO" maxLength={10} />
                  <small className="text-muted">Try AVGO, NVDA, MSFT, TSLA, or AAPL.</small>
                </FormGroup>
                <FormGroup>
                  <Label>Target period</Label>
                  <Input value="Next 1-2 weeks" disabled />
                </FormGroup>
                <FormGroup>
                  <Label>Current date</Label>
                  <Input value={generatedDate} disabled />
                </FormGroup>
                <Button type="button" color="primary" className="w-100" disabled={isSubmitting} onClick={generateOutlookForAsset}>
                  {isSubmitting ? 'Fetching market data...' : 'Generate outlook'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col lg="8">
          {!outlook && (
            <Card className="panel-card empty-state compact">
              <CardBody>
                <h4>{isSubmitting ? 'Fetching live market data...' : 'No stock outlook available'}</h4>
                <p className="text-muted mb-0">
                  {isSubmitting ? 'Loading current price and trading zones for AVGO.' : 'Enter a valid ticker symbol to generate the dashboard.'}
                </p>
              </CardBody>
            </Card>
          )}

          {outlook && (
            <>
              <Card className="panel-card stock-outlook-header">
                <CardBody>
                  <div>
                    <p className="eyebrow mb-1">{outlook.targetPeriod}</p>
                    <h3>{outlook.asset} Dashboard</h3>
                    <small>{outlook.currentDate} | {outlook.dataSource}</small>
                  </div>
                  <Badge color={getToneColor(getSentimentTone(outlook.snapshot.sentiment))}>{outlook.verdict.rating}</Badge>
                </CardBody>
              </Card>

              <Row className="g-3 mt-1">
                <Col md="6">
                  <Card className="panel-card h-100">
                    <CardBody>
                      <h4>Current Snapshot</h4>
                      <div className="profile-summary-list compact-summary">
                        <div>
                          <span>Price</span>
                          <strong>{outlook.snapshot.price}</strong>
                        </div>
                        <div>
                          <span>Sentiment</span>
                          <strong>{outlook.snapshot.sentiment}</strong>
                        </div>
                        <div>
                          <span>Market Mood</span>
                          <strong>{outlook.snapshot.marketMood}</strong>
                        </div>
                        <div>
                          <span>Analyst Consensus</span>
                          <strong>{outlook.snapshot.analystConsensus}</strong>
                        </div>
                        <div>
                          <span>Recent Performance</span>
                          <strong>{outlook.snapshot.recentPerformanceNote}</strong>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                <Col md="6">
                  <Card className="panel-card h-100">
                    <CardBody>
                      <h4>Trading Zones</h4>
                      <div className="stock-zone-list">
                        <div className="stock-zone stock-zone-buy">
                          <span>Buy Zone</span>
                          <strong>{outlook.zones.buyZone}</strong>
                        </div>
                        <div className="stock-zone stock-zone-hold">
                          <span>Hold Zone</span>
                          <strong>{outlook.zones.holdZone}</strong>
                        </div>
                        <div className="stock-zone stock-zone-trim">
                          <span>Trim Zone</span>
                          <strong>{outlook.zones.trimZone}</strong>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                <Col md="6">
                  <Card className="panel-card h-100">
                    <CardBody>
                      <h4>Best Strategy</h4>
                      <div className="stock-strategy-list">
                        <div>
                          <Badge color="success">Buy</Badge>
                          <span>Near {outlook.strategy.buyNear}</span>
                        </div>
                        <div>
                          <Badge color="warning">Hold</Badge>
                          <span>While above {outlook.strategy.holdAbove}</span>
                        </div>
                        <div>
                          <Badge color="danger">Trim</Badge>
                          <span>Near {outlook.strategy.trimNear}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                <Col md="6">
                  <Card className="panel-card h-100">
                    <CardBody>
                      <h4>Action Summary</h4>
                      <div className="table-responsive">
                        <Table className="trade-table stock-action-table align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Price Range</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {outlook.actionSummary.map((item) => (
                              <tr key={`${item.priceRange}-${item.action}`} className={`stock-action-row stock-${item.tone}`}>
                                <td>{item.priceRange}</td>
                                <td>
                                  <Badge color={getToneColor(item.tone)}>{item.action}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                <Col xs="12">
                  <Card className={`panel-card stock-verdict-card stock-${getSentimentTone(outlook.snapshot.sentiment)}`}>
                    <CardBody>
                      <div>
                        <span>Final Verdict</span>
                        <strong>{outlook.verdict.rating}</strong>
                      </div>
                      <p>{outlook.verdict.conclusion}</p>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Col>
      </Row>
    </>
  );
}
