import { getProfile, upsertProfile } from '@/controllers/profileController';
import { getUserWorkoutPlan } from '@/controllers/plansController';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: true,
		shouldSetBadge: false
	})
});

const DAY_TO_WEEKDAY = {
	Sunday: 1,
	Monday: 2,
	Tuesday: 3,
	Wednesday: 4,
	Thursday: 5,
	Friday: 6,
	Saturday: 7
};

// 10:00 AM local time
const REMINDER_HOUR = 10;
const REMINDER_MINUTE = 0;

function notificationIdForDay(day) {
	return `workout-reminder-${day.toLowerCase()}`;
}

function notificationIdForToday() {
	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	return notificationIdForDay(days[new Date().getDay()]);
}

export async function requestNotificationPermissions() {
	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('workout-reminders', {
			name: 'Workout Reminders',
			importance: Notifications.AndroidImportance.HIGH,
			sound: true
		});
	}

	const { status: existing } = await Notifications.getPermissionsAsync();
	if (existing === 'granted') return true;

	const { status } = await Notifications.requestPermissionsAsync();
	return status === 'granted';
}

export async function registerPushToken(uid) {
	try {
		const projectId =
			Constants.expoConfig?.extra?.eas?.projectId ??
			Constants.easConfig?.projectId;

		if (!projectId) {
			console.warn('No EAS projectId found — push token skipped');
			return;
		}

		const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
		await upsertProfile(uid, { expoPushToken: token });
	} catch (e) {
		console.warn('Failed to register push token:', e);
	}
}

export async function scheduleWorkoutReminders(uid) {
	try {
		const plan = await getUserWorkoutPlan(uid);
		if (!plan?.workouts) return;

		// Cancel all existing workout reminders first
		await cancelAllWorkoutReminders();

		// Build a map of day -> workout label
		const dayToWorkout = {};
		for (const workout of Object.values(plan.workouts)) {
			const label = workout.label ?? workout.title ?? workout.id ?? 'Workout';
			for (const day of workout.days ?? []) {
				dayToWorkout[day] = label;
			}
		}

		for (const [day, label] of Object.entries(dayToWorkout)) {
			const weekday = DAY_TO_WEEKDAY[day];
			if (!weekday) continue;

			await Notifications.scheduleNotificationAsync({
				identifier: notificationIdForDay(day),
				content: {
					title: "Time to train 💪",
					body: `${label} day — don't skip it!`,
					sound: true
				},
				trigger: {
					type: 'weekly',
					weekday,
					hour: REMINDER_HOUR,
					minute: REMINDER_MINUTE,
					repeats: true
				}
			});
		}
	} catch (e) {
		console.warn('Failed to schedule workout reminders:', e);
	}
}

export async function cancelAllWorkoutReminders() {
	const scheduled = await Notifications.getAllScheduledNotificationsAsync();
	for (const n of scheduled) {
		if (n.identifier.startsWith('workout-reminder-')) {
			await Notifications.cancelScheduledNotificationAsync(n.identifier);
		}
	}
}

// Call this after the user logs a workout so they don't get reminded today
export async function cancelTodaysWorkoutReminder() {
	try {
		await Notifications.cancelScheduledNotificationAsync(notificationIdForToday());
	} catch (e) {
		// Ignore — the notification may not exist if today isn't a workout day
	}
}

export async function initNotificationsForUser(uid) {
	// Request permission first — before any Firestore calls that could throw
	const granted = await requestNotificationPermissions();
	if (!granted) return;

	try {
		const profile = await getProfile(uid);
		const workoutRemindersEnabled = profile?.notifications?.workoutReminders ?? true;

		if (workoutRemindersEnabled) {
			await registerPushToken(uid);
			await scheduleWorkoutReminders(uid);
		}
	} catch (e) {
		console.warn('Failed to init notifications:', e);
	}
}
