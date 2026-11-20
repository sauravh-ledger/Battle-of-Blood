# Battle of Blood: Arena — game server

This small server lets players play online together (squads with a 4-letter code)
from the website, the PC app or the phone browser.

## Put it online for free (Render.com)
1. Make a new GitHub repo (for example `battle-of-blood-server`) and upload `server.js` and `package.json`.
2. Go to https://render.com → sign in with GitHub → **New → Web Service** → pick that repo.
3. Settings: Runtime **Node**, Build command `npm install`, Start command `npm start`, Instance type **Free**.
4. Click **Create Web Service**. After 1–2 minutes you get an address like
   `https://battle-of-blood-server.onrender.com`
5. Your game server address is the same with **wss://** in front:
   `wss://battle-of-blood-server.onrender.com`
6. In the game: **Online** tab → paste it into **Game server** → **Save** → Create squad / Join squad.

Check it works: open `https://<your-address>/health` — it should show `{"ok":true,...}`.

Note: Render's free plan sleeps after 15 minutes without players; the first
connection then takes ~30–50 seconds to wake it up.

## Run it on your own PC (for testing)
```
npm install
npm start
```
Then use `ws://localhost:8080` as the game server address.
