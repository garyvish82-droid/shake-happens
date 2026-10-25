import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { Text } from '../../../ui/Text';
import { Icon } from '../../../ui/Icon';
import { Screen } from '../../../ui/Screen';
import { useSync } from '../../../hooks/useSync';

const DOWS = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CREWS = [
  ['Noa & Ben', 'Lior'],
  ['Itay & Shira', 'Dor'],
  ['Garik & Maya', 'Dor'],
  ['Tal & Omer', 'Yael'],
  ['Eden & Roni', 'Lior'],
];
const TIMES = [
  ['10:00', '12:00'],
  ['14:00', '16:00'],
  ['16:00', '18:00'],
  ['18:00', '20:00'],
  ['22:00', '01:00'],
];

export default function ShiftsScreen() {
  const { palette } = useTheme();
  const { lastSync } = useSync();
  const [sel, setSel] = useState(2);
  const [onlyMine, setOnlyMine] = useState(false);

  const all = TIMES.map((t, i) => {
    const mine = sel === 2 && i === 2;
    const now = sel === 2 && i === 1;
    const crew = CREWS[(i + sel) % CREWS.length];
    return {
      key: `${sel}-${i}`,
      start: t[0],
      end: t[1],
      crew: mine ? 'Garik & Maya' : crew[0],
      floater: mine ? 'Dor' : crew[1],
      mine,
      now,
      rush: i === 3,
      night: i === 4,
      endsDay: `${DOWS[(sel + 1) % 6].toUpperCase()} 01:00`,
    };
  });
  const shifts = onlyMine ? all.filter((s) => s.mine) : all;

  const badge = (label: string, kind: 'solid' | 'teal' | 'outline' | 'muted') => {
    const style = {
      solid: { bg: palette.ink, fg: palette.onInk, border: undefined as string | undefined },
      teal: { bg: palette.teal, fg: palette.bg, border: undefined },
      outline: { bg: 'transparent', fg: palette.text, border: palette.text },
      muted: { bg: 'transparent', fg: palette.textMuted, border: palette.textMuted },
    }[kind];
    return (
      <View
        key={label}
        style={{
          height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: style.bg,
          borderWidth: style.border ? 1.5 : 0, borderColor: style.border, justifyContent: 'center',
        }}
      >
        <Text size={12} weight="heavy" tracking={0.07} color={style.fg}>{label}</Text>
      </View>
    );
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 2, flexShrink: 1 }}>
          <Text size={30} weight="heavy" tracking={-0.02}>Shifts</Text>
          <Text size={13} weight="semibold" muted>Saved on your phone · {lastSync === 0 ? 'not synced yet' : `synced ${Math.max(0, Math.round((Date.now() - lastSync) / 60000))} min ago`}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: onlyMine }}
          onPress={() => setOnlyMine((v) => !v)}
          style={{
            height: 48, paddingHorizontal: 14, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 6,
            borderWidth: 1.5, borderColor: onlyMine ? palette.ink : palette.border,
            backgroundColor: onlyMine ? palette.ink : palette.surface,
          }}
        >
          {onlyMine && <Icon name="check" size={16} color={palette.onInk} strokeWidth={3} />}
          <Text size={15} weight="bold" color={onlyMine ? palette.onInk : palette.text}>Only mine</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {DOWS.map((dow, i) => {
          const on = i === sel;
          return (
            <Pressable
              key={dow}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setSel(i)}
              style={{
                flex: 1, height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 2,
                borderWidth: 1.5, borderColor: on ? palette.ink : palette.border,
                backgroundColor: on ? palette.ink : palette.surface,
              }}
            >
              <Text size={12} weight="bold" upper tracking={0.06} color={on ? palette.onInk : palette.text}>{dow}</Text>
              <Text size={18} weight="bold" mono color={on ? palette.onInk : palette.text}>{i + 1}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 10 }}>
        {shifts.map((s) => {
          return (
            <View
              key={s.key}
              style={{
                flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14,
                borderRadius: 16, backgroundColor: palette.surface,
                borderWidth: s.mine ? 3 : s.now ? 2 : 1.5,
                borderColor: s.mine ? palette.ink : s.now ? palette.teal : palette.border,
              }}
            >
              <View style={{ width: 66, gap: 2 }}>
                <Text size={16} weight="bold" mono>{s.start}</Text>
                <Text size={14} mono muted>{s.end}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {s.now && badge('● NOW', 'teal')}
                  {s.mine && badge('YOU', 'solid')}
                  {s.rush && badge('PEAK · +1 CREW', 'outline')}
                  {s.night && badge(`NIGHT · ENDS ${s.endsDay}`, 'muted')}
                </View>
                <Text size={17} weight="bold">{s.crew}</Text>
                <Text size={14} weight="semibold" muted>Floater: {s.floater}</Text>
              </View>
            </View>
          );
        })}
        {shifts.length === 0 && (
          <View style={{ padding: 20, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: palette.border }}>
            <Text size={15} weight="semibold" muted style={{ textAlign: 'center' }}>No shifts for you this day — enjoy the burn</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
