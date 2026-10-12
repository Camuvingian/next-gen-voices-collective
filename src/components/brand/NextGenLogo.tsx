'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
// Stylesheet: src/components/NextGenLogo.css is included globally by build.mjs
// (the prototype build concatenates CSS rather than importing it per module).

export interface NextGenLogoTheme {
	accent: string;
	secondary: string;
	edge: string;
	/** Match the surface behind the logo for its hollow-line appearance. */
	surface: string;
	shine: string;
}

export interface NextGenLogoProps {
	/** Rendered width; height follows the original 228:188 aspect ratio. */
	size?: number | string;
	theme?: Partial<NextGenLogoTheme>;
	/** Seconds per complete draw → settle → shimmer → hold sequence. */
	duration?: number;
	/** Seconds before starting. */
	delay?: number;
	/** Default: one play, then hold the completed logo. */
	loop?: boolean;
	paused?: boolean;
	/** false shows the complete static mark. */
	animated?: boolean;
	/** Increment or change to restart, including after a completed one-shot. */
	replayKey?: string | number;
	/** Pause offscreen/when the tab is hidden. Resume at the same point. */
	pauseWhenHidden?: boolean;
	/** Set true when nearby text or the parent link already names the brand. */
	decorative?: boolean;
	title?: string;
	className?: string;
	style?: CSSProperties & Partial<Record<`--ng-${string}`, string | number>>;
}

export const nextGenLogoThemes = {
	yellow: { accent: '#e8ff3c', secondary: '#a9dfff', edge: '#d8e9f6', surface: '#0b1524', shine: '#ffffff' },
	ice: { accent: '#a9dfff', secondary: '#e9f9ff', edge: '#d8e9f6', surface: '#0b1524', shine: '#ffffff' },
	amber: { accent: '#ffb52b', secondary: '#ffe57a', edge: '#d8e9f6', surface: '#0b1524', shine: '#ffffff' },
	light: { accent: '#3d739d', secondary: '#659ec8', edge: '#274761', surface: '#eaf2f9', shine: '#ffffff' },
} satisfies Record<string, NextGenLogoTheme>;

// Approved Option 02 geometry, unchanged from the accepted preview.
const paths = [
	'M37 145V44L107 145V70Q107 43 134 43H165Q190 43 190 68',
	'M190 96H152M190 96V120Q190 145 165 145H134Q107 145 107 118',
] as const;

export function NextGenLogo({
	size = 96,
	theme,
	duration = 8,
	delay = 0,
	loop = false,
	paused = false,
	animated = true,
	replayKey = 0,
	pauseWhenHidden = true,
	decorative = false,
	title = 'NextGen Voice Collective',
	className,
	style,
}: NextGenLogoProps) {
	const instanceId = useId();
	const metalId = `${instanceId}-ng-metal`;
	const shineId = `${instanceId}-ng-shine`;
	const maskId = `${instanceId}-ng-mask`;
	const titleId = `${instanceId}-ng-title`;
	const ref = useRef<SVGSVGElement>(null);
	const [hidden, setHidden] = useState(false);

	useEffect(() => {
		if (!pauseWhenHidden || !animated) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- replays the intro animation on prop change (prototype behaviour)
			setHidden(false);
			return;
		}
		let inView = true;
		const update = () => setHidden(document.hidden || !inView);
		const observer = typeof IntersectionObserver === 'undefined' ? undefined :
			new IntersectionObserver(([entry]) => {
				inView = entry.isIntersecting;
				update();
			}, { threshold: 0 });
		if (ref.current) observer?.observe(ref.current);
		document.addEventListener('visibilitychange', update);
		update();
		return () => {
			observer?.disconnect();
			document.removeEventListener('visibilitychange', update);
		};
	}, [pauseWhenHidden, animated]);

	const seconds = Number.isFinite(duration) ? Math.max(0.5, duration) : 8;
	const wait = Number.isFinite(delay) ? Math.max(0, delay) : 0;
	const css: NextGenLogoProps['style'] = {
		width: size,
		'--ng-duration': `${seconds}s`,
		'--ng-delay': `${wait}s`,
		'--ng-path-delay': `${wait + seconds * 0.03125}s`,
		'--ng-repeat': loop ? 'infinite' : '1',
		...Object.fromEntries(Object.entries(theme ?? {}).filter(([, value]) => value !== undefined).map(([key, value]) => [`--ng-${key}`, value])),
		...style,
	};

	function layer(name: string, width: number, stroke?: string) {
		return <g className={`ng-interlock__layer ng-interlock__${name}`} strokeWidth={width} stroke={stroke}>
			{paths.map((d) => <path key={d} d={d} pathLength={100} />)}
		</g>;
	}

	return (
		<svg
			ref={ref}
			className={['ng-interlock', className].filter(Boolean).join(' ')}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 228 188"
			style={css}
			role={decorative ? undefined : 'img'}
			aria-hidden={decorative || undefined}
			aria-labelledby={decorative ? undefined : titleId}
			focusable="false"
			data-animated={animated ? 'true' : 'false'}
			data-paused={paused || hidden ? 'true' : 'false'}
		>
			{!decorative && <title id={titleId}>{title}</title>}
			<defs>
				<linearGradient id={metalId} x1="0" y1="0" x2="0.85" y2="1">
					<stop stopColor="var(--ng-edge, #d8e9f6)" />
					<stop offset="0.23" stopColor="var(--ng-secondary, #a9dfff)" />
					<stop offset="0.45" stopColor="var(--ng-accent, #e8ff3c)" />
					<stop offset="0.56" stopColor="var(--ng-edge, #d8e9f6)" />
					<stop offset="0.8" stopColor="var(--ng-secondary, #a9dfff)" />
					<stop offset="1" stopColor="var(--ng-accent, #e8ff3c)" />
				</linearGradient>
				<linearGradient id={shineId}>
					<stop stopColor="var(--ng-shine, #ffffff)" stopOpacity="0" />
					<stop offset="0.5" stopColor="var(--ng-shine, #ffffff)" stopOpacity="0.85" />
					<stop offset="1" stopColor="var(--ng-shine, #ffffff)" stopOpacity="0" />
				</linearGradient>
				<mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="228" height="188" style={{ maskType: 'luminance' }}>
					<g fill="none" stroke="white" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round">
						{paths.map((d) => <path key={d} d={d} />)}
					</g>
				</mask>
			</defs>
			<g key={replayKey}>
				{layer('edge', 15)}
				{layer('core', 12)}
				{layer('accent', 3.12, `url(#${metalId})`)}
				{layer('tracer', 2.04)}
				{layer('light', 0.8)}
				<g mask={`url(#${maskId})`} className="ng-interlock__reflection">
					<rect className="ng-interlock__sweep" x="0" y="0" width="110" height="188" fill={`url(#${shineId})`} />
				</g>
			</g>
		</svg>
	);
}

export default NextGenLogo;
