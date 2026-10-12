import { useEffect, useState, type ComponentType } from "react";
import { Curtain, Footer, Nav } from "./components/Chrome";
import { PaletteDock } from "./components/PaletteDock";
import { NextGenPianoRail } from "./assets/piano-rail/NextGenPianoRail";
import { NeonDirector } from "./components/NeonDirector";
import { RouterProvider, useRouter, type Route } from "./lib/router";
import { About } from "./pages/About";
import { Auditions } from "./pages/Auditions";
import { Contact } from "./pages/Contact";
import { Gallery } from "./pages/Gallery";
import { Home } from "./pages/Home";

const PAGES: Record<Route, ComponentType> = { home: Home, about: About, auditions: Auditions, gallery: Gallery, contact: Contact };
const TITLES: Record<Route, string> = {
  home: "NextGen Voice Collective",
  about: "About · NextGen Voice Collective",
  auditions: "Auditions · NextGen Voice Collective",
  gallery: "Gallery · NextGen Voice Collective",
  contact: "Contact · NextGen Voice Collective",
};

function Shell() {
  const { route } = useRouter();
  const Page = PAGES[route];
  useEffect(() => {
    document.title = TITLES[route];
  }, [route]);
  return (
    <>
      <a href="#main" className="ng-skip">
        Skip to content
      </a>
      <NextGenPianoRail />
      <Nav />
      <main id="main" className={`ng-page ng-page--${route}`} key={route}>
        <Page />
      </main>
      <Footer />
      <Curtain />
      <PaletteDock />
      <NeonDirector />
    </>
  );
}

/** Event the palette dock's Reload button fires: remounts the whole site so every intro animation replays. */
export const RELOAD_EVENT = "ng:reload";

export default function App() {
  const [take, setTake] = useState(0);
  useEffect(() => {
    const reload = () => {
      window.scrollTo({ top: 0 });
      setTake((t) => t + 1);
    };
    window.addEventListener(RELOAD_EVENT, reload);
    return () => window.removeEventListener(RELOAD_EVENT, reload);
  }, []);
  return (
    <RouterProvider>
      <Shell key={take} />
    </RouterProvider>
  );
}
