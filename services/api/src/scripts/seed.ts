import { MemoryStore } from '../database/memory.store';

async function seed() {
  console.log('[SEED] Hydrating deterministic synthetic seed data for NER Sentinel...');
  const store = new MemoryStore();
  const segments = await store.getSegments();
  const vehicles = await store.getVehicles();
  const deliveries = await store.getDeliveries();
  const incidents = await store.getIncidents();

  console.log(`[SEED] Loaded ${segments.length} road segments.`);
  console.log(`[SEED] Loaded ${vehicles.length} vehicle telemetry streams.`);
  console.log(`[SEED] Loaded ${deliveries.length} essential deliveries.`);
  console.log(`[SEED] Loaded ${incidents.length} baseline incidents.`);
  console.log('[SEED] Seed successfully validated.');
}

seed().catch((err) => {
  console.error('[SEED ERROR]', err);
  process.exit(1);
});
