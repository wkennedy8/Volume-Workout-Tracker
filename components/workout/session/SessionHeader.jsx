import { FontFamily } from '@/constants/fonts';
import { StyleSheet, Text, View } from 'react-native';

export default function SessionHeader({ session, currentExerciseIndex, totalExercises }) {
	const progress = totalExercises > 0 ? currentExerciseIndex / totalExercises : 0;

	return (
		<View style={styles.header}>
			<Text style={styles.tagLabel}>{session.tag?.toUpperCase()}</Text>
			<Text style={styles.headerTitle}>{session.title}</Text>
			<View style={styles.progressTrack}>
				<View style={[styles.progressFill, { flex: progress }]} />
				<View style={[styles.progressEmpty, { flex: 1 - progress }]} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	header: { marginBottom: 16 },
	tagLabel: {
		fontSize: 13,
		fontFamily: FontFamily.black,
		color: '#AFFF2B',
		letterSpacing: 1.5,
		marginBottom: 4
	},
	headerTitle: {
		fontSize: 28,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginBottom: 10
	},
	progressTrack: {
		flexDirection: 'row',
		height: 3,
		borderRadius: 2,
		overflow: 'hidden'
	},
	progressFill: {
		backgroundColor: '#AFFF2B',
		borderRadius: 2
	},
	progressEmpty: {
		backgroundColor: '#333333',
		borderRadius: 2
	}
});
