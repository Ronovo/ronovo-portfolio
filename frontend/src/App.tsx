import { Suspense, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import type { Site } from "./types";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import { useKit } from "./theme/kits";

export default function App() {
  const [site, setSite] = useState<Site | null>(null);
  const [failed, setFailed] = useState(false);
  const kit = useKit();

  useEffect(() => {
    fetch("/api/site")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setSite)
      .catch(() => setFailed(true));
  }, []);

  if (!site) {
    return (
      <main className="wrap boot">
        <p className="mono">{failed ? "connection failed. Reload to try again." : "booting..."}</p>
      </main>
    );
  }

  return (
    <>
      {kit.Backdrop && (
        <Suspense fallback={null}>
          <kit.Backdrop site={site} />
        </Suspense>
      )}
      <Nav site={site} />
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Home site={site} />} />
          <Route path="/projects" element={<Projects site={site} />} />
          <Route path="/about" element={<About site={site} />} />
          <Route path="*" element={<NotFound site={site} />} />
        </Routes>
      </main>
      <Footer site={site} />
    </>
  );
}
