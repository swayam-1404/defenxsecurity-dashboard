import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import logo from "./assets/DxS.jpg";
import { Line } from "react-chartjs-2";
import { Link, Routes, Route } from "react-router-dom";
import {
  Chart as ChartJS,
  LineElement,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import NetMon from "./components/netmon/networkmonitoring";
import ThreatAlerts from "./components/alerts/alerts";
import LogPage from "./components/logs/logs";
import Report from "./components/reports/report";
ChartJS.register(
  LineElement,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function App() {
  const logsRef = useRef(null);
  const alertsRef = useRef(null);
  const incidentsRef = useRef(null);

  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeDevices: 0,
    incidents: 0,
    incidentsList: [],
    reports: 0,
    threatsDetected: 0,
    activeInactiveDevices: [70, 30],
    monthlyStats: [30, 50, 40, 70, 60],
    threatTrends: [40, 25, 60, 20, 45],
    logs: [],
    alerts: [],

    // added for top-talkers API
    topTalkers: [],
    bytesSentPerSec: 0,
    bytesRecvPerSec: 0,

    // history for the traffic graph (old -> new)
    rxHistory: Array(12).fill(0),
    txHistory: Array(12).fill(0),
  });

  // API endpoints (from prompt)
  const ALERTS_API = "http://3.120.210.220:8000/api/alerts/latest?limit=10";
  const LOGS_API = "http://3.120.210.220:8000/api/logs/recent?limit=50";
  const INCIDENTS_API = "http://3.120.210.220:8000/api/incidents/all";
  const SCAN_API = "http://3.120.210.220:8000/api/monitor/scan";

  // top-talkers endpoint (added)
  const TOP_TALKERS_API = "http://3.120.210.220:8000/api/network/top-talkers";

  // metrics endpoint (new)
  const METRICS_API = "http://3.120.210.220:8000/api/network/metrics";

  async function fetchAlerts() {
    try {
      const res = await fetch(ALERTS_API, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`Alerts HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data)
        ? data.map(a => ({
            alert_id: a.alert_id,
            type: a.type,
            severity: a.severity,
            message: a.message,
            timestamp: a.timestamp,
            ack: !!a.ack
          }))
        : [];
    } catch (err) {
      console.error("fetchAlerts error:", err);
      return [];
    }
  }

  async function fetchLogs() {
    try {
      const res = await fetch(LOGS_API, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`Logs HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data)
        ? data.map(l => ({
            log_id: l.log_id,
            timestamp: l.timestamp,
            source: l.source,
            message: l.message,
            severity: l.severity,
          }))
        : [];
    } catch (err) {
      console.error("fetchLogs error:", err);
      return [];
    }
  }

  async function fetchIncidents() {
    try {
      const res = await fetch(INCIDENTS_API, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`Incidents HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data.map(i => ({
        incident_id: i.incident_id,
        timestamp: i.timestamp,
        type: i.type,
        severity: i.severity,
        status: i.status,
        source: i.source,
        details: i.details
      })) : [];
    } catch (err) {
      console.error("fetchIncidents error:", err);
      return [];
    }
  }

  // fetch top talkers
  async function fetchTopTalkers() {
    try {
      const res = await fetch(TOP_TALKERS_API, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`Top-talkers HTTP ${res.status}`);
      const data = await res.json();
      // expected shape: { timestamp, top_talkers: [{ip, bytes}], bytes_sent_per_sec, bytes_recv_per_sec }
      return {
        topTalkers: Array.isArray(data.top_talkers) ? data.top_talkers.map(t => ({ ip: t.ip, bytes: t.bytes })) : [],
        bytesSentPerSec: data.bytes_sent_per_sec ?? 0,
        bytesRecvPerSec: data.bytes_recv_per_sec ?? 0,
        timestamp: data.timestamp
      };
    } catch (err) {
      console.error("fetchTopTalkers error:", err);
      return { topTalkers: [], bytesSentPerSec: 0, bytesRecvPerSec: 0, timestamp: null };
    }
  }

  // fetch metrics for updating chart
  async function fetchMetrics() {
    try {
      const res = await fetch(METRICS_API, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`Metrics HTTP ${res.status}`);
      const data = await res.json();
      // returns bytes_sent_per_sec and bytes_recv_per_sec
      return {
        bytesSentPerSec: Number(data.bytes_sent_per_sec ?? 0),
        bytesRecvPerSec: Number(data.bytes_recv_per_sec ?? 0),
        bytes_sent: Number(data.bytes_sent ?? 0),
        bytes_recv: Number(data.bytes_recv ?? 0),
        timestamp: data.timestamp
      };
    } catch (err) {
      console.error("fetchMetrics error:", err);
      return { bytesSentPerSec: 0, bytesRecvPerSec: 0, bytes_sent: 0, bytes_recv: 0, timestamp: null };
    }
  }

  async function handleScanStart() {
    try {
      // schedule scan (body [0] as per prompt)
      const res = await fetch(SCAN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify([0])
      });
      const body = await res.json();
      // show confirmation and optionally refresh metrics
      alert(body?.message ? `${body.message} (${body.target})` : "Scan scheduled");
      // fetch latest once after scheduling
      await loadAllOnce();
    } catch (err) {
      console.error("Scan error:", err);
      alert("Failed to schedule scan.");
    }
  }

  // helper to format bytes
  function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return "";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    let b = Math.abs(bytes);
    while (b >= 1024 && i < units.length - 1) {
      b /= 1024;
      i++;
    }
    return `${bytes < 0 ? "-" : ""}${b.toFixed(b < 10 && i > 0 ? 2 : 0)} ${units[i]}`;
  }

  // load all APIs (alerts, logs, incidents) + top talkers + metrics
  const loadAllOnce = async () => {
    const [alerts, logs, incidents, top, metrics] = await Promise.all([
      fetchAlerts(),
      fetchLogs(),
      fetchIncidents(),
      fetchTopTalkers(),
      fetchMetrics()
    ]);
    setDashboardData(prev => {
      const maxLen = Math.max(prev.rxHistory.length, prev.txHistory.length, 12);
      // roll history: drop oldest, push newest
      const rxH = [...(prev.rxHistory || Array(maxLen).fill(0)).slice(1), metrics.bytesRecvPerSec ?? 0];
      const txH = [...(prev.txHistory || Array(maxLen).fill(0)).slice(1), metrics.bytesSentPerSec ?? 0];

      return ({
        ...prev,
        alerts,
        logs,
        incidents: Array.isArray(incidents) ? incidents.length : prev.incidents,
        incidentsList: incidents || prev.incidentsList,
        // threats from alerts
        threatsDetected: alerts.length,
        // top talkers data
        topTalkers: top.topTalkers || [],
        bytesSentPerSec: metrics.bytesSentPerSec ?? prev.bytesSentPerSec,
        bytesRecvPerSec: metrics.bytesRecvPerSec ?? prev.bytesRecvPerSec,
        // history arrays used for the chart
        rxHistory: rxH,
        txHistory: txH,
        // legacy activeDevices
        activeDevices: Array.isArray(top.topTalkers) ? top.topTalkers.length : prev.activeDevices
      });
    });
  };

  // poll every 10s
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadAllOnce();
    })();
    const id = setInterval(() => {
      loadAllOnce().catch(err => console.error("Polling error:", err));
    }, 10000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // initial static / demo stats remain as before
    setDashboardData(data => ({
      ...data,
      totalUsers: 272612,
      activeDevices: 113185,
      reports: 80347,
      monthlyStats: [30, 50, 40, 70, 60],
      threatTrends: [40, 25, 60, 20, 45]
    }));
  }, []);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [dashboardData.logs]);

  useEffect(() => {
    if (alertsRef.current) alertsRef.current.scrollTop = alertsRef.current.scrollHeight;
  }, [dashboardData.alerts]);

  useEffect(() => {
    if (incidentsRef.current) incidentsRef.current.scrollTop = incidentsRef.current.scrollHeight;
  }, [dashboardData.incidentsList]);

  // lineData -> use history arrays so chart updates continuously
  const lineData = (() => {
    const rx = dashboardData.rxHistory || Array(12).fill(0);
    const tx = dashboardData.txHistory || Array(12).fill(0);
    const L = Math.max(rx.length, 5);
    const labels = Array.from({ length: L }, (_, i) => (i === L - 1 ? "Now" : `-${L - 1 - i}s`));
    return {
      labels,
      datasets: [
        {
          label: "Rx (B/s)",
          data: rx.slice(-L),
          borderColor: "#10B981",
          backgroundColor: "rgba(16,185,129,0.08)",
          tension: 0.4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#10B981",
          pointRadius: 4,
          fill: true
        },
        {
          label: "Tx (B/s)",
          data: tx.slice(-L),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59,130,246,0.08)",
          tension: 0.4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#3B82F6",
          pointRadius: 4,
          fill: true
        }
      ]
    };
  })();

  // removed doughnut / rate chart data - replaced by top-talkers section in the UI

  function MainContent() {
    const top0 = (dashboardData.topTalkers && dashboardData.topTalkers[0]) || null;
    // compute total bytes from top talkers (fallback to totalUsers if none)
    const totalBytes = (dashboardData.topTalkers || []).reduce((s, t) => s + (t.bytes || 0), 0);
    const dataReceivedDisplay = totalBytes > 0 ? formatBytes(totalBytes) : dashboardData.totalUsers.toLocaleString();

    return (
      <main className="content">
        <header className="header">
          <h1>Defenx Dashboard</h1>
          <div className="icons">
            <span>🔔</span>
          </div>
        </header>

        <section className="stats">
          <div className="stat-card">
            <p>Data Received</p>
            <h2>{dataReceivedDisplay}</h2>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>
              Rx: {formatBytes(dashboardData.bytesRecvPerSec)}/s • Tx: {formatBytes(dashboardData.bytesSentPerSec)}/s
            </div>
          </div>

          {/* updated to show top talker summary */}
          <div className="stat-card">
            <p>Top talker</p>
            <h2>{top0 ? top0.ip : `${dashboardData.activeDevices.toLocaleString()} devices`}</h2>
            {top0 && <div style={{ fontSize: 12, color: "#94A3B8" }}>{formatBytes(top0.bytes)}</div>}
          </div>

          <div className="stat-card">
            <p>Incidents</p>
            <h2>{dashboardData.incidents.toLocaleString()}</h2>
          </div>
          <div className="stat-card">
            <p>No of logs</p>
            <h2>{(dashboardData.logs || []).length}</h2>
          </div>
        </section>

        <section className="charts">
          <div className="chart">
            <Line
              data={lineData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: true, position: "top" },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => {
                        // show bytes in human friendly form
                        const v = ctx.raw ?? 0;
                        return `${ctx.dataset.label}: ${formatBytes(v)}/s`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (val) => formatBytes(Number(val))
                    }
                  }
                }
              }}
            />
            <h1>Network Traffic (Rx / Tx)</h1>
            <div style={{ display: "flex", gap: 12, marginTop: 8, color: "#94A3B8", fontSize: 13 }}>
              <div>Rx: <strong style={{ color: "#10B981" }}>{formatBytes(dashboardData.bytesRecvPerSec)}/s</strong></div>
              <div>Tx: <strong style={{ color: "#3B82F6" }}>{formatBytes(dashboardData.bytesSentPerSec)}/s</strong></div>
              <div style={{ marginLeft: "auto" }}>{dashboardData.topTalkers?.length ? `Top: ${dashboardData.topTalkers[0].ip}` : ""}</div>
            </div>
          </div>
          <div className="chart">
            <h3 style={{ marginTop: 0, marginBottom: 12, color: "#fff" }}>Top Talkers (IPs)</h3>
            <div className="top-talkers-chart">
              {(dashboardData.topTalkers || []).slice(0, 8).map((t) => (
                <div key={t.ip} className="top-talkers-item">
                  <div style={{ fontWeight: 700 }}>{t.ip}</div>
                  <div style={{ color: "#94A3B8", fontSize: 13 }}>{formatBytes(t.bytes)}</div>
                </div>
              ))}
              {(dashboardData.topTalkers || []).length === 0 && (
                <div style={{ color: "#9aa" }}>No top talkers</div>
              )}
            </div>
          </div>
        </section>

        <div className="scan-alerts-row">
          <section className="threat-scan-section-new">
            <h2>Threat Scanning</h2>
            <div className="threat-circle-new">
              <span className="detected-count">{dashboardData.threatsDetected} Threats Detected</span>
            </div>
            <button className="scan-btn" onClick={handleScanStart}>Start Scanning</button>
          </section>

          <section className="alerts-section-new">
            <h2>Alerts (latest)</h2>

            {/* wrapped list so we can auto-scroll */}
            <div className="alerts-list" ref={alertsRef}>
              {(dashboardData.alerts || []).length === 0 ? (
                <div style={{ color: "#9aa" }}>No recent alerts</div>
              ) : (
                dashboardData.alerts.map((alert) => (
                  <div className="alert-card-new" key={alert.alert_id}>
                    <div className="alert-title-new">{alert.type} • {alert.severity}</div>
                    <div className="alert-msg-new">{alert.message}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>{new Date(alert.timestamp).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="logs-section-new">
          <h3>Live Logs (recent)</h3>

          {/* wrapper for scrollable logs */}
          <div className="logs-scroll" ref={logsRef}>
            <table className="logs-table-new">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {(dashboardData.logs || []).slice(0, 50).map((log, i) => (
                  <tr key={log.log_id ?? i}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ textTransform: "capitalize" }}>{log.severity}</td>
                    <td>{log.source}</td>
                    <td style={{ maxWidth: 420, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{log.message}</td>
                  </tr>
                ))}

                {(dashboardData.logs || []).length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "#9aa", padding: 18 }}>No logs</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* new background card wrapper for incidents placed below live logs */}
        <section className="incidents-section incidents-card">
          <h3>Incidents (latest)</h3>
          <div className="incidents-list" ref={incidentsRef}>
            {(dashboardData.incidentsList || []).slice(0, 10).map((inc) => (
              <div key={inc.incident_id} style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontWeight: 700 }}>{inc.type} • {inc.severity}</div>
                <div style={{ color: "#94A3B8", fontSize: 13 }}>{new Date(inc.timestamp).toLocaleString()} — {inc.source}</div>
                <div style={{ marginTop: 6 }}>{inc.details}</div>
              </div>
            ))}
            {(dashboardData.incidentsList || []).length === 0 && <div style={{ color: "#9aa", padding: 12 }}>No incidents</div>}
          </div>
        </section>

        <footer className="footer">
          System Status: Online | Version: 1.0.0 | © 2025 Company
        </footer>
      </main>
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">
          <img src={logo} alt="Defenx logo" className="logo-img" />
          <h2>Defenx</h2>
        </div>
        <ul>
          <li className="active"><Link to="/">Home</Link></li>
          <li><Link to="/network">Network Monitoring</Link></li>
          <li><Link to="/alerts">Threat Alerts</Link></li>
          <li><Link to="/logs">Logs</Link></li>
          <li><Link to="/reports">Reports (Coming Soon)</Link></li>
          <li><Link to="/Awareness">Awareness</Link></li>
        </ul>
      </aside>

      <Routes>
        <Route path="/" element={<MainContent />} />
        <Route path="/network" element={<NetMon />} />
        <Route path="/alerts" element={<ThreatAlerts />} />
        <Route path="/logs" element={<LogPage />} />
        <Route path="/reports" element={<Report />} />
      </Routes>
    </div>
  );
}

