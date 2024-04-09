import { writable, type Unsubscriber, type Writable, get } from 'svelte/store';

export default class Sync<T> {
	private list: Writable<T[]> = writable([]);
	private subscribe = (fn: (value: T[]) => void) => this.list.subscribe(fn);
	private unsubscriber: Unsubscriber;
	public push(value: T) {
		this.list.update((list) => [...list, value]);
	}
	public peek(){
		return get(this.list)[0];
	}
	public consume() {
		const pop = () => {
			const item = get(this.list)[0];
			// console.warn("Consumed",item);
			this.unsubscriber && this.unsubscriber();
			this.list.update((moves) => moves.slice(1));
			return item;
		};
		// console.log("Consuming",get(this.list),get(this.list).length);
		if (get(this.list).length > 0) return pop();
		return new Promise<T>((res) => {
			if (get(this.list).length > 0) res(pop());
			else this.unsubscriber = this.list.subscribe((list) => list.length > 0 && res(pop()));
		});
	}
}
