/**
 * Site content. Facts marked ✓ come from the current bradleyvocalcoach.com/nextgen page.
 * Anything marked ⚑ is placeholder copy to confirm before launch.
 * In production this lives in a headless CMS (Sanity schema mirrors these types).
 */

export const SITE = {
  name: "NextGen Voice Collective",
  short: "NextGen",
  tagline: "Young voices. One sound.",
  ages: "13–18", // ✓
  rehearsal: { day: "Saturdays", time: "13:00–14:30", venue: "Richmond & Putney Unitarian Church" }, // ✓
  term: { fee: "£275", length: "12-week term" }, // ✓ (varies with term length)
  instagram: { handle: "@thenextgenvoices", url: "https://www.instagram.com/thenextgenvoices/" }, // ✓
  email: "hello@nextgenvoices.co.uk", // ⚑ placeholder domain
  parentSite: "https://www.bradleyvocalcoach.com",
};

export const PILLARS = [
  {
    key: "blend",
    title: "Blend",
    body: "Matching vowel, colour and dynamic so twenty voices land as one instrument.",
  },
  {
    key: "harmony",
    title: "Harmony",
    body: "Holding your own line in close, multi-part arrangements, under pressure and without a crutch.",
  },
  {
    key: "precision",
    title: "Precision",
    body: "Tight entrances, clean cut-offs, tuning you can rely on. The details audiences feel but can't name.",
  },
  {
    key: "presence",
    title: "Presence",
    body: "Owning the stage as a group while keeping the individual identity that got you through the door.",
  },
] as const;

export const GAINS = [
  { title: "Advanced musicianship", body: "Part-singing, reading, listening across the ensemble and responding in real time." },
  { title: "Healthy technique", body: "Sustainable vocal habits that protect young voices through growth and change." },
  { title: "Stage presence", body: "Regular performance builds composure that carries into auditions, exams and solo work." },
  { title: "Confidence", body: "Being trusted with a line, and delivering it, changes how singers carry themselves." },
];

export const SESSION_FLOW = [
  { phase: "Warm-up & technique", body: "Body, breath and voice. Healthy habits drilled every week." },
  { phase: "Part work", body: "Sections learn and secure their lines before anything is put together." },
  { phase: "Full ensemble", body: "Blend, balance and tuning across the whole Collective." },
  { phase: "Run & notes", body: "Performance-standard run-throughs with specific, actionable feedback." },
];

export const STEPS = [
  { title: "Apply online", body: "Complete the form below and upload a short video of you singing. Ten minutes, start to finish." },
  { title: "We review", body: "Every application is watched in full. We look at voice, musicality and potential, not polish." },
  { title: "Audition", body: "Shortlisted singers are invited to a friendly in-person audition with some simple ensemble work." },
  { title: "Offer", body: "Successful singers receive a place for the coming term, with rehearsal and performance dates." },
];

export const ELIGIBILITY = [
  "Aged 13–18 at the start of term",
  "Available for Saturday rehearsals, 13:00–14:30, in Richmond",
  "Some singing experience in any style. Choir, musical theatre, pop, classical",
  "Ready to commit to the full term and to practise between sessions",
  "Parent or guardian consent for singers under 18",
];

import { FILMS, GALLERY_PHOTOS as G, type FilmName, type Photo } from "./media";

export type GalleryItem = {
  id: string;
  kind: "stage" | "portrait" | "beams" | "rehearsal";
  cat: "Performances" | "Rehearsals" | "Behind the scenes";
  title: string;
  ratio: string;
  video?: boolean;
  /** a film from the Blob store (FILMS), played in the lightbox; `photo` is its poster */
  film?: FilmName;
  seed: number;
  photo?: Photo;
};

const shot = (id: string, cat: GalleryItem["cat"], title: string, photo: Photo): GalleryItem => ({
  id,
  kind: "rehearsal",
  cat,
  title,
  ratio: `${photo.width} / ${photo.height}`,
  seed: 1,
  photo,
});

// The gallery: a rehearsal-day shoot and a film from the same sessions. Filters with nothing in them are hidden.
export const GALLERY: GalleryItem[] = [
  shot("listening", "Rehearsals", "Listening in", G.listeningInARow),
  { ...shot("film", "Rehearsals", "A Saturday session", FILMS.rehearsal.poster), video: true, film: "rehearsal" },
  shot("conducting", "Rehearsals", "Bradley takes the lead", G.bradleyConducting),
  shot("duet", "Rehearsals", "Sharing the mic", G.duetAtTheMic),
  shot("reaching", "Rehearsals", "Warm-up", G.reachingHigh),
  shot("hall", "Behind the scenes", "The hall", G.theHall),
  shot("mid-phrase", "Rehearsals", "Mid-phrase", G.midPhrase),
  shot("bradley-laughing", "Behind the scenes", "Good notes", G.bradleyLaughing),
  shot("laughing", "Behind the scenes", "Between pieces", G.laughingBetweenPieces),
  shot("unison", "Rehearsals", "In unison", G.armsOutInUnison),
  shot("reading", "Rehearsals", "Learning the part", G.readingThePart),
  shot("coaching", "Rehearsals", "One-to-one", G.bradleyWithTwoSingers),
  shot("shaping", "Rehearsals", "Shaping the sound", G.shapingTheSound),
  shot("waiting", "Behind the scenes", "Up next", G.waitingToSing),
  shot("teaching", "Rehearsals", "The detail", G.bradleyTeaching),
  shot("round", "Rehearsals", "Room to move", G.rehearsalInTheRound),
  shot("finding", "Rehearsals", "Finding the note", G.findingTheNote),
  shot("smile", "Behind the scenes", "All smiles", G.aBigSmile),
  shot("warm-up", "Rehearsals", "Warming up together", G.bradleyLeadingWarmUp),
  shot("pointing", "Rehearsals", "Top note", G.pointingUp),
  shot("amp", "Behind the scenes", "Plugged in", G.theAmp),
  shot("hands-up", "Rehearsals", "Hands up", G.handsUp),
  shot("bradley-smiling", "Behind the scenes", "The director", G.bradleySmiling),
];

/**
 * The founder page (views/Founder.tsx). The words are Bradley's own, from the
 * "About" page of his coaching site, bradleyvocalcoach.com/about.
 */
export const FOUNDER = {
  name: "Bradley Barton-Young",
  first: "Bradley",
  last: "Barton-Young.",
  lede: "Singer-songwriter, recording artist, performer and vocal coach, and the founder of NextGen Voice Collective.",
  intro: [
    "With years of experience in the music industry, Bradley has established himself as a versatile and respected performer, singer-songwriter, recording artist and vocal coach. His work spans recording studios, major stages and elite training institutions, including stage time with Sam Smith and many others.",
    "He is known for his four-octave-plus range, vocal agility, expressive ad-libs and rich tone, and just as much for his deep understanding of the voice. His bespoke coaching method, developed through years of hands-on experience, is tailored to each singer's own vocal identity, and has delivered exceptional results across a wide range of abilities and styles.",
  ],
  stats: [
    { label: "Range", value: "4+ octaves" },
    { label: "Taught at", value: "The BRIT School" },
    { label: "On stage with", value: "Sam Smith" },
  ],
  teaching: [
    "As a go-to professional singing practitioner at The BRIT School, Bradley helped train the next generation of vocalists, both on the main curriculum and as Singing Lead and Manager of the school's Saturday Programme, guiding young emerging artists.",
    "He has also worked with signed artists at Platoon, the Apple-owned creative development company that backs independent musicians with funding, global exposure and mentorship. Among them is Olympia Vitalis, a rising artist gaining international attention for her distinctive voice.",
  ],
  singers:
    "Bradley's clients have supported charting acts like Teddy Swims, earned places at top conservatoires in the UK and abroad, performed on national television and built strong followings online, with significant Spotify streaming numbers.",
  highlights: [
    "Royal Albert Hall, Queen Elizabeth Hall, Festival Hall and Wembley Arena",
    "The St. Lucia Jazz Festival",
    "West End: Matilda, Annie, West End Calling and more",
    "Alongside RAYE at the NFL London halftime show, with the Flames Collective",
    "On-site vocal coach for Olympia Vitalis's live “Angel Patience”",
  ],
  quotes: [
    "Whether I’m performing or teaching, I’m always focused on helping voices connect: emotionally, technically and artistically.",
    "The real reward is seeing someone step into their voice. That’s what it’s all about for me.",
  ],
  coaching: {
    url: "https://www.bradleyvocalcoach.com",
    body: "Bradley also offers personalised one-to-one coaching to singers at every stage, from total beginners to recording artists, unlocking each voice's full potential in a healthy, expressive and sustainable way.",
  },
};
