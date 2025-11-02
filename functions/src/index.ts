import { setGlobalOptions } from 'firebase-functions';
import { onCall } from 'firebase-functions/https';
import * as functions from 'firebase-functions';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

admin.initializeApp();

const db = admin.firestore();

const SECRET_KEY = 'SNAKEGAME_SECRET';

function generateServerHash(data: any, secretKey: string): string {
	const dataToHash = {
		score: data.score,
		level: data.level,
		gameDurationMs: data.gameDurationMs,
		maxSnakeLength: data.maxSnakeLength,
		foodEatenCount: data.foodEatenCount,
		movesCount: data.movesCount,
		secret: secretKey,
	};

	const dataString = JSON.stringify(dataToHash);

	const hash = crypto.createHash('sha256').update(dataString).digest('hex');

	return hash;
}

export const syncScores = onCall(
	{ secrets: [SECRET_KEY] },

	async (request) => {
		const SERVER_SECRET_KEY = process.env[SECRET_KEY];

		if (!SERVER_SECRET_KEY) {
			logger.error('Server secret key is not configured.');
			throw new functions.https.HttpsError('internal', 'Server secret key is not configured.');
		}

		const unsyncedScores = request.data.scores;

		if (!Array.isArray(unsyncedScores) || unsyncedScores.length === 0) {
			throw new functions.https.HttpsError('invalid-argument', 'Invalid score data provided.');
		}

		const batch = db.batch();
		const successfulClientIds: number[] = [];

		for (const score of unsyncedScores) {
			const { userId, isSynced, ...scoreForFirestore } = score;
			const expectedHash = generateServerHash(score, SERVER_SECRET_KEY);

			if (expectedHash !== score.hash) {
				logger.warn(`Hash mismatch for score ID ${score.id}. Cheating attempt suspected.`);
				continue;
			}

			if (score.score !== score.foodEatenCount) {
				logger.warn(
					`Score logic failed: Score (${score.score}) != Food (${score.foodEatenCount}). REJECTED.`
				);
				continue;
			}
			if (score.score !== score.maxSnakeLength - 3) {
				logger.warn(
					`Score logic failed: Score (${score.score}) != MaxSnakeLength - 3 (${
						score.maxSnakeLength - 3
					}). REJECTED.`
				);
				continue;
			}
			const scorePerSecond = score.score / (score.gameDurationMs / 1000);
			if (scorePerSecond > 5) {
				logger.warn(
					`Score logic failed: Score per second (${scorePerSecond}) is too high. REJECTED.`
				);
				continue;
			}

			/*
            // const scoreCollection = collection(this.firestore, 'Scores');

				// for (const score of unsyncedScores) {
				// 	const scoreDocRef = doc(scoreCollection);
				// 	const { userId, isSynced, ...scoreForFirestore } = score;
				// 	batch.set(scoreDocRef, { ...scoreForFirestore, userId: user.uid });
            */

			const leaderboardRef = db.collection('Scores').doc();
			batch.set(leaderboardRef, {
				...scoreForFirestore,
				userId: request.auth?.uid,
			});

			successfulClientIds.push(score.id);
		}

		await batch.commit();

		return {
			success: true,
			syncedIds: successfulClientIds,
		};
	}
);
setGlobalOptions({ maxInstances: 10 });
