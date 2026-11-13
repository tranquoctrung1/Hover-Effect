'use strict';

// Show "Top" button after scrolling 100px.
// Passive listener + rAF throttle; touch the DOM only when visibility flips.
const scrollTopBtn = document.getElementById('scroll-top');
let scrollTopVisible = false;
let ticking = false;

window.addEventListener('scroll', () => {
	if (ticking) return;
	ticking = true;
	requestAnimationFrame(() => {
		const visible = window.scrollY > 100;
		if (visible !== scrollTopVisible) {
			scrollTopVisible = visible;
			scrollTopBtn.classList.toggle('is-visible', visible);
		}
		ticking = false;
	});
}, { passive: true });

// Smooth scroll for same-page anchor links (event delegation, one listener).
// Hand-rolled tween, not CSS/native smooth-scroll: some browsers/automation
// environments treat native smooth scroll as an instant jump (reduced-motion,
// or a "disable smooth scrolling" test flag), which left the Top button and
// nav links feeling broken even though the click handling itself was fine.
let scrollTween = null;
function cancelScrollTween() {
	if (scrollTween) { cancelAnimationFrame(scrollTween); scrollTween = null; }
}
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function tweenScrollTo(targetY, duration) {
	cancelScrollTween();
	const startY = window.scrollY;
	const delta = targetY - startY;
	if (Math.abs(delta) < 1) return;
	const startTime = performance.now();
	function step(now) {
		const t = Math.min(1, (now - startTime) / duration);
		window.scrollTo(0, startY + delta * easeOutCubic(t));
		scrollTween = t < 1 ? requestAnimationFrame(step) : null;
	}
	scrollTween = requestAnimationFrame(step);
}
['wheel', 'touchstart', 'keydown'].forEach((type) => {
	window.addEventListener(type, cancelScrollTween, { passive: true });
});

document.addEventListener('click', (event) => {
	const link = event.target.closest('a[href*="#"]:not([href="#"]):not([href="#0"])');
	if (!link) return;
	if (link.pathname.replace(/^\//, '') !== location.pathname.replace(/^\//, '') ||
		link.hostname !== location.hostname) return;

	const id = decodeURIComponent(link.hash.slice(1));
	const target = document.getElementById(id) || document.getElementsByName(id)[0];
	if (!target) return;

	event.preventDefault();
	// Any anchor jump that isn't a nav-pill click (e.g. the Top button) should
	// release a pinned nav highlight; otherwise the last-clicked pill stays lit
	// after Top scrolls away from it. pinnedId/updateCurrent are declared
	// further down the file, safe to reference here since this listener only
	// ever runs after the whole script has finished executing once.
	if (!link.closest('.fx-nav-links') && pinnedId) {
		pinnedId = null;
		updateCurrent();
	}
	// scrollIntoView would honor the section's scroll-margin-top for free;
	// doing it by hand means subtracting that margin ourselves so a section
	// doesn't land hidden under the sticky nav bar.
	const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
	const maxY = document.documentElement.scrollHeight - window.innerHeight;
	const targetY = Math.max(0, Math.min(maxY, target.getBoundingClientRect().top + window.scrollY - margin));
	tweenScrollTo(targetY, 600);

	// Move focus for keyboard/screen-reader users without a second jump.
	if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) {
		target.setAttribute('tabindex', '-1');
	}
	target.focus({ preventScroll: true });
});

// Trash-can animation on click.
const animated = document.getElementById('animated');
if (animated) {
	animated.addEventListener('click', () => animated.classList.add('animate'));
}

// ---------- Toast ----------
let toastEl = null;
let toastTimer = 0;
function showToast(message) {
	if (!toastEl) {
		toastEl = document.createElement('div');
		toastEl.className = 'fx-toast';
		toastEl.setAttribute('role', 'status');
		toastEl.setAttribute('aria-live', 'polite');
		document.body.appendChild(toastEl);
	}
	toastEl.textContent = message;
	toastEl.classList.add('is-shown');
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => toastEl.classList.remove('is-shown'), 1800);
}

// ---------- Dark / light theme ----------
const root = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');

function applyTheme(theme) {
	root.setAttribute('data-theme', theme);
	if (!themeBtn) return;
	const dark = theme === 'dark';
	themeBtn.setAttribute('aria-pressed', String(dark));
	themeBtn.title = dark ? 'Light mode' : 'Dark mode';
	const icon = themeBtn.querySelector('i');
	icon.classList.toggle('fa-moon', !dark);
	icon.classList.toggle('fa-sun', dark);
}

applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

if (themeBtn) {
	themeBtn.addEventListener('click', () => {
		const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
		applyTheme(next);
		try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
	});
}

// ---------- Sticky nav: highlight section in view ----------
const navList = document.querySelector('.fx-nav-links');
const navLinks = new Map();
if (navList) {
	navList.querySelectorAll('a').forEach((a) => navLinks.set(a.hash.slice(1), a));
}

