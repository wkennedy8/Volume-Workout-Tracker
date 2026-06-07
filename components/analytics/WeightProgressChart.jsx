import { FontFamily } from '@/constants/fonts';
import { weightUnitLabel } from '@/utils/unitsUtils';
import { Ionicons } from '@expo/vector-icons';
import {
	Dimensions,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function WeightProgressChart({
	sampledWeights,
	weightChange,
	weightRange,
	onRangeChange,
	chartData,
	weightUnit = 'lbs'
}) {
	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<View>
					<Text style={styles.sectionTitle}>Weight Progress</Text>
					{sampledWeights.length >= 2 && (
						<Text
							style={[
								styles.changeText,
								weightChange > 0
									? styles.changePositive
									: weightChange < 0
										? styles.changeNegative
										: styles.changeNeutral
							]}
						>
							{weightChange > 0 ? '+' : ''}
							{weightChange.toFixed(1)} {weightUnitLabel(weightUnit)}
						</Text>
					)}
				</View>
			</View>

			{/* Time range selector */}
			<View style={styles.rangeSelector}>
				<TouchableOpacity
					style={[
						styles.rangeButton,
						weightRange === '7' && styles.rangeButtonActive
					]}
					onPress={() => onRangeChange('7')}
					activeOpacity={0.7}
				>
					<Text
						style={[
							styles.rangeButtonText,
							weightRange === '7' && styles.rangeButtonTextActive
						]}
					>
						1W
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.rangeButton,
						weightRange === '30' && styles.rangeButtonActive
					]}
					onPress={() => onRangeChange('30')}
					activeOpacity={0.7}
				>
					<Text
						style={[
							styles.rangeButtonText,
							weightRange === '30' && styles.rangeButtonTextActive
						]}
					>
						30D
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.rangeButton,
						weightRange === '90' && styles.rangeButtonActive
					]}
					onPress={() => onRangeChange('90')}
					activeOpacity={0.7}
				>
					<Text
						style={[
							styles.rangeButtonText,
							weightRange === '90' && styles.rangeButtonTextActive
						]}
					>
						90D
					</Text>
				</TouchableOpacity>
			</View>

			{sampledWeights.length > 0 ? (
				<LineChart
					data={chartData}
					width={screenWidth - 64}
					height={240}
					chartConfig={{
						backgroundColor: '#1A1A1A',
						backgroundGradientFrom: '#1A1A1A',
						backgroundGradientTo: '#1A1A1A',
						decimalPlaces: 1,
						color: (opacity = 1) => `rgba(175, 255, 43, ${opacity})`,
						labelColor: (opacity = 1) => `rgba(153, 153, 153, ${opacity})`,
						style: {
							borderRadius: 16
						},
						propsForDots: {
							r: '3',
							strokeWidth: '2',
							stroke: '#AFFF2B'
						},
						propsForLabels: {
							fontSize: 10
						}
					}}
					bezier
					style={styles.chart}
					withInnerLines={true}
					withOuterLines={true}
					withVerticalLines={false}
					withHorizontalLines={true}
					withVerticalLabels={true}
					withHorizontalLabels={true}
					segments={4}
				/>
			) : (
				<View style={styles.emptyChart}>
					<Ionicons name='analytics-outline' size={48} color='#333333' />
					<Text style={styles.emptyChartText}>No weight data yet</Text>
					<Text style={styles.emptyChartSubtext}>
						Start tracking your weight in the Weight tab
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
	changeText: {
		fontSize: 13,
		fontWeight: '900',
		marginTop: 4
	},
	changePositive: {
		color: '#FF453A'
	},
	changeNegative: {
		color: '#AFFF2B'
	},
	changeNeutral: {
		color: '#999999'
	},
	rangeSelector: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 16
	},
	rangeButton: {
		flex: 1,
		height: 36,
		borderRadius: 10,
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: '#333333',
		alignItems: 'center',
		justifyContent: 'center'
	},
	rangeButtonActive: {
		backgroundColor: '#AFFF2B',
		borderColor: '#AFFF2B'
	},
	rangeButtonText: {
		fontSize: 13,
		fontWeight: '900',
		color: '#666666'
	},
	rangeButtonTextActive: {
		color: '#000000'
	},
	chart: {
		marginVertical: 8,
		borderRadius: 16
	},
	emptyChart: {
		alignItems: 'center',
		paddingVertical: 40
	},
	emptyChartText: {
		fontSize: 14,
		fontWeight: '900',
		color: '#FFFFFF',
		marginTop: 12
	},
	emptyChartSubtext: {
		fontSize: 12,
		fontWeight: '700',
		color: '#999999',
		marginTop: 4,
		textAlign: 'center'
	}
});
