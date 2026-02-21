export default function AccessRequestsList({ requests, onApprove, onReject, canReview = true }) {
  return (
    <div className="request-list">
      {requests.map((req) => (
        <article key={req.id} className="request-card">
          <p>Dept - {req.department_name} is requesting access to Dataset {req.dataset_name}</p>
          <div className="request-actions">
            {canReview ? <button className="btn btn-success" onClick={() => onApprove(req.id)}>Accept</button> : null}
            {canReview ? <button className="btn btn-danger" onClick={() => onReject(req.id)}>Reject</button> : null}
            {!canReview ? <span className="muted-note">Read-only for your role.</span> : null}
          </div>
        </article>
      ))}
      {!requests.length ? <div className="empty-box">No pending requests.</div> : null}
    </div>
  );
}
