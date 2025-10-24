import React, { useEffect, useRef, useState } from "react"; 
import "./alerts.css";

// Fetch latest alerts
const fetchThreats = async () => {
  try {
    const res = await fetch("http://3.69.167.136:8000/api/alerts/latest?limit=10", {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
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
  const [trustedPorts, setTrustedPorts] = useState(() => {
    const stored = localStorage.getItem("trustedPorts");
    return stored ? JSON.parse(stored) : [22, 8000];
  });
  const [newPort, setNewPort] = useState("");
  const scrollRef = useRef(null);

  // Persist trusted ports
  useEffect(() => {
    localStorage.setItem("trustedPorts", JSON.stringify(trustedPorts));
  }, [trustedPorts]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const list = await fetchThreats();
      if (mounted) setThreats(list);
    };
    load();
    const intervalId = setInterval(load, 10000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [threats]);

  // Trusted ports management
  const addTrustedPort = () => {
    const portNum = parseInt(newPort);
    if (!isNaN(portNum) && !trustedPorts.includes(portNum)) {
      setTrustedPorts([...trustedPorts, portNum]);
      setNewPort("");
    }
  };

  const removeTrustedPort = (port) => {
    setTrustedPorts(trustedPorts.filter(p => p !== port));
  };

  // Highlight untrusted ports in message
  const formatMessage = (msg) => {
    const match = msg.match(/\[(.*?)\]/);
    if (!match) return msg;

    const ports = match[1].split(",").map(p => parseInt(p.trim()));
    const untrusted = ports.filter(p => !trustedPorts.includes(p));
    const trusted = ports.filter(p => trustedPorts.includes(p));

    let formatted = "";
    if (untrusted.length > 0) {
      formatted += `Untrusted: ${untrusted.join(", ")}`;
      if (trusted.length > 0) formatted += ` | Trusted: ${trusted.join(", ")}`;
    } else {
      formatted = `All trusted ports: ${trusted.join(", ")}`;
    }
    return formatted;
  };

  return (
    <div className="threat-alerts-container">
      <h1 className="header-title">Threat Alerts</h1>

      {/* Trusted ports input */}
      <div className="filter-section">
        <h2>Manage Trusted Ports</h2>
        <input
          type="number"
          placeholder="Add port e.g., 443"
          value={newPort}
          onChange={e => setNewPort(e.target.value)}
        />
        <button onClick={addTrustedPort}>Add</button>
        <div style={{ marginTop: "12px" }}>
          {trustedPorts.map(p => (
            <span key={p} style={{ padding: "4px 8px", margin: "2px", background: "#10b981", color: "#fff", borderRadius: "4px", cursor: "pointer" }}
              onClick={() => removeTrustedPort(p)}
            >
              {p} ✕
            </span>
          ))}
        </div>
      </div>

      {/* Alerts table */}
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
            {threats.map(threat => {
              let severity = threat.severity;
              // Reclassify to High if any untrusted port exists
              const match = threat.message.match(/\[(.*?)\]/);
              if (match) {
                const ports = match[1].split(",").map(p => parseInt(p.trim()));
                if (ports.some(p => !trustedPorts.includes(p))) severity = "High";
                else severity = "Low";
              }
              return (
                <tr key={threat.alert_id}>
                  <td>{threat.timestamp}</td>
                  <td>{severity}</td>
                  <td>{formatMessage(threat.message)}</td>
                  <td>{threat.ack ? "ACKED" : "UNACKED"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ThreatAlerts;
