# 📧 Pro-Level Email Security Guide (SPF, DKIM, DMARC)

This document contains the exact technical records required to authenticate the `sasurie.ac.in` domain for the SeatMatrix notification system.

---

### 📋 Instructions for the IT Department
To ensure our examination seating cards reach students' inboxes (and never the Spam folder), please add the following **TXT Records** to our domain DNS settings:

#### 1. SPF Record (Sender Policy Framework)
- **Host/Name**: `@` or leave empty
- **Type**: `TXT`
- **Value**: `v=spf1 include:_spf.google.com ~all`
- **Purpose**: Authorizes our college server to send mail on behalf of the domain.

#### 2. DKIM Record (DomainKeys Identified Mail)
- **Host/Name**: `google._domainkey`
- **Type**: `TXT`
- **Value**: (You must generate this in the Google Admin Console > Gmail > Authenticate Email)
- **Purpose**: Adds a digital signature to every email to prove the sender is legitimate.

#### 3. DMARC Record
- **Host/Name**: `_dmarc`
- **Type**: `TXT`
- **Value**: `v=DMARC1; p=quarantine; pct=100; dmarc;`
- **Purpose**: Tells Gmail to move suspicious emails to the Spam folder instead of blocking them entirely.

---

### ⚠️ IMPORTANT: Handling the 500-Email Daily Limit
Gmail's free tier (and some Workspace tiers) has a **hard limit of 500 recipients per 24 hours**. 

**Since we have 860 students:**
1. **The Problem**: You will ALWAYS get a "Rate Limit Exceeded" error if you try to send to everyone in one day via a standard Gmail connection.
2. **The Solution**: We recommend switching the **Gmail Module** in Make.com to the **"SMTP"** module using a dedicated sender like **Resend.com** or **SendGrid**.
3. **Benefit**: These services allow 3,000 to 50,000 emails per month for free and have **Zero "Wait Time"** once set up.

---

Built for **Sasurie College of Engineering** — Ensuring 100% Reliable Communication.
