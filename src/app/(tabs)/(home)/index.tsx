import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';
import { Text } from '../../../ui/Text';
import { Icon } from '../../../ui/Icon';
import { Screen } from '../../../ui/Screen';
import { useSync } from '../../../hooks/useSync';
import { useCampData } from '../../../hooks/useCampData';
import { CAMP_ID } from '../../../lib/config';
import {
  barNow, crewNames, eventLabel, memberName, nextShiftFor, shiftHeadline, titleCase,
} from '../../../lib/campData';

function minutesAgo(ts: number) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  return m < 1 ? 'just now' : `${m} min ago`;
}

export default function HomeScreen() {
  const { palette, theme, setTheme } = useTheme();
  const router = useRouter();
  const { db, waiting, lastSync, refresh, syncNow } = useSync();
  const { data, now, memberId, setMemberId, status, refresh: refreshCamp } = useCampData();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [todayCount, setTodayCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refresh();
      if (db) db.getTodayShakeCount(CAMP_ID).then(setTodayCount);
    }, [refresh, db])
  );

  const next = data ? nextShiftFor(data.shifts, memberId, now) : null;
  const bar = data ? barNow(data.shifts, now) : null;

  // was this shift already confirmed on this phone?
  useEffect(() => {
    if (!db || !next) return;
    const id = next.shift.id;
    db.getValue(`confirmed:${id}`).then((v) => {
      if (v) setConfirmed((c) => ({ ...c, [id]: true }));
    });
  }, [db, next?.shift.id]);

  const confirm = async () => {
    if (!db || !next || !memberId) return;
    const id = next.shift.id;
    setConfirmed((c) => ({ ...c, [id]: true }));
    await db.setValue(`confirmed:${id}`, '1');
    await db.confirmShift(id, memberId);
    await syncNow();
  };

  const isDay = theme === 'light';
  const syncText = lastSync === 0 ? 'Not synced yet' : `Synced ${minutesAgo(lastSync)}`;
  const me = data?.members.find((m) => m.id === memberId);
  const initial = me ? me.name[0].toUpperCase() : '?';
  const showInsights = me && (me.role === 'lead' || me.role === 'admin');

  const card = {
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: 20,
  } as const;

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
            height: 40, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5, borderColor: palette.border,
            backgroundColor: palette.surface, flexDirection: 'row', alignItems: 'center', gap: 6,
          }}
        >
          <Icon name={isDay ? 'sun' : 'moon'} size={16} color={palette.text} />
          <Text size={13} weight="bold">{isDay ? 'Day' : 'Night'}</Text>
        </Pressable>
      </View>

      {/* title + shortcuts */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text size={12} weight="bold" muted upper tracking={0.08} numberOfLines={1} adjustsFontSizeToFit>
            {data ? eventLabel(data.camp, now) : 'Loading camp…'}
          </Text>
          <Text size={24} weight="heavy" tracking={-0.02} numberOfLines={1} adjustsFontSizeToFit>Shake Happens</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            accessibilityLabel="Find camp"
            onPress={() => router.navigate('/(tabs)/(navigator)')}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="compass" size={22} color={palette.onInk} />
          </Pressable>
          <Pressable
            accessibilityLabel="Who are you?"
            onPress={() => setPickerOpen(true)}
            style={{
              width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: palette.border,
              backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text size={15} weight="bold">{initial}</Text>
          </Pressable>
        </View>
      </View>

      {/* your shift */}
      {!data ? (
        <View style={{ ...card, padding: 16, gap: 12 }}>
          <Text size={20} weight="heavy">
            {status === 'loading' ? 'Loading the schedule…' : 'Schedule not loaded yet'}
          </Text>
          {status !== 'loading' && (
            <>
              <Text size={15} muted>Connect to the internet once and the camp schedule is saved on your phone.</Text>
              <Pressable
                onPress={refreshCamp}
                style={{ height: 48, borderRadius: 12, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text size={15} weight="heavy" color={palette.onInk}>Try again</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : !memberId ? (
        <View style={{ ...card, padding: 16, gap: 12 }}>
          <Text size={22} weight="heavy">Who are you?</Text>
          <Text size={15} muted>Pick your name to see your shifts.</Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={{ height: 56, borderRadius: 14, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size={17} weight="heavy" color={palette.onInk}>Pick my name</Text>
          </Pressable>
        </View>
      ) : next ? (
        <View style={{ backgroundColor: palette.accent, borderRadius: 20, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Icon name="bell" size={22} color={palette.onAccent} />
            <Text size={14} weight="heavy" upper tracking={0.1} color={palette.onAccent} numberOfLines={1} style={{ flex: 1 }}>
              {shiftHeadline(next, now, data.camp.reminderMinutes)}
            </Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text size={26} weight="heavy" tracking={-0.01} color={palette.onAccent}>
              {titleCase(next.shift.type)} · {next.shift.start}–{next.shift.end}
            </Text>
            <Text size={15} weight="semibold" color={palette.onAccent}>
              {(() => {
                const others = next.shift.memberIds.filter((id) => id !== memberId).map((id) => memberName(data.members, id));
                const where = next.shift.location.toLowerCase() === next.shift.type.toLowerCase() ? '' : next.shift.location;
                return [others.length ? `With ${others.join(' & ')}` : 'On your own', where].filter(Boolean).join(' · ');
              })()}
            </Text>
            {!!next.shift.notes && (
              <Text size={14} weight="semibold" color={palette.onAccent}>{next.shift.notes}</Text>
            )}
          </View>
          {confirmed[next.shift.id] ? (
            <View
              accessibilityRole="alert"
              style={{ height: 56, borderRadius: 14, backgroundColor: palette.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Icon name="check" size={20} color={palette.onInk} strokeWidth={2.6} />
              <Text size={16} weight="heavy" color={palette.onInk}>Confirmed — see you there</Text>
            </View>
          ) : (
            <Pressable
              onPress={confirm}
              style={{ height: 56, borderRadius: 14, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text size={17} weight="heavy" color={palette.onInk}>I'm on it</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={{ ...card, padding: 16, gap: 6 }}>
          <Text size={24} weight="heavy">No more shifts for you</Text>
          <Text size={15} muted>Nothing else is scheduled for you.</Text>
        </View>
      )}

      {/* the bar right now */}
      {data && (
        <View style={{ ...card, paddingVertical: 14, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ gap: 2, flex: 1, minWidth: 0 }}>
              <Text size={13} weight="bold" muted upper tracking={0.08} numberOfLines={1}>
                {bar ? `On the bar · until ${bar.end}` : 'The bar'}
              </Text>
              <Text size={18} weight="bold" numberOfLines={2}>
                {bar ? crewNames(data.members, bar.memberIds) : 'Bar closed right now'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', flexShrink: 0, marginLeft: 12 }}>
              <Text size={26} weight="bold" mono color={palette.teal}>{todayCount}</Text>
              <Text size={13} weight="semibold" muted>logged here today</Text>
            </View>
          </View>
        </View>
      )}

      {/* log */}
      <Pressable
        onPress={() => router.navigate('/(tabs)/(log)')}
        style={{ height: 56, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text size={16} weight="heavy">+ Log shakes</Text>
      </Pressable>

      {/* who are you? */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable
          accessibilityLabel="Close"
          onPress={() => setPickerOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={() => {}}
            style={{ backgroundColor: palette.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 10 }}
          >
            <Text size={22} weight="heavy">Who are you?</Text>
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator>
            {(data?.members ?? []).filter((m) => m.active).map((m) => {
              const on = m.id === memberId;
              return (
                <Pressable
                  key={m.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={async () => {
                    await setMemberId(m.id);
                    setPickerOpen(false);
                  }}
                  style={{
                    height: 56, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    borderWidth: 1.5, borderColor: on ? palette.ink : palette.border,
                    backgroundColor: on ? palette.ink : palette.surface,
                  }}
                >
                  <Text size={17} weight="bold" color={on ? palette.onInk : palette.text}>{m.name}</Text>
                  {on && <Icon name="check" size={20} color={palette.onInk} strokeWidth={2.6} />}
                </Pressable>
              );
            })}
            </ScrollView>
            {!data && <Text size={15} muted>The crew list has not loaded yet.</Text>}
            {showInsights && (
              <Pressable
                onPress={() => {
                  setPickerOpen(false);
                  router.navigate('/insights');
                }}
                style={{ height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text size={15} weight="bold">Camp lead insights</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
