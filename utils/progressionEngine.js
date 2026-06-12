/**
 * Given an exercise entry from the program builder (with sets/reps chosen by the user)
 * and the user's current week and cycle length, returns the target sets/reps for that week.
 *
 * Progression model (linear ramp over the cycle):
 *   - Sets:  +1 every quarter of the cycle  (floor(currentWeek / (cycleLength / 4)))
 *   - Reps:  +1 every 2 weeks               (floor((currentWeek - 1) / 2))
 *
 * Both values are capped to avoid unrealistic prescriptions.
 */
export function getTargetForWeek(exercise, currentWeek, cycleLength) {
	const baseSets = Number(exercise.sets) || 3;
	const baseReps = parseBaseReps(exercise.reps);
	const week = Math.max(1, currentWeek);
	const cycle = Math.max(4, cycleLength);

	const setsBonus = Math.floor((week - 1) / (cycle / 4));
	const repsBonus = Math.floor((week - 1) / 2);

	const targetSets = Math.min(baseSets + setsBonus, baseSets + 3);
	const targetReps = Math.min(baseReps + repsBonus, baseReps + 6);

	return {
		sets: targetSets,
		reps: String(targetReps)
	};
}

function parseBaseReps(reps) {
	if (!reps) return 10;
	const str = String(reps);
	// Handle range like "8-12" — use lower bound
	if (str.includes('-')) {
		const parts = str.split('-');
		const parsed = parseInt(parts[0], 10);
		return isNaN(parsed) ? 10 : parsed;
	}
	const parsed = parseInt(str, 10);
	return isNaN(parsed) ? 10 : parsed;
}
