# SeatMatrix 🎓
### Smart Exam Hall Seating Arrangement System
**Sasurie College of Engineering (Autonomous)**  
Vijayamangalam, Tiruppur District, Tamil Nadu – 638056

---

## What is SeatMatrix?

SeatMatrix is a web-based exam seating management system that automatically generates anti-malpractice seating arrangements. Staff upload a CSV of register numbers, select halls, and the system instantly allocates seats — interleaving departments, assigning A/B question paper sets in a checkerboard pattern, and tracking remaining students across multiple halls.

---

## Features

### Core
- Anti-malpractice seating — round-robin department interleaving
- Checkerboard A/B/C paper sets — adjacent students always get different question papers
- Multi-hall batch generation — seat 400 students across 8 halls, remaining students tracked
- Year/dept filter on upload — filter to 1st year AIDS only from a full college CSV
- Register number auto-decode — department and year decoded automatically (Sasurie format)
- Year-wise subject mapping — multiple years sharing a hall each get correct subject on seat card

### Management
- Students: add individually, bulk import CSV/Excel/PDF, search, filter, export
- Exams: full details with year-wise subject mapping, edit after creation
- Rooms: rows/cols/capacity/blocked seats/aisle, edit after creation
- Staff: invigilators auto-assigned to halls on print sheet
- College Presets: save hall layouts per college, load in one click
- User Accounts: multiple admins and staff, password management

### Print Export (Hall Door Sheet)
- Print All Halls or single hall
- Includes: seat grid, register numbers, dept/year, subject, paper set (colour coded)
- Invigilator name auto-assigned per hall
- Cut-out door slip at bottom
- Signature boxes for Invigilator, Hall Superintendent, Chief Superintendent
- Department-wise student count summary

### Student Seat Finder
- Public page — no login needed
- Enter register number to find hall, seat, subject, paper set, date/time

---

## Installation

### Windows
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python backend/app.py
```

### Mac/Linux
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 backend/app.py
```

Open http://127.0.0.1:5000


---

## Default Login

| Username | Password | Role |
|---|---|---|
| admin | admin123 | Administrator |

Change password via User Accounts after first login.

---

## Configuration (.env)

```env
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=1
```


---

## CSV Format

Minimum — just register numbers:
```
732425243001
732425243002
```

Full format:
```
Name,Register Number,Department,Year,Subject
Arun Kumar,732425243001,AIDS,1,Engineering Mathematics
```
Department and Year auto-filled from register number if not provided.

---

## Register Number Format (Sasurie)

73 + YY (admission) + YY (year) + DDD (dept) + NNN (roll)

| Code | Department |  | Year | Meaning |
|---|---|---|---|---|
| 243 | AIDS | | 25 | 1st Year |
| 205 | IT | | 24 | 2nd Year |
| 104 | CSE | | 23 | 3rd Year |
| 105 | ECE | | | |
| 106 | EEE | | | |
| 103 | MECH | | | |
| 114 | CIVIL | | | |
| 149 | CSE CS | | | |
| 631 | MBA | | | |

---

## Project Structure

```
SeatMatrix/
├── backend/            # Flask server and API logic
│   └── app.py
├── frontend/           # UI assets and templates
│   ├── static/         # CSS, JS, Images
│   └── templates/      # HTML pages
├── database/           # SQLite storage
│   └── seatmatrix.db
├── .gitignore          # Git configuration
├── .env                # Secret keys (never commit)
└── requirements.txt    # Python dependencies

```

---

## Tech Stack

- Backend: Python 3, Flask, SQLite
- Frontend: HTML, CSS, Vanilla JS (single-page)
- PDF: PyMuPDF (optional — pip install PyMuPDF)
- Excel: openpyxl (optional — pip install openpyxl)


---

## Security Notes

- Passwords hashed with SHA-256
- Session-based auth
- Never commit .env to GitHub
- For production: use bcrypt, Gunicorn + Nginx, HTTPS

---

Built for PSA1 Hackathon — Sasurie College of Engineering
