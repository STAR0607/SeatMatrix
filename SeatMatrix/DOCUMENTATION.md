# SeatMatrix — Complete Documentation
**Sasurie College of Engineering (Autonomous)**
Version 2.0 | Smart Exam Hall Seating Arrangement System

---

## Table of Contents
1. [What is SeatMatrix?](#what-is-seatmatrix)
2. [How Login Works](#how-login-works)
3. [User Accounts — What Staff Need to Know](#user-accounts)
4. [Dashboard](#dashboard)
5. [Manage Exams](#manage-exams)
6. [Manage Rooms](#manage-rooms)
7. [Manage Staff](#manage-staff)
8. [Manage Students](#manage-students)
9. [Generate Seating](#generate-seating)
10. [Archives & Print](#archives--print)
11. [Student Seat Finder](#student-seat-finder)
12. [College Presets](#college-presets)
13. [Is the App Complete?](#is-the-app-complete)
14. [GitHub & Netlify Deployment](#github--netlify-deployment)
15. [FAQ](#faq)

---

## What is SeatMatrix?

SeatMatrix is a web application built for Sasurie College of Engineering to automate exam hall seating. Instead of manually assigning seats, the exam cell staff:

1. Uploads a CSV of student register numbers
2. Selects exam halls
3. Clicks Generate

The system automatically:
- Interleaves students from different departments so same-department students don't sit adjacent
- Assigns A/B question paper sets in a checkerboard pattern so adjacent students always have different papers
- **Cumulative Seat Allocation**: Uses a smart proportional distribution to ensure NO students are lost from small department groups.
- Tracks remaining students across multiple halls

- Produces a print-ready hall sheet with seat grid, register numbers, invigilator name, and a cut-out door slip

---

## How Login Works

SeatMatrix uses **real session-based authentication** — the same system used by professional web applications.

### How it works:
1. You enter your username and password on the login page
2. The server checks your credentials against the database
3. If correct, a **session** is created — a secure cookie stored in your browser
4. Every page and API call checks this session before allowing access
5. When you log out, the session is destroyed

### What this means:
- Your password is **never stored as plain text** — it is hashed using SHA-256 before saving
- Nobody can access the system without valid credentials
- Sessions expire when you close the browser or log out
- The login page is a real authentication gate — the dashboard is completely hidden until logged in

### Default credentials:
| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Administrator |

**Change this immediately** after first login via User Accounts → Change Password.

---

## User Accounts

### What is this section?
User Accounts is where the **admin** creates and manages login credentials for all staff members who need to use SeatMatrix. This makes the system multi-user — each staff member logs in with their own username and password.

### Two roles:

**Admin**
- Full access to everything
- Can create, edit, delete any data
- Can add and remove user accounts
- Can change anyone's password
- Should only be given to the Exam Cell in-charge or HOD

**Staff**
- Can generate seating arrangements
- Can view archives and print hall sheets
- Can add/view students, exams, rooms
- Cannot manage user accounts
- Cannot delete exams with existing arrangements
- Suitable for junior exam cell staff

### How to add a new user:
1. Go to **User Accounts** in the sidebar
2. Fill in: Full Name, Username, Password (min 6 characters), Role
3. Click **Add User**
4. Share the username and password with the staff member privately
5. Ask them to change their password after first login

### How to change a password:
- **Admin**: Can change anyone's password from User Accounts → Change Password section
- **Staff**: Can only change their own password

### Important notes:
- The `admin` account cannot be deleted (it is protected)
- Usernames must be unique — you cannot have two users with the same username
- If a staff member leaves, delete their account from User Accounts

---

## Dashboard

Shows real-time statistics pulled from the database:
- **Total Exams** — number of exams created
- **Halls Available** — number of active rooms
- **Staff Members** — number of invigilators
- **Students in DB** — total student records
- **Students Seated** — unique students who have been assigned seats
- **Arrangements** — total seating arrangements generated
- **College Presets** — saved hall layouts
- **User Accounts** — number of system users

---

## Manage Exams

Create an exam before generating seating. Fields:

| Field | Purpose |
|---|---|
| Exam Name | e.g. "CIAT-1 November 2025" |
| Subject Name | e.g. "Engineering Mathematics I" |
| Subject Code | e.g. "MA3151" |
| Date | Exam date |
| Time | Start time |
| Duration | e.g. "3 Hours" |
| Question Paper Sets | 1 (single), 2 (A/B), 3 (A/B/C) |
| Department | Optional — for department-specific exams |
| Semester | Optional |

**Year-wise Subjects** — For exams where multiple years sit in the same hall writing different subjects. Example:
- 1st Year → Engineering Mathematics I
- 2nd Year → Data Structures
- 3rd Year → Machine Learning

The correct subject appears on each student's seat card automatically based on their year.

---

## Manage Rooms

Add exam halls. Fields:

| Field | Purpose |
|---|---|
| Room Name | e.g. "Hall 113" |
| Block/Building | e.g. "Manolayam Block" |
| Capacity | Maximum students |
| Rows/Columns | Grid dimensions |
| Location/Floor | e.g. "Ground Floor" |
| Blocked Seats | Seats to skip, e.g. "R1C1, R5C8" |
| Aisle After Column | Column number after which there's an aisle |

---

## Manage Staff

Add invigilators. When you generate seating and select invigilators, they are auto-assigned to halls (one per hall, round-robin) and their names appear on the printed hall sheet.

---

## Manage Students

### Adding students:
**Individual** — fill the form and click Add Student. Register number, department and year are required.

**Bulk Import** — upload a file. Three formats supported:

| Format | What to upload |
|---|---|
| CSV | Just register numbers (one per line) or full CSV |
| Excel (.xlsx) | Same as CSV but Excel format |
| PDF | Upload any seating arrangement PDF — register numbers extracted automatically |

**Minimum CSV format** (just register numbers):
```
732425243001
732425243002
732425243003
```

**Full CSV format:**
```
Name,Register Number,Department,Year,Subject
Arun Kumar,732425243001,AIDS,1,Engineering Mathematics
```

If Department and Year are missing, they are auto-decoded from the register number.

### Sasurie Register Number Format:
```
73  24  25  243  001
│   │   │   │    └── Roll number (001-999)
│   │   │   └─────── Department code
│   │   └─────────── Admission year (25 = 2025 batch = 1st Year)
│   └─────────────── College year code
└─────────────────── College code (73 = Sasurie)
```

| Dept Code | Department |
|---|---|
| 243 | AIDS |
| 205 | IT |
| 104 | CSE |
| 105 | ECE |
| 106 | EEE |
| 103 | MECH |
| 114 | CIVIL |
| 149 | CSE CS |
| 631 | MBA |

---

## Generate Seating

**Step-by-step:**

1. **Select Exam** — choose the exam from the dropdown

2. **Select Halls** — pick one or more rooms (hold Ctrl to select multiple)
   - Optionally assign invigilators

3. **Upload Students** — two options:
   - **Upload CSV tab**: Upload your CSV file. Use the Year and Department filters that appear to narrow down (e.g. 1st Year only, AIDS only)
   - **From Saved Students tab**: Use students already in the database, with filter dropdowns

4. **Seating Rules**:
   - **Interleave Departments** — mix different departments (recommended: ON for multi-dept exams)
   - **Prevent Same Dept Adjacent** — extra check to avoid same-dept neighbours
   - **Separate by Year** — avoid same year sitting adjacent
   - **Question Paper Sets** — how many different question papers

5. Click **⚡ Generate Seating Arrangement**

**After generation:**
- If more students remain than the selected halls can seat, a banner shows "⚠️ 340 students not yet seated"
- Select more halls and click **➕ Generate Next Hall** to seat remaining students
- Repeat until all students are seated
- Click **🖨️ Print All Halls** to print

---

## Archives & Print

All generated arrangements are saved permanently. From Archives:
- View any past arrangement
- Re-print at any time
- See date and time of generation

**Print options:**
- **🖨️ Print All Halls** — one document with all halls, each on its own page
- **🖨️ Print This Hall** — just the current hall
- **🖨️ icon on Manage Exams** — quickly print all halls for any exam

**What the printed sheet contains:**
- College header (Sasurie College of Engineering, Autonomous, address)
- Exam name, subject, code, date, time, duration
- Invigilator name
- Department-wise student count summary
- Full seat grid:
  - Seat number (large, red)
  - Register number
  - Department and Year
  - Subject
  - Paper Set (A/B/C, colour coded)
- ✂ Cut-out door slip at bottom
- Signature boxes: Invigilator, Hall Superintendent, Chief Superintendent

---

## Student Seat Finder

Public page — no login required. Students can use this on any device.

**URL:** `http://your-domain.com` (then click "Find Your Seat" or go directly to the public page)

Students enter their 12-digit register number and see:
- Exam name and subject
- Hall name
- Seat number
- Paper set (A or B)
- Date and time

---

## College Presets

Save frequently-used hall layouts so you don't have to re-enter them every time.

- Add a college (name, address, city)
- Add halls under each college with all room details
- Click **↗ Load to Active Rooms** to make a hall available for seating generation
- Sasurie College's halls are pre-loaded and cannot be deleted

---

## Is the App Complete?

### ✅ Fully Working
- Login / logout with real session authentication
- Multi-user accounts (admin and staff roles)
- Manage Exams (create, edit, delete)
- Manage Rooms (create, edit, delete)
- Manage Staff (create, edit, delete)
- Manage Students (create, edit, delete, bulk import CSV/Excel/PDF)
- Year/dept filter on student upload
- Register number auto-decode (Sasurie format)
- Year-wise subject mapping per exam
- Anti-malpractice seating generation
- **Cumulative Distribution Fix**: Fully accounts for all students without rounding loss
- Multi-hall batch generation with remaining student tracking
- Print-ready hall sheets with door slip
- Print single hall or all halls
- Student Seat Finder (public, no login)
- Archives (all arrangements saved permanently)
- CSV export of students and seating
- College Presets with hall layouts
- Real-time dashboard statistics

### ✅ High-Scale Performance
SeatMatrix is now optimized for large-scale operations:
- **Batch Insertion**: Students are imported in chunks of 200, preventing server timeouts during large CSV uploads (800+ students).
- **Header Mapping**: The system automatically detects variants of headers like "Register Number" or "Roll No".
- **Worker Stability**: Configured for Gunicorn with extended timeouts to handle complex generation tasks.

### 📧 Automated Notification Pipeline
SeatMatrix integrates with **Make.com** and **iLovePDF** to provide automated email notifications:
1. **Trigger**: When you click "Notify via Email", the backend sends a secure payload to Make.com.
2. **PDF Generation**: iLovePDF visits the SeatMatrix hall URL and generates a professional PDF seating card.
3. **Smart Delivery**: Make.com identifies the recipient type (Student vs Staff) and sends a personalized email with the PDF attached.
4. **Rate Limit Protection**: The pipeline includes a 1-second "Sleep" module to stay within Gmail API burst limits.

---

## Render Deployment Guide

SeatMatrix is best deployed on **Render** (Web Service).

### ⚙️ Dashboard Settings
- **Runtime**: Python 3.x
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn -t 120 --bind 0.0.0.0:10000 backend.app:app`
- **Root Directory**: `SeatMatrix`

### 🔑 Environment Variables (.env)
Set these in the Render "Environment" tab:
| Key | Value |
|---|---|
| `ADMIN_USER` | Your custom admin username |
| `ADMIN_PASS` | Your custom admin password |
| `SECRET_KEY` | Generate a long random string |
| `DATABASE_URL` | (Optional) Supabase Postgres URL |
| `N8N_WEBHOOK_URL` | Your Make.com Webhook URL |

---

## FAQ

**Q: I see a "Worker Timeout" error in the logs. What do I do?**  
A: Ensure your Render Start Command includes `-t 120`. This gives the server more time to process large data sets.

**Q: How do I change the Admin login?**  
A: Simply update `ADMIN_USER` and `ADMIN_PASS` in your Render Environment variables. The app will automatically update the database on the next restart.

**Q: Can I use Postgres instead of SQLite?**  
A: Yes. Provide a `DATABASE_URL` and the app will automatically switch to PostgreSQL mode.

**Q: Can multiple staff use the system at the same time?**
A: Yes. Each staff member logs in with their own account. The database handles concurrent access.

**Q: What happens if I generate seating for the same exam twice?**
A: The new arrangement replaces the old one for that exam.

**Q: Can I use any CSV file or only Sasurie format?**
A: Any CSV. If your register numbers follow Sasurie format (73YYXXXNNN), department and year are decoded automatically. Otherwise, provide those columns in the CSV.

**Q: How do I backup my data?**
A: Copy the `database/seatmatrix.db` file. That single file contains everything — exams, rooms, students, users, arrangements.

**Q: I forgot the admin password. How do I reset it?**
A: Stop the server. Open a terminal in the SeatMatrix folder and run:
```python
python3 -c "
import sqlite3, hashlib, os
db_path = os.path.join('database', 'seatmatrix.db')
conn = sqlite3.connect(db_path)
new_pw = hashlib.sha256('newpassword123'.encode()).hexdigest()
conn.execute('UPDATE users SET password=? WHERE username=\\'admin\\'', (new_pw,))
conn.commit(); conn.close()
print('Password reset to: newpassword123')
"
```

Then restart the server and log in with the new password.

**Q: How many students can the system handle?**
A: SQLite handles hundreds of thousands of records. For a college of 5000 students, it will work perfectly.
