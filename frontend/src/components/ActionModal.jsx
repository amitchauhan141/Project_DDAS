export default function ActionModal({ title, label, value, onChange, onCancel, onSubmit, submitLabel = 'Save', loading }) {
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="action-title">
        <h3 id="action-title">{title}</h3>
        <label className="input-label">{label}</label>
        <input className="text-input" value={value} onChange={(e) => onChange(e.target.value)} />
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>{loading ? 'Saving...' : submitLabel}</button>
        </div>
      </div>
    </div>
  );
}
