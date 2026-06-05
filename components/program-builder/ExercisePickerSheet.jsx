import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Modal,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';
import { getExercisesForMuscleGroups } from '../../controllers/exerciseController';

export default function ExercisePickerSheet({
	visible,
	muscleGroups,
	compoundOnly,
	alreadySelected,
	onSelect,
	onClose
}) {
	const insets = useSafeAreaInsets();
	const [exercises, setExercises] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [filterMuscle, setFilterMuscle] = useState('All');

	useEffect(() => {
		if (!visible) return;
		setLoading(true);
		setSearch('');
		setFilterMuscle('All');

		getExercisesForMuscleGroups(muscleGroups)
			.then((all) => {
				const filtered = compoundOnly ? all.filter((e) => e.isCompound) : all.filter((e) => !e.isCompound);
				setExercises(filtered);
			})
			.catch(console.warn)
			.finally(() => setLoading(false));
	}, [visible, muscleGroups.join(','), compoundOnly]);

	const muscleFilters = ['All', ...muscleGroups];

	const displayed = useMemo(() => {
		let list = exercises;
		if (filterMuscle !== 'All') {
			list = list.filter((e) => e.muscleGroup === filterMuscle);
		}
		if (search.trim()) {
			const q = search.trim().toLowerCase();
			list = list.filter((e) => e.name.toLowerCase().includes(q));
		}
		return list;
	}, [exercises, filterMuscle, search]);

	const selectedIds = new Set(alreadySelected.map((e) => e.exerciseId));

	return (
		<Modal visible={visible} animationType='slide' presentationStyle='fullScreen' onRequestClose={onClose}>
			<View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.headerTitle}>
						{compoundOnly ? 'Compound Movements' : 'Accessory Movements'}
					</Text>
					<TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
						<Ionicons name='close' size={24} color='#FFFFFF' />
					</TouchableOpacity>
				</View>

				{/* Fixed header: search + filter chips */}
				<View style={styles.fixedHeader}>
					<View style={styles.searchRow}>
						<Ionicons name='search-outline' size={18} color='#666666' style={styles.searchIcon} />
						<TextInput
							style={styles.searchInput}
							placeholder='Search exercises…'
							placeholderTextColor='#666666'
							value={search}
							onChangeText={setSearch}
							returnKeyType='search'
						/>
						{search.length > 0 && (
							<TouchableOpacity onPress={() => setSearch('')}>
								<Ionicons name='close-circle' size={18} color='#666666' />
							</TouchableOpacity>
						)}
					</View>

					<FlatList
						horizontal
						data={muscleFilters}
						keyExtractor={(item) => item}
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.chipRow}
						renderItem={({ item }) => (
							<TouchableOpacity
								style={[styles.chip, filterMuscle === item && styles.chipActive]}
								onPress={() => setFilterMuscle(item)}
								activeOpacity={0.7}
							>
								<Text style={[styles.chipText, filterMuscle === item && styles.chipTextActive]}>
									{item}
								</Text>
							</TouchableOpacity>
						)}
					/>
				</View>

				{/* Exercise list */}
				{loading ? (
					<View style={styles.loadingWrap}>
						<ActivityIndicator size='large' color='#AFFF2B' />
					</View>
				) : (
					<FlatList
						data={displayed}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.listContent}
						ItemSeparatorComponent={() => <View style={styles.separator} />}
						ListEmptyComponent={
							<View style={styles.emptyWrap}>
								<Text style={styles.emptyText}>No exercises found</Text>
							</View>
						}
						renderItem={({ item }) => {
							const selected = selectedIds.has(item.id);
							return (
								<TouchableOpacity
									style={[styles.exerciseRow, selected && styles.exerciseRowSelected]}
									onPress={() => onSelect(item)}
									activeOpacity={0.7}
								>
									<View style={styles.exerciseInfo}>
										<Text style={[styles.exerciseName, selected && styles.exerciseNameSelected]}>
											{item.name}
										</Text>
										<View style={styles.exerciseMeta}>
											<Text style={[styles.muscleTag, selected && styles.muscleTagSelected]}>
												{item.muscleGroup}
											</Text>
											<Text style={[styles.equipTag, selected && styles.equipTagSelected]}>
												{item.equipment}
											</Text>
										</View>
									</View>
									{selected ? (
										<Ionicons name='checkmark-circle' size={24} color='#AFFF2B' />
									) : (
										<Ionicons name='add-circle-outline' size={24} color='#555555' />
									)}
								</TouchableOpacity>
							);
						}}
					/>
				)}
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#0D0D0D' },
	fixedHeader: { flexShrink: 0 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#222222'
	},
	headerTitle: { fontSize: 18, fontFamily: FontFamily.black, color: '#FFFFFF' },
	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 16,
		marginVertical: 12,
		paddingHorizontal: 14,
		height: 44,
		borderRadius: 12,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333'
	},
	searchIcon: { marginRight: 8 },
	searchInput: { flex: 1, fontSize: 15, color: '#FFFFFF', fontFamily: FontFamily.semiBold },
	chipRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
	chip: {
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 999,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333'
	},
	chipActive: { backgroundColor: '#AFFF2B', borderColor: '#AFFF2B' },
	chipText: { fontSize: 13, fontWeight: '700', color: '#999999' },
	chipTextActive: { color: '#000000' },
	loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	listContent: { paddingBottom: 40 },
	separator: { height: 1, backgroundColor: '#1A1A1A' },
	exerciseRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 14,
		backgroundColor: '#0D0D0D'
	},
	exerciseRowSelected: { backgroundColor: '#0F1A00' },
	exerciseInfo: { flex: 1, marginRight: 12 },
	exerciseName: { fontSize: 15, fontFamily: FontFamily.black, color: '#FFFFFF', marginBottom: 4 },
	exerciseNameSelected: { color: '#AFFF2B' },
	exerciseMeta: { flexDirection: 'row', gap: 8 },
	muscleTag: {
		fontSize: 11,
		fontWeight: '800',
		color: '#666666',
		backgroundColor: '#1A1A1A',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 6
	},
	muscleTagSelected: { backgroundColor: 'rgba(175,255,43,0.1)', color: '#AFFF2B' },
	equipTag: {
		fontSize: 11,
		fontWeight: '800',
		color: '#666666',
		backgroundColor: '#1A1A1A',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 6
	},
	equipTagSelected: { backgroundColor: 'rgba(175,255,43,0.1)', color: '#AFFF2B' },
	emptyWrap: { padding: 40, alignItems: 'center' },
	emptyText: { fontSize: 15, fontWeight: '700', color: '#666666' }
});
