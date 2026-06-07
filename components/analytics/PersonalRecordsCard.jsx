import { FontFamily } from '@/constants/fonts';
import { displayWeight, weightUnitLabel } from '@/utils/unitsUtils';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function PersonalRecordsCard({
	bestVolumeSession,
	bestSet,
	mostSetsSession,
	weightUnit = 'lbs'
}) {
	const hasRecords = bestVolumeSession || bestSet || mostSetsSession;

	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Text style={styles.sectionTitle}>Personal Records</Text>
				<Ionicons name='trophy' size={20} color='#FFD60A' />
			</View>

			{hasRecords ? (
				<View style={styles.recordsList}>
					{bestVolumeSession && (
						<View style={styles.recordItem}>
							<View style={styles.recordIcon}>
								<Ionicons name='trending-up' size={18} color='#AFFF2B' />
							</View>
							<View style={styles.recordContent}>
								<Text style={styles.recordLabel}>Highest Volume</Text>
								<Text style={styles.recordValue}>
									{Math.round(displayWeight(bestVolumeSession.volume, weightUnit)).toLocaleString()} {weightUnitLabel(weightUnit)}
								</Text>
								<Text style={styles.recordMeta}>
									{bestVolumeSession.title} •{' '}
									{new Date(bestVolumeSession.date).toLocaleDateString()}
								</Text>
							</View>
						</View>
					)}

					{bestSet && (
						<View style={styles.recordItem}>
							<View style={styles.recordIcon}>
								<Ionicons name='barbell' size={18} color='#AFFF2B' />
							</View>
							<View style={styles.recordContent}>
								<Text style={styles.recordLabel}>Best Set</Text>
								<Text style={styles.recordValue}>
									{displayWeight(bestSet.weight, weightUnit)} {weightUnitLabel(weightUnit)} × {bestSet.reps} reps
								</Text>
								<Text style={styles.recordMeta}>{bestSet.exerciseName}</Text>
							</View>
						</View>
					)}

					{mostSetsSession && (
						<View style={styles.recordItem}>
							<View style={styles.recordIcon}>
								<Ionicons name='list' size={18} color='#AFFF2B' />
							</View>
							<View style={styles.recordContent}>
								<Text style={styles.recordLabel}>Most Sets</Text>
								<Text style={styles.recordValue}>
									{mostSetsSession.sets} sets
								</Text>
								<Text style={styles.recordMeta}>
									{mostSetsSession.title} •{' '}
									{new Date(mostSetsSession.date).toLocaleDateString()}
								</Text>
							</View>
						</View>
					)}
				</View>
			) : (
				<View style={styles.emptyRecords}>
					<Ionicons name='trophy-outline' size={48} color='#333333' />
					<Text style={styles.emptyRecordsText}>No records yet</Text>
					<Text style={styles.emptyRecordsSubtext}>
						Complete workouts to start tracking your achievements
					</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 16,
		backgroundColor: '#1A1A1A',
		padding: 16,
		marginBottom: 12
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	recordsList: {
		gap: 12
	},
	recordItem: {
		flexDirection: 'row',
		gap: 12,
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		padding: 12
	},
	recordIcon: {
		width: 36,
		height: 36,
		borderRadius: 10,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	recordContent: {
		flex: 1
	},
	recordLabel: {
		fontSize: 11,
		fontWeight: '800',
		color: '#999999',
		textTransform: 'uppercase',
		letterSpacing: 0.5
	},
	recordValue: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#AFFF2B',
		marginTop: 4
	},
	recordMeta: {
		fontSize: 11,
		fontWeight: '700',
		color: '#666666',
		marginTop: 4
	},
	emptyRecords: {
		alignItems: 'center',
		paddingVertical: 32
	},
	emptyRecordsText: {
		fontSize: 14,
		fontWeight: '900',
		color: '#FFFFFF',
		marginTop: 12
	},
	emptyRecordsSubtext: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
		marginTop: 4,
		textAlign: 'center',
		paddingHorizontal: 20
	}
});
