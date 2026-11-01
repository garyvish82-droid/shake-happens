import { ComponentRef, Fragment, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { categoryColors, fontSize, radius, spacing, touchTarget } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeProvider';
import { Text } from '../../../ui/Text';
import { Icon } from '../../../ui/Icon';
import { Screen } from '../../../ui/Screen';
import { useCampData } from '../../../hooks/useCampData';
import {
  defaultEventDate, dayNumOf, dowOf, eventDates, eventIsNow, formatAgo, monthOf, sortEvents, titleCase, todayKey,
  EVENT_CATEGORIES, type EventCategory, type FestivalEvent,
} from '../../../lib/campData';

type Genre = 'all' | EventCategory;

const BORDER = 1.5;
const BORDER_NOW = 3;
const TIME_COLUMN = spacing['4xl'] + spacing.lg;

/** The first event on the list that is on now or still to come */
function upNext(list: FestivalEvent[], now: Date) {
  return list.find((e) => e.startAt && (e.endAt ? now < e.endAt : now <= e.startAt)) ?? null;
}

export default function EventsScreen() {
  const { palette } = useTheme();
  const { data, now, fetchedAt, refresh, status } = useCampData();
  const [picked, setPicked] = useState<string | null>(null);
  const [genre, setGenre] = useState<Genre>('all');

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const listY = useRef<number | null>(null);
  const cardY = useRef<{ id: string; y: number } | null>(null);
  const scrolledFor = useRef('');

  const events = data?.events ?? [];
  const dates = eventDates(events);
  // today if the event calendar has it, else the first day; the choice sticks once the person taps a day
  const day = picked && dates.includes(picked) ? picked : defaultEventDate(dates, now);
  const isToday = day === todayKey(now);

  const dayEvents = events.filter((e) => e.date === day);
  const counts = EVENT_CATEGORIES.map((c) => ({ category: c, count: dayEvents.filter((e) => e.category === c).length }))
    .filter((c) => c.count > 0);
  const activeGenre: Genre = genre !== 'all' && counts.some((c) => c.category === genre) ? genre : 'all';
  const list = sortEvents(dayEvents.filter((e) => activeGenre === 'all' || e.category === activeGenre));
  const firstTba = list.findIndex((e) => !e.startAt);

  // on today's list, bring the first current or upcoming event into view (once per day + genre choice)
  const target = isToday ? upNext(list, now) : null;
  const targetId = target && list.indexOf(target) > 0 ? target.id : null;
  const scrollKey = `${day}|${activeGenre}`;

  const scrollToTarget = () => {
    if (!targetId || scrolledFor.current === scrollKey) return;
    if (listY.current == null || cardY.current?.id !== targetId) return;
    scrolledFor.current = scrollKey;
    scrollRef.current?.scrollTo({ y: Math.max(0, listY.current + cardY.current.y - spacing.md), animated: false });
  };
  useEffect(() => {
    const frame = requestAnimationFrame(scrollToTarget);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey, targetId]);

  const sync =
    fetchedAt === 0
      ? status === 'loading' ? 'Loading…' : 'Not loaded yet'
      : status === 'ready' ? `Synced ${formatAgo(fetchedAt, now.getTime())}` : 'Saved copy, will update when online';

  const emptyBox = (message: string, retry?: boolean) => (
    <View style={{ padding: spacing.lg, borderRadius: radius.card, borderWidth: BORDER, borderStyle: 'dashed', borderColor: palette.border, gap: spacing.md }}>
      <Text size={fontSize.sm} weight="semibold" muted style={{ textAlign: 'center' }}>{message}</Text>
      {retry && (
        <Pressable
          accessibilityRole="button"
          onPress={refresh}
          style={{ height: touchTarget.secondary, borderRadius: radius.control, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text size={fontSize.sm} weight="heavy" color={palette.onInk}>Try again</Text>
        </Pressable>
      )}
    </View>
  );

  const categoryTag = (c: EventCategory) => (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, alignSelf: 'flex-start',
        paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.pill,
        borderWidth: BORDER, borderColor: categoryColors[c],
      }}
    >
      <View style={{ width: spacing.sm, height: spacing.sm, borderRadius: radius.pill, backgroundColor: categoryColors[c] }} />
      <Text size={fontSize.xs} weight="bold">{titleCase(c)}</Text>
    </View>
  );

  const card = (e: FestivalEvent) => {
    const live = eventIsNow(e, now);
    return (
      <View
        onLayout={(ev) => {
          if (e.id === targetId) {
            cardY.current = { id: e.id, y: ev.nativeEvent.layout.y };
            scrollToTarget();
          }
        }}
        style={{
          flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.card,
          backgroundColor: palette.surface, borderWidth: live ? BORDER_NOW : BORDER,
          borderColor: live ? palette.ink : palette.border,
        }}
      >
        <View style={{ width: TIME_COLUMN, gap: spacing.xs / 2 }}>
          {e.startAt ? (
            <>
              <Text size={fontSize.base} weight="bold" mono>{e.start}</Text>
              {e.endsNextDay ? (
                <Text size={fontSize.xs} weight="semibold" muted>until {e.end}</Text>
              ) : e.end ? (
                <Text size={fontSize.sm} mono muted>{e.end}</Text>
              ) : null}
            </>
          ) : (
            <Text size={fontSize.sm} weight="bold" muted>Time TBA</Text>
          )}
        </View>
        <View style={{ flex: 1, gap: spacing.xs + 2 }}>
          {live && (
            <View
              style={{
                alignSelf: 'flex-start', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
                borderRadius: radius.chip, backgroundColor: palette.ink,
              }}
            >
              <Text size={fontSize.xs} weight="heavy" tracking={0.07} color={palette.onInk}>● NOW</Text>
            </View>
          )}
          <Text size={fontSize.lg} weight="bold">{e.title}</Text>
          {!!e.place && <Text size={fontSize.sm} weight="semibold" muted>{e.place}</Text>}
          {categoryTag(e.category)}
          {!!e.description && <Text size={fontSize.sm}>{e.description}</Text>}
        </View>
      </View>
    );
  };

  return (
    <Screen scrollRef={scrollRef}>
      <View style={{ gap: spacing.xs / 2 }}>
        <Text size={fontSize['2xl']} weight="heavy" tracking={-0.02}>Events</Text>
        <Text size={fontSize.xs} weight="semibold" muted numberOfLines={1}>{sync}</Text>
      </View>

      {dates.length === 0 ? (
        emptyBox(
          status === 'loading'
            ? 'Loading the events…'
            : data
              ? 'No events on the calendar yet. Check back soon, the schedule is still being put together.'
              : 'The events have not loaded yet. Connect to the internet once and try again.',
          status !== 'loading'
        )
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm }}>
            {dates.map((d, i) => {
              const on = d === day;
              const showMonth = i === 0 || monthOf(d) !== monthOf(dates[i - 1]);
              return (
                <Pressable
                  key={d}
                  accessibilityRole="tab"
                  accessibilityLabel={`${dowOf(d)} ${dayNumOf(d)} ${monthOf(d)}`}
                  accessibilityState={{ selected: on }}
                  onPress={() => setPicked(d)}
                  style={{
                    minWidth: touchTarget.primary + spacing.sm, minHeight: touchTarget.primary, borderRadius: radius.control,
                    paddingHorizontal: spacing.sm, alignItems: 'center', justifyContent: 'center',
                    borderWidth: BORDER, borderColor: on ? palette.ink : palette.border,
                    backgroundColor: on ? palette.ink : palette.surface,
                  }}
                >
                  <Text size={fontSize.sm} weight={on ? 'heavy' : 'semibold'} color={on ? palette.onInk : palette.text}>
                    {dowOf(d)} {dayNumOf(d)}
                  </Text>
                  <Text size={fontSize.xs} weight="semibold" color={on ? palette.onInk : palette.textMuted}>
                    {showMonth ? monthOf(d) : ' '}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm }}>
            {([{ category: 'all' as Genre, count: dayEvents.length }, ...counts] as { category: Genre; count: number }[]).map((c) => {
              const on = c.category === activeGenre;
              return (
                <Pressable
                  key={c.category}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.category === 'all' ? 'All' : titleCase(c.category)}, ${c.count}`}
                  accessibilityState={{ selected: on }}
                  onPress={() => setGenre(c.category)}
                  style={{
                    height: touchTarget.secondary, paddingHorizontal: spacing.md, borderRadius: radius.pill,
                    flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2,
                    borderWidth: BORDER, borderColor: on ? palette.ink : palette.border,
                    backgroundColor: on ? palette.ink : palette.surface,
                  }}
                >
                  {on && <Icon name="check" size={fontSize.sm} color={palette.onInk} strokeWidth={3} />}
                  {c.category !== 'all' && (
                    <View style={{ width: spacing.sm, height: spacing.sm, borderRadius: radius.pill, backgroundColor: categoryColors[c.category] }} />
                  )}
                  <Text size={fontSize.sm} weight={on ? 'heavy' : 'semibold'} color={on ? palette.onInk : palette.text}>
                    {c.category === 'all' ? 'All' : titleCase(c.category)} {c.count}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ gap: spacing.sm + 2 }} onLayout={(ev) => { listY.current = ev.nativeEvent.layout.y; scrollToTarget(); }}>
            {list.length === 0 && emptyBox('Nothing here yet. Try another day or genre.')}
            {list.map((e, i) => (
              <Fragment key={e.id}>
                {i === firstTba && (
                  <Text size={fontSize.xs} weight="heavy" upper tracking={0.07} muted>Time TBA</Text>
                )}
                {card(e)}
              </Fragment>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
