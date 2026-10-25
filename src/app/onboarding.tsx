import { useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { useCampData } from '../hooks/useCampData';
import { nameCloseTo, nameMatches } from '../lib/campData';

// The brand-kit splash art. The native splash shows the same picture,
// so the first screen is a continuation of it.
const SPLASH_ART = require('../../assets/splash-icon.png');
const BRAND_BLUE = '#028BE6';
const DEEP_BLUE = '#082A54';
const SUN_YELLOW = '#FFC83D';

type Step = 'welcome' | 'name' | 'location';

export default function Onboarding() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, status, refresh, setMemberId, completeOnboarding } = useCampData();
  const [step, setStep] = useState<Step>('welcome');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const finish = async (askLocation: boolean) => {
    if (finishing) return;
    setFinishing(true);
    try {
      if (askLocation) await Location.requestForegroundPermissionsAsync();
    } catch {
      // never block the crew from entering the app
    }
    if (picked) await setMemberId(picked);
    await completeOnboarding();
  };

  // ---------- 1. welcome (continues the splash) ----------
  if (step === 'welcome') {
    return (
      <View style={{ flex: 1, backgroundColor: BRAND_BLUE }}>
        <StatusBar style="light" />
        <Image source={SPLASH_ART} resizeMode="contain" style={{ flex: 1, width: '100%' }} />
        <View style={{ position: 'absolute', left: 24, right: 24, bottom: Math.max(insets.bottom, 16) + 24 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setStep('name')}
            style={{ height: 60, borderRadius: 30, backgroundColor: SUN_YELLOW, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size={20} weight="heavy" color={DEEP_BLUE}>Let's go</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const progress = (n: number) => (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {[1, 2].map((i) => (
        <View
          key={i}
          style={{ height: 6, width: i === n ? 28 : 12, borderRadius: 3, backgroundColor: i === n ? palette.ink : palette.border }}
        />
      ))}
      <Text size={13} weight="semibold" muted style={{ marginLeft: 6 }}>Step {n} of 2</Text>
    </View>
  );

  // ---------- 2. who are you ----------
  if (step === 'name') {
    const members = (data?.members ?? []).filter((m) => m.active);
    const typed = query.trim();
    const exact = typed ? members.filter((m) => nameMatches(m.name, typed)) : members;
    // nothing matches: offer the names that are one or two letters away ("Did you mean")
    const suggestions = typed && exact.length === 0 ? members.filter((m) => nameCloseTo(m.name, typed)) : [];
    const shown = exact.length > 0 ? exact : suggestions;
    const pickedName = members.find((m) => m.id === picked)?.name;
    const pickedVisible = !!picked && shown.some((m) => m.id === picked);

    const onChange = (text: string) => {
      setQuery(text);
      // a pick that no longer fits what is typed is dropped, so the button never points at a hidden name
      if (picked) {
        const m = members.find((x) => x.id === picked);
        if (m && text.trim() && !nameMatches(m.name, text.trim())) setPicked(null);
      }
    };

    const choose = (id: string) => {
      setPicked(id);
      Keyboard.dismiss();
    };

    const clear = () => {
      setQuery('');
      setPicked(null);
    };

    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, paddingTop: insets.top + 12, paddingHorizontal: 20, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable
              accessibilityLabel="Back"
              onPress={() => {
                Keyboard.dismiss();
                setStep('welcome');
              }}
              hitSlop={8}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="back" size={20} color={palette.text} strokeWidth={2.4} />
            </Pressable>
            {progress(1)}
          </View>

          <Pressable onPress={Keyboard.dismiss} accessible={false} style={{ gap: 4 }}>
            <Text size={30} weight="heavy" tracking={-0.02}>Who are you?</Text>
            <Text size={15} weight="semibold" muted>Type a few letters of your name, then tap it.</Text>
          </Pressable>

          {!data ? (
            <View style={{ backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border, borderRadius: 16, padding: 16, gap: 12 }}>
              <Text size={15} weight="semibold" muted>
                {status === 'loading' ? 'Loading the crew list…' : 'The crew list has not loaded yet. Connect to the internet once and try again.'}
              </Text>
              {status !== 'loading' && (
                <Pressable onPress={refresh} style={{ height: 48, borderRadius: 12, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <Text size={15} weight="heavy" color={palette.onInk}>Try again</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <>
              <View style={{ justifyContent: 'center' }}>
                <TextInput
                  accessibilityLabel="Search your name"
                  value={query}
                  onChangeText={onChange}
                  placeholder="Type your name"
                  placeholderTextColor={palette.textMuted}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                    if (exact.length === 1) setPicked(exact[0].id);
                  }}
                  style={{
                    height: 56, borderRadius: 16, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.surface,
                    color: palette.text, paddingLeft: 16, paddingRight: 96, fontFamily: 'Inter_600SemiBold', fontSize: 17,
                  }}
                />
                {query.length > 0 && (
                  <Pressable
                    accessibilityLabel="Clear"
                    onPress={clear}
                    hitSlop={8}
                    style={{ position: 'absolute', right: 8, height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: palette.tealTint, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text size={14} weight="heavy" color={palette.ink}>Clear</Text>
                  </Pressable>
                )}
              </View>

              {exact.length === 0 && (
                <Text size={15} weight="semibold" muted>
                  {suggestions.length > 0 ? `No one called "${typed}". Did you mean:` : `No one called "${typed}". Check the spelling, or tap Clear to see everyone.`}
                </Text>
              )}

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
              >
                {shown.map((m) => {
                  const on = m.id === picked;
                  return (
                    <Pressable
                      key={m.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      onPress={() => choose(m.id)}
                      style={{
                        minHeight: 56, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        borderWidth: 1.5, borderColor: on ? palette.ink : palette.border, backgroundColor: on ? palette.ink : palette.surface,
                      }}
                    >
                      <Text size={17} weight="bold" color={on ? palette.onInk : palette.text}>{m.name}</Text>
                      {on && <Icon name="check" size={20} color={palette.onInk} strokeWidth={2.6} />}
                    </Pressable>
                  );
                })}
                {shown.length === 0 && typed.length > 0 && (
                  <Pressable
                    onPress={clear}
                    style={{ height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text size={16} weight="heavy" color={palette.ink}>Clear and show everyone</Text>
                  </Pressable>
                )}
              </ScrollView>
            </>
          )}

          <View style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <Pressable
              accessibilityRole="button"
              disabled={!pickedVisible}
              onPress={() => {
                Keyboard.dismiss();
                setStep('location');
              }}
              style={{ height: 60, borderRadius: 30, backgroundColor: pickedVisible ? palette.ink : palette.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text size={18} weight="heavy" color={pickedVisible ? palette.onInk : palette.textMuted} numberOfLines={1}>
                {pickedVisible && pickedName ? `Continue as ${pickedName}` : 'Tap your name above'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ---------- 3. location ----------
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, paddingTop: insets.top + 12, paddingHorizontal: 20, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            accessibilityLabel="Back"
            onPress={() => setStep('name')}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="back" size={20} color={palette.text} strokeWidth={2.4} />
          </Pressable>
          {progress(2)}
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: 20 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="compass" size={48} color={palette.onAccent} strokeWidth={2} />
          </View>
          <View style={{ gap: 8 }}>
            <Text size={30} weight="heavy" tracking={-0.02}>Find your way back to camp</Text>
            <Text size={17} weight="regular" muted style={{ lineHeight: 25 }}>
              With your location the app can point you to camp. We only use it while the app is open, and it is never shared.
            </Text>
            <Text size={15} weight="semibold" muted>You can skip this and turn it on later.</Text>
          </View>
        </View>

        <View style={{ gap: 10, paddingBottom: Math.max(insets.bottom, 16) }}>
          <Pressable
            accessibilityRole="button"
            disabled={finishing}
            onPress={() => finish(true)}
            style={{ height: 60, borderRadius: 30, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center', opacity: finishing ? 0.6 : 1 }}
          >
            <Text size={18} weight="heavy" color={palette.onInk}>Allow location</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={finishing}
            onPress={() => finish(false)}
            style={{ height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size={16} weight="bold" color={palette.ink}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
