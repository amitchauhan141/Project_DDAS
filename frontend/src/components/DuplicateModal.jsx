import React from 'react';

export default function DuplicateModal({ datasetName, onCancel }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="trash-icon warning-icon">⚠️</div>
        <h3>Duplicate Data Found</h3>
        <p>The dataset <span className="dataset-strong">{datasetName}</span> already exists.</p>
        <p className="muted-note">Uploading or downloading the same data again is not permitted to prevent duplicates.</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}
