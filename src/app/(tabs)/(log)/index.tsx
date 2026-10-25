import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';
import { Text } from '../../../ui/Text';
import { Icon } from '../../../ui/Icon';
import { Screen } from '../../../ui/Screen';
import { MEMBER_ID } from '../../../lib/config';
import { useSync } from '../../../hooks/useSync';

const CAMP_ID = 'camp';

const RECIPES = [
  { id: 'recipe-banana-date', name: 'Banana Date', base: 'oat milk · dates' },
  { id: 'recipe-mango-chill', name: 'Mango Chill', base: 'mango · coconut' },
  { id: 'recipe-berry-dust', name: 'Berry Dust', base: 'berries · yogurt' },
  { id: 'recipe-choco-tahini', name: 'Choco Tahini', base: 'cacao · tahini' },
];
const SIZES = ['Small 250 ml', 'Large 400 ml'];
const SIZE_CODES = ['S', 'L'];

type Entry = { logId: string; recipe: number; size: number };

export default function LogScreen() {
  const { palette } = useTheme();
  const { db, waiting, refresh: refreshSync, syncNow } = useSync();
  const [size, setSize] = useState(1);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [history, setHistory] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    if (!db) return;
    setTotal(await db.getTodayShakeCount(CAMP_ID));
    await refreshSync();
  }, [db, refreshSync]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const add = async (recipe: number) => {
    if (!db) return;
    try {
      const log = await db.logShake({
        camp_id: CAMP_ID,
        recipe_id: RECIPES[recipe].id,
        size: SIZE_CODES[size],
        qty: 1,
        is_alcoholic: 0,
        logged_by: MEMBER_ID,
        logged_at: Date.now(),
        voided: 0,
      });
      setCounts((c) => c.map((n, i) => (i === recipe ? n + 1 : n)));
      setHistory((h) => [...h, { logId: log.id, recipe, size }]);
      await refresh();
      syncNow();
    } catch (error) {
      console.error('Failed to log shake:', error);
    }
  };

  const last = history[history.length - 1];

  const undo = async () => {
    if (!db || !last) return;
    try {
      await db.voidShake(last.logId, CAMP_ID);
      setCounts((c) => c.map((n, i) => (i === last.recipe ? n - 1 : n)));
      setHistory((h) => h.slice(0, -1));
      await refresh();
      syncNow();
    } catch (error) {
      console.error('Failed to undo shake:', error);
    }
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ gap: 2 }}>
          <Text size={30} weight="heavy" tracking={-0.02}>Log shakes</Text>
          <Text size={14} weight="semibold" muted>One tap = one shake</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text size={28} weight="bold" mono color={palette.teal}>{total}</Text>
          <Text size={13} weight="semibold" muted>today</Text>
        </View>
      </View>

      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', gap: 6, padding: 4, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border }}
      >
        {SIZES.map((label, i) => (
          <Pressable
            key={label}
            accessibilityRole="radio"
            accessibilityState={{ checked: i === size }}
            onPress={() => setSize(i)}
            style={{ flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: i === size ? palette.ink : 'transparent' }}
          >
            <Text size={16} weight={i === size ? 'heavy' : 'semibold'} color={i === size ? palette.onInk : palette.text}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        {[0, 2].map((first) => (
          <View key={first} style={{ flexDirection: 'row', gap: 10 }}>
            {RECIPES.slice(first, first + 2).map((r, k) => {
              const i = first + k;
              return (
                <Pressable
                  key={r.id}
                  accessibilityLabel={`Add one ${r.name}, ${SIZES[size]}`}
                  onPress={() => add(i)}
                  style={({ pressed }) => ({
                    flex: 1, minHeight: 132, borderRadius: 20, borderWidth: 1.5, borderColor: palette.border,
                    backgroundColor: palette.surface, padding: 14, justifyContent: 'space-between', gap: 8,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' }}>
                      <Text size={24} weight="heavy" color={palette.onAccent} style={{ marginTop: -2 }}>+</Text>
                    </View>
                    <Text size={22} weight="bold" mono>{counts[i] ? `+${counts[i]}` : ''}</Text>
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text size={18} weight="heavy" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{r.name}</Text>
                    <Text size={13} weight="semibold" muted numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{r.base}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="save" size={16} color={palette.teal} strokeWidth={2.4} />
        <Text size={14} weight="semibold" muted>Saved on this phone · {waiting} waiting to sync</Text>
      </View>

      <View style={{ flexGrow: 1 }} />

      {last && (
        <View
          accessibilityRole="alert"
          style={{ height: 56, borderRadius: 16, backgroundColor: palette.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 6 }}
        >
          <Text size={15} weight="bold" color={palette.onInk}>
            Logged 1 {RECIPES[last.recipe].name} ({SIZE_CODES[last.size]})
          </Text>
          <Pressable onPress={undo} style={{ height: 44, paddingHorizontal: 16, borderRadius: 12, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text size={15} weight="heavy" color={palette.onAccent}>Undo</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}
