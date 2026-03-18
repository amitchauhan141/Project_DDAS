import React from 'react';

function formatBytes(sizeInBytes = 0) {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StatsBar({ datasets, sharedWithMe, sharedByMe }) {
  const totalDatasets = datasets.length;
  const storageUsed = datasets.reduce((acc, curr) => acc + (curr.size_bytes || 0), 0);
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentUploads = datasets.filter(d => new Date(d.created_at) > oneWeekAgo).length;
  
  const sharedCount = sharedWithMe.length + sharedByMe.length;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Total Datasets</span>
          <span className="stat-icon">📚</span>
        </div>
        <div className="stat-value">{totalDatasets}</div>
        <div className="stat-subtitle success-text">+12% this month</div>
      </div>
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Storage Used</span>
          <span className="stat-icon">💾</span>
        </div>
        <div className="stat-value">{formatBytes(storageUsed)}</div>
        <div className="stat-subtitle success-text">82% of limit</div>
      </div>
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Recent Uploads</span>
          <span className="stat-icon">☁️</span>
        </div>
        <div className="stat-value">{recentUploads}</div>
        <div className="stat-subtitle success-text">+{recentUploads} this week</div>
      </div>
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">Shared Files</span>
          <span className="stat-icon">🔗</span>
        </div>
        <div className="stat-value">{sharedCount}</div>
        <div className="stat-subtitle success-text">3 newly shared</div>
      </div>
    </div>
  );
}