function setCurrent(id) {
	const link = navLinks.get(id);
	if (!link || link.classList.contains('is-current')) return;
	navLinks.forEach((a) => {
		a.classList.remove('is-current');
		a.removeAttribute('aria-current');
	});
	link.classList.add('is-current');
	link.setAttribute('aria-current', 'true');
	// Scroll only the horizontal list (scrollIntoView would cancel page smooth-scroll).
	const listBox = navList.getBoundingClientRect();
	const linkBox = link.getBoundingClientRect();
	navList.scrollTo({
		left: navList.scrollLeft + (linkBox.left - listBox.left) - (listBox.width - linkBox.width) / 2,
		behavior: 'smooth'
	});
}

// Current = last section whose top passed a line just under the sticky nav.
// At page bottom force the last one (short final section never reaches the line).
// A clicked link stays current until the user scrolls by hand
// (sections near the bottom can't scroll up to the line).
const navSections = Array.from(navLinks.keys())
	.map((id) => document.getElementById(id))
	.filter(Boolean);
const navBar = document.querySelector('.fx-nav');
let pinnedId = null;

function updateCurrent() {
	if (!navSections.length) return;
	if (pinnedId) {
		setCurrent(pinnedId);
		return;
	}
	const doc = document.documentElement;
	if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
		setCurrent(navSections[navSections.length - 1].id);
		return;
	}
	const line = (navBar ? navBar.offsetHeight : 0) + 60;
	let current = navSections[0];
	for (const section of navSections) {
		if (section.getBoundingClientRect().top <= line) current = section;
		else break;
	}
	setCurrent(current.id);
}

if (navList) {
	navList.addEventListener('click', (event) => {
		const link = event.target.closest('a');
		if (!link || !navLinks.has(link.hash.slice(1))) return;
		pinnedId = link.hash.slice(1);
		updateCurrent(); // page may already be at the target (no scroll event)
	});
}
['wheel', 'touchstart', 'keydown'].forEach((type) => {
	window.addEventListener(type, () => {
		if (!pinnedId) return;
		pinnedId = null;
		updateCurrent();
	}, { passive: true });
});

let navTicking = false;
window.addEventListener('scroll', () => {
	if (navTicking) return;
	navTicking = true;
	requestAnimationFrame(() => {
		updateCurrent();
		navTicking = false;
	});
}, { passive: true });
window.addEventListener('resize', updateCurrent, { passive: true });
updateCurrent();

// ---------- Copy code (HTML + CSS of a section) ----------
function getMainRules() {
	for (const sheet of document.styleSheets) {
		if (!sheet.href || !/\/main\.css(\?|$)/.test(sheet.href)) continue;
		try { return Array.from(sheet.cssRules); } catch (e) { return []; }
	}
	return [];
}

function cssForClasses(classes) {
	// "(?!\w)" stops ".font-effect" matching ".font-effect2";
	// "-" is allowed so ".fx-ripple" also brings ".fx-ripple-wave" (JS-created).
	const re = new RegExp('\\.(' + classes.join('|') + ')(?!\\w)');
	const matches = (sel) => sel && re.test(sel) && sel.indexOf('data-theme') === -1;
	const rules = getMainRules();
	const out = [];
	rules.forEach((rule) => {
		if (rule.type === CSSRule.STYLE_RULE && matches(rule.selectorText)) {
			out.push(rule.cssText);
		} else if (rule.type === CSSRule.MEDIA_RULE) {
			const inner = Array.from(rule.cssRules)
				.filter((r) => matches(r.selectorText))
				.map((r) => '  ' + r.cssText);
			if (inner.length) out.push('@media ' + rule.conditionText + ' {\n' + inner.join('\n') + '\n}');
		}
	});
	const used = out.join('\n');
	rules.forEach((rule) => {
		if (rule.type === CSSRule.KEYFRAMES_RULE && new RegExp('\\b' + rule.name + '\\b').test(used)) {
			out.push(rule.cssText);
		}
	});
	return out.join('\n\n');
}

function htmlForSection(section) {
	const clone = section.cloneNode(true);
	clone.removeAttribute('tabindex');
	clone.querySelectorAll('.fx-head, .fx-ripple-wave').forEach((n) => n.remove());
	clone.querySelectorAll('.animate, .is-loading, .is-done').forEach((n) => {
		n.classList.remove('animate', 'is-loading', 'is-done');
	});
	clone.querySelectorAll('[aria-busy]').forEach((n) => n.removeAttribute('aria-busy'));
	const label = clone.querySelector('.fx-loading .fx-label');
	if (label) label.textContent = 'Submit';
	// Tilt/magnet write live --rx/--ry/--mx/--my onto style= at runtime; drop it
	// so the copied snippet starts at rest instead of mid-gesture.
	clone.querySelectorAll('.fx-tilt, .fx-magnet').forEach((n) => n.removeAttribute('style'));
	return clone.outerHTML.replace(/\n\s*\n/g, '\n');
}

