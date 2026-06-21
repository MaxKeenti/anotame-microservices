// Generates the El Hilván brand-mark assets from the construction spec.
// Run: bun run design/generate-icons.mjs
//
// Geometry is Direction A (True), the spec's recommended refinement.
// All dimensions are expressed in the spec's module U (1U = 1/8 of mark Ø)
// and scaled into a 512-unit canvas.

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---- Brand palette (spec §06) ----
const INK = '#101310';
const HILVAN_BLUE = '#0A4F86';
const SIGNAL_ORANGE = '#FF4500';
const THREAD_WHITE = '#FBF0F4';

// ---- Direction A geometry, in module U (spec §04) ----
const G = {
	lobes: 10,
	outerRMean: 3.85, // Outer R (mean)
	scallopAmp: 0.15, // Scallop amp ±
	ringWidth: 1.0, // Ring width
	innerFieldR: 2.85, // Inner field Ø 5.70 -> r 2.85
	holeR: 0.6, // Hole Ø 1.20 -> r 0.60
	holeOffset: 1.0, // Hole offset ±1.00U on each axis
	phaseDeg: 0 // peaks on axes -> twofold mirror symmetry (spec registration axes)
};

const STEPS = 480; // polyline samples for the scalloped edge (smooth at any size)
const f = (n) => Number(n.toFixed(3));

// Scalloped closed path: r(t) = rMean + amp*cos(lobes*t + phase)
function scallop(cx, cy, rMean, amp, lobes, phaseDeg, steps = STEPS) {
	const phase = (phaseDeg * Math.PI) / 180;
	let d = '';
	for (let i = 0; i < steps; i++) {
		const t = (i / steps) * 2 * Math.PI;
		const r = rMean + amp * Math.cos(lobes * t + phase);
		const x = cx + r * Math.cos(t);
		const y = cy + r * Math.sin(t);
		d += `${i === 0 ? 'M' : 'L'}${f(x)} ${f(y)}`;
	}
	return d + 'Z';
}

// Full circle as a path subpath (for even-odd knockouts).
function circlePath(cx, cy, r) {
	return (
		`M${f(cx + r)} ${f(cy)}` +
		`A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}` +
		`A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}Z`
	);
}

// Build one mark variant.
// fillFraction: mark Ø as a fraction of the 512 canvas (clear space = the rest).
function buildMark({ fillFraction }) {
	const size = 512;
	const c = size / 2;
	const U = (fillFraction * size) / (2 * G.outerRMean); // px per module U
	const u = (n) => n * U;

	const ringPath =
		scallop(c, c, u(G.outerRMean), u(G.scallopAmp), G.lobes, G.phaseDeg) +
		' ' +
		circlePath(c, c, u(G.innerFieldR)); // even-odd -> annular ring

	const holes = [
		[-1, -1],
		[1, -1],
		[-1, 1],
		[1, 1]
	].map(([sx, sy]) => ({
		cx: c + sx * u(G.holeOffset),
		cy: c + sy * u(G.holeOffset),
		r: u(G.holeR)
	}));

	return { size, ringPath, holes, innerR: u(G.innerFieldR) };
}

// --- On Signal Orange app-icon lockup: orange field, white scalloped ring,
//     orange inner field, Hilván Blue holes (the three brand colours). ---
function appIcon({ rounded }) {
	const m = buildMark({ fillFraction: 0.8 }); // 1U clear space each side
	const bg = rounded
		? `<rect width="512" height="512" rx="112" fill="${SIGNAL_ORANGE}"/>`
		: `<rect width="512" height="512" fill="${SIGNAL_ORANGE}"/>`;
	const holes = m.holes
		.map((h) => `<circle cx="${f(h.cx)}" cy="${f(h.cy)}" r="${f(h.r)}" fill="${HILVAN_BLUE}"/>`)
		.join('\n  ');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${bg}
  <path fill-rule="evenodd" fill="${THREAD_WHITE}" d="${m.ringPath}"/>
  ${holes}
</svg>
`;
}

// --- Favicon: one-colour, transparent. Bold scalloped silhouette filled with
//     Signal Orange, four holes punched through (even-odd). Reads at 16px. ---
function favicon() {
	const fillFraction = 0.94; // favicons want to fill the tile
	const U = (fillFraction * 512) / (2 * G.outerRMean);
	// Slightly bolder scallop so the edge survives 16px.
	let d = scallop(256, 256, G.outerRMean * U, (G.scallopAmp + 0.05) * U, G.lobes, G.phaseDeg);
	for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
		d += ' ' + circlePath(256 + sx * G.holeOffset * U, 256 + sy * G.holeOffset * U, G.holeR * U);
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <path fill-rule="evenodd" fill="${SIGNAL_ORANGE}" d="${d}"/>
</svg>
`;
}

const outputs = [
	['design/icons/icon-source.svg', appIcon({ rounded: true })],
	['design/icons/icon-maskable-source.svg', appIcon({ rounded: false })],
	['src/lib/assets/favicon.svg', favicon()]
];

for (const [rel, svg] of outputs) {
	const abs = resolve(root, rel);
	writeFileSync(abs, svg);
	console.log('wrote', rel, `(${svg.length} bytes)`);
}
