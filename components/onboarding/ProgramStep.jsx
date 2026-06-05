import { useOnboarding } from '@/context/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { FontFamily } from '../../constants/fonts';
import { SPLIT_CONFIG } from '../../utils/splitConfig';
import ProgressBar from './ProgressBar';

const SPLITS = Object.values(SPLIT_CONFIG);

const SPLIT_ICONS = {
	ppl: 'shuffle-outline',
	fullbody: 'body-outline',
	brosplit: 'barbell-outline'
};

export default function ProgramStep({
	onNext,
	onBack,
	currentStep,
	totalSteps,
	canGoBack
}) {
	const { data, updateData } = useOnboarding();
	const [selectedSplitId, setSelectedSplitId] = useState(data.selectedPlanId);

	function handleContinue() {
		if (!selectedSplitId) {
			alert('Please select a program');
			return;
		}
		updateData('selectedPlanId', selectedSplitId);
		onNext();
	}

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{canGoBack && (
					<TouchableOpacity style={styles.backButton} onPress={onBack}>
						<Ionicons name='chevron-back' size={28} color='#AFFF2B' />
					</TouchableOpacity>
				)}

				<ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

				<View style={styles.header}>
					<Text style={styles.title}>Choose your split</Text>
					<Text style={styles.subtitle}>
						You'll build your exact program after setup
					</Text>
				</View>

				<View style={styles.options}>
					{SPLITS.map((split) => {
						const active = selectedSplitId === split.id;
						return (
							<TouchableOpacity
								key={split.id}
								style={[styles.option, active && styles.optionActive]}
								onPress={() => setSelectedSplitId(split.id)}
								activeOpacity={0.7}
							>
								<View style={styles.optionHeader}>
									<View style={styles.optionTitleRow}>
										<Ionicons
											name={SPLIT_ICONS[split.id]}
											size={24}
											color={active ? '#000000' : '#AFFF2B'}
										/>
										<Text
											style={[
												styles.optionTitle,
												active && styles.optionTitleActive
											]}
										>
											{split.label}
										</Text>
									</View>
									{active && (
										<Ionicons
											name='checkmark-circle'
											size={24}
											color='#000000'
										/>
									)}
								</View>

								<Text
									style={[
										styles.optionDescription,
										active && styles.optionDescriptionActive
									]}
								>
									{split.description}
								</Text>

								<Text
									style={[
										styles.optionMeta,
										active && styles.optionMetaActive
									]}
								>
									Suggested {split.suggestedDaysPerWeek} days/week
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>

			<TouchableOpacity
				style={[styles.button, !selectedSplitId && styles.buttonDisabled]}
				onPress={handleContinue}
				disabled={!selectedSplitId}
				activeOpacity={0.9}
			>
				<Text style={styles.buttonText}>Continue</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	scrollView: { flex: 1 },
	content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 100 },

	backButton: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: -12,
		marginBottom: 12
	},

	header: { marginBottom: 32 },
	title: {
		fontSize: 32,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 8
	},
	subtitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#999999'
	},

	options: { gap: 12 },
	option: {
		padding: 20,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: '#333333',
		backgroundColor: '#1A1A1A'
	},
	optionActive: {
		backgroundColor: '#AFFF2B',
		borderColor: '#AFFF2B'
	},
	optionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10
	},
	optionTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	optionTitle: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	optionTitleActive: { color: '#000000' },
	optionDescription: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999',
		lineHeight: 20,
		marginBottom: 10
	},
	optionDescriptionActive: { color: '#000000', opacity: 0.7 },
	optionMeta: {
		fontSize: 12,
		fontWeight: '800',
		color: '#666666'
	},
	optionMetaActive: { color: '#000000', opacity: 0.6 },

	button: {
		position: 'absolute',
		bottom: 24,
		left: 24,
		right: 24,
		height: 56,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	buttonDisabled: {
		backgroundColor: '#333333',
		opacity: 0.5
	},
	buttonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
