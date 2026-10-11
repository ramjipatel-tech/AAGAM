import { app } from './app';
import { PORT } from './config';

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 AAGAM Digital Technology Server is live on http://127.0.0.1:${PORT}`);
  console.log(`🏢 Company: AAGAM Digital Technology`);
  console.log(`💡 Tagline: "Learn • Build • Innovate"`);
  console.log(`=======================================================`);
});
