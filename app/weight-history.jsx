import { useAuth } from '@/context/AuthContext';
import { deleteWeight } from '@/controllers/weightController';
import { useUnits } from '@/hooks/useUnits';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { prepareChartData } from '@/utils/analyticsUtils';
import { formatDisplayDate } from '@/utils/dateUtils';
import { displayWeight, weightUnitLabel } from '@/utils/unitsUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
	Alert,
	Dimensions,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../constants/fonts';

const screenWidth = Dimensions.get('window').width;

function toFixed1(n) {
	return Number(n).toFixed(1);
}

export default function WeightHistoryScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const { entries } = useWeightEntries();
	const { weightUnit } = useUnits();

	const displayEntries = entries.map((e) => ({
		...e,
		displayWeight: displayWeight(e.weight, weightUnit)
	}));

	// Chart: use up to last 30 entries, oldest → newest
	const chartEntries = displayEntries.slice(0, 30).reverse();
	const chartData =
		chartEntries.length >= 2
			? prepareChartData(chartEntries.map((e) => ({ date: e.date, weight: e.displayWeight })))
			: null;

	const totalChange =
		displayEntries.length >= 2
			? displayEntries[0].displayWeight - displayEntries[displayEntries.length - 1].displayWeight
			: null;

	async function handleDelete(dateKey) {
		Alert.alert(
			'Delete Entry',
			`Remove weight entry for ${formatDisplayDate(dateKey)}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await deleteWeight(user.uid, dateKey);
						} catch {
							Alert.alert('Error', 'Could not delete entry.');
						}
					}
				}
			]
		);
	}

	const unit = weightUnitLabel(weightUnit);

	return (
		<SafeAreaView style={styles.safe}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
					<Ionicons name='chevron-back' size={28} color='#AFFF2B' />
				</TouchableOpacity>
				<Text style={styles.title}>Weight History</Text>
				<View style={{ width: 28 }} />
			</View>

			<FlatList
				data={displayEntries}
				keyExtractor={(item) => item.date}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={
					<>
						{/* Summary row */}
						{displayEntries.length >= 2 && (
							<View style={styles.summaryRow}>
								<View style={styles.summaryItem}>
									<Text style={styles.summaryValue}>
										{toFixed1(displayEntries[displayEntries.length - 1].displayWeight)} {unit}
									</Text>
									<Text style={styles.summaryLabel}>Starting</Text>
								</View>
								<View style={styles.summaryDivider} />
								<View style={styles.summaryItem}>
									<Text style={[
										styles.summaryValue,
										totalChange < 0 ? styles.green : totalChange > 0 ? styles.red : styles.neutral
									]}>
										{totalChange > 0 ? '+' : ''}{toFixed1(totalChange)} {unit}
									</Text>
									<Text style={styles.summaryLabel}>Total Change</Text>
								</View>
								<View style={styles.summaryDivider} />
								<View style={styles.summaryItem}>
									<Text style={styles.summaryValue}>
										{toFixed1(displayEntries[0].displayWeight)} {unit}
									</Text>
									<Text style={styles.summaryLabel}>Current</Text>
								</View>
							</View>
						)}

						{/* Chart */}
						{chartData && (
							<View style={styles.chartCard}>
								<LineChart
									data={chartData}
									width={screenWidth - 48}
									height={200}
									chartConfig={{
										backgroundColor: '#1A1A1A',
										backgroundGradientFrom: '#1A1A1A',
										backgroundGradientTo: '#1A1A1A',
										decimalPlaces: 1,
										color: (opacity = 1) => `rgba(175, 255, 43, ${opacity})`,
										labelColor: (opacity = 1) => `rgba(153, 153, 153, ${opacity})`,
										propsForDots: { r: '3', strokeWidth: '2', stroke: '#AFFF2B' },
										propsForLabels: { fontSize: 10 }
									}}
									bezier
									style={{ borderRadius: 12 }}
									withInnerLines={false}
									withOuterLines={false}
									withVerticalLines={false}
									withHorizontalLines={true}
									segments={4}
								/>
							</View>
						)}

						<Text style={styles.sectionLabel}>
							{entries.length} {entries.length === 1 ? 'entry' : 'entries'}
						</Text>
					</>
				}
				renderItem={({ item, index }) => (
					<View style={styles.row}>
						<View style={styles.rowLeft}>
							<Text style={styles.rowDate}>{formatDisplayDate(item.date)}</Text>
							{index === 0 && (
								<View style={styles.latestBadge}>
									<Text style={styles.latestBadgeText}>Latest</Text>
								</View>
							)}
						</View>
						<View style={styles.rowRight}>
							<Text style={styles.rowWeight}>
								{toFixed1(item.displayWeight)} {unit}
							</Text>
							<TouchableOpacity
								onPress={() => handleDelete(item.date)}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
								style={styles.deleteBtn}
							>
								<Ionicons name='trash-outline' size={16} color='#555555' />
							</TouchableOpacity>
						</View>
					</View>
				)}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				ListEmptyComponent={
					<View style={styles.empty}>
						<Ionicons name='scale-outline' size={48} color='#333333' />
						<Text style={styles.emptyTitle}>No entries yet</Text>
						<Text style={styles.emptyBody}>
							Start logging your weight on the home screen.
						</Text>
					</View>
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },

	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 12
	},
	title: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},

	content: {
		paddingHorizontal: 24,
		paddingBottom: 40
	},

	summaryRow: {
		flexDirection: 'row',
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#333333',
		padding: 16,
		marginBottom: 16,
		alignItems: 'center'
	},
	summaryItem: {
		flex: 1,
		alignItems: 'center'
	},
	summaryValue: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 4
	},
	summaryLabel: {
		fontSize: 11,
		fontWeight: '700',
		color: '#666666',
		textTransform: 'uppercase',
		letterSpacing: 0.5
	},
	summaryDivider: {
		width: 1,
		height: 36,
		backgroundColor: '#2A2A2A'
	},
	green: { color: '#AFFF2B' },
	red: { color: '#FF453A' },
	neutral: { color: '#999999' },

	chartCard: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#333333',
		padding: 12,
		marginBottom: 20,
		overflow: 'hidden'
	},

	sectionLabel: {
		fontSize: 12,
		fontWeight: '700',
		color: '#555555',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 8
	},

	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14
	},
	rowLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	rowDate: {
		fontSize: 15,
		fontWeight: '700',
		color: '#FFFFFF'
	},
	latestBadge: {
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 6,
		backgroundColor: 'rgba(175, 255, 43, 0.15)'
	},
	latestBadgeText: {
		fontSize: 10,
		fontFamily: FontFamily.black,
		color: '#AFFF2B',
		textTransform: 'uppercase',
		letterSpacing: 0.4
	},
	rowRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12
	},
	rowWeight: {
		fontSize: 15,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	deleteBtn: {
		padding: 4
	},

	separator: {
		height: 1,
		backgroundColor: '#1A1A1A'
	},

	empty: {
		alignItems: 'center',
		paddingTop: 60
	},
	emptyTitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginTop: 16
	},
	emptyBody: {
		fontSize: 13,
		fontWeight: '700',
		color: '#666666',
		marginTop: 6,
		textAlign: 'center'
	}
});
