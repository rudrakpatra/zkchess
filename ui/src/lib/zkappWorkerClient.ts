import ZkAppWorker from '$lib/ZkAppWorker?worker';

export class ZkAppWorkerClient {
	worker: Worker;
	constructor() {
		this.worker = new ZkAppWorker();
		console.log('Web Worker Successfully Initialized.', this.worker);
	}
	init() {
		this.worker.postMessage({ fn: 'init' });
	}
	start() {
		this.worker.postMessage({ fn: 'start' });
	}
	move(from: string, to: string, promotion: string) {
		this.worker.postMessage({ fn: 'move', args: { from, to, promotion } });
	}
	draw() {
		this.worker.postMessage({ fn: 'draw' });
	}
	resign() {
		this.worker.postMessage({ fn: 'resign' });
	}
	getState() {
		this.worker.postMessage({ fn: 'getState' });
	}
	onmessage(cb: (msg: string) => void) {
		this.worker.onmessage = (e) => cb(e.data);
	}
}
