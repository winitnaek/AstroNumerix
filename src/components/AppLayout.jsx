import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Button,
  Collapse,
  Container,
  Navbar,
  NavbarBrand,
  NavbarToggler
} from 'reactstrap';
import { useAuth } from '../utils/AuthContext';
import SessionTimeoutAlert from './SessionTimeoutAlert';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/clean-trade', label: 'Clean Trade' },
  { to: '/stock-outlook', label: 'Stock Outlook' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/forecast', label: 'Forecast' },
  { to: '/compatibility', label: 'Compatibility' },
  { to: '/loshu', label: 'Lo Shu Grid' },
  { to: '/profile', label: 'Profile' },
  { to: '/history', label: 'History' }
];

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

function NavigationLinks({ onNavigate }) {
  return (
    <nav className="app-nav">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} onClick={onNavigate} className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const { signOut, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className="sidebar d-none d-lg-flex">
        <div>
          <BrandMark />
          <div className="sidebar-user">
            <span>{user?.name || 'Member'}</span>
            <small>{user?.email}</small>
          </div>
          <NavigationLinks />
        </div>
        <Button color="light" className="w-100" onClick={signOut}>
          Sign out
        </Button>
      </aside>

      <div className="main-panel">
        <Navbar expand="lg" className="mobile-navbar d-lg-none">
          <NavbarBrand>
            <BrandMark />
          </NavbarBrand>
          <NavbarToggler onClick={() => setIsOpen((value) => !value)} />
          <Collapse isOpen={isOpen} navbar>
            <NavigationLinks onNavigate={() => setIsOpen(false)} />
            <Button color="light" className="mt-3" onClick={signOut}>
              Sign out
            </Button>
          </Collapse>
        </Navbar>

        <Container fluid className="content-container">
          <SessionTimeoutAlert />
          <Outlet />
        </Container>
      </div>
    </div>
  );
}
