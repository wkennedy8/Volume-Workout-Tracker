import { getExercises } from '@/controllers/exerciseController';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { FontFamily } from '../constants/fonts';

export default function SwapExerciseModal({ visible, onClose, exercise, onSwap }) {
	const [allExercises, setAllExercises] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');

	const currentName = exercise?.name;

	// Load the full library once when opened
	useEffect(() => {
		if (!visible) return;
		setLoading(true);
		setSearch('');
		getExercises()
			.then(setAllExercises)
			.catch((e) => {
				console.warn('Failed to load swap options:', e);
				setAllExercises([]);
			})
			.finally(() => setLoading(false));
	}, [visible]);

	// Resolve the muscle group: prefer the value stored on the exercise, otherwise
	// derive it by matching the exercise name against the library.
	const muscleGroup = useMemo(() => {
		if (exercise?.muscleGroup) return exercise.muscleGroup;
		const match = allExercises.find(
			(ex) => ex.name === (exercise?.originalName || exercise?.name)
		);
		return match?.muscleGroup ?? null;
	}, [exercise, allExercises]);

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		return allExercises
			.filter((ex) => !muscleGroup || ex.muscleGroup === muscleGroup)
			.filter((ex) => ex.name !== currentName)
			.filter((ex) => query === '' || ex.name.toLowerCase().includes(query));
	}, [allExercises, muscleGroup, search, currentName]);

	if (!exercise) return null;

	function handleSwap(libraryExercise) {
		onSwap(libraryExercise);
		onClose();
	}

	function equipmentIcon(equipment) {
		switch (equipment) {
			case 'Barbell':
			case 'EZ Bar':
				return 'barbell';
			case 'Dumbbell':
				return 'fitness';
			case 'Cable':
				return 'git-branch';
			case 'Machine':
				return 'construct';
			case 'Bodyweight':
				return 'body';
			case 'Resistance Band':
				return 'infinite';
			default:
				return 'fitness';
		}
	}

	return (
		<Modal
			visible={visible}
			transparent
			animationType='slide'
			onRequestClose={onClose}
		>
			<View style={styles.backdrop}>
				<View style={styles.modalCard}>
					{/* Header */}
					<View style={styles.header}>
						<View style={styles.headerText}>
							<Text style={styles.title}>Swap Exercise</Text>
							<Text style={styles.subtitle}>
								{muscleGroup ? `${muscleGroup} alternatives` : 'Choose an alternative'}
							</Text>
						</View>
						<TouchableOpacity
							onPress={onClose}
							style={styles.closeButton}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Ionicons name='close' size={24} color='#999999' />
						</TouchableOpacity>
					</View>

					{/* Current Exercise */}
					<View style={styles.currentExercise}>
						<Text style={styles.currentLabel}>Current Exercise</Text>
						<View style={styles.currentCard}>
							<Ionicons name='fitness' size={20} color='#AFFF2B' />
							<Text style={styles.currentName}>{exercise.name}</Text>
						</View>
					</View>

					{/* Search */}
					<View style={styles.searchRow}>
						<Ionicons name='search' size={18} color='#666666' />
						<TextInput
							style={styles.searchInput}
							placeholder='Search exercises...'
							placeholderTextColor='#666666'
							value={search}
							onChangeText={setSearch}
							autoCorrect={false}
						/>
						{search.length > 0 && (
							<TouchableOpacity
								onPress={() => setSearch('')}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
							>
								<Ionicons name='close-circle' size={18} color='#666666' />
							</TouchableOpacity>
						)}
					</View>

					{/* Alternatives List */}
					{loading ? (
						<View style={styles.loadingWrap}>
							<ActivityIndicator size='large' color='#AFFF2B' />
						</View>
					) : (
						<ScrollView
							style={styles.alternativesList}
							showsVerticalScrollIndicator={false}
							keyboardShouldPersistTaps='handled'
						>
							{filtered.length === 0 ? (
								<View style={styles.emptyState}>
									<Text style={styles.emptyText}>
										No alternatives available
									</Text>
								</View>
							) : (
								filtered.map((alt) => (
									<TouchableOpacity
										key={alt.id}
										style={styles.alternativeCard}
										onPress={() => handleSwap(alt)}
										activeOpacity={0.7}
									>
										<View style={styles.alternativeLeft}>
											<Ionicons name='swap-horizontal' size={18} color='#666666' />
											<Text style={styles.alternativeName} numberOfLines={1}>
												{alt.name}
											</Text>
										</View>

										<View style={styles.alternativeRight}>
											<View style={styles.typeBadge}>
												<Text style={styles.typeBadgeText}>
													{alt.isCompound ? 'Compound' : 'Accessory'}
												</Text>
											</View>
											<View style={styles.equipmentRow}>
												<Ionicons
													name={equipmentIcon(alt.equipment)}
													size={12}
													color='#666666'
												/>
												<Text style={styles.equipmentText}>{alt.equipment}</Text>
											</View>
										</View>
									</TouchableOpacity>
								))
							)}
						</ScrollView>
					)}

					{/* Info Footer */}
					<View style={styles.footer}>
						<Ionicons name='information-circle' size={16} color='#666666' />
						<Text style={styles.footerText}>
							This swap is for this session only
						</Text>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.85)',
		justifyContent: 'flex-end'
	},
	modalCard: {
		backgroundColor: '#1A1A1A',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 24,
		paddingBottom: 40,
		paddingHorizontal: 20,
		height: '80%',
		borderTopWidth: 1,
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderColor: '#333333'
	},

	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 20
	},
	headerText: { flex: 1 },
	title: {
		fontSize: 24,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 4
	},
	subtitle: {
		fontSize: 14,
		fontFamily: FontFamily.bold,
		color: '#666666'
	},
	closeButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#2A2A2A',
		alignItems: 'center',
		justifyContent: 'center'
	},

	currentExercise: {
		marginBottom: 16
	},
	currentLabel: {
		fontSize: 12,
		fontFamily: FontFamily.black,
		color: '#666666',
		marginBottom: 8,
		textTransform: 'uppercase',
		letterSpacing: 0.5
	},
	currentCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		borderWidth: 1,
		borderColor: '#AFFF2B',
		borderRadius: 12,
		padding: 14
	},
	currentName: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		flex: 1
	},

	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 10,
		marginBottom: 14
	},
	searchInput: {
		flex: 1,
		fontSize: 15,
		fontFamily: FontFamily.bold,
		color: '#FFFFFF'
	},

	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	alternativesList: {
		flex: 1
	},
	alternativeCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		padding: 14,
		marginBottom: 10
	},
	alternativeLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1,
		marginRight: 10
	},
	alternativeName: {
		fontSize: 15,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		flex: 1
	},
	alternativeRight: {
		alignItems: 'flex-end',
		gap: 6
	},
	typeBadge: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 6,
		backgroundColor: 'rgba(175, 255, 43, 0.1)'
	},
	typeBadgeText: {
		fontSize: 11,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	equipmentRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4
	},
	equipmentText: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#666666'
	},

	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40
	},
	emptyText: {
		fontSize: 14,
		fontFamily: FontFamily.bold,
		color: '#666666',
		textAlign: 'center'
	},

	footer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginTop: 16,
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: '#333333'
	},
	footerText: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#666666',
		flex: 1
	}
});
