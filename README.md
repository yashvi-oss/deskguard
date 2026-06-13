# DeskGuard – Library Seat Booking & Anti-Hoarding App

##  Overview
DeskGuard solves library desk hoarding by providing a real-time, fair desk booking system with automatic expiration of abandoned desks.

## What We're Building

### The Problem
- Students reserve desks with bags and disappear for hours
- No way to track if someone is actually using the desk
- Other students have nowhere to study
- No fair system to manage occupancy

### The Solution
**Live Library Map** → **QR Code Check-In** → **Auto-Expiry System** → **Fair Access**

##  Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT/LIBRARIAN BROWSER                 │
│  (React Frontend: Interactive Map + Check-in/Dashboard)     │
└──��───────────────┬──────────────────────────────────────────┘
                   │ WebSocket (Real-time updates)
                   │ REST API (Check-in/Check-out/Away)
┌──────────────────▼──────────────────────────────────────────┐
│            BACKEND SERVER (Node.js + Express)               │
│  • API Routes (check-in, check-out, away, reset)            │
│  • WebSocket Server (broadcast desk status changes)         │
│  • Business Logic (timer validation, auto-expiry)          │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼─────────┐  ┌────────▼────────┐
│   PostgreSQL    │  │      Redis      │
│   (Persistent)  │  │   (Timers)      │
├─────────────────┤  ├─────────────────┤
│ • desks         │  │ • Active timers │
│ • users         │  │ • Away sessions │
│ • sessions      │  │ • Cache         │
│ • events        │  │                 │
└────────┬────────┘  └────────┬────────┘
         │                    │
         └────────┬───────────┘
                  │
         ┌────────▼──────────┐
         │  Background Job   │
         │  (Runs every 60s) │
         │                   │
         │ • Check timers    │
         │ • Expire desks    │
         │ • Send alerts     │
         └───────────────────┘
```

##  Project Structure

```
deskguard/
├── backend/                 # Node.js/Express Server
├── frontend/                # React Application
├── shared/                  # Shared Types & Utils
├── docker-compose.yml       # PostgreSQL + Redis setup
└── README.md
```

##  Getting Started

### Prerequisites
- Node.js (v16+)
- Docker & Docker Compose (for PostgreSQL and Redis)

### Quick Start

1. **Clone and navigate:**
   ```bash
   git clone https://github.com/yashvi-oss/deskguard.git
   cd deskguard
   ```

2. **Start databases:**
   ```bash
   docker-compose up -d
   ```

3. **Setup backend:**
   ```bash
   cd backend
   npm install
   npm run db:migrate
   npm run dev
   ```

4. **Setup frontend (new terminal):**
   ```bash
   cd frontend
   npm install
   npm start
   ```

5. **Access the app:**
   - Student Portal: http://localhost:3000
   - Librarian Dashboard: http://localhost:3000/admin

##  Key Concepts Explained

### 1. **Server-Side Timers (Why this matters)**
- Browser timers can be manipulated by users
- Server-side timers are trustworthy and secure
- Every desk timer lives in Redis (fast memory database)
- Backend validates everything

### 2. **The 3 Desk States**
- **🟢 GREEN (Free)**: No one using the desk
- **🔴 RED (Occupied)**: Student checked in and active
- **🟡 YELLOW (Away)**: Student on break (up to 20 minutes)

### 3. **Timer Flow**
```
Student Scans QR
    ↓
  Check-In (starts 2-hour timer)
    ↓
[After 2 hours] → "Still here?" prompt
    ↓
No Response → Auto-Abandon (desk freed)
Yes Response → Timer resets
    ↓
OR Student clicks "Away" (starts 20-min away timer)
    ↓
[After 20 minutes] → Desk auto-abandoned if no activity
```

##  Documentation

- [Backend Setup Guide](./backend/README.md)
- [Frontend Setup Guide](./frontend/README.md)
- [Database Schema](./docs/DATABASE.md)
- [API Documentation](./docs/API.md)
- [Architecture Deep Dive](./docs/ARCHITECTURE.md)

## 🛠️ Tech Stack Details

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | React + TypeScript | Modern UI, type-safe |
| Backend | Node.js + Express | Fast, JavaScript, easy async |
| Database | PostgreSQL | Reliable, persistent storage |
| Cache | Redis | Ultra-fast timers, real-time state |
| Real-time | Socket.io | Live map updates |
| Map | SVG + React | Scalable, interactive graphics |

## Database Tables Preview

```sql
-- Desks in the library
CREATE TABLE desks (
  id UUID PRIMARY KEY,
  desk_number INT,
  location TEXT,
  status VARCHAR(20), -- 'free', 'occupied', 'away', 'abandoned'
  current_user_id UUID,
  created_at TIMESTAMP
);

-- Student check-in sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID,
  desk_id UUID,
  checked_in_at TIMESTAMP,
  check_out_at TIMESTAMP,
  status VARCHAR(20), -- 'active', 'away', 'abandoned'
  away_started_at TIMESTAMP
);

-- Timer tracking (also in Redis for speed)
CREATE TABLE timers (
  id UUID PRIMARY KEY,
  session_id UUID,
  timer_type VARCHAR(20), -- 'session', 'away', 'prompt'
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);
```

##  Frontend Pages

1. **Student Portal** (`/`)
   - Interactive library map (SVG)
   - QR scanner
   - Current session info
   - Check-out button

2. **Librarian Dashboard** (`/admin`)
   - All desks status
   - Abandoned desk alerts
   - Manual reset controls
   - Statistics

## Background Job 

**Every 60 seconds:**
```
1. Query Redis for all active timers
2. Check which ones have expired
3. For expired "session" timers → Send "Still here?" prompt
4. For expired "away" timers → Mark desk as abandoned
5. For ignored prompts → Auto-abandon desk
6. Update PostgreSQL with new states
7. Broadcast updates via WebSocket to all connected clients
```

##  Security Considerations

- ✅ Server validates all timer expirations
- ✅ Students can't manipulate their timers via browser
- ✅ QR codes are one-time use (prevent sharing)
- ✅ Librarian actions are logged
- ✅ Authentication middleware on all endpoints

##  Performance Notes

- Redis stores active timers (sub-millisecond lookups)
- PostgreSQL stores permanent history
- WebSocket broadcasts reduce polling overhead
- SVG map renders efficiently even with 100+ desks

##  Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

##  Support

For issues and questions, open an issue on GitHub.
