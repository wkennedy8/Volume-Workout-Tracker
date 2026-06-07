const LBS_PER_KG = 2.20462;

export function lbsToKg(lbs) {
	return Math.round((lbs / LBS_PER_KG) * 10) / 10;
}

export function kgToLbs(kg) {
	return Math.round(kg * LBS_PER_KG * 10) / 10;
}

// Convert a stored lbs value for display in the user's preferred unit
export function displayWeight(lbs, unit) {
	if (lbs == null) return null;
	return unit === 'kg' ? lbsToKg(lbs) : lbs;
}

// Convert a user-entered value back to lbs for storage
export function toStoredLbs(value, unit) {
	if (value == null) return null;
	return unit === 'kg' ? kgToLbs(Number(value)) : Number(value);
}

export function weightUnitLabel(unit) {
	return unit === 'kg' ? 'kg' : 'lbs';
}
