# 🌾 GramCredit — Rural Microfinance Platform

> "Banks ask for ITR and salary slips.
>  We ask for Aadhaar, a ration card, and a harvest month."

[![Live Demo](https://img.shields.io/badge/Live-Demo-green?style=for-the-badge)](https://gram-credit-zeta.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-blue?style=for-the-badge)](https://gramcredit-backend.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Hackathon](https://img.shields.io/badge/Hackathon-Digital%20Impact-orange?style=for-the-badge)](#)

---

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [5 Unique Innovations](#5-unique-innovations)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Workflow](#workflow)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Impact Analysis](#impact-analysis)
- [Future Scope](#future-scope)
- [Team](#team)

---

## 🎯 Problem Statement

Build a **micro-finance and financial inclusion platform**
for rural communities with:
- Multilingual support
- Secure transactions
- Expense tracking
- Financial literacy assistance

**Domain:** Digital Impact — Scalable Platforms,
Fintech & Smart Applications

---

## 💡 Our Solution

GramCredit is a **complete rural financial
operating system** serving three communities:

| Portal | Who | What |
|--------|-----|------|
| 🌾 **Farmer** | Agricultural workers | Harvest-linked loans, crop calendar repayment |
| 🏪 **Vendor** | Kirana + street vendors | Daily ₹50–₹200 micro-repayments |
| 💰 **ROSCA** | Village chit fund groups | Digital transparent chit fund management |
| 👨‍💼 **Officer** | Loan officers | KYC review, approval, analytics dashboard |

### The Gamechanger
Traditional bank: ITR + salary slip + 3 weeks
GramCredit: Aadhaar + ration card + 60 seconds

---

## ⭐ 4 Unique Innovations

### 1. 🌾 Harvest Intelligence Engine
Traditional: Fixed EMI every month
GramCredit:  Repay AFTER harvest
How it works:
→ Farmer selects crop: Paddy
→ System fetches Mandya crop calendar
→ Agmarknet API: current price ₹1,850/quintal
→ Gemini AI: predicts peak ₹2,100 in November
→ Loan repayment auto-scheduled for November
→ If IMD declares drought → auto-pause, zero penalty

### 2. 🤝 Village Trust Network
No credit history? No problem.
→ 3 existing GramCredit users vouch for you
→ Each stakes ₹500 as guarantee
→ Community trust → credit score
→ Loan approved based on village reputation
→ Repaid on time? Vouchers earn ₹50 each

### 3. 💸 Digital ROSCA (Chit Fund)
India's ₹1.5 lakh crore chit fund market
is 100% informal, paper-based, fraud-prone.
GramCredit ROSCA:
→ Group creates digital chit fund
→ Auto UPI collection every month
→ Auction-based payout (lowest bid wins pool)
→ Every rupee visible to every member
→ Immutable ledger — zero fraud possible

### 4. 🏪 Vendor Daily Repayment
Moneylender model: ₹100/day at 40% interest
GramCredit model:  ₹180/day at 8% interest
Same familiar daily rhythm.
Different interest rate.
Digital khata (customer credit book) included.
14-day repayment streak → credit limit increases.

---

## 🚀 Features

### Farmer Portal
- [x] Phone OTP login (Firebase)
- [x] Language selector (Hindi/Kannada/English/Tamil/Telugu)
- [x] 3-document KYC (Aadhaar + Ration card + Land record)
- [x] AI-powered document extraction (Gemini Pro)
- [x] Eligibility score (0–125 points)
- [x] Loan application with 3-step stepper
- [x] Harvest-based repayment mode
- [x] Crop calendar integration (Karnataka districts)
- [x] Farmer dashboard (score, loans, expenses, chart)
- [x] Saathi chatbot (Hindi + Kannada, 3 modes)
- [x] Government scheme matcher (AI-powered)
- [x] Loan repayment with Razorpay UPI
- [x] SMS reminders (Twilio)
  
### Vendor Portal
- [x] Business type onboarding (kirana/vendor/artisan)
- [x] Daily revenue tracker
- [x] Digital khata (customer credit book)
- [x] Daily micro-repayment (₹50–₹200/day)
- [x] Repayment streak rewards

### ROSCA Portal
- [x] Create/join ROSCA group
- [x] Monthly UPI auto-collection
- [x] Transparent group ledger
- [x] Member reliability scores

### Loan Officer Portal
- [x] Analytics dashboard (disbursed, pending, approved)
- [x] Loan application review
- [x] KYC document review
- [x] Approve/reject with one click
- [x] Repayment monitoring

### Security
- [x] HTTPS (Vercel + Render enforced)
- [x] Firebase Phone OTP + JWT
- [x] Razorpay HMAC signature verification
- [x] Idempotency keys (no duplicate payments)
- [x] Aadhaar masking (XXXX-XXXX-4521)
- [x] Rate limiting on all financial endpoints
- [x] Immutable transaction audit trail

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React.js + Tailwind CSS | Web application |
| Routing | React Router v6 | Screen navigation |
| State | React Query + Context | Data management |
| Multilingual | i18next | 5 Indian languages |
| Backend | FastAPI (Python) | REST API engine |
| Database | SQLite Local Database  | Financial data storage |
| AI | Google Gemini Pro | Doc extraction + chatbot |
| Payments | Razorpay Sandbox | UPI loan disbursement |
| Auth | Firebase Phone OTP | Rural users phone-first |
| Storage | Cloudinary | KYC document storage |
| SMS/WhatsApp | Twilio | Reminders + WA bot |
| Hosting FE | Vercel | Frontend deployment |
| Hosting BE | Render.com | Backend deployment |
| DB Hosting | Supabase | Managed PostgreSQL |

---

## 🏗️ System Architecture
┌─────────────────────────────────────────────────────┐
│                  USER ACCESS LAYER                   │
│   Web App (React)  │  WhatsApp Bot  │  Voice Input  │
│         i18next — Hindi · Kannada · English          │
└─────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│                 PLATFORM PORTALS                     │
│  Farmer Portal  │  Vendor Portal  │  ROSCA  │ Officer│
└─────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│              BACKEND — FastAPI (Python)               │
│  Auth │ KYC │ Loans │ Expenses │ ROSCA │ Schemes     │
│       Payments │ Chatbot │ Notifications             │
└─────────────────────────────────────────────────────┘
│                │               │
▼                ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  AI Services │  │  Database    │  │  3rd Party   │
│  Gemini Pro  │  │  PostgreSQL  │  │  Razorpay    │
│  Doc extract │  │  Supabase    │  │  Firebase    │
│  Saathi bot  │  │  10 tables   │  │  Twilio      │
│  Harvest AI  │  │              │  │  Cloudinary  │
└──────────────┘  └──────────────┘  └──────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│                   DEPLOYMENT                         │
│   Vercel (FE)  │  Render (BE)  │  Supabase (DB)     │
└─────────────────────────────────────────────────────┘

---

## 🔄 User Workflow
Farmer opens WhatsApp → sends "LOAN"
↓
Bot replies in Kannada
↓
Farmer sends Aadhaar photo
↓
Gemini Pro extracts: Name, DOB, District
↓
Farmer uploads Ration card → +20 pts
Farmer uploads Land record → +35 pts
↓
Total score: 80/125 → eligible ₹50,000
↓
Farmer selects ₹20,000 — Paddy harvest
↓
Harvest AI: "Repay in November after harvest"
↓
Loan approved → Razorpay UPI transfer
↓
SMS in Kannada: "₹20,000 credited ✓"
↓
Dashboard shows active loan + due date
↓
Saathi chatbot: answers questions in Hindi
↓
November: Farmer repays → credit score +15
↓
Next loan: higher amount, lower interest

--

## 🔑 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=sqlite:///./gramcredit.db

# JWT
JWT_SECRET=your_secret_key_min_32_characters
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7

# AI
GEMINI_API_KEY=AIzaSy_your_key_here

# App
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
VITE_RAZORPAY_KEY=rzp_test_xxxxxxxxxx
VITE_FIREBASE_API_KEY=AIza_your_key
VITE_FIREBASE_AUTH_DOMAIN=gramcredit.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gramcredit
```

---

## 📡 API Documentation

Full Swagger docs: `http://localhost:8000/docs`

### Key Endpoints
AUTH:
POST /auth/send-otp         Send OTP to phone
POST /auth/verify-otp       Verify OTP, get JWT
USER:
GET  /user/profile          Get user profile
POST /user/profile          Create/update profile
DOCUMENTS:
POST /documents/upload      Upload KYC document
POST /documents/verify      AI verification
GET  /documents/eligibility Get loan eligibility score
LOANS:
POST /loans/apply           Apply for loan
GET  /loans/active          Get active loans
POST /loans/create-order    Create Razorpay order
POST /loans/verify-payment  Verify payment signature
EXPENSES:
POST /expenses/add          Add expense
POST /expenses/photo        AI photo extraction
GET  /expenses/analytics    Monthly analytics
CHATBOT:
POST /chatbot/expense       Expense advisor (Hindi/Kannada)
POST /chatbot/literacy      Financial literacy bot
POST /chatbot/loan          Loan guidance bot
ROSCA:
POST /rosca/create          Create ROSCA group
POST /rosca/join            Join group
GET  /rosca/:id/ledger      Full transaction ledger
WHATSAPP:
POST /whatsapp/webhook      Twilio WhatsApp webhook

---

## 🔒 Security

| Security Layer | Implementation |
|----------------|----------------|
| HTTPS | Enforced by Vercel + Render |
| Authentication | Firebase Phone OTP + JWT |
| Payment integrity | Razorpay HMAC SHA256 signature |
| Duplicate prevention | Idempotency keys on all payments |
| Data privacy | Aadhaar masked (XXXX-XXXX-4521) |
| API protection | Rate limiting via slowapi |
| Audit trail | Immutable transaction_logs table |
| KYC compliance | UIDAI masking guidelines followed |

### Mock KYC Notice
This prototype uses MockKYCService for
Aadhaar, Ration Card, and Land Record
verification. This is intentional —
UIDAI production API requires RBI-registered
NBFC license (3-6 month approval process).
Production replacement:
MockKYCService → KARZATechService
(licensed KYC provider)
Same interface. Zero other code changes.

# 📊 Impact Analysis

| Metric | Data |
|--------|------|
| Target users | 190 million unbanked Indians |
| Market size | ₹3.5 lakh crore micro-loan TAM |
| Kirana stores | 45 million without formal credit |
| ROSCA members | 350 million chit fund participants |
| Languages | 5 (covers 800M+ Indians) |
| Onboarding cost | ₹10 per farmer |
| Revenue per farmer | ₹500+/year |
| Interest saved | 8% vs 48% moneylender rate |
| Loan approval time | 60 seconds vs 3 weeks |

---

## 🗺️ Future Scope

### Phase 1 — 3 Months
- [ ] Real UIDAI eKYC via KARZA Tech API
- [ ] Flutter mobile app for Android
- [ ] ROSCA auction bidding
- [ ] Vendor UPI auto-debit mandate
- [ ] Tamil + Telugu full translations
- [ ] 1,000 pilot farmers in Mandya, Karnataka

### Phase 2 — 6 Months
- [ ] 3 NBFC lending partners onboarded
- [ ] Karnataka Vikas Grameena Bank MOU
- [ ] 10,000 active borrowers
- [ ] ₹10 crore loan book
- [ ] PMFBY crop insurance auto-claim
- [ ] Expand to Tamil Nadu + Andhra Pradesh

### Phase 3 — 1 Year
- [ ] 1 lakh farmers + 25,000 vendors
- [ ] ₹100 crore annual loan book
- [ ] Open API for fintechs to build on
- [ ] India's first rural alternative credit bureau
- [ ] Pan-India ROSCA marketplace
- [ ] Series A fundraise

---

## 💼 Business Model
GramCredit = Technology platform (NOT a lender)
Money flow:
NBFC/Cooperative Bank (capital)
↓
GramCredit (verified farmer profile)
↓
Razorpay (payment infrastructure)
↓
Farmer's UPI account
Revenue streams:

1.5–2% origination fee per loan
0.5% transaction fee per repayment
₹50K–₹2L/month SaaS to banks
₹50 per govt scheme application
1% of monthly ROSCA pool


---

## 👥 Team

| Member | Role | Responsibility |
|--------|------|----------------|
| [Name 1] | Backend Lead | FastAPI, KYC engine, loan engine, DB |
| [Name 2] | Frontend Lead | React, UI/UX, all screens |
| [Name 3] | AI + Integrations | Gemini Pro, WhatsApp bot, Razorpay |
| [Name 4] | Presenter + QA | PPT, demo, testing, documentation |

---

## 🏆 Hackathon

**Event:** [Hackathon Name] 2025
**Domain:** Digital Impact — Scalable Platforms,
            Fintech & Smart Applications
**Problem:** Micro-finance and financial inclusion
             platform for rural communities
**Date:** May 29–30, 2025

---

## 📱 Live Demo

**Web App:** https://gram-credit-zeta.vercel.app
**Backend API:** https://gramcredit-backend.onrender.com/docs

**Test Credentials:**
Phone:    +91 9999999999
OTP:      123456
Razorpay: UPI → success@razorpay

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**GramCredit — Built for Bharat, not just India** 🌾

*"We didn't build a loan app.*
*We built the financial system rural India was never given."*

</div>

📁 Additional Files to Add to GitHub
Create LICENSE file
MIT License

Copyright (c) 2025 GramCredit Team

Permission is hereby granted, free of charge,
to any person obtaining a copy of this software...
[standard MIT license text]
Create .gitignore
# Environment files
.env
.env.local
.env.production

# Python
__pycache__/
venv/
*.pyc
.pytest_cache/

# Node
node_modules/
dist/
build/
.vite/

# IDE
.vscode/
.idea/

# Firebase
firebase-adminsdk*.json

# OS
.DS_Store
Thumbs.db

# Logs
*.log
Create CONTRIBUTING.md
markdown# Contributing to GramCredit

## Team Branches
- main       → production ready
- dev        → active development
- feat/auth  → Member 1
- feat/ui    → Member 2
- feat/ai    → Member 3

## Commit Convention
feat: add new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code refactor

## Example
git commit -m "feat: add harvest repayment scheduler"

⚡ Quick GitHub Setup Commands
bash# Initialize and push
git init
git add .
git commit -m "feat: initial GramCredit platform"
git branch -M main
git remote add origin https://github.com/YOUR/gramcredit
git push -u origin main

# Create dev branch
git checkout -b dev
git push origin dev

# Each member creates their branch
git checkout -b feat/backend
git checkout -b feat/frontend
git checkout -b feat/ai
