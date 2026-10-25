import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { Screen } from '../ui/Screen';

const DAYS = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const VALS = [58, 96, 124, 141, 162, 88];
const RECIPES = [
  { name: 'Banana Date', made: 248, cost: '6.0' },
  { name: 'Choco Tahini', made: 196, cost: '7.0' },
  { name: 'Mango Chill', made: 151, cost: '8.0' },
  { name: 'Berry Dust', made: 74, cost: '9.0' },
];

export default function InsightsScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const [sel, setSel] = useState(4);

  const card = {
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.border,
  } as const;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          accessibilityLabel="Back to home"
          onPress={() => router.back()}
          style={{ width: 48, height: 48, borderRadius: 24, ...card, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="back" size={22} color={palette.text} strokeWidth={2.4} />
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          <Text size={13} weight="heavy" muted upper tracking={0.08}>Camp lead</Text>
          <Text size={28} weight="heavy" tracking={-0.02}>Insights</Text>
        </View>
        <View style={{ height: 28, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1.5, borderColor: palette.textMuted, justifyContent: 'center' }}>
          <Text size={12} weight="heavy" muted>SAMPLE DATA</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          ['669', 'shakes made'],
          ['₪7.1', 'avg cost each'],
          ['₪4,734', 'of ₪[BUDGET]'],
        ].map(([v, l]) => (
          <View key={l} style={{ flex: 1, ...card, borderRadius: 14, padding: 12, gap: 4 }}>
            <Text size={22} weight="bold" mono>{v}</Text>
            <Text size={13} weight="semibold" muted>{l}</Text>
          </View>
        ))}
      </View>

      <View style={{ ...card, borderRadius: 16, padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text size={13} weight="heavy" muted upper tracking={0.08}>Shakes per day</Text>
          <Text size={15} weight="semibold">
            <Text size={15} weight="bold" mono color={palette.teal}>{VALS[sel]}</Text> on {DAYS[sel]}
          </Text>
        </View>
        <View style={{ height: 128, flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
          {VALS.map((v, i) => (
            <Pressable
              key={DAYS[i]}
              accessibilityLabel={`${DAYS[i]}: ${v} shakes`}
              accessibilityState={{ selected: i === sel }}
              onPress={() => setSel(i)}
              style={{ flex: 1, height: 128, justifyContent: 'flex-end' }}
            >
              <View
                style={{
                  width: '100%', height: Math.round((v / 162) * 120),
                  borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
                  backgroundColor: i === sel ? palette.teal : palette.barMuted,
                }}
              />
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {DAYS.map((d) => (
            <Text key={d} size={13} weight="semibold" muted style={{ flex: 1, textAlign: 'center' }}>{d}</Text>
          ))}
        </View>
      </View>

      <View style={{ ...card, borderRadius: 16, padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text size={13} weight="heavy" muted upper tracking={0.06} style={{ flex: 1 }}>Recipe</Text>
          <Text size={13} weight="heavy" muted upper tracking={0.06} style={{ width: 56, textAlign: 'right' }}>Made</Text>
          <Text size={13} weight="heavy" muted upper tracking={0.06} style={{ width: 56, textAlign: 'right' }}>Cost</Text>
        </View>
        {RECIPES.map((r) => (
          <View key={r.name} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text size={16} weight="bold">{r.name}</Text>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: palette.track }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: palette.teal, width: `${Math.round((r.made / 248) * 100)}%` }} />
              </View>
            </View>
            <Text size={15} weight="bold" mono style={{ width: 56, textAlign: 'right' }}>{r.made}</Text>
            <Text size={15} weight="bold" mono style={{ width: 56, textAlign: 'right' }}>₪{r.cost}</Text>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: palette.ink, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
        <Text size={13} weight="heavy" upper tracking={0.08} color={palette.onInk}>For next year</Text>
        <View style={{ gap: 2 }}>
          <Text size={15} weight="bold" color={palette.onInk}>Bring ~2× oat milk and dates</Text>
          <Text size={13} color={palette.onInk}>Ran out 2 days · 6 votes on feedback</Text>
        </View>
        <View style={{ gap: 2 }}>
          <Text size={15} weight="bold" color={palette.onInk}>Third person on 18:00–20:00, Thu–Sat</Text>
          <Text size={13} color={palette.onInk}>9 rush calls in that slot · 9 votes</Text>
        </View>
      </View>
    </Screen>
  );
}
