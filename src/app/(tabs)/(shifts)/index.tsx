import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { Text } from '../../../ui/Text';
import { Icon } from '../../../ui/Icon';
import { Screen } from '../../../ui/Screen';
import { useCampData } from '../../../hooks/useCampData';
import {
  crewNames, dayNumOf, defaultDate, dowOf, shiftDates, titleCase,
} from '../../../lib/campData';

export default function ShiftsScreen() {
  const { palette } = useTheme();
  const { data, now, memberId, fetchedAt, refresh, status } = useCampData();
  const [sel, setSel] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);

  const shifts = data?.shifts ?? [];
  const dates = shiftDates(shifts);

  // open on today (or the next day with shifts) once the data is here
  useEffect(() => {
    if (sel === null && dates.length > 0) setSel(defaultDate(dates, now));
  }, [dates, sel, now]);

  const day = shifts.filter((s) => s.date === sel);
  const list = onlyMine ? day.filter((s) => memberId && s.memberIds.includes(memberId)) : day;

  const synced = fetchedAt === 0
    ? 'Not loaded yet'
    : `Updated ${Math.max(0, Math.round((now.getTime() - fetchedAt) / 60000))} min ago`;

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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text size={30} weight="heavy" tracking={-0.02}>Shifts</Text>
          <Text size={13} weight="semibold" muted numberOfLines={1}>{synced}</Text>
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

      {dates.length === 0 ? (
        <View style={{ padding: 20, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: palette.border, gap: 12 }}>
          <Text size={15} weight="semibold" muted style={{ textAlign: 'center' }}>
            {status === 'loading'
              ? 'Loading the schedule…'
              : data
                ? 'No published shifts yet.'
                : 'The schedule has not loaded yet. Connect to the internet once and try again.'}
          </Text>
          <Pressable
            onPress={refresh}
            style={{ height: 48, borderRadius: 12, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size={15} weight="heavy" color={palette.onInk}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ flexGrow: 1, gap: 6 }}>
            {dates.map((d) => {
              const on = d === sel;
              return (
                <Pressable
                  key={d}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setSel(d)}
                  style={{
                    flex: 1, minWidth: 54, height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 2,
                    borderWidth: 1.5, borderColor: on ? palette.ink : palette.border,
                    backgroundColor: on ? palette.ink : palette.surface,
                  }}
                >
                  <Text size={12} weight="bold" upper tracking={0.06} color={on ? palette.onInk : palette.text}>{dowOf(d)}</Text>
                  <Text size={18} weight="bold" mono color={on ? palette.onInk : palette.text}>{dayNumOf(d)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ gap: 10 }}>
            {list.map((s) => {
              const mine = !!memberId && s.memberIds.includes(memberId);
              const live = s.startAt <= now && now < s.endAt;
              const crossesMidnight = s.endAt.getDate() !== s.startAt.getDate();
              return (
                <View
                  key={s.id}
                  style={{
                    flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14,
                    borderRadius: 16, backgroundColor: palette.surface,
                    borderWidth: mine ? 3 : live ? 2 : 1.5,
                    borderColor: mine ? palette.ink : live ? palette.teal : palette.border,
                  }}
                >
                  <View style={{ width: 66, gap: 2 }}>
                    <Text size={16} weight="bold" mono>{s.start}</Text>
                    <Text size={14} mono muted>{s.end}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      {live && badge('● NOW', 'teal')}
                      {mine && badge('YOU', 'solid')}
                      {s.isPeak && badge('PEAK', 'outline')}
                      {crossesMidnight && badge(`NIGHT · ENDS ${s.end}`, 'muted')}
                    </View>
                    <Text size={17} weight="bold">
                      {s.memberIds.length > 0 && data ? crewNames(data.members, s.memberIds) : 'Not assigned yet'}
                    </Text>
                    <Text size={14} weight="semibold" muted>
                      {titleCase(s.type)}{s.location && s.location.toLowerCase() !== s.type.toLowerCase() ? ` · ${s.location}` : ''}
                    </Text>
                    {!!s.notes && <Text size={13} weight="semibold" muted>{s.notes}</Text>}
                  </View>
                </View>
              );
            })}
            {list.length === 0 && (
              <View style={{ padding: 20, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: palette.border }}>
                <Text size={15} weight="semibold" muted style={{ textAlign: 'center' }}>
                  {onlyMine
                    ? memberId
                      ? 'No shifts for you this day — enjoy the burn'
                      : 'Pick who you are on Home to see your shifts'
                    : 'No shifts this day'}
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}
