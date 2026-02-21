export default function Topbar({ search, onSearch, onLogout, user }) {
  return (
    <header className="topbar">
      <input
        className="search"
        placeholder="Search datasets instantly..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="topbar-actions">
        <span className="user-pill">{user?.name || 'User'}</span>
        <button className="btn btn-secondary" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
