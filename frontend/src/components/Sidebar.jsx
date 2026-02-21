const tabs = [
  { id: 'my', label: 'My Datasets' },
  { id: 'with-me', label: 'Shared With Me' },
  { id: 'by-me', label: 'Shared By Me' },
  { id: 'requests', label: 'Access Requests' },
  { id: 'departments', label: 'Other Departments' }
];

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="sidebar">
      <h1 className="sidebar-logo">DDAS</h1>
      <nav>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
