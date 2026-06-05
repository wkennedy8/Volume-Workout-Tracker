import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { FontFamily } from '../constants/fonts';

const { width, height } = Dimensions.get('window');

const BAR_WIDTH = Math.round(width * 0.11);
const BAR_GAP = Math.round(width * 0.04);
const BAR_HEIGHTS = [
	Math.round(height * 0.13),
	Math.round(height * 0.24),
	Math.round(height * 0.35)
];

export default function SplashAnimation({ onComplete }) {
	const bar1 = useRef(new Animated.Value(0)).current;
	const bar2 = useRef(new Animated.Value(0)).current;
	const bar3 = useRef(new Animated.Value(0)).current;
	const wordmark = useRef(new Animated.Value(0)).current;
	const wordmarkY = useRef(new Animated.Value(8)).current;

	useEffect(() => {
		let holdTimeout;
		const easing = (t) => 1 - Math.pow(1 - t, 3);

		const intro = Animated.sequence([
			Animated.delay(350),
			Animated.stagger(220, [
				Animated.timing(bar1, { toValue: 1, duration: 650, easing, useNativeDriver: true }),
				Animated.timing(bar2, { toValue: 1, duration: 650, easing, useNativeDriver: true }),
				Animated.timing(bar3, { toValue: 1, duration: 650, easing, useNativeDriver: true })
			])
		]);

		const outro = Animated.parallel([
			Animated.timing(wordmark, { toValue: 1, duration: 500, useNativeDriver: true }),
			Animated.timing(wordmarkY, { toValue: 0, duration: 500, useNativeDriver: true })
		]);

		intro.start(() => {
			outro.start(() => {
				holdTimeout = setTimeout(() => onComplete?.(), 300);
			});
		});

		return () => {
			clearTimeout(holdTimeout);
			intro.stop();
			outro.stop();
		};
	}, []);

	return (
		<View style={styles.container}>
			<View style={styles.barsRow}>
				{[bar1, bar2, bar3].map((anim, i) => (
					<Animated.View
						key={i}
						style={[
							styles.bar,
							{ width: BAR_WIDTH, height: BAR_HEIGHTS[i] },
							{ transform: [{ scaleY: anim }] }
						]}
					/>
				))}
			</View>
			<Animated.Text
				style={[
					styles.wordmark,
					{ opacity: wordmark, transform: [{ translateY: wordmarkY }] }
				]}
			>
				VOLUME
			</Animated.Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#141814',
		alignItems: 'center',
		justifyContent: 'center'
	},
	barsRow: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: BAR_GAP,
		marginBottom: 32
	},
	bar: {
		backgroundColor: '#AFFF2B',
		borderRadius: 7,
		transformOrigin: 'bottom'
	},
	wordmark: {
		color: '#AFFF2B',
		fontSize: 20,
		fontFamily: FontFamily.medium,
		letterSpacing: 9
	}
});
