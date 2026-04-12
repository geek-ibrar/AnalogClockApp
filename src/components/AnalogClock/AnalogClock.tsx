import React, { memo, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { CLOCK_SIZE_RATIO, CLOCK_THEME } from '../../constants';
import { useOrientation } from '../../hooks/useOrientation';
import { ClockTime } from '../../types';

// ─── SVG coordinate constants (viewBox = 200×200) ─────────────────────────────
const VB = 200;          // viewBox size
const C = VB / 2;        // centre = 100
const FACE_R = 88;       // clock face radius
const HOUR_LEN = 52;     // hour hand length from centre
const MIN_LEN = 68;      // minute hand length
const SEC_LEN = 74;      // second hand length
const SEC_TAIL = 16;     // second hand counter-balance behind centre
const NUM_R = FACE_R - 20; // radius for hour numerals

// ─── Angle helpers ────────────────────────────────────────────────────────────

/**
 * Converts clock time into rotation angles (degrees, 0° = 12 o'clock).
 * Intermediate values produce smooth, continuous hand movement.
 */
const toAngles = (time: ClockTime) => {
  const { hours, minutes, seconds } = time;
  return {
    // 30° per hour + incremental minute/second contribution
    hourAngle: (hours % 12) * 30 + minutes * 0.5 + seconds * (0.5 / 60),
    // 6° per minute + incremental second contribution
    minuteAngle: minutes * 6 + seconds * 0.1,
    // 6° per second
    secondAngle: seconds * 6,
  };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Renders all 60 tick marks (12 large hour ticks + 48 small minute ticks).
 * Memoized since these never change.
 */
const Markers = memo(() => {
  const marks = useMemo(() => {
    const result = [];
    for (let i = 0; i < 60; i++) {
      // Deg to Rad = (angle in degrees × π) / 180
      const rad = (i * 6 * Math.PI) / 180;
      const isHour = i % 5 === 0;
      const outerR = FACE_R - 2;
      const innerR = isHour ? FACE_R - 13 : FACE_R - 6;
      result.push({
        key: i,
        x1: C + outerR * Math.sin(rad),
        y1: C - outerR * Math.cos(rad),
        x2: C + innerR * Math.sin(rad),
        y2: C - innerR * Math.cos(rad),
        isHour,
      });
    }
    return result;
  }, []);

  return (
    <>
      {marks.map(({ key, x1, y1, x2, y2, isHour }) => (
        <Line
          key={key}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={isHour ? CLOCK_THEME.hourMarker : CLOCK_THEME.minuteMarker}
          strokeWidth={isHour ? 2.5 : 1}
          strokeLinecap="round"
        />
      ))}
    </>
  );
});

/**
 * Renders the 1–12 numerals positioned around the clock face.
 * Memoized since these never change.
 */
const Numerals = memo(() => {
  const nums = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const n = i + 1;
      const rad = (n * 30 * Math.PI) / 180;
      return {
        key: n,
        x: C + NUM_R * Math.sin(rad),
        y: C - NUM_R * Math.cos(rad),
        label: String(n),
      };
    }),
  []);

  return (
    <>
      {nums.map(({ key, x, y, label }) => (
        <SvgText
          key={key}
          x={x} y={y}
          textAnchor="middle"
          alignmentBaseline="central"
          fontSize={9}
          fontWeight="600"
          fill={CLOCK_THEME.numbers}
        >
          {label}
        </SvgText>
      ))}
    </>
  );
});

/**
 * A single clock hand.
 * Rotation is applied around the clock centre using SVG's `origin` shorthand.
 *
 * @param angle     - Rotation in degrees (0° = straight up / 12 o'clock)
 * @param length    - Hand length from centre toward tip
 * @param tailLen   - Counter-balance length behind centre (default 0)
 * @param width     - Stroke width
 * @param color     - Stroke colour
 */
interface HandProps {
  angle: number;
  length: number;
  tailLen?: number;
  width: number;
  color: string;
}

const Hand = memo<HandProps>(({ angle, length, tailLen = 0, width, color }) => (
  <G transform={`rotate(${angle} ${C} ${C})`}>
    <Line
      x1={C}
      y1={C + tailLen}
      x2={C}
      y2={C - length}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
    />
  </G>
));

// ─── Main Component ───────────────────────────────────────────────────────────

interface AnalogClockProps {
  time: ClockTime;
}

/**
 * Fully custom analog clock built with react-native-svg.
 *
 * Features:
 *  - Smooth continuous hand movement (no ticking jitter)
 *  - Adapts to both portrait and landscape orientations
 *  - Scales proportionally across all screen sizes
 *  - No third-party clock libraries used
 */
const AnalogClock: React.FC<AnalogClockProps> = ({ time }) => {
  const { width, height } = useWindowDimensions();
  const orientation = useOrientation();

  // In landscape the clock shares horizontal space with the info panel
  const availableDim = orientation === 'landscape'
    ? Math.min(height, width * 0.5)
    : Math.min(width, height);

  const size = availableDim * CLOCK_SIZE_RATIO;
  const { hourAngle, minuteAngle, secondAngle } = toAngles(time);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>

        {/* Subtle drop shadow */}
        <Circle cx={C + 2} cy={C + 3} r={FACE_R} fill="rgba(0,0,0,0.08)" />

        {/* Clock face */}
        <Circle
          cx={C} cy={C} r={FACE_R}
          fill={CLOCK_THEME.face}
          stroke={CLOCK_THEME.faceStroke}
          strokeWidth={2.5}
        />

        <Markers />
        <Numerals />

        {/* Hour hand — thickest, shortest */}
        <Hand
          angle={hourAngle}
          length={HOUR_LEN}
          tailLen={8}
          width={5.5}
          color={CLOCK_THEME.hourHand}
        />

        {/* Minute hand */}
        <Hand
          angle={minuteAngle}
          length={MIN_LEN}
          tailLen={8}
          width={3.5}
          color={CLOCK_THEME.minuteHand}
        />

        {/* Second hand — thinnest, longest, has counter-balance tail */}
        <Hand
          angle={secondAngle}
          length={SEC_LEN}
          tailLen={SEC_TAIL}
          width={1.5}
          color={CLOCK_THEME.secondHand}
        />

        {/* Centre pivot — coloured ring + white inner dot */}
        <Circle cx={C} cy={C} r={6} fill={CLOCK_THEME.center} />
        <Circle cx={C} cy={C} r={2.5} fill={CLOCK_THEME.centerInner} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
  },
});

export default memo(AnalogClock);
