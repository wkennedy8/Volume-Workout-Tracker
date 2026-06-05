import { useAuth } from '@/context/AuthContext';
import {
	activateProgram,
	deleteProgram,
	getUserPrograms
} from '@/controllers/programController';
import { getProfile } from '@/controllers/profileController';
import { SPLIT_CONFIG } from '@/utils/splitConfig';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamily } from '../../constants/fonts';

const STATUS_LABEL = {
	active: 'Active',
	alternate: 'Alternate',
	incomplete: 'Incomplete'
};

const STATUS_COLOR = {
	active: '#AFFF2B',
	alternate: '#666666',
	incomplete: '#FF9F0A'
};

export default function MyProgramsScreen() {
	const router = useRouter();
	const { user } = useAuth();

	const [programs, setPrograms] = useState([]);
	const [loading, setLoading] = useState(true);
	const [switching, setSwitching] = useState(null); // programId being switched
	const [isPro, setIsPro] = useState(false);

	const FREE_PROGRAM_LIMIT = 2;

	async function load() {
		if (!user?.uid) return;
		try {
			setLoading(true);
			const [all, profile] = await Promise.all([
				getUserPrograms(user.uid),
				getProfile(user.uid)
			]);
			setIsPro(profile?.isPro === true);
			// Sort: active first, then alternate, then incomplete, then by createdAt desc
			all.sort((a, b) => {
				const order = { active: 0, alternate: 1, incomplete: 2 };
				const oa = order[a.status] ?? 3;
				const ob = order[b.status] ?? 3;
				if (oa !== ob) return oa - ob;
				return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
			});
			setPrograms(all);
		} catch (e) {
			console.warn(e);
		} finally {
			setLoading(false);
		}
	}

	useFocusEffect(
		useCallback(() => {
			load();
		}, [user?.uid])
	);

	function handleBuildNew() {
		if (!isPro && programs.length >= FREE_PROGRAM_LIMIT) {
			Alert.alert(
				'Program limit reached',
				`Free accounts can keep up to ${FREE_PROGRAM_LIMIT} programs. Upgrade to Pro to build unlimited programs, or delete one to make room.`,
				[{ text: 'OK' }]
			);
			return;
		}
		router.push('/program-builder');
	}

	async function handleActivate(program) {
		if (program.status === 'active') return;

		if (program.status === 'incomplete') {
			Alert.alert(
				'Incomplete Program',
				'This program is not finished yet. Finish building it first.',
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Finish Setup',
						onPress: () => router.push('/program-builder')
					}
				]
			);
			return;
		}

		Alert.alert(
			'Switch Program',
			`Make "${getSplitLabel(program)}" your active program? Your current program will be saved as an alternate.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Switch',
					onPress: async () => {
						try {
							setSwitching(program.id);
							await activateProgram(user.uid, program.id);
							await load();
						} catch (e) {
							Alert.alert('Error', 'Could not switch program.');
						} finally {
							setSwitching(null);
						}
					}
				}
			]
		);
	}

	function handleDelete(program) {
		Alert.alert(
			'Delete Program',
			`Delete "${getSplitLabel(program)}"? This cannot be undone.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							setSwitching(program.id);
							await deleteProgram(user.uid, program.id);
							await load();
						} catch (e) {
							Alert.alert('Error', 'Could not delete program.');
						} finally {
							setSwitching(null);
						}
					}
				}
			]
		);
	}

	function getSplitLabel(program) {
		return SPLIT_CONFIG[program.splitType]?.label ?? program.splitType ?? 'Custom';
	}

	function getSplitIcon(program) {
		const icons = {
			ppl: 'shuffle-outline',
			fullbody: 'body-outline',
			brosplit: 'barbell-outline'
		};
		return icons[program.splitType] ?? 'fitness-outline';
	}

	function getExerciseCount(program) {
		if (!program.days) return 0;
		return program.days.reduce((sum, d) => sum + (d.exercises?.length ?? 0), 0);
	}

	if (loading) {
		return (
			<SafeAreaView style={styles.safe} >
				<View style={styles.loadingWrap}>
					<ActivityIndicator size='large' color='#AFFF2B' />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe} >
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{programs.length === 0 ? (
					<View style={styles.emptyWrap}>
						<Ionicons name='barbell-outline' size={56} color='#333333' />
						<Text style={styles.emptyTitle}>No programs yet</Text>
						<Text style={styles.emptySubtitle}>
							Build your first custom program to get started.
						</Text>
						<TouchableOpacity
							style={styles.createBtn}
							onPress={() => router.push('/program-builder')}
							activeOpacity={0.85}
						>
							<Text style={styles.createBtnText}>Build a Program</Text>
							<Ionicons name='arrow-forward' size={16} color='#000000' />
						</TouchableOpacity>
					</View>
				) : (
					<>
						{programs.map((program) => (
							<ProgramCard
								key={program.id}
								program={program}
								splitLabel={getSplitLabel(program)}
								splitIcon={getSplitIcon(program)}
								exerciseCount={getExerciseCount(program)}
								switching={switching === program.id}
								onActivate={() => handleActivate(program)}
								onDelete={() => handleDelete(program)}
							/>
						))}

						<TouchableOpacity
							style={styles.newProgramBtn}
							onPress={handleBuildNew}
							activeOpacity={0.85}
						>
							<Ionicons name='add-circle-outline' size={20} color='#AFFF2B' />
							<Text style={styles.newProgramBtnText}>Build New Program</Text>
						</TouchableOpacity>
						{!isPro && (
							<Text style={styles.limitHint}>
								{programs.length}/{FREE_PROGRAM_LIMIT} programs · Upgrade to Pro
								for unlimited
							</Text>
						)}
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

function ProgramCard({ program, splitLabel, splitIcon, exerciseCount, switching, onActivate, onDelete }) {
	const isActive = program.status === 'active';
	const statusColor = STATUS_COLOR[program.status] ?? '#666666';

	return (
		<View style={[styles.card, isActive && styles.cardActive]}>
			{/* Card header */}
			<View style={styles.cardHeader}>
				<View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
					<Ionicons name={splitIcon} size={22} color={isActive ? '#000000' : '#AFFF2B'} />
				</View>
				<View style={styles.cardTitleWrap}>
					<Text style={styles.cardTitle}>{splitLabel}</Text>
					<View style={styles.statusRow}>
						<View style={[styles.statusDot, { backgroundColor: statusColor }]} />
						<Text style={[styles.statusText, { color: statusColor }]}>
							{STATUS_LABEL[program.status] ?? program.status}
						</Text>
					</View>
				</View>
				<TouchableOpacity
					style={styles.deleteBtn}
					onPress={onDelete}
					disabled={switching}
					activeOpacity={0.7}
					hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
				>
					<Ionicons name='trash-outline' size={18} color='#FF453A' />
				</TouchableOpacity>
			</View>

			{/* Stats row */}
			<View style={styles.statsRow}>
				<StatChip icon='calendar-outline' label={`${program.daysPerWeek ?? '?'} days/week`} />
				<StatChip icon='refresh-outline' label={`${program.cycleLength ?? '?'} week cycle`} />
				<StatChip icon='barbell-outline' label={`${exerciseCount} exercises`} />
			</View>

			{/* Day breakdown */}
			{program.days?.length > 0 && (
				<View style={styles.dayList}>
					{program.days.map((day) => (
						<View key={day.id} style={styles.dayRow}>
							<Text style={styles.dayLabel} numberOfLines={1}>
								{day.label ?? day.id}
							</Text>
							<Text style={styles.dayCount}>
								{day.exercises?.length ?? 0} exercises
							</Text>
						</View>
					))}
				</View>
			)}

			{/* Action */}
			{!isActive && (
				<TouchableOpacity
					style={styles.activateBtn}
					onPress={onActivate}
					disabled={switching}
					activeOpacity={0.85}
				>
					{switching ? (
						<ActivityIndicator size='small' color='#AFFF2B' />
					) : (
						<>
							<Ionicons name='checkmark-circle-outline' size={16} color='#AFFF2B' />
							<Text style={styles.activateBtnText}>
								{program.status === 'incomplete' ? 'Finish Setup' : 'Set as Active'}
							</Text>
						</>
					)}
				</TouchableOpacity>
			)}
		</View>
	);
}

function StatChip({ icon, label }) {
	return (
		<View style={styles.chip}>
			<Ionicons name={icon} size={12} color='#999999' />
			<Text style={styles.chipText}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#000000' },
	loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	scroll: { flex: 1 },
	content: { padding: 16, paddingTop: 70, paddingBottom: 40 },

	// Empty state
	emptyWrap: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 80,
		paddingHorizontal: 32
	},
	emptyTitle: {
		fontSize: 22,
		fontFamily: FontFamily.black,
		color: '#FFFFFF',
		marginTop: 20,
		marginBottom: 8
	},
	emptySubtitle: {
		fontSize: 14,
		fontWeight: '700',
		color: '#666666',
		textAlign: 'center',
		lineHeight: 20,
		marginBottom: 28
	},
	createBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: '#AFFF2B',
		paddingHorizontal: 24,
		paddingVertical: 14,
		borderRadius: 12
	},
	createBtnText: { fontSize: 15, fontFamily: FontFamily.black, color: '#000000' },

	// Program card
	card: {
		backgroundColor: '#1A1A1A',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		padding: 16,
		marginBottom: 12
	},
	cardActive: {
		borderColor: '#AFFF2B',
		backgroundColor: '#0F1A00'
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
		marginBottom: 14
	},
	iconWrap: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: '#1A2E00',
		alignItems: 'center',
		justifyContent: 'center'
	},
	iconWrapActive: { backgroundColor: '#AFFF2B' },
	cardTitleWrap: { flex: 1 },
	cardTitle: { fontSize: 18, fontFamily: FontFamily.black, color: '#FFFFFF', marginBottom: 4 },
	statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	statusDot: { width: 7, height: 7, borderRadius: 999 },
	statusText: { fontSize: 12, fontWeight: '800' },

	// Stats chips
	statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
	chip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: '#111111',
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#2A2A2A'
	},
	chipText: { fontSize: 11, fontWeight: '800', color: '#999999' },

	// Day list
	dayList: {
		borderTopWidth: 1,
		borderTopColor: '#2A2A2A',
		paddingTop: 12,
		marginBottom: 14,
		gap: 6
	},
	dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	dayLabel: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', flex: 1 },
	dayCount: { fontSize: 12, fontWeight: '700', color: '#666666' },

	// Actions
	activateBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		borderWidth: 1,
		borderColor: '#AFFF2B',
		borderRadius: 10,
		paddingVertical: 10
	},
	activateBtnText: { fontSize: 14, fontFamily: FontFamily.black, color: '#AFFF2B' },
	deleteBtn: {
		alignItems: 'center',
		justifyContent: 'center'
	},

	// New program button
	newProgramBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginTop: 8,
		paddingVertical: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#2A2A2A',
		borderStyle: 'dashed'
	},
	newProgramBtnText: { fontSize: 15, fontFamily: FontFamily.black, color: '#AFFF2B' },
	limitHint: {
		fontSize: 12,
		fontWeight: '700',
		color: '#666666',
		textAlign: 'center',
		marginTop: 10
	}
});
