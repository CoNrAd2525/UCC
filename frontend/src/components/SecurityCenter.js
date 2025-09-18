import React, { useEffect, useState } from 'react';
import useApi from '../hooks/useApi';

const SecurityCenter = () => {
  const api = useApi();
  const [overview, setOverview] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [overviewRes, alertsRes, eventsRes] = await Promise.all([
        api.get('/api/security/overview'),
        api.get('/api/security/alerts'),
        api.get('/api/security/events')
      ]);
      setOverview(overviewRes.data);
      setAlerts(alertsRes.data);
      setEvents(eventsRes.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="security-center">
      <div className="container-fluid">
        <div className="row mb-3">
          <div className="col-12 d-flex justify-content-between align-items-center">
            <div>
              <h2>Security Center</h2>
              <p className="text-muted">Monitor security and manage agent verification</p>
            </div>
            <button className="btn btn-outline-secondary" onClick={fetchAll}>
              <i className="fas fa-sync-alt me-1"></i>
              Refresh
            </button>
          </div>
        </div>

        {overview && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body d-flex justify-content-between">
                  <div>
                    <h3 className="mb-0">{overview.totalAgents}</h3>
                    <p className="mb-0">Total Agents</p>
                  </div>
                  <i className="fas fa-robot fa-2x"></i>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body d-flex justify-content-between">
                  <div>
                    <h3 className="mb-0">{overview.verifiedAgents}</h3>
                    <p className="mb-0">Verified</p>
                  </div>
                  <i className="fas fa-badge-check fa-2x"></i>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body d-flex justify-content-between">
                  <div>
                    <h3 className="mb-0">{overview.unverifiedAgents}</h3>
                    <p className="mb-0">Unverified</p>
                  </div>
                  <i className="fas fa-user-shield fa-2x"></i>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-danger text-white">
                <div className="card-body d-flex justify-content-between">
                  <div>
                    <h3 className="mb-0">{overview.criticalAgents}</n3>
                    <p className="mb-0">Critical</p>
                  </div>
                  <i className="fas fa-exclamation-triangle fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-lg-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Security Alerts</h5>
              </div>
              <div className="card-body">
                {alerts.length === 0 ? (
                  <p className="text-muted">No alerts.</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {alerts.map(alert => (
                      <div key={alert.id} className="list-group-item">
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="fw-bold">{alert.title}</div>
                            <small className="text-muted">{alert.message}</small>
                          </div>
                          <span className={`badge bg-${alert.severity === 'warning' ? 'warning' : alert.severity === 'critical' ? 'danger' : 'secondary'}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <small className="text-muted">{new Date(alert.createdAt).toLocaleString()}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Security Events</h5>
              </div>
              <div className="card-body">
                {events.length === 0 ? (
                  <p className="text-muted">No security events.</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {events.map((e, idx) => (
                      <div key={idx} className="list-group-item">
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="fw-bold">{e.type}</div>
                            <small className="text-muted">{e.message}</small>
                          </div>
                          <span className={`badge bg-${e.severity === 'warning' ? 'warning' : e.severity === 'critical' ? 'danger' : 'secondary'}`}>
                            {e.severity}
                          </span>
                        </div>
                        <small className="text-muted">{new Date(e.timestamp).toLocaleString()}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityCenter;