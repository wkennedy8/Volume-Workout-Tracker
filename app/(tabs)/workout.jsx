import CardioModal from '@/components/CardioModal';
import { useAuth } from '@/context/AuthContext';
import {
	getCardioForDate,
	logCardioSession
} from '@/controllers/cardioController';
import { getActiveProgram, getIncompleteProgram } from '@/controllers/programController';
import {
	computeSessionStats,
	shareCompletedSession
} from '@/controllers/sessionController';
import { useTodayWorkoutSession } from '@/hooks/useTodayWorkoutSession';
import { formatLongDate } from '@/utils/dateUtils';
import { getTodayWorkoutFromProgram } from '@/utils/programSchedule';
import { formatLocalDateKey } from '@/utils/weightUtils';
import { tagColor } from '@/utils/workoutUtils';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

function getStartButtonLabel({
	isRestDay,
	completedSession,
	inProgressSession
}) {
	if (isRestDay) return 'Rest Day';
	if (completedSession) return 'Edit Workout';
	if (inProgressSession) return 'Resume Workout';
	return 'Start Workout';
}

function getStartNavigationParams({
	workout,
	programId,
	isRestDay,
	completedSession,
	inProgressSession
}) {
	if (isRestDay) return null;

	const base = { templateId: workout.id, programId: programId ?? '' };

	if (completedSession) {
		return {
			pathname: '/workout/session',
			params: { ...base, mode: 'edit', sessionId: completedSession.id }
		};
	}

	if (inProgressSession) {
		return {
			pathname: '/workout/session',
			params: { ...base, mode: 'resume', sessionId: inProgressSession.id }
		};
	}

	return {
		pathname: '/workout/session',
		params: { ...base, mode: 'start' }
	};
}

const REST_DAY = { id: 'rest', title: 'Rest Day', tag: 'Rest', exercises: [] };

