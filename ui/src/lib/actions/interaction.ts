import { expoOut } from 'svelte/easing';
import { tweened } from 'svelte/motion';
export function animationOnFocus(
	el: HTMLElement,
	animation = (el: HTMLElement, t: number) => {
		const x1 = t * 100;
		const x2 = t * 102;
		el.dataset.originalTextColor =
			el.dataset.originalTextColor || window.getComputedStyle(el).color;
		const backgroundColor = window.getComputedStyle(el).backgroundColor;
		// el.style.backgroundImage = `linear-gradient(30deg, #ffff ${x1}%, #0000 ${x2}%, #0000)`;
		// el.style.backgroundImage = `conic-gradient(from 0deg, #ffff ${x1}%, #0000 ${x2}%, #0000)`;
		el.style.backgroundImage = `radial-gradient(circle at 50% 50%, ${el.dataset.originalTextColor} ${x1}%, ${backgroundColor} ${x2}%, ${backgroundColor})`;
		el.style.color = x1 < 50 ? el.dataset.originalTextColor : backgroundColor;
	}
) {
	const focusTween = tweened(0, { easing: expoOut, duration: 500 });
	const onfocusin = () => {
		focusTween.set(1);
	};
	const onfocusout = () => {
		focusTween.set(0);
	};
	focusTween.subscribe((t) => animation(el, t));
	el.addEventListener('focusin', onfocusin);
	el.addEventListener('focusout', onfocusout);
	return {
		destroy: () => {
			el.removeEventListener('focusin', onfocusin);
			el.removeEventListener('focusout', onfocusout);
		}
	};
}
