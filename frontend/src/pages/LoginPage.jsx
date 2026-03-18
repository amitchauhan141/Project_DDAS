import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [usid, setUsid] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usid, password);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>DDAS</h1>
        <p>Data Download & Access System</p>
        <label>USID</label>
        <input value={usid} onChange={(e) => setUsid(e.target.value.toUpperCase())} />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <div className="error-box">{error}</div> : null}
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
      </form>
    </main>
  );
}
