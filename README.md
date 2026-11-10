# Sketchmob – quick start
npm install && npm start   → http://localhost:3000

## Free hosting
Render.com: New > Web Service > connect GitHub repo. Build: `npm install`, Start: `npm start`, Plan: Free.
(Free tier sleeps after ~15 min idle; first visit takes ~30s to wake. Ping it with UptimeRobot to keep it awake.)
Alternative: Oracle Cloud Always Free VM (no sleep) or home PC + Cloudflare Tunnel.

## Ads
1. Buy/attach a domain (AdSense won't approve *.onrender.com), apply at adsense.google.com.
2. Uncomment the AdSense <script> in public/index.html and the <ins> tags in the .ad boxes.
3. Add public/ads.txt with the line AdSense gives you.

## One-click deploy on Render
1. `git init && git add . && git commit -m "Sketchmob"` then push to a new GitHub repo.
2. Render dashboard > New > Blueprint > select the repo > Apply. (`render.yaml` sets everything up.)
3. Optional: add a free UptimeRobot HTTP monitor on your onrender.com URL (5-min interval) to avoid cold starts.
