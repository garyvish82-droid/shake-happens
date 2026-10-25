import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { Text } from '../../../ui/Text';
import { Icon } from '../../../ui/Icon';
import { Screen } from '../../../ui/Screen';

const ABOUT = ['This shift · 16:00', 'Last batch · Mango ×3', 'Supplies', 'Rush · 16:42'];
const SHORT = ['Shift 16:00', 'Mango ×3', 'Supplies', 'Rush 16:42'];
const QUICK = ['Ran out of stock', 'Too slow', 'Machine trouble', 'Loved it'];

type Item = { id: string; about: string; who: string; when: string; text: string; votes: number };

const BASE: Item[] = [
  { id: '1', about: 'Rush 18:30', who: 'Dor', when: 'yesterday', text: 'Sunset rush every day. Needs three people, not two.', votes: 9 },
  { id: '2', about: 'Supplies', who: 'Shira', when: '16:10', text: 'Out of oat milk by 15:00 two days running. Bring 2×.', votes: 6 },
  { id: '3', about: 'Berry ×4', who: 'Itay', when: '14:32', text: 'Most expensive, least asked for. Swap for frozen mix?', votes: 4 },
];

export default function FeedbackScreen() {
  const { palette } = useTheme();
  const [about, setAbout] = useState(0);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [posted, setPosted] = useState<Item[]>([]);
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState('');

  const add = (text: string) => {
    setPosted((p) => [
      { id: `p${Date.now()}`, about: SHORT[about], who: 'You', when: 'saved · sends when online', text, votes: 0 },
      ...p,
    ]);
    setDraft('');
    setRecording(false);
  };

  const items = [...posted, ...BASE].slice(0, 3);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen gap={12}>
        <View style={{ gap: 2 }}>
          <Text size={30} weight="heavy" tracking={-0.02}>Feedback</Text>
          <Text size={14} weight="semibold" muted>Notes for next year, tied to what happened</Text>
        </View>

        <View style={{ gap: 6 }}>
          <Text size={13} weight="heavy" muted upper tracking={0.08}>About</Text>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {ABOUT.map((label, i) => {
              const on = i === about;
              return (
                <Pressable
                  key={label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setAbout(i)}
                  style={{
                    height: 44, paddingHorizontal: 12, borderRadius: 22, justifyContent: 'center',
                    borderWidth: 1.5, borderColor: on ? palette.ink : palette.border,
                    backgroundColor: on ? palette.ink : palette.surface,
                  }}
                >
                  <Text size={14} weight={on ? 'heavy' : 'semibold'} color={on ? palette.onInk : palette.text}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {QUICK.map((q) => (
            <Pressable
              key={q}
              onPress={() => add(q)}
              style={{ width: '48.5%', height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text size={16} weight="bold">{q}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          {items.map((it) => {
            const on = !!voted[it.id];
            return (
              <View
                key={it.id}
                style={{ backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border, borderRadius: 16, paddingVertical: 12, paddingLeft: 14, paddingRight: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <View style={{ height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: palette.ink, justifyContent: 'center' }}>
                      <Text size={12} weight="heavy" color={palette.onInk}>{it.about}</Text>
                    </View>
                    <Text size={13} weight="semibold" muted>{it.who} · {it.when}</Text>
                  </View>
                  <Text size={15} weight="semibold" style={{ lineHeight: 20 }}>{it.text}</Text>
                </View>
                <Pressable
                  accessibilityLabel="Agree"
                  accessibilityState={{ selected: on }}
                  onPress={() => setVoted((v) => ({ ...v, [it.id]: !on }))}
                  style={{
                    width: 52, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1.5, borderColor: on ? palette.ink : palette.border,
                    backgroundColor: on ? palette.ink : palette.surface,
                  }}
                >
                  <Text size={14} weight="bold" mono color={on ? palette.onInk : palette.text}>{it.votes + (on ? 1 : 0)}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={{ flexGrow: 1 }} />

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Pressable
            accessibilityLabel={recording ? 'Stop and post voice note' : 'Record a voice note'}
            onPress={() => (recording ? add('Voice note · 0:12') : setRecording(true))}
            style={{
              width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
              borderWidth: recording ? 0 : 1.5, borderColor: palette.border,
              backgroundColor: recording ? palette.accent : palette.surface,
            }}
          >
            <Icon name="mic" size={24} color={recording ? palette.onAccent : palette.text} />
          </Pressable>
          <TextInput
            accessibilityLabel="Your feedback"
            value={draft}
            onChangeText={setDraft}
            placeholder={recording ? 'Recording… tap mic to stop' : 'Or type a note'}
            placeholderTextColor={palette.textMuted}
            style={{
              flex: 1, height: 56, borderRadius: 16, borderWidth: 1.5, borderColor: palette.border,
              backgroundColor: palette.surface, color: palette.text, paddingHorizontal: 14,
              fontFamily: 'BricolageGrotesque_600SemiBold', fontSize: 16,
            }}
          />
          <Pressable
            onPress={() => draft.trim() && add(draft.trim())}
            style={{ height: 56, paddingHorizontal: 18, borderRadius: 16, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size={16} weight="heavy" color={palette.onAccent}>Post</Text>
          </Pressable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
