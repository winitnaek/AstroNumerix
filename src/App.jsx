import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import AppLayout from './components/AppLayout';
import AuthLayout from './components/AuthLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CalculatorPage from './pages/CalculatorPage';
import ForecastPage from './pages/ForecastPage';
import CompatibilityPage from './pages/CompatibilityPage';
import LoShuGrid from './pages/LoShuGrid';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import CleanTrade from './pages/CleanTrade';
import StockOutlook from './pages/StockOutlook';

function ProtectedRoute({ children }) {
  const { token, isBooting } = useAuth();

  if (isBooting) {
    return <div className="app-loader">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { token, isBooting } = useAuth();

  if (isBooting) {
    return <div className="app-loader">Loading...</div>;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPasswordPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                <PublicOnlyRoute>
                  <ResetPasswordPage />
                </PublicOnlyRoute>
              }
            />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/compatibility" element={<CompatibilityPage />} />
            <Route path="/loshu" element={<LoShuGrid />} />
            <Route path="/clean-trade" element={<CleanTrade />} />
            <Route path="/stock-outlook" element={<StockOutlook />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
