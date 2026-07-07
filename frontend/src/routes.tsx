import { createBrowserRouter, useNavigate } from "react-router";
import { Layout } from "./pages/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Engine } from "./pages/Engine";
import { Timeline } from "./pages/Timeline";
import { Library } from "./pages/Library";
import { System } from "./pages/System";
import { Studio } from "./pages/Studio";
import { Settings } from "./pages/Settings";
import { RadioPage as RadioLegacyPage } from "./pages/Radio";
import { RadioPage } from "./pages/RadioPage";
import { SLUniversalOriginalPage } from "./pages/SLUniversalOriginal";
import { Auth } from "./pages/Auth";
import { MakeMusic } from "./pages/MakeMusic";
import { MyTracks } from "./pages/MyTracks";
import { TrackProof } from "./pages/TrackProof";
import LyricaPublicLanding from "./LyricaPublicLanding";

function PublicLandingRoute() {
  const navigate = useNavigate();

  return (
    <LyricaPublicLanding
      onEnterStudio={() => navigate("/auth")}
      onEnterVibe={() => navigate("/radio")}
    />
  );
}

export const router = createBrowserRouter([
  { path: "/", Component: PublicLandingRoute },
  { path: "/landing", Component: PublicLandingRoute },
  {
    path: "/",
    Component: Layout,
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "studio", Component: Studio },
      { path: "engine", Component: Engine },
      { path: "timeline", Component: Timeline },
      { path: "library", Component: Library },
      { path: "system", Component: System },
      { path: "settings", Component: Settings },
      { path: "radio", Component: RadioPage },
      { path: "sl-universal", Component: RadioPage },
      { path: "sl-universal-original", Component: SLUniversalOriginalPage },
      { path: "radio-legacy", Component: RadioLegacyPage },
      { path: "make-music", Component: MakeMusic },
      { path: "my-tracks", Component: MyTracks },
      { path: "music/make", Component: MakeMusic },
      { path: "music/tracks", Component: MyTracks },
      { path: "music/:id/proof", Component: TrackProof },
    ],
  },
  { path: "/auth", Component: Auth },
]);
