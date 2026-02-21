import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AccessRequestsList from '../components/AccessRequestsList';
import ActionModal from '../components/ActionModal';
import DatasetTable from '../components/DatasetTable';
import DeleteModal from '../components/DeleteModal';
import DepartmentList from '../components/DepartmentList';
import SharedByMeCards from '../components/SharedByMeCards';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { filterBySearch } from '../utils/search';

const defaultState = {
  my: [],
  withMe: [],
  byMe: [],
  requests: [],
  departments: []
};

export default function DashboardPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'my');
  const [search, setSearch] = useState('');
  const [state, setState] = useState(defaultState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [actionInput, setActionInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const canManage = ['ADMIN', 'RESEARCHER'].includes(user?.role || '');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [my, withMe, byMe, requests, departments] = await Promise.all([
        api.getMyDatasets(token),
        api.getSharedWithMe(token),
        api.getSharedByMe(token),
        api.getAccessRequests(token),
        api.listDepartments(token)
      ]);
      setState({
        my: my.data,
        withMe: withMe.data,
        byMe: byMe.data,
        requests: requests.data,
        departments: departments.data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const tabFromState = location.state?.activeTab;
    if (tabFromState) {
      setActiveTab(tabFromState);
      setSearchParams({ tab: tabFromState });
    }
  }, [location.state]);

  const updateTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const searchedMy = useMemo(() => filterBySearch(state.my, search), [state.my, search]);
  const searchedWithMe = useMemo(() => filterBySearch(state.withMe, search), [state.withMe, search]);

  const noSearchResults =
    Boolean(search.trim()) &&
    ((activeTab === 'my' && !searchedMy.length) || (activeTab === 'with-me' && !searchedWithMe.length));

  const openDataset = (dataset) => {
    navigate(`/datasets/${dataset.id}`, { state: { fromTab: activeTab } });
  };

  const deleteDataset = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteDataset(deleteTarget.id, token);
      setState((prev) => ({
        ...prev,
        my: prev.my.filter((item) => item.id !== deleteTarget.id),
        withMe: prev.withMe.filter((item) => item.id !== deleteTarget.id)
      }));
      setDeleteTarget(null);
      setMessage('Dataset deleted successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const downloadDataset = async (dataset) => {
    try {
      await api.downloadDataset(dataset.id, token);
      setMessage(`Download prepared for: ${dataset.name}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const openRenameModal = (dataset) => {
    if (!canManage) return;
    setActionModal({ type: 'rename', dataset });
    setActionInput(dataset.name);
  };

  const openShareUserModal = (dataset) => {
    if (!canManage) return;
    setActionModal({ type: 'share-user', dataset });
    setActionInput('');
  };

  const openShareDepartmentModal = (department) => {
    if (!canManage) return;
    setActionModal({ type: 'share-department', department });
    setActionInput('');
  };

  const closeActionModal = () => {
    setActionModal(null);
    setActionInput('');
    setActionLoading(false);
  };

  const submitActionModal = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      if (actionModal.type === 'rename') {
        const nextName = actionInput.trim();
        if (!nextName) throw new Error('Dataset name cannot be empty');
        await api.renameDataset(actionModal.dataset.id, nextName, token);
        setState((prev) => ({
          ...prev,
          my: prev.my.map((item) => (item.id === actionModal.dataset.id ? { ...item, name: nextName } : item)),
          withMe: prev.withMe.map((item) => (item.id === actionModal.dataset.id ? { ...item, name: nextName } : item))
        }));
        setMessage('Dataset renamed successfully.');
      }

      if (actionModal.type === 'share-user') {
        const userId = actionInput.trim();
        if (!userId) throw new Error('Please enter recipient user id');
        await api.shareWithUser(token, { datasetId: actionModal.dataset.id, recipientUserId: userId });
        setMessage('Dataset shared successfully.');
        await loadAll();
      }

      if (actionModal.type === 'share-department') {
        const datasetId = actionInput.trim();
        if (!datasetId) throw new Error('Please enter dataset id');
        await api.shareWithDepartment(token, { datasetId, departmentId: actionModal.department.id });
        setMessage(`Shared with ${actionModal.department.name}.`);
      }

      closeActionModal();
    } catch (err) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  const approveRequest = async (requestId) => {
    try {
      await api.approveRequest(requestId, token);
      setState((prev) => ({ ...prev, requests: prev.requests.filter((req) => req.id !== requestId) }));
      setMessage('Request approved.');
    } catch (err) {
      setError(err.message);
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await api.rejectRequest(requestId, token);
      setState((prev) => ({ ...prev, requests: prev.requests.filter((req) => req.id !== requestId) }));
      setMessage('Request rejected.');
    } catch (err) {
      setError(err.message);
    }
  };

  const renderActiveTab = () => {
    if (loading) return <div className="empty-box">Loading datasets...</div>;
    if (noSearchResults) return <div className="empty-box">Dataset not found</div>;

    switch (activeTab) {
      case 'my':
        return (
          <DatasetTable
            datasets={searchedMy}
            canManage={canManage}
            onOpen={openDataset}
            onDelete={setDeleteTarget}
            onDownload={downloadDataset}
            onRename={openRenameModal}
            onShare={openShareUserModal}
          />
        );
      case 'with-me':
        return (
          <DatasetTable
            datasets={searchedWithMe}
            incoming
            canManage={canManage}
            onOpen={openDataset}
            onDelete={setDeleteTarget}
            onDownload={downloadDataset}
            onRename={openRenameModal}
            onShare={openShareUserModal}
          />
        );
      case 'by-me':
        return <SharedByMeCards items={state.byMe} />;
      case 'requests':
        return <AccessRequestsList requests={state.requests} onApprove={approveRequest} onReject={rejectRequest} canReview={canManage} />;
      case 'departments':
        return <DepartmentList departments={state.departments} onShare={openShareDepartmentModal} canShare={canManage} />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} onTabChange={updateTab} />
      <main className="dashboard-main">
        <Topbar user={user} search={search} onSearch={setSearch} onLogout={logout} />
        {error ? <div className="error-box">{error}</div> : null}
        {message ? <div className="success-box">{message}</div> : null}
        <section className="content-pane">{renderActiveTab()}</section>
      </main>

      {deleteTarget ? (
        <DeleteModal
          datasetName={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={deleteDataset}
          isLoading={deleting}
        />
      ) : null}

      {actionModal ? (
        <ActionModal
          title={
            actionModal.type === 'rename'
              ? `Rename ${actionModal.dataset.name}`
              : actionModal.type === 'share-user'
                ? `Share ${actionModal.dataset.name}`
                : `Share to ${actionModal.department.name}`
          }
          label={
            actionModal.type === 'rename'
              ? 'New dataset name'
              : actionModal.type === 'share-user'
                ? 'Recipient user id (Mongo ObjectId)'
                : 'Dataset id (Mongo ObjectId)'
          }
          value={actionInput}
          onChange={setActionInput}
          onCancel={closeActionModal}
          onSubmit={submitActionModal}
          submitLabel={actionModal.type === 'rename' ? 'Rename' : 'Share'}
          loading={actionLoading}
        />
      ) : null}
    </div>
  );
}
