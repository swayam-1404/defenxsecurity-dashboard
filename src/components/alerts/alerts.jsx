import React, { useEffect, useRef, useState } from "react";
import "./alerts.css";

// Fetch latest alerts from provided API
const fetchThreats = async () => {
  try {
    const res = await fetch("http://3.120.210.220:8000/api/alerts/latest?limit=10", {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Normalize to the shape used by the component
    return data.map(item => ({
      timestamp: item.timestamp,
      severity: item.severity,
      message: item.message,
      ack: !!item.ack,
      alert_id: item.alert_id,
      type: item.type
    }));
  } catch (err) {
    console.error("Failed to fetch threats:", err);
    return [];
  }
};

function ThreatAlerts() {
  const [threats, setThreats] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    // initial load + polling every 10s
    const load = async () => {
      const list = await fetchThreats();
      if (mounted) setThreats(list);
    };

    load();
    const intervalId = setInterval(load, 10000); // 10 seconds

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threats]);

  // Filter logic
  const filteredThreats = threats.filter(t => {
    const severityMatch = filterSeverity === "All" || t.severity === filterSeverity;
    const dateMatch = !filterDate || t.timestamp.slice(0, 10) === filterDate;
    return severityMatch && dateMatch;
  });

  return (
    <div className="threat-alerts-container">
      <h1 className="header-title">Threat Alerts</h1>
      <div className="filter-section">
        <h2>Filter Incidents</h2>
        <label>
          Severity:
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
          >
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
        <label>
          Date:
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </label>
        <button onClick={() => { /* optional manual refresh */ fetchThreats().then(setThreats); }}>Refresh</button>
      </div>
      <div className="threats-table" ref={scrollRef}>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Severity</th>
              <th>Message</th>
              <th>Ack</th>
            </tr>
          </thead>
          <tbody>
            {filteredThreats.map((threat, idx) => (
              <tr key={threat.alert_id ?? idx}>
                <td>{threat.timestamp}</td>
                <td>{threat.severity}</td>
                <td>{threat.message}</td>
                <td>{threat.ack ? "ACKED" : "UNACKED"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ThreatAlerts;
