// import AuthGate from '@/components/AuthGate';
import SplashAnimation from '@/components/SplashAnimation';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
	Quicksand_300Light,
	Quicksand_400Regular,
	Quicksand_500Medium,
	Quicksand_600SemiBold,
	Quicksand_700Bold,
	useFonts
} from '@expo-google-fonts/quicksand';
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AuthProvider } from '../context/AuthContext';

// Keep the splash screen visible while we load resources
SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
	anchor: '(tabs)'
};

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [animationDone, setAnimationDone] = useState(false);

	const [fontsLoaded] = useFonts({
		Quicksand_300Light,
		Quicksand_400Regular,
		Quicksand_500Medium,
		Quicksand_600SemiBold,
		Quicksand_700Bold
	});

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		// Keep native splash visible until fonts load
		return null;
	}

	return (
		<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
			<StatusBar style='light' animated />
			<GestureHandlerRootView style={{ flex: 1 }}>
				<AuthProvider>
					<OnboardingProvider>
						<Stack screenOptions={{ headerShown: false }}>
							<Stack.Screen name='login' options={{ headerShown: false }} />
							<Stack.Screen
								name='onboarding'
								options={{ headerShown: false }}
							/>
							<Stack.Screen name='(tabs)' options={{ headerShown: false }} />
							<Stack.Screen name='workout' options={{ headerShown: false }} />
							<Stack.Screen name='profile' options={{ headerShown: false }} />
							<Stack.Screen
								name='program-builder'
								options={{ headerShown: false, gestureEnabled: false }}
							/>
						</Stack>
					</OnboardingProvider>
				</AuthProvider>

				{!animationDone && (
					<View style={StyleSheet.absoluteFill}>
						<SplashAnimation onComplete={() => setAnimationDone(true)} />
					</View>
				)}
			</GestureHandlerRootView>
		</ThemeProvider>
	);
}
