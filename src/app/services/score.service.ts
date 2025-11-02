import { effect, inject, Injectable } from '@angular/core';
import { ScoreData } from '../models/scoreData';
import { GameLevel } from './snake.service';
import { IndexedDbService } from './index-db.service';
import {
	collection,
	doc,
	Firestore,
	getDoc,
	getDocs,
	orderBy,
	query,
	where,
	writeBatch,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import {
	Functions,
	HttpsCallable,
	httpsCallable,
	HttpsCallableResult,
} from '@angular/fire/functions';

@Injectable({
	providedIn: 'root',
})
export class ScoreService {
	private readonly SECRET_KEY = 'kigyok-kigyoznak';
	private readonly indexedDbService = inject(IndexedDbService);
	private readonly firestore = inject(Firestore);
	private readonly authService = inject(AuthService);
	private readonly functions = inject(Functions);

	constructor() {
		effect(() => {
			if (this.authService.user()) {
				console.log('User is logged in. Attempting to sync scores.');
				this.attemptSync();
			} else {
				console.log('User is logged out. No sync action needed.');
			}
		});
	}

	private async generateHash(
		data: Omit<ScoreData, 'hash' | 'isSynced' | 'userId' | 'id'>
	): Promise<string> {
		const dataString = JSON.stringify({
			score: data.score,
			level: data.level,
			gameDurationMs: data.gameDurationMs,
			maxSnakeLength: data.maxSnakeLength,
			foodEatenCount: data.foodEatenCount,
			movesCount: data.movesCount,
			secret: this.SECRET_KEY,
		});

		const encoder = new TextEncoder();
		const dataBuffer = encoder.encode(dataString);
		const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	public async saveScore(
		score: number,
		level: GameLevel,
		gameDurationMs: number,
		maxSnakeLength: number,
		foodEatenCount: number,
		movesCount: number
	): Promise<void> {
		const rawData: Omit<ScoreData, 'hash' | 'isSynced' | 'userId' | 'id'> = {
			score,
			level,
			date: Date.now(),
			gameDurationMs,
			maxSnakeLength,
			foodEatenCount,
			movesCount,
		};
		const hash = await this.generateHash(rawData);
		const finalScore: Omit<ScoreData, 'userId' | 'id'> = { ...rawData, hash, isSynced: false };

		await this.indexedDbService.addScore(finalScore);
		console.log(`Score saved locally (${finalScore.level}).`);
	}

	private async markScoresAsSynced(scores: ScoreData[], syncedIds: number[]): Promise<void> {
		const validScoresToMark = scores.filter((s) => s.id && syncedIds.includes(s.id));
		if (validScoresToMark.length === 0) {
			return;
		}

		await this.indexedDbService.markScoresAsSynced(validScoresToMark);
	}

	public async attemptSync(): Promise<void> {
		const unsyncedScores = await this.indexedDbService.getUnsyncedScores();
		if (unsyncedScores.length === 0) {
			return;
		}

		const user = this.authService.user();
		if (!user) {
			console.log('User not logged in, postponing sync.');
			return;
		}

		if (navigator.onLine) {
			console.log(`Attempting to sync ${unsyncedScores.length} scores...`);
			try {
				const syncScores = httpsCallable(this.functions, 'syncScores');
				const result: HttpsCallableResult = await syncScores({ scores: unsyncedScores });

				const data = result.data as { success: boolean; syncedIds: number[] };

				if (data.success && data.syncedIds.length > 0) {
					await this.markScoresAsSynced(unsyncedScores, data.syncedIds);
					console.log(
						`Sync successful: ${data.syncedIds.length} scores validated and marked as synced.`
					);
				} else {
					console.warn('Sync complete, but server did not validate any new scores.');
				}

				// const batch = writeBatch(this.firestore);
				// const scoreCollection = collection(this.firestore, 'Scores');

				// for (const score of unsyncedScores) {
				// 	const scoreDocRef = doc(scoreCollection);
				// 	const { userId, isSynced, ...scoreForFirestore } = score;
				// 	batch.set(scoreDocRef, { ...scoreForFirestore, userId: user.uid });
				// }

				// await batch.commit();
				// await this.markScoresAsSynced(unsyncedScores);
				// console.log(`Sync successful: ${unsyncedScores.length} scores uploaded.`);
			} catch (error) {
				console.error('Sync failed:', error);
			}
		}
	}

	public async getScoresByLevel(level: GameLevel): Promise<ScoreData[]> {
		const collectionRef = collection(this.firestore, 'Scores');
		const q = query(collectionRef, where('level', '==', level), orderBy('score', 'desc'));
		const querySnapshot = await getDocs(q);

		const uniqueScoresMap = new Map<string, ScoreData>();
		querySnapshot.forEach((doc) => {
			const score = doc.data() as ScoreData & { userId: string };
			if (score.userId && !uniqueScoresMap.has(score.userId)) {
				uniqueScoresMap.set(score.userId, score);
			}
		});

		const scores = Array.from(uniqueScoresMap.values());

		return Promise.all(
			scores.map(async (score) => {
				const userId = (score as ScoreData & { userId: string }).userId;
				const userDocRef = doc(this.firestore, 'Users', userId);
				const userDocSnap = await getDoc(userDocRef);
				const username = userDocSnap.exists() ? userDocSnap.data()?.['username'] : 'Anonymous';
				return { ...score, username };
			})
		);
	}
}
