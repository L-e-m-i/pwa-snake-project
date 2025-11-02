import { Injectable } from '@angular/core';
import { ScoreData } from '../models/scoreData';

type StoredScoreData = Omit<ScoreData, 'isSynced'> & { isSynced: 0 | 1 };

@Injectable({
	providedIn: 'root',
})
export class IndexedDbService {
	private dbName = 'SnakePwaDatabase';
	private storeName = 'scores';
	private dbVersion = 1;

	private openDb(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			if (!window.indexedDB) {
				return reject(new Error('IndexedDB not supported'));
			}

			const request = window.indexedDB.open(this.dbName, this.dbVersion);

			request.onerror = (event) => {
				console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
				reject(new Error('Error opening IndexedDB.'));
			};

			request.onsuccess = (event) => {
				resolve((event.target as IDBOpenDBRequest).result);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				if (!db.objectStoreNames.contains(this.storeName)) {
					const store = db.createObjectStore(this.storeName, {
						keyPath: 'id',
						autoIncrement: true,
					});

					store.createIndex('isSynced', 'isSynced', { unique: false });
					store.createIndex('score', 'score', { unique: false });
					store.createIndex('date', 'date', { unique: false });
					console.log(`Object Store '${this.storeName}' created.`);
				}
			};
		});
	}

	public async addScore(score: Omit<ScoreData, 'id'>): Promise<void> {
		const db = await this.openDb();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const scoreToStore: Omit<StoredScoreData, 'id'> = {
				...score,
				isSynced: score.isSynced ? 1 : 0,
			};
			const request = store.add(scoreToStore);

			request.onsuccess = () => {
				resolve();
			};

			request.onerror = (event) => {
				console.error('Error adding score:', (event.target as IDBRequest).error);
				reject((event.target as IDBRequest).error);
			};

			transaction.oncomplete = () => db.close();
			transaction.onerror = (event) => {
				console.error('Transaction error:', (event.target as IDBTransaction).error);
				reject((event.target as IDBTransaction).error);
			};
		});
	}

	/*public async getAllScores(): Promise<ScoreData[]> {
		const db = await this.openDb();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, 'readonly');
			const store = transaction.objectStore(this.storeName);

			const scores: ScoreData[] = [];
			const index = store.index('score');

			const request = store.getAll();

			request.onsuccess = (event) => {
				const result = (event.target as IDBRequest).result as StoredScoreData[];
				const scores = result.map((score) => ({
					...score,
					isSynced: !!score.isSynced,
				}));
				resolve(scores);
			};

			request.onerror = (event) => {
				console.error('Error reading scores:', (event.target as IDBRequest).error);
				reject((event.target as IDBRequest).error);
			};

			transaction.oncomplete = () => db.close();
			transaction.onerror = (event) => reject((event.target as IDBTransaction).error);
		});
	}*/

	public async getUnsyncedScores(): Promise<ScoreData[]> {
		const db = await this.openDb();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, 'readonly');
			const store = transaction.objectStore(this.storeName);
			const index = store.index('isSynced');


			const request = index.getAll(IDBKeyRange.only(0));

			request.onsuccess = (event) => {
				const result = (event.target as IDBRequest).result as StoredScoreData[];

				const scores = result.map((score) => ({
					...score,
					isSynced: !!score.isSynced,
				}));
				resolve(scores);
			};

			request.onerror = (event) => {
				console.error('Error reading unsynced scores:', (event.target as IDBRequest).error);
				reject((event.target as IDBRequest).error);
			};

			transaction.oncomplete = () => db.close();
			transaction.onerror = (event) => reject((event.target as IDBTransaction).error);
		});
	}

	public async markScoresAsSynced(scores: ScoreData[]): Promise<void> {
		if (scores.length === 0) {
			return Promise.resolve();
		}

		const db = await this.openDb();

		return new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, 'readwrite');
			const store = transaction.objectStore(this.storeName);

			for (const score of scores) {
				const id = score.id;
				const getRequest = store.get(id);

				getRequest.onsuccess = (event) => {
					const record = (event.target as IDBRequest).result as StoredScoreData;

					if (record && record.isSynced === 0) {

						record.isSynced = 1;
						store.put(record);
					}
				};

				getRequest.onerror = (event) => {
					console.warn(
						`Could not find or update record with ID ${id}:`,
						(event.target as IDBRequest).error
					);
				};
			}

			transaction.oncomplete = () => {
				db.close();
				resolve();
			};

			transaction.onerror = (event) => {
				console.error('Error marking scores as synced:', (event.target as IDBTransaction).error);
				db.close();
				reject((event.target as IDBTransaction).error);
			};
		});
	}
}
