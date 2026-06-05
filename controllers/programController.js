import { db } from '@/lib/firebase';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	serverTimestamp,
	updateDoc,
	where
} from 'firebase/firestore';

function programsCol(uid) {
	return collection(db, 'users', uid, 'programs');
}

function programRef(uid, programId) {
	return doc(db, 'users', uid, 'programs', programId);
}

export async function createProgram(uid, data) {
	const ref = await addDoc(programsCol(uid), {
		...data,
		status: 'incomplete',
		currentWeek: 1,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	});
	return ref.id;
}

export async function updateProgram(uid, programId, patch) {
	await updateDoc(programRef(uid, programId), {
		...patch,
		updatedAt: serverTimestamp()
	});
}

export async function getActiveProgram(uid) {
	const q = query(programsCol(uid), where('status', '==', 'active'));
	const snap = await getDocs(q);
	if (snap.empty) return null;
	const d = snap.docs[0];
	return { id: d.id, ...d.data() };
}

export async function getIncompleteProgram(uid) {
	const q = query(programsCol(uid), where('status', '==', 'incomplete'));
	const snap = await getDocs(q);
	if (snap.empty) return null;
	const d = snap.docs[0];
	return { id: d.id, ...d.data() };
}

export async function getUserPrograms(uid) {
	const snap = await getDocs(programsCol(uid));
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function activateProgram(uid, programId) {
	// Demote any current active program to alternate
	const active = await getActiveProgram(uid);
	if (active && active.id !== programId) {
		await updateDoc(programRef(uid, active.id), {
			status: 'alternate',
			updatedAt: serverTimestamp()
		});
	}

	// Activate the new program, reset cycle progress
	await updateDoc(programRef(uid, programId), {
		status: 'active',
		currentWeek: 1,
		cycleStartDate: new Date().toISOString(),
		startDate: new Date().toISOString(),
		updatedAt: serverTimestamp()
	});
}

export async function deleteProgram(uid, programId) {
	// Capture the program's status before deleting so we know whether to promote
	const snap = await getDoc(programRef(uid, programId));
	const wasActive = snap.exists() && snap.data().status === 'active';

	await deleteDoc(programRef(uid, programId));

	// If we deleted the active program, promote an alternate (if one exists)
	if (wasActive) {
		const q = query(programsCol(uid), where('status', '==', 'alternate'));
		const alternates = await getDocs(q);
		if (!alternates.empty) {
			const promote = alternates.docs[0];
			await updateDoc(programRef(uid, promote.id), {
				status: 'active',
				updatedAt: serverTimestamp()
			});
		}
	}
}

export async function getProgramById(uid, programId) {
	const snap = await getDoc(programRef(uid, programId));
	if (!snap.exists()) return null;
	return { id: snap.id, ...snap.data() };
}

export async function finalizeProgram(uid, programId) {
	await activateProgram(uid, programId);
}

/**
 * Called when a session for a program is completed. If all training days for the
 * current week are now done, advances the program's currentWeek (or marks the
 * cycle complete once cycleLength is reached).
 *
 * Returns: { shouldAdvance, programCompleted, completedWeek, nextWeek, message }
 */
export async function advanceProgramWeekOnCompletion(uid, programId, completedWeek) {
	const program = await getProgramById(uid, programId);
	if (!program) {
		return { shouldAdvance: false, programCompleted: false };
	}

	const currentWeek = program.currentWeek ?? 1;
	const daysPerWeek = program.daysPerWeek ?? (program.days?.length ?? 3);
	const cycleLength = program.cycleLength ?? 8;

	// Only react to completions for the week the program is currently on
	if (completedWeek !== currentWeek) {
		return { shouldAdvance: false, programCompleted: false, completedWeek };
	}

	// Count completed sessions belonging to this program in the current week.
	// Query by programId only (single-field, no composite index needed) and
	// filter the rest in memory.
	const q = query(
		collection(db, 'users', uid, 'sessions'),
		where('programId', '==', programId)
	);
	const snap = await getDocs(q);
	const completedDayIds = new Set();
	snap.forEach((d) => {
		const s = d.data();
		if (s.status === 'completed' && s.programWeek === currentWeek) {
			completedDayIds.add(s.templateId);
		}
	});
	const completedCount = completedDayIds.size;

	if (completedCount < daysPerWeek) {
		return { shouldAdvance: false, programCompleted: false, completedWeek };
	}

	// Week is complete
	if (currentWeek >= cycleLength) {
		await updateDoc(programRef(uid, programId), {
			status: 'completed',
			completedAt: new Date().toISOString(),
			updatedAt: serverTimestamp()
		});
		return {
			shouldAdvance: false,
			programCompleted: true,
			completedWeek: currentWeek,
			nextWeek: currentWeek,
			message: `You completed all ${cycleLength} weeks of your program!`
		};
	}

	const nextWeek = currentWeek + 1;
	await updateDoc(programRef(uid, programId), {
		currentWeek: nextWeek,
		updatedAt: serverTimestamp()
	});
	return {
		shouldAdvance: true,
		programCompleted: false,
		completedWeek: currentWeek,
		nextWeek,
		message: `Week ${currentWeek} complete! Week ${nextWeek} starts next workout.`
	};
}
