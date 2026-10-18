/**
 * Interim photo library. Until the author's high-resolution files arrive,
 * images come from the public Instagram account (@thenextgenvoices),
 * trimmed and saved in public/media/instagram/ (originals: media/instagram-screenshots/).
 *
 * Slots name the photo they show; any slot without one keeps its
 * art-directed placeholder. noir.css renders every photo in black and white.
 */

export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** CSS object-position: keeps faces in frame whatever the slot's crop */
  focus?: string;
};

const ig = (file: string, alt: string, width: number, height: number, focus?: string): Photo => ({
  src: `/media/instagram/${file}.jpg`,
  alt,
  width,
  height,
  focus,
});

export const PHOTOS = {
  collectiveSteps: ig("collective-steps", "Five NextGen singers posed on the stone steps outside the church, dressed in black", 1194, 1192, "50% 35%"),
  rehearsalSinging: ig("rehearsal-singing", "Singers in a line at rehearsal, hands raised, singing together", 1187, 764, "50% 40%"),
  rehearsalCircle: ig("rehearsal-circle", "Singers seated in a row of chairs, talking between pieces at rehearsal", 1170, 783, "55% 50%"),
  directorListening: ig("director-listening", "The director listening during a rehearsal", 1177, 1117, "50% 30%"),
  directorProfile: ig("director-profile", "The director in profile, watching the ensemble", 1168, 1114, "75% 30%"),
  directorPortrait: ig("director-portrait", "Portrait of the director in warm side light", 1189, 1193, "40% 30%"),
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;

/** The founder page: Bradley's photos and logo, from bradleyvocalcoach.com/about. */
export const FOUNDER_PHOTOS = {
  portrait: { src: "/media/founder/bradley-portrait.jpg", alt: "Bradley Barton-Young, chin resting on his hand, in a cream jacket", width: 1600, height: 1067, focus: "28% 40%" },
  onStage: { src: "/media/founder/bradley-on-stage.jpg", alt: "Bradley singing into a microphone on stage", width: 1530, height: 886, focus: "45% 35%" },
  logo: { src: "/media/founder/bvc-logo.png", alt: "Bradley Vocal Coach: Master your voice", width: 1200, height: 512 },
} satisfies Record<string, Photo>;

const credit = (file: string, name: string, width: number, height: number) => ({ src: `/media/founder/credits/${file}.webp`, name, width, height });

/** The credits ribbon on the founder page: the logo strip from bradleyvocalcoach.com, white on clear. */
export const FOUNDER_CREDITS = [
  credit("sam-smith", "Sam Smith", 253, 180),
  credit("the-brit-school", "The BRIT School", 290, 180),
  credit("raye", "RAYE", 413, 180),
  credit("royal-albert-hall", "Royal Albert Hall", 684, 180),
  credit("teddy-swims", "Teddy Swims", 242, 180),
  credit("platoon", "Platoon", 180, 180),
  credit("olympia-vitalis", "Olympia Vitalis", 413, 180),
  credit("matilda", "Matilda the Musical", 140, 180),
  credit("wembley", "Wembley", 341, 180),
  credit("x-factor", "The X Factor", 274, 180),
  credit("flames-collective", "Flames Collective", 438, 180),
  credit("the-voice-uk", "The Voice UK", 177, 180),
  credit("google", "Google", 547, 180),
  credit("mazda", "Mazda", 175, 180),
  credit("root-seventy-three", "Root Seventy Three", 262, 180),
];
