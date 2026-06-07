import { FontFamily } from '@/constants/fonts';
import { weightUnitLabel } from '@/utils/unitsUtils';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export default function WeeklyProgressCard({
	weeklyStats,
	weeksToShow,
	currentWeek,
	weightUnit = 'lbs'
}) {
	if (weeksToShow.length === 0) return null;

	return (
		<View style={styles.card}>
			<Text style={styles.sectionTitle}>Weekly Progress</Text>

			{weeksToShow.map((week) => {
				const stats = weeklyStats[week];
				const hasData = stats && stats.workouts > 0;
				const isCurrentWeek = week === currentWeek;

				return (
					<View
						key={week}
						style={[styles.weekCard, isCurrentWeek && styles.weekCardCurrent]}
					>
						<View style={styles.weekHeader}>
							<View style={styles.weekTitleRow}>
								<Text style={styles.weekTitle}>Week {week}</Text>
								{isCurrentWeek && (
									<View style={styles.currentBadge}>
										<Text style={styles.currentBadgeText}>Current</Text>
									</View>
								)}
							</View>
							{hasData ? (
								<Text style={styles.weekWorkouts}>
									{stats.workouts} workout
									{stats.workouts !== 1 ? 's' : ''}
								</Text>
							) : (
								<Text style={styles.weekWorkouts}>No workouts yet</Text>
							)}
						</View>

						{hasData ? (
							<View style={styles.weekStatsGrid}>
								<View style={styles.weekStatItem}>
									<Text style={styles.weekStatValue}>
										{Math.round(stats.volume).toLocaleString()}
									</Text>
									<Text style={styles.weekStatLabel}>Volume ({weightUnitLabel(weightUnit)})</Text>
								</View>

								<View style={styles.weekStatItem}>
									<Text style={styles.weekStatValue}>{stats.sets}</Text>
									<Text style={styles.weekStatLabel}>Sets</Text>
								</View>

								<View style={styles.weekStatItem}>
									<Text style={styles.weekStatValue}>{stats.reps}</Text>
									<Text style={styles.weekStatLabel}>Reps</Text>
								</View>

								<View style={styles.weekStatItem}>
									<Text style={styles.weekStatValue}>
										{Math.round(stats.avgVolume)}
									</Text>
									<Text style={styles.weekStatLabel}>Avg Volume</Text>
								</View>
							</View>
						) : (
							<View style={styles.weekEmptyState}>
								<Ionicons name='time-outline' size={24} color='#333333' />
								<Text style={styles.weekEmptyText}>
									{isCurrentWeek
										? 'Start your first workout this week'
										: 'Week not started'}
								</Text>
							</View>
						)}
					</View>
				);
			})}
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
	sectionTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	weekCard: {
		marginTop: 12,
		padding: 14,
		borderRadius: 12,
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#2A2A2A'
	},
	weekCardCurrent: {
		borderColor: '#AFFF2B',
		backgroundColor: 'rgba(175, 255, 43, 0.05)'
	},
	weekHeader: {
		marginBottom: 12
	},
	weekTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 4
	},
	weekTitle: {
		fontSize: 15,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	currentBadge: {
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 6,
		backgroundColor: '#AFFF2B'
	},
	currentBadgeText: {
		fontSize: 9,
		fontFamily: FontFamily.black,
		color: '#000000',
		textTransform: 'uppercase',
		letterSpacing: 0.5
	},
	weekWorkouts: {
		fontSize: 11,
		fontWeight: '700',
		color: '#666666'
	},
	weekStatsGrid: {
		flexDirection: 'row',
		gap: 10
	},
	weekStatItem: {
		flex: 1,
		alignItems: 'center'
	},
	weekStatValue: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	weekStatLabel: {
		fontSize: 9,
		fontWeight: '700',
		color: '#666666',
		marginTop: 2,
		textAlign: 'center'
	},
	weekEmptyState: {
		alignItems: 'center',
		paddingVertical: 20
	},
	weekEmptyText: {
		fontSize: 11,
		fontWeight: '700',
		color: '#666666',
		marginTop: 8,
		textAlign: 'center'
	}
});
