// One-off admin script: delete today's completed session for a user by phone.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=~/Downloads/earned-59f4f-firebase-adminsdk-fbsvc-f3a34ce8e3.json node scripts/deleteTodaySession.js

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const TARGET_PHONE_DIGITS = '3054987157'; // last 10 digits we match on
const TODAY_KEY = '2026-06-05';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const auth = getAuth();

function last10(phone) {
	return String(phone || '').replace(/\D/g, '').slice(-10);
}

async function findUidByPhone() {
	// 1) Try Firebase Auth phoneNumber
	let pageToken;
	do {
		const res = await auth.listUsers(1000, pageToken);
		for (const u of res.users) {
			if (u.phoneNumber && last10(u.phoneNumber) === TARGET_PHONE_DIGITS) {
				console.log(`Matched Auth user: ${u.uid} (${u.phoneNumber})`);
				return u.uid;
			}
		}
		pageToken = res.pageToken;
	} while (pageToken);

	// 2) Fall back to Firestore profile phone field
	const snap = await db.collection('users').get();
	for (const doc of snap.docs) {
		const data = doc.data();
		if (data.phone && last10(data.phone) === TARGET_PHONE_DIGITS) {
			console.log(`Matched Firestore profile: ${doc.id} (${data.phone})`);
			return doc.id;
		}
	}
	return null;
}

async function main() {
	const uid = await findUidByPhone();
	if (!uid) {
		console.error('No user found for phone ending', TARGET_PHONE_DIGITS);
		process.exit(1);
	}

	const sessionsRef = db.collection('users').doc(uid).collection('sessions');
	const snap = await sessionsRef.where('date', '==', TODAY_KEY).get();

	const completed = snap.docs.filter((d) => d.data().status === 'completed');

	if (completed.length === 0) {
		console.log(`No completed session on ${TODAY_KEY} for user ${uid}.`);
		process.exit(0);
	}

	for (const doc of completed) {
		const d = doc.data();
		console.log(
			`Deleting session ${doc.id} — "${d.title}" (${d.tag}), date=${d.date}, status=${d.status}`
		);
		await doc.ref.delete();
	}

	console.log(`Done. Deleted ${completed.length} session(s).`);
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
