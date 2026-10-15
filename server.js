const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

app.use(cors());
// Raw / JSON body parser for incoming webhooks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text({ type: '*/*', limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

// Store captured webhooks in-memory: endpointId -> Array of captured request objects
const capturedWebhooks = new Map();

function getEndpointEvents(endpointId) {
  if (!capturedWebhooks.has(endpointId)) {
    capturedWebhooks.set(endpointId, []);
  }
  return capturedWebhooks.get(endpointId);
}

// Intercept Webhooks at /webhook/:endpointId
app.all('/webhook/:endpointId', async (req, res) => {
  const endpointId = req.params.endpointId;
  const start = Date.now();

  let bodyData = req.body;
  if (typeof bodyData === 'string') {
    try {
      bodyData = JSON.parse(bodyData);
    } catch (e) {
      // keep as string
    }
  }

  const webhookEvent = {
    id: 'evt_' + Math.random().toString(36).substring(2, 10),
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: bodyData,
    ip: req.ip || req.connection.remoteAddress,
    size: JSON.stringify(bodyData || '').length
  };

  const events = getEndpointEvents(endpointId);
  events.unshift(webhookEvent);
  if (events.length > 200) events.pop(); // keep last 200

  // Real-time broadcast to dashboard viewers listening to this endpoint
  io.to(endpointId).emit('webhook:received', webhookEvent);

  res.status(200).json({
    status: 'success',
    message: 'Webhook received and relayed by HookRelay',
    eventId: webhookEvent.id
  });
});

// Relay Forwarding API
app.post('/api/relay/forward', async (req, res) => {
  const { targetUrl, event } = req.body;
  if (!targetUrl || !event) {
    return res.status(400).json({ error: 'targetUrl and event are required' });
  }

  const start = Date.now();
  try {
    const response = await fetch(targetUrl, {
      method: event.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HookRelay-Forwarded': 'true',
        'X-HookRelay-Event-Id': event.id
      },
      body: JSON.stringify(event.body || {})
    });

    const elapsed = Date.now() - start;
    const resText = await response.text();

    res.json({
      success: true,
      statusCode: response.status,
      elapsedMs: elapsed,
      responseBody: resText.substring(0, 500)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      elapsedMs: Date.now() - start
    });
  }
});

// WebSocket Room Listeners
io.on('connection', (socket) => {
  socket.on('endpoint:listen', (endpointId) => {
    socket.join(endpointId);
    const existing = getEndpointEvents(endpointId);
    socket.emit('endpoint:history', existing);
  });

  socket.on('endpoint:clear', (endpointId) => {
    if (capturedWebhooks.has(endpointId)) {
      capturedWebhooks.set(endpointId, []);
      io.to(endpointId).emit('endpoint:cleared');
    }
  });
});

const PORT = process.env.PORT || 5150;
server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`  🚀 HookRelay Webhook Inspector on port ${PORT}`);
  console.log(`  🌐 Local URL: http://localhost:${PORT}`);
  console.log(`===================================================`);
});
