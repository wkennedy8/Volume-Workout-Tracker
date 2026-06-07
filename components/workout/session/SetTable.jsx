import { FontFamily } from '@/constants/fonts';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SetRow from './SetRow';

export default function SetTable({
	exercise,
	exerciseIndex,
	sets,
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
		<View style={styles.container}>
			{/* Table Header */}
			<View style={styles.tableHeader}>
				<Text style={[styles.tableHeaderText, { width: 50 }]}>Set</Text>
				<Text style={[styles.tableHeaderText, { flex: 1 }]}>Prev</Text>
				<Text style={[styles.tableHeaderText, { width: 80 }]}>{weightUnit === 'kg' ? 'KG' : 'LB'}</Text>
				<Text style={[styles.tableHeaderText, { width: 80 }]}>Reps</Text>
				<View style={{ width: 40 }} />
			</View>

			{/* Set Rows */}
			{sets.map((set) => {
				const prevSet = getPreviousSet(exercise.name, set.setIndex);
				return (
					<SetRow
						key={`${exercise.name}-${set.setIndex}`}
						set={set}
						exerciseIndex={exerciseIndex}
						canRemove={!set.saved && sets.length > 1}
						updateSetField={updateSetField}
						saveSet={saveSet}
						removeSet={removeSet}
						editSet={editSet}
						normalizeNumberText={normalizeNumberText}
						previousSet={prevSet}
						weightUnit={weightUnit}
					/>
				);
			})}

			{/* Add Set Button */}
			<TouchableOpacity
				style={styles.addSetButton}
				onPress={() => addSet(exerciseIndex)}
				activeOpacity={0.9}
			>
				<Text style={styles.addSetButtonText}>+ Add Set</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginTop: 10
	},
	tableHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 4,
		gap: 8,
		marginBottom: 4
	},
	tableHeaderText: {
		fontSize: 12,
		fontFamily: FontFamily.black,
		color: '#9CA3AF',
		textTransform: 'uppercase'
	},
	addSetButton: {
		marginTop: 8,
		height: 44,
		borderRadius: 12,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: '#333333'
	},
	addSetButtonText: {
		color: '#AFFF2B',
		fontSize: 14,
		fontFamily: FontFamily.black
	}
});
