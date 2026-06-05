// One-off admin script: inspect a user's active program week vs. completed sessions.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=~/Downloads/earned-59f4f-firebase-adminsdk-fbsvc-f3a34ce8e3.json node scripts/checkProgramWeek.js

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const UID = 'uZWdPA7aobR0dMnS8yWxbkT4is82';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function main() {
	const programsSnap = await db
		.collection('users')
		.doc(UID)
		.collection('programs')
		.where('status', '==', 'active')
		.get();

	if (programsSnap.empty) {
		console.log('No active program.');
		process.exit(0);
	}

	const programDoc = programsSnap.docs[0];
	const program = programDoc.data();
	const currentWeek = program.currentWeek ?? 1;
	const daysPerWeek = program.daysPerWeek ?? (program.days?.length ?? 3);

	console.log(`Active program: ${programDoc.id}`);
	console.log(`  split=${program.splitType}, currentWeek=${currentWeek}, daysPerWeek=${daysPerWeek}, cycleLength=${program.cycleLength}`);

	// Count completed sessions per programWeek for this program
	const sessSnap = await db
		.collection('users')
		.doc(UID)
		.collection('sessions')
		.where('programId', '==', programDoc.id)
		.get();

	const byWeek = {};
	sessSnap.docs.forEach((d) => {
		const s = d.data();
		if (s.status === 'completed') {
			const w = s.programWeek ?? '?';
			byWeek[w] = byWeek[w] || new Set();
			byWeek[w].add(s.templateId);
		}
	});

	console.log('  Completed distinct days by programWeek:');
	Object.keys(byWeek)
		.sort()
		.forEach((w) => {
			console.log(`    week ${w}: ${byWeek[w].size} day(s) -> [${[...byWeek[w]].join(', ')}]`);
		});

	// Determine the correct current week: the lowest week not yet fully complete
	let correctWeek = 1;
	for (let w = 1; w <= (program.cycleLength ?? 8); w++) {
		const done = byWeek[w]?.size ?? 0;
		if (done >= daysPerWeek) {
			correctWeek = w + 1;
		} else {
			correctWeek = w;
			break;
		}
	}

	console.log(`\n  Stored currentWeek = ${currentWeek}`);
	console.log(`  Recomputed currentWeek = ${correctWeek}`);

	if (correctWeek !== currentWeek) {
		await programDoc.ref.update({ currentWeek: correctWeek });
		console.log(`  -> Rolled back currentWeek to ${correctWeek}.`);
	} else {
		console.log('  -> No change needed.');
	}

	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
