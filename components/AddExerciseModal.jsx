import { getExercises } from '@/controllers/exerciseController'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import {
	ActivityIndicator,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native'
import { FontFamily } from '../constants/fonts'

const MUSCLE_GROUP_ORDER = [
	'Chest',
	'Back',
	'Shoulders',
	'Biceps',
	'Triceps',
	'Legs',
	'Glutes',
	'Core'
]

export default function AddExerciseModal({ visible, onClose, onAdd }) {
	const [exercises, setExercises] = useState([])
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')
	const [selectedGroup, setSelectedGroup] = useState('All')

	// Load the exercise library from Firestore when opened
	useEffect(() => {
		if (!visible) return
		setLoading(true)
		setSearch('')
		setSelectedGroup('All')
		getExercises()
			.then(setExercises)
			.catch((e) => {
				console.warn('Failed to load exercise library:', e)
				setExercises([])
			})
			.finally(() => setLoading(false))
	}, [visible])

	// Build the muscle-group filter list from what actually loaded
	const muscleGroups = useMemo(() => {
		const present = new Set(exercises.map((ex) => ex.muscleGroup))
		return MUSCLE_GROUP_ORDER.filter((g) => present.has(g))
	}, [exercises])

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase()
		return exercises.filter((ex) => {
			const matchesGroup =
				selectedGroup === 'All' || ex.muscleGroup === selectedGroup
			const matchesSearch =
				query === '' || ex.name.toLowerCase().includes(query)
			return matchesGroup && matchesSearch
		})
	}, [exercises, search, selectedGroup])

	function handleAdd(exercise) {
		onAdd(exercise)
		onClose()
		setSearch('')
		setSelectedGroup('All')
	}

	function handleClose() {
		onClose()
		setSearch('')
		setSelectedGroup('All')
	}

	function equipmentIcon(equipment) {
		switch (equipment) {
			case 'Barbell':
				return 'barbell'
			case 'Dumbbell':
				return 'fitness'
			case 'Cable':
				return 'git-branch'
			case 'Machine':
				return 'construct'
			case 'Bodyweight':
				return 'body'
			case 'EZ Bar':
				return 'barbell'
			case 'Resistance Band':
				return 'infinite'
			default:
				return 'fitness'
		}
	}

	function muscleGroupColor(group) {
		switch (group) {
			case 'Chest':
				return '#EF4444'
			case 'Back':
				return '#3B82F6'
			case 'Shoulders':
				return '#F59E0B'
			case 'Biceps':
				return '#10B981'
			case 'Triceps':
				return '#8B5CF6'
			case 'Legs':
				return '#EC4899'
			case 'Glutes':
				return '#F97316'
			case 'Core':
				return '#06B6D4'
			default:
				return '#6B7280'
		}
	}

	return (
		<Modal
			visible={visible}
			transparent
			animationType='slide'
			onRequestClose={handleClose}
		>
			<View style={styles.backdrop}>
				<View style={styles.modalCard}>
					{/* Header */}
					<View style={styles.header}>
						<View>
							<Text style={styles.title}>Add Exercise</Text>
							<Text style={styles.subtitle}>Search the exercise library</Text>
						</View>
						<TouchableOpacity
							onPress={handleClose}
							style={styles.closeButton}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Ionicons name='close' size={24} color='#999999' />
						</TouchableOpacity>
					</View>

					{/* Search Input */}
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

					{/* Muscle Group Filter */}
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.filterScroll}
						contentContainerStyle={styles.filterContent}
					>
						{['All', ...muscleGroups].map((group) => {
							const active = selectedGroup === group
							const color =
								group === 'All' ? '#AFFF2B' : muscleGroupColor(group)
							return (
								<TouchableOpacity
									key={group}
									onPress={() => setSelectedGroup(group)}
									style={[
										styles.filterPill,
										active && {
											backgroundColor: `${color}20`,
											borderColor: color
										}
									]}
									activeOpacity={0.7}
								>
									<Text style={[styles.filterPillText, active && { color }]}>
										{group}
									</Text>
								</TouchableOpacity>
							)
						})}
					</ScrollView>

					{/* Results count */}
					<Text style={styles.resultsCount}>
						{loading
							? 'Loading…'
							: `${filtered.length} exercise${filtered.length !== 1 ? 's' : ''}`}
					</Text>

					{/* Exercise List */}
					{loading ? (
						<View style={styles.loadingWrap}>
							<ActivityIndicator size='large' color='#AFFF2B' />
						</View>
					) : (
					<ScrollView
						style={styles.list}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps='handled'
					>
						{filtered.length === 0 ? (
							<View style={styles.emptyState}>
								<Ionicons name='search-outline' size={40} color='#333333' />
								<Text style={styles.emptyText}>No exercises found</Text>
							</View>
						) : (
							filtered.map((exercise) => {
								const groupColor = muscleGroupColor(exercise.muscleGroup)
								return (
									<TouchableOpacity
										key={exercise.id}
										style={styles.exerciseRow}
										onPress={() => handleAdd(exercise)}
										activeOpacity={0.7}
									>
										<View style={styles.exerciseInfo}>
											<Text style={styles.exerciseName}>{exercise.name}</Text>
											<View style={styles.exerciseMeta}>
												<View
													style={[
														styles.muscleGroupBadge,
														{ backgroundColor: `${groupColor}20` }
													]}
												>
													<Text
														style={[
															styles.muscleGroupText,
															{ color: groupColor }
														]}
													>
														{exercise.muscleGroup}
													</Text>
												</View>
												<View style={styles.equipmentRow}>
													<Ionicons
														name={equipmentIcon(exercise.equipment)}
														size={12}
														color='#666666'
													/>
													<Text style={styles.equipmentText}>
														{exercise.equipment}
													</Text>
												</View>
											</View>
										</View>
										<View style={styles.addButton}>
											<Ionicons name='add' size={20} color='#AFFF2B' />
										</View>
									</TouchableOpacity>
								)
							})
						)}
					</ScrollView>
					)}
				</View>
			</View>
		</Modal>
	)
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
		height: '70%', // was maxHeight: '90%'
		borderTopWidth: 1,
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderColor: '#333333'
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 16
	},
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
	filterScroll: {
		marginBottom: 20
	},
	filterContent: {
		gap: 8,
		paddingRight: 4,
		marginBottom: 20
	},
	filterPill: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: '#333333',
		backgroundColor: 'transparent',
		height: 40
	},
	filterPillText: {
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#666666'
	},
	resultsCount: {
		fontSize: 12,
		fontFamily: FontFamily.bold,
		color: '#444444',
		marginBottom: 10
	},
	list: {
		maxHeight: 420
	},
	loadingWrap: {
		height: 420,
		alignItems: 'center',
		justifyContent: 'center'
	},
	exerciseRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		padding: 14,
		marginBottom: 8
	},
	exerciseInfo: {
		flex: 1,
		gap: 6
	},
	exerciseName: {
		fontSize: 15,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	exerciseMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	muscleGroupBadge: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 6
	},
	muscleGroupText: {
		fontSize: 11,
		fontFamily: FontFamily.black
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
	addButton: {
		width: 32,
		height: 32,
		borderRadius: 10,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		borderWidth: 1,
		borderColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 40,
		gap: 12
	},
	emptyText: {
		fontSize: 14,
		fontFamily: FontFamily.bold,
		color: '#666666'
	}
})
