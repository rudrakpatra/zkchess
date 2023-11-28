import { spring } from 'svelte/motion';
export default function button(el: HTMLButtonElement) {
	const s = spring(1, { stiffness: 0.8, damping: 0.3 });
	const onpointerdown = () => {
		s.damping = 0.9;
		s.set(0.8);
	};
	const onclick = () => {
		s.damping = 0.3;
		s.set(1);
	};

	s.subscribe((v) => (el.style.transform = `scale(${v})`));

	el.addEventListener('pointerdown', onpointerdown);
	el.addEventListener('click', onclick);
	return {
		destroy: () => {
			el.removeEventListener('pointerdown', onpointerdown);
			el.removeEventListener('click', onclick);
		}
	};
}
