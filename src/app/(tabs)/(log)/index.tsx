import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';
import { Text } from '../../../ui/Text';
import { Icon } from '../../../ui/Icon';
import { Screen } from '../../../ui/Screen';
import { useSync } from '../../../hooks/useSync';
import { useCampData } from '../../../hooks/useCampData';
import { CAMP_ID, DEFAULT_SIZE } from '../../../lib/config';
import type { Recipe } from '../../../lib/campData';

/** how long the "Logged… Undo" bar and +N badges stay on screen */
const CONFIRM_MS = 5000;

type Entry = { logId: string; recipeId: string };

export default function LogScreen() {
  const { palette } = useTheme();
  const { db, waiting, refresh: refreshSync, syncNow } = useSync();
  const { data, memberId, refresh: refreshCamp, status } = useCampData();
  const recipes: Recipe[] = data?.recipes ?? [];

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearConfirmation = useCallback(() => {
    setCounts({});
    setHistory([]);
  }, []);

  // after a quiet moment, go back to the normal screen
  const armReset = useCallback(() => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(clearConfirmation, CONFIRM_MS);
  }, [clearConfirmation]);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

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

  const add = async (recipe: Recipe) => {
    if (!db) return;
    try {
      const log = await db.logShake({
        camp_id: CAMP_ID,
        recipe_id: recipe.id,
        size: DEFAULT_SIZE,
        qty: 1,
        is_alcoholic: recipe.alcoholic ? 1 : 0,
        logged_by: memberId ?? undefined,
        logged_at: Date.now(),
        voided: 0,
      });
      setCounts((c) => ({ ...c, [recipe.id]: (c[recipe.id] ?? 0) + 1 }));
      setHistory((h) => [...h, { logId: log.id, recipeId: recipe.id }]);
      armReset();
      await refresh();
      syncNow();
    } catch (error) {
      console.error('Failed to log shake:', error);
    }
  };

  const last = history[history.length - 1];
  const lastRecipe = last ? recipes.find((r) => r.id === last.recipeId) : undefined;

  const undo = async () => {
    if (!last) return;
    // update the screen first so Undo always responds
    setCounts((c) => ({ ...c, [last.recipeId]: Math.max(0, (c[last.recipeId] ?? 0) - 1) }));
    setHistory((h) => h.slice(0, -1));
    armReset();
    if (!db) return;
    try {
      await db.voidShake(last.logId, CAMP_ID);
      await refresh();
      syncNow();
    } catch (error) {
      console.error('Failed to undo shake:', error);
    }
  };

  const rows: Recipe[][] = [];
  for (let i = 0; i < recipes.length; i += 2) rows.push(recipes.slice(i, i + 2));

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

      {recipes.length === 0 ? (
        <View style={{ padding: 20, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: palette.border, gap: 12 }}>
          <Text size={15} weight="semibold" muted style={{ textAlign: 'center' }}>
            {status === 'loading' ? 'Loading the drink list…' : 'The drink list has not loaded yet. Connect to the internet once and try again.'}
          </Text>
          <Pressable
            onPress={refreshCamp}
            style={{ height: 48, borderRadius: 12, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size={15} weight="heavy" color={palette.onInk}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {rows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 10 }}>
              {row.map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityLabel={`Add one ${r.name}`}
                  onPress={() => add(r)}
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
                    <Text size={22} weight="bold" mono>{counts[r.id] ? `+${counts[r.id]}` : ''}</Text>
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text size={18} weight="heavy" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{r.name}</Text>
                    {r.alcoholic && <Text size={13} weight="semibold" muted numberOfLines={1}>contains alcohol</Text>}
                  </View>
                </Pressable>
              ))}
              {row.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))}
        </View>
      )}

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
          <Text size={15} weight="bold" color={palette.onInk} numberOfLines={1} style={{ flex: 1 }}>
            Logged 1 {lastRecipe?.name ?? 'shake'}
          </Text>
          <Pressable onPress={undo} style={{ height: 44, paddingHorizontal: 16, borderRadius: 12, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text size={15} weight="heavy" color={palette.onAccent}>Undo</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}
