import {
	collection,
	doc,
	onSnapshot,
	orderBy,
	query
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';

export function useProfile() {
	const [profile, setProfile] = useState({
		name: '',
		email: '',
		goal: null,
		currentWeight: null,
		profilePhotoUri: null
	});
	const [progressPhotos, setProgressPhotos] = useState([]);

	useEffect(() => {
		let unsubProfile = null;
		let unsubPhotos = null;

		try {
			const user = getCurrentUser();
			if (!user) {
				console.warn('useProfile: No authenticated user');
				return;
			}

			const uid = user.uid;
			const profileRef = doc(db, 'users', uid);

			unsubProfile = onSnapshot(
				profileRef,
				(snap) => {
					const data = snap.exists() ? snap.data() || {} : {};
					setProfile({
						profilePhotoUri: data.profilePhotoUri || null,
						goal: data.goal || null,
						name: data.name || ''
					});
				},
				(err) => console.warn('profile subscription error:', err)
			);

			const photosRef = collection(db, 'users', uid, 'progressPhotos');
			const photosQuery = query(photosRef, orderBy('createdAt', 'desc'));

			unsubPhotos = onSnapshot(
				photosQuery,
				(snapshot) => {
					const photos = snapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
						createdAt:
							doc.data().createdAt?.toDate?.()?.toISOString() ||
							new Date().toISOString()
					}));
					setProgressPhotos(photos);
				},
				(err) => console.warn('progress photos subscription error:', err)
			);
		} catch (e) {
			console.warn('useProfile init error:', e);
		}

		return () => {
			if (unsubProfile) unsubProfile();
			if (unsubPhotos) unsubPhotos();
		};
	}, []);

	return { profile, progressPhotos };
}
