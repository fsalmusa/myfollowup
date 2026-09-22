/**
 * Entry point — boot the server.
 */
import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3000;

createApp().listen(PORT, () => {
  console.log(`✅ Follow-Up CRM server berjalan di http://localhost:${PORT}`);
});
