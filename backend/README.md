# DeskGuard Backend

## Overview
Node.js + Express server managing desks, timers, and real-time updates via WebSocket.

## Architecture

```
HTTP/WebSocket Requests
        ↓
    Express Server
        ↓
    Router (API Routes)
        ↓
    Controllers (Business Logic)
        ↓
    Services (Database + Redis)
        ↓
    PostgreSQL + Redis
```

## Key Directories

```
backend/
├── src/
│  ├── index.ts              # Server entry point
│  ├── config/
│  │  ├── database.ts          # PostgreSQL connection
│  │  ├── redis.ts             # Redis connection
│  │  └── env.ts               # Environment variables
│  ├── routes/
│  │  ├── desks.ts             # Desk endpoints
│  │  ├── sessions.ts          # Session endpoints
│  │  └── admin.ts             # Librarian endpoints
│  ├── controllers/
│  │  ├── deskController.ts    # Desk logic
│  │  ├── sessionController.ts # Session logic
│  │  └── adminController.ts   # Admin logic
│  ├── services/
│  │  ├── deskService.ts       # Desk database ops
│  │  ├── sessionService.ts    # Session database ops
│  │  ├── timerService.ts      # Timer management (Redis)
│  │  └── notificationService.ts # Alert handling
│  ├── jobs/
│  │  └── timerSweepJob.ts     # Background job (runs every 60s)
│  ├── middleware/
│  │  ├── auth.ts              # JWT verification
│  │  └── errorHandler.ts      # Error catching
│  ├── types/
│  │  └── index.ts             # TypeScript interfaces
│  ├── utils/
│  │  └── logger.ts            # Logging utility
│  └── websocket.ts         # Socket.io setup
├── dist/                  # Compiled JavaScript
├── scripts/
│  ├── migrate.js           # Database initialization
│  └── seed.js              # Sample data
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start Database & Redis
```bash
cd ..
docker-compose up -d
```

### 4. Initialize Database
```bash
cd backend
npm run db:migrate
```

### 5. Start Development Server
```bash
npm run dev
```

Server runs on: `http://localhost:5000`

## API Endpoints

### Student Endpoints

**Check-In (QR Scan)**
```
POST /api/sessions/checkin
Body: { desk_id: "uuid" }
Response: { session_id, desk_status: "red", expires_at }
```

**Away Mode**
```
POST /api/sessions/:id/away
Body: {}
Response: { status: "away", expires_at }
```

**Check-Out**
```
POST /api/sessions/:id/checkout
Body: {}
Response: { status: "success" }
```

**Get Live Map**
```
GET /api/desks/map
Response: [
  { id: "uuid", number: 1, status: "free", color: "green" },
  { id: "uuid", number: 2, status: "occupied", color: "red" },
  ...
]
```

### Librarian Endpoints

**Reset Desk**
```
POST /api/admin/desks/:id/reset
Body: {}
Response: { status: "reset" }
```

**Get Abandoned Desks**
```
GET /api/admin/desks/abandoned
Response: [ { desk_id, abandoned_at, session_info } ]
```

## How It Works (Data Flow)

### Student Check-In Flow

```
1. Student scans QR code with desk ID
   ↓
2. Frontend sends POST /api/sessions/checkin { desk_id }
   ↓
3. Backend (sessionController):
   - Validates desk exists and is free
   - Creates session record in PostgreSQL
   - Stores timer in Redis (expires in 2 hours)
   - Returns success + expiry time
   ↓
4. Frontend updates UI: desk turns RED
   ↓
5. WebSocket broadcasts to all connected clients:
   "Desk #5 is now OCCUPIED"
```

### Background Timer Sweep Job

```
Every 60 seconds:

1. Query Redis for ALL active timers
2. Check which ones have expired
   ↓
3. For EXPIRED "session" timers:
   - Send "Still here?" prompt
   - Create "prompt" timer (user has 5 min to respond)
   ↓
4. For EXPIRED "prompt" timers:
   - No response received → Mark desk as ABANDONED
   - Set desk status to "free" in PostgreSQL
   - Remove from Redis
   ↓
5. For EXPIRED "away" timers:
   - Mark desk as ABANDONED if away > 20 min
   - Or ask for confirmation if still away
   ↓
6. Update PostgreSQL with new states
   ↓
7. Broadcast changes via WebSocket to all clients
```

## Key Services Explained

### timerService.ts
Manages all timer operations in Redis:
```typescript
// Set a timer
await setTimer(sessionId, 'session', 7200); // 2 hours

// Check if expired
const isExpired = await isTimerExpired(sessionId, 'session');

// Get all active timers
const timers = await getAllActiveTimers();

// Delete timer
await deleteTimer(sessionId, 'session');
```

### deskService.ts
Manages desk state in PostgreSQL:
```typescript
// Get all desks
const desks = await getAllDesks();

// Update desk status
await updateDeskStatus(deskId, 'occupied');

// Find free desks
const freeDesks = await getFreeDes
ks();
```

### sessionService.ts
Manages student sessions:
```typescript
// Create session
const session = await createSession(userId, deskId);

// Get session
const session = await getSession(sessionId);

// End session
await endSession(sessionId);
```

## Real-Time Updates with WebSocket

When a desk status changes:

```typescript
// Backend broadcasts to ALL connected clients
io.emit('desk:updated', {
  desk_id: '123',
  status: 'free',  // free, occupied, away, abandoned
  color: 'green',  // green, red, yellow
  timestamp: Date.now()
});

// Frontend receives and updates map
onDeskUpdate((data) => {
  updateDeskOnMap(data.desk_id, data.color);
});
```

## Database Schema Preview

### desks table
```sql
CREATE TABLE desks (
  id UUID PRIMARY KEY,
  desk_number INT NOT NULL,
  floor INT,
  section VARCHAR(20),
  status VARCHAR(20) DEFAULT 'free', -- free, occupied, away, abandoned
  current_session_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### sessions table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  desk_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, away, abandoned, checked_out
  checked_in_at TIMESTAMP DEFAULT NOW(),
  checked_out_at TIMESTAMP,
  away_started_at TIMESTAMP,
  is_responding BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### timers table (Redis only, not persisted long-term)
```
Key: timer:{sessionId}:{type}
Value: {
  type: 'session' | 'away' | 'prompt',
  expires_at: timestamp,
  created_at: timestamp
}
TTL: auto-expires in Redis
```

## Error Handling

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-06-13T12:00:00Z"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Desk not found",
  "code": "DESK_NOT_FOUND",
  "timestamp": "2024-06-13T12:00:00Z"
}
```

## Next Steps

1. Review the frontend structure (React)
2. Test the API endpoints
3. Monitor background job logs
4. Check real-time WebSocket updates
