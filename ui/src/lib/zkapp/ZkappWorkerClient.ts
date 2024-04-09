import * as Comlink from 'comlink';
import ZkappWorker from './ZkappWorkerDummy?worker';
import type { API } from './ZkappWorkerDummy';

export const worker = new ZkappWorker();
export const workerClient = Comlink.wrap<API>(worker);
export type workerClientAPI = typeof workerClient;
export const awaitWorker = async () => {
	await new Promise<void>((resolve) => {
		const listener = (message: MessageEvent<unknown>) => {
			if (message.data === 'ready') {
				worker.removeEventListener('message', listener);
				resolve();
			}
		};
		worker.addEventListener('message', listener);
		workerClient.ready.then((ready) => {
			if (ready) {
				resolve();
				worker.removeEventListener('message', listener);
			}
		});
	});
};
