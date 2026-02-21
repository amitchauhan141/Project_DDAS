import { useState } from 'react';

function formatBytes(sizeInBytes = 0) {
  if (sizeInBytes < 1024) return `${sizeInBytes} B`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ActionMenu({ canManage, onShare, onRename, onDetail, onDownload, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="action-menu" onClick={(e) => e.stopPropagation()}>
      <button className="icon-btn" onClick={() => setOpen((prev) => !prev)}>⋯</button>
      {open && (
        <div className="menu-popover">
          {canManage ? <button onClick={onShare}>Share</button> : null}
          {canManage ? <button onClick={onRename}>Rename</button> : null}
          <button onClick={onDetail}>View Details</button>
          <button onClick={onDownload}>Download</button>
          {canManage ? <button className="danger" onClick={onDelete}>Delete</button> : null}
        </div>
      )}
    </div>
  );
}

export default function DatasetTable({
  datasets,
  incoming = false,
  canManage = true,
  onOpen,
  onDelete,
  onDownload,
  onRename,
  onShare
}) {
  return (
    <div className="table-wrap">
      <table className="dataset-table">
        <thead>
          <tr>
            <th>⭐</th>
            <th>Dataset Name</th>
            <th>Owner</th>
            <th>Date</th>
            <th>Size</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((dataset) => (
            <tr key={dataset.id} onClick={() => onOpen(dataset)}>
              <td>☆</td>
              <td>
                {dataset.name}
                {incoming ? <span className="incoming-badge">Incoming</span> : null}
              </td>
              <td>{dataset.owner_name}</td>
              <td>{new Date(dataset.created_at).toLocaleDateString()}</td>
              <td>{formatBytes(dataset.size_bytes)}</td>
              <td><span className={`status ${dataset.status?.toLowerCase()}`}>{dataset.status}</span></td>
              <td>
                <ActionMenu
                  canManage={canManage}
                  onShare={() => onShare(dataset)}
                  onRename={() => onRename(dataset)}
                  onDetail={() => onOpen(dataset)}
                  onDownload={() => onDownload(dataset)}
                  onDelete={() => onDelete(dataset)}
                />
              </td>
            </tr>
          ))}
          {!datasets.length && (
            <tr>
              <td colSpan={7}>
                <div className="empty-inline">No datasets available.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
