import React from 'react';
import { Card, CardBody } from 'reactstrap';

export default function StatCard({ label, value, tone = 'blue' }) {
  return (
    <Card className={`stat-card tone-${tone}`}>
      <CardBody>
        <div className="stat-value">{value ?? '-'}</div>
        <div className="stat-label">{label}</div>
      </CardBody>
    </Card>
  );
}
