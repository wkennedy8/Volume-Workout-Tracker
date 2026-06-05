import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontFamily } from '../../constants/fonts';
import { SPLIT_CONFIG } from '../../utils/splitConfig';

export default function ReviewStep({ state, onEditDay, onConfirm, onBack, saving }) {
	const config = SPLIT_CONFIG[state.splitType];

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<TouchableOpacity style={styles.back} onPress={onBack}>
					<Ionicons name='chevron-back' size={26} color='#AFFF2B' />
				</TouchableOpacity>

				<Text style={styles.title}>Review your program</Text>
				<Text style={styles.subtitle}>Looks good? Start training or edit any day.</Text>

				{/* Summary card */}
				<View style={styles.summaryCard}>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Split</Text>
						<Text style={styles.summaryValue}>{config?.label ?? state.splitType}</Text>
					</View>
					<View style={styles.divider} />
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Days/week</Text>
						<Text style={styles.summaryValue}>{state.daysPerWeek}</Text>
					</View>
					<View style={styles.divider} />
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Cycle length</Text>
						<Text style={styles.summaryValue}>{state.cycleLength} weeks</Text>
					</View>
					<View style={styles.divider} />
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Total exercises</Text>
						<Text style={styles.summaryValue}>
							{state.days.reduce((sum, d) => sum + d.exercises.length, 0)}
						</Text>
					</View>
				</View>

				{/* Day breakdown */}
				{config?.days.map((dayConfig) => {
					const day = state.days.find((d) => d.id === dayConfig.id);
					const exercises = day?.exercises ?? [];
					const compounds = exercises.filter((e) => e.isCompound);
					const accessories = exercises.filter((e) => !e.isCompound);

					return (
						<View key={dayConfig.id} style={styles.dayCard}>
							<View style={styles.dayCardHeader}>
								<View>
									<Text style={styles.dayCardLabel}>{dayConfig.label}</Text>
									<Text style={styles.dayCardMeta}>
										{dayConfig.muscleGroups.join(' · ')}
									</Text>
								</View>
								<TouchableOpacity
									style={styles.editBtn}
									onPress={() => onEditDay(dayConfig.id)}
									activeOpacity={0.7}
								>
									<Ionicons name='pencil-outline' size={14} color='#AFFF2B' />
									<Text style={styles.editBtnText}>Edit</Text>
								</TouchableOpacity>
							</View>

							{exercises.length === 0 ? (
								<Text style={styles.emptyDay}>No exercises added</Text>
							) : (
								<>
									{compounds.length > 0 && (
										<View style={styles.exerciseGroup}>
											<Text style={styles.groupLabel}>Compounds</Text>
											{compounds.map((ex) => (
												<View key={ex.exerciseId} style={styles.exerciseRow}>
													<Text style={styles.exerciseDot}>•</Text>
													<Text style={styles.exerciseName} numberOfLines={1}>{ex.name}</Text>
													<Text style={styles.exerciseSetsReps}>
														{ex.sets}×{ex.reps}
													</Text>
												</View>
											))}
										</View>
									)}
									{accessories.length > 0 && (
										<View style={styles.exerciseGroup}>
											<Text style={styles.groupLabel}>Accessories</Text>
											{accessories.map((ex) => (
												<View key={ex.exerciseId} style={styles.exerciseRow}>
													<Text style={styles.exerciseDot}>•</Text>
													<Text style={styles.exerciseName} numberOfLines={1}>{ex.name}</Text>
													<Text style={styles.exerciseSetsReps}>
														{ex.sets}×{ex.reps}
													</Text>
												</View>
											))}
										</View>
									)}
								</>
							)}
						</View>
					);
				})}
			</ScrollView>

			<View style={styles.footer}>
				<TouchableOpacity
					style={styles.btn}
					onPress={onConfirm}
					disabled={saving}
					activeOpacity={0.9}
				>
					{saving ? (
						<ActivityIndicator color='#000000' />
					) : (
						<>
							<Text style={styles.btnText}>Start Program</Text>
							<Ionicons name='rocket-outline' size={18} color='#000000' />
						</>
					)}
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	scroll: { flex: 1 },
	content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
	back: { marginLeft: -8, marginBottom: 16, width: 40, height: 40, justifyContent: 'center' },
	title: { fontSize: 28, fontFamily: FontFamily.black, color: '#FFFFFF', marginBottom: 6 },
	subtitle: { fontSize: 14, fontWeight: '700', color: '#999999', marginBottom: 20 },
	summaryCard: {
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333',
		padding: 16,
		marginBottom: 20
	},
	summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
	summaryLabel: { fontSize: 14, fontWeight: '700', color: '#999999' },
	summaryValue: { fontSize: 14, fontFamily: FontFamily.black, color: '#FFFFFF' },
	divider: { height: 1, backgroundColor: '#2A2A2A' },
	dayCard: {
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333',
		padding: 16,
		marginBottom: 12
	},
	dayCardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 14
	},
	dayCardLabel: { fontSize: 16, fontFamily: FontFamily.black, color: '#FFFFFF', marginBottom: 2 },
	dayCardMeta: { fontSize: 12, fontWeight: '700', color: '#666666' },
	editBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 8,
		backgroundColor: 'rgba(175,255,43,0.1)',
		borderWidth: 1,
		borderColor: 'rgba(175,255,43,0.25)'
	},
	editBtnText: { fontSize: 12, fontFamily: FontFamily.black, color: '#AFFF2B' },
	emptyDay: { fontSize: 13, fontWeight: '700', color: '#555555', fontStyle: 'italic' },
	exerciseGroup: { marginBottom: 10 },
	groupLabel: { fontSize: 11, fontWeight: '800', color: '#555555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
	exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
	exerciseDot: { fontSize: 14, color: '#AFFF2B' },
	exerciseName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
	exerciseSetsReps: { fontSize: 12, fontFamily: FontFamily.black, color: '#AFFF2B' },
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
