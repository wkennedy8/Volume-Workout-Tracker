import EmailStep from '@/components/onboarding/EmailStep';
import GoalStep from '@/components/onboarding/GoalStep';
import NameStep from '@/components/onboarding/NameStep';
import PhotoStep from '@/components/onboarding/PhotoStep';
import ProgramStep from '@/components/onboarding/ProgramStep';
import WeightStep from '@/components/onboarding/WeightStep';
import { useOnboarding } from '@/context/OnboardingContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
	const router = useRouter();
	const { data } = useOnboarding();
	const [currentStep, setCurrentStep] = useState(0);

	const steps = [
		{ component: NameStep, name: 'name' },
		{ component: EmailStep, name: 'email' },
		{ component: GoalStep, name: 'goal' },
		{ component: WeightStep, name: 'weight' },
		{ component: ProgramStep, name: 'program' },
		{ component: PhotoStep, name: 'photo' }
	];

	const CurrentStepComponent = steps[currentStep].component;
	const totalSteps = steps.length;

	function handleNext() {
		if (currentStep < totalSteps - 1) {
			setCurrentStep((prev) => prev + 1);
		}
	}

	function handleBack() {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	}

	function handleComplete() {
		router.replace('/program-builder');
	}

	return (
		<SafeAreaView style={styles.safe}>
			<CurrentStepComponent
				onNext={handleNext}
				onBack={handleBack}
				onComplete={handleComplete}
				currentStep={currentStep}
				totalSteps={totalSteps}
				canGoBack={currentStep > 0}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' }
});
