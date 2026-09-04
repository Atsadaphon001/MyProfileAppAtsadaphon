import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { PolarBearBackdrop } from '@/components/polar-bear-backdrop';
import { PolarBearMark } from '@/components/polar-bear-mark';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <PolarBearBackdrop />
      <Stack initialRouteName="login" screenOptions={{ headerShown: false, animation: 'fade' }} />
      <View pointerEvents="none" style={styles.themeMark}>
        <PolarBearMark />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  themeMark: {
    position: 'absolute',
    bottom: 76,
    right: 12,
    zIndex: 20,
  },
});