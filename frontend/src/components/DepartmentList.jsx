export default function DepartmentList({ departments, onShare, canShare = true }) {
  return (
    <div className="department-list">
      {departments.map((department) => (
        <div key={department.id} className="department-row">
          <span>{department.name}</span>
          {canShare ? (
            <button className="btn btn-primary" onClick={() => onShare(department)}>Share</button>
          ) : (
            <span className="muted-note">Read-only</span>
          )}
        </div>
      ))}
    </div>
  );
}
