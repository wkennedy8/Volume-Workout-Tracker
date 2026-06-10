import { getTargetForWeek } from './progressionEngine';

// JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const TRAINING_DAYS_BY_COUNT = {
	2: [1, 4],
	3: [1, 3, 5],
	4: [1, 2, 4, 5],
	5: [1, 2, 3, 4, 5],
	6: [1, 2, 3, 4, 5, 6],
	7: [0, 1, 2, 3, 4, 5, 6]
};

/**
 * Given an active program and today's date, returns the workout for today,
 * or null if today is a rest day.
 *
 * Returns: { id, title, tag, exercises: [{ name, sets, reps, muscleGroup, isCompound }] }
 */
export function getTodayWorkoutFromProgram(program, today = new Date()) {
	if (!program?.days?.length) return null;

	const daysPerWeek = program.daysPerWeek ?? 3;
	const trainingDays = TRAINING_DAYS_BY_COUNT[daysPerWeek] ?? TRAINING_DAYS_BY_COUNT[3];
	const dayOfWeek = today.getDay(); // 0-6

	const slotIndex = trainingDays.indexOf(dayOfWeek);
	if (slotIndex === -1) return null; // rest day

	// Determine which program day this slot maps to.
	// Across all weeks, slot indices accumulate: week N contributes daysPerWeek slots.
	const currentWeek = program.currentWeek ?? 1;
	const weekOffset = (currentWeek - 1) * daysPerWeek;
	const programDayIndex = (weekOffset + slotIndex) % program.days.length;

	const day = program.days[programDayIndex];
	if (!day) return null;

	const cycleLength = program.cycleLength ?? 8;

	const exercises = (day.exercises ?? []).map((ex) => {
		const target = getTargetForWeek(ex, currentWeek, cycleLength);
		return {
			name: ex.name,
			sets: String(ex.sets ?? target.sets),
			reps: ex.reps ?? target.reps,
			muscleGroup: ex.muscleGroup ?? '',
			isCompound: ex.isCompound ?? false,
			exerciseId: ex.exerciseId ?? ''
		};
	});

	const dayLabel = day.label ?? day.id;
	return {
		id: day.id,
		title: `${dayLabel} Day`,
		tag: dayLabel,
		exercises
	};
}

/**
 * Returns true if today is a training day for the given daysPerWeek.
 */
export function isTodayTrainingDay(daysPerWeek, today = new Date()) {
	const trainingDays = TRAINING_DAYS_BY_COUNT[daysPerWeek] ?? TRAINING_DAYS_BY_COUNT[3];
	return trainingDays.includes(today.getDay());
}
