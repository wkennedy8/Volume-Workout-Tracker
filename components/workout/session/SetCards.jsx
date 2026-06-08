import { FontFamily } from '@/constants/fonts'
import { displayWeight } from '@/utils/unitsUtils'
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

function SavedSetCard({ set, weightUnit, onEdit }) {
	return (
		<TouchableOpacity style={styles.savedCard} onPress={() => onEdit(set.setIndex)} activeOpacity={0.7}>
			<Text style={styles.savedWeight}>{displayWeight(set.weight, weightUnit)}</Text>
			<Text style={styles.savedReps}>{set.reps} reps</Text>
		</TouchableOpacity>
	)
}

function ActiveSetCard({ set, exerciseIndex, weightUnit, updateSetField, saveSet, normalizeNumberText }) {
	return (
		<View style={styles.activeCard}>
			<View style={styles.activeFields}>
				<View style={styles.activeField}>
					<Text style={styles.activeFieldLabel}>{weightUnit === 'kg' ? 'KG' : 'LBS'}</Text>
					<TextInput
						value={String(set.weight)}
						onChangeText={(t) =>
							updateSetField(exerciseIndex, set.setIndex, {
								weight: normalizeNumberText(t, { decimals: 1 })
							})
						}
						placeholder='—'
						placeholderTextColor='rgba(13,26,0,0.5)'
						keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
						style={styles.activeInput}
						selectTextOnFocus
					/>
				</View>
				<View style={styles.activeFieldDivider} />
				<View style={styles.activeField}>
					<Text style={styles.activeFieldLabel}>REPS</Text>
					<TextInput
						value={String(set.reps)}
						onChangeText={(t) =>
							updateSetField(exerciseIndex, set.setIndex, {
								reps: normalizeNumberText(t, { decimals: 0 })
							})
						}
						placeholder='—'
						placeholderTextColor='rgba(13,26,0,0.5)'
						keyboardType='numeric'
						style={styles.activeInput}
						selectTextOnFocus
					/>
				</View>
			</View>
			<TouchableOpacity style={styles.activeCheckBtn} onPress={() => saveSet(exerciseIndex, set.setIndex)} activeOpacity={0.8}>
				<Text style={styles.activeCheckText}>Save Set</Text>
			</TouchableOpacity>
		</View>
	)
}

function PendingSetCard({ set, exerciseIndex, updateSetField, removeSet, canRemove }) {
	return (
		<View style={styles.pendingCard}>
			<TouchableOpacity
				style={styles.pendingBtn}
				onPress={() => updateSetField(exerciseIndex, set.setIndex, { reps: String(Math.max(0, Number(set.reps || 0) + 1)) })}
				activeOpacity={0.7}
			>
				<Text style={styles.pendingBtnText}>+</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.pendingBtn}
				onPress={() => updateSetField(exerciseIndex, set.setIndex, { reps: String(Math.max(0, Number(set.reps || 0) - 1)) })}
				activeOpacity={0.7}
			>
				<Text style={styles.pendingBtnText}>−</Text>
			</TouchableOpacity>
		</View>
	)
}

export default function SetCards({
	exercise,
	exerciseIndex,
	sets,
	updateSetField,
	saveSet,
	removeSet,
	editSet,
	addSet,
	normalizeNumberText,
	weightUnit = 'lbs'
}) {
	const firstUnsavedIndex = sets.findIndex((s) => !s.saved)

	return (
		<View style={styles.container}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.scroll}
			>
				{sets.map((set, i) => {
					if (set.saved) {
						return (
							<SavedSetCard
								key={set.setIndex}
								set={set}
								weightUnit={weightUnit}
								onEdit={(idx) => editSet(exerciseIndex, idx)}
							/>
						)
					}
					if (i === firstUnsavedIndex) {
						return (
							<ActiveSetCard
								key={set.setIndex}
								set={set}
								exerciseIndex={exerciseIndex}
								weightUnit={weightUnit}
								updateSetField={updateSetField}
								saveSet={saveSet}
								normalizeNumberText={normalizeNumberText}
							/>
						)
					}
					return (
						<PendingSetCard
							key={set.setIndex}
							set={set}
							exerciseIndex={exerciseIndex}
							updateSetField={updateSetField}
							removeSet={removeSet}
							canRemove={sets.length > 1}
						/>
					)
				})}

				<TouchableOpacity style={styles.addCard} onPress={() => addSet(exerciseIndex)} activeOpacity={0.7}>
					<Text style={styles.addCardText}>+</Text>
				</TouchableOpacity>
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { marginTop: 14 },
	scroll: { paddingHorizontal: 2, gap: 10, paddingBottom: 4 },

	savedCard: {
		width: 90,
		height: 90,
		borderRadius: 16,
		backgroundColor: '#1E2D0A',
		borderWidth: 1,
		borderColor: '#2E4A10',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4
	},
	savedWeight: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	savedReps: {
		fontSize: 12,
		fontFamily: FontFamily.black,
		color: '#7AB520'
	},

	activeCard: {
		width: 200,
		borderRadius: 16,
		backgroundColor: '#AFFF2B',
		padding: 12,
		gap: 10
	},
	activeFields: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 0
	},
	activeField: {
		flex: 1,
		alignItems: 'center',
		gap: 2
	},
	activeFieldLabel: {
		fontSize: 10,
		fontFamily: FontFamily.black,
		color: 'rgba(0,40,0,0.55)',
		letterSpacing: 1.2
	},
	activeFieldDivider: {
		width: 1,
		height: 36,
		backgroundColor: 'rgba(0,40,0,0.15)',
		marginHorizontal: 6
	},
	activeInput: {
		fontSize: 26,
		fontFamily: FontFamily.black,
		color: '#0D1A00',
		textAlign: 'center',
		paddingVertical: 0,
		minWidth: 60
	},
	activeCheckBtn: {
		backgroundColor: 'rgba(0,0,0,0.15)',
		borderRadius: 10,
		paddingVertical: 7,
		alignItems: 'center'
	},
	activeCheckText: {
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#0D1A00',
		letterSpacing: 0.5
	},

	pendingCard: {
		width: 90,
		height: 90,
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4
	},
	pendingBtn: {
		width: 36,
		height: 26,
		borderRadius: 8,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},
	pendingBtnText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		lineHeight: 22
	},

	addCard: {
		width: 90,
		height: 90,
		borderRadius: 16,
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: '#333333',
		borderStyle: 'dashed',
		alignItems: 'center',
		justifyContent: 'center'
	},
	addCardText: {
		fontSize: 28,
		fontFamily: FontFamily.black,
		color: '#444444'
	}
})
