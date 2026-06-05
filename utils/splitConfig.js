export const SPLIT_TYPES = {
	ppl: 'ppl',
	fullbody: 'fullbody',
	brosplit: 'brosplit'
};

export const SPLIT_CONFIG = {
	ppl: {
		id: 'ppl',
		label: 'Push / Pull / Legs',
		description: 'A 3-day split repeated twice per week. Ideal for intermediate lifters who want to train each muscle group twice.',
		suggestedDaysPerWeek: 6,
		daysPerWeekOptions: [3, 4, 5, 6],
		days: [
			{
				id: 'push',
				label: 'Push',
				muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
				compoundSuggestions: {
					Chest: { min: 1, max: 2, label: '1–2 compound chest movements' },
					Shoulders: { min: 1, max: 2, label: '1–2 compound shoulder movements' },
					Triceps: { min: 1, max: 1, label: '1 compound tricep movement' }
				},
				accessorySuggestions: {
					Chest: { min: 1, max: 2, label: '1–2 chest accessories' },
					Shoulders: { min: 1, max: 2, label: '1–2 shoulder accessories' },
					Triceps: { min: 1, max: 2, label: '1–2 tricep accessories' }
				}
			},
			{
				id: 'pull',
				label: 'Pull',
				muscleGroups: ['Back', 'Biceps'],
				compoundSuggestions: {
					Back: { min: 2, max: 3, label: '2–3 compound back movements' },
					Biceps: { min: 1, max: 1, label: '1 compound bicep movement' }
				},
				accessorySuggestions: {
					Back: { min: 1, max: 2, label: '1–2 back accessories' },
					Biceps: { min: 1, max: 2, label: '1–2 bicep accessories' }
				}
			},
			{
				id: 'legs',
				label: 'Legs',
				muscleGroups: ['Legs', 'Glutes'],
				compoundSuggestions: {
					Legs: { min: 2, max: 3, label: '2–3 compound leg movements' },
					Glutes: { min: 1, max: 2, label: '1–2 compound glute movements' }
				},
				accessorySuggestions: {
					Legs: { min: 1, max: 2, label: '1–2 leg accessories' },
					Glutes: { min: 1, max: 2, label: '1–2 glute accessories' }
				}
			}
		]
	},

	fullbody: {
		id: 'fullbody',
		label: 'Full Body',
		description: 'Train every major muscle group each session. Great for beginners and those with limited training days.',
		suggestedDaysPerWeek: 3,
		daysPerWeekOptions: [2, 3, 4],
		days: [
			{
				id: 'fullbody-a',
				label: 'Full Body A',
				muscleGroups: ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Glutes'],
				compoundSuggestions: {
					Chest: { min: 1, max: 1, label: '1 chest movement' },
					Back: { min: 1, max: 2, label: '1–2 back movements' },
					Legs: { min: 1, max: 2, label: '1–2 leg movements' },
					Shoulders: { min: 1, max: 1, label: '1 shoulder movement' },
					Biceps: { min: 0, max: 1, label: '1 bicep movement (optional)' },
					Triceps: { min: 0, max: 1, label: '1 tricep movement (optional)' },
					Glutes: { min: 0, max: 1, label: '1 glute movement (optional)' }
				},
				accessorySuggestions: {
					Chest: { min: 0, max: 1, label: '1 chest accessory (optional)' },
					Back: { min: 0, max: 1, label: '1 back accessory (optional)' },
					Legs: { min: 0, max: 1, label: '1 leg accessory (optional)' },
					Shoulders: { min: 0, max: 1, label: '1 shoulder accessory (optional)' },
					Biceps: { min: 0, max: 1, label: '1 bicep accessory (optional)' },
					Triceps: { min: 0, max: 1, label: '1 tricep accessory (optional)' },
					Glutes: { min: 0, max: 1, label: '1 glute accessory (optional)' }
				}
			},
			{
				id: 'fullbody-b',
				label: 'Full Body B',
				muscleGroups: ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Glutes'],
				compoundSuggestions: {
					Chest: { min: 1, max: 1, label: '1 chest movement' },
					Back: { min: 1, max: 2, label: '1–2 back movements' },
					Legs: { min: 1, max: 2, label: '1–2 leg movements' },
					Shoulders: { min: 1, max: 1, label: '1 shoulder movement' },
					Biceps: { min: 0, max: 1, label: '1 bicep movement (optional)' },
					Triceps: { min: 0, max: 1, label: '1 tricep movement (optional)' },
					Glutes: { min: 0, max: 1, label: '1 glute movement (optional)' }
				},
				accessorySuggestions: {
					Chest: { min: 0, max: 1, label: '1 chest accessory (optional)' },
					Back: { min: 0, max: 1, label: '1 back accessory (optional)' },
					Legs: { min: 0, max: 1, label: '1 leg accessory (optional)' },
					Shoulders: { min: 0, max: 1, label: '1 shoulder accessory (optional)' },
					Biceps: { min: 0, max: 1, label: '1 bicep accessory (optional)' },
					Triceps: { min: 0, max: 1, label: '1 tricep accessory (optional)' },
					Glutes: { min: 0, max: 1, label: '1 glute accessory (optional)' }
				}
			},
			{
				id: 'fullbody-c',
				label: 'Full Body C',
				muscleGroups: ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Glutes'],
				compoundSuggestions: {
					Chest: { min: 1, max: 1, label: '1 chest movement' },
					Back: { min: 1, max: 2, label: '1–2 back movements' },
					Legs: { min: 1, max: 2, label: '1–2 leg movements' },
					Shoulders: { min: 1, max: 1, label: '1 shoulder movement' },
					Biceps: { min: 0, max: 1, label: '1 bicep movement (optional)' },
					Triceps: { min: 0, max: 1, label: '1 tricep movement (optional)' },
					Glutes: { min: 0, max: 1, label: '1 glute movement (optional)' }
				},
				accessorySuggestions: {
					Chest: { min: 0, max: 1, label: '1 chest accessory (optional)' },
					Back: { min: 0, max: 1, label: '1 back accessory (optional)' },
					Legs: { min: 0, max: 1, label: '1 leg accessory (optional)' },
					Shoulders: { min: 0, max: 1, label: '1 shoulder accessory (optional)' },
					Biceps: { min: 0, max: 1, label: '1 bicep accessory (optional)' },
					Triceps: { min: 0, max: 1, label: '1 tricep accessory (optional)' },
					Glutes: { min: 0, max: 1, label: '1 glute accessory (optional)' }
				}
			}
		]
	},

	brosplit: {
		id: 'brosplit',
		label: 'Bro Split',
		description: 'One muscle group per day. Maximum volume and focus per session. Classic bodybuilder approach.',
		suggestedDaysPerWeek: 5,
		daysPerWeekOptions: [4, 5],
		days: [
			{
				id: 'chest',
				label: 'Chest',
				muscleGroups: ['Chest'],
				compoundSuggestions: {
					Chest: { min: 2, max: 3, label: '2–3 compound chest movements' }
				},
				accessorySuggestions: {
					Chest: { min: 2, max: 4, label: '2–4 chest accessories' }
				}
			},
			{
				id: 'back',
				label: 'Back',
				muscleGroups: ['Back'],
				compoundSuggestions: {
					Back: { min: 2, max: 3, label: '2–3 compound back movements' }
				},
				accessorySuggestions: {
					Back: { min: 2, max: 4, label: '2–4 back accessories' }
				}
			},
			{
				id: 'shoulders',
				label: 'Shoulders',
				muscleGroups: ['Shoulders'],
				compoundSuggestions: {
					Shoulders: { min: 1, max: 2, label: '1–2 compound shoulder movements' }
				},
				accessorySuggestions: {
					Shoulders: { min: 2, max: 4, label: '2–4 shoulder accessories' }
				}
			},
			{
				id: 'arms',
				label: 'Arms',
				muscleGroups: ['Biceps', 'Triceps'],
				compoundSuggestions: {
					Biceps: { min: 1, max: 2, label: '1–2 compound bicep movements' },
					Triceps: { min: 1, max: 2, label: '1–2 compound tricep movements' }
				},
				accessorySuggestions: {
					Biceps: { min: 2, max: 3, label: '2–3 bicep accessories' },
					Triceps: { min: 2, max: 3, label: '2–3 tricep accessories' }
				}
			},
			{
				id: 'legs',
				label: 'Legs',
				muscleGroups: ['Legs', 'Glutes'],
				compoundSuggestions: {
					Legs: { min: 2, max: 3, label: '2–3 compound leg movements' },
					Glutes: { min: 1, max: 2, label: '1–2 compound glute movements' }
				},
				accessorySuggestions: {
					Legs: { min: 2, max: 3, label: '2–3 leg accessories' },
					Glutes: { min: 1, max: 2, label: '1–2 glute accessories' }
				}
			}
		]
	}
};

export function getSplitConfig(splitType) {
	return SPLIT_CONFIG[splitType] ?? null;
}

export function getDayConfig(splitType, dayId) {
	const split = getSplitConfig(splitType);
	if (!split) return null;
	return split.days.find((d) => d.id === dayId) ?? null;
}