function buildSnippet(section) {
	// Section class (e.g. "button-click") + any standalone fx-* effect classes inside it.
	const classes = new Set([section.id]);
	section.querySelectorAll('[class*="fx-"]').forEach((el) => {
		if (el.closest('.fx-head')) return;
		el.classList.forEach((c) => { if (c.indexOf('fx-') === 0) classes.add(c); });
	});
	return '<!-- HTML (icons need Font Awesome 5, layout uses Bootstrap 4 grid) -->\n' +
		htmlForSection(section) + '\n\n<style>\n' + cssForClasses(Array.from(classes)) + '\n</style>\n';
}

function legacyCopy(text) {
	const ta = document.createElement('textarea');
	ta.value = text;
	ta.setAttribute('readonly', '');
	ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
	document.body.appendChild(ta);
	ta.select();
	let ok = false;
	try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
	ta.remove();
	return ok;
}

function copyText(text) {
	// navigator.clipboard only exists on https/localhost; plain http falls back.
	if (navigator.clipboard && window.isSecureContext) {
		return navigator.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
	}
	return Promise.resolve(legacyCopy(text));
}

document.addEventListener('click', (event) => {
	const btn = event.target.closest('.fx-copy');
	if (!btn) return;
	const section = btn.closest('section');
	const title = section.querySelector('.fx-head h2').textContent;
	copyText(buildSnippet(section)).then((ok) => {
		showToast(ok ? 'Copied: ' + title : 'Copy failed');
	});
});

// ---------- New effects ----------
document.querySelectorAll('.fx-ripple').forEach((btn) => {
	btn.addEventListener('click', (event) => {
		const box = btn.getBoundingClientRect();
		const size = Math.max(box.width, box.height);
		// Keyboard activation (detail 0) has no pointer position: ripple from center.
		const x = event.detail ? event.clientX - box.left : box.width / 2;
		const y = event.detail ? event.clientY - box.top : box.height / 2;
		const wave = document.createElement('span');
		wave.className = 'fx-ripple-wave';
		wave.style.width = wave.style.height = size + 'px';
		wave.style.left = (x - size / 2) + 'px';
		wave.style.top = (y - size / 2) + 'px';
		wave.addEventListener('animationend', () => wave.remove());
		btn.appendChild(wave);
	});
});

document.querySelectorAll('.fx-loading').forEach((btn) => {
	const label = btn.querySelector('.fx-label');
	btn.addEventListener('click', () => {
		if (btn.classList.contains('is-loading') || btn.classList.contains('is-done')) return;
		btn.classList.add('is-loading');
		btn.setAttribute('aria-busy', 'true');
		label.textContent = 'Loading...';
		setTimeout(() => {
			btn.classList.remove('is-loading');
			btn.classList.add('is-done');
			btn.removeAttribute('aria-busy');
			label.textContent = 'Done!';
			setTimeout(() => {
				btn.classList.remove('is-done');
				label.textContent = 'Submit';
			}, 1500);
		}, 2000);
	});
});

// Tilt + magnet: only wire up pointer tracking on devices that actually hover
// with a precise pointer (mouse/trackpad). On touch, the CSS vars stay at
// their 0 default and the button just looks like a plain .fx-btn.
if (window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
	document.querySelectorAll('.fx-tilt').forEach((btn) => {
		const strength = 14; // max degrees of rotation
		btn.addEventListener('mousemove', (event) => {
			const box = btn.getBoundingClientRect();
			const px = (event.clientX - box.left) / box.width - .5;
			const py = (event.clientY - box.top) / box.height - .5;
			btn.style.setProperty('--rx', (px * strength * 2).toFixed(2) + 'deg');
			btn.style.setProperty('--ry', (py * -strength * 2).toFixed(2) + 'deg');
		});
		btn.addEventListener('mouseleave', () => {
			btn.style.setProperty('--rx', '0deg');
			btn.style.setProperty('--ry', '0deg');
		});
	});

	document.querySelectorAll('.fx-magnet').forEach((btn) => {
		const pull = 10; // max px of travel
		btn.addEventListener('mousemove', (event) => {
			const box = btn.getBoundingClientRect();
			const px = (event.clientX - box.left) / box.width - .5;
			const py = (event.clientY - box.top) / box.height - .5;
			btn.style.setProperty('--mx', (px * pull * 2).toFixed(1) + 'px');
			btn.style.setProperty('--my', (py * pull * 2).toFixed(1) + 'px');
		});
		btn.addEventListener('mouseleave', () => {
			btn.style.setProperty('--mx', '0px');
			btn.style.setProperty('--my', '0px');
		});
	});
}
