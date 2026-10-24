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

const site = (file: string, alt: string, width: number, height: number, focus?: string): Photo => ({ src: `/media/site/${file}.jpg`, alt, width, height, focus });

/** The author's own photos from the go-live edits (Drive), placed by name. */
export const SITE_PHOTOS = {
  handsRaised: site("rehearsal-hands-raised", "Singers in a line at rehearsal, hands raised, singing together", 2000, 1333, "50% 45%"),
  atThePiano: site("rehearsal-at-the-piano", "Bradley at the piano with a line of singers under the church's stained-glass windows", 2000, 1333, "50% 62%"),
  bradleyAtPiano: site("bradley-at-the-piano", "Bradley at the piano, watching the singers", 1333, 2000, "40% 80%"),
} satisfies Record<string, Photo>;

const gal = (file: string, alt: string, landscape = false, focus?: string): Photo => ({
  src: `/media/gallery/${file}.jpg`,
  alt,
  width: landscape ? 1600 : 1066,
  height: landscape ? 1066 : 1600,
  focus,
});

/** Gallery photos: a rehearsal-day shoot (Drive: "FOR GALLERY PAGE"), 1600px on the long edge. */
export const GALLERY_PHOTOS = {
  listeningInARow: gal("listening-in-a-row", "Singers seated in a row along the wood-panelled hall, listening", true),
  bradleyConducting: gal("bradley-conducting", "Bradley at the piano, arm raised, conducting the singers", false, "50% 30%"),
  duetAtTheMic: gal("duet-at-the-mic", "Two singers sharing a microphone in front of the blue wall"),
  reachingHigh: gal("reaching-high", "A singer stretching both arms high during a warm-up", false, "50% 25%"),
  theHall: gal("the-hall", "The rehearsal hall: arched windows, chandeliers and a wooden floor", true),
  midPhrase: gal("mid-phrase", "A singer mid-phrase, hand on chest, under stained glass", false, "50% 30%"),
  bradleyLaughing: gal("bradley-laughing", "Bradley laughing with the singers", false, "50% 30%"),
  laughingBetweenPieces: gal("laughing-between-pieces", "A singer laughing between pieces, seated with the group", true),
  armsOutInUnison: gal("arms-out-in-unison", "Two singers with arms out together, moving in unison"),
  readingThePart: gal("reading-the-part", "A singer reading a part from the sheet mid-song", false, "50% 35%"),
  bradleyWithTwoSingers: gal("bradley-with-two-singers", "Bradley coaching two singers in front of the blue wall", true),
  shapingTheSound: gal("shaping-the-sound", "A singer shaping the sound with both hands", false, "50% 30%"),
  waitingToSing: gal("waiting-to-sing", "A singer with red hair waiting for a turn to sing", false, "50% 30%"),
  bradleyTeaching: gal("bradley-teaching", "Bradley explaining a point to the group", false, "50% 30%"),
  rehearsalInTheRound: gal("rehearsal-in-the-round", "Singers spread across the hall under the chandeliers"),
  findingTheNote: gal("finding-the-note", "A singer finding the note with a raised finger", false, "50% 30%"),
  aBigSmile: gal("a-big-smile", "A singer smiling broadly between takes", false, "50% 30%"),
  bradleyLeadingWarmUp: gal("bradley-leading-warm-up", "Bradley leading a warm-up, seen from behind, singers facing him"),
  pointingUp: gal("pointing-up", "A singer pointing upwards with a smile, hitting the high note", false, "50% 30%"),
  theAmp: gal("the-amp", "A red amplifier on the floor, singers rehearsing out of focus behind"),
  handsUp: gal("hands-up", "A singer with both hands raised mid-song", false, "50% 30%"),
  bradleySmiling: gal("bradley-smiling", "Bradley smiling at the piano", false, "50% 30%"),
} satisfies Record<string, Photo>;

/**
 * Films: too big for the repo, so they live in the Blob store under films/
 * (private; the purge only touches auditions/) and stream through
 * /api/film/<name>, which forwards to a short-lived presigned address.
 */
export const FILM_PREFIX = "films/";
export const FILMS = {
  rehearsal: {
    path: "films/nextgen-rehearsal.mp4",
    width: 720,
    height: 1280,
    poster: { src: "/media/gallery/film-rehearsal-poster.jpg", alt: "Two singers singing together during a NextGen rehearsal", width: 720, height: 1280 },
  },
} satisfies Record<string, { path: string; width: number; height: number; poster: Photo }>;
export type FilmName = keyof typeof FILMS;

/** The founder page: Bradley's photos and logo, from bradleyvocalcoach.com/about. */
export const FOUNDER_PHOTOS = {
  portrait: { src: "/media/founder/bradley-portrait-jacket.jpg", alt: "Bradley Barton-Young in a cream jacket, hands at his collar, by a sunlit window", width: 1334, height: 2000, focus: "50% 30%" },
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
