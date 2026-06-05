import { useAuth } from '@/context/AuthContext';
import { getProfile, getUserSettings } from '@/controllers/profileController';
import { auth, db } from '@/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { deleteUser, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

export default function ProfileScreen() {
	const router = useRouter();
	const { user, isAdmin } = useAuth();

	const [loading, setLoading] = useState(true);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [profilePhoto, setProfilePhoto] = useState(null);

	useEffect(() => {
		if (!user?.uid) return;

		let isMounted = true;

		(async () => {
			try {
				// Load profile data
				const [profile, settings] = await Promise.all([
					getProfile(user.uid),
					getUserSettings(user.uid)
				]);

				if (!isMounted) return;

				setName(settings.name || '');
				setEmail(settings.email || '');
				setProfilePhoto(profile?.profilePhotoUri || null);
			} catch (error) {
				console.error('Failed to load profile:', error);
			} finally {
				if (isMounted) setLoading(false);
			}
		})();

		return () => {
			isMounted = false;
		};
	}, [user?.uid]);

	async function handleLogout() {
		Alert.alert('Log Out', 'Are you sure you want to log out?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Log Out',
				style: 'destructive',
				onPress: async () => {
					try {
						await signOut(auth);
					} catch (error) {
						console.error('Logout error:', error);
						Alert.alert('Error', 'Failed to log out');
					}
				}
			}
		]);
	}

	async function deleteAllUserData(uid) {
		const subcollections = [
			'sessions',
			'weights',
			'progressPhotos',
			'preferences',
			'settings'
		];

		for (const subcollection of subcollections) {
			const collectionRef = collection(db, 'users', uid, subcollection);
			const snapshot = await getDocs(collectionRef);

			for (const docSnap of snapshot.docs) {
				await deleteDoc(docSnap.ref);
			}
		}

		// Delete profile document
		const profileRef = collection(db, 'users', uid, 'profile');
		const profileSnapshot = await getDocs(profileRef);
		for (const docSnap of profileSnapshot.docs) {
			await deleteDoc(docSnap.ref);
		}

		// Delete main user document
		await deleteDoc(doc(db, 'users', uid));
	}

	async function handleDeleteAccount() {
		Alert.alert(
			'Delete Account',
			'This will permanently delete all your data. This action cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => {
						Alert.alert(
							'Are you absolutely sure?',
							'All your workouts, progress, and data will be lost forever.',
							[
								{ text: 'Cancel', style: 'cancel' },
								{
									text: 'Delete Everything',
									style: 'destructive',
									onPress: async () => {
										try {
											const currentUser = auth.currentUser;
											if (!currentUser) return;

											// Delete all Firestore data
											await deleteAllUserData(currentUser.uid);

											// Delete auth user
											await deleteUser(currentUser);

											Alert.alert(
												'Account Deleted',
												'Your account has been deleted.'
											);
										} catch (error) {
											console.error('Delete account error:', error);
											if (error.code === 'auth/requires-recent-login') {
												Alert.alert(
													'Re-authentication Required',
													'Please log out and log back in, then try again.'
												);
											} else {
												Alert.alert('Error', 'Failed to delete account');
											}
										}
									}
								}
							]
						);
					}
				}
			]
		);
	}

	if (loading) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loadingWrap}>
					<ActivityIndicator size='large' color='#AFFF2B' />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				{/* <View style={styles.header}>
					<Text style={styles.title}>Account</Text>
				</View> */}

				{/* Profile Card */}
				<TouchableOpacity
					style={styles.profileCard}
					onPress={() => router.push('/profile/edit')}
					activeOpacity={0.7}
				>
					<View style={styles.profileLeft}>
						{profilePhoto ? (
							<Image source={{ uri: profilePhoto }} style={styles.avatar} />
						) : (
							<View style={styles.avatarPlaceholder}>
								<Ionicons name='person' size={32} color='#666666' />
							</View>
						)}
						<View style={styles.profileInfo}>
							<Text style={styles.profileName}>{name || 'Add Name'}</Text>
							<Text style={styles.profileEmail}>{email || 'Add Email'}</Text>
						</View>
					</View>
					<Ionicons name='chevron-forward' size={20} color='#666666' />
				</TouchableOpacity>

				{/* Settings Section */}
				<View style={styles.section}>
					<MenuItem
						icon='notifications-outline'
						label='Notifications'
						onPress={() => router.push('/profile/notifications')}
					/>
					<MenuItem
						icon='fitness-outline'
						label='Health Details'
						onPress={() => router.push('/profile/health')}
					/>
					<MenuItem
						icon='flag-outline'
						label='Change Goals'
						onPress={() => router.push('/profile/goals')}
					/>
					<MenuItem
						icon='scale-outline'
						label='Units of Measure'
						onPress={() => router.push('/profile/units')}
					/>
					<MenuItem
						icon='shield-checkmark-outline'
						label='Privacy'
						onPress={() => router.push('/profile/privacy')}
					/>
				</View>

				{/* Workout Section */}
				<View style={styles.section}>
					{/* <Text style={styles.sectionTitle}>Workout</Text> */}
					<MenuItem
						icon='list-outline'
						label='My Programs'
						onPress={() => router.push('/profile/programs')}
					/>
				</View>

				{/* Account Actions */}
				<View style={styles.accountActions}>
					<TouchableOpacity
						style={styles.logoutButton}
						onPress={handleLogout}
						activeOpacity={0.9}
					>
						<Ionicons name='log-out-outline' size={20} color='#FFFFFF' />
						<Text style={styles.logoutButtonText}>Log Out</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.deleteButton}
						onPress={handleDeleteAccount}
						activeOpacity={0.9}
					>
						<Ionicons name='trash-outline' size={20} color='#FF453A' />
						<Text style={styles.deleteButtonText}>Delete Account</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function MenuItem({ icon, label, onPress, showChevron = true }) {
	return (
		<TouchableOpacity
			style={styles.menuItem}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<View style={styles.menuLeft}>
				<Ionicons name={icon} size={22} color='#AFFF2B' />
				<Text style={styles.menuLabel}>{label}</Text>
			</View>
			{showChevron && (
				<Ionicons name='chevron-forward' size={20} color='#666666' />
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 18,
		paddingTop: 70,
		paddingBottom: 40
	},

	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},

	header: {
		marginBottom: 24
	},
	title: {
		fontSize: 32,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		textAlign: 'center'
	},

	profileCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		padding: 16,
		marginBottom: 24,
		borderWidth: 1,
		borderColor: '#333333'
	},
	profileLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	avatar: {
		width: 60,
		height: 60,
		borderRadius: 30
	},
	avatarPlaceholder: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	profileInfo: {
		flex: 1
	},
	profileName: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 4
	},
	profileEmail: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999'
	},

	section: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		marginBottom: 16,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#333333'
	},
	sectionTitle: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#AFFF2B',
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 8
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#2A2A2A'
	},
	menuLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	menuLabel: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF'
	},

	accountActions: {
		gap: 12,
		marginTop: 8
	},
	logoutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		height: 54,
		borderRadius: 14,
		backgroundColor: '#2A2A2A',
		borderWidth: 1,
		borderColor: '#333333'
	},
	logoutButtonText: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		height: 54,
		borderRadius: 14,
		backgroundColor: '#3D1515',
		borderWidth: 1,
		borderColor: '#5A2020'
	},
	deleteButtonText: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FF453A'
	}
});
