"use client";

import type { ReactNode } from "react";
import { NeonProvider, SETTINGS_MENU } from "@/components/neon/NeonProvider";
import { NeonMenu } from "@/components/neon/NeonMenu";
import { PianoScroll } from "@/components/piano-rail/PianoScroll";
import { RouterProvider, useRouter } from "@/lib/router";
import { Curtain, Footer, Nav } from "./Chrome";
import { NeonDirector } from "./NeonDirector";
import { ScrollTop } from "./ScrollTop";

function Frame({ children }: { children: ReactNode }) {
  const { route } = useRouter();
  return (
    <>
      <a href="#main" className="ng-skip">
        Skip to content
      </a>
      <Nav />
      {SETTINGS_MENU && <NeonMenu />}
      <PianoScroll />
      <main id="main" tabIndex={-1} className={`ng-page ng-page--${route}`} key={route}>
        {children}
      </main>
      <Footer />
      <ScrollTop />
      <Curtain />
      <NeonDirector />
    </>
  );
}

/** Site chrome: nav, footer, page curtain and neon timing around every page. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <NeonProvider>
      <RouterProvider>
        <Frame>{children}</Frame>
      </RouterProvider>
    </NeonProvider>
  );
}
