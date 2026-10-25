import { View, Pressable, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../ui/Text';
import { spacing, touchTarget, radius, fontSize } from '../../theme/tokens';
import { useDatabase } from '../../hooks/useDatabase';

export default function HomeScreen() {
  const { palette } = useTheme();
  const { db, isLoading } = useDatabase();
  const [shakeCount, setShakeCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<string>('Never');

  // Load initial counts
  useEffect(() => {
    if (!db) return;

    (async () => {
      const count = await db.getTodayShakeCount('test-camp');
      const pending = await db.getPendingOutbox();
      const last = await db.getLastSyncedAt();

      setShakeCount(count);
      setPendingCount(pending.length);
      setLastSync(
        last === 0
          ? 'Never'
          : new Date(last).toLocaleTimeString()
      );
    })();
  }, [db]);

  const handleLogShake = async () => {
    if (!db) return;

    try {
      await db.logShake({
        camp_id: 'test-camp',
        recipe_id: 'recipe-mango',
        size: 'L',
        qty: 1,
        is_alcoholic: 0,
        logged_by: 'tester',
        logged_at: Date.now(),
        voided: 0,
      });

      // Update counts
      const count = await db.getTodayShakeCount('test-camp');
      const pending = await db.getPendingOutbox();

      setShakeCount(count);
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Failed to log shake:', error);
    }
  };

  const handleResetSync = async () => {
    if (!db) return;
    await db.setLastSyncedAt(Date.now());
    setLastSync(new Date().toLocaleTimeString());
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg, paddingTop: spacing['3xl'] }}
      contentContainerStyle={{ paddingBottom: spacing['5xl'] }}
    >
      <View style={{ paddingHorizontal: spacing['3xl'] }}>
        <Text variant="h1" style={{ color: palette.text }}>
          Shake Happens
        </Text>

        {/* Status section */}
        <View
          style={{
            marginTop: spacing['4xl'],
            padding: spacing['3xl'],
            backgroundColor: palette.surface,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Text variant="h2" style={{ marginBottom: spacing.xl, color: palette.text }}>
            📊 Status
          </Text>

          <View style={{ marginBottom: spacing.lg }}>
            <Text variant="label">Today's Shakes</Text>
            <Text variant="mono" style={{ fontSize: fontSize['3xl'], marginTop: spacing.sm }}>
              {shakeCount}
            </Text>
          </View>

          <View style={{ marginBottom: spacing.lg }}>
            <Text variant="label">Pending Sync</Text>
            <Text variant="mono" style={{ fontSize: fontSize['2xl'], marginTop: spacing.sm }}>
              {pendingCount} in outbox
            </Text>
          </View>

          <View>
            <Text variant="label">Last Synced</Text>
            <Text variant="muted" style={{ marginTop: spacing.sm }}>
              {lastSync}
            </Text>
          </View>
        </View>

        {/* Test buttons */}
        <View style={{ marginTop: spacing['4xl'] }}>
          <Text variant="h2" style={{ marginBottom: spacing.lg, color: palette.text }}>
            🧪 Test Mode
          </Text>

          <Pressable
            onPress={handleLogShake}
            disabled={!db || isLoading}
            style={({ pressed }) => [
              {
                backgroundColor: palette.accent,
                paddingVertical: spacing['3xl'],
                paddingHorizontal: spacing['3xl'],
                borderRadius: radius.button,
                marginBottom: spacing.lg,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              variant="body"
              weight="bold"
              style={{
                color: palette.onAccent,
                textAlign: 'center',
                fontSize: fontSize.lg,
              }}
            >
              📝 Log Shake (tap 10 times)
            </Text>
          </Pressable>

          <Pressable
            onPress={handleResetSync}
            disabled={!db}
            style={({ pressed }) => [
              {
                backgroundColor: palette.ocean,
                paddingVertical: spacing.xl,
                paddingHorizontal: spacing['3xl'],
                borderRadius: radius.button,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              variant="body"
              weight="semibold"
              style={{
                color: palette.text,
                textAlign: 'center',
              }}
            >
              ✅ Update Sync Time
            </Text>
          </Pressable>
        </View>

        {/* Instructions */}
        <View
          style={{
            marginTop: spacing['4xl'],
            padding: spacing['3xl'],
            backgroundColor: palette.oceanTint,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: palette.ocean,
          }}
        >
          <Text variant="h2" style={{ marginBottom: spacing.lg, color: palette.text }}>
            ✈️ Test Instructions
          </Text>

          <Text variant="body" style={{ color: palette.text, lineHeight: 22 }}>
            1. Enable airplane mode on your iPhone{'\n'}
            2. Tap "Log Shake" button 10 times{'\n'}
            3. Each tap stores in SQLite + queues in outbox{'\n'}
            4. Check the counter above{'\n'}
            5. Disable airplane mode{'\n'}
            6. Check "Pending Sync" count{'\n'}
            7. Tap "Update Sync Time" to mark as synced{'\n'}
          </Text>
        </View>

        {isLoading && (
          <View style={{ marginTop: spacing['3xl'] }}>
            <Text variant="muted" style={{ textAlign: 'center' }}>
              Loading database...
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
