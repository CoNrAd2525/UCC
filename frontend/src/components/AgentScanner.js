import React, { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';

const AgentScanner = () => {
  const [scanId, setScanId] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  
  const api = useApi();

  // Fetch scan history on component mount
  useEffect(() => {
    fetchScanHistory();
  }, []);

  // Poll for scan status when scanning
  useEffect(() => {
    if (scanId && isScanning) {
      const interval = setInterval(() => {
        pollScanStatus(scanId);
      }, 2000);
      setPollingInterval(interval);
      
      return () => clearInterval(interval);
    }
  }, [scanId, isScanning]);

  const fetchScanHistory = async () => {
    try {
      const response = await api.get('/api/scan/history');
      setScanHistory(response.data);
    } catch (error) {
      console.error('Error fetching scan history:', error);
    }
  };

  const initiateScan = async (parameters = {}) => {
    try {
      setIsScanning(true);
      setScanResults(null);
      setScanProgress(0);
      
      const response = await api.post('/api/scan/initiate', { parameters });
      setScanId(response.data.scanId);
      setScanStatus(response.data.status);
    } catch (error) {
      console.error('Error initiating scan:', error);
      setIsScanning(false);
    }
  };

  const pollScanStatus = async (id) => {
    try {
      const response = await api.get(`/api/scan/status/${id}`);
      const scan = response.data;
      
      setScanStatus(scan.status);
      setScanProgress(scan.progress || 0);
      
      if (scan.status === 'completed') {
        setIsScanning(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        fetchScanResults(id);
        fetchScanHistory(); // Refresh history
      } else if (scan.status === 'error') {
        setIsScanning(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      }
    } catch (error) {
      console.error('Error polling scan status:', error);
    }
  };

  const fetchScanResults = async (id) => {
    try {
      const response = await api.get(`/api/scan/report/${id}`);
      setScanResults(response.data);
    } catch (error) {
      console.error('Error fetching scan results:', error);
    }
  };

  const downloadReport = () => {
    if (!scanResults) return;
    
    const reportData = JSON.stringify(scanResults, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-scan-report-${scanId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getHealthBadgeColor = (health) => {
    switch (health) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'slow': return 'warning';
      case 'unresponsive': return 'danger';
      default: return 'secondary';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="agent-scanner">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="scanner-header d-flex justify-content-between align-items-center mb-4">
              <h2>Agent Scanner</h2>
              <div className="scanner-actions">
                <button 
                  className="btn btn-primary me-2" 
                  onClick={() => initiateScan()}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Scanning...
                    </>
                  ) : 'Initiate Scan'}
                </button>
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={fetchScanHistory}
                >
                  Refresh History
                </button>
              </div>
            </div>

            {scanStatus && (
              <div className="scan-status mb-4">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Current Scan Status</h5>
                    <p className="card-text">Status: <span className="badge bg-primary">{scanStatus}</span></p>
                    <div className="progress mb-2">
                      <div 
                        className="progress-bar" 
                        role="progressbar" 
                        style={{ width: `${scanProgress}%` }}
                        aria-valuenow={scanProgress} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      >
                        {scanProgress}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {scanResults && (
              <div className="scan-results mb-4">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Scan Results</h5>
                    <button className="btn btn-outline-primary btn-sm" onClick={downloadReport}>
                      <i className="fas fa-download me-2"></i>Download Report
                    </button>
                  </div>
                  <div className="card-body">
                    
                    {/* Summary */}
                    <div className="row mb-4">
                      <div className="col-md-3">
                        <div className="stat-card bg-primary text-white">
                          <div className="stat-value">{scanResults.summary.totalAgents}</div>
                          <div className="stat-label">Total Agents</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="stat-card bg-success text-white">
                          <div className="stat-value">{scanResults.summary.healthyAgents}</div>
                          <div className="stat-label">Healthy Agents</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="stat-card bg-warning text-white">
                          <div className="stat-value">{scanResults.summary.issuesFound}</div>
                          <div className="stat-label">Issues Found</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="stat-card bg-danger text-white">
                          <div className="stat-value">{scanResults.summary.criticalIssues}</div>
                          <div className="stat-label">Critical Issues</div>
                        </div>
                      </div>
                    </div>

                    {/* Agent Health Grid */}
                    <div className="agents-section mb-4">
                      <h6>Agent Health Status</h6>
                      <div className="row">
                        {scanResults.agents.map(agent => (
                          <div key={agent.id} className="col-md-6 col-lg-4 mb-3">
                            <div className="card agent-health-card">
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="card-title mb-0">{agent.name}</h6>
                                  <span className={`badge bg-${getHealthBadgeColor(agent.health)}`}>
                                    {agent.health}
                                  </span>
                                </div>
                                <div className="agent-details">
                                  <small className="text-muted d-block">Type: {agent.type}</small>
                                  <small className="text-muted d-block">Status: {agent.status}</small>
                                  <small className="text-muted d-block">
                                    Response Time: {Math.round(agent.responseTime)}ms
                                  </small>
                                  <small className="text-muted d-block">
                                    Success Rate: {Math.round(agent.metrics.successRate * 100)}%
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Issues */}
                    {scanResults.issues.length > 0 && (
                      <div className="issues-section mb-4">
                        <h6>Issues Found</h6>
                        <div className="list-group">
                          {scanResults.issues.map((issue, index) => (
                            <div key={index} className="list-group-item">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="ms-2 me-auto">
                                  <div className="fw-bold">{issue.message}</div>
                                  <small className="text-muted">{issue.type}</small>
                                </div>
                                <span className={`badge bg-${getSeverityColor(issue.severity)}`}>
                                  {issue.severity}
                                </span>
                              </div>
                              <small className="text-muted">
                                {new Date(issue.timestamp).toLocaleString()}
                              </small>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {scanResults.recommendations.length > 0 && (
                      <div className="recommendations-section">
                        <h6>Recommendations</h6>
                        <div className="accordion" id="recommendationsAccordion">
                          {scanResults.recommendations.map((rec, index) => (
                            <div key={index} className="accordion-item">
                              <h2 className="accordion-header" id={`heading${index}`}>
                                <button 
                                  className="accordion-button collapsed" 
                                  type="button" 
                                  data-bs-toggle="collapse" 
                                  data-bs-target={`#collapse${index}`}
                                  aria-expanded="false" 
                                  aria-controls={`collapse${index}`}
                                >
                                  <span className={`badge bg-${getPriorityColor(rec.priority)} me-2`}>
                                    {rec.priority.toUpperCase()}
                                  </span>
                                  {rec.message}
                                </button>
                              </h2>
                              <div 
                                id={`collapse${index}`} 
                                className="accordion-collapse collapse" 
                                aria-labelledby={`heading${index}`}
                                data-bs-parent="#recommendationsAccordion"
                              >
                                <div className="accordion-body">
                                  <strong>Action:</strong> {rec.action}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Scan History */}
            <div className="scan-history">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Scan History</h5>
                </div>
                <div className="card-body">
                  {scanHistory.length === 0 ? (
                    <p className="text-muted">No scan history available.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Scan ID</th>
                            <th>Status</th>
                            <th>Start Time</th>
                            <th>Progress</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scanHistory.map(scan => (
                            <tr key={scan.id}>
                              <td>
                                <code>{scan.id.substring(0, 8)}...</code>
                              </td>
                              <td>
                                <span className={`badge bg-${scan.status === 'completed' ? 'success' : scan.status === 'error' ? 'danger' : 'primary'}`}>
                                  {scan.status}
                                </span>
                              </td>
                              <td>
                                {new Date(scan.startTime).toLocaleString()}
                              </td>
                              <td>
                                <div className="progress" style={{ height: '20px' }}>
                                  <div 
                                    className="progress-bar" 
                                    style={{ width: `${scan.progress || 0}%` }}
                                  >
                                    {scan.progress || 0}%
                                  </div>
                                </div>
                              </td>
                              <td>
                                {scan.status === 'completed' && (
                                  <button 
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => fetchScanResults(scan.id)}
                                  >
                                    View Report
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentScanner;