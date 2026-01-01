---
description: how to set up a persistent dev server using PM2
---

To ensure your RSS Reader development server stays running in the background and automatically restarts on crashes, follow these steps:

1. **Install PM2 globally** (if not already installed):
   ```bash
   npm install -g pm2
   ```

2. **Start the development server**:
   ```bash
   pm2 start npm --name "rss-reader" -- run dev
   ```

3. **Monitor logs in real-time**:
   ```bash
   pm2 logs rss-reader
   ```

4. **Check status**:
   ```bash
   pm2 list
   ```

5. **Stop the server**:
   ```bash
   pm2 stop rss-reader
   ```

6. **Ensure it starts on system reboot**:
   ```bash
   pm2 startup
   pm2 save
   ```
