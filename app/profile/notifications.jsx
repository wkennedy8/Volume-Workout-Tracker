import { useAuth } from '@/context/AuthContext';
import { getProfile, upsertProfile } from '@/controllers/profileController';
import {
	cancelAllWorkoutReminders,
	scheduleWorkoutReminders
} from '@/utils/notificationService';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

export default function NotificationsScreen() {
	const router = useRouter();
	const { user } = useAuth();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [workoutReminders, setWorkoutReminders] = useState(true);
	const [progressUpdates, setProgressUpdates] = useState(true);
	const [achievements, setAchievements] = useState(true);
	const [weeklyReports, setWeeklyReports] = useState(false);

	useEffect(() => {
		if (!user?.uid) return;

		(async () => {
			try {
				const profile = await getProfile(user.uid);
				const notifications = profile?.notifications || {};

				setWorkoutReminders(notifications.workoutReminders ?? true);
				setProgressUpdates(notifications.progressUpdates ?? true);
				setAchievements(notifications.achievements ?? true);
				setWeeklyReports(notifications.weeklyReports ?? false);
			} catch (error) {
				console.error('Failed to load notifications:', error);
			} finally {
				setLoading(false);
			}
		})();
	}, [user?.uid]);

	async function handleSave() {
		if (!user?.uid) return;

		setSaving(true);
		try {
			await upsertProfile(user.uid, {
				notifications: {
					workoutReminders,
					progressUpdates,
					achievements,
					weeklyReports
				}
			});

			if (workoutReminders) {
				await scheduleWorkoutReminders(user.uid);
			} else {
				await cancelAllWorkoutReminders();
			}

			Alert.alert('Success', 'Notification preferences updated');
			router.back();
		} catch (error) {
			console.error('Failed to save notifications:', error);
			Alert.alert('Error', 'Failed to update preferences');
		} finally {
			setSaving(false);
		}
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
			<View style={styles.container}>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.title}>Notifications</Text>
						<Text style={styles.subtitle}>
							Choose what updates you want to receive
						</Text>
					</View>

					{/* Notification Options */}
					<View style={styles.section}>
						<NotificationItem
							label='Workout Reminders'
							description="Get notified when it's time to work out"
							value={workoutReminders}
							onValueChange={setWorkoutReminders}
						/>
						<NotificationItem
							label='Progress Updates'
							description='Track milestones and achievements'
							value={progressUpdates}
							onValueChange={setProgressUpdates}
						/>
						<NotificationItem
							label='Achievements'
							description='Celebrate when you hit new records'
							value={achievements}
							onValueChange={setAchievements}
						/>
						<NotificationItem
							label='Weekly Reports'
							description='Get a summary of your week'
							value={weeklyReports}
							onValueChange={setWeeklyReports}
							isLast
						/>
					</View>
				</ScrollView>

				{/* Save Button */}
				<View style={styles.bottomButton}>
					<TouchableOpacity
						style={styles.saveButton}
						onPress={handleSave}
						disabled={saving}
						activeOpacity={0.9}
					>
						{saving ? (
							<ActivityIndicator color='#000000' />
						) : (
							<Text style={styles.saveButtonText}>Save Changes</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

function NotificationItem({
	label,
	description,
	value,
	onValueChange,
	isLast
}) {
	return (
		<View
			style={[styles.notificationItem, isLast && styles.notificationItemLast]}
		>
			<View style={styles.notificationContent}>
				<Text style={styles.notificationLabel}>{label}</Text>
				<Text style={styles.notificationDescription}>{description}</Text>
			</View>
			<Switch
				value={value}
				onValueChange={onValueChange}
				trackColor={{ false: '#333333', true: '#AFFF2B' }}
				thumbColor='#FFFFFF'
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	container: { flex: 1 },
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 70,
		paddingBottom: 100
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
		fontSize: 28,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 8
	},
	subtitle: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999'
	},

	section: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#333333'
	},
	notificationItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#2A2A2A'
	},
	notificationItemLast: {
		borderBottomWidth: 0
	},
	notificationContent: {
		flex: 1,
		marginRight: 12
	},
	notificationLabel: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
		marginBottom: 4
	},
	notificationDescription: {
		fontSize: 13,
		fontWeight: '700',
		color: '#999999',
		lineHeight: 18
	},

	bottomButton: {
		paddingHorizontal: 24,
		paddingBottom: 24,
		paddingTop: 12
	},
	saveButton: {
		height: 54,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	saveButtonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
