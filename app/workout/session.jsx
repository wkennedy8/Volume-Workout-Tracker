import AddExerciseModal from '@/components/AddExerciseModal'
import SwapExerciseModal from '@/components/SwapExerciseModal'
import ExerciseCard from '@/components/workout/session/ExerciseCard'
import FinishWorkoutButton from '@/components/workout/session/FinishWorkoutButton'
import SessionHeader from '@/components/workout/session/SessionHeader'
import SetLoggedOverlay from '@/components/workout/session/SetLoggedOverlay'
import { useAuth } from '@/context/AuthContext'
import { getSmartDefaultWeight } from '@/controllers/exerciseDefaultsController'
import {
	buildEmptySession,
	upsertSession as firestoreUpsertSession,
	getInProgressSessionForDay,
	getPreviousExerciseData,
	getSessionById,
	markSessionCompleted
} from '@/controllers/sessionController'
import { formatLocalDateKey } from '@/utils/dateUtils'
import {
	isExerciseCompleted,
	validateSetBeforeSave
} from '@/utils/sessionUtils'
import { playChime } from '@/utils/timerUtils'
import { getProgramById } from '@/controllers/programController'
import { getTargetForWeek } from '@/utils/progressionEngine'
import { cancelTodaysWorkoutReminder } from '@/utils/notificationService'
import { displayWeight, toStoredLbs, weightUnitLabel } from '@/utils/unitsUtils'
import { normalizeExerciseKey, normalizeNumberText } from '@/utils/workoutUtils'
import { useUnits } from '@/hooks/useUnits'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
	Alert,
	AppState,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FontFamily } from '../../constants/fonts'

