import CycleLengthStep from '@/components/program-builder/CycleLengthStep';
import DayExerciseStep from '@/components/program-builder/DayExerciseStep';
import DaysPerWeekStep from '@/components/program-builder/DaysPerWeekStep';
import ReviewStep from '@/components/program-builder/ReviewStep';
import SplitStep from '@/components/program-builder/SplitStep';
import { useAuth } from '@/context/AuthContext';
import { getProfile } from '@/controllers/profileController';
import { useProgramBuilder } from '@/hooks/useProgramBuilder';
import { getSplitConfig } from '@/utils/splitConfig';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Steps:
// 0 = SplitStep
// 1 = DaysPerWeekStep
// 2 = CycleLengthStep
// 3..N = DayExerciseStep per day
// N+1 = ReviewStep

export default function ProgramBuilderScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const [initialSplitType, setInitialSplitType] = useState(null);
	const [profileLoaded, setProfileLoaded] = useState(false);

	// Load splitType saved during onboarding
	useEffect(() => {
		if (!user?.uid) return;
		getProfile(user.uid)
			.then((p) => {
				setInitialSplitType(p?.splitType ?? null);
			})
			.catch(console.warn)
			.finally(() => setProfileLoaded(true));
	}, [user?.uid]);

	const {
		state,
		loading,
		saving,
		setSplitType,
		setDaysPerWeek,
		setCycleLength,
		saveDayExercises,
		finalize
	} = useProgramBuilder(initialSplitType);

	const [currentStep, setCurrentStep] = useState(0);
	// For day steps, track which day index we're editing
	const [editingDayIndex, setEditingDayIndex] = useState(0);

	const splitConfig = getSplitConfig(state.splitType);
	const days = splitConfig?.days ?? [];

	// Total steps: Split + DaysPerWeek + CycleLength + days.length + Review
	const dayStepStart = 3;
	const reviewStep = dayStepStart + days.length;
	const totalSteps = reviewStep + 1;

	// Calculate a progress fraction for the top bar
	const progress = totalSteps > 1 ? currentStep / (totalSteps - 1) : 0;

	function goNext() {
		setCurrentStep((s) => s + 1);
	}

	function goBack() {
		setCurrentStep((s) => Math.max(0, s - 1));
	}

	function goToDay(dayIndex) {
		setEditingDayIndex(dayIndex);
		setCurrentStep(dayStepStart + dayIndex);
	}

	async function handleSetSplit(splitType) {
		await setSplitType(splitType);
	}

	async function handleSetDaysPerWeek(n) {
		await setDaysPerWeek(n);
	}

	async function handleSetCycleLength(n) {
		await setCycleLength(n);
	}

	async function handleDayExercisesChange(dayId, exercises) {
		await saveDayExercises(dayId, exercises);
	}

	async function handleConfirm() {
		// Block finalizing if any day is missing exercises
		const emptyDays = days.filter((d) => {
			const saved = state.days.find((sd) => sd.id === d.id);
			return !saved || saved.exercises.length === 0;
		});

		if (emptyDays.length > 0) {
			Alert.alert(
				'Incomplete program',
				`Add at least one exercise to: ${emptyDays
					.map((d) => `${d.label} Day`)
					.join(', ')}.`,
				[{ text: 'OK' }]
			);
			return;
		}

		await finalize();
		router.replace('/(tabs)');
	}

	if (!profileLoaded || loading) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.center}>
					<ActivityIndicator size='large' color='#AFFF2B' />
				</View>
			</SafeAreaView>
		);
	}

	function renderStep() {
		if (currentStep === 0) {
			return (
				<SplitStep
					splitType={state.splitType}
					onSelect={handleSetSplit}
					onNext={goNext}
				/>
			);
		}

		if (currentStep === 1) {
			return (
				<DaysPerWeekStep
					splitType={state.splitType}
					daysPerWeek={state.daysPerWeek}
					onSelect={handleSetDaysPerWeek}
					onNext={goNext}
					onBack={goBack}
				/>
			);
		}

		if (currentStep === 2) {
			return (
				<CycleLengthStep
					cycleLength={state.cycleLength}
					onSelect={handleSetCycleLength}
					onNext={goNext}
					onBack={goBack}
				/>
			);
		}

		if (currentStep >= dayStepStart && currentStep < reviewStep) {
			const dayIndex = currentStep - dayStepStart;
			const dayConfig = days[dayIndex];
			const savedDay = state.days.find((d) => d.id === dayConfig.id);
			const exercises = savedDay?.exercises ?? [];

			return (
				<DayExerciseStep
					key={dayConfig.id}
					dayConfig={dayConfig}
					exercises={exercises}
					onChange={(exs) => handleDayExercisesChange(dayConfig.id, exs)}
					onNext={goNext}
					onBack={goBack}
					dayIndex={dayIndex}
					totalDays={days.length}
					nextDayLabel={days[dayIndex + 1]?.label ?? null}
				/>
			);
		}

		if (currentStep === reviewStep) {
			return (
				<ReviewStep
					state={state}
					onEditDay={(dayId) => {
						const idx = days.findIndex((d) => d.id === dayId);
						if (idx >= 0) goToDay(idx);
					}}
					onConfirm={handleConfirm}
					onBack={goBack}
					saving={saving}
				/>
			);
		}

		return null;
	}

	// DayExerciseStep manages its own SafeAreaView (top + bottom) to recover
	// from safe area context disruption caused by the fullScreen exercise picker modal.
	// All other steps rely on this parent SafeAreaView.
	return (
		<SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
			{/* Progress bar */}
			<View style={styles.progressTrack}>
				<View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
			</View>

			{renderStep()}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	progressTrack: {
		height: 3,
		backgroundColor: '#1A1A1A',
		width: '100%'
	},
	progressFill: {
		height: 3,
		backgroundColor: '#AFFF2B',
		borderRadius: 999
	}
});
