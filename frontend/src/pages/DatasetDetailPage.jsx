import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import DetailPanel from '../components/DetailPanel';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function DatasetDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dataset, setDataset] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const openedAt = useMemo(() => new Date().toLocaleString(), []);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const res = await api.getDatasetDetail(id, token);
        setDataset(res.data);
      } catch (err) {
        setError(err.message);
      }
    };
    loadDetail();
  }, [id, token]);

  const goBack = () => {
    const fromTab = location.state?.fromTab || 'my';
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/app', { state: { activeTab: fromTab } });
  };

  const openFullDataset = async () => {
    try {
      await api.downloadDataset(id, token);
      setMessage(`Opened full dataset: ${dataset.name}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="detail-page">
      <button className="back-btn" onClick={goBack}>←</button>
      {error ? <div className="error-box">{error}</div> : null}
      {message ? <div className="success-box">{message}</div> : null}
      <DetailPanel dataset={dataset} openedAt={openedAt} onOpenFull={openFullDataset} />
    </main>
  );
}
