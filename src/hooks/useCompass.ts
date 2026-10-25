import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type Fix = { lat: number; lng: number; accuracy: number | null };

export type CompassState = {
  permission: 'unknown' | 'granted' | 'denied';
  /** current GPS position, null until the first fix */
  fix: Fix | null;
  /** degrees from north the phone is facing, null until the compass reports */
  heading: number | null;
  /** iOS compass quality 0 (bad) to 3 (good), null if unknown */
  headingQuality: number | null;
};

/** Live GPS + compass while the screen is mounted */
export function useCompass(active: boolean): CompassState {
  const [state, setState] = useState<CompassState>({ permission: 'unknown', fix: null, heading: null, headingQuality: null });

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let posSub: Location.LocationSubscription | null = null;
    let headSub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setState((s) => ({ ...s, permission: 'denied' }));
        return;
      }
      setState((s) => ({ ...s, permission: 'granted' }));

      posSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 2, timeInterval: 2000 },
        (loc) => {
          if (cancelled) return;
          setState((s) => ({
            ...s,
            fix: { lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy: loc.coords.accuracy ?? null },
          }));
        }
      );
      headSub = await Location.watchHeadingAsync((h) => {
        if (cancelled) return;
        const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
        setState((s) => ({ ...s, heading: deg, headingQuality: h.accuracy }));
      });
    })().catch((e) => console.warn('⚠️ Location error:', String(e)));

    return () => {
      cancelled = true;
      posSub?.remove();
      headSub?.remove();
    };
  }, [active]);

  return state;
}
