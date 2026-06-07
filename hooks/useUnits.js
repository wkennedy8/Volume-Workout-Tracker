import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useUnits() {
	const [weightUnit, setWeightUnit] = useState('lbs');

	useEffect(() => {
		const user = getCurrentUser();
		if (!user) return;

		const ref = doc(db, 'users', user.uid);
		const unsub = onSnapshot(ref, (snap) => {
			if (snap.exists()) {
				setWeightUnit(snap.data().weightUnit || 'lbs');
			}
		});

		return () => unsub();
	}, []);

	return { weightUnit };
}
