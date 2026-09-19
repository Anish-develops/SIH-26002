async function reset() {
  const url = process.env.API_URL || 'http://localhost:4000/scenario/reset';
  console.log(`[RESET] Sending reset request to ${url}...`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    console.log('[RESET SUCCESS]', data);
  } catch (err: any) {
    console.error('[RESET FAILED]', err.message);
    process.exit(1);
  }
}

reset();
