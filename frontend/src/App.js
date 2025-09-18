import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AgentManagement from './components/AgentManagement';
import AgentDetails from './components/AgentDetails';
import TaskManagement from './components/TaskManagement';
import SecurityCenter from './components/SecurityCenter';
import AgentScanner from './components/AgentScanner';
import Analytics from './components/Analytics';
import Revenue from './components/Revenue';
import AgentChat from './components/AgentChat';
import Users from './components/Users';
import Products from './components/Products';
import Listings from './components/Listings';
import { RequireAuth, RequireRole } from './components/RouteGuards';
import Navigation from './components/Navigation';
import './App.css';
import ResetPassword from './components/ResetPassword';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/agents" element={<RequireAuth><AgentManagement /></RequireAuth>} />
          <Route path="/agents/:id" element={<RequireAuth><AgentDetails /></RequireAuth>} />
          <Route path="/tasks" element={<RequireAuth><TaskManagement /></RequireAuth>} />
          <Route path="/security" element={<RequireAuth><SecurityCenter /></RequireAuth>} />
          <Route path="/scanner" element={<RequireAuth><AgentScanner /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
          <Route path="/chat" element={<RequireAuth><AgentChat /></RequireAuth>} />
          <Route path="/revenue" element={<RequireAuth><Revenue /></RequireAuth>} />
          <Route path="/admin/users" element={<RequireAuth><RequireRole role="admin"><Users /></RequireRole></RequireAuth>} />
          <Route path="/catalog/products" element={<RequireAuth><Products /></RequireAuth>} />
          <Route path="/catalog/listings" element={<RequireAuth><Listings /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;