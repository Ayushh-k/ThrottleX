const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  THROTTLEX — Rental Business Manager`);
  console.log(`  TAGLINE: OWN THE ROAD.`);
  console.log(`  Listening on: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
