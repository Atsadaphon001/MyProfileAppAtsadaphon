import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { PolarBearBackdrop } from '@/components/polar-bear-backdrop';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <View style={styles.root}>
        {/* พื้นหลังธีมขั้วโลก + หมีซ้าย/ขวา อยู่ล่างสุด ไม่บังเนื้อหาและไม่บล็อกการแตะ */}
        <View pointerEvents="none" style={styles.backdropLayer}>
          <PolarBearBackdrop />
        </View>
        {/* เนื้อหาของแต่ละหน้า ต้องอยู่เหนือพื้นหลังเสมอ ไม่งั้นตัวหนังสือจะถูกบัง */}
        <View style={styles.contentLayer}>
          <Stack initialRouteName="login" screenOptions={{ headerShown: false, animation: 'fade' }} />
        </View>
        {/* เกล็ดหิมะเป็นฉากหลังเสมอ จึงไม่ทับ header, ข้อความ หรือปุ่ม */}
        <View pointerEvents="none" style={styles.snowLayer}>
          <PolarBearBackdrop decorationsOnly showBears={false} />
        </View>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdropLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  contentLayer: {
    flex: 1,
    zIndex: 1,
  },
  snowLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
    opacity: 0.32,
  },
});
