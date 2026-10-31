import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3000;
const server = createApp().listen(port, () => console.log(`Portfolio running on http://localhost:${port}`));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => process.exit(0)));
