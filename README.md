# Smart Board

Smart Board is a small React (Vite) + Capacitor application that lets you control a set of remote "switches" in real time over a WebSocket connection. The app is designed to run in the browser and on Android devices.

## Key features

- Real-time control of switches via WebSocket.
- Simple, mobile-first UI built with React and Tailwind.
- Works as a web app and as a Capacitor-wrapped Android app.
- Small, extensible WebSocket protocol (auth, toggle, all, switches updates).

## Tech stack

- Frontend: React 19, Vite, TailwindCSS
- Mobile wrapper: Capacitor
- PWA support via `vite-plugin-pwa`
- Tooling: ESLint

## Quick start (development)

Prerequisites:

- Node.js (22+ recommended) and bun
- Android Studio (for building/running on Android)

Install dependencies:

```bash
bun install
```

Run the dev server (hot reload):

```bash
bun run dev
```

Open http://localhost:5173 in your browser (Vite will print the exact URL).

Notes:

- The app's React entry is `src/main.jsx`. The router exposes two pages: `Home` (main control surface) and `Settings` (where you set WebSocket address and token).
- The Socket connection details (address + token) are stored in app settings and consumed by `src/context/SocketContext.jsx`.

## Build for production

```bash
bun run build
```

This outputs the production files into the `dist/` directory (see `capacitor.config.json`).

To preview the production build locally:

```bash
bun run preview
```

## Capacitor / Android

Capacitor is configured with `webDir: "dist"` in `capacitor.config.json`, so you must run a production build or a preview build before copying web assets into the native project.

Typical steps to run on Android (first time):

```bash
bun run build
bunx cap copy android
bunx cap open android
```

Then build/run the Android project from Android Studio or use `bunx cap run android`.

If you want to iterate faster on device while developing, you can run the dev server and use a live web URL, but you'll need to configure Capacitor and Android to load a remote URL (not covered here).

## WebSocket protocol (what the app expects)

The frontend's socket logic is in `src/context/SocketContext.jsx`. The app expects a WebSocket server that speaks the following simple JSON messages:

- Client -> Server (authenticate immediately on open):

```json
{ "type": "auth", "token": "<token string>" }
```

- Server -> Client (initial or updated switches state):

```json
{ "type": "switches", "switches": [ { "id": "1", "state": "ON" }, { "id": "2", "state": "OFF" } ] }
```

- Client -> Server (toggle a single switch):

```json
{ "type": "toggle", "id": "<id>", "state": "ON" }
```

- Client -> Server (set all):

```json
{ "type": "all", "state": "OFF" }
```

The client will send `auth` on connect and expects periodic or event-driven `switches` messages to update UI. The client also sends `toggle` and `all` messages when the user interacts with the UI.

If you implement a server, mirror these message shapes. The app logs invalid JSON and will warn if no `settings.address` is configured.

## Configuration (in-app)

- Open the app and go to the Settings page. Save the WebSocket address (e.g. `ws://192.168.1.50:8080`) and the token. The UI uses those settings to open the socket.
- If the WebSocket address is missing, the app will not attempt a connection and prints a warning to the console.

## Project structure (important files)

- `src/` — React source
	- `main.jsx` — app bootstrap
	- `App.jsx` — router + layout
	- `context/SocketContext.jsx` — WebSocket handling and API used by UI
	- `context/AppContext.jsx` — app-wide settings/state (settings, tokens)
	- `components/` — UI components (BottomNav, etc.)
	- `pages/` — `Home.jsx`, `Settings.jsx`
- `capacitor.config.json` — Capacitor settings (webDir = dist)
- `package.json` — scripts and dependencies

## Troubleshooting

- "WebSocket disconnected" or no switches visible: verify `settings.address` is correct and the server is reachable from the device. Check browser/Android logs.
- Invalid JSON messages are logged by the client; ensure your server sends valid JSON.
- If tokens are rejected, ensure the server's auth behavior matches the `auth` message shape above.

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repo, create a branch for your change.
2. Keep changes small and well-scoped.
3. Open a pull request with a clear description.

Please run lint before opening PRs:

```bash
bun run lint
```

## License

This project does not include a license file. If you want to add a license, create a `LICENSE` file in the repository root (MIT is common for small projects).

## Contact / Notes

If you want help wiring the server or improving the mobile build flow, tell me which platform you want to target (local network Android, remote server, ngrok, etc.) and I can add step-by-step instructions.

---

