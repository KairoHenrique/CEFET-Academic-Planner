import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { brand } from "../../theme/brand";

const DONUT_RADIUS = 52;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_CENTER = 60;
const SIZE = 200;

type Props = {
  percentage: number;
  totalDone: number;
  totalHours: number;
};

/** Espelho de `IntegrationDonutChart` do site. */
export function IntegrationDonutChart({
  percentage,
  totalDone,
  totalHours,
}: Props) {
  const progress = Math.min(100, Math.max(0, percentage));
  const dashOffset = DONUT_CIRCUMFERENCE * (1 - progress / 100);
  const remaining = Math.max(0, totalHours - totalDone);

  return (
    <View style={styles.wrap}>
      <View style={styles.donut}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 120 120">
          <Defs>
            <LinearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={brand.gold600} />
              <Stop offset="42%" stopColor={brand.gold400} />
              <Stop offset="100%" stopColor={brand.gold200} />
            </LinearGradient>
          </Defs>
          {/* rotate -90° via transform origin center */}
          <Circle
            cx={DONUT_CENTER}
            cy={DONUT_CENTER}
            r={DONUT_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={7}
            rotation={-90}
            origin={`${DONUT_CENTER}, ${DONUT_CENTER}`}
          />
          <Circle
            cx={DONUT_CENTER}
            cy={DONUT_CENTER}
            r={DONUT_RADIUS}
            fill="none"
            stroke="url(#donutGrad)"
            strokeWidth={11}
            strokeLinecap="round"
            strokeDasharray={`${DONUT_CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            opacity={0.22}
            rotation={-90}
            origin={`${DONUT_CENTER}, ${DONUT_CENTER}`}
          />
          <Circle
            cx={DONUT_CENTER}
            cy={DONUT_CENTER}
            r={DONUT_RADIUS}
            fill="none"
            stroke="url(#donutGrad)"
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={`${DONUT_CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            rotation={-90}
            origin={`${DONUT_CENTER}, ${DONUT_CENTER}`}
          />
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.value}>{progress}%</Text>
          <Text style={styles.label}>concluído</Text>
        </View>
      </View>
      <Text style={styles.hours}>
        <Text style={styles.hoursStrong}>{totalDone}h</Text>
        {` de ${totalHours}h`}
      </Text>
      <Text style={styles.remaining}>{remaining}h restantes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    maxWidth: 220,
    alignSelf: "center",
    width: "100%",
  },
  donut: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  value: {
    fontSize: 36,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
    color: brand.gold300,
    lineHeight: 40,
  },
  label: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: brand.textMuted,
  },
  hours: {
    marginTop: 10,
    fontSize: 15,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  hoursStrong: {
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "700",
    color: brand.gold300,
  },
  remaining: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
});
