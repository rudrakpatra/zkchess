export class Stopwatch {
	public elapsed: number = 0;
	private last_time: number = performance.now();
	private frame: number;
	private update() {
		const curr_time = window.performance.now();
		this.elapsed += curr_time - this.last_time;
		this.last_time = curr_time;
		this.frame = requestAnimationFrame(this.update.bind(this));
	}
	public start() {
		this.elapsed = 0;
		this.frame = requestAnimationFrame(this.update.bind(this));
	}
	public reset() {
		const elapsedTimeInSecs = (this.elapsed / 1000).toFixed(2) + 's';
		this.elapsed = 0;
		this.frame && cancelAnimationFrame(this.frame);
		return elapsedTimeInSecs;
	}
	public destroy() {
		this.frame && cancelAnimationFrame(this.frame);
	}
}
