import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontFamily } from '../../constants/fonts';

const OPTIONS = [
	{ weeks: 4, label: '4 Weeks', desc: 'Short cycle. Good for rapid variation.' },
	{ weeks: 6, label: '6 Weeks', desc: 'Balanced length for steady progress.' },
	{ weeks: 8, label: '8 Weeks', desc: 'Most popular. Solid progressive overload.' },
	{ weeks: 12, label: '12 Weeks', desc: 'Long cycle. Maximum adaptation.' }
];

export default function CycleLengthStep({ cycleLength, onSelect, onNext, onBack }) {
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

				<Text style={styles.title}>Program length</Text>
				<Text style={styles.subtitle}>How long should each training cycle be?</Text>

				<View style={styles.overloadBanner}>
					<Ionicons name='trending-up' size={20} color='#AFFF2B' />
					<View style={{ flex: 1 }}>
						<Text style={styles.bannerTitle}>Progressive Overload — handled for you</Text>
						<Text style={styles.bannerBody}>
							We automatically increase your sets and reps each week throughout the cycle so you never plateau.
						</Text>
					</View>
				</View>

				<View style={styles.options}>
					{OPTIONS.map((opt) => {
						const active = cycleLength === opt.weeks;
						const suggested = opt.weeks === 8;
						return (
							<TouchableOpacity
								key={opt.weeks}
								style={[styles.option, active && styles.optionActive]}
								onPress={() => onSelect(opt.weeks)}
								activeOpacity={0.7}
							>
								<View style={styles.optionLeft}>
									<Text style={[styles.optionLabel, active && styles.textDark]}>
										{opt.label}
									</Text>
									<Text style={[styles.optionDesc, active && styles.textDarkMuted]}>
										{opt.desc}
									</Text>
								</View>
								<View style={styles.optionRight}>
									{suggested && (
										<View style={[styles.suggestedBadge, active && styles.suggestedBadgeActive]}>
											<Text style={[styles.suggestedText, active && styles.suggestedTextActive]}>
												Recommended
											</Text>
										</View>
									)}
									{active && (
										<Ionicons name='checkmark-circle' size={22} color='#000000' style={{ marginTop: suggested ? 6 : 0 }} />
									)}
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>

			<View style={styles.footer}>
				<TouchableOpacity
					style={[styles.btn, !cycleLength && styles.btnDisabled]}
					onPress={onNext}
					disabled={!cycleLength}
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
	subtitle: { fontSize: 14, fontWeight: '700', color: '#999999', marginBottom: 20 },
	overloadBanner: {
		flexDirection: 'row',
		gap: 12,
		padding: 16,
		borderRadius: 14,
		backgroundColor: 'rgba(175,255,43,0.08)',
		borderWidth: 1,
		borderColor: 'rgba(175,255,43,0.25)',
		marginBottom: 24
	},
	bannerTitle: { fontSize: 13, fontFamily: FontFamily.black, color: '#AFFF2B', marginBottom: 4 },
	bannerBody: { fontSize: 12, fontWeight: '700', color: '#999999', lineHeight: 18 },
	options: { gap: 10 },
	option: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 18,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: '#333333',
		backgroundColor: '#1A1A1A'
	},
	optionActive: { backgroundColor: '#AFFF2B', borderColor: '#AFFF2B' },
	optionLeft: { flex: 1 },
	optionRight: { alignItems: 'flex-end', gap: 4 },
	optionLabel: { fontSize: 18, fontFamily: FontFamily.black, color: '#FFFFFF', marginBottom: 4 },
	optionDesc: { fontSize: 13, fontWeight: '700', color: '#999999' },
	textDark: { color: '#000000' },
	textDarkMuted: { color: '#000000', opacity: 0.65 },
	suggestedBadge: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 999,
		backgroundColor: 'rgba(175,255,43,0.15)'
	},
	suggestedBadgeActive: { backgroundColor: 'rgba(0,0,0,0.15)' },
	suggestedText: { fontSize: 10, fontWeight: '800', color: '#AFFF2B' },
	suggestedTextActive: { color: '#000000' },
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
