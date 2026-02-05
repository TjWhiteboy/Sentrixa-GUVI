
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Gp81DS15xxQGNGZW8d0SareA2lDtcdh5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# 🛡️ SentinelSim  
### Synthetic Autonomous Scam Detection Honeypot (Research Edition)

SentinelSim is an **ethics-first, simulation-only autonomous AI honeypot platform** built for cybersecurity research, hackathons, and education.

The project demonstrates how AI can be used **defensively** to:

- Detect scam-like messages  
- Classify scam categories  
- Analyze attacker behavior patterns  
- Log structured telemetry  
- Contain high-risk sessions  
- Generate incident reports as JSON files  

All interactions run in a **fully synthetic environment** using a Mock Scammer API.

> ⚠️ No real financial, identity, or personal data is collected or processed.

---

## ✨ Key Features

- 🤖 Autonomous AI agent (SentinelSim)
- 📊 React dashboard with sidebar navigation
- 📈 Card-based analytics (sessions, detections, incidents, average risk)
- 📋 Event telemetry table
- 🚨 Incident report modal + file-based JSON export
- 🌗 Light / Dark / System theme switcher
- 🧠 Behavioral analysis (urgency, impersonation, persuasion style)
- 🛑 Automatic containment on high risk
- 📁 Incident reports saved locally (`/reports/*.json`)
- 🔐 Privacy-first design with strict safety guards

---

## 🧱 Architecture Overview

React Dashboard
↓
Orchestrator Layer
↓
SentinelSim AI Agent
↓
Mock Scammer API (Synthetic)
↓
Event Store + JSON Reports


### Components

- **Frontend** – React dashboard (analytics, tables, modals, theme switcher)
- **Backend** – Session orchestration + AI agent integration
- **SentinelSim Agent** – Scam detection + behavioral analysis
- **Mock Scammer API** – Returns sanitized, synthetic responses only
- **Reports Engine** – Saves structured incident JSON files

---

## 📁 Project Structure

project-root/
├─ frontend/ # React dashboard
├─ backend/ # API + orchestration logic
├─ reports/ # Generated incident JSON files
├─ data/ # Event logs (synthetic)
├─ .env.local # Gemini API key (not committed)
└─ README.md


---

## 🧪 What This Project Demonstrates

- Defensive AI system design  
- Scam pattern recognition  
- Behavioral signal extraction  
- Session lifecycle management  
- Structured cybersecurity telemetry  
- Ethical honeypot architecture  

This project focuses on **detection, analysis, containment, and reporting** — not exploitation.

---

## ⚙️ Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/sentinelsim.git
cd sentinelsim
2. Backend Setup
cd backend
npm install
Create .env.local:

GEMINI_API_KEY=your_api_key_here
Run backend:

npm start
3. Frontend Setup
cd frontend
npm install
npm run dev
🔑 Environment Variables
Create a .env.local file in your backend folder:

GEMINI_API_KEY=your_api_key_here
SIMULATION_ONLY=true
BLOCK_FINANCE_TERMS=true
BLOCK_URLS=true
Add to .gitignore:

.env.local
Never commit API keys.

📄 Incident Report Example
Generated automatically in /reports/:

{
  "incident_id": "INC_2026_001",
  "session_id": "sess_001",
  "environment": "synthetic",
  "summary": {
    "scam_category": "impersonation",
    "risk_score": 84,
    "containment_action": "session_terminated"
  },
  "ethics": {
    "simulation_only": true,
    "real_data_collected": false
  }
}
🧯 Built-In Safety Controls
Simulation-only mode enforced

URL generation blocked

Financial terms blocked

Automatic redaction

Session termination on privacy violation

Synthetic personas only

Dummy tokens instead of real credentials

⚠️ Important Disclaimer
This project is for educational and cybersecurity research purposes only.

All data is synthetic

No real scammers are involved

No real banking, UPI, or payment information is collected

No phishing links are generated

SentinelSim is intentionally limited to:

✅ Detection
✅ Behavioral analysis
✅ Containment
✅ Reporting

🚀 Roadmap
Risk trend charts

Session timeline viewer

Advanced search & filters

Daily summary JSON reports

Dockerized deployment

Role-based access control

📜 License
MIT License (or your preferred license)

🙌 Acknowledgements
Built as part of an ethical AI + cybersecurity research initiative.
