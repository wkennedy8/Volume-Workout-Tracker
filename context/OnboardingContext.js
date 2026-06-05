import { createContext, useContext, useState } from 'react';

const OnboardingContext = createContext();

export function OnboardingProvider({ children }) {
	const [data, setData] = useState({
		name: '',
		email: '',
		goal: null,
		currentWeight: null,
		selectedPlanId: null,
		profilePhotoUri: null
	});

	const updateData = (key, value) => {
		setData((prev) => ({ ...prev, [key]: value }));
	};

	const resetData = () => {
		setData({
			name: '',
			email: '',
			goal: null,
			currentWeight: null,
			selectedPlanId: null,
			profilePhotoUri: null
		});
	};

	return (
		<OnboardingContext.Provider value={{ data, updateData, resetData }}>
			{children}
		</OnboardingContext.Provider>
	);
}

export function useOnboarding() {
	const context = useContext(OnboardingContext);
	if (!context) {
		throw new Error('useOnboarding must be used within OnboardingProvider');
	}
	return context;
}
