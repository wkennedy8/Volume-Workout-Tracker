import CustomTabBar from '@/components/CustomTabBar'
import { Tabs } from 'expo-router'

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{ headerShown: false }}
			tabBar={(props) => <CustomTabBar {...props} />}
		>
			<Tabs.Screen
				name='index'
				options={{ title: 'Home', tabBarLabel: 'Home' }}
			/>
			<Tabs.Screen
				name='workout'
				options={{ title: 'Workout', tabBarLabel: 'Workout' }}
			/>
			<Tabs.Screen
				name='calendar'
				options={{ title: 'Calendar', tabBarLabel: 'Calendar' }}
			/>
			<Tabs.Screen
				name='analytics'
				options={{ title: 'Analytics', tabBarLabel: 'Analytics' }}
			/>
		</Tabs>
	)
}
