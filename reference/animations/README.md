# NextGen animations: source code

Each numbered folder matches a prompt in ANIMATION_PROMPTS.md. Give the agent the prompt plus its folder.
`_shared/tokens.css` holds every colour, font and timing token the animations read (CSS custom properties).
Some CSS files contain more than one animation: search for the block named in the prompt ("Neon signs", "Wordmark", "film grain", "Noir pillar cards").
Folder 06 is the complete Piano Rail asset (also in ../assets/piano-rail).
These are working React 19 + TypeScript files from the prototype. In Next.js add "use client" at the top of each component.
