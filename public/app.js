/**
 * HookRelay - Client Application
 * Real-time Webhook Inspector & Relay Controller.
 */

(function () {
  'use strict';

  const socket = io();
  const urlParams = new URLSearchParams(window.location.search);
  const endpointId = urlParams.get('id') || 'dev-webhook-' + Math.floor(1000 + Math.random() * 9000);

  // Full endpoint URL
  const webhookUrl = window.location.origin + '/webhook/' + endpointId;

  // DOM Elements
  const fullEndpointUrl = document.getElementById('fullEndpointUrl');
  const btnCopyUrl = document.getElementById('btnCopyUrl');
  const btnCopyCurl = document.getElementById('btnCopyCurl');
  const btnSimulate = document.getElementById('btnSimulate');
  const btnClear = document.getElementById('btnClear');
  const eventsList = document.getElementById('eventsList');
  const eventCountBadge = document.getElementById('eventCountBadge');
  const noSelectionView = document.getElementById('noSelectionView');
  const activeEventView = document.getElementById('activeEventView');
  const inspMethod = document.getElementById('inspMethod');
  const inspEventId = document.getElementById('inspEventId');
  const inspTimestamp = document.getElementById('inspTimestamp');
  const inspSize = document.getElementById('inspSize');
  const inspIp = document.getElementById('inspIp');
  const payloadJsonView = document.getElementById('payloadJsonView');
  const headersTable = document.getElementById('headersTable').querySelector('tbody');
  const headerCount = document.getElementById('headerCount');
  const queryJsonView = document.getElementById('queryJsonView');
  const curlView = document.getElementById('curlView');
  const relayTargetInput = document.getElementById('relayTargetInput');
  const btnRelayForward = document.getElementById('btnRelayForward');
  const relayStatusDisplay = document.getElementById('relayStatusDisplay');
  const toastContainer = document.getElementById('toastContainer');

  fullEndpointUrl.textContent = webhookUrl;

  let events = [];
  let selectedEvent = null;

  // Join Room
  socket.on('connect', () => {
    socket.emit('endpoint:listen', endpointId);
    showToast('Listening for live webhook requests 📡');
  });

  socket.on('endpoint:history', (history) => {
    events = history || [];
    renderEventsList();
    if (events.length > 0) selectEvent(events[0]);
  });

  socket.on('webhook:received', (evt) => {
    events.unshift(evt);
    renderEventsList();
    selectEvent(evt);
    showToast(`New ${evt.method} webhook intercepted! ⚡`);
  });

  socket.on('endpoint:cleared', () => {
    events = [];
    selectedEvent = null;
    renderEventsList();
    activeEventView.style.display = 'none';
    noSelectionView.style.display = 'flex';
    showToast('All events cleared');
  });

  // Render Sidebar
  function renderEventsList() {
    eventCountBadge.textContent = events.length;
    if (events.length === 0) {
      eventsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📡</div>
          <p>Waiting for incoming requests...</p>
          <small>Send any POST/GET request to your endpoint or click "Simulate Event" above.</small>
        </div>
      `;
      return;
    }

    eventsList.innerHTML = '';
    events.forEach(evt => {
      const card = document.createElement('div');
      card.className = 'event-card' + (selectedEvent && selectedEvent.id === evt.id ? ' active' : '');
      card.innerHTML = `
        <div class="event-card-left">
          <span class="method-badge ${evt.method.toLowerCase()}">${evt.method}</span>
          <span style="font-family: var(--font-mono); font-size: 12px; font-weight: 600;">${evt.id}</span>
        </div>
        <span class="event-card-time">${formatTime(evt.timestamp)}</span>
      `;
      card.addEventListener('click', () => selectEvent(evt));
      eventsList.appendChild(card);
    });
  }

  function selectEvent(evt) {
    selectedEvent = evt;
    noSelectionView.style.display = 'none';
    activeEventView.style.display = 'flex';

    // Summary
    inspMethod.textContent = evt.method;
    inspMethod.className = 'method-tag ' + evt.method.toLowerCase();
    inspEventId.textContent = evt.id;
    inspTimestamp.textContent = new Date(evt.timestamp).toLocaleString();
    inspSize.textContent = evt.size + ' bytes';
    inspIp.textContent = evt.ip || '127.0.0.1';

    // Payload
    payloadJsonView.textContent = JSON.stringify(evt.body, null, 2);

    // Headers
    headersTable.innerHTML = '';
    const headerEntries = Object.entries(evt.headers || {});
    headerCount.textContent = headerEntries.length;
    headerEntries.forEach(([k, v]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${k}</td><td>${v}</td>`;
      headersTable.appendChild(tr);
    });

    // Query
    queryJsonView.textContent = JSON.stringify(evt.query, null, 2);

    // cURL Reproduction
    const curlCmd = `curl -X ${evt.method} '${webhookUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(evt.body || {})}'`;
    curlView.textContent = curlCmd;

    // Highlight in list
    document.querySelectorAll('.event-card').forEach((card, idx) => {
      card.classList.toggle('active', events[idx]?.id === evt.id);
    });
  }

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tabId = 'tab' + btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1);
      document.getElementById(tabId)?.classList.add('active');
    });
  });

  // Relay Forwarding
  btnRelayForward.addEventListener('click', async () => {
    const targetUrl = relayTargetInput.value.trim();
    if (!targetUrl) {
      alert('Please specify a target relay URL (e.g. http://localhost:3000/api/webhook)');
      return;
    }
    if (!selectedEvent) return;

    relayStatusDisplay.style.display = 'block';
    relayStatusDisplay.textContent = 'Relaying event to ' + targetUrl + '...';

    try {
      const res = await fetch('/api/relay/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, event: selectedEvent })
      });
      const data = await res.json();
      if (data.success) {
        relayStatusDisplay.innerHTML = `✅ <strong>Success (${data.statusCode})</strong> in ${data.elapsedMs}ms | Response: ${data.responseBody || 'OK'}`;
        showToast('Relay dispatched successfully!');
      } else {
        relayStatusDisplay.innerHTML = `❌ <strong>Failed:</strong> ${data.error} (${data.elapsedMs}ms)`;
      }
    } catch (e) {
      relayStatusDisplay.innerHTML = `❌ <strong>Error:</strong> ${e.message}`;
    }
  });

  // Copy Buttons
  btnCopyUrl.addEventListener('click', () => {
    navigator.clipboard.writeText(webhookUrl).then(() => showToast('Webhook URL copied! 📋'));
  });

  btnCopyCurl.addEventListener('click', () => {
    const curl = `curl -X POST '${webhookUrl}' -H 'Content-Type: application/json' -d '{"event":"payment_intent.succeeded","amount":4900,"currency":"usd","customer":"cus_829374"}'`;
    navigator.clipboard.writeText(curl).then(() => showToast('Test cURL copied! Run it in any terminal 🚀'));
  });

  // Simulate Event Button
  btnSimulate.addEventListener('click', async () => {
    const mockEvents = [
      { event: "payment_intent.succeeded", provider: "Stripe", amount: 4900, currency: "usd", customer_email: "alex@enterprise.com", status: "paid" },
      { event: "pull_request.opened", provider: "GitHub", repository: "SahilRajput2266/Zavio", author: "Sahil-2390", action: "opened", branch: "feature/webrtc-mesh" },
      { event: "order.created", provider: "Shopify", order_id: "SH-98234", total_price: "128.50", items_count: 3, fulfillment_status: "unfulfilled" }
    ];
    const mock = mockEvents[Math.floor(Math.random() * mockEvents.length)];

    await fetch('/webhook/' + endpointId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HookRelay-Simulator/1.0',
        'X-Mock-Provider': mock.provider
      },
      body: JSON.stringify(mock)
    });
  });

  // Clear
  btnClear.addEventListener('click', () => {
    socket.emit('endpoint:clear', endpointId);
  });

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toTimeString().split(' ')[0];
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

})();
