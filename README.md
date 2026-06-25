# LocalConnect

LocalConnect is a community commerce platform connecting residents with local shops, facilitated by ambassadors.

## Getting Started

The project consists of a **FastAPI backend** and a **React/Vite frontend**.

### 1. Prerequisites
- Python 3.8+
- Node.js 18+

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. (Optional) Re-seed the database:
   ```bash
   python seed_db.py
   ```
4. Run the server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
Backend will be at: `http://localhost:8000`

### 3. Frontend Setup
1. Stay in the root directory:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
Frontend will be at: `http://localhost:5173`

##  Test Accounts
Use these credentials to test different user flows:

| Role | Email | Password |
|------|-------|----------|
| **Resident** | `resident@local.com` | `password123` |
| **Ambassador** | `ambassador@local.com` | `password123` |
| **Shop Owner** | `owner1@shops.com` | `password123` |
| **Admin** | `admin@localconnect.com` | `password123` |

---
*Built with React, Vite, Tailwind CSS, FastAPI, and SQLAlchemy.*
