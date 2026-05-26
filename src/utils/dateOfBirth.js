import { getStoredDateOfBirth, setStoredDateOfBirth } from './storage';

export function resolveDateOfBirth(user) {
  return user?.dateOfBirth || user?.profile?.source?.dateOfBirth || getStoredDateOfBirth() || '';
}

export function rememberDateOfBirth(dateOfBirth) {
  if (dateOfBirth) {
    setStoredDateOfBirth(dateOfBirth);
  }
}
