import WorkerURL from './zkappWorker.js?url';

export default class ZkappWorkerClient {
	worker: Worker;

	constructor() {
		this.worker = new Worker(WorkerURL, { type: 'module' });
		console.log('ZkappWorkerClient created worker:', this.worker);
		this.worker.onmessage = (event: MessageEvent<string>) => {
			console.log('ZkappWorkerClient received message:', event.data);
		};
	}
	init() {
		console.log('ZkappWorkerClient sending message:', { fn: 'init' });
		this.worker.postMessage({ fn: 'init' });
	}
	start() {
		console.log('ZkappWorkerClient sending message:', { fn: 'start' });
		this.worker.postMessage({ fn: 'start' });
	}
	move(posArray: number[][], promotion: number) {
		console.log('ZkappWorkerClient sending message:', {
			fn: 'move',
			args: JSON.stringify({ posArray, promotion })
		});
		this.worker.postMessage({ fn: 'move', args: JSON.stringify({ posArray, promotion }) });
	}
	draw() {
		console.log('ZkappWorkerClient sending message:', { fn: 'draw' });
		this.worker.postMessage({ fn: 'draw' });
	}
	resign() {
		console.log('ZkappWorkerClient sending message:', { fn: 'resign' });
		this.worker.postMessage({ fn: 'resign' });
	}
	getBoard() {
		console.log('ZkappWorkerClient sending message:', { fn: 'getBoard' });
		this.worker.postMessage({ fn: 'getBoard' });
	}
}
