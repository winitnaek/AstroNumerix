import React from 'react';
import { Outlet } from 'react-router-dom';
import { Col, Container, Row } from 'reactstrap';

function BrandMark() {
  return (
    <span className="brand-mark">
      <span className="brand-icon" aria-hidden="true">
        AN
      </span>
      <span>AstroNumerix</span>
    </span>
  );
}

export default function AuthLayout() {
  return (
    <main className="auth-page">
      <Container fluid className="h-100">
        <Row className="h-100 align-items-center justify-content-center">
          <Col xs="12" md="7" lg="5" xl="4">
            <div className="auth-card">
              <div className="mb-4">
                <BrandMark />
              </div>
              <Outlet />
            </div>
          </Col>
          <Col lg="5" className="d-none d-lg-block">
            <div className="auth-panel">
              <p className="eyebrow">SaaS Numerology Platform</p>
              <h1>Turn birth data and names into clear daily insights.</h1>
              <p>
                Secure profiles, deterministic calculations, and simple dashboards designed for repeat use.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
