import { db } from '@/lib/firebase';
import {
	collection,
	getDocs,
	query,
	where
} from 'firebase/firestore';

const exercisesCol = () => collection(db, 'exercises');

export async function getExercises() {
	const snap = await getDocs(exercisesCol());
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getExercisesByMuscleGroup(muscleGroup) {
	const q = query(exercisesCol(), where('muscleGroup', '==', muscleGroup));
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getCompoundExercises(muscleGroup) {
	const q = query(
		exercisesCol(),
		where('muscleGroup', '==', muscleGroup),
		where('isCompound', '==', true)
	);
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAccessoryExercises(muscleGroup) {
	const q = query(
		exercisesCol(),
		where('muscleGroup', '==', muscleGroup),
		where('isCompound', '==', false)
	);
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getExercisesForMuscleGroups(muscleGroups) {
	const results = await Promise.all(
		muscleGroups.map((mg) => getExercisesByMuscleGroup(mg))
	);
	return results.flat();
}
