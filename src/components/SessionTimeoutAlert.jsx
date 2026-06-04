import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button } from 'reactstrap';
import { useAuth } from '../utils/AuthContext';

const DEFAULT_TIMEOUT_MINUTES = 15;
const DEFAULT_WARNING_SECONDS = 60;

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export default function SessionTimeoutAlert() {
  const { signOut } = useAuth();
  const sessionTimeoutMinutes = Number(process.env.SESSION_TIMEOUT_MINUTES || DEFAULT_TIMEOUT_MINUTES);
  const warningSeconds = Number(process.env.SESSION_TIMEOUT_WARNING_SECONDS || DEFAULT_WARNING_SECONDS);
  const timeoutMs = Math.max(1, sessionTimeoutMinutes) * 60 * 1000;
  const warningMs = Math.min(Math.max(1, warningSeconds) * 1000, timeoutMs - 1000);

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(timeoutMs / 1000));
  const [isExpired, setIsExpired] = useState(false);
  const timers = useRef({ warning: null, expire: null, countdown: null });
  const expiryAtRef = useRef(Date.now() + timeoutMs);

  const clearTimers = useCallback(() => {
    window.clearTimeout(timers.current.warning);
    window.clearTimeout(timers.current.expire);
    window.clearInterval(timers.current.countdown);
    timers.current = { warning: null, expire: null, countdown: null };
  }, []);

  const scheduleTimers = useCallback(
    (startAt = Date.now()) => {
      clearTimers();
      const expireAt = startAt + timeoutMs;
      expiryAtRef.current = expireAt;
      setSecondsRemaining(Math.ceil((expireAt - Date.now()) / 1000));
      setShowWarning(false);
      setIsExpired(false);

      const warningDelay = Math.max(0, expireAt - warningMs - Date.now());
      timers.current.warning = window.setTimeout(() => {
        setShowWarning(true);
      }, warningDelay);

      timers.current.expire = window.setTimeout(() => {
        setIsExpired(true);
        signOut();
      }, Math.max(0, expireAt - Date.now()));

      timers.current.countdown = window.setInterval(() => {
        const remaining = Math.max(0, Math.ceil((expiryAtRef.current - Date.now()) / 1000));
        setSecondsRemaining(remaining);
      }, 1000);
    },
    [clearTimers, signOut, timeoutMs, warningMs]
  );

  const resetSessionTimer = useCallback(() => {
    if (isExpired) {
      return;
    }
    scheduleTimers();
  }, [isExpired, scheduleTimers]);

  useEffect(() => {
    scheduleTimers();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetSessionTimer();

    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity));

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      clearTimers();
    };
  }, [clearTimers, resetSessionTimer, scheduleTimers]);

  if (!showWarning || isExpired) {
    return null;
  }

  return (
    <Alert color="warning" className="session-timeout-alert" fade={false}>
      <div className="session-timeout-alert-content">
        <div className="session-timeout-alert-text">
          Your session will expire in <strong>{formatDuration(secondsRemaining)}</strong> due to inactivity.
          <div className="session-timeout-alert-subtext">Move the mouse, press a key, or tap to stay signed in.</div>
        </div>
        <div className="session-timeout-alert-actions">
          <Button color="secondary" size="sm" onClick={resetSessionTimer} className="me-2">
            Stay signed in
          </Button>
          <Button color="danger" size="sm" onClick={signOut}>
            Sign out now
          </Button>
        </div>
      </div>
    </Alert>
  );
}
