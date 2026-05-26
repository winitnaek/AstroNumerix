const TOKEN_KEY = 'numerology.token';
const USER_KEY = 'numerology.user';
const DOB_KEY = 'numerology.dateOfBirth';

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser() {
  const value = window.localStorage.getItem(USER_KEY);
  return value ? JSON.parse(value) : null;
}

export function setStoredUser(user) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  window.localStorage.removeItem(USER_KEY);
}

export function getStoredDateOfBirth() {
  return window.localStorage.getItem(DOB_KEY);
}

export function setStoredDateOfBirth(dateOfBirth) {
  if (dateOfBirth) {
    window.localStorage.setItem(DOB_KEY, dateOfBirth);
  }
}

export function clearStoredDateOfBirth() {
  window.localStorage.removeItem(DOB_KEY);
}
