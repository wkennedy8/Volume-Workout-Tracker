import {
	createProgram,
	finalizeProgram,
	getIncompleteProgram,
	updateProgram
} from '@/controllers/programController';
import { useAuth } from '@/context/AuthContext';
import { getSplitConfig } from '@/utils/splitConfig';
import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_STATE = {
	programId: null,
	splitType: null,
	daysPerWeek: null,
	cycleLength: null,
	days: []
};

export function useProgramBuilder(initialSplitType = null) {
	const { user } = useAuth();
	const [state, setState] = useState({
		...INITIAL_STATE,
		splitType: initialSplitType
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const programIdRef = useRef(null);

	// Resume incomplete program on mount
	useEffect(() => {
		if (!user?.uid) return;

		(async () => {
			try {
				const incomplete = await getIncompleteProgram(user.uid);
				if (incomplete) {
					programIdRef.current = incomplete.id;
					setState({
						programId: incomplete.id,
						splitType: incomplete.splitType ?? initialSplitType,
						daysPerWeek: incomplete.daysPerWeek ?? null,
						cycleLength: incomplete.cycleLength ?? null,
						days: incomplete.days ?? []
					});
				} else if (initialSplitType) {
					const config = getSplitConfig(initialSplitType);
					setState((prev) => ({
						...prev,
						splitType: initialSplitType,
						daysPerWeek: config?.suggestedDaysPerWeek ?? null
					}));
				}
			} catch (e) {
				console.warn('useProgramBuilder: failed to load incomplete program', e);
			} finally {
				setLoading(false);
			}
		})();
	}, [user?.uid]);

	// Persist current state to Firestore immediately
	const persist = useCallback(
		async (patch) => {
			if (!user?.uid) return;
			setSaving(true);
			try {
				if (!programIdRef.current) {
					// Create the program doc for the first time
					const id = await createProgram(user.uid, {
						...state,
						...patch
					});
					programIdRef.current = id;
					setState((prev) => ({ ...prev, ...patch, programId: id }));
				} else {
					await updateProgram(user.uid, programIdRef.current, patch);
					setState((prev) => ({ ...prev, ...patch }));
				}
			} catch (e) {
				console.warn('useProgramBuilder: failed to persist', e);
				throw e;
			} finally {
				setSaving(false);
			}
		},
		[user?.uid, state]
	);

	const setSplitType = useCallback(
		async (splitType) => {
			const config = getSplitConfig(splitType);
			await persist({
				splitType,
				daysPerWeek: config?.suggestedDaysPerWeek ?? null
			});
		},
		[persist]
	);

	const setDaysPerWeek = useCallback(
		async (daysPerWeek) => {
			await persist({ daysPerWeek });
		},
		[persist]
	);

	const setCycleLength = useCallback(
		async (cycleLength) => {
			await persist({ cycleLength });
		},
		[persist]
	);

	const saveDayExercises = useCallback(
		async (dayId, exercises) => {
			const updatedDays = [...state.days];
			const existingIndex = updatedDays.findIndex((d) => d.id === dayId);

			const config = getSplitConfig(state.splitType);
			const dayConfig = config?.days.find((d) => d.id === dayId);

			const dayData = {
				id: dayId,
				label: dayConfig?.label ?? dayId,
				muscleGroups: dayConfig?.muscleGroups ?? [],
				exercises
			};

			if (existingIndex >= 0) {
				updatedDays[existingIndex] = dayData;
			} else {
				updatedDays.push(dayData);
			}

			await persist({ days: updatedDays });
		},
		[state.days, state.splitType, persist]
	);

	const finalize = useCallback(async () => {
		if (!user?.uid || !programIdRef.current) return;
		setSaving(true);
		try {
			await finalizeProgram(user.uid, programIdRef.current);
		} finally {
			setSaving(false);
		}
	}, [user?.uid]);

	const isComplete = useCallback(() => {
		const config = getSplitConfig(state.splitType);
		if (!config || !state.daysPerWeek || !state.cycleLength) return false;
		// All days must have at least 1 exercise
		const configuredDayIds = config.days.map((d) => d.id);
		return configuredDayIds.every((dayId) => {
			const day = state.days.find((d) => d.id === dayId);
			return day && day.exercises.length > 0;
		});
	}, [state]);

	return {
		state,
		loading,
		saving,
		setSplitType,
		setDaysPerWeek,
		setCycleLength,
		saveDayExercises,
		finalize,
		isComplete
	};
}
