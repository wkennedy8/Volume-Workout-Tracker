import { FontFamily } from '@/constants/fonts'
import { useEffect, useRef } from 'react'
import { Animated, Modal, StyleSheet, Text, View } from 'react-native'

export default function SetLoggedOverlay({ visible, data, onDismiss }) {
	const scale = useRef(new Animated.Value(0.85)).current
	const opacity = useRef(new Animated.Value(0)).current

	useEffect(() => {
		if (visible) {
			scale.setValue(0.85)
			opacity.setValue(0)

			Animated.parallel([
				Animated.spring(scale, {
					toValue: 1,
					useNativeDriver: true,
					tension: 120,
					friction: 8
				}),
				Animated.timing(opacity, {
					toValue: 1,
					duration: 160,
					useNativeDriver: true
				})
			]).start()

			const timer = setTimeout(onDismiss, 1800)
			return () => clearTimeout(timer)
		}
	}, [visible])

	if (!data) return null

	const { weight, reps, totalSets, totalVolume, setVolume, weightUnit } = data

	return (
		<Modal visible={visible} transparent animationType='none' onRequestClose={onDismiss}>
			<View style={styles.backdrop}>
				<Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
					{/* Checkmark */}
					<View style={styles.checkCircle}>
						<Text style={styles.checkMark}>✓</Text>
					</View>

					<Text style={styles.title}>Set Logged</Text>
					<Text style={styles.subtitle}>
						{weight} {weightUnit} × {reps} reps
					</Text>

					</Animated.View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.75)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 32
	},
	card: {
		width: '100%',
		backgroundColor: '#0E1A06',
		borderRadius: 28,
		borderWidth: 1,
		borderColor: '#1E3A0A',
		alignItems: 'center',
		paddingTop: 36,
		paddingBottom: 32,
		paddingHorizontal: 24,
		gap: 8
	},
	checkCircle: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: '#1A3008',
		borderWidth: 2.5,
		borderColor: '#AFFF2B',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8
	},
	checkMark: {
		fontSize: 30,
		color: '#AFFF2B',
		fontFamily: FontFamily.black
	},
	title: {
		fontSize: 26,
		fontFamily: FontFamily.black,
		color: '#FFFFFF'
	},
	subtitle: {
		fontSize: 16,
		fontFamily: FontFamily.black,
		color: '#666666',
		marginBottom: 16
	},
	statsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
		width: '100%'
	},
	stat: {
		flex: 1,
		alignItems: 'center',
		gap: 4
	},
	statValue: {
		fontSize: 26,
		fontFamily: FontFamily.black,
		color: '#AFFF2B'
	},
	statLabel: {
		fontSize: 11,
		fontFamily: FontFamily.black,
		color: '#4A7A10',
		letterSpacing: 1
	},
	statDivider: {
		width: 1,
		height: 36,
		backgroundColor: '#1E3A0A'
	}
})
