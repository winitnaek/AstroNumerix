import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import {
  clearStoredUser,
  clearStoredDateOfBirth,
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken
} from './storage';
import { rememberDateOfBirth, resolveDateOfBirth } from './dateOfBirth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [user, setUser] = useState(getStoredUser());
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      if (!token) {
        setIsBooting(false);
        return;
      }

      try {
        const data = await api.fetchCurrentUser();
        setUser(data.user);
        setStoredUser(data.user);
        rememberDateOfBirth(resolveDateOfBirth(data.user));
      } catch (error) {
        clearToken();
        clearStoredUser();
        clearStoredDateOfBirth();
        setTokenState(null);
        setUser(null);
      } finally {
        setIsBooting(false);
      }
    }

    loadCurrentUser();
  }, [token]);

  const signIn = useCallback(({ token: nextToken, user: nextUser }) => {
    setToken(nextToken);
    setStoredUser(nextUser);
    rememberDateOfBirth(resolveDateOfBirth(nextUser));
    setTokenState(nextToken);
    setUser(nextUser);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setStoredUser(nextUser);
    rememberDateOfBirth(resolveDateOfBirth(nextUser));
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    clearStoredUser();
    clearStoredDateOfBirth();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isBooting,
      signIn,
      updateUser,
      signOut
    }),
    [isBooting, signIn, signOut, token, updateUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
