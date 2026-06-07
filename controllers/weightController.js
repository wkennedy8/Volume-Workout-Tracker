import { db } from '@/lib/firebase';
import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	setDoc
} from 'firebase/firestore';

function weightsCol(uid) {
	return collection(db, 'users', uid, 'weights');
}

export async function getRecentWeights(uid, { take = 365 } = {}) {
	const q = query(weightsCol(uid), orderBy('date', 'desc'), limit(take));
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getWeightByDate(uid, dateKey) {
	const ref = doc(db, 'users', uid, 'weights', dateKey);
	const snap = await getDoc(ref);
	return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Upsert weight entry for a dateKey.
 * doc id == dateKey, so writes are deterministic.
 */
export async function deleteWeight(uid, dateKey) {
	const ref = doc(db, 'users', uid, 'weights', dateKey);
	await deleteDoc(ref);
}

export async function upsertWeight(uid, { dateKey, weight }) {
	const ref = doc(db, 'users', uid, 'weights', dateKey);
	await setDoc(
		ref,
		{
			date: dateKey,
			weight: Number(weight),
			updatedAt: serverTimestamp()
		},
		{ merge: true }
	);
}
