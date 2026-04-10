# Guide: Setting Up Your Free Database (Supabase)

To keep your student data safe on the public internet, you need a managed PostgreSQL database. Follow these steps to get one for free:

## 1. Create a Supabase Account
1. Go to [Supabase.com](https://supabase.com) and sign up (using your GitHub account is easiest).
2. Click **New Project** and name it `SeatMatrix`.
3. Set a **Database Password** (Save this! You will need it).
4. Choose the Region closest to you.
5. Click **Create new project**. It will take 1-2 minutes to provision.

## 2. Get Your Connection String
1. Once the project is ready, click the **Settings** (gear icon) in the bottom left sidebar.
2. Go to **Database**.
3. Scroll down to **Connection String**.
4. Select the **URI** tab.
5. It will look like this:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres`
6. **Important**: Replace `[YOUR-PASSWORD]` with the password you created in Step 1.

## 3. Connect to SeatMatrix
1. Open your **Render.com** (or Railway) dashboard.
2. Go to your **SeatMatrix** service settings.
3. Find the **Environment Variables** section.
4. Add a new variable:
   - **Key**: `DATABASE_URL`
   - **Value**: (Paste your URI from Step 2)
5. Save changes. The app will restart and automatically create your database tables!

## 4. Local Testing (Optional)
If you want to test PostgreSQL locally before pushing to GitHub:
1. Paste the `DATABASE_URL` into your local `.env` file.
2. Run `python backend/app.py`.
3. The app will detect the URL and use Supabase instead of your local `seatmatrix.db` file.

> [!TIP]
> **Data Migration**: Your existing local data in `seatmatrix.db` will NOT automatically move to Supabase. You will need to re-upload your students/exams on the live site after deployment.
