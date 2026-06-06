import React, { useEffect, useMemo, useState } from 'react';
import { Button, ButtonGroup, Card, CardBody, Col, Row } from 'reactstrap';
import AlertMessage from '../components/AlertMessage';
import { api } from '../services/api';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'profile', label: 'Profile' },
  { value: 'forecast', label: 'Forecast' },
  { value: 'compatibility', label: 'Compatibility' },
  { value: 'loshu', label: 'Lo Shu' },
  { value: 'cleanTrade', label: 'Clean Trade' },
  { value: 'stockOutlook', label: 'Stock Outlook' }
];

function titleCase(value) {
  if (value === 'loshu') {
    return 'Lo Shu';
  }

  if (value === 'cleanTrade') {
    return 'Clean Trade';
  }

  if (value === 'stockOutlook') {
    return 'Stock Outlook';
  }

  return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
}

function formatDate(value) {
  if (!value) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function inputSummary(item) {
  const input = item.input || {};

  if (item.type === 'profile') {
    return [input.fullName, input.dateOfBirth].filter(Boolean).join(' | ');
  }

  if (item.type === 'forecast') {
    return [input.dateOfBirth && `DOB ${input.dateOfBirth}`, input.forecastDate && `Forecast ${input.forecastDate}`].filter(Boolean).join(' | ');
  }

  if (item.type === 'compatibility') {
    return [input.first, input.second].filter(Boolean).join(' vs ');
  }

  if (item.type === 'loshu') {
    return input.dob ? `DOB ${input.dob}` : '';
  }

  if (item.type === 'cleanTrade') {
    return [
      input.asset,
      input.targetDate && `Date ${input.targetDate}`,
      input.location,
      input.ascendant && `Ascendant ${input.ascendant}`
    ].filter(Boolean).join(' | ');
  }

  if (item.type === 'stockOutlook') {
    return [
      input.asset,
      input.targetPeriod,
      input.currentDate && `Date ${input.currentDate}`
    ].filter(Boolean).join(' | ');
  }

  return 'Saved calculation';
}

function resultSummary(item) {
  const result = item.result || {};

  if (item.type === 'profile') {
    return `Psychic ${result.psychic ?? '-'}, Destiny ${result.destiny ?? '-'}, Name ${result.nameNumber ?? '-'}`;
  }

  if (item.type === 'forecast') {
    return `Personal day ${result.personalDay ?? '-'}${result.focusArea ? ` | ${result.focusArea}` : ''}`;
  }

  if (item.type === 'compatibility') {
    return `Score ${result.compatibilityScore ?? '-'}${result.explanation ? ` | ${result.explanation}` : ''}`;
  }

  if (item.type === 'loshu') {
    const missing = result.missingNumbers?.length ? result.missingNumbers.join(', ') : 'none';
    const repeated = result.repeatedNumbers?.length ? result.repeatedNumbers.join(', ') : 'none';
    return `Missing ${missing} | Repeated ${repeated}`;
  }

  if (item.type === 'cleanTrade') {
    return [
      result.summary?.bestBuyWindow && `Buy ${result.summary.bestBuyWindow}`,
      result.summary?.bestExitWindow && `Exit ${result.summary.bestExitWindow}`,
      result.summary?.highestRiskWindow && `Risk ${result.summary.highestRiskWindow}`
    ].filter(Boolean).join(' | ') || 'Clean Trade analysis saved';
  }

  if (item.type === 'stockOutlook') {
    return [
      result.snapshot?.price && `Price ${result.snapshot.price}`,
      result.snapshot?.sentiment,
      result.verdict?.rating && `Rating ${result.verdict.rating}`,
      result.dataSource
    ].filter(Boolean).join(' | ') || 'Stock Outlook saved';
  }

  return 'Result saved';
}

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      setLoading(true);
      setError('');

      try {
        const data = await api.fetchCalculationHistory();
        if (active) {
          setHistory(data.history || []);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, []);

  const filteredHistory = useMemo(() => {
    if (filter === 'all') {
      return history;
    }

    return history.filter((item) => item.type === filter);
  }, [filter, history]);

  async function handleClear() {
    if (clearing || !history.length) {
      return;
    }

    const confirmed = window.confirm('Clear all calculation history?');

    if (!confirmed) {
      return;
    }

    setClearing(true);
    setError('');
    const previousHistory = history;
    setHistory([]);

    try {
      await api.clearCalculationHistory();
    } catch (nextError) {
      setHistory(previousHistory);
      setError(nextError.message);
    } finally {
      setClearing(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">History</p>
          <h1>Recent calculations</h1>
        </div>
        <Button color="danger" outline disabled={clearing || !history.length} onClick={handleClear}>
          {clearing ? 'Clearing...' : 'Clear history'}
        </Button>
      </div>

      <AlertMessage message={error} />

      <Card className="panel-card mb-3">
        <CardBody>
          <ButtonGroup className="history-filters">
            {filters.map((item) => (
              <Button key={item.value} color={filter === item.value ? 'primary' : 'light'} onClick={() => setFilter(item.value)}>
                {item.label}
              </Button>
            ))}
          </ButtonGroup>
        </CardBody>
      </Card>

      {loading && (
        <Card className="panel-card empty-state compact">
          <CardBody>
            <h4>Loading history...</h4>
          </CardBody>
        </Card>
      )}

      {!loading && !filteredHistory.length && (
        <Card className="panel-card empty-state compact">
          <CardBody>
            <h4>No calculations found</h4>
            <p className="text-muted mb-0">
              {history.length ? 'No saved calculations match this filter.' : 'Run a profile, forecast, compatibility, Lo Shu, Clean Trade, or Stock Outlook calculation to populate history.'}
            </p>
          </CardBody>
        </Card>
      )}

      {!loading && Boolean(filteredHistory.length) && (
        <Row className="g-3">
          {filteredHistory.map((item, index) => (
            <Col lg="6" key={item._id || item.id || `${item.type}-${item.createdAt}-${index}`}>
              <Card className="panel-card history-card h-100">
                <CardBody>
                  <div className="history-card-header">
                    <span className={`history-type history-type-${item.type}`}>{titleCase(item.type)}</span>
                    <small>{formatDate(item.createdAt)}</small>
                  </div>
                  <div className="history-summary">
                    <span>Input</span>
                    <p>{inputSummary(item) || 'No input details saved'}</p>
                  </div>
                  <div className="history-summary">
                    <span>Result</span>
                    <p>{resultSummary(item)}</p>
                  </div>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  );
}
