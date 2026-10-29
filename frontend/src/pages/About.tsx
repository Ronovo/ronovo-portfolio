import type { Site } from "../types";
import { usePageTitle } from "../usePageTitle";
import Hero from "../components/Hero";

export default function About({ site }: { site: Site }) {
  usePageTitle("About", site.name);
  return (
    <>
      <Hero title="About" subtitle="I build tools and games I want to use, then host them so others can too." />
      <article className="prose">
        <p>
          {site.intro} This is a portfolio to host all of my projects on GitHub, so that others can access them to test
          how they work.
        </p>

        <h2>What I make</h2>
        <p>
          I just make whatever I think is cool. Why else would someone make a text chat that you can run esoteric
          languages in? Currently, I host:
        </p>
        <ul>
          <li>Tools for tabletop games</li>
          <li>RuneScape tools for the GE and tracking your account progress</li>
          <li>Various browser-based games</li>
          <li>An esoteric chat with a few languages installed</li>
        </ul>

        <h2>What I build with</h2>
        <p>
          I use a variety of tools. Every project is a chance to build a new tool from scratch, sometimes with a new
          language, sometimes with something I am familiar with.
        </p>
        <ul>
          <li>
            <b>Languages:</b> Python, C#, TypeScript, JavaScript, Java
          </li>
          <li>
            <b>Web frameworks:</b> Flask, ASP.NET Core MVC, Node
          </li>
          <li>
            <b>Data:</b> SQLite, Entity Framework Core
          </li>
          <li>
            <b>Hosting:</b> Docker, Docker Compose, gunicorn
          </li>
          <li>
            <b>Game tools:</b> RuneLite plugins
          </li>
        </ul>

        <h2>How it runs</h2>
        <ul>
          <li>Everything here is self-hosted in Docker on my own server.</li>
          <li>The portfolio doubles as a single sign-on, so one account logs in to every app.</li>
        </ul>
      </article>
    </>
  );
}
