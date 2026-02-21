# DDAS Browser Extension

This extension adds browser-level duplicate detection for downloads and syncs confirmed downloads into DDAS.

## Features

- Intercepts new browser downloads.
- Calls DDAS duplicate-check API using metadata + fingerprint hash.
- Shows duplicate popup only when duplicate detected.
- Popup options:
  - Open existing file
  - Cancel download
  - Download anyway (logged)
- Syncs completed downloads to DDAS (`My Datasets`).

## Load in Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select `/Users/amitkumarchauhan/Documents/New project/browser-extension`

## Configure

1. Open extension options
2. API URL: `http://localhost:4000/api`
3. Paste JWT token from DDAS login response
4. Save

## Duplicate Decision Logging

When duplicate is detected and user selects any action, DDAS logs the decision with:
- file name
- fingerprint hash
- duplicate dataset id
- action taken
- user id
- timestamp
