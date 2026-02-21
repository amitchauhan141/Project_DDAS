const STORAGE_KEY = 'ddas_config';

const apiBaseUrlInput = document.getElementById('apiBaseUrl');
const jwtTokenInput = document.getElementById('jwtToken');
const saveBtn = document.getElementById('saveBtn');
const statusNode = document.getElementById('status');

function getStorage(key) {
  return new Promise((resolve) => chrome.storage.local.get([key], resolve));
}

function setStorage(payload) {
  return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
}

function sanitizeToken(rawToken = '') {
  const trimmed = rawToken.trim();
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

async function loadConfig() {
  const { [STORAGE_KEY]: config } = await getStorage(STORAGE_KEY);
  if (!config) return;

  apiBaseUrlInput.value = config.apiBaseUrl || 'http://localhost:4000/api';
  jwtTokenInput.value = config.jwtToken || '';
}

async function saveConfig() {
  const apiBaseUrl = apiBaseUrlInput.value.trim();
  const jwtToken = sanitizeToken(jwtTokenInput.value);

  if (!apiBaseUrl || !jwtToken) {
    statusNode.textContent = 'Both API URL and JWT token are required.';
    statusNode.style.color = '#932d21';
    return;
  }

  await setStorage({
    [STORAGE_KEY]: { apiBaseUrl, jwtToken }
  });

  jwtTokenInput.value = jwtToken;
  statusNode.textContent = 'Configuration saved.';
  statusNode.style.color = '#1d5e3f';
}

saveBtn.addEventListener('click', saveConfig);
loadConfig();
