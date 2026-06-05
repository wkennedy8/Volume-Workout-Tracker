import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { FontFamily } from '../../constants/fonts';
import { SPLIT_CONFIG } from '../../utils/splitConfig';

const SPLITS = Object.values(SPLIT_CONFIG);
const SPLIT_ICONS = {
	ppl: 'shuffle-outline',
	fullbody: 'body-outline',
	brosplit: 'barbell-outline'
};

export default function SplitStep({ splitType, onSelect, onNext }) {
	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Text style={styles.title}>Your split</Text>
				<Text style={styles.subtitle}>Confirm or change your training split</Text>

				<View style={styles.options}>
					{SPLITS.map((split) => {
						const active = splitType === split.id;
						return (
							<TouchableOpacity
								key={split.id}
								style={[styles.option, active && styles.optionActive]}
								onPress={() => onSelect(split.id)}
								activeOpacity={0.7}
							>
								<View style={styles.optionHeader}>
									<View style={styles.optionTitleRow}>
										<Ionicons
											name={SPLIT_ICONS[split.id]}
											size={22}
											color={active ? '#000000' : '#AFFF2B'}
										/>
										<Text style={[styles.optionTitle, active && styles.textDark]}>
											{split.label}
										</Text>
									</View>
									{active && (
										<Ionicons name='checkmark-circle' size={22} color='#000000' />
									)}
								</View>
								<Text style={[styles.optionDesc, active && styles.textDarkMuted]}>
									{split.description}
								</Text>
								<Text style={[styles.optionMeta, active && styles.textDarkMuted]}>
									Suggested {split.suggestedDaysPerWeek} days/week
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>

			<View style={styles.footer}>
				<TouchableOpacity
					style={[styles.btn, !splitType && styles.btnDisabled]}
					onPress={onNext}
					disabled={!splitType}
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
	title: { fontSize: 28, fontFamily: FontFamily.black, color: '#FFFFFF', marginBottom: 6 },
	subtitle: { fontSize: 14, fontWeight: '700', color: '#999999', marginBottom: 28 },
	options: { gap: 12 },
	option: {
		padding: 18,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: '#333333',
		backgroundColor: '#1A1A1A'
	},
	optionActive: { backgroundColor: '#AFFF2B', borderColor: '#AFFF2B' },
	optionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8
	},
	optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
	optionTitle: { fontSize: 17, fontFamily: FontFamily.black, color: '#FFFFFF' },
	optionDesc: { fontSize: 13, fontWeight: '700', color: '#999999', lineHeight: 18, marginBottom: 8 },
	optionMeta: { fontSize: 12, fontWeight: '800', color: '#666666' },
	textDark: { color: '#000000' },
	textDarkMuted: { color: '#000000', opacity: 0.65 },
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
