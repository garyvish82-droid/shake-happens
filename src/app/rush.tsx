import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { Screen } from '../ui/Screen';

const LEVELS = [
  { label: 'Busy', sub: '5–10 people' },
  { label: 'Long', sub: '10–25' },
  { label: 'Chaos', sub: '25+' },
];

const PEOPLE = [
  { initials: 'DO', name: 'Dor', role: 'Floater on duty', s: ['Sending…', 'Delivered', 'Seen', 'Coming · 2 min'] },
  { initials: 'LI', name: 'Lior', role: 'Next floater', s: ['Sending…', 'No signal · retrying', 'No signal · retrying', 'Delivered'] },
  { initials: 'YA', name: 'Yael', role: 'Opted in for rushes', s: ['Sending…', 'Sending…', 'Delivered', 'Seen'] },
];

type Phase = 'idle' | 'countdown' | 'sent';

export default function RushScreen() {
  const { palette } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<Phase>('idle');
  const [holding, setHolding] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [step, setStep] = useState(0);
  const fill = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const steps = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (tick.current) clearInterval(tick.current);
    steps.current.forEach(clearTimeout);
    steps.current = [];
  };

  useEffect(() => clearAll, []);

  const send = () => {
    setPhase('countdown');
    setCountdown(5);
    setHolding(false);
    fill.setValue(0);
    let n = 5;
    tick.current = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        if (tick.current) clearInterval(tick.current);
        setPhase('sent');
        setStep(0);
        steps.current = [1, 2, 3].map((s) => setTimeout(() => setStep(s), s * 1300));
      } else {
        setCountdown(n);
      }
    }, 1000);
  };

  const startHold = () => {
    setHolding(true);
    Animated.timing(fill, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: false }).start();
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(send, 1100);
  };

  const stopHold = () => {
    if (!holding) return;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setHolding(false);
    Animated.timing(fill, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };

  const cancel = () => {
    clearAll();
    setPhase('idle');
    setCountdown(5);
    fill.setValue(0);
  };

  const good = (t: string) => t === 'Seen' || t.startsWith('Coming');
  const text = palette.rushText;
  const people = PEOPLE.slice(0, level + 1);

  return (
    <Screen flushTop background={palette.rushBg} gap={16} contentStyle={{ paddingHorizontal: 0, paddingBottom: 24 }}>
      <View style={{ backgroundColor: palette.accent, paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 18, gap: 12 }}>
        <Pressable
          accessibilityLabel="Back to home"
          onPress={() => router.back()}
          style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: palette.onAccent, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="back" size={22} color={palette.onAccent} strokeWidth={2.4} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="bolt" size={34} color={palette.onAccent} />
          <Text size={38} weight="heavy" tracking={-0.03} color={palette.onAccent}>
            {phase === 'sent' ? 'Help is on the way' : 'Call for help'}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 16, flexGrow: 1 }}>
        <View style={{ gap: 8 }}>
          <Text size={14} weight="heavy" upper tracking={0.08} color={text}>How long is the line?</Text>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
            {LEVELS.map((l, i) => {
              const on = i === level;
              return (
                <Pressable
                  key={l.label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setLevel(i)}
                  style={{
                    flex: 1, minHeight: 64, borderRadius: 14, borderWidth: 2, borderColor: text,
                    alignItems: 'center', justifyContent: 'center', gap: 2,
                    backgroundColor: on ? text : 'transparent',
                  }}
                >
                  <Text size={17} weight="heavy" color={on ? palette.rushBg : text}>{l.label}</Text>
                  <Text size={13} weight="semibold" color={on ? palette.rushBg : text}>{l.sub}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {phase === 'idle' && (
          <Pressable
            accessibilityLabel="Press and hold for one second to call help"
            onPressIn={startHold}
            onPressOut={stopHold}
            style={{ height: 96, borderRadius: 24, backgroundColor: palette.ink, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
          >
            <Animated.View
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: palette.accent, opacity: 0.85,
                width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }}
            />
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text size={22} weight="heavy" color={holding ? palette.onAccent : palette.onInk}>
                {holding ? 'Keep holding…' : 'Hold to call help'}
              </Text>
              <Text size={14} weight="semibold" color={holding ? palette.onAccent : palette.onInk}>
                Pings {level === 0 ? 'the floater' : `${level + 1} people`} · prevents pocket calls
              </Text>
            </View>
          </Pressable>
        )}

        {phase === 'countdown' && (
          <View
            accessibilityRole="alert"
            style={{ height: 96, borderRadius: 24, backgroundColor: palette.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 12 }}
          >
            <View style={{ gap: 2, flexShrink: 1 }}>
              <Text size={20} weight="heavy" color={palette.onInk}>Sending in {countdown}…</Text>
              <Text size={14} weight="semibold" color={palette.onInk}>Tapped by mistake? Cancel now</Text>
            </View>
            <Pressable onPress={cancel} style={{ height: 64, paddingHorizontal: 20, borderRadius: 16, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text size={18} weight="heavy" color={palette.onAccent}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {phase === 'sent' && (
          <View style={{ backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16, gap: 12 }}>
            {people.map((p) => {
              const t = p.s[step];
              return (
                <View key={p.name} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.avatar, alignItems: 'center', justifyContent: 'center' }}>
                    <Text size={14} weight="heavy" color={palette.onAccent}>{p.initials}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text size={17} weight="bold">{p.name}</Text>
                    <Text size={13} weight="semibold" muted>{p.role}</Text>
                  </View>
                  <Text size={14} weight="heavy" color={good(t) ? palette.teal : palette.textMuted} style={{ textAlign: 'right', maxWidth: 120 }}>
                    {(good(t) ? '✓ ' : '') + t}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="signal" size={20} color={text} />
          <Text size={14} weight="semibold" color={text} style={{ flex: 1, lineHeight: 19 }}>
            No signal? Calls retry by themselves. Backup: radio ch. [CHANNEL] or three whistle blasts.
          </Text>
        </View>

        <View style={{ flexGrow: 1 }} />

        <Pressable
          onPress={() => { cancel(); router.back(); }}
          style={{ height: 56, borderRadius: 16, borderWidth: 2, borderColor: text, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text size={17} weight="heavy" color={text}>We're good — end rush</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
