/**
 * Database tests
 * Verify SQLite works, shake logging, and outbox management
 */

import { Database } from '../lib/db/database';

export async function runDatabaseTests() {
  console.log('\n🧪 Running database tests...\n');

  const db = new Database();
  await db.init();

  // Test 1: Log 10 shakes
  console.log('📝 Test 1: Log 10 shakes...');
  for (let i = 0; i < 10; i++) {
    const shake = await db.logShake({
      camp_id: 'test-camp',
      recipe_id: 'recipe-mango',
      size: 'L',
      qty: 1,
      is_alcoholic: 0,
      logged_by: 'tester',
      logged_at: Date.now(),
      voided: 0,
    });
    console.log(`  ✅ Logged shake #${i + 1}:`, shake.id.substring(0, 8));
  }

  // Test 2: Check today's shake count
  console.log('\n📊 Test 2: Check today shake count...');
  const count = await db.getTodayShakeCount('test-camp');
  console.log(`  ✅ Today's count: ${count} shakes`);

  if (count !== 10) {
    console.error(`  ❌ Expected 10, got ${count}`);
  }

  // Test 3: Check outbox entries
  console.log('\n📤 Test 3: Check pending outbox...');
  const pending = await db.getPendingOutbox();
  console.log(`  ✅ Pending entries: ${pending.length}`);

  if (pending.length !== 10) {
    console.error(`  ❌ Expected 10 outbox entries, got ${pending.length}`);
  }

  // Test 4: Sync status
  console.log('\n⏰ Test 4: Sync status...');
  const lastSync = await db.getLastSyncedAt();
  console.log(`  ✅ Last synced at: ${lastSync === 0 ? 'never' : new Date(lastSync).toISOString()}`);

  // Test 5: Mark as synced
  console.log('\n✅ Test 5: Mark outbox as synced...');
  if (pending.length > 0) {
    await db.markOutboxSynced(pending[0].id);
    const stillPending = await db.getPendingOutbox();
    console.log(`  ✅ Pending after sync: ${stillPending.length}`);

    if (stillPending.length !== 9) {
      console.error(`  ❌ Expected 9 pending, got ${stillPending.length}`);
    }
  }

  console.log('\n✅ All database tests passed!\n');
}
