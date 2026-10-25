import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeProvider';
import { Text } from '../../../ui/Text';
import { Icon } from '../../../ui/Icon';
import { Screen } from '../../../ui/Screen';
import { useCampData } from '../../../hooks/useCampData';
import { useCompass } from '../../../hooks/useCompass';
import {
  bearingDegrees, compassWord, distanceMeters, formatDistance, walkMinutes,
} from '../../../lib/campData';

const SIZE = 292;
const C = SIZE / 2;
/** inside this distance GPS cannot guide any closer */
const ARRIVED_M = 20;

function qualityText(q: number | null) {
  if (q === null) return 'Compass · Calibrate';
  if (q >= 3) return 'Compass ±5° · Calibrate';
  if (q === 2) return 'Compass ±15° · Calibrate';
  if (q === 1) return 'Compass ±30° · Calibrate';
  return 'Compass off · Calibrate';
}

export default function NavigateScreen() {
  const { palette, theme } = useTheme();
  const { data, status, refresh } = useCampData();
  const focused = useIsFocused();
  const { permission, fix, heading, headingQuality } = useCompass(focused);
  const [calib, setCalib] = useState(false);
  const night = theme === 'dark';

  const pin = data?.camp.pin ?? null;
  const dist = fix && pin ? distanceMeters(fix, pin) : null;
  const brg = fix && pin ? bearingDegrees(fix, pin) : null;
  const arrived = dist !== null && dist <= ARRIVED_M;
  const facing = heading ?? 0; // until the compass reports, north is up
  const dial = -facing;

  const ticks = Array.from({ length: 72 }, (_, i) => ({ a: i * 5 + dial, major: i % 6 === 0 }));

  const card = {
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  } as const;

  // ---- states where there is nothing to point at
  let blocker: React.ReactNode = null;
  if (!data) {
    blocker = (
      <View style={card}>
        <Text size={15} weight="semibold" muted>
          {status === 'loading' ? 'Loading camp location…' : 'Camp location has not loaded yet. Connect to the internet once and try again.'}
        </Text>
        {status !== 'loading' && (
          <Pressable onPress={refresh} style={{ height: 48, borderRadius: 12, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Text size={15} weight="heavy" color={palette.onInk}>Try again</Text>
          </Pressable>
        )}
      </View>
    );
  } else if (!pin) {
    blocker = (
      <View style={card}>
        <Text size={17} weight="bold">The camp pin is not set yet</Text>
        <Text size={15} muted>Add pin_lat and pin_lng to the camp tab of the sheet.</Text>
      </View>
    );
  } else if (permission === 'denied') {
    blocker = (
      <View style={card}>
        <Text size={17} weight="bold">Location is off</Text>
        <Text size={15} muted>Allow location for Shake Happens in Settings to find your way back.</Text>
        <Pressable onPress={() => Linking.openSettings()} style={{ height: 48, borderRadius: 12, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Text size={15} weight="heavy" color={palette.onInk}>Open Settings</Text>
        </Pressable>
      </View>
    );
  }

  const gpsText = fix
    ? fix.accuracy !== null ? `GPS ±${Math.max(1, Math.round(fix.accuracy))} m` : 'GPS on'
    : permission === 'granted' ? 'Finding GPS…' : 'GPS';

  return (
    <Screen gap={12}>
      <View style={{ gap: 2 }}>
        <Text size={28} weight="heavy" tracking={-0.02}>Find camp</Text>
        <Text size={13} weight="semibold" muted>
          {data?.camp.pinLandmark ? `Look for: ${data.camp.pinLandmark}` : 'Camp location'}
        </Text>
      </View>

      {blocker ?? (
        <>
          {arrived ? (
            <View style={{ height: SIZE, borderRadius: 24, backgroundColor: palette.accent, padding: 24, justifyContent: 'center', gap: 10 }}>
              <Text size={14} weight="heavy" upper tracking={0.1} color={palette.onAccent}>GPS can't go closer than this</Text>
              <Text size={34} weight="heavy" tracking={-0.02} color={palette.onAccent}>
                You're close — about {Math.max(1, Math.round(dist ?? 0))} m
              </Text>
              {!!data?.camp.pinLandmark && (
                <Text size={18} weight="bold" color={palette.onAccent}>Look for: {data.camp.pinLandmark}</Text>
              )}
            </View>
          ) : (
            <View style={{ width: SIZE, height: SIZE, alignSelf: 'center' }}>
              <View
                style={{
                  position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: SIZE / 2,
                  backgroundColor: palette.track, borderWidth: 4, borderColor: palette.text,
                }}
              />
              <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
                <Circle cx={C} cy={C} r={C - 70} stroke={palette.border} strokeWidth={1.5} strokeDasharray="5 5" fill="none" />
                {ticks.map((t, i) => (
                  <Line
                    key={i}
                    x1={C} y1={10} x2={C} y2={10 + (t.major ? 20 : 10)}
                    stroke={t.major ? palette.text : palette.textMuted}
                    strokeWidth={t.major ? 4 : 2}
                    strokeLinecap="round"
                    rotation={t.a}
                    origin={`${C}, ${C}`}
                  />
                ))}
              </Svg>
              {(['N', 'E', 'S', 'W'] as const).map((label, i) => {
                const a = ((i * 90 + dial) * Math.PI) / 180;
                const r = 100;
                const isN = label === 'N';
                return (
                  <View
                    key={label}
                    style={{
                      position: 'absolute', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                      left: Math.round(C + r * Math.sin(a) - 16), top: Math.round(C - r * Math.cos(a) - 16),
                      backgroundColor: isN ? palette.ink : 'transparent',
                    }}
                  >
                    <Text size={20} weight="heavy" color={isN ? palette.onInk : palette.text}>{label}</Text>
                  </View>
                );
              })}
              {brg !== null && (
                <View
                  style={{
                    position: 'absolute', left: 124, top: 36, width: 44, height: 220,
                    transform: [{ rotate: `${brg - facing}deg` }],
                    shadowColor: night ? palette.accent : 'transparent', shadowOpacity: 0.75, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  <Svg width={44} height={220} viewBox="0 0 44 220">
                    <Path d="M22 4 36 110 8 110z" fill={palette.accent} stroke={palette.text} strokeWidth={2.5} strokeLinejoin="round" />
                    <Path d="M8 110 36 110 22 216z" fill={palette.border} stroke={palette.text} strokeWidth={2.5} strokeLinejoin="round" />
                  </Svg>
                </View>
              )}
              <View
                style={{
                  position: 'absolute', left: 130, top: 130, width: 32, height: 32, borderRadius: 16,
                  backgroundColor: palette.ink, borderWidth: 4, borderColor: palette.surface,
                }}
              />
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ height: 44, paddingHorizontal: 12, borderRadius: 22, backgroundColor: palette.tealTint, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {fix && <Icon name="check" size={14} color={palette.teal} strokeWidth={3} />}
              <Text size={14} weight="heavy" color={palette.teal}>{gpsText}</Text>
            </View>
            <Pressable
              onPress={() => setCalib((v) => !v)}
              style={{ flex: 1, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: palette.text, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text size={14} weight="heavy" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ paddingHorizontal: 8 }}>
                {qualityText(headingQuality)}
              </Text>
            </Pressable>
          </View>

          {calib ? (
            <View
              accessibilityRole="alert"
              style={{ backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}
            >
              <Svg width={44} height={28} viewBox="0 0 44 28">
                <Path d="M22 14c-5-8-18-8-18 0s13 8 18 0 18-8 18 0-13 8-18 0z" fill="none" stroke={palette.text} strokeWidth={3} strokeLinecap="round" />
              </Svg>
              <Text size={15} weight="bold" style={{ flex: 1, lineHeight: 20 }}>
                Wave your phone in a figure 8. Step away from art cars and speakers.
              </Text>
              <Pressable onPress={() => setCalib(false)} style={{ height: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' }}>
                <Text size={15} weight="heavy" color={palette.onInk}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <View
              accessibilityLiveRegion="polite"
              style={{ backgroundColor: palette.lcdBg, borderRadius: 12, borderWidth: 3, borderColor: palette.text, paddingVertical: 10, paddingHorizontal: 14, gap: 4 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text mono size={13} weight="bold" tracking={0.08} color={palette.lcdText}>TO CAMP</Text>
                <Text mono size={13} weight="bold" tracking={0.08} color={palette.lcdText}>PINNED</Text>
              </View>
              {dist === null || brg === null ? (
                <Text mono size={20} weight="bold" color={palette.lcdText}>
                  {permission === 'granted' ? 'WAITING FOR GPS…' : 'ASKING FOR LOCATION…'}
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text mono size={34} weight="bold" color={palette.lcdText} numberOfLines={1}>{formatDistance(dist)}</Text>
                  <Text mono size={17} weight="bold" color={palette.lcdText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ flexShrink: 1, textAlign: 'right' }}>
                    {String(Math.round(brg) % 360).padStart(3, '0')}° {compassWord(brg)} · {walkMinutes(dist)} MIN
                  </Text>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
