import React, { useEffect, useState, useRef } from "react";
import "./logs.css";

const API_URL = "http://3.120.210.220:8000/api/logs/recent?limit=50";

const escapeCsv = (value) => {
  if (value == null) return "";
  const s = String(value);
  return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
};

const Log = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Normalize response to our shape
      const normalized = Array.isArray(data)
        ? data.map((d) => ({
            id: d.log_id ?? `${d.timestamp}-${Math.random()}`,
            timestamp: d.timestamp ?? d.time ?? "",
            source: d.source ?? "",
            message: d.message ?? "",
            severity: d.severity ?? (d.level ?? "info"),
          }))
        : [];
      if (!mountedRef.current) return;
      setLogs(normalized);
      // apply current filters immediately
      setFilteredLogs(applyFilters(normalized, dateFilter, severityFilter));
    } catch (err) {
      console.error("Failed to load logs:", err);
      if (!mountedRef.current) return;
      setError("Failed to load logs. Check network/API.");
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchLogs();
    const id = setInterval(fetchLogs, 10000); // poll every 10s
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (list, date, severity) => {
    let result = Array.isArray(list) ? [...list] : [];
    if (date) {
      result = result.filter((log) => (log.timestamp || "").slice(0, 10) === date);
    }
    if (severity && severity !== "All") {
      result = result.filter((log) => (log.severity || "").toLowerCase() === severity.toLowerCase());
    }
    return result;
  };

  const handleFilter = () => {
    setFilteredLogs(applyFilters(logs, dateFilter, severityFilter));
  };

  const exportCSV = () => {
    const header = ["LogID", "Timestamp", "Source", "Severity", "Message"];
    const rows = filteredLogs.map((log) => [
      escapeCsv(log.id),
      escapeCsv(log.timestamp),
      escapeCsv(log.source),
      escapeCsv(log.severity),
      escapeCsv(log.message),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "logs.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="centralized-logging-system log-container">
      <h1>Centralized Logging System</h1>

      <div className="filter-card filter-section">
        <h2>Filter Logs</h2>
        <div className="filters-row filter-row">
          <div>
            <label>Timestamp:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div>
            <label>Severity:</label>
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
            </select>
          </div>

          <button className="filter-btn" onClick={handleFilter}>Filter</button>
          <button className="filter-btn" onClick={fetchLogs} style={{ background: "#6b7280" }}>Refresh</button>
        </div>
      </div>

      {loading && <div style={{ padding: 12, color: "#9aa" }}>Loading logs...</div>}
      {error && <div style={{ padding: 12, color: "#f88" }}>{error}</div>}

      <div className="logs-table-container" style={{ maxHeight: 520, overflowY: "auto" }}>
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Source</th>
              <th>Severity</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 && !loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: 18, color: "#9aa" }}>
                  No logs to display
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.source}</td>
                  <td style={{ textTransform: "capitalize" }}>{log.severity}</td>
                  <td style={{ maxWidth: 900, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{log.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="button-row export-buttons" style={{ paddingTop: 10 }}>
        <button className="export-csv" onClick={exportCSV}>Export to CSV</button>
        <button className="export-json" onClick={exportJSON}>Export to JSON</button>
      </div>
    </div>
  );
};

export default Log;
