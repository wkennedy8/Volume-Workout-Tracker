import { useAuth } from '@/context/AuthContext'
import { getActiveProgram } from '@/controllers/programController'
import { db } from '@/lib/firebase'
import { formatLocalDateKey } from '@/utils/dateUtils'
import {
	getTodayWorkoutFromProgram,
	isTodayTrainingDay
} from '@/utils/programSchedule'
import { tagColor } from '@/utils/workoutUtils'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useCallback, useMemo, useState } from 'react'
import {
	ActivityIndicator,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontFamily } from '../../constants/fonts'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
]

function buildMonthGrid(year, month) {
	const firstDay = new Date(year, month, 1)
	const totalDays = new Date(year, month + 1, 0).getDate()
	const startDow = firstDay.getDay()
	const cells = []
	for (let i = 0; i < startDow; i++) cells.push(null)
	for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d))
	while (cells.length % 7 !== 0) cells.push(null)
	return cells
}

export default function CalendarScreen() {
	const { user } = useAuth()
	const router = useRouter()

	const today = useMemo(() => new Date(), [])
	const todayKey = useMemo(() => formatLocalDateKey(today), [today])

	const [monthOffset, setMonthOffset] = useState(0)
	const [sessions, setSessions] = useState({})
	const [program, setProgram] = useState(null)
	const [loading, setLoading] = useState(true)
	const [selectedDay, setSelectedDay] = useState(null)
	const [sheetVisible, setSheetVisible] = useState(false)

	const { year, month } = useMemo(() => {
		const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
		return { year: d.getFullYear(), month: d.getMonth() }
	}, [monthOffset, today])

	const firstDayKey = useMemo(
		() => formatLocalDateKey(new Date(year, month, 1)),
		[year, month]
	)
	const lastDayKey = useMemo(
		() => formatLocalDateKey(new Date(year, month + 1, 0)),
		[year, month]
	)
	const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
	const rows = useMemo(() => {
		const r = []
		for (let i = 0; i < cells.length; i += 7) r.push(cells.slice(i, i + 7))
		return r
	}, [cells])

	useFocusEffect(
		useCallback(() => {
			if (!user?.uid) return
			load()
		}, [user?.uid, firstDayKey, lastDayKey])
	)

	async function load() {
		try {
			setLoading(true)
			const [activeProgram, sessionsMap] = await Promise.all([
				getActiveProgram(user.uid),
				fetchSessions()
			])
			setProgram(activeProgram)
			setSessions(sessionsMap)
		} catch (e) {
			console.warn('Calendar load error:', e)
		} finally {
			setLoading(false)
		}
	}

	async function fetchSessions() {
		const ref = collection(db, 'users', user.uid, 'sessions')
		const q = query(
			ref,
			where('date', '>=', firstDayKey),
			where('date', '<=', lastDayKey)
		)
		const snap = await getDocs(q)
		const map = {}
		snap.docs.forEach((doc) => {
			const data = doc.data()
			map[data.date] = { id: doc.id, ...data }
		})
		return map
	}

	function getDayStatus(date) {
		const dateKey = formatLocalDateKey(date)
		const session = sessions[dateKey]
		if (session?.status === 'completed') return 'completed'
		if (session?.status === 'in_progress') return 'in_progress'
		if (dateKey === todayKey) return 'today'
		if (dateKey < todayKey) return 'past'
		return 'future'
	}

	function isScheduledTrainingDay(date) {
		if (!program) return false
		return isTodayTrainingDay(program.daysPerWeek ?? 3, date)
	}

	function handleDayPress(date) {
		const dateKey = formatLocalDateKey(date)
		const session = sessions[dateKey]

		if (session?.status === 'completed') {
			router.push(`/workout/details?sessionId=${session.id}`)
			return
		}

		const planned = program ? getTodayWorkoutFromProgram(program, date) : null
		setSelectedDay({ date, dateKey, session, planned })
		setSheetVisible(true)
	}

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => setMonthOffset((o) => o - 1)}
					hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
				>
					<Ionicons name='chevron-back' size={22} color='#FFFFFF' />
				</TouchableOpacity>
				<Text style={styles.monthTitle}>
					{MONTH_NAMES[month]} {year}
				</Text>
				<TouchableOpacity
					onPress={() => setMonthOffset((o) => o + 1)}
					hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
				>
					<Ionicons name='chevron-forward' size={22} color='#FFFFFF' />
				</TouchableOpacity>
			</View>

			<View style={styles.dayLabelRow}>
				{DAY_LABELS.map((d) => (
					<Text key={d} style={styles.dayLabel}>
						{d}
					</Text>
				))}
			</View>

			{loading ? (
				<ActivityIndicator color='#AFFF2B' style={{ marginTop: 60 }} />
			) : !program ? (
				<View style={styles.emptyState}>
					<Ionicons name='calendar-outline' size={56} color='#333333' />
					<Text style={styles.emptyTitle}>Nothing scheduled yet</Text>
					<Text style={styles.emptySubtitle}>
						Build a program to map your training days onto the calendar and
						track your progress over time.
					</Text>
					<TouchableOpacity
						style={styles.emptyButton}
						onPress={() => router.push('/program-builder')}
						activeOpacity={0.85}
					>
						<Text style={styles.emptyButtonText}>Build a Program</Text>
						<Ionicons name='arrow-forward' size={16} color='#000000' />
					</TouchableOpacity>
				</View>
			) : (
				<View style={styles.grid}>
					{rows.map((row, ri) => (
						<View key={ri} style={styles.row}>
							{row.map((date, ci) => {
								if (!date) return <View key={ci} style={styles.cell} />
								const status = getDayStatus(date)
								const dateKey = formatLocalDateKey(date)
								const isToday = dateKey === todayKey
								const isCompleted = status === 'completed'
								const isInProgress = status === 'in_progress'
								const showScheduledDot =
									!isCompleted &&
									!isInProgress &&
									isScheduledTrainingDay(date)

								return (
									<TouchableOpacity
										key={ci}
										style={styles.cell}
										onPress={() => handleDayPress(date)}
										activeOpacity={0.7}
									>
										<View
											style={[
												styles.dayCircle,
												isCompleted && styles.circleCompleted,
												isInProgress && styles.circleInProgress,
												isToday &&
													!isCompleted &&
													!isInProgress &&
													styles.circleToday
											]}
										>
											<Text
												style={[
													styles.dayNumber,
													isCompleted && styles.numberCompleted,
													isInProgress && styles.numberInProgress,
													isToday &&
														!isCompleted &&
														!isInProgress &&
														styles.numberToday,
													status === 'past' && styles.numberPast
												]}
											>
												{date.getDate()}
											</Text>
										</View>
										<View style={styles.dotSlot}>
											{showScheduledDot && (
												<View style={styles.scheduledDot} />
											)}
										</View>
									</TouchableOpacity>
								)
							})}
						</View>
					))}
				</View>
			)}

			{program && (
			<View style={styles.legend}>
				<View style={styles.legendItem}>
					<View style={[styles.legendDot, { backgroundColor: '#AFFF2B' }]} />
					<Text style={styles.legendLabel}>Completed</Text>
				</View>
				<View style={styles.legendItem}>
					<View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
					<Text style={styles.legendLabel}>In Progress</Text>
				</View>
				<View style={styles.legendItem}>
					<View style={[styles.legendDot, styles.legendDotToday]} />
					<Text style={styles.legendLabel}>Today</Text>
				</View>
				<View style={styles.legendItem}>
					<View style={[styles.legendDot, { backgroundColor: '#666666' }]} />
					<Text style={styles.legendLabel}>Scheduled</Text>
				</View>
			</View>
			)}

			<Modal
				visible={sheetVisible}
				transparent
				animationType='slide'
				onRequestClose={() => setSheetVisible(false)}
			>
				<View style={styles.overlay}>
					<TouchableOpacity
						style={{ flex: 1 }}
						onPress={() => setSheetVisible(false)}
					/>
					<View style={styles.sheet}>
						{selectedDay && (
							<DaySheet
								day={selectedDay}
								onClose={() => setSheetVisible(false)}
							/>
						)}
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	)
}

