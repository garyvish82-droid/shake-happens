import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeProvider';
import { Text } from '../../../ui/Text';
import { Icon } from '../../../ui/Icon';
import { Screen } from '../../../ui/Screen';
import { useCampData } from '../../../hooks/useCampData';

// Sample targets, same as the design prototype (live GPS/compass comes later)
// Sample reading, same as the design prototype (live GPS/compass comes later)
const CAMP_TARGET = { id: 'camp', name: 'Camp', brg: 43, dist: '340 M', mins: 5, source: 'PINNED' };
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const HEADING = 0;
const SIZE = 292;
const C = SIZE / 2;

export default function NavigateScreen() {
  const { palette, theme } = useTheme();
  const { data } = useCampData();
  const [calib, setCalib] = useState(false);
  const night = theme === 'dark';

  const cur = CAMP_TARGET;
  const dir = DIRS[Math.round(cur.brg / 45) % 8];
  const dial = -HEADING;

  const ticks = Array.from({ length: 72 }, (_, i) => {
    const major = i % 6 === 0;
    return { a: i * 5 + dial, major };
  });

  return (
    <Screen gap={12}>
      <View style={{ gap: 2 }}>
        <Text size={28} weight="heavy" tracking={-0.02}>Find camp</Text>
        <Text size={13} weight="semibold" muted>{data?.camp.pinLandmark ? `Look for: ${data.camp.pinLandmark}` : 'Camp location'}</Text>
      </View>

      {/* compass */}
      <View style={{ width: SIZE, height: SIZE, alignSelf: 'center' }}>
        <View
          style={{
            position: 'absolute', inset: 0, borderRadius: SIZE / 2, backgroundColor: palette.track,
            borderWidth: 4, borderColor: palette.text,
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
        <View
          style={{
            position: 'absolute', left: 124, top: 36, width: 44, height: 220,
            transform: [{ rotate: `${cur.brg - HEADING}deg` }],
            shadowColor: night ? palette.accent : 'transparent', shadowOpacity: 0.75, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Svg width={44} height={220} viewBox="0 0 44 220">
            <Path d="M22 4 36 110 8 110z" fill={palette.accent} stroke={palette.text} strokeWidth={2.5} strokeLinejoin="round" />
            <Path d="M8 110 36 110 22 216z" fill={palette.border} stroke={palette.text} strokeWidth={2.5} strokeLinejoin="round" />
          </Svg>
        </View>
        <View
          style={{
            position: 'absolute', left: 130, top: 130, width: 32, height: 32, borderRadius: 16,
            backgroundColor: palette.ink, borderWidth: 4, borderColor: palette.surface,
          }}
        />
      </View>

      {/* accuracy + calibrate */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ height: 44, paddingHorizontal: 12, borderRadius: 22, backgroundColor: palette.tealTint, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="check" size={14} color={palette.teal} strokeWidth={3} />
          <Text size={14} weight="heavy" color={palette.teal}>GPS ±4 m</Text>
        </View>
        <Pressable
          onPress={() => setCalib((v) => !v)}
          style={{ flex: 1, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: palette.text, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text size={14} weight="heavy" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ paddingHorizontal: 8 }}>Compass ±15° · Calibrate</Text>
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
            <Text mono size={13} weight="bold" tracking={0.08} color={palette.lcdText}>TO {cur.name.toUpperCase()}</Text>
            <Text mono size={13} weight="bold" tracking={0.08} color={palette.lcdText}>{cur.source}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text mono size={34} weight="bold" color={palette.lcdText} numberOfLines={1}>{cur.dist}</Text>
            <Text mono size={17} weight="bold" color={palette.lcdText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ flexShrink: 1, textAlign: 'right' }}>
              {String(cur.brg).padStart(3, '0')}° {dir} · {cur.mins} MIN
            </Text>
          </View>
        </View>
      )}
    </Screen>
  );
}
