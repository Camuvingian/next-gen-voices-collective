'use client';
import { useState } from 'react';
import { NextGenLogo, nextGenLogoThemes } from './NextGenLogo';

export function LogoExample() {
	const [replay, setReplay] = useState(0);
	const [paused, setPaused] = useState(false);
	const [palette, setPalette] = useState<'yellow' | 'ice' | 'amber' | 'light'>('yellow');
	return (
		<section style={{ background: nextGenLogoThemes[palette].surface, padding: 32 }}>
			<NextGenLogo size={260} theme={nextGenLogoThemes[palette]} replayKey={replay} paused={paused} />
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
				<button type="button" onClick={() => { setPaused(false); setReplay((v) => v + 1); }}>Replay</button>
				<button type="button" aria-pressed={paused} onClick={() => setPaused((v) => !v)}>{paused ? 'Resume' : 'Pause'}</button>
				<label>Theme <select value={palette} onChange={(e) => setPalette(e.target.value as typeof palette)}>
					<option value="yellow">Emergency yellow</option><option value="ice">Ice blue</option>
					<option value="amber">Amber</option><option value="light">Light surface</option>
				</select></label>
			</div>
		</section>
	);
}
