import { useAuth } from '@/context/AuthContext';
import { useOnboarding } from '@/context/OnboardingContext';
import {
	updateUserSettings,
	uploadProfilePhoto,
	upsertProfile
} from '@/controllers/profileController';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { FontFamily } from '../../constants/fonts';
import ProgressBar from './ProgressBar';

export default function PhotoStep({
	onBack,
	onComplete,
	currentStep,
	totalSteps,
	canGoBack
}) {
	const { user } = useAuth();
	const { data, resetData } = useOnboarding();
	const [photoUri, setPhotoUri] = useState(data.profilePhotoUri);
	const [uploading, setUploading] = useState(false);

	async function requestPermissions() {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert(
				'Permission required',
				'Please allow photo library access to upload images.'
			);
			return false;
		}
		return true;
	}

	async function pickPhoto() {
		const hasPermission = await requestPermissions();
		if (!hasPermission) return;

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.9,
			allowsEditing: true,
			aspect: [1, 1]
		});

		if (result.canceled) return;

		const uri = result.assets?.[0]?.uri;
		if (uri) {
			setPhotoUri(uri);
		}
	}

	async function handleFinish() {
		if (!user?.uid) return;

		setUploading(true);

		try {
			let profilePhotoUrl = null;

			// Upload photo if selected
			if (photoUri) {
				profilePhotoUrl = await uploadProfilePhoto(user.uid, photoUri);
			}
			// Save all onboarding data to Firebase
			await Promise.all([
				updateUserSettings(user.uid, {
					name: data.name,
					email: data.email,
					phone: user.phoneNumber || ''
				}),
				upsertProfile(user.uid, {
					goal: data.goal,
					currentWeight: data.currentWeight,
					splitType: data.selectedPlanId,
					profilePhotoUri: profilePhotoUrl,
					onboardingCompleted: true,
					onboardingCompletedAt: new Date().toISOString()
				})
			]);

			// Clear onboarding data
			resetData();

			// Small delay to ensure Firestore write completes
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Navigate to main app
			onComplete();
		} catch (error) {
			console.error('❌ Failed to complete onboarding:', error);
			Alert.alert(
				'Error',
				'Failed to save your information. Please try again.'
			);
		} finally {
			setUploading(false);
		}
	}

	async function handleSkip() {
		handleFinish();
	}

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				{/* Back Button */}
				{canGoBack && (
					<TouchableOpacity style={styles.backButton} onPress={onBack}>
						<Ionicons name='chevron-back' size={28} color='#AFFF2B' />
					</TouchableOpacity>
				)}

				{/* Progress */}
				<ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.title}>Add a profile photo</Text>
					<Text style={styles.subtitle}>
						Optional, but helps personalize your experience
					</Text>
				</View>

				{/* Photo Picker */}
				<View style={styles.photoSection}>
					<TouchableOpacity
						style={styles.photoCircle}
						onPress={pickPhoto}
						activeOpacity={0.8}
					>
						{photoUri ? (
							<Image source={{ uri: photoUri }} style={styles.photoImage} />
						) : (
							<View style={styles.photoPlaceholder}>
								<Ionicons name='camera-outline' size={48} color='#666666' />
							</View>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.changePhotoButton}
						onPress={pickPhoto}
						activeOpacity={0.9}
					>
						<Text style={styles.changePhotoText}>
							{photoUri ? 'Change Photo' : 'Upload Photo'}
						</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Bottom Buttons */}
			<View style={styles.bottomButtons}>
				<TouchableOpacity
					style={styles.skipButton}
					onPress={handleSkip}
					disabled={uploading}
					activeOpacity={0.9}
				>
					<Text style={styles.skipButtonText}>Skip</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.button}
					onPress={handleFinish}
					disabled={uploading}
					activeOpacity={0.9}
				>
					{uploading ? (
						<ActivityIndicator color='#000000' />
					) : (
						<Text style={styles.buttonText}>Finish</Text>
					)}
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, paddingHorizontal: 24 },
	content: { flex: 1, paddingTop: 20 },

	backButton: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: -12,
		marginBottom: 12
	},

	header: {
		marginBottom: 48
	},
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

	photoSection: {
		alignItems: 'center',
		gap: 24
	},
	photoCircle: {
		width: 160,
		height: 160,
		borderRadius: 80,
		overflow: 'hidden',
		backgroundColor: '#1A1A1A',
		borderWidth: 3,
		borderColor: '#333333'
	},
	photoImage: {
		width: '100%',
		height: '100%'
	},
	photoPlaceholder: {
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	changePhotoButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 12,
		backgroundColor: '#2A2A2A',
		borderWidth: 1,
		borderColor: '#333333'
	},
	changePhotoText: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},

	bottomButtons: {
		gap: 12,
		marginBottom: 24
	},
	skipButton: {
		height: 56,
		borderRadius: 14,
		backgroundColor: '#1A1A1A',
		borderWidth: 1,
		borderColor: '#333333',
		alignItems: 'center',
		justifyContent: 'center'
	},
	skipButtonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	button: {
		height: 56,
		borderRadius: 14,
		backgroundColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center'
	},
	buttonText: {
		fontSize: 18,
		fontFamily: FontFamily.black,
		color: '#000000'
	}
});