function DaySheet({ day }) {
	const { date, session, planned } = day
	const isRestDay =
		!planned || planned.id === 'rest' || !planned.exercises?.length
	const displayDate = date.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	})

	return (
		<ScrollView
			style={styles.sheetScroll}
			contentContainerStyle={styles.sheetContent}
		>
			<View style={styles.sheetHandle} />
			<Text style={styles.sheetDate}>{displayDate}</Text>

			{session?.status === 'in_progress' && (
				<View style={styles.inProgressBadge}>
					<Text style={styles.inProgressText}>In Progress</Text>
				</View>
			)}

			{isRestDay ? (
				<View style={styles.restBox}>
					<Ionicons name='bed-outline' size={32} color='#6495ED' />
					<Text style={styles.restLabel}>Rest Day</Text>
				</View>
			) : (
				<>
					<View style={styles.sheetWorkoutMeta}>
						<View
							style={[
								styles.tagPill,
								{ backgroundColor: tagColor(planned.tag) + '33' }
							]}
						>
							<Text style={[styles.tagText, { color: tagColor(planned.tag) }]}>
								{planned.tag}
							</Text>
						</View>
						<Text style={styles.sheetTitle}>{planned.title}</Text>
					</View>

					{planned.exercises?.map((ex, i) => (
						<View key={i} style={styles.exerciseRow}>
							<Text style={styles.exerciseName}>{ex.name}</Text>
							<Text style={styles.exerciseMeta}>
								{ex.sets} × {ex.reps}
							</Text>
						</View>
					))}
				</>
			)}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 24,
		paddingTop: 16,
		paddingBottom: 12
	},
	monthTitle: {
		fontSize: 18,
		fontFamily: FontFamily.bold,
		color: '#FFFFFF'
	},
	dayLabelRow: {
		flexDirection: 'row',
		paddingHorizontal: 12,
		marginBottom: 4
	},
	dayLabel: {
		flex: 1,
		textAlign: 'center',
		fontSize: 11,
		fontFamily: FontFamily.semiBold,
		color: '#666666'
	},
	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 40,
		paddingBottom: 60
	},
	emptyTitle: {
		fontSize: 20,
		fontFamily: FontFamily.bold,
		color: '#FFFFFF',
		marginTop: 20,
		marginBottom: 8,
		textAlign: 'center'
	},
	emptySubtitle: {
		fontSize: 14,
		fontFamily: FontFamily.regular,
		color: '#666666',
		textAlign: 'center',
		lineHeight: 20,
		marginBottom: 28
	},
	emptyButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: '#AFFF2B',
		paddingHorizontal: 24,
		paddingVertical: 14,
		borderRadius: 12
	},
	emptyButtonText: {
		fontSize: 15,
		fontFamily: FontFamily.bold,
		color: '#000000'
	},
	grid: { paddingHorizontal: 12 },
	row: { flexDirection: 'row', marginBottom: 4 },
	cell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
	dayCircle: {
		width: 38,
		height: 38,
		borderRadius: 19,
		alignItems: 'center',
		justifyContent: 'center'
	},
	dotSlot: {
		height: 8,
		alignItems: 'center',
		justifyContent: 'center'
	},
	scheduledDot: {
		width: 5,
		height: 5,
		borderRadius: 2.5,
		backgroundColor: '#666666'
	},
	circleCompleted: {
		backgroundColor: 'rgba(175, 255, 43, 0.15)',
		borderWidth: 2,
		borderColor: '#AFFF2B'
	},
	circleInProgress: {
		backgroundColor: 'rgba(249, 115, 22, 0.15)',
		borderWidth: 2,
		borderColor: '#F97316'
	},
	circleToday: {
		borderWidth: 2,
		borderColor: '#FFFFFF'
	},
	dayNumber: {
		fontSize: 14,
		fontFamily: FontFamily.semiBold,
		color: '#999999'
	},
	numberCompleted: { color: '#AFFF2B' },
	numberInProgress: { color: '#F97316' },
	numberToday: { color: '#FFFFFF' },
	numberPast: { color: '#444444' },
	legend: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 20,
		paddingVertical: 16
	},
	legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	legendDot: { width: 10, height: 10, borderRadius: 5 },
	legendDotToday: {
		borderWidth: 2,
		borderColor: '#FFFFFF',
		backgroundColor: 'transparent'
	},
	legendLabel: {
		fontSize: 11,
		fontFamily: FontFamily.regular,
		color: '#666666'
	},
	overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
	sheet: {
		backgroundColor: '#1A1A1A',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		maxHeight: '60%'
	},
	sheetScroll: { flex: 0 },
	sheetContent: { padding: 20, paddingBottom: 40 },
	sheetHandle: {
		width: 40,
		height: 4,
		backgroundColor: '#444444',
		borderRadius: 2,
		alignSelf: 'center',
		marginBottom: 16
	},
	sheetDate: {
		fontSize: 16,
		fontFamily: FontFamily.bold,
		color: '#FFFFFF',
		marginBottom: 12
	},
	inProgressBadge: {
		alignSelf: 'flex-start',
		backgroundColor: 'rgba(249, 115, 22, 0.15)',
		borderWidth: 1,
		borderColor: '#F97316',
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 4,
		marginBottom: 12
	},
	inProgressText: {
		fontSize: 12,
		fontFamily: FontFamily.semiBold,
		color: '#F97316'
	},
	restBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
	restLabel: {
		fontSize: 16,
		fontFamily: FontFamily.bold,
		color: '#6495ED'
	},
	sheetWorkoutMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 16
	},
	tagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
	tagText: { fontSize: 12, fontFamily: FontFamily.semiBold },
	sheetTitle: {
		fontSize: 16,
		fontFamily: FontFamily.bold,
		color: '#FFFFFF'
	},
	exerciseRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#2A2A2A'
	},
	exerciseName: {
		fontSize: 14,
		fontFamily: FontFamily.semiBold,
		color: '#FFFFFF',
		flex: 1
	},
	exerciseMeta: {
		fontSize: 13,
		fontFamily: FontFamily.regular,
		color: '#666666'
	}
})
