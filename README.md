# Odd Signals — Final Production Package

A production-ready structure for the Odd Signals website.

## Includes
- Polished Odd Signals frontend
- Ascend: Up New Heights banner
- Discord live member/online/channel/event stats
- Discord announcements feed
- Roblox live game statistics
- Team: Dr.Beer?!, ChillWire / Nico, Zynx, Null
- Backend API
- Admin API foundation
- Environment-variable secrets (no bot token in frontend)
- Mobile-responsive design

## Recommended hosting
**Frontend + backend:** Render (one Node web service) is the simplest setup for this package. It runs the Express backend and serves the website from the same domain.

For a more scalable setup later, move the frontend to Cloudflare Pages/Vercel and the backend to Render/Fly/Railway.

## Setup
1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Create a Discord bot and invite it to the Odd Signals server.
4. Enable the required privileged intents in Discord Developer Portal, especially **Server Members Intent**, **Presence Intent**, and **Message Content Intent** for the features used here.
5. Put the bot token in `DISCORD_BOT_TOKEN`.
6. Put your Discord admin user IDs in `ADMIN_USER_IDS`.
7. Run `npm install` then `npm start`.
8. Open the URL printed by the server.

## Roblox
The server starts from the supplied place ID `108493794932864` and automatically resolves its Universe ID through Roblox's public API. You do not need to manually find the Universe ID.

## Admin security
The admin authentication foundation uses Discord OAuth2. Put the Discord application's Client ID/Secret and OAuth redirect URL in environment variables. Admin access is granted by `ADMIN_USER_IDS` or `ADMIN_ROLE_IDS`. Do not put passwords or Discord bot tokens into HTML.

## Important
The website can display live data only when the Node backend is running and the Discord bot is connected. A static GitHub Pages deployment alone cannot run this backend.
