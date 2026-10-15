# ⚡ HookRelay

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=1,12,24,30&height=180&section=header&text=HookRelay&fontSize=50&fontColor=A855F7&animation=fadeIn&fontAlignY=38&desc=Real-Time%20Webhook%20Inspector%20%26%20Event%20Relay%20Engine&descAlignY=58&descSize=18" width="100%" alt="HookRelay Banner" />

<p align="center">
  <strong>Real-Time Distributed Webhook Inspector, Event Forwarding Relay & Payload Debugger.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Engine-Node.js_%26_Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Real--Time-Socket.io_%26_WebSockets-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Inspector-Headers_%26_Payloads-A855F7?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-38BDF8?style=for-the-badge" />
</p>

<p align="center">
  <a href="#-key-features">Key Features</a> &bull;
  <a href="#-architecture">Architecture</a> &bull;
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-testing-with-curl">cURL Testing</a> &bull;
  <a href="#-author">Author</a>
</p>

</div>

---

## 🌟 Overview

**HookRelay** is an event-driven webhook testing and debugging platform built for modern API engineers. 

Whenever you're integrating third-party webhooks (Stripe, GitHub, Shopify, Razorpay, Twilio, Slack), you need a reliable way to capture raw payloads, examine request headers, test local forwarders, and replay failed events. HookRelay gives you ephemeral webhook URLs that stream every incoming HTTP call directly to a dark-mode browser dashboard in sub-millisecond real time.

---

## 🚀 Key Features

* **📡 Real-Time Webhook Capture:** Generates unique endpoints (`/webhook/:endpointId`) that intercept `POST`, `GET`, `PUT`, and `DELETE` calls with zero configuration.
* **🔍 Deep Request Inspector:** Breakdown of raw JSON payloads, complete HTTP request headers, query parameters, client IP, and payload size.
* **⚡ Event Forwarding Relay:** Relay captured events directly to your local development backend (e.g. `http://localhost:3000/api/webhook`) and view response latency (ms) and status codes.
* **🧪 1-Click Event Simulator:** Dispatches mock Stripe, GitHub, and Shopify webhooks instantly to test your pipelines without setting up external accounts.
* **📋 1-Click cURL Generator:** Automatically generates reproducible `curl` commands for any intercepted event.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────┐
│  Third-Party Provider / Test Client  │
│      (Stripe, GitHub, Shopify)       │
└──────────────────┬───────────────────┘
                   │  HTTP POST /webhook/xyz
                   ▼
┌──────────────────────────────────────┐
│        HookRelay Express Core        │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Body Parser & Header Capture   │  │
│  └───────────────┬────────────────┘  │
│                  │                   │
│    (WebSocket Broadcast to Room)     │
│                  ▼                   │
│  ┌────────────────────────────────┐  │
│  │ HookRelay Glassmorphic Web UI  │  │
│  │ (Deep Inspector & Tab Viewer)  │  │
│  └───────────────┬────────────────┘  │
│                  │                   │
└──────────────────┼───────────────────┘
                   │  HTTP Relay / Forward
                   ▼
┌──────────────────────────────────────┐
│       Local Development Server       │
│   (e.g. http://localhost:3000/api)   │
└──────────────────────────────────────┘
```

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/SahilRajput2266/HookRelay.git
cd HookRelay
npm install
```

### 2. Run Locally
```bash
npm start
```

Open your browser at:
```
http://localhost:5150
```

---

## 💻 Testing with cURL

Send an immediate test webhook from your terminal:
```bash
curl -X POST 'http://localhost:5150/webhook/my-test-hook' \
  -H 'Content-Type: application/json' \
  -d '{"event":"payment_intent.succeeded","amount":4900,"currency":"usd"}'
```

Watch it pop up immediately on your browser dashboard!

---

## 👨‍💻 Author

**Sahil Chauhan (Sahil Rajput)**
* GitHub: [@SahilRajput2266](https://github.com/SahilRajput2266)
* Email: [sahilrajput6244@gmail.com](mailto:sahilrajput6244@gmail.com)
* LinkedIn: [Sahil Chauhan](https://www.linkedin.com/in/sahil-chauhan-6bb687237)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
