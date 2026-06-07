import SettingsBottomSheet from '@/components/SettingsBottomSheet';
import WeeklyStreakCard from '@/components/WeeklyStreakCard';
import { useProfile } from '@/hooks/useProfile';
import { useUnits } from '@/hooks/useUnits';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { displayWeight, toStoredLbs, weightUnitLabel } from '@/utils/unitsUtils';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	FlatList,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts'; // Import font utilities
import { formatDisplayDate } from '../../utils/dateUtils';
import {
	isValidWeightNumber,
	normalizeWeightInput,
	toFixed1
} from '../../utils/numberUtils';
import { getTimeBasedGreeting } from '../../utils/weightUtils';

function getFirstEntry(entries) {
	if (!Array.isArray(entries) || entries.length === 0) return null;
	return entries[entries.length - 1]; // Last item = oldest (sorted newest-first)
}

function getLatestEntry(entries) {
	if (!Array.isArray(entries) || entries.length === 0) return null;
	return entries[0]; // First item = newest
}


export default function HomeScreen() {
	const router = useRouter();
	const [settingsVisible, setSettingsVisible] = useState(false);
	const [weightText, setWeightText] = useState('');

	// Hooks
	const { entries, todayKey, getEntryForDate, upsertEntry } =
		useWeightEntries();
	const { profile } = useProfile();
	const greeting = useMemo(
		() => getTimeBasedGreeting(profile.name),
		[profile.name]
	);
	const goal = profile.goal; // 'lose' | 'maintain' | 'gain' | null
	const targetWeight = profile.targetWeight;
	const { weightUnit } = useUnits();

	// Prefill today's weight once entries load/update
	useEffect(() => {
		const today = getEntryForDate(todayKey);
		if (today) setWeightText(String(displayWeight(today.weight, weightUnit)));
	}, [todayKey, getEntryForDate]);

	// Save today's weight
	async function onSave() {
		const trimmed = String(weightText || '').trim();
		if (!isValidWeightNumber(trimmed)) {
			Alert.alert('Invalid weight', 'Enter a valid weight (e.g., 198.6).');
			return;
		}

		const weightInLbs = toStoredLbs(trimmed, weightUnit);

		try {
			await upsertEntry({ dateKey: todayKey, weight: weightInLbs });

			const hitGoal =
				targetWeight != null &&
				((goal === 'lose' && weightInLbs <= targetWeight) ||
					(goal === 'gain' && weightInLbs >= targetWeight));

			if (hitGoal) {
				const displayTarget = displayWeight(targetWeight, weightUnit);
				Alert.alert(
					'Goal Reached! 🎉',
					`You hit your target weight of ${displayTarget} ${weightUnitLabel(weightUnit)}. Time to set a new goal!`,
					[{ text: 'Let\'s go!', style: 'default' }]
				);
			} else {
				Alert.alert('Saved', "Today's weight has been saved.");
			}
		} catch (e) {
			Alert.alert('Error', 'Could not save your weight. Please try again.');
		}
	}

	// Calculate total weight change from first to latest entry
	const weightDelta = useMemo(() => {
		const first = getFirstEntry(entries);
		const latest = getLatestEntry(entries);

		if (!first || !latest) {
			return { hasData: false, delta: 0, status: 'neutral' };
		}

		const rawDelta = Number(latest.weight) - Number(first.weight);
		const delta = Math.round(rawDelta * 10) / 10;

		let status = 'neutral';

		// Determine status based on goal
		if (goal === 'lose') {
			// Losing weight: negative delta is good (green), positive is bad (red)
			if (delta < 0) status = 'good';
			else if (delta > 0) status = 'bad';
		} else if (goal === 'gain') {
			// Gaining weight: positive delta is good (green), negative is bad (red)
			if (delta > 0) status = 'good';
			else if (delta < 0) status = 'bad';
		} else if (goal === 'maintain') {
			// Maintaining: any change is neutral/yellow
			status = 'neutral';
		} else {
			// No goal set: use neutral for any change
			status = 'neutral';
		}

		return { hasData: true, delta, status, first, latest };
	}, [entries, goal]);

	const recentEntries = useMemo(() => entries.slice(0, 7), [entries]);

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={{ flex: 1 }}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					{/* Header */}
					<View style={styles.headerRow}>
						<View style={styles.headerLeft}>
							{/* <View style={styles.iconBadge}>
								<Text style={styles.iconText}>⚖️</Text>
							</View> */}
							<Text style={styles.title}>{greeting}</Text>
						</View>

						<TouchableOpacity
							onPress={() => router.push('/profile')}
							hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
							style={styles.profileButton}
						>
							{profile.profilePhotoUri ? (
								<Image
									source={{ uri: profile.profilePhotoUri }}
									style={styles.profileImage}
								/>
							) : (
								<View style={styles.profilePlaceholder}>
									<Text style={styles.profilePlaceholderText}>👤</Text>
								</View>
							)}
						</TouchableOpacity>
					</View>

					{/* Weekly Streak Card */}
					<WeeklyStreakCard />

					{/* Today's Weight */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Today's Weight</Text>

						<View style={styles.inputRow}>
							<TextInput
								value={weightText}
								onChangeText={(t) => setWeightText(normalizeWeightInput(t))}
								placeholder='Enter your weight…'
								placeholderTextColor='#8A94A6'
								keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
								style={styles.input}
								maxLength={6}
								returnKeyType='done'
							/>
							<View style={styles.lbsPill}>
								<Text style={styles.lbsText}>{weightUnitLabel(weightUnit)}</Text>
							</View>
						</View>

						<TouchableOpacity
							style={styles.saveButton}
							onPress={onSave}
							activeOpacity={0.85}
						>
							<Text style={styles.saveButtonText}>Save</Text>
						</TouchableOpacity>
					</View>

					{/* Total Weight Change Card */}
					<View style={styles.trackerCard}>
						<Text style={styles.trackerTitle}>Total Weight Change</Text>

						{!weightDelta.hasData ? (
							<Text style={styles.trackerSubtle}>
								Add at least two entries to see your progress.
							</Text>
						) : (
							<>
								<Text
									style={[
										styles.trackerValue,
										weightDelta.status === 'good' && styles.trackerValueGreen,
										weightDelta.status === 'bad' && styles.trackerValueRed,
										weightDelta.status === 'neutral' &&
											styles.trackerValueYellow
									]}
								>
									{weightDelta.delta > 0 && '+'}
									{weightDelta.delta < 0 && '-'}
									{toFixed1(Math.abs(displayWeight(weightDelta.delta, weightUnit)))} {weightUnitLabel(weightUnit)}
								</Text>

								<Text style={styles.trackerSubtle}>
									From {formatDisplayDate(weightDelta.first.date)} (
									{toFixed1(displayWeight(weightDelta.first.weight, weightUnit))} {weightUnitLabel(weightUnit)}) to{' '}
									{formatDisplayDate(weightDelta.latest.date)} (
									{toFixed1(displayWeight(weightDelta.latest.weight, weightUnit))} {weightUnitLabel(weightUnit)})
								</Text>
							</>
						)}
					</View>

					<View style={styles.divider} />

					{/* Weight History */}
					<View style={styles.section}>
						<View style={styles.historyHeaderRow}>
							<Text style={styles.sectionTitle}>Weight History</Text>
							<Text style={styles.subtle}>
								{entries.length
									? `${entries.length} entries`
									: 'No entries yet'}
							</Text>
						</View>

						<View style={styles.card}>
							<FlatList
								data={recentEntries}
								keyExtractor={(item) => item.date}
								ItemSeparatorComponent={() => (
									<View style={styles.rowDivider} />
								)}
								scrollEnabled={false}
								renderItem={({ item }) => (
									<View style={styles.historyRow}>
										<Text style={styles.historyDate}>
											{formatDisplayDate(item.date)}
										</Text>
										<Text style={styles.historyWeight}>
											{toFixed1(displayWeight(item.weight, weightUnit))} {weightUnitLabel(weightUnit)}
										</Text>
									</View>
								)}
								ListEmptyComponent={
									<View style={styles.emptyState}>
										<Text style={styles.emptyTitle}>No history yet</Text>
										<Text style={styles.emptyBody}>
											Add today's weight to start tracking your progress.
										</Text>
									</View>
								}
							/>
						</View>

						<TouchableOpacity
							style={styles.viewMoreButton}
							onPress={() =>
								Alert.alert('History', 'Full history screen not wired yet.')
							}
							activeOpacity={0.85}
						>
							<Text style={styles.viewMoreText}>View More</Text>
							<Text style={styles.viewMoreChevron}>›</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
			<SettingsBottomSheet
				visible={settingsVisible}
				onClose={() => setSettingsVisible(false)}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000', paddingBottom: 90 },
	container: { flex: 1 },

	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 18,
		paddingTop: 10,
		paddingBottom: 20
	},

	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 14
	},
	headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	iconBadge: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	iconText: { fontSize: 18 },
	title: {
		fontSize: 26,
		fontFamily: FontFamily.extraBold,
		color: '#FFFFFF'
	},

	profileButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		overflow: 'hidden',
		borderWidth: 2,
		borderColor: '#333333',
		backgroundColor: '#1A1A1A'
	},
	profileImage: {
		width: '100%',
		height: '100%'
	},
	profilePlaceholder: {
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#1A1A1A'
	},
	profilePlaceholderText: {
		fontSize: 20
	},

	section: { marginTop: 6 },
	sectionTitle: {
		fontSize: 18,
		fontFamily: FontFamily.extraBold,
		color: '#fff',
		marginBottom: 10
	},

	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 14,
		paddingHorizontal: 14,
		height: 54,
		backgroundColor: '#1A1A1A'
	},
	input: {
		flex: 1,
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	lbsPill: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: '#2A2A2A'
	},
	lbsText: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#999999'
	},

	saveButton: {
		marginTop: 12,
		height: 52,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#AFFF2B',
		shadowOpacity: 0.3,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 5
	},
	saveButtonText: {
		color: '#000000',
		fontSize: 18,
		fontFamily: FontFamily.extraBold
	},

	trackerCard: {
		marginTop: 14,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 14
	},
	trackerTitle: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#fff',
		marginBottom: 8
	},
	trackerValue: {
		fontSize: 28,
		fontFamily: FontFamily.black,
		marginBottom: 8
	},
	trackerValueGreen: { color: '#AFFF2B' },
	trackerValueRed: { color: '#FF453A' },
	trackerValueYellow: { color: '#FFD60A' },
	trackerSubtle: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#999999',
		lineHeight: 18
	},

	subtle: {
		fontSize: 12,
		color: '#999999',
		fontFamily: FontFamily.semiBold,
		marginTop: 20
	},

	card: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		overflow: 'hidden'
	},
	historyRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 14,
		paddingVertical: 14
	},
	historyDate: {
		fontSize: 16,
		color: '#FFFFFF',
		fontFamily: FontFamily.black
	},
	historyWeight: {
		fontSize: 18,
		color: '#AFFF2B',
		fontFamily: FontFamily.extraBold
	},

	emptyState: { paddingHorizontal: 14, paddingVertical: 18 },
	emptyTitle: {
		fontSize: 16,
		fontFamily: FontFamily.extraBold,
		color: '#FFFFFF',
		marginBottom: 4
	},
	emptyBody: {
		fontSize: 13,
		color: '#999999',
		fontFamily: FontFamily.semiBold,
		lineHeight: 18
	},

	divider: { height: 1, backgroundColor: '#333333', marginVertical: 18 },

	historyHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10
	},

	rowDivider: { height: 1, backgroundColor: '#333333' },

	viewMoreButton: {
		marginTop: 12,
		alignSelf: 'center',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		borderRadius: 999,
		backgroundColor: '#2A2A2A',
		paddingHorizontal: 16,
		paddingVertical: 10
	},
	viewMoreText: {
		fontSize: 14,
		fontFamily: FontFamily.extraBold,
		color: '#AFFF2B'
	},
	viewMoreChevron: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#AFFF2B',
		marginTop: -1
	}
});
