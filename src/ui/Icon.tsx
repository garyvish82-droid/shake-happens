import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'home' | 'calendar' | 'log' | 'chat' | 'compass' | 'bell' | 'sync' | 'bolt'
  | 'check' | 'sun' | 'moon' | 'back' | 'mic' | 'save' | 'signal';

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color, strokeWidth = 2.2 }: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && (<><Path d="M3 10.5 12 3l9 7.5V21H3z" {...stroke} /><Path d="M9 21v-6h6v6" {...stroke} /></>)}
      {name === 'calendar' && (<><Rect x="3" y="4" width="18" height="17" rx="2" {...stroke} /><Path d="M3 9h18M8 2v4M16 2v4" {...stroke} /></>)}
      {name === 'log' && (<><Path d="M6 8h12l-1.5 13h-9z" {...stroke} /><Path d="M12 8 14 2" {...stroke} /><Path d="M5 8h14" {...stroke} /></>)}
      {name === 'chat' && <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...stroke} />}
      {name === 'compass' && (<><Circle cx="12" cy="12" r="10" {...stroke} /><Path d="m16 8-2 6-6 2 2-6z" {...stroke} /></>)}
      {name === 'bell' && (<><Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" {...stroke} /><Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" {...stroke} /></>)}
      {name === 'sync' && (<><Path d="M21 12a9 9 0 1 1-3-6.7L21 8" {...stroke} /><Path d="M21 3v5h-5" {...stroke} /></>)}
      {name === 'bolt' && <Path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth={1.4} strokeLinejoin="round" fill={color} />}
      {name === 'check' && <Path d="M20 6 9 17l-5-5" {...stroke} />}
      {name === 'sun' && (<><Circle cx="12" cy="12" r="4" {...stroke} /><Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" {...stroke} /></>)}
      {name === 'moon' && <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" {...stroke} />}
      {name === 'back' && <Path d="M15 18 9 12l6-6" {...stroke} />}
      {name === 'mic' && (<><Rect x="9" y="2" width="6" height="12" rx="3" {...stroke} /><Path d="M5 11a7 7 0 0 0 14 0M12 18v4" {...stroke} /></>)}
      {name === 'save' && <Path d="M12 3v12M7 10l5 5 5-5M5 21h14" {...stroke} />}
      {name === 'signal' && <Path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16" {...stroke} />}
    </Svg>
  );
}
