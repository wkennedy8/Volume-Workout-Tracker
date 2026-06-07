import { getProfile } from '@/controllers/profileController';
import { initNotificationsForUser } from '@/utils/notificationService';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { isAdmin, subscribeToAuth } from '../lib/auth';

const AuthContext = createContext({
	user: null,
	loading: true,
	error: null,
	isAdmin: false
});

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [userIsAdmin, setUserIsAdmin] = useState(false);
	const [onboardingCompleted, setOnboardingCompleted] = useState(false);

	const router = useRouter();
	const segments = useSegments();

	// Subscribe to auth state changes
	useEffect(() => {
		const unsubscribe = subscribeToAuth(async (firebaseUser) => {
			if (firebaseUser) {
				// Check if user is admin
				const adminStatus = await isAdmin(firebaseUser.uid);

				// Check if onboarding is completed
				const profile = await getProfile(firebaseUser.uid);
				const hasCompletedOnboarding = profile?.onboardingCompleted || false;

				setUser({
					uid: firebaseUser.uid,
					email: firebaseUser.email,
					phoneNumber: firebaseUser.phoneNumber,
					displayName: firebaseUser.displayName,
					photoURL: firebaseUser.photoURL,
					emailVerified: firebaseUser.emailVerified,
					isAnonymous: firebaseUser.isAnonymous
				});
				setUserIsAdmin(adminStatus);
				setOnboardingCompleted(hasCompletedOnboarding);
				initNotificationsForUser(firebaseUser.uid);
			} else {
				setUser(null);
				setUserIsAdmin(false);
				setOnboardingCompleted(false);
			}

			setLoading(false);
			setError(null);
		});

		return () => unsubscribe();
	}, []);

	// Handle navigation based on auth state
	useEffect(() => {
		if (loading) return;

		const inAuthGroup = segments[0] === 'login';
		const inOnboarding = segments[0] === 'onboarding';

		if (!user && !inAuthGroup) {
			// No user, redirect to login
			router.replace('/login');
			return;
		}

		if (!user) return; // Exit early if no user

		// Handle authenticated users
		if (inAuthGroup) {
			// User is authenticated but on login screen - redirect to appropriate place
			if (onboardingCompleted || userIsAdmin) {
				router.replace('/(tabs)');
			} else {
				router.replace('/onboarding');
			}
		} else if (inOnboarding && (onboardingCompleted || userIsAdmin)) {
			// User completed onboarding but still on onboarding screens
			router.replace('/(tabs)');
		}
		// If user is in app screens, don't redirect anywhere
	}, [user, loading, onboardingCompleted, userIsAdmin, segments]);

	const value = {
		user,
		loading,
		error,
		isAdmin: userIsAdmin
	};

	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: '#000000'
				}}
			>
				<ActivityIndicator size='large' color='#AFFF2B' />
				<Text
					style={{
						marginTop: 10,
						fontSize: 14,
						fontWeight: '700',
						color: '#999999'
					}}
				>
					Loading...
				</Text>
			</View>
		);
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
