import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';
import ExercisePickerSheet from './ExercisePickerSheet';

export default function DayExerciseStep({
	dayConfig,
	exercises,
	onChange,
	onNext,
	onBack,
	dayIndex,
	totalDays,
	nextDayLabel
}) {
	const [phase, setPhase] = useState('compound'); // 'compound' | 'accessory' | 'core'
	const [pickerTarget, setPickerTarget] = useState(null);

	// Local state for instant UI feedback — synced from props on day change
	const [localExercises, setLocalExercises] = useState(exercises);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	// Re-sync if the parent switches to a different day
	useEffect(() => {
		setLocalExercises(exercises);
		setPhase('compound');
	}, [dayConfig.id]);

	function updateExercises(next) {
		setLocalExercises(next);
		// Fire-and-forget — don't block UI on Firestore write
		onChangeRef.current(next);
	}

	const compoundExercises = localExercises.filter((e) => e.isCompound && e.muscleGroup !== 'Core');
	const accessoryExercises = localExercises.filter((e) => !e.isCompound && e.muscleGroup !== 'Core');
	const coreExercises = localExercises.filter((e) => e.muscleGroup === 'Core');

	const muscleGroupsWithNoCompound = dayConfig.muscleGroups.filter(
		(mg) => !compoundExercises.some((e) => e.muscleGroup === mg)
	);

	function openPicker(muscleGroup, mode) {
		setPickerTarget({ muscleGroup, mode });
	}

	function closePicker() {
		setPickerTarget(null);
	}

	function handlePickerSelect(exercise) {
		const alreadyIn = localExercises.find((e) => e.exerciseId === exercise.id);
		if (alreadyIn) {
			updateExercises(
				localExercises
					.filter((e) => e.exerciseId !== exercise.id)
					.map((e, i) => ({ ...e, order: i }))
			);
			return;
		}
		const newEntry = {
			exerciseId: exercise.id,
			name: exercise.name,
			muscleGroup: exercise.muscleGroup,
			isCompound: exercise.isCompound,
			sets: '3',
			reps: '10',
			order: localExercises.length
		};
		updateExercises([...localExercises, newEntry]);
	}

	function removeExercise(exerciseId) {
		updateExercises(
			localExercises
				.filter((e) => e.exerciseId !== exerciseId)
				.map((e, i) => ({ ...e, order: i }))
		);
	}

	function updateExerciseField(exerciseId, field, value) {
		updateExercises(
			localExercises.map((e) =>
				e.exerciseId === exerciseId ? { ...e, [field]: value } : e
			)
		);
	}

	function handleDragEnd({ data }) {
		updateExercises(data.map((e, i) => ({ ...e, order: i })));
	}

	function handleNext() {
		if (phase === 'compound') {
			if (compoundExercises.length === 0) {
				Alert.alert(
					'No compound movements',
					'We recommend at least 1 compound movement. Continue anyway?',
					[
						{ text: 'Go Back', style: 'cancel' },
						{ text: 'Continue Anyway', onPress: () => setPhase('accessory') }
					]
				);
				return;
			}
			if (muscleGroupsWithNoCompound.length > 0) {
				Alert.alert(
					'Missing compounds',
					`No compound movement for: ${muscleGroupsWithNoCompound.join(', ')}. Continue anyway?`,
					[
						{ text: 'Go Back', style: 'cancel' },
						{ text: 'Continue', onPress: () => setPhase('accessory') }
					]
				);
				return;
			}
			setPhase('accessory');
			return;
		}

		if (phase === 'accessory') {
			if (localExercises.filter((e) => e.muscleGroup !== 'Core').length === 0) {
				Alert.alert(
					'Add at least one exercise',
					`${dayConfig.label} Day needs at least one movement before you can continue.`,
					[{ text: 'OK' }]
				);
				return;
			}
			const hasMinAccessories = accessoryExercises.length >= 2;
			if (!hasMinAccessories) {
				Alert.alert(
					'Few accessories',
					'We suggest at least 2 accessory movements. Continue anyway?',
					[
						{ text: 'Add More', style: 'cancel' },
						{ text: 'Continue', onPress: () => setPhase('core') }
					]
				);
				return;
			}
			setPhase('core');
			return;
		}

		// core phase — optional, just advance
		onNext();
	}

	const renderDragItem = useCallback(
		({ item, drag, isActive }) => (
			<View style={[styles.exerciseCard, isActive && styles.exerciseCardDragging]}>
				<TouchableOpacity onLongPress={drag} style={styles.dragHandle} activeOpacity={0.6}>
					<Ionicons name='reorder-three-outline' size={22} color='#555555' />
				</TouchableOpacity>

				<View style={styles.exerciseInfo}>
					<Text style={styles.exerciseName}>{item.name}</Text>
					<Text style={styles.exerciseMuscle}>{item.muscleGroup}</Text>
				</View>

				<View style={styles.setsRepsRow}>
					<View style={styles.inputWrap}>
						<TextInput
							style={styles.input}
							value={String(item.sets)}
							onChangeText={(v) =>
								updateExerciseField(item.exerciseId, 'sets', v.replace(/[^0-9]/g, ''))
							}
							keyboardType='number-pad'
							maxLength={2}
							selectTextOnFocus
						/>
						<Text style={styles.inputLabel}>sets</Text>
					</View>
					<Text style={styles.inputDivider}>×</Text>
					<View style={styles.inputWrap}>
						<TextInput
							style={styles.input}
							value={String(item.reps)}
							onChangeText={(v) =>
								updateExerciseField(item.exerciseId, 'reps', v.replace(/[^0-9]/g, ''))
							}
							keyboardType='number-pad'
							maxLength={3}
							selectTextOnFocus
						/>
						<Text style={styles.inputLabel}>reps</Text>
					</View>
				</View>

				<TouchableOpacity
					onPress={() => removeExercise(item.exerciseId)}
					hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
					style={styles.removeBtn}
				>
					<Ionicons name='close-circle' size={20} color='#555555' />
				</TouchableOpacity>
			</View>
		),
		[exercises]
	);

	const displayedExercises =
		phase === 'compound' ? compoundExercises :
		phase === 'accessory' ? accessoryExercises :
		coreExercises;

	return (
		<SafeAreaView style={styles.container} edges={['bottom']}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps='handled'
			>
				{/* Header */}
				<TouchableOpacity
					style={styles.back}
					onPress={
						phase === 'core' ? () => setPhase('accessory') :
						phase === 'accessory' ? () => setPhase('compound') :
						onBack
					}
				>
					<Ionicons name='chevron-back' size={26} color='#AFFF2B' />
				</TouchableOpacity>

				<View style={styles.dayBadgeRow}>
					<View style={styles.dayBadge}>
						<Text style={styles.dayBadgeText}>{dayConfig.label} Day</Text>
					</View>
					<Text style={styles.dayCounter}>
						{dayIndex + 1} of {totalDays}
					</Text>
				</View>

				<Text style={styles.title}>
					{phase === 'compound' ? 'Compound Movements' :
					 phase === 'accessory' ? 'Accessory Movements' :
					 'Core & Abs'}
				</Text>
				<Text style={styles.subtitle}>
					{phase === 'compound' ? 'Choose your heavy, multi-joint movements' :
					 phase === 'accessory' ? 'Add isolation and accessory work' :
					 'Optional — add core work to finish the day'}
				</Text>

				{/* Phase indicator */}
				<View style={styles.phaseRow}>
					<View style={[styles.phaseStep, styles.phaseStepDone]}>
						<Ionicons name='barbell-outline' size={14} color='#000000' />
						<Text style={styles.phaseStepTextDone}>Compounds</Text>
					</View>
					<View style={styles.phaseLine} />
					<View style={[styles.phaseStep, (phase === 'accessory' || phase === 'core') && styles.phaseStepDone]}>
						<Ionicons
							name='fitness-outline'
							size={14}
							color={(phase === 'accessory' || phase === 'core') ? '#000000' : '#555555'}
						/>
						<Text style={(phase === 'accessory' || phase === 'core') ? styles.phaseStepTextDone : styles.phaseStepText}>
							Accessories
						</Text>
					</View>
					<View style={styles.phaseLine} />
					<View style={[styles.phaseStep, phase === 'core' && styles.phaseStepDone]}>
						<Ionicons
							name='body-outline'
							size={14}
							color={phase === 'core' ? '#000000' : '#555555'}
						/>
						<Text style={phase === 'core' ? styles.phaseStepTextDone : styles.phaseStepText}>
							Core
						</Text>
					</View>
				</View>

				{/* Core phase — single section */}
				{phase === 'core' && (
					<View style={styles.mgSection}>
						<View style={styles.mgHeader}>
							<View style={styles.mgTitleRow}>
								<View style={[styles.mgDot, coreExercises.length > 0 && styles.mgDotMet]} />
								<Text style={styles.mgTitle}>Core & Abs</Text>
							</View>
							<Text style={styles.mgSuggestion}>Optional — 0–3 exercises recommended</Text>
						</View>

						{coreExercises.length > 0 && (
							<View style={styles.mgExercises}>
								{coreExercises.map((item) => (
									<View key={item.exerciseId} style={styles.exerciseCard}>
										<View style={styles.exerciseInfo}>
											<Text style={styles.exerciseName}>{item.name}</Text>
										</View>
										<View style={styles.setsRepsRow}>
											<View style={styles.inputWrap}>
												<TextInput
													style={styles.input}
													value={String(item.sets)}
													onChangeText={(v) =>
														updateExerciseField(item.exerciseId, 'sets', v.replace(/[^0-9]/g, ''))
													}
													keyboardType='number-pad'
													maxLength={2}
													selectTextOnFocus
												/>
												<Text style={styles.inputLabel}>sets</Text>
											</View>
											<Text style={styles.inputDivider}>×</Text>
											<View style={styles.inputWrap}>
												<TextInput
													style={styles.input}
													value={String(item.reps)}
													onChangeText={(v) =>
														updateExerciseField(item.exerciseId, 'reps', v.replace(/[^0-9]/g, ''))
													}
													keyboardType='number-pad'
													maxLength={3}
													selectTextOnFocus
												/>
												<Text style={styles.inputLabel}>reps</Text>
											</View>
										</View>
										<TouchableOpacity
											onPress={() => removeExercise(item.exerciseId)}
											hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
											style={styles.removeBtn}
										>
											<Ionicons name='close-circle' size={20} color='#555555' />
										</TouchableOpacity>
									</View>
								))}
							</View>
						)}

						<TouchableOpacity
							style={styles.addBtn}
							onPress={() => setPickerTarget({ muscleGroup: 'Core', mode: 'core' })}
							activeOpacity={0.8}
						>
							<Ionicons name='add-circle-outline' size={18} color='#AFFF2B' />
							<Text style={styles.addBtnText}>Add core exercise</Text>
						</TouchableOpacity>
					</View>
				)}

				{/* Per-muscle-group sections (compound + accessory phases) */}
				{phase !== 'core' && dayConfig.muscleGroups.map((mg) => {
					const suggestions =
						phase === 'compound'
							? dayConfig.compoundSuggestions[mg]
							: dayConfig.accessorySuggestions[mg];

					const mgExercises = displayedExercises.filter((e) => e.muscleGroup === mg);
					const met = suggestions && mgExercises.length >= suggestions.min;

					return (
						<View key={mg} style={styles.mgSection}>
							{/* Muscle group header */}
							<View style={styles.mgHeader}>
								<View style={styles.mgTitleRow}>
									<View style={[styles.mgDot, met && styles.mgDotMet]} />
									<Text style={styles.mgTitle}>{mg}</Text>
								</View>
								{suggestions && (
									<Text style={[styles.mgSuggestion, met && styles.mgSuggestionMet]}>
										{suggestions.label}
									</Text>
								)}
							</View>

							{/* Selected exercises for this muscle group */}
							{mgExercises.length > 0 && (
								<View style={styles.mgExercises}>
									{mgExercises.map((item) => (
										<View key={item.exerciseId} style={styles.exerciseCard}>
											<View style={styles.exerciseInfo}>
												<Text style={styles.exerciseName}>{item.name}</Text>
											</View>
											<View style={styles.setsRepsRow}>
												<View style={styles.inputWrap}>
													<TextInput
														style={styles.input}
														value={String(item.sets)}
														onChangeText={(v) =>
															updateExerciseField(
																item.exerciseId,
																'sets',
																v.replace(/[^0-9]/g, '')
															)
														}
														keyboardType='number-pad'
														maxLength={2}
														selectTextOnFocus
													/>
													<Text style={styles.inputLabel}>sets</Text>
												</View>
												<Text style={styles.inputDivider}>×</Text>
												<View style={styles.inputWrap}>
													<TextInput
														style={styles.input}
														value={String(item.reps)}
														onChangeText={(v) =>
															updateExerciseField(
																item.exerciseId,
																'reps',
																v.replace(/[^0-9]/g, '')
															)
														}
														keyboardType='number-pad'
														maxLength={3}
														selectTextOnFocus
													/>
													<Text style={styles.inputLabel}>reps</Text>
												</View>
											</View>
											<TouchableOpacity
												onPress={() => removeExercise(item.exerciseId)}
												hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
												style={styles.removeBtn}
											>
												<Ionicons name='close-circle' size={20} color='#555555' />
											</TouchableOpacity>
										</View>
									))}
								</View>
							)}

							{/* Add button for this muscle group */}
							<TouchableOpacity
								style={styles.addBtn}
								onPress={() => openPicker(mg, phase)}
								activeOpacity={0.8}
							>
								<Ionicons name='add-circle-outline' size={18} color='#AFFF2B' />
								<Text style={styles.addBtnText}>
									Add {mg} {phase === 'compound' ? 'compound' : 'accessory'}
								</Text>
							</TouchableOpacity>
						</View>
					);
				})}

				{/* Drag-to-reorder section (shown when > 1 exercise across all groups) */}
				{displayedExercises.length > 1 && (
					<View style={styles.reorderSection}>
						<Text style={styles.reorderTitle}>
							Reorder  <Text style={styles.reorderHint}>Long press to drag</Text>
						</Text>
						<DraggableFlatList
							data={displayedExercises}
							keyExtractor={(item) => item.exerciseId}
							onDragEnd={handleDragEnd}
							renderItem={renderDragItem}
							scrollEnabled={false}
							activationDistance={10}
						/>
					</View>
				)}
			</ScrollView>

			<View style={styles.footer}>
				<TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.9}>
					<Text style={styles.btnText}>
						{phase === 'compound'
							? 'Next: Accessories'
							: phase === 'accessory'
							? 'Next: Core & Abs'
							: dayIndex < totalDays - 1
							? `Set up ${nextDayLabel} Day`
							: 'Review Program'}
					</Text>
					<Ionicons name='arrow-forward' size={18} color='#000000' />
				</TouchableOpacity>
			</View>

			{/* Picker scoped to one muscle group */}
			{pickerTarget && (
				<ExercisePickerSheet
					visible={!!pickerTarget}
					muscleGroups={[pickerTarget.muscleGroup]}
					compoundOnly={pickerTarget.mode === 'core' ? null : pickerTarget.mode === 'compound'}
					alreadySelected={localExercises}
					onSelect={handlePickerSelect}
					onClose={closePicker}
				/>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#000000' },
	scroll: { flex: 1 },
	content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
	back: { marginLeft: -8, marginBottom: 16, width: 40, height: 40, justifyContent: 'center' },

	dayBadgeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10
	},
	dayBadge: {
		paddingHorizontal: 12,
		paddingVertical: 5,
		borderRadius: 999,
		backgroundColor: 'rgba(175,255,43,0.12)',
		borderWidth: 1,
		borderColor: 'rgba(175,255,43,0.3)'
	},
	dayBadgeText: { fontSize: 12, fontFamily: FontFamily.black, color: '#AFFF2B' },
	dayCounter: { fontSize: 12, fontWeight: '700', color: '#555555' },

	title: { fontSize: 26, fontFamily: FontFamily.black, color: '#FFFFFF', marginBottom: 6 },
	subtitle: { fontSize: 14, fontWeight: '700', color: '#999999', marginBottom: 20 },

	phaseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
	phaseStep: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333'
	},
	phaseStepDone: { backgroundColor: '#AFFF2B', borderColor: '#AFFF2B' },
	phaseStepText: { fontSize: 12, fontWeight: '800', color: '#555555' },
	phaseStepTextDone: { fontSize: 12, fontWeight: '800', color: '#000000' },
	phaseLine: { flex: 1, height: 1, backgroundColor: '#333333', marginHorizontal: 6 },

	mgSection: {
		marginBottom: 24,
		borderRadius: 16,
		backgroundColor: '#111111',
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 16
	},
	mgHeader: { marginBottom: 12 },
	mgTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
	mgDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#333333'
	},
	mgDotMet: { backgroundColor: '#AFFF2B' },
	mgTitle: { fontSize: 16, fontFamily: FontFamily.black, color: '#FFFFFF' },
	mgSuggestion: { fontSize: 12, fontWeight: '700', color: '#555555' },
	mgSuggestionMet: { color: '#AFFF2B' },

	mgExercises: { marginBottom: 10, gap: 8 },

	exerciseCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		padding: 12,
		borderRadius: 12,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333'
	},
	exerciseCardDragging: {
		backgroundColor: '#222222',
		borderColor: '#AFFF2B',
		shadowColor: '#AFFF2B',
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 6
	},
	dragHandle: { padding: 4 },
	exerciseInfo: { flex: 1 },
	exerciseName: { fontSize: 13, fontFamily: FontFamily.black, color: '#FFFFFF' },
	exerciseMuscle: { fontSize: 11, fontWeight: '700', color: '#555555', marginTop: 2 },

	setsRepsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
	inputWrap: { alignItems: 'center' },
	input: {
		width: 40,
		height: 36,
		borderRadius: 8,
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#333333',
		color: '#FFFFFF',
		fontFamily: FontFamily.black,
		fontSize: 16,
		textAlign: 'center'
	},
	inputLabel: { fontSize: 9, fontWeight: '800', color: '#555555', marginTop: 2 },
	inputDivider: { fontSize: 14, color: '#555555', fontFamily: FontFamily.black, marginBottom: 10 },
	removeBtn: { padding: 4 },

	addBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 12,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#2A2A2A',
		borderStyle: 'dashed',
		backgroundColor: '#0D0D0D'
	},
	addBtnText: { fontSize: 14, fontFamily: FontFamily.black, color: '#AFFF2B' },

	reorderSection: { marginTop: 4, marginBottom: 8 },
	reorderTitle: { fontSize: 13, fontFamily: FontFamily.black, color: '#FFFFFF', marginBottom: 10 },
	reorderHint: { fontSize: 12, fontWeight: '700', color: '#555555' },

	footer: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12 },
	btn: {
		height: 56,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8
	},
	btnText: { fontSize: 18, fontFamily: FontFamily.black, color: '#000000' }
});
