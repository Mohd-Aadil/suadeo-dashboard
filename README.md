Monitoring Dashboard
A real-time monitoring dashboard built with React 18, TypeScript, and Vite.
Run
npm install
npm run dev
Other commands: npm test, npm run lint, and npm run build.
Settings
Copy .env.example to .env to change these options:
Setting	Default	Description
VITE_STREAM_URL	empty	WebSocket URL. Leave empty to use the demo feed.
VITE_BUFFER_SIZE	10000	Maximum events kept in memory.
VITE_FLUSH_MS	250	How often events update on screen.


The demo feed works without a server. It includes large bursts, invalid messages, and random disconnects.
Dashboard controls
- Pause, resume, or retry the connection from the sidebar.
- Choose a time range: 30 seconds, 1 minute, or 5 minutes.
- Filter the events table by level.
A few details
Messages are checked before use, and updates are grouped so the screen doesn’t refresh for every event. The chart uses uPlot, and the event list is virtualized to help it handle larger feeds.
Pausing keeps the connection open. Events are queued until you resume, up to the buffer limit.