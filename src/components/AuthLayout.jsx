import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from 'reactstrap';

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
      <nav className="auth-navbar">
        <Container fluid className="auth-nav-inner">
          <BrandMark />
          <div className="auth-nav-links" aria-label="AstroNumerix landing sections">
            <a href="#trading-timing">Trading Timing</a>
            <a href="#numerology-profiles">Numerology Profiles</a>
            <a href="#name-energy">Name Energy</a>
            <a href="#daily-insights">Daily Insights</a>
          </div>
          <div className="auth-nav-actions">
            <a className="auth-mode-btn" href="#numerology-profiles">Numerology</a>
            <a className="auth-signin-btn" href="#login">Sign In</a>
          </div>
        </Container>
      </nav>

      <section className="auth-landing-hero">
        <Container fluid className="auth-container">
          <div className="auth-panel">
            <div className="auth-panel-content">
              <header className="auth-hero-header">
                <div className="auth-beta-pill">
                  <span aria-hidden="true" />
                  Now in Open Beta
                </div>
              </header>

              <div className="auth-hero-layout">
                <div className="auth-hero-copy">
                  <p className="eyebrow">AstroNumerix Intelligence Platform</p>
                  <h1>
                    Turn your <span>numbers</span> into daily power.
                  </h1>
                  <p className="auth-panel-lead">
                    Master timing, birth energy, and name vibrations with numerology intelligence for trading,
                    relationships, and personal growth.
                  </p>

                  <div className="auth-hero-actions">
                    <a className="auth-primary-cta" href="#login">
                      <span aria-hidden="true">-&gt;</span>
                      Start Free Today
                    </a>
                    <a className="auth-secondary-cta" href="#features">
                      <span aria-hidden="true">play</span>
                      Explore Features
                    </a>
                  </div>

                  <div className="auth-trust-row">
                    <div className="auth-avatar-stack" aria-hidden="true">
                      <span>TM</span>
                      <span>7</span>
                      <span>UP</span>
                    </div>
                    <div>
                      <strong>Built for traders and seekers</strong>
                      <small>Clean timing, numerology profiles, and daily guidance in one dashboard.</small>
                    </div>
                  </div>
                </div>

                <div className="auth-visual-wrap">
                  <div id="login" className="auth-card auth-card-embedded">
                    <div className="auth-card-brand">
                      <span className="brand-icon" aria-hidden="true">AN</span>
                      <span>Dashboard Access</span>
                    </div>
                    <Outlet />
                  </div>

                  <div className="auth-floating-card auth-floating-trade" id="trading-timing">
                    <span>Clean Trade Signal</span>
                    <strong>14:22 UTC</strong>
                    <small>Constructive window - timing aligned</small>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="auth-features-section" id="features">
        <Container fluid className="auth-wide-container">
          <div className="auth-section-heading">
            <span>Powerful Tools</span>
            <h2>Everything you need in one place</h2>
          </div>

          <div className="auth-tool-grid">
            <article className="auth-tool-card">
              <div className="auth-tool-icon auth-tool-amber">UP</div>
              <h3>Clean Trade Engine</h3>
              <p>
                Timing windows for cleaner entries, exits, and trim decisions during the day.
              </p>
              <span>Live Market Timing</span>
            </article>

            <article className="auth-tool-card" id="numerology-profiles">
              <div className="auth-tool-icon auth-tool-cyan">7</div>
              <h3>Birthdate Energy Map</h3>
              <p>
                Discover personal number cycles, strengths, challenges, and peak performance windows.
              </p>
              <span>Life Cycles</span>
            </article>

            <article className="auth-tool-card" id="name-energy">
              <div className="auth-tool-icon auth-tool-violet">NM</div>
              <h3>Name Correction</h3>
              <p>
                Compare name energy and create numerology profiles for stronger alignment.
              </p>
              <span>Vibrational Alignment</span>
            </article>

            <article className="auth-tool-card" id="daily-insights">
              <div className="auth-tool-icon auth-tool-emerald">DL</div>
              <h3>Daily Life Insights</h3>
              <p>
                Personalized daily guidance and decision context based on your numerology.
              </p>
              <span>Everyday Wisdom</span>
            </article>
          </div>
        </Container>
      </section>

      <section className="auth-final-cta">
        <Container fluid className="auth-wide-container">
          <div>
            <h2>Ready to align with your numbers?</h2>
            <p>Access your AstroNumerix dashboard and start building clearer daily timing.</p>
            <a href="#login">Access Your Dashboard Now <span aria-hidden="true">-&gt;</span></a>
            <small>No credit card required</small>
          </div>
        </Container>
      </section>

      <footer className="auth-footer">
        <Container fluid className="auth-wide-container">
          (c) 2026 AstroNumerix - Made with cosmic intention
        </Container>
      </footer>
    </main>
  );
}
