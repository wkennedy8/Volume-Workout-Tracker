import { FontFamily } from '@/constants/fonts'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import SetCards from './SetCards'

export default function ExerciseCard({
	exercise,
	exerciseIndex,
	totalExercises,
	isCompleted,
	onOpenSwap,
	removeExercise,
	updateSetField,
	saveSet,
	removeSet,
	editSet,
	addSet,
	normalizeNumberText,
	getPreviousSet,
	weightUnit = 'lbs'
}) {
	return (
		<View style={styles.card}>
			{/* Header row */}
			<View style={styles.headerRow}>
				<Text style={styles.exerciseName}>{exercise.name}</Text>
				<View style={styles.headerRight}>
					<View style={[styles.counterBadge, isCompleted && styles.counterBadgeDone]}>
						<Text style={[styles.counterText, isCompleted && styles.counterTextDone]}>
							Exercise {exerciseIndex + 1}/{totalExercises}
						</Text>
					</View>
					<TouchableOpacity
						style={styles.iconBtn}
						onPress={() => onOpenSwap(exerciseIndex)}
						activeOpacity={0.7}
					>
						<Ionicons name='swap-horizontal' size={16} color='#AFFF2B' />
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.iconBtn, styles.iconBtnRed]}
						onPress={() => removeExercise(exerciseIndex)}
						activeOpacity={0.7}
					>
						<Ionicons name='trash-outline' size={15} color='#F87171' />
					</TouchableOpacity>
				</View>
			</View>

			{exercise.isSwapped && (
				<Text style={styles.swappedBadge}>Swapped from {exercise.originalName}</Text>
			)}

			<Text style={styles.meta}>
				{exercise.targetSets} sets · {exercise.targetReps}{' '}
				{String(exercise.targetReps).toLowerCase() === 'time' ? '' : 'reps'}
			</Text>

			<SetCards
				exercise={exercise}
				exerciseIndex={exerciseIndex}
				sets={exercise.sets}
				updateSetField={updateSetField}
				saveSet={saveSet}
				removeSet={removeSet}
				editSet={editSet}
				addSet={addSet}
				normalizeNumberText={normalizeNumberText}
				getPreviousSet={getPreviousSet}
				weightUnit={weightUnit}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderColor: '#2A2A2A',
		borderRadius: 20,
		backgroundColor: '#111111',
		padding: 18,
		marginBottom: 12
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		gap: 8
	},
	exerciseName: {
		fontSize: 20,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		flex: 1
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	counterBadge: {
		backgroundColor: '#1E2D0A',
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 5
	},
	counterBadgeDone: {
		backgroundColor: 'rgba(175,255,43,0.15)'
	},
	counterText: {
		fontSize: 12,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	counterTextDone: {
		color: '#AFFF2B'
	},
	iconBtn: {
		width: 32,
		height: 32,
		borderRadius: 9,
		backgroundColor: 'rgba(175, 255, 43, 0.08)',
		borderWidth: 1,
		borderColor: 'rgba(175,255,43,0.25)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	iconBtnRed: {
		backgroundColor: 'rgba(248, 113, 113, 0.08)',
		borderColor: 'rgba(248,113,113,0.25)'
	},
	swappedBadge: {
		fontSize: 11,
		fontFamily: FontFamily.black,
		color: '#FBBF24',
		marginTop: 4
	},
	meta: {
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#666666',
		marginTop: 4
	}
})
