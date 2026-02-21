export default function DetailPanel({ dataset, openedAt, onOpenFull }) {
  if (!dataset) return null;

  return (
    <section className="detail-panel">
      <h2>{dataset.name}</h2>
      <p className="meta">Opened at: {openedAt}</p>
      <div className="preview">
        <h4>Preview</h4>
        <pre>
{`id,name,value
1,Alice,42
2,Bob,37
3,Carol,58`}
        </pre>
      </div>
      <button className="btn btn-primary" onClick={onOpenFull}>Open Full Dataset</button>
    </section>
  );
}
