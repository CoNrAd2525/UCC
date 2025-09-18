import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AgentManagement from './components/AgentManagement';
import TaskManagement from './components/TaskManagement';
import SecurityCenter from './components/SecurityCenter';
import AgentScanner from './components/AgentScanner';
import Analytics from './components/Analytics';
import AgentChat from './components/AgentChat';
import Navigation from './components/Navigation';
import './App.css';

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
    return <Login />;
  }

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agents" element={<AgentManagement />} />
          <Route path="/tasks" element={<TaskManagement />} />
          <Route path="/security" element={<SecurityCenter />} />
          <Route path="/scanner" element={<AgentScanner />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;