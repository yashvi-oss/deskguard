# DeskGuard Frontend

## Overview
React-based student portal and librarian dashboard for managing desk bookings with real-time library map updates.

## Structure

```
frontend/
├── src/
│   ├── index.tsx              # React root
│   ├── App.tsx               # Main app component
│   ├── pages/
│   │   ├── StudentPortal.tsx  # Student interface
│   │   └── AdminDashboard.tsx # Librarian dashboard
│   ├── components/
│   │   ├── LibraryMap.tsx     # Interactive desk map
│   │   ├── DeskCard.tsx       # Individual desk display
│   │   ├── SessionTimer.tsx   # Timer display
│   │   └── Notifications.tsx  # Alert system
│   ├── hooks/
│   │   ├── useWebSocket.ts    # WebSocket connection
│   │   ├── useApi.ts          # API calls
│   │   └── useAuth.ts         # Authentication
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   ├── utils/
│   │   ├── api.ts             # Axios config
│   │   └── storage.ts         # Local storage helpers
│   ├── styles/
│   │   ├── index.css          # Global styles
│   │   ├── map.css            # Map component styles
│   │   └── dashboard.css      # Dashboard styles
│   └── constants/
│       └── config.ts          # Configuration
├── public/
│   └── index.html
├── package.json
└── tsconfig.json
```

## Key Features

### 1. **Interactive Library Map**
- **SVG-based**: Scalable graphics, renders 100+ desks efficiently
- **Real-time Updates**: Via WebSocket, desks change color instantly
- **Color Coding**:
  - 🟢 **Green** = Free (available)
  - 🔴 **Red** = Occupied (in use)
  - 🟡 **Yellow** = Away (break, 20 min limit)
  - ⚫ **Gray** = Abandoned

### 2. **QR Code Check-In**
- Click desk to check in
- Timer starts immediately (2 hours)
- Real-time countdown

### 3. **Timer Display**
- Shows time remaining
- "Still here?" prompt appears at 2-hour mark
- One-click response

### 4. **Away Mode**
- Click "Away" button for break
- 20-minute countdown
- Auto-returns to study mode if clicking back early

### 5. **Librarian Dashboard**
- Live statistics (free, occupied, away, abandoned)
- Manual desk reset
- Abandoned desk alerts
- Session history

## Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm start
```

Server runs on: `http://localhost:3000`

## API Integration

All API calls go through `/api` endpoints on backend (port 5000).

### Key Endpoints Used:

**Check-In**
```typescript
POST /api/sessions/checkin
Body: { desk_id: "uuid" }
```

**Get Live Map**
```typescript
GET /api/desks/map
Response: [{ id, number, status, color }]
```

**Away**
```typescript
POST /api/sessions/:id/away
```

**Respond to Prompt**
```typescript
POST /api/sessions/:id/respond-prompt
```

## WebSocket Events

**Receive (from server):**
```typescript
// Desk status changed
socket.on('desk:updated', (data) => {
  // { desk_id, status, color, timestamp }
});

// "Still here?" prompt
socket.on('prompt:still-here', (data) => {
  // { session_id, message, time_to_respond }
});
```

**Send (to server):**
```typescript
// Join specific desk updates
socket.emit('join-desk', deskId);

// Watch all desks (librarian)
socket.emit('watch-all-desks');
```

## Component Flow

```
App.tsx
├── StudentPortal.tsx
│   ├── LibraryMap.tsx (main interactive map)
│   │   └── DeskCard.tsx (individual desk)
│   ├── SessionTimer.tsx (countdown timer)
│   └── Notifications.tsx (alerts)
└── AdminDashboard.tsx (librarian view)
    ├── StatsPanel.tsx (occupancy stats)
    ├── DesksGrid.tsx (all desks status)
    └── AbandonedAlertsPanel.tsx
```

## State Management

Using React hooks:
- `useState` - Local component state
- `useContext` - Global auth/user state
- `useEffect` - Side effects, WebSocket connection
- `useReducer` - Complex state (desks map)

## Styling

- **CSS Grid** - Library map layout
- **CSS Flexbox** - Component layouts
- **CSS Variables** - Theming (colors, spacing)
- **Responsive Design** - Mobile, tablet, desktop

## Performance

- SVG rendering optimized for large desk counts
- WebSocket reduces API polling
- Component memoization prevents unnecessary re-renders
- Lazy loading for admin dashboard

## Security

- JWT tokens stored in `localStorage`
- CORS configured for backend origin only
- API calls include `Authorization` header
- Route guards for admin pages

## Next Steps

1. Start backend server
2. Configure API base URL in `constants/config.ts`
3. Test student check-in flow
4. Test librarian dashboard
5. Monitor WebSocket updates
