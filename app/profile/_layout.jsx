import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function ProfileLayout() {
	const router = useRouter();

	return (
		<Stack
			screenOptions={{
				headerShown: true,
				headerStyle: {
					backgroundColor: '#000000'
				},
				headerTintColor: '#FFFFFF',
				headerShadowVisible: false,
				headerTitle: '',
				headerTransparent: true,
				headerLeft: () => (
					<TouchableOpacity
						onPress={() => router.back()}
						style={{
							marginLeft: 2
						}}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<Ionicons name='chevron-back' size={28} color='#AFFF2B' />
					</TouchableOpacity>
				)
			}}
		>
			<Stack.Screen name='index' options={{ headerTitle: '' }} />
			<Stack.Screen
				name='edit'
				options={{
					headerTitle: 'Edit Profile'
				}}
			/>
			<Stack.Screen
				name='workout-plan'
				options={{
					headerTitle: 'Workout Plan'
				}}
			/>
			<Stack.Screen
				name='health'
				options={{
					headerTitle: 'Health Details'
				}}
			/>
			<Stack.Screen
				name='goals'
				options={{
					headerTitle: 'Change Goals'
				}}
			/>
			<Stack.Screen
				name='units'
				options={{
					headerTitle: 'Units of Measure'
				}}
			/>
			<Stack.Screen
				name='privacy'
				options={{
					headerTitle: 'Privacy'
				}}
			/>
			<Stack.Screen
				name='notifications'
				options={{
					headerTitle: 'Notifications'
				}}
			/>
			<Stack.Screen
				name='programs'
				options={{
					headerTitle: 'My Programs'
				}}
			/>
		</Stack>
	);
}