export default function WorkoutTab() {
	const router = useRouter();
	const { user } = useAuth();

	const [loadingPlan, setLoadingPlan] = useState(true);
	const [workout, setWorkout] = useState(null);
	const [activeProgram, setActiveProgram] = useState(null);
	const [incompleteProgram, setIncompleteProgram] = useState(undefined); // undefined = not checked yet

	const currentWeek = activeProgram?.currentWeek ?? 1;
	const cycleLength = activeProgram?.cycleLength ?? 8;

	const [cardioModalVisible, setCardioModalVisible] = useState(false);
	const [cardioSession, setCardioSession] = useState(null);

	const today = useMemo(() => new Date(), []);
	const todayKey = useMemo(() => formatLocalDateKey(today), [today]);

	async function loadProgramData() {
		if (!user?.uid) return;
		try {
			setLoadingPlan(true);
			const [incomplete, active] = await Promise.all([
				getIncompleteProgram(user.uid),
				getActiveProgram(user.uid)
			]);
			setIncompleteProgram(incomplete ?? null);
			setActiveProgram(active ?? null);
			setWorkout(active ? (getTodayWorkoutFromProgram(active, today) ?? REST_DAY) : REST_DAY);

			const cardio = await getCardioForDate(user.uid, todayKey);
			setCardioSession(cardio);
		} catch (error) {
			console.error('Failed to load program data:', error);
			setWorkout(REST_DAY);
		} finally {
			setLoadingPlan(false);
		}
	}

	useEffect(() => {
		loadProgramData();
	}, [user?.uid, todayKey]);

	useFocusEffect(
		useCallback(() => {
			if (!user?.uid) return;
			loadProgramData();
		}, [user?.uid, todayKey])
	);

	const isRestDay = workout?.id === 'rest';

	const { completedSession, inProgressSession, refresh } =
		useTodayWorkoutSession({
			templateId: workout?.id || 'rest',
			dateKey: todayKey
		});

	useFocusEffect(
		useCallback(() => {
			refresh();
		}, [refresh])
	);

	const stats = useMemo(() => {
		if (!completedSession) return null;
		return computeSessionStats(completedSession);
	}, [completedSession]);

	const onPressShare = useCallback(() => {
		if (!completedSession) return;
		shareCompletedSession(completedSession);
	}, [completedSession]);

	const startButtonLabel = useMemo(() => {
		return getStartButtonLabel({
			isRestDay,
			completedSession,
			inProgressSession
		});
	}, [isRestDay, completedSession, inProgressSession]);

	const onStartWorkout = useCallback(() => {
		if (isRestDay) {
			Alert.alert('Rest Day', 'No workout scheduled today.');
			return;
		}

		const nav = getStartNavigationParams({
			workout,
			programId: activeProgram?.id ?? null,
			isRestDay,
			completedSession,
			inProgressSession
		});

		if (nav) router.push(nav);
	}, [router, workout, activeProgram, isRestDay, completedSession, inProgressSession]);

	const onPressExercise = useCallback((item) => {
		Alert.alert(
			item.name,
			`${item.sets} sets • ${item.reps}${item.note ? `\n\nNote: ${item.note}` : ''}`
		);
	}, []);

	// const renderExerciseItem = useCallback(
	// 	({ item }) => (
	// 		<TouchableOpacity
	// 			activeOpacity={0.85}
	// 			onPress={() => onPressExercise(item)}
	// 			style={styles.exerciseRow}
	// 		>
	// 			<View style={styles.exerciseLeft}>
	// 				<View style={styles.exerciseIcon}>
	// 					<Text style={styles.exerciseIconText}>•</Text>
	// 				</View>
	// 				<View>
	// 					<Text style={styles.exerciseName}>{item.name}</Text>
	// 					<Text style={styles.exerciseMeta}>
	// 						{item.sets} sets, {item.reps}{' '}
	// 						{String(item.reps).toLowerCase() === 'time' ? '' : 'reps'}
	// 						{item.note ? ` • ${item.note}` : ''}
	// 					</Text>
	// 				</View>
	// 			</View>
	// 			<Text style={styles.chevron}>›</Text>
	// 		</TouchableOpacity>
	// 	),
	// 	[onPressExercise]
	// );

	async function handleSaveCardio(data) {
		if (!user?.uid) return;

		try {
			await logCardioSession(user.uid, {
				date: todayKey,
				...data
			});

			// Reload cardio session
			const session = await getCardioForDate(user.uid, todayKey);
			setCardioSession(session);

			setCardioModalVisible(false);
			Alert.alert('Success', 'Cardio session logged!');
		} catch (error) {
			console.error('Failed to save cardio:', error);
			Alert.alert('Error', 'Failed to log cardio session');
		}
	}


	// Loading state
	if (loadingPlan || !workout || incompleteProgram === undefined) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loadingWrap}>
					<ActivityIndicator size='large' color='#AFFF2B' />
					<Text style={styles.loadingText}>Loading workout...</Text>
				</View>
			</SafeAreaView>
		);
	}

	// No program at all — prompt to build one
	if (!incompleteProgram && !activeProgram) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.blockerWrap}>
					<Ionicons name='barbell-outline' size={64} color='#333333' style={styles.blockerIcon} />
					<Text style={styles.blockerTitle}>No program yet</Text>
					<Text style={styles.blockerSubtitle}>
						Build a custom program to start tracking your workouts.
					</Text>
					<TouchableOpacity
						style={styles.blockerBtn}
						onPress={() => router.push('/program-builder')}
						activeOpacity={0.85}
					>
						<Text style={styles.blockerBtnText}>Build a Program</Text>
						<Ionicons name='arrow-forward' size={18} color='#000000' />
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	// Incomplete program blocker — user must finish building their program before training
	if (incompleteProgram) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.blockerWrap}>
					<Ionicons name='barbell-outline' size={64} color='#AFFF2B' style={styles.blockerIcon} />
					<Text style={styles.blockerTitle}>Finish your program first</Text>
					<Text style={styles.blockerSubtitle}>
						You have an unfinished program. Complete the setup before you can start training.
					</Text>
					<TouchableOpacity
						style={styles.blockerBtn}
						onPress={() => router.push('/program-builder')}
						activeOpacity={0.85}
					>
						<Text style={styles.blockerBtnText}>Finish Setup</Text>
						<Ionicons name='arrow-forward' size={18} color='#000000' />
					</TouchableOpacity>
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
				<View style={styles.headerRow}>
					<View style={styles.headerLeft}>
						{/* <View style={styles.iconBadge}>
							<Ionicons name='barbell-outline' size={20} color='#AFFF2B' />
						</View> */}
						<View>
							<Text style={styles.title}>{formatLongDate(today)}</Text>
						</View>
					</View>
					{/* Week Badge */}
					{!isRestDay && (
						<View style={styles.weekBadge}>
							<Text style={styles.weekBadgeText}>
								Week {currentWeek} / {cycleLength}
							</Text>
						</View>
					)}
				</View>

				{/* Workout Title */}
				<View style={styles.workoutTitleRow}>
					<View style={styles.workoutTitleLeft}>
						<View
							style={[
								styles.tagPill,
								{ backgroundColor: tagColor(workout.tag) }
							]}
						>
							<Text style={styles.tagText}>{workout.tag}</Text>
						</View>
						<Text style={styles.workoutTitle}>{workout.title}</Text>
					</View>

				</View>

				{/* Optional Cardio Card */}
				<View style={styles.cardioCard}>
					<View style={styles.cardioHeader}>
						<View style={styles.cardioLeft}>
							<View style={styles.cardioIcon}>
								<Ionicons name='bicycle-outline' size={22} color='#AFFF2B' />
							</View>
							<View>
								<Text style={styles.cardioTitle}>Cardio (Optional)</Text>
								<Text style={styles.cardioSubtitle}>
									{cardioSession
										? `${cardioSession.duration} min ${cardioSession.type}`
										: 'Log your cardio session'}
								</Text>
							</View>
						</View>

						{cardioSession ? (
							<View style={styles.cardioCompleted}>
								<Ionicons name='checkmark-circle' size={28} color='#AFFF2B' />
							</View>
						) : (
							<TouchableOpacity
								style={styles.cardioButton}
								onPress={() => setCardioModalVisible(true)}
								activeOpacity={0.9}
							>
								<Text style={styles.cardioButtonText}>Log</Text>
							</TouchableOpacity>
						)}
					</View>

					{cardioSession && cardioSession.distance && (
						<View style={styles.cardioDetails}>
							<Text style={styles.cardioDetailsText}>
								Distance: {cardioSession.distance} miles
							</Text>
						</View>
					)}
				</View>

				{/* Post-workout Summary or Rest Day Summary */}
				{completedSession && stats ? (
					<View style={styles.summaryCard}>
						<View style={styles.summaryHeader}>
							<Text style={styles.summaryTitle}>Workout Summary</Text>
							<Text style={styles.summarySubtitle}>Completed today</Text>
						</View>

						<View style={styles.statsGrid}>
							<View style={styles.statBox}>
								<Text style={styles.statLabel}>Exercises</Text>
								<Text style={styles.statValue}>
									{stats.exercisesCompleted}/{stats.exercisesPlanned}
								</Text>
							</View>

							<View style={styles.statBox}>
								<Text style={styles.statLabel}>Sets</Text>
								<Text style={styles.statValue}>{stats.totalSets}</Text>
							</View>

							<View style={styles.statBox}>
								<Text style={styles.statLabel}>Reps</Text>
								<Text style={styles.statValue}>{stats.totalReps}</Text>
							</View>

							<View style={styles.statBox}>
								<Text style={styles.statLabel}>Volume</Text>
								<Text style={styles.statValue}>
									{Math.round(stats.totalVolume).toLocaleString()}
								</Text>
							</View>
						</View>

						<View style={styles.summaryRow}>
							<Text style={styles.summaryRowLabel}>Duration</Text>
							<Text style={styles.summaryRowValue}>
								{stats.durationSeconds != null
									? `${stats.durationSeconds}s`
									: '—'}
							</Text>
						</View>

						<View style={styles.summaryRow}>
							<Text style={styles.summaryRowLabel}>Best Set</Text>
							<Text style={styles.summaryRowValue}>
								{stats.bestSet
									? `${stats.bestSet.exerciseName}: ${stats.bestSet.weight} × ${stats.bestSet.reps}`
									: '—'}
							</Text>
						</View>

						<View style={styles.summaryActions}>
							<TouchableOpacity
								style={styles.secondaryButton}
								onPress={() =>
									router.push({
										pathname: '/workout/details',
										params: { sessionId: completedSession.id }
									})
								}
								activeOpacity={0.9}
							>
								<Text style={styles.secondaryButtonText}>View Details</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.secondaryButton}
								onPress={onPressShare}
								activeOpacity={0.9}
							>
								<Text style={styles.secondaryButtonText}>Share</Text>
							</TouchableOpacity>
						</View>

						{/* Start/Edit Workout Button */}
						<TouchableOpacity
							style={styles.primaryActionButton}
							onPress={onStartWorkout}
							activeOpacity={0.9}
						>
							<Text style={styles.primaryActionButtonText}>
								{startButtonLabel}
							</Text>
						</TouchableOpacity>
					</View>
				) : null}


				{/* Exercise list */}
				{isRestDay ? (
					<View style={styles.restCard}>
						<Text style={styles.restTitle}>No workout scheduled</Text>
						<Text style={styles.restBody}>
							Recovery day. Consider mobility, stretching, or a light walk.
						</Text>
					</View>
				) : (
					<>
						<View style={styles.listCard}>
							<Text style={styles.exerciseListTitle}>Exercises</Text>
							{workout.exercises.map((item, idx) => (
								<View key={`${item.name}-${idx}`}>
									{idx > 0 && <View style={styles.rowDivider} />}
									<TouchableOpacity
										activeOpacity={0.85}
										onPress={() => onPressExercise(item)}
										style={styles.exerciseRow}
									>
										<View style={styles.exerciseLeft}>
											<View style={styles.exerciseIcon}>
												<Text style={styles.exerciseIconText}>•</Text>
											</View>
											<View>
												<Text style={styles.exerciseName}>{item.name}</Text>
												<Text style={styles.exerciseMeta}>
													{item.sets} sets, {item.reps}{' '}
													{String(item.reps).toLowerCase() === 'time'
														? ''
														: 'reps'}
													{item.note ? ` • ${item.note}` : ''}
												</Text>
											</View>
										</View>
										<Text style={styles.chevron}>›</Text>
									</TouchableOpacity>
								</View>
							))}
						</View>

						{/* Start/Resume Workout Button - Only show if no completed session */}
						{!completedSession && (
							<TouchableOpacity
								style={styles.primaryActionButton}
								onPress={onStartWorkout}
								activeOpacity={0.9}
							>
								<Text style={styles.primaryActionButtonText}>
									{startButtonLabel}
								</Text>
							</TouchableOpacity>
						)}
					</>
				)}

				{/* Bottom spacing for CTA button */}
				<View style={{ height: 80 }} />
			</ScrollView>

			{/* Cardio Modal */}
			<CardioModal
				visible={cardioModalVisible}
				onClose={() => setCardioModalVisible(false)}
				onSave={handleSaveCardio}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 18,
		paddingTop: 10,
		paddingBottom: 100
	},
	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12
	},
	loadingText: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999'
	},
	blockerWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 32
	},
	blockerIcon: { marginBottom: 24 },
	blockerTitle: {
		fontSize: 24,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		textAlign: 'center',
		marginBottom: 12
	},
	blockerSubtitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#999999',
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: 32
	},
	blockerBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: '#AFFF2B',
		paddingHorizontal: 28,
		paddingVertical: 16,
		borderRadius: 14
	},
	blockerBtnText: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#000000'
	},

	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16
	},
	headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
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
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	weekBadge: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 8,
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		borderWidth: 1,
		borderColor: '#AFFF2B',
		alignItems: 'center'
	},
	weekBadgeText: {
		fontSize: 12,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	weekBadgeSubtext: {
		fontSize: 10,
		fontFamily: FontFamily.bold,
		color: 'rgba(175, 255, 43, 0.7)',
		marginTop: 1
	},
	completionCard: {
		borderWidth: 1,
		borderColor: '#AFFF2B',
		borderRadius: 16,
		backgroundColor: 'rgba(175, 255, 43, 0.06)',
		padding: 20,
		marginBottom: 12,
		alignItems: 'center'
	},
	completionIconWrap: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 14
	},
	completionTitle: {
		fontSize: 20,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 6
	},
	completionSubtitle: {
		fontSize: 13,
		fontFamily: FontFamily.bold,
		color: '#999999',
		textAlign: 'center',
		lineHeight: 20,
		marginBottom: 20,
		paddingHorizontal: 10
	},
	completionActions: {
		width: '100%',
		gap: 10
	},
	completionPrimary: {
		height: 50,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	completionPrimaryText: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#000000'
	},
	completionSecondary: {
		height: 50,
		borderRadius: 14,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	completionSecondaryText: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	settingsIcon: { fontSize: 20, color: '#999999' },

	workoutTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 10,
		marginBottom: 14
	},
	workoutTitleLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		flex: 1
	},
	tagPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
	tagText: {
		color: '#FFFFFF',
		fontFamily: FontFamily.bold,
		fontSize: 12
	},
	workoutTitle: {
		fontSize: 22,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},

	restDayButton: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333',
		alignItems: 'center',
		justifyContent: 'center'
	},

	summaryCard: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 14,
		marginBottom: 12
	},
	summaryHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'baseline'
	},
	summaryTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	summarySubtitle: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#AFFF2B'
	},
	summarySubtitleRest: {
		color: '#FFD60A'
	},

	statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
	statBox: {
		width: '48%',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 14,
		padding: 12,
		backgroundColor: '#0D0D0D'
	},
	statLabel: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#999999'
	},
	statValue: {
		marginTop: 4,
		fontSize: 18,
		fontFamily: FontFamily.bold,
		color: '#FFFFFF'
	},

	summaryRow: {
		marginTop: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12
	},
	summaryRowLabel: {
		fontSize: 12,
		fontFamily: FontFamily.black,
		color: '#999999'
	},
	summaryRowValue: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#FFFFFF',
		flex: 1,
		textAlign: 'right'
	},

	summaryActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
	secondaryButton: {
		flex: 1,
		height: 44,
		borderRadius: 14,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	secondaryButtonText: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},

	restDaySummary: {
		alignItems: 'center',
		paddingVertical: 24,
		borderBottomWidth: 1,
		borderBottomColor: '#2A2A2A'
	},
	restDayIcon: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16
	},
	restDayTitle: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 8
	},
	restDayDescription: {
		fontSize: 13,
		fontWeight: '700',
		color: '#999999',
		textAlign: 'center',
		lineHeight: 20,
		paddingHorizontal: 20
	},
	restDayInfo: {
		gap: 12,
		marginTop: 16
	},
	restDayInfoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10
	},
	restDayInfoText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#FFFFFF',
		flex: 1
	},

	listCard: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		overflow: 'hidden',
		marginBottom: 12
	},
	exerciseListTitle: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		paddingHorizontal: 14,
		paddingTop: 14,
		paddingBottom: 8
	},

	exerciseRow: {
		paddingHorizontal: 14,
		paddingVertical: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	exerciseLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	exerciseIcon: {
		width: 34,
		height: 34,
		borderRadius: 12,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	exerciseIconText: {
		fontSize: 18,
		fontFamily: FontFamily.bold,
		color: '#999999'
	},
	exerciseName: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	exerciseMeta: {
		fontSize: 12,
		fontFamily: FontFamily.semiBold,
		color: '#999999',
		marginTop: 2
	},
	chevron: {
		fontSize: 24,
		fontFamily: FontFamily.bold,
		color: '#666666',
		marginLeft: 10
	},
	rowDivider: { height: 1, backgroundColor: '#333333', marginHorizontal: 14 },

	restCard: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 16,
		marginBottom: 12
	},
	restTitle: {
		fontSize: 18,
		fontFamily: FontFamily.bold,
		color: '#FFFFFF',
		marginBottom: 8
	},
	restBody: {
		fontSize: 13,
		fontFamily: FontFamily.semiBold,
		color: '#999999',
		lineHeight: 18
	},

	placeholder: {
		fontSize: 14,
		color: '#999999',
		marginTop: 20
	},

	primaryActionButton: {
		height: 54,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 12,
		shadowColor: '#AFFF2B',
		shadowOpacity: 0.3,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 5
	},
	primaryActionButtonText: {
		color: '#000000',
		fontSize: 18,
		fontFamily: FontFamily.black
	},
	cardioCard: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 16,
		marginBottom: 12
	},
	cardioHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	cardioLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	cardioIcon: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	cardioTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	cardioSubtitle: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
		marginTop: 2
	},
	cardioCompleted: {
		alignItems: 'center',
		justifyContent: 'center'
	},
	cardioButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 10,
		backgroundColor: '#AFFF2B'
	},
	cardioButtonText: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#000000'
	},
	cardioDetails: {
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: '#2A2A2A'
	},
	cardioDetailsText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999'
	}
});
