const statusNode = document.getElementById('status');
const syncBtn = document.getElementById('syncBtn');
const optionsBtn = document.getElementById('optionsBtn');

function sendMessage(message) {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

async function checkConfig() {
  const result = await sendMessage({ type: 'DDAS_VALIDATE_CONFIG' });
  if (!result?.ok) {
    statusNode.textContent = 'Not configured. Open settings and add API URL + JWT token.';
    statusNode.style.color = '#932d21';
    return;
  }

  statusNode.textContent = `Connected to ${result.config.apiBaseUrl}`;
  statusNode.style.color = '#1d5e3f';
}

async function syncRecent() {
  statusNode.textContent = 'Syncing recent downloads...';
  const result = await sendMessage({ type: 'DDAS_SYNC_RECENT' });
  if (!result?.ok) {
    statusNode.textContent = `Sync failed: ${result?.error || 'Unknown error'}`;
    statusNode.style.color = '#932d21';
    return;
  }

  const { synced, skipped, failed } = result.result;
  statusNode.textContent = `Synced ${synced}, skipped ${skipped}, failed ${failed}`;
  statusNode.style.color = failed ? '#932d21' : '#1d5e3f';
}

syncBtn.addEventListener('click', syncRecent);
optionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

checkConfig();
