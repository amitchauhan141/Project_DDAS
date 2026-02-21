export default function DeleteModal({ datasetName, onCancel, onConfirm, isLoading }) {
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <div className="trash-icon">🗑</div>
        <h3 id="delete-title">Delete Dataset</h3>
        <p>
          Are you sure you want to delete this dataset?
          <br />
          This action cannot be undone.
        </p>
        <p className="dataset-strong">{datasetName}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
