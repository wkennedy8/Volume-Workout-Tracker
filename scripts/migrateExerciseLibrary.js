/**
 * One-time migration: upload exerciseLibrary.json to Firestore `exercises` collection.
 *
 * Run with:
 *   node --experimental-vm-modules scripts/migrateExerciseLibrary.js
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account key,
 * or run from a machine already authenticated with `firebase login`.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const exerciseLibrary = require('../utils/exerciseLibrary.json');

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
	? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
	: null;

if (serviceAccount) {
	initializeApp({ credential: cert(serviceAccount) });
} else {
	// Falls back to application default credentials
	initializeApp({ projectId: 'earned-59f4f' });
}

const db = getFirestore();

async function migrate() {
	const exercises = exerciseLibrary.exercises;
	console.log(`Migrating ${exercises.length} exercises to Firestore...`);

	const batch = db.batch();
	let count = 0;

	for (const exercise of exercises) {
		const ref = db.collection('exercises').doc(exercise.id);
		batch.set(ref, exercise, { merge: true });
		count++;

		// Firestore batch limit is 500 writes
		if (count % 500 === 0) {
			await batch.commit();
			console.log(`Committed ${count} exercises`);
		}
	}

	await batch.commit();
	console.log(`Migration complete. ${count} exercises uploaded.`);
}

migrate().catch(console.error);
