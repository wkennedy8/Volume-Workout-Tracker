import { useAuth } from '@/context/AuthContext';
import { getProfile, upsertProfile } from '@/controllers/profileController';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

export default function GoalsScreen() {
	const router = useRouter();
	const { user } = useAuth();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [goal, setGoal] = useState(null);

	useEffect(() => {
		if (!user?.uid) return;

		(async () => {
			try {
				const profile = await getProfile(user.uid);
				setGoal(profile?.goal || null);
			} catch (error) {
				console.error('Failed to load goal:', error);
			} finally {
				setLoading(false);
			}
		})();
	}, [user?.uid]);

	async function handleSave() {
		if (!user?.uid || !goal) return;

		setSaving(true);
		try {
			await upsertProfile(user.uid, { goal });
			Alert.alert('Success', 'Goal updated');
			router.back();
		} catch (error) {
			console.error('Failed to save goal:', error);
			Alert.alert('Error', 'Failed to update goal');
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
			<View style={styles.container}>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					{/* Header */}
					<View style={styles.header}>
						<Text style={styles.title}>Change Goals</Text>
						<Text style={styles.subtitle}>Update your fitness objective</Text>
					</View>

					{/* Goal Options */}
					<View style={styles.section}>
						<Text style={[styles.sectionTitle, { marginBottom: 14 }]}>
							Fitness Goal
						</Text>
						<View style={styles.goalOptions}>
							<TouchableOpacity
								style={[
									styles.goalOption,
									goal === 'lose' && styles.goalOptionActive
								]}
								onPress={() => setGoal('lose')}
								activeOpacity={0.7}
							>
								<View style={styles.goalIconContainer}>
									<Ionicons
										name='trending-down'
										size={32}
										color={goal === 'lose' ? '#000000' : '#AFFF2B'}
									/>
								</View>
								<View style={styles.goalContent}>
									<Text
										style={[
											styles.goalTitle,
											goal === 'lose' && styles.goalTitleActive
										]}
									>
										Lose Weight
									</Text>
									<Text
										style={[
											styles.goalDescription,
											goal === 'lose' && styles.goalDescriptionActive
										]}
									>
										Shed pounds and get lean
									</Text>
								</View>
								{goal === 'lose' && (
									<Ionicons name='checkmark-circle' size={24} color='#000000' />
								)}
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.goalOption,
									goal === 'maintain' && styles.goalOptionActive
								]}
								onPress={() => setGoal('maintain')}
								activeOpacity={0.7}
							>
								<View style={styles.goalIconContainer}>
									<Ionicons
										name='remove-outline'
										size={32}
										color={goal === 'maintain' ? '#000000' : '#AFFF2B'}
									/>
								</View>
								<View style={styles.goalContent}>
									<Text
										style={[
											styles.goalTitle,
											goal === 'maintain' && styles.goalTitleActive
										]}
									>
										Maintain Weight
									</Text>
									<Text
										style={[
											styles.goalDescription,
											goal === 'maintain' && styles.goalDescriptionActive
										]}
									>
										Stay at your current weight
									</Text>
								</View>
								{goal === 'maintain' && (
									<Ionicons name='checkmark-circle' size={24} color='#000000' />
								)}
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.goalOption,
									goal === 'gain' && styles.goalOptionActive
								]}
								onPress={() => setGoal('gain')}
								activeOpacity={0.7}
							>
								<View style={styles.goalIconContainer}>
									<Ionicons
										name='trending-up'
										size={32}
										color={goal === 'gain' ? '#000000' : '#AFFF2B'}
									/>
								</View>
								<View style={styles.goalContent}>
									<Text
										style={[
											styles.goalTitle,
											goal === 'gain' && styles.goalTitleActive
										]}
									>
										Gain Weight
									</Text>
									<Text
										style={[
											styles.goalDescription,
											goal === 'gain' && styles.goalDescriptionActive
										]}
									>
										Build muscle and strength
									</Text>
								</View>
								{goal === 'gain' && (
									<Ionicons name='checkmark-circle' size={24} color='#000000' />
								)}
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>

				{/* Save Button */}
				<View style={styles.bottomButton}>
					<TouchableOpacity
						style={[styles.saveButton, !goal && styles.saveButtonDisabled]}
						onPress={handleSave}
						disabled={saving || !goal}
						activeOpacity={0.9}
					>
						{saving ? (
							<ActivityIndicator color='#000000' />
						) : (
							<Text style={styles.saveButtonText}>Save Changes</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>
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
		marginBottom: 32
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

	section: {
		marginBottom: 32
	},
	sectionTitle: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},

	goalOptions: {
		gap: 12
	},
	goalOption: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		padding: 20,
		borderRadius: 16,
		borderWidth: 2,
		borderColor: '#333333',
		backgroundColor: '#1A1A1A'
	},
	goalOptionActive: {
		backgroundColor: '#AFFF2B',
		borderColor: '#AFFF2B'
	},
	goalIconContainer: {
		width: 48,
		height: 48,
		borderRadius: 12,
		backgroundColor: 'rgba(175, 255, 43, 0.1)',
		alignItems: 'center',
		justifyContent: 'center'
	},
	goalContent: {
		flex: 1
	},
	goalTitle: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 4
	},
	goalTitleActive: {
		color: '#000000'
	},
	goalDescription: {
		fontSize: 14,
		fontWeight: '700',
		color: '#999999'
	},
	goalDescriptionActive: {
		color: '#000000',
		opacity: 0.7
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
	saveButtonDisabled: {
		backgroundColor: '#333333',
		opacity: 0.5
	},
	saveButtonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
