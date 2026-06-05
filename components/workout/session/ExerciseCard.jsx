import { StyleSheet, View } from 'react-native'
import ExerciseHeader from './ExerciseHeader'
import SetTable from './SetTable'

export default function ExerciseCard({
	exercise,
	exerciseIndex,
	isCompleted,
	onToggleExpanded,
	onOpenSwap,
	removeExercise,
	updateSetField,
	saveSet,
	removeSet,
	editSet,
	addSet,
	normalizeNumberText,
	getPreviousSet
}) {
	return (
		<View style={styles.exerciseCard}>
			<ExerciseHeader
				exercise={exercise}
				exerciseIndex={exerciseIndex}
				expanded={exercise.expanded}
				completed={isCompleted}
				onToggle={() => onToggleExpanded(exerciseIndex)}
				onOpenSwap={onOpenSwap}
				removeExercise={removeExercise}
			/>

			{exercise.expanded && (
				<SetTable
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
				/>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	exerciseCard: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 14,
		marginBottom: 12
	}
})
