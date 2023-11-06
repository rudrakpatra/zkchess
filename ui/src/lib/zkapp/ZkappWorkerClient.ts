// import { fetchAccount, PublicKey, Field, UInt64 } from "o1js";

import ZkappWorker from './ZkappWorker?worker';
import type { ZkappWorkerRequest, ZkappWorkerReponse, WorkerFunctions } from './ZkappWorker';

export class ZkappWorkerClient {
	async init() {
		await this._call('init', {});
	}

	async start() {
		await this._call('start', {});
	}

	async move(from: string, to: string, promotion: string) {
		await this._call('move', { from, to, promotion });
	}

	async draw() {
		await this._call('draw', {});
	}

	async resign() {
		await this._call('resign', {});
	}

	async getState() {
		const result = await this._call('getState', {});
		return result;
	}

	worker: Worker;

	promises: { [id: number]: { resolve: (res: unknown) => void; reject: (err: unknown) => void } };

	nextId: number;

	constructor() {
		this.worker = new ZkappWorker();
		this.promises = {};
		this.nextId = 0;

		this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
			console.log('got message from worker', event.data);
			this.promises[event.data.id].resolve(event.data.data);
			delete this.promises[event.data.id];
		};
	}

	_call(fn: WorkerFunctions, args: unknown) {
		return new Promise((resolve, reject) => {
			const message: ZkappWorkerRequest = { id: this.nextId, fn, args };

			this.promises[this.nextId] = { resolve, reject };
			this.worker.postMessage(message);
			this.nextId++;
		});
	}
}
