# SeatMatrix: Public Internet Deployment Guide

This guide will take you from a local project to a live, professional web application accessible to everyone on the internet.

---

## Part 1: Setting up the Database (Supabase)

Supabase provides a professional-grade PostgreSQL database for free.

1.  **Sign up**: Go to [Supabase.com](https://supabase.com) and create an account.
2.  **New Project**: Create a project named `SeatMatrix`.
3.  **Database Password**: Create a strong password and **Save it**.
4.  **Get Connection String**:
    -   Go to **Project Settings** -> **Database**.
    -   Under **Connection string**, select **URI**.
    -   Copy the string. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres`
    -   **Replace** `[YOUR-PASSWORD]` with your actual password.

---

## Part 2: Moving Your Data (Migration)

If you have already added students or exams in your local app, you can move them to the live database:

1.  Open your local `.env` file in the root folder.
2.  Add your Supabase link: `DATABASE_URL=postgresql://postgres:password@host:port/postgres`
3.  Open a terminal in the root folder and run:
    ```powershell
    python backend/migrate_to_pg.py
    ```
4.  All your data is now securely uploaded to Supabase!

---

## Part 3: Deploying the Website (Render)

Render will host your Flask server and connect it to your GitHub and Supabase.

1.  **Sign up**: Go to [Render.com](https://render.com) and connect your GitHub.
2.  **New Web Service**: Click **New +** -> **Web Service**.
3.  **Connect Repo**: Select your `SeatMatrix` repository.
4.  **Configure**:
    -   **Name**: `seatmatrix` (or any name)
    -   **Region**: Select the one closest to you.
    -   **Runtime**: `Python 3`
    -   **Build Command**: `pip install -r requirements.txt`
    -   **Start Command**: `gunicorn --chdir backend app:app` (Make sure `gunicorn` is in your requirements.txt)
5.  **Environment Variables**: Click **Advanced** and add:
    -   `SECRET_KEY`: (Any random long string)
    -   `DATABASE_URL`: (Your Supabase URI from Part 1)
6.  **Deploy**: Click **Create Web Service**.

---

## Part 4: Final Verification

1.  Once Render finishes building (it takes ~3 minutes), it will give you a public URL (e.g., `https://seatmatrix-xxxx.onrender.com`).
2.  Open this URL on your phone or another computer.
3.  Try the **Student Seat Finder** — it should now work globally!

---

## Part 5: Keeping it Updated

Whenever you make changes to the code:
1.  Run `git add .`, `git commit -m "update"`, and `git push origin main`.
2.  **Render will automatically detect the push** and re-deploy your website with the new changes!

> [!CAUTION]
> **Database Reset Note**: If you use Render's FREE PostgreSQL instead of Supabase, your database will expire in 90 days. Using **Supabase** ensures your data stays as long as the project is active.
