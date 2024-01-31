import * as Comlink from 'comlink';
import zkAppWorker from './zkAppWorker?worker';
import type { zkAppWorkerAPI } from './zkAppWorker';
import toast from 'svelte-french-toast';

async function init() {
	const client: Comlink.Remote<zkAppWorkerAPI> = Comlink.wrap(new zkAppWorker());
	toast.promise(client.counter, {
		loading: 'client.counter',
		success: (counter) => `Counter: ${counter}`,
		error: 'Error client.counter'
	});
	await client.inc();
	toast.promise(client.counter, {
		loading: 'client.counter',
		success: (counter) => `Counter: ${counter}`,
		error: 'Error client.counter'
	});
}
init();
