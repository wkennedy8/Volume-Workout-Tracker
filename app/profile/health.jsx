import { useAuth } from '@/context/AuthContext';
import { getProfile, upsertProfile } from '@/controllers/profileController';
import { getRecentWeights } from '@/controllers/weightController';
import { useUnits } from '@/hooks/useUnits';
import { displayWeight, weightUnitLabel } from '@/utils/unitsUtils';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

export default function HealthDetailsScreen() {
	const router = useRouter();
	const { user } = useAuth();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const { weightUnit } = useUnits();

	const [currentWeight, setCurrentWeight] = useState(null);
	const [targetWeight, setTargetWeight] = useState('');
	const [age, setAge] = useState('');

	useEffect(() => {
		if (!user?.uid) return;

		(async () => {
			try {
				const [profile, recentWeights] = await Promise.all([
					getProfile(user.uid),
					getRecentWeights(user.uid, { take: 1 })
				]);

				const latestWeight = recentWeights[0]?.weight ?? profile?.currentWeight ?? null;
				setCurrentWeight(latestWeight);
				setTargetWeight(profile?.targetWeight?.toString() || '');
				setAge(profile?.age?.toString() || '');
			} catch (error) {
				console.error('Failed to load health details:', error);
			} finally {
				setLoading(false);
			}
		})();
	}, [user?.uid]);

	async function handleSave() {
		if (!user?.uid) return;

		setSaving(true);
		try {
			await upsertProfile(user.uid, {
				targetWeight: targetWeight ? parseFloat(targetWeight) : null,
				age: age ? parseInt(age) : null
			});

			Alert.alert('Success', 'Health details updated');
			router.back();
		} catch (error) {
			console.error('Failed to save health details:', error);
			Alert.alert('Error', 'Failed to update health details');
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loadingWrap}>
					<ActivityIndicator size='large' color='#AFFF2B' />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.container}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
				>
					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.title}>Health Details</Text>
						<Text style={styles.subtitle}>
							Track your physical stats and measurements
						</Text>
					</View>

					{/* Form Fields */}
					<View style={styles.formSection}>
						<View style={styles.inputGroup}>
							<Text style={styles.label}>Current Weight ({weightUnitLabel(weightUnit)})</Text>
							<View style={styles.readonlyInput}>
								<Text style={currentWeight ? styles.readonlyValue : styles.readonlyPlaceholder}>
									{currentWeight != null ? `${displayWeight(currentWeight, weightUnit)} ${weightUnitLabel(weightUnit)}` : 'No weight logged yet'}
								</Text>
							</View>
						</View>

						<View style={styles.inputGroup}>
							<Text style={styles.label}>Target Weight ({weightUnitLabel(weightUnit)})</Text>
							<TextInput
								style={styles.input}
								value={targetWeight}
								onChangeText={setTargetWeight}
								placeholder='e.g., 175'
								placeholderTextColor='#666666'
								keyboardType='numeric'
							/>
						</View>

						<View style={styles.inputGroup}>
							<Text style={styles.label}>Age</Text>
							<TextInput
								style={styles.input}
								value={age}
								onChangeText={setAge}
								placeholder='e.g., 25'
								placeholderTextColor='#666666'
								keyboardType='numeric'
							/>
						</View>
					</View>
				</ScrollView>

				{/* Save Button */}
				<View style={styles.bottomButton}>
					<TouchableOpacity
						style={styles.saveButton}
						onPress={handleSave}
						disabled={saving}
						activeOpacity={0.9}
					>
						{saving ? (
							<ActivityIndicator color='#000000' />
						) : (
							<Text style={styles.saveButtonText}>Save Changes</Text>
						)}
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	container: { flex: 1 },
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 70,
		paddingBottom: 100
	},

	loadingWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},

	header: {
		marginBottom: 24
	},
	title: {
		fontSize: 28,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 8
	},
	subtitle: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999'
	},

	formSection: {
		gap: 20
	},
	inputGroup: {
		gap: 8
	},
	label: {
		fontSize: 14,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 4
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderColor: '#333333',
		borderRadius: 12,
		paddingHorizontal: 16,
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
		backgroundColor: '#1A1A1A'
	},
	readonlyInput: {
		height: 50,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		borderRadius: 12,
		paddingHorizontal: 16,
		justifyContent: 'center',
		backgroundColor: '#111111'
	},
	readonlyValue: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF'
	},
	readonlyPlaceholder: {
		fontSize: 16,
		fontWeight: '700',
		color: '#444444'
	},

	bottomButton: {
		paddingHorizontal: 24,
		paddingBottom: 24,
		paddingTop: 12
	},
	saveButton: {
		height: 54,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	saveButtonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