export default function WorkoutSessionScreen() {
	const router = useRouter()
	const { user } = useAuth()
	const { weightUnit } = useUnits()
	const params = useLocalSearchParams()
	const templateId = String(params.templateId || 'push')
	const programId = params.programId ? String(params.programId) : null

	const today = useMemo(() => new Date(), [])
	const dateKey = useMemo(() => formatLocalDateKey(today), [today])

	// State
	const [session, setSession] = useState(null)
	const [loading, setLoading] = useState(true)
	const [exerciseDefaults, setExerciseDefaults] = useState({})
	const [swapModalVisible, setSwapModalVisible] = useState(false)
	const [addModalVisible, setAddModalVisible] = useState(false)
	const [swapExerciseIndex, setSwapExerciseIndex] = useState(null)
	const [currentWeek, setCurrentWeek] = useState(1)
	const [template, setTemplate] = useState(null)
	const [previousSessionData, setPreviousSessionData] = useState({})
	const [finishing, setFinishing] = useState(false)
	const [activeExerciseIndex, setActiveExerciseIndex] = useState(0)
	const [setLoggedData, setSetLoggedData] = useState(null)
	const [setLoggedVisible, setSetLoggedVisible] = useState(false)

	// Rest timer state
	const [restVisible, setRestVisible] = useState(false)
	const [restTimerEndTime, setRestTimerEndTime] = useState(null)
	const [restSeconds, setRestSeconds] = useState(0)
	const [restPaused, setRestPaused] = useState(false)
	const [pausedAtSeconds, setPausedAtSeconds] = useState(0)
	const [initialRestSeconds, setInitialRestSeconds] = useState(0)
	const [restContext, setRestContext] = useState(null)
	const restIntervalRef = useRef(null)
	const progress = useSharedValue(0)
	const appState = useRef(AppState.currentState)

	// ============================================================================
	// EFFECTS
	// ============================================================================

	// Load template from the active custom program (Firestore)
	useEffect(() => {
		if (!user?.uid || !programId) return

		;(async () => {
			try {
				const prog = await getProgramById(user.uid, programId)
				if (!prog) {
					console.warn('Program not found for session:', programId)
					return
				}
				const week = prog.currentWeek ?? 1
				setCurrentWeek(week)

				const day = prog.days?.find((d) => d.id === templateId)
				if (!day) {
					console.warn('Day not found in program:', templateId)
					return
				}

				const exercises = (day.exercises ?? []).map((ex) => {
					const target = getTargetForWeek(ex, week, prog.cycleLength ?? 8)
					return {
						name: ex.name,
						sets: String(target.sets),
						reps: target.reps,
						note: '',
						muscleGroup: ex.muscleGroup ?? '',
						isCompound: ex.isCompound ?? false
					}
				})

				const dayLabel = day.label ?? day.id
				setTemplate({
					id: day.id,
					title: `${dayLabel} Day`,
					tag: dayLabel,
					exercises
				})
			} catch (error) {
				console.error('Error loading program template:', error)
			}
		})()
	}, [user?.uid, programId, templateId])

	// Handle app state changes (background/foreground)
	useEffect(() => {
		const subscription = AppState.addEventListener('change', (nextAppState) => {
			if (
				appState.current.match(/inactive|background/) &&
				nextAppState === 'active'
			) {
				if (restTimerEndTime && !restPaused) {
					const now = Date.now()
					const remaining = Math.max(
						0,
						Math.ceil((restTimerEndTime - now) / 1000)
					)
					setRestSeconds(remaining)

					if (remaining === 0) {
						stopRestTimer()
						playChime()
						Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
					}
				}
			}
			appState.current = nextAppState
		})

		return () => {
			subscription.remove()
		}
	}, [restTimerEndTime, restPaused])

	// Update timer display every second
	useEffect(() => {
		if (restTimerEndTime && !restPaused) {
			if (restIntervalRef.current) {
				clearInterval(restIntervalRef.current)
			}

			restIntervalRef.current = setInterval(() => {
				const now = Date.now()
				const remaining = Math.max(
					0,
					Math.ceil((restTimerEndTime - now) / 1000)
				)
				setRestSeconds(remaining)

				if (remaining === 0) {
					stopRestTimer()
					playChime()
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
				}
			}, 1000)

			return () => {
				if (restIntervalRef.current) {
					clearInterval(restIntervalRef.current)
				}
			}
		}
	}, [restTimerEndTime, restPaused])

	// Init session (resume or create)
	useEffect(() => {
		if (!user?.uid || !template) return
		;(async () => {
			try {
				setLoading(true)

				const mode = String(params.mode || 'start')
				const sessionId = params.sessionId ? String(params.sessionId) : null

				// EDIT MODE
				if (mode === 'edit') {
					if (!sessionId) {
						throw new Error('Missing sessionId for edit mode')
					}

					const found = await getSessionById(user.uid, sessionId)
					if (!found) {
						throw new Error('Session not found')
					}

					const normalized = {
						...found,
						title: template.title,
						tag: template.tag,
						exercises: found.exercises.map((ex, idx) => ({
							expanded: idx === 0,
							...ex,
							sets: (ex.sets || []).map((s) => ({
								saved: s.saved ?? false,
								savedAt: s.savedAt ?? null,
								...s
							}))
						}))
					}

					setSession(normalized)
					await firestoreUpsertSession(user.uid, normalized)
					return
				}

				// RESUME MODE
				if (mode === 'resume' && sessionId) {
					const found = await getSessionById(user.uid, sessionId)
					if (found) {
						const normalized = {
							...found,
							title: template.title,
							tag: template.tag,
							exercises: found.exercises.map((ex, idx) => ({
								expanded: idx === 0,
								...ex,
								sets: (ex.sets || []).map((s) => ({
									saved: s.saved ?? false,
									savedAt: s.savedAt ?? null,
									...s
								}))
							}))
						}

						setSession(normalized)
						await firestoreUpsertSession(user.uid, normalized)
						return
					}
				}

				// START / FALLBACK
				const existing = await getInProgressSessionForDay(user.uid, {
					templateId: template.id,
					dateKey
				})

				if (existing) {
					const normalized = {
						...existing,
						title: template.title,
						tag: template.tag,
						exercises: existing.exercises.map((ex, idx) => ({
							expanded: idx === 0,
							...ex,
							sets: (ex.sets || []).map((s) => ({
								saved: s.saved ?? false,
								savedAt: s.savedAt ?? null,
								...s
							}))
						}))
					}

					setSession(normalized)
					await firestoreUpsertSession(user.uid, normalized)
					return
				}

				// CREATE NEW SESSION WITH SMART DEFAULTS
				const smartDefaults = {}

				for (const exercise of template.exercises) {
					const smartWeight = await getSmartDefaultWeight(
						user.uid,
						exercise.name,
						template.id
					)

					if (smartWeight !== null) {
						const exerciseKey = normalizeExerciseKey(exercise.name)
						smartDefaults[exerciseKey] = {
							defaultWeight: displayWeight(smartWeight, weightUnit)
						}
					}
				}

				setExerciseDefaults(smartDefaults)

				const prevSetsCountMap = {}
				for (const exercise of template.exercises) {
					const prevData = await getPreviousExerciseData(
						user.uid,
						template.id,
						exercise.name
					)
					if (prevData && prevData.length > 0) {
						prevSetsCountMap[normalizeExerciseKey(exercise.name)] =
							prevData.length
					}
				}

				const created = buildEmptySession({
					template,
					defaultsMap: smartDefaults,
					prevSetsCountMap
				})
				created.exercises[0].expanded = true
				created.programWeek = currentWeek
				if (programId) created.programId = programId

				setSession(created)
				await firestoreUpsertSession(user.uid, created)
			} catch (e) {
				console.warn(e)
				Alert.alert('Error', 'Could not initialize workout session.')
			} finally {
				setLoading(false)
			}
		})()

		return () => {
			if (restIntervalRef.current) clearInterval(restIntervalRef.current)
		}
	}, [user?.uid, template, params.mode, params.sessionId, currentWeek])

	// Load previous session data for all exercises
	useEffect(() => {
		if (!user?.uid || !template || !session) return
		;(async () => {
			try {
				const prevData = {}

				for (const exercise of template.exercises) {
					const data = await getPreviousExerciseData(
						user.uid,
						template.id,
						exercise.name
					)

					if (data) {
						prevData[exercise.name] = data
					}
				}

				setPreviousSessionData(prevData)
			} catch (error) {
				console.error('Error loading previous session data:', error)
			}
		})()
	}, [user?.uid, template?.id, session?.id])

	// Update progress animation
	useEffect(() => {
		if (initialRestSeconds > 0) {
			const newProgress = restSeconds / initialRestSeconds
			progress.value = withTiming(newProgress, { duration: 300 })
		}
	}, [restSeconds, initialRestSeconds])

	// ============================================================================
	// REST TIMER FUNCTIONS
	// ============================================================================

	function startRestTimer({ seconds, context }) {
		if (restIntervalRef.current) clearInterval(restIntervalRef.current)

		const endTime = Date.now() + seconds * 1000

		setRestContext(context)
		setRestTimerEndTime(endTime)
		setRestSeconds(seconds)
		setInitialRestSeconds(seconds)
		setRestVisible(true)
		setRestPaused(false)
		setPausedAtSeconds(0)
		progress.value = 1
	}

	function stopRestTimer() {
		if (restIntervalRef.current) clearInterval(restIntervalRef.current)
		restIntervalRef.current = null
		setRestTimerEndTime(null)
		setRestSeconds(0)
		setRestVisible(false)
		setRestPaused(false)
		setPausedAtSeconds(0)
	}

	function skipRest() {
		stopRestTimer()
	}

	function addRest(secondsToAdd) {
		if (!restTimerEndTime) return

		if (restPaused) {
			const newPausedSeconds = pausedAtSeconds + secondsToAdd
			setPausedAtSeconds(newPausedSeconds)
			setRestSeconds(newPausedSeconds)
		} else {
			const newEndTime = restTimerEndTime + secondsToAdd * 1000
			setRestTimerEndTime(newEndTime)
			const remaining = Math.max(0, Math.ceil((newEndTime - Date.now()) / 1000))
			setRestSeconds(remaining)
		}
	}

	function subtractRest(secondsToSubtract) {
		if (!restTimerEndTime) return

		if (restPaused) {
			const newPausedSeconds = Math.max(0, pausedAtSeconds - secondsToSubtract)
			setPausedAtSeconds(newPausedSeconds)
			setRestSeconds(newPausedSeconds)
		} else {
			const newEndTime = restTimerEndTime - secondsToSubtract * 1000
			const now = Date.now()

			if (newEndTime <= now) {
				stopRestTimer()
			} else {
				setRestTimerEndTime(newEndTime)
				const remaining = Math.max(0, Math.ceil((newEndTime - now) / 1000))
				setRestSeconds(remaining)
			}
		}
	}

	function togglePause() {
		if (restPaused) {
			const newEndTime = Date.now() + pausedAtSeconds * 1000
			setRestTimerEndTime(newEndTime)
			setRestPaused(false)
		} else {
			if (restIntervalRef.current) clearInterval(restIntervalRef.current)
			restIntervalRef.current = null
			setPausedAtSeconds(restSeconds)
			setRestPaused(true)
		}
	}

	// ============================================================================
	// SESSION MANAGEMENT FUNCTIONS
	// ============================================================================

	function openSwapModal(exerciseIndex) {
		setSwapExerciseIndex(exerciseIndex)
		setSwapModalVisible(true)
	}

	function removeExercise(exerciseIndex) {
		const exercise = session.exercises[exerciseIndex]
		const hasSavedSets = exercise.sets.some((s) => s.saved)

		Alert.alert(
			'Remove Exercise',
			hasSavedSets
				? `${exercise.name} has saved sets. Are you sure you want to remove it?`
				: `Remove ${exercise.name} from this session?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Remove',
					style: 'destructive',
					onPress: () => {
						setSession((prev) => {
							if (!prev) return prev
							const next = {
								...prev,
								exercises: prev.exercises.filter((_, i) => i !== exerciseIndex)
							}
							if (user?.uid) firestoreUpsertSession(user.uid, next)
							return next
						})
					}
				}
			]
		)
	}

	async function handleSwapExercise(alternative) {
		if (swapExerciseIndex === null) return

		// Look up previous weight and session data for the incoming exercise
		const [smartWeight, prevData] = await Promise.all([
			user?.uid
				? getSmartDefaultWeight(user.uid, alternative.name, template.id)
				: null,
			user?.uid
				? getPreviousExerciseData(user.uid, template.id, alternative.name)
				: null
		])

		// Make previous-set reference data available for the swapped exercise
		if (prevData) {
			setPreviousSessionData((prev) => ({
				...prev,
				[alternative.name]: prevData
			}))
		}

		const defaultWeight = smartWeight != null ? String(displayWeight(smartWeight, weightUnit)) : ''

		setSession((prev) => {
			if (!prev) return prev

			const next = {
				...prev,
				exercises: prev.exercises.map((ex, i) => {
					if (i !== swapExerciseIndex) return ex

					const originalName = ex.originalName || ex.name

					return {
						...ex,
						name: alternative.name,
						originalName: originalName,
						isSwapped: true,
						// Keep muscle group/type in sync so future swaps stay scoped
						muscleGroup: alternative.muscleGroup ?? ex.muscleGroup ?? '',
						isCompound: alternative.isCompound ?? ex.isCompound ?? false,
						// Apply the looked-up weight to all unsaved sets
						sets: ex.sets.map((s) => ({
							...s,
							weight: s.saved ? s.weight : defaultWeight
						}))
					}
				})
			}

			if (user?.uid) firestoreUpsertSession(user.uid, next)
			return next
		})

		setSwapModalVisible(false)
		setSwapExerciseIndex(null)
	}

	async function handleAddExercise(libraryExercise) {
		const [smartWeight, prevData] = await Promise.all([
			user?.uid
				? getSmartDefaultWeight(user.uid, libraryExercise.name, template.id)
				: null,
			user?.uid
				? getPreviousExerciseData(user.uid, template.id, libraryExercise.name)
				: null
		])

		if (prevData) {
			setPreviousSessionData((prev) => ({
				...prev,
				[libraryExercise.name]: prevData
			}))
		}

		const defaultWeight = smartWeight != null ? String(displayWeight(smartWeight, weightUnit)) : ''
		const numSets = 3

		const newExercise = {
			name: libraryExercise.name,
			targetSets: String(numSets),
			targetReps: '10-12',
			note: '',
			muscleGroup: libraryExercise.muscleGroup ?? '',
			isCompound: libraryExercise.isCompound ?? false,
			isCustomAdded: true,
			expanded: true,
			sets: Array.from({ length: numSets }, (_, i) => ({
				setIndex: i + 1,
				weight: defaultWeight,
				reps: '',
				saved: false,
				savedAt: null
			}))
		}

		setSession((prev) => {
			if (!prev) return prev
			const next = { ...prev, exercises: [...prev.exercises, newExercise] }
			if (user?.uid) firestoreUpsertSession(user.uid, next)
			return next
		})
	}

	function toggleExpanded(exerciseIndex) {
		setSession((prev) => {
			if (!prev) return prev
			const next = {
				...prev,
				exercises: prev.exercises.map((ex, i) =>
					i === exerciseIndex ? { ...ex, expanded: !ex.expanded } : ex
				)
			}
			if (user?.uid) firestoreUpsertSession(user.uid, next)
			return next
		})
	}

	function updateSetField(exerciseIndex, setIndex, patch) {
		setSession((prev) => {
			if (!prev) return prev
			const next = { ...prev }
			next.exercises = prev.exercises.map((ex, i) => {
				if (i !== exerciseIndex) return ex
				const sets = ex.sets.map((s) =>
					s.setIndex === setIndex ? { ...s, ...patch } : s
				)
				return { ...ex, sets }
			})
			if (user?.uid) firestoreUpsertSession(user.uid, next)
			return next
		})
	}

	function addSet(exerciseIndex) {
		setSession((prev) => {
			if (!prev) return prev
			const exercise = prev.exercises[exerciseIndex]
			const newSetIndex = exercise.sets.length + 1

			const exKey = normalizeExerciseKey(exercise.name)
			const defaultWeight =
				exerciseDefaults?.[exKey]?.defaultWeight != null
					? String(exerciseDefaults[exKey].defaultWeight)
					: ''

			const next = {
				...prev,
				exercises: prev.exercises.map((ex, i) =>
					i === exerciseIndex
						? {
								...ex,
								sets: [
									...ex.sets,
									{
										setIndex: newSetIndex,
										weight: defaultWeight,
										reps: '',
										saved: false,
										savedAt: null
									}
								]
							}
						: ex
				)
			}

			if (user?.uid) firestoreUpsertSession(user.uid, next)
			return next
		})
	}

	function removeSet(exerciseIndex, setIndex) {
		setSession((prev) => {
			if (!prev) return prev
			const exercise = prev.exercises[exerciseIndex]

			if (exercise.sets.length <= 1) {
				Alert.alert('Cannot remove', 'Exercise must have at least one set.')
				return prev
			}


			const next = {
				...prev,
				exercises: prev.exercises.map((ex, i) =>
					i === exerciseIndex
						? {
								...ex,
								sets: ex.sets
									.filter((s) => s.setIndex !== setIndex)
									.map((s, idx) => ({ ...s, setIndex: idx + 1 }))
							}
						: ex
				)
			}

			if (user?.uid) firestoreUpsertSession(user.uid, next)
			return next
		})
	}

	function editSet(exerciseIndex, setIndex) {
		Alert.alert('Edit Set', 'Unlock this set to make changes?', [
			{
				text: 'Cancel',
				style: 'cancel'
			},
			{
				text: 'Unlock',
				onPress: () => {
					setSession((prev) => {
						if (!prev) return prev
						const next = {
							...prev,
							exercises: prev.exercises.map((ex, i) =>
								i === exerciseIndex
									? {
											...ex,
											sets: ex.sets.map((s) =>
												s.setIndex === setIndex
													? { ...s, saved: false, savedAt: null }
													: s
											)
										}
									: ex
							)
						}

						if (user?.uid) firestoreUpsertSession(user.uid, next)
						return next
					})
				}
			}
		])
	}

	function getPreviousSet(exerciseName, setIndex) {
		const exerciseData = previousSessionData[exerciseName]
		if (!exerciseData) return null

		const prevSet = exerciseData.find((s) => s.setIndex === setIndex)
		return prevSet || null
	}

	function saveSet(exerciseIndex, setIndex) {
		setSession((prev) => {
			if (!prev) return prev
			const ex = prev.exercises[exerciseIndex]
			const set = ex.sets.find((s) => s.setIndex === setIndex)
			if (!set) return prev

			if (set.saved) {
				Alert.alert('Already saved', 'This set is already saved.')
				return prev
			}

			const err = validateSetBeforeSave(ex, set)
			if (err) {
				Alert.alert('Missing info', err)
				return prev
			}

			const next = { ...prev }
			next.exercises = prev.exercises.map((exercise, i) => {
				if (i !== exerciseIndex) return exercise
				return {
					...exercise,
					sets: exercise.sets.map((s) =>
						s.setIndex === setIndex
							? { ...s, saved: true, savedAt: new Date().toISOString() }
							: s
					)
				}
			})

			if (user?.uid) {
				// Convert weights to lbs for storage before persisting
				const sessionToStore = {
					...next,
					exercises: next.exercises.map((exercise) => ({
						...exercise,
						sets: exercise.sets.map((s) =>
							s.saved
								? { ...s, weight: String(toStoredLbs(s.weight, weightUnit)) }
								: s
						)
					}))
				}
				firestoreUpsertSession(user.uid, sessionToStore)
			}

			const updatedExercise = next.exercises[exerciseIndex]
			const completed = isExerciseCompleted(updatedExercise)

			// Compute stats for the overlay
			const savedSets = updatedExercise.sets.filter((s) => s.saved)
			const totalVolume = savedSets.reduce(
				(sum, s) => sum + Number(s.weight || 0) * Number(s.reps || 0),
				0
			)
			const setVolume = Number(set.weight || 0) * Number(set.reps || 0)
			setSetLoggedData({
				weight: displayWeight(set.weight, weightUnit),
				reps: set.reps,
				totalSets: savedSets.length,
				totalVolume: Math.round(totalVolume),
				setVolume: Math.round(setVolume),
				weightUnit
			})
			setSetLoggedVisible(true)

			if (completed) {
				startRestTimer({
					seconds: 120,
					context: { type: 'exercise', exerciseName: updatedExercise.name }
				})
			} else {
				startRestTimer({
					seconds: 90,
					context: { type: 'set', exerciseName: updatedExercise.name, setIndex }
				})
			}

			return next
		})
	}

	async function finishWorkout() {
		if (!session || !user?.uid || finishing) return

		const hasAnySaved = session.exercises.some((ex) =>
			ex.sets.some((s) => s.saved)
		)

		if (!hasAnySaved) {
			Alert.alert('Nothing saved', 'Save at least one set before finishing.')
			return
		}

		setFinishing(true)
		try {
			const result = await markSessionCompleted(user.uid, session.id)

			cancelTodaysWorkoutReminder()
			stopRestTimer()

			if (result?.weekAdvancement?.programCompleted) {
				Alert.alert('Program Complete! 🏆', result.weekAdvancement.message, [
					{ text: 'Amazing!', onPress: () => router.back() }
				])
			} else if (result?.weekAdvancement?.shouldAdvance) {
				Alert.alert('🎉 Week Complete!', result.weekAdvancement.message, [
					{ text: 'Awesome!', onPress: () => router.back() }
				])
			} else {
				Alert.alert('Workout saved', 'Session marked as completed.')
				router.back()
			}
		} catch (e) {
			console.warn(e)
			setFinishing(false)
			Alert.alert('Error', 'Could not finish the workout.')
		}
	}

	// ============================================================================
	// RENDER
	// ============================================================================

	if (loading || !session) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loadingWrap}>
					<Text style={styles.loadingText}>Loading session…</Text>
				</View>
			</SafeAreaView>
		)
	}

	const currentExercise = session.exercises[activeExerciseIndex]
	const nextExercise = session.exercises[activeExerciseIndex + 1] ?? null

	const goToPrev = () => setActiveExerciseIndex((i) => Math.max(0, i - 1))
	const goToNext = () =>
		setActiveExerciseIndex((i) => Math.min(session.exercises.length - 1, i + 1))

	const restLabel = restSeconds > 0
		? `${Math.floor(restSeconds / 60)}:${String(restSeconds % 60).padStart(2, '0')}`
		: null

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.container}
			>
				<SessionHeader
					session={session}
					currentExerciseIndex={activeExerciseIndex}
					totalExercises={session.exercises.length}
				/>

				{/* Nav row */}
				<View style={styles.navRow}>
					<TouchableOpacity
						style={[styles.navBtn, activeExerciseIndex === 0 && styles.navBtnDisabled]}
						onPress={goToPrev}
						disabled={activeExerciseIndex === 0}
						activeOpacity={0.7}
					>
						<Ionicons name='chevron-back' size={18} color={activeExerciseIndex === 0 ? '#444' : '#FFFFFF'} />
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.addExerciseNavBtn}
						onPress={() => setAddModalVisible(true)}
						activeOpacity={0.8}
					>
						<Ionicons name='add' size={16} color='#AFFF2B' />
						<Text style={styles.addExerciseNavText}>Add Exercise</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.navBtn, activeExerciseIndex === session.exercises.length - 1 && styles.navBtnDisabled]}
						onPress={goToNext}
						disabled={activeExerciseIndex === session.exercises.length - 1}
						activeOpacity={0.7}
					>
						<Ionicons name='chevron-forward' size={18} color={activeExerciseIndex === session.exercises.length - 1 ? '#444' : '#FFFFFF'} />
					</TouchableOpacity>
				</View>

				<ExerciseCard
					exercise={currentExercise}
					exerciseIndex={activeExerciseIndex}
					totalExercises={session.exercises.length}
					isCompleted={isExerciseCompleted(currentExercise)}
					onOpenSwap={openSwapModal}
					removeExercise={removeExercise}
					updateSetField={updateSetField}
					saveSet={saveSet}
					removeSet={removeSet}
					editSet={editSet}
					addSet={addSet}
					normalizeNumberText={normalizeNumberText}
					getPreviousSet={getPreviousSet}
					weightUnit={weightUnit}
				/>

				{/* Inline rest timer banner */}
				{restVisible && restLabel && (
					<View style={styles.restBanner}>
						<Text style={styles.restBannerLabel}>REST TIMER</Text>
						<Text style={styles.restBannerTime}>{restLabel}</Text>
						<View style={styles.restBannerControls}>
							<TouchableOpacity
								style={styles.restControlBtn}
								onPress={() => subtractRest(30)}
								activeOpacity={0.7}
							>
								<Text style={styles.restControlText}>−30s</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.restControlBtn}
								onPress={togglePause}
								activeOpacity={0.7}
							>
								<Text style={styles.restControlText}>{restPaused ? 'Resume' : 'Pause'}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.restControlBtn}
								onPress={() => addRest(30)}
								activeOpacity={0.7}
							>
								<Text style={styles.restControlText}>+30s</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.restControlBtn, styles.restSkipBtn]}
								onPress={skipRest}
								activeOpacity={0.7}
							>
								<Text style={styles.restSkipText}>Skip</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}

				{/* Up Next strip */}
				{nextExercise && (
					<TouchableOpacity style={styles.upNext} onPress={goToNext} activeOpacity={0.8}>
						<View style={styles.upNextLeft}>
							<Text style={styles.upNextLabel}>UP NEXT</Text>
							<Text style={styles.upNextName}>{nextExercise.name}</Text>
						</View>
						<Ionicons name='chevron-forward' size={18} color='#666666' />
					</TouchableOpacity>
				)}

				<SwapExerciseModal
					visible={swapModalVisible}
					onClose={() => {
						setSwapModalVisible(false)
						setSwapExerciseIndex(null)
					}}
					exercise={
						swapExerciseIndex !== null
							? session.exercises[swapExerciseIndex]
							: null
					}
					onSwap={handleSwapExercise}
				/>

				<AddExerciseModal
					visible={addModalVisible}
					onClose={() => setAddModalVisible(false)}
					onAdd={handleAddExercise}
				/>

				<FinishWorkoutButton onFinish={finishWorkout} disabled={finishing} />

				<SetLoggedOverlay
					visible={setLoggedVisible}
					data={setLoggedData}
					onDismiss={() => setSetLoggedVisible(false)}
				/>
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000', paddingTop: 48 },
	container: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
	loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	loadingText: { fontSize: 14, color: '#999999', fontFamily: FontFamily.black },

	navRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12
	},
	navBtn: {
		width: 38,
		height: 38,
		borderRadius: 12,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333',
		alignItems: 'center',
		justifyContent: 'center'
	},
	navBtnDisabled: {
		borderColor: '#222222'
	},
	addExerciseNavBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 14,
		paddingVertical: 9,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: 'rgba(175,255,43,0.3)',
		backgroundColor: 'rgba(175,255,43,0.05)'
	},
	addExerciseNavText: {
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},

	restBanner: {
		backgroundColor: '#111F00',
		borderWidth: 1,
		borderColor: '#2A4A00',
		borderRadius: 16,
		paddingHorizontal: 20,
		paddingTop: 14,
		paddingBottom: 12,
		marginTop: 10,
		gap: 10
	},
	restBannerLabel: {
		fontSize: 11,
		fontFamily: FontFamily.black,
		color: '#7AB520',
		letterSpacing: 1.5
	},
	restBannerTime: {
		fontSize: 36,
		fontFamily: FontFamily.black,
		color: '#AFFF2B',
		lineHeight: 40
	},
	restBannerControls: {
		flexDirection: 'row',
		gap: 8
	},
	restControlBtn: {
		flex: 1,
		paddingVertical: 8,
		borderRadius: 10,
		backgroundColor: 'rgba(175,255,43,0.08)',
		borderWidth: 1,
		borderColor: 'rgba(175,255,43,0.15)',
		alignItems: 'center'
	},
	restControlText: {
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	restSkipBtn: {
		backgroundColor: 'rgba(255,255,255,0.05)',
		borderColor: 'rgba(255,255,255,0.1)'
	},
	restSkipText: {
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#888888'
	},

	upNext: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#0D0D0D',
		borderRadius: 14,
		paddingHorizontal: 18,
		paddingVertical: 14,
		marginTop: 10
	},
	upNextLeft: { gap: 2 },
	upNextLabel: {
		fontSize: 11,
		fontFamily: FontFamily.black,
		color: '#555555',
		letterSpacing: 1.2
	},
	upNextName: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	}
})
