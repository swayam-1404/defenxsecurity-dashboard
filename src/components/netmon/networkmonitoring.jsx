import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import "./networkmonitoring.css"; // Import CSS file

const API_URL = "http://3.69.167.136:8000/api/network/metrics";

const NetMon = () => {
  const [logs, setLogs] = useState([]);
  const [trafficData, setTrafficData] = useState({
    labels: [],
    datasets: [
      {
        label: "Bytes Sent/sec (KB/s)",
        data: [],
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.15)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Bytes Received/sec (KB/s)",
        data: [],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.15)",
        fill: true,
        tension: 0.4,
      },
    ],
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const now = new Date(data.timestamp || Date.now());
        const label = now.toLocaleTimeString("en-IN", { hour12: false });

        const sentKBps = (data.bytes_sent_per_sec || 0) / 1024;
        const recvKBps = (data.bytes_recv_per_sec || 0) / 1024;

        setTrafficData((prev) => {
          const newLabels = [...prev.labels, label].slice(-30);
          const sentData = [...prev.datasets[0].data, sentKBps].slice(-30);
          const recvData = [...prev.datasets[1].data, recvKBps].slice(-30);

          return {
            ...prev,
            labels: newLabels,
            datasets: [
              { ...prev.datasets[0], data: sentData },
              { ...prev.datasets[1], data: recvData },
            ],
          };
        });

        setLogs((prev) => {
          const entry = `[${label}] ↑ ${sentKBps.toFixed(2)} KB/s | ↓ ${recvKBps.toFixed(2)} KB/s`;
          const updated = [entry, ...prev];
          return updated.slice(0, 50);
        });
      } catch (err) {
        console.error("Error fetching metrics:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard">
      {/* <header className="dashboard-header">
        <h1>NetMon Live Dashboard</h1>
        <p>24/7 Network Metrics (bytes/sec)</p>
      </header> */}

      <div className="dashboard-grid">
        <div className="chart-card">
          <h2>Live Traffic Graph</h2>
          <div className="chart-container">
            <Line
              data={trafficData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { ticks: { color: "#94A3B8" }, grid: { color: "#1E293B" } },
                  y: { ticks: { color: "#94A3B8" }, grid: { color: "#1E293B" } },
                },
                plugins: { legend: { labels: { color: "#E2E8F0" } } },
              }}
            />
          </div>
        </div>

        <div className="logs-card">
          <h2>Live Logs</h2>
          <div className="logs-container">
            {logs.map((log, i) => (
              <div key={i} className="log-entry">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetMon;