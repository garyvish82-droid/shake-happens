import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';
import { Text } from '../../../ui/Text';
import { Icon } from '../../../ui/Icon';
import { Screen } from '../../../ui/Screen';
import { useSync } from '../../../hooks/useSync';
import { CURRENT_SHIFT_ID, MEMBER_ID } from '../../../lib/config';

type ShiftMode = 'idle' | 'confirmed';

function minutesAgo(ts: number) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  return m < 1 ? 'just now' : `${m} min ago`;
}

export default function HomeScreen() {
  const { palette, theme, setTheme } = useTheme();
  const router = useRouter();
  const { db, waiting, lastSync, refresh, syncNow } = useSync();
  const [mode, setMode] = useState<ShiftMode>('idle');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const confirm = async () => {
    setMode('confirmed');
    if (!db) return;
    await db.confirmShift(CURRENT_SHIFT_ID, MEMBER_ID);
    await syncNow();
  };

  const isDay = theme === 'light';
  const syncText = lastSync === 0 ? 'Not synced yet' : `Synced ${minutesAgo(lastSync)}`;

  return (
    <Screen gap={12}>
      {/* sync + theme toggle */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
          <Icon name="sync" size={16} color={palette.teal} strokeWidth={2.4} />
          <Text size={13} weight="semibold" muted numberOfLines={1}>
            {syncText} · {waiting} {waiting === 1 ? 'log' : 'logs'} waiting
          </Text>
        </View>
        <Pressable
          accessibilityLabel={isDay ? 'Switch to night mode' : 'Switch to day mode'}
          onPress={() => setTheme(isDay ? 'dark' : 'light')}
          style={{
            height: 40,
            paddingHorizontal: 12,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: palette.border,
            backgroundColor: palette.surface,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name={isDay ? 'sun' : 'moon'} size={16} color={palette.text} />
          <Text size={13} weight="bold">{isDay ? 'Day' : 'Night'}</Text>
        </Pressable>
      </View>

      {/* title + shortcuts */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text size={12} weight="bold" muted upper tracking={0.08} numberOfLines={1} adjustsFontSizeToFit>Camp [CAMP NAME] · Day 3</Text>
          <Text size={24} weight="heavy" tracking={-0.02} numberOfLines={1} adjustsFontSizeToFit>Shake Happens</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            accessibilityLabel="Find camp"
            onPress={() => router.navigate('/(tabs)/(navigator)')}
            style={{
              width: 48, height: 48, borderRadius: 24, backgroundColor: palette.ink,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="compass" size={22} color={palette.onInk} />
          </Pressable>
          <Pressable
            accessibilityLabel="Profile and camp lead tools"
            onPress={() => router.navigate('/insights')}
            style={{
              width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: palette.border,
              backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text size={15} weight="bold">GA</Text>
          </Pressable>
        </View>
      </View>

      {/* upcoming shift */}
      <View style={{ backgroundColor: palette.accent, borderRadius: 20, padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Icon name="bell" size={22} color={palette.onAccent} />
          <Text size={14} weight="heavy" upper tracking={0.1} color={palette.onAccent}>Your shift in 30 min</Text>
        </View>
        <View style={{ gap: 2 }}>
          <Text size={26} weight="heavy" tracking={-0.01} color={palette.onAccent}>Shake bar · 16:00–18:00</Text>
          <Text size={15} weight="semibold" color={palette.onAccent}>
            With Maya · alarm is saved on your phone, works with no signal
          </Text>
        </View>

        {mode === 'idle' && (
          <Pressable
            onPress={confirm}
            style={{ height: 56, borderRadius: 14, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size={17} weight="heavy" color={palette.onInk}>I'm on it</Text>
          </Pressable>
        )}
        {mode === 'confirmed' && (
          <View
            accessibilityRole="alert"
            style={{ height: 56, borderRadius: 14, backgroundColor: palette.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Icon name="check" size={20} color={palette.onInk} strokeWidth={2.6} />
            <Text size={16} weight="heavy" color={palette.onInk}>Confirmed — see you there</Text>
          </View>
        )}
      </View>

      {/* on the bar now */}
      <View style={{ backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 2, flex: 1, minWidth: 0 }}>
            <Text size={13} weight="bold" muted upper tracking={0.08} numberOfLines={1}>On the bar · until 16:00</Text>
            <Text size={18} weight="bold" numberOfLines={1}>Itay & Shira</Text>
          </View>
          <View style={{ alignItems: 'flex-end', flexShrink: 0, marginLeft: 12 }}>
            <Text size={26} weight="bold" mono color={palette.teal}>42</Text>
            <Text size={13} weight="semibold" muted>shakes today</Text>
          </View>
        </View>
        <View style={{ height: 1.5, backgroundColor: palette.border }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 2, flex: 1, minWidth: 0 }}>
            <Text size={13} weight="bold" muted upper tracking={0.08} numberOfLines={1}>Floater · on duty</Text>
            <Text size={18} weight="bold" numberOfLines={1}>Dor · 2 min away</Text>
          </View>
          <View style={{ flexShrink: 0, marginLeft: 12, height: 32, paddingHorizontal: 10, borderRadius: 16, backgroundColor: palette.tealTint, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={14} color={palette.teal} strokeWidth={3} />
            <Text size={14} weight="heavy" color={palette.teal}>Ready</Text>
          </View>
        </View>
      </View>

      {/* quick links */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          onPress={() => router.navigate('/(tabs)/(log)')}
          style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text size={16} weight="heavy">+ Log shakes</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
