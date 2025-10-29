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

@Injectable({
	providedIn: 'root',
})
export class ScoreService {
	private readonly SECRET_KEY = 'kigyok-kigyoznak';
	private readonly indexedDbService = inject(IndexedDbService);
	private readonly firestore = inject(Firestore);
	private readonly authService = inject(AuthService);

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

	private async generateHash(data: Omit<ScoreData, 'hash' | 'isSynced' | 'userId'>): Promise<string> {
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
		const rawData: Omit<ScoreData, 'hash' | 'isSynced' | 'userId'> = {
			score,
			level,
			date: Date.now(),
			gameDurationMs,
			maxSnakeLength,
			foodEatenCount,
			movesCount,
		};
		const hash = await this.generateHash(rawData);
		const finalScore: Omit<ScoreData, 'userId'> = { ...rawData, hash, isSynced: false };

		await this.indexedDbService.addScore(finalScore);
		console.log(`Score saved locally (${finalScore.level}).`);
	}

	private async markScoresAsSynced(scores: ScoreData[]): Promise<void> {
		const ids = scores.map((s) => s.userId!).filter((id): id is number => id !== undefined);
		return this.indexedDbService.markScoresAsSynced(ids);
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
				const batch = writeBatch(this.firestore);
				const scoreCollection = collection(this.firestore, 'Scores');

				for (const score of unsyncedScores) {
					const scoreDocRef = doc(scoreCollection);
					const { userId, isSynced, ...scoreForFirestore } = score;
					batch.set(scoreDocRef, { ...scoreForFirestore, userId: user.uid });
				}

				await batch.commit();
				await this.markScoresAsSynced(unsyncedScores);
				console.log(`Sync successful: ${unsyncedScores.length} scores uploaded.`);
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
