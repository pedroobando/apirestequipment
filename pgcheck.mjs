import pg from 'pg';
async function probe(pw) {
  const cs = 'postgresql://adminEq:***@localhost:5434/equipment';
  const c = new pg.Client({ connectionString: cs, connectionTimeoutMillis: 3000 });
  try {
    await c.connect();
    const r = await c.query("SELECT current_database() AS db, current_user AS usr, version()");
    console.log('AUTH OK  ->  db=' + r.rows[0].db + ' user=' + r.rows[0].usr);
    return true;
  } catch (e) {
    console.log('AUTH FAIL -> ' + e.code + ': ' + e.message);
    return false;
  } finally {
    await c.end().catch(()=>{});
  }
}
probe();
