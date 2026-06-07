import { FontFamily } from '@/constants/fonts';
import { displayWeight, weightUnitLabel } from '@/utils/unitsUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import {
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

export default function SetRow({
	set,
	exerciseIndex,
	canRemove,
	updateSetField,
	saveSet,
	removeSet,
	editSet,
	normalizeNumberText,
	previousSet,
	weightUnit = 'lbs'
}) {
	const swipeableRef = useRef(null);

	const renderRightActions = (progress, dragX) => {
		if (set.saved) return null;

		return canRemove ? (
			<TouchableOpacity
				style={styles.deleteAction}
				onPress={() => {
					swipeableRef.current?.close();
					removeSet(exerciseIndex, set.setIndex);
				}}
				activeOpacity={0.9}
			>
				<Text style={styles.deleteActionText}>Delete</Text>
			</TouchableOpacity>
		) : null;
	};

	return (
		<Swipeable
			ref={swipeableRef}
			renderRightActions={renderRightActions}
			rightThreshold={40}
			friction={2}
			overshootRight={false}
		>
			<View style={styles.tableRow}>
				{/* Set Number */}
				<Text style={[styles.tdSet, { width: 50 }]}>{set.setIndex}</Text>

				{/* PREV COLUMN - shows previous session data */}
				<Text style={[styles.prevText, { flex: 1 }]}>
					{previousSet ? `${displayWeight(previousSet.weight, weightUnit)}${weightUnitLabel(weightUnit)} x ${previousSet.reps}` : '—'}
				</Text>

				{/* Weight Input */}
				<TextInput
					value={String(set.weight)}
					onChangeText={(t) =>
						updateSetField(exerciseIndex, set.setIndex, {
							weight: normalizeNumberText(t, { decimals: 1 })
						})
					}
					editable={!set.saved}
					placeholder='0'
					placeholderTextColor='#9CA3AF'
					keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
					style={[
						styles.inputCell,
						{ width: 80 },
						set.saved && styles.inputCellSaved
					]}
				/>

				{/* Reps Input */}
				<TextInput
					value={String(set.reps)}
					onChangeText={(t) =>
						updateSetField(exerciseIndex, set.setIndex, {
							reps: normalizeNumberText(t, { decimals: 0 })
						})
					}
					editable={!set.saved}
					placeholder='0'
					placeholderTextColor='#9CA3AF'
					keyboardType='numeric'
					style={[
						styles.inputCell,
						{ width: 80 },
						set.saved && styles.inputCellSaved
					]}
				/>

				{/* Checkmark / Save Button */}
				<View style={{ width: 40 }}>
					{set.saved ? (
						<TouchableOpacity
							onPress={() => editSet(exerciseIndex, set.setIndex)}
							style={styles.checkmarkContainer}
						>
							<Ionicons name='checkmark' size={18} color='#AFFF2B' />
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							style={styles.checkmarkButton}
							onPress={() => saveSet(exerciseIndex, set.setIndex)}
						>
							<View style={styles.checkmarkEmpty} />
						</TouchableOpacity>
					)}
				</View>
			</View>
		</Swipeable>
	);
}

const styles = StyleSheet.create({
	tableRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 4,
		gap: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#374151'
	},
	tdSet: {
		fontSize: 14,
		fontWeight: '900',
		color: '#FFFFFF',
		textAlign: 'center'
	},
	prevText: {
		fontSize: 13,
		fontFamily: FontFamily.regular,
		color: '#6B7280'
	},
	inputCell: {
		height: 44,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		paddingHorizontal: 12,
		fontSize: 14,
		fontFamily: FontFamily.black,
		fontWeight: '800',
		color: '#FFFFFF',
		backgroundColor: '#0D0D0D'
	},
	inputCellSaved: { color: '#999999' },
	deleteAction: {
		backgroundColor: '#FF453A',
		justifyContent: 'center',
		alignItems: 'flex-end',
		paddingHorizontal: 20,
		marginBottom: 8,
		borderTopRightRadius: 12,
		borderBottomRightRadius: 12,
		marginLeft: 10
	},
	deleteActionText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontFamily: FontFamily.black,
		fontWeight: '900'
	},
	checkmarkContainer: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center'
	},
	checkmarkButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center'
	},
	checkmarkEmpty: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#6B7280',
		backgroundColor: 'transparent'
	}
});
