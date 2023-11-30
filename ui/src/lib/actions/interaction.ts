import { expoOut } from 'svelte/easing';
import { spring, tweened } from 'svelte/motion';
export function click(
	el: HTMLElement,
	config: {
		press: (el: HTMLElement, t: number) => void;
		focus: (el: HTMLElement, t: number) => void;
	} = {
		press: (el, t) => {
			const x = 1 - t * 0.1;
			el.style.transform = `scale(${x})`;
		},
		focus: (el, t) => {
			const x = t * 100;
			el.dataset.originalTextColor =
				el.dataset.originalTextColor || window.getComputedStyle(el).color;
			const backgroundColor = window.getComputedStyle(el).backgroundColor;
			// el.style.backgroundImage = `linear-gradient(to right, #0000 ${y}%, #ffff ${y}%, #ffff)`;
			// el.style.backgroundImage = `conic-gradient(from 0deg, #0000 ${y}%, #ffff ${y}%, #ffff)`;
			el.style.backgroundImage = `radial-gradient(circle at 50% 50%, ${el.dataset.originalTextColor} ${x}%, ${backgroundColor} ${x}%, ${backgroundColor})`;
			el.style.color = x < 50 ? el.dataset.originalTextColor : backgroundColor;
		}
	}
) {
	const pressSpring = spring(0, { stiffness: 0.5, damping: 0.5 });
	const focusTween = tweened(0, { easing: expoOut, duration: 500 });

	const onpress = (ev: unknown) => {
		if (ev instanceof KeyboardEvent && ev.code !== 'Enter' && ev.code !== 'Space') return;
		pressSpring.stiffness = 0.5;
		pressSpring.damping = 0.8;
		pressSpring.set(1);
		if (ev instanceof PointerEvent) window.addEventListener('click', onrelease, { once: true });
	};
	const onrelease = () => {
		pressSpring.damping = 0.25;
		pressSpring.set(0);
	};
	const onfocusin = () => {
		focusTween.set(1);
	};
	const onfocusout = () => {
		focusTween.set(0);
	};

	pressSpring.subscribe((t) => config.press(el, t));
	focusTween.subscribe((t) => config.focus(el, t));

	el.addEventListener('focusin', onfocusin);
	el.addEventListener('focusout', onfocusout);

	el.addEventListener('keydown', onpress);
	el.addEventListener('keyup', onrelease);

	el.addEventListener('pointerdown', onpress);
	return {
		destroy: () => {
			el.removeEventListener('focusin', onfocusin);
			el.removeEventListener('focusout', onfocusout);

			el.removeEventListener('keydown', onpress);
			el.removeEventListener('keyup', onrelease);

			el.removeEventListener('pointerdown', onpress);
		}
	};
}
