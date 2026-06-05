import { db, storage } from '@/lib/firebase';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	serverTimestamp,
	setDoc
} from 'firebase/firestore';
import {
	deleteObject,
	getDownloadURL,
	ref,
	uploadBytes
} from 'firebase/storage';

function profileRef(uid) {
	return doc(db, 'users', uid);
}

export async function getProfile(uid) {
	const snap = await getDoc(profileRef(uid));
	if (!snap.exists()) {
		return {
			profilePhotoUri: null,
			goal: null,
			onboardingCompleted: false,
			onboardingCompletedAt: null,
			height: null,
			currentWeight: null,
			targetWeight: null,
			age: null,
			weightUnit: 'lbs',
			distanceUnit: 'miles',
			splitType: null,
			isPro: false,
			notifications: {
				workoutReminders: true,
				progressUpdates: true,
				achievements: true,
				weeklyReports: false
			}
		};
	}
	const data = snap.data() || {};
	return {
		profilePhotoUri: data.profilePhotoUri || null,
		goal: data.goal || null,
		onboardingCompleted: data.onboardingCompleted || false,
		onboardingCompletedAt: data.onboardingCompletedAt || null,
		height: data.height || null,
		currentWeight: data.currentWeight || null,
		targetWeight: data.targetWeight || null,
		age: data.age || null,
		weightUnit: data.weightUnit || 'lbs',
		distanceUnit: data.distanceUnit || 'miles',
		splitType: data.splitType || null,
		isPro: data.isPro === true,
		notifications: data.notifications || {
			workoutReminders: true,
			progressUpdates: true,
			achievements: true,
			weeklyReports: false
		}
	};
}

export async function upsertProfile(uid, patch) {
	await setDoc(
		profileRef(uid),
		{
			...patch,
			updatedAt: serverTimestamp()
		},
		{ merge: true }
	);
}

// ============================================================================
// IMAGE UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload profile photo to Firebase Storage
 * @param {string} uid - User ID
 * @param {string} imageUri - Local image URI from ImagePicker
 * @returns {Promise<string>} Download URL
 */
export async function uploadProfilePhoto(uid, imageUri) {
	try {
		// Convert image URI to blob
		const response = await fetch(imageUri);
		const blob = await response.blob();

		// Create storage reference
		const storageRef = ref(storage, `profiles/${uid}/profile-photo.jpg`);

		// Upload blob
		await uploadBytes(storageRef, blob);

		// Get download URL
		const downloadURL = await getDownloadURL(storageRef);

		return downloadURL;
	} catch (error) {
		console.error('Failed to upload profile photo:', error);
		throw error;
	}
}

/**
 * Upload progress photo to Firebase Storage
 * @param {string} uid - User ID
 * @param {string} imageUri - Local image URI from ImagePicker
 * @returns {Promise<string>} Download URL
 */
export async function uploadProgressPhoto(uid, imageUri) {
	try {
		const response = await fetch(imageUri);
		const blob = await response.blob();

		const timestamp = Date.now();
		const storageRef = ref(
			storage,
			`profiles/${uid}/progress/${timestamp}.jpg`
		);

		await uploadBytes(storageRef, blob);
		const downloadURL = await getDownloadURL(storageRef);

		return downloadURL;
	} catch (error) {
		console.error('Failed to upload progress photo:', error);
		throw error;
	}
}

/**
 * Delete progress photo from Firebase Storage
 * @param {string} storagePath - Full storage path (from photo metadata)
 */
export async function deleteProgressPhotoFromStorage(storagePath) {
	try {
		const storageRef = ref(storage, storagePath);
		await deleteObject(storageRef);
	} catch (error) {
		console.error('Failed to delete progress photo from storage:', error);
		throw error;
	}
}

// ============================================================================
// PROGRESS PHOTOS FIRESTORE FUNCTIONS
// ============================================================================

function progressPhotosRef(uid) {
	return collection(db, 'users', uid, 'progressPhotos');
}

/**
 * Get all progress photos for a user
 * @param {string} uid - User ID
 * @returns {Promise<Array>} Array of progress photos sorted by date (newest first)
 */
export async function getProgressPhotos(uid) {
	try {
		const q = query(progressPhotosRef(uid), orderBy('createdAt', 'desc'));
		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			createdAt:
				doc.data().createdAt?.toDate?.()?.toISOString() ||
				new Date().toISOString()
		}));
	} catch (error) {
		console.error('Failed to get progress photos:', error);
		return [];
	}
}

/**
 * Add progress photo metadata to Firestore
 * @param {string} uid - User ID
 * @param {Object} photoData - Photo data {downloadURL, storagePath}
 * @returns {Promise<Object>} Created photo document with id
 */
export async function addProgressPhoto(uid, photoData) {
	try {
		const docRef = await addDoc(progressPhotosRef(uid), {
			downloadURL: photoData.downloadURL,
			storagePath: photoData.storagePath,
			createdAt: serverTimestamp()
		});

		return {
			id: docRef.id,
			downloadURL: photoData.downloadURL,
			storagePath: photoData.storagePath,
			createdAt: new Date().toISOString()
		};
	} catch (error) {
		console.error('Failed to add progress photo:', error);
		throw error;
	}
}

/**
 * Delete progress photo metadata from Firestore
 * @param {string} uid - User ID
 * @param {string} photoId - Photo document ID
 */
export async function deleteProgressPhotoMetadata(uid, photoId) {
	try {
		await deleteDoc(doc(db, 'users', uid, 'progressPhotos', photoId));
	} catch (error) {
		console.error('Failed to delete progress photo metadata:', error);
		throw error;
	}
}

/**
 * Get user settings (name, email, phone, reminder settings)
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User settings
 */
export async function getUserSettings(uid) {
	const snap = await getDoc(profileRef(uid));
	if (!snap.exists()) {
		return {
			name: '',
			email: '',
			phone: '',
			reminderEnabled: false,
			reminderTime: '20:00' // Default 8:00 PM
		};
	}
	const data = snap.data() || {};
	return {
		name: data.name || '',
		email: data.email || '',
		phone: data.phone || '',
		reminderEnabled: data.reminderEnabled || false,
		reminderTime: data.reminderTime || '20:00'
	};
}

/**
 * Update user settings
 * @param {string} uid - User ID
 * @param {Object} settings - { name, email, phone, reminderEnabled, reminderTime }
 */
export async function updateUserSettings(uid, settings) {
	await upsertProfile(uid, {
		...settings,
		updatedAt: serverTimestamp()
	});
}
