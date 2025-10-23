import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import './report.css';

const Report = () => {
  const [data, setData] = useState({
    threatTypes: [],
    originIPs: [],
    affectedModules: [],
  });

  useEffect(() => {
    // Fetch data from backend API
    fetch('/api/report')
      .then((res) => res.json())
      .then((reportData) => setData(reportData));
  }, []);

  const threatTypesData = {
    labels: ['Malware', 'Phishing', 'Ransomware', 'Spyware', 'Adware'],
    datasets: [
      {
        label: 'Threat Types',
        data: data.threatTypes,
        backgroundColor: [
          '#5094fa',
          '#31c58d',
          '#fb5e7b',
          '#fbb536',
          '#9070fa',
        ],
        borderRadius: 8,
      },
    ],
  };

  const originIPsData = {
    labels: ['192.168.1.1', '192.168.1.2', '192.168.1.3', '192.168.1.4'],
    datasets: [
      {
        label: 'Origin IPs',
        data: data.originIPs,
        backgroundColor: [
          '#5094fa',
          '#31c58d',
          '#fb5e7b',
          '#fbb536',
        ],
        borderRadius: 8,
      },
    ],
  };

  const affectedModulesData = {
    labels: ['Module A', 'Module B', 'Module C'],
    datasets: [
      {
        label: 'Affected Modules',
        data: data.affectedModules,
        backgroundColor: [
          '#5094fa',
          '#31c58d',
          '#fb5e7b',
        ],
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#ffffff' } },
      y: { grid: { color: '#24364b' }, ticks: { color: '#ffffff' }, beginAtZero: true },
    },
  };

  return (
    <div className="report-container">
      <div className="report-header">
        Reports & Analysis
      </div>
      <div className="report-subheader">
       (commingsoon)
      </div>
      <div className="charts-section">
        <div className="chart-block">
          <div className="chart-title">Threat Types</div>
          <Bar data={threatTypesData} options={barOptions} />
        </div>
        <div className="chart-block">
          <div className="chart-title">Origin IPs</div>
          <Bar data={originIPsData} options={barOptions} />
        </div>
      </div>
      <div className="modules-section">
        <div className="chart-title">Affected Modules</div>
        <Bar data={affectedModulesData} options={barOptions} />
      </div>
    </div>
  );
};

export default Report;
