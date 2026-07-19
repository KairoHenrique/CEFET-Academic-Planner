import { useEffect, useRef, type ReactNode } from "react";
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { MOTION_FAST_MS } from "./pressableStyles";

type Props = {
  children: ReactNode;
  /** Quando true, conteúdo some e volta a fade-in. */
  ready: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Fade-in suave quando dados saem do loading — evita “pop” seco spinner→tela.
 * Sem skeleton; zero mudança de layout.
 */
export function FadeInContent({ children, ready, style }: Props) {
  const opacity = useRef(new Animated.Value(ready ? 1 : 0)).current;

  useEffect(() => {
    if (!ready) {
      opacity.setValue(0);
      return;
    }
    Animated.timing(opacity, {
      toValue: 1,
      duration: MOTION_FAST_MS,
      useNativeDriver: true,
    }).start();
  }, [ready, opacity]);

  if (!ready) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View style={[styles.fill, style, { opacity }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flexGrow: 1 },
});
