# Recommended deployment: Render

1. Create a new **Web Service** on Render.
2. Connect your GitHub repository containing this folder.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add the environment variables from `.env.example` in Render's Environment settings.
6. Deploy.
7. Open the generated `onrender.com` URL.

### Discord bot permissions/intents
The bot needs access to the guild and announcement channel. Enable the privileged intents required by your Discord bot configuration:
- Server Members Intent
- Presence Intent
- Message Content Intent

Never commit `.env` or your bot token to GitHub.
