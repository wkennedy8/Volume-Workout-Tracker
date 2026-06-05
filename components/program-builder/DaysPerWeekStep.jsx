import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { FontFamily } from '../../constants/fonts';
import { getSplitConfig } from '../../utils/splitConfig';

const DAY_LABELS = ['', 'Mon', 'Mon\nWed', 'Mon\nWed\nFri', 'Mon–Thu', 'Mon–Fri', 'Mon–Sat'];

export default function DaysPerWeekStep({ splitType, daysPerWeek, onSelect, onNext, onBack }) {
	const config = getSplitConfig(splitType);
	if (!config) return null;

	const options = config.daysPerWeekOptions;
	const suggested = config.suggestedDaysPerWeek;

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

				<Text style={styles.title}>Days per week</Text>
				<Text style={styles.subtitle}>
					How many days do you want to train?
				</Text>

				<View style={styles.grid}>
					{options.map((n) => {
						const active = daysPerWeek === n;
						const isSuggested = n === suggested;
						return (
							<TouchableOpacity
								key={n}
								style={[styles.card, active && styles.cardActive]}
								onPress={() => onSelect(n)}
								activeOpacity={0.7}
							>
								{isSuggested && (
									<View style={[styles.badge, active && styles.badgeActive]}>
										<Text style={[styles.badgeText, active && styles.badgeTextActive]}>
											Suggested
										</Text>
									</View>
								)}
								<Text style={[styles.cardNumber, active && styles.textDark]}>
									{n}
								</Text>
								<Text style={[styles.cardLabel, active && styles.textDark]}>
									days
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>

				{daysPerWeek && (
					<View style={styles.hint}>
						<Ionicons name='information-circle-outline' size={16} color='#666666' />
						<Text style={styles.hintText}>
							You'll build one workout per unique training day. Repeating days use the same workout.
						</Text>
					</View>
				)}
			</ScrollView>

			<View style={styles.footer}>
				<TouchableOpacity
					style={[styles.btn, !daysPerWeek && styles.btnDisabled]}
					onPress={onNext}
					disabled={!daysPerWeek}
					activeOpacity={0.9}
				>
					<Text style={styles.btnText}>Continue</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	scroll: { flex: 1 },
	content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
	back: { marginLeft: -8, marginBottom: 16, width: 40, height: 40, justifyContent: 'center' },
	title: { fontSize: 28, fontFamily: FontFamily.black, color: '#FFFFFF', marginBottom: 6 },
	subtitle: { fontSize: 14, fontWeight: '700', color: '#999999', marginBottom: 28 },
	grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
	card: {
		width: '47%',
		paddingVertical: 24,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: '#333333',
		backgroundColor: '#1A1A1A',
		alignItems: 'center',
		position: 'relative'
	},
	cardActive: { backgroundColor: '#AFFF2B', borderColor: '#AFFF2B' },
	cardNumber: { fontSize: 40, fontFamily: FontFamily.black, color: '#FFFFFF' },
	cardLabel: { fontSize: 14, fontWeight: '700', color: '#999999', marginTop: 2 },
	textDark: { color: '#000000' },
	badge: {
		position: 'absolute',
		top: 10,
		right: 10,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 999,
		backgroundColor: 'rgba(175,255,43,0.15)'
	},
	badgeActive: { backgroundColor: 'rgba(0,0,0,0.15)' },
	badgeText: { fontSize: 10, fontWeight: '800', color: '#AFFF2B' },
	badgeTextActive: { color: '#000000' },
	hint: {
		flexDirection: 'row',
		gap: 8,
		marginTop: 24,
		padding: 14,
		borderRadius: 12,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333'
	},
	hintText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#666666', lineHeight: 18 },
	footer: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12 },
	btn: {
		height: 56,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	btnDisabled: { backgroundColor: '#333333', opacity: 0.5 },
	btnText: { fontSize: 18, fontFamily: FontFamily.black, color: '#000000' }
});
