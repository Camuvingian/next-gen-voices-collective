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
