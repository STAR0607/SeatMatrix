# SeatMatrix 🎓
### Smart Exam Hall Seating Arrangement System
**Sasurie College of Engineering (Autonomous)**  

---

## What is SeatMatrix?

SeatMatrix is a production-hardened exam seating management system designed for scale. It automates the complex task of generating anti-malpractice seating arrangements, handling everything from large-scale student imports (800+) to automated PDF email notifications.

---

## ⚡ Key Features

### 🚀 Performance & Scale
- **Smart Bulk Import**: Handles 800+ students in seconds using optimized batch insertion.
- **Header Alias Mapping**: Flexible CSV/Excel parsing—automatically recognizes varied headers like "Roll No" or "Reg Number".
- **Multi-Hall Generation**: Seat 1,000+ students across multiple halls with real-time remaining student tracking.

### 🛡️ Anti-Malpractice Logic
- **Department Interleaving**: Round-robin distribution ensures same-department students don't sit adjacent.
- **Checkerboard Paper Sets**: Automatic A/B/C question paper distribution.
- **Year-Wise Subject Mapping**: Different years in the same hall automatically get their specific subjects on seat cards.

### 📧 Automations & Output
- **PDF Notification Pipeline**: Automated HTML-to-PDF conversion via **iLovePDF API** and **Make.com**.
- **Email Delivery**: Instant delivery of seating slips to staff/students with professional branding.
- **Hall Door Sheets**: Print-ready grids with invigilator names, department summaries, and cut-out door slips.

### 🔐 Security & SaaS Ready
- **Environment Driven**: Admin credentials and sensitive keys managed via `.env` (SaaS ready).
- **Session Auth**: Secure, hashed authentication with Admin and Staff role separation.
- **Audit Logging**: Deep logging for system stability and import verification.

---

## 🚀 Production Deployment (Render)

SeatMatrix is optimized for **Render**.

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn -t 120 --bind 0.0.0.0:10000 backend.app:app`
- **Root Directory**: `SeatMatrix`

### Required Environment Variables
| Variable | Description |
|---|---|
| `ADMIN_USER` | Your custom Admin username |
| `ADMIN_PASS` | Your custom Admin password |
| `SECRET_KEY` | Flask session security key |
| `N8N_WEBHOOK_URL` | Your Make.com / n8n notification hook |

---

## 🛠️ Local Installation

```powershell
git clone https://github.com/STAR0607/SeatMatrix.git
cd SeatMatrix/SeatMatrix
python -m venv venv
source venv/bin/activate  # .\venv\Scripts\activate on Windows
pip install -r requirements.txt
python backend/app.py
```

---

## 🏗️ Project Structure

```
SeatMatrix/
├── backend/            # Optimized Flask logic & API
├── frontend/           # Glassmorphism UI (HTML/CSS/JS)
├── database/           # SQLite/Postgres storage
└── requirements.txt    # Production dependencies
```

---

Built for **Sasurie College of Engineering** — Engineering the future of Exam Management.

