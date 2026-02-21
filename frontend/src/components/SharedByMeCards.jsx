function initials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function SharedByMeCards({ items }) {
  return (
    <div className="cards-grid">
      {items.map((item) => (
        <article className="share-card" key={item.share_id}>
          <div className="avatar">{initials(item.recipient_name)}</div>
          <div className="card-content">
            <h4>{item.recipient_name}</h4>
            <p><strong>Dataset:</strong> {item.dataset_name}</p>
            <p>{new Date(item.shared_at).toLocaleString()}</p>
          </div>
        </article>
      ))}
      {!items.length ? <div className="empty-box">No outgoing shares yet.</div> : null}
    </div>
  );
}
