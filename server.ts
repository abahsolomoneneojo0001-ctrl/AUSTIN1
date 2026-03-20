import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { format, subDays, isSameDay, parseISO, differenceInCalendarDays } from "date-fns";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Mock Database ---
let userProfile = {
  id: "user_1",
  name: "Jacob",
  connectedApps: {
    appleHealth: false,
    googleFit: false,
  },
  workoutLogs: [
    { id: '1', title: 'HIIT Cardio Blast', date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), duration: '30 Min', calories: 350 },
    { id: '2', title: 'Full Body Strength', date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), duration: '60 Min', calories: 450 },
    { id: '3', title: 'Morning Yoga Flow', date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), duration: '20 Min', calories: 120 },
  ],
  stats: {
    totalWorkouts: 42,
    totalMinutes: 1850,
    caloriesBurned: 12400,
  }
};

// --- Helper: Calculate Strict Streak ---
function calculateStrictStreak(logs: string[]) {
  if (!logs || logs.length === 0) return 0;
  
  // Sort dates descending
  const uniqueDates = [...new Set(logs)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

  let streak = 0;
  let currentDateToCheck = todayStr;

  // If the most recent workout is neither today nor yesterday, the streak is broken (0)
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  // If the most recent is yesterday, start checking from yesterday
  if (uniqueDates[0] === yesterdayStr) {
    currentDateToCheck = yesterdayStr;
  }

  for (const logDate of uniqueDates) {
    if (logDate === currentDateToCheck) {
      streak++;
      currentDateToCheck = format(subDays(parseISO(currentDateToCheck), 1), 'yyyy-MM-dd');
    } else {
      break; // Gap found, streak ends
    }
  }

  return streak;
}

// --- API Routes ---

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  // Mock Cognito/Auth logic to segregate admin and user
  if (email === 'admin@fit.com') {
    res.json({ success: true, user: { email, role: 'admin', name: 'Admin' } });
  } else {
    res.json({ success: true, user: { email, role: 'user', name: userProfile.name } });
  }
});

app.get("/api/coach/availability", (req, res) => {
  const date = req.query.date;
  const slots = [];
  // Booking from 9 AM to 6 PM
  for (let i = 9; i <= 18; i++) {
    const timeString = `${i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}`;
    // Pseudo-random availability based on date and time
    const isAvailable = Math.random() > 0.4; // 60% chance available
    slots.push({ time: timeString, available: isAvailable });
  }
  res.json({ slots });
});

app.get("/api/progress", (req, res) => {
  const streak = calculateStrictStreak(userProfile.workoutLogs.map(l => l.date));
  
  // Generate mock chart data based on logs
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const didWorkout = userProfile.workoutLogs.some(l => l.date === dateStr);
    return {
      day: format(d, 'EEE'),
      date: dateStr,
      calories: didWorkout ? Math.floor(Math.random() * 200) + 300 : 0,
      minutes: didWorkout ? Math.floor(Math.random() * 30) + 30 : 0,
    };
  });

  res.json({
    streak,
    stats: userProfile.stats,
    connectedApps: userProfile.connectedApps,
    chartData,
    logs: userProfile.workoutLogs
  });
});

app.post("/api/workouts/log", (req, res) => {
  const { title = 'Quick Workout', duration = '45 Min', calories = 350 } = req.body || {};
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  userProfile.workoutLogs.push({
    id: Date.now().toString(),
    title,
    date: todayStr,
    duration,
    calories
  });
  
  userProfile.stats.totalWorkouts += 1;
  userProfile.stats.totalMinutes += parseInt(duration) || 45;
  userProfile.stats.caloriesBurned += calories;
  
  const streak = calculateStrictStreak(userProfile.workoutLogs.map(l => l.date));
  res.json({ success: true, streak });
});

app.post("/api/apps/connect", (req, res) => {
  const { app: appName } = req.body; // 'appleHealth' | 'googleFit'
  if (appName === 'appleHealth' || appName === 'googleFit') {
    userProfile.connectedApps[appName] = !userProfile.connectedApps[appName];
    res.json({ success: true, connectedApps: userProfile.connectedApps });
  } else {
    res.status(400).json({ error: "Invalid app" });
  }
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
