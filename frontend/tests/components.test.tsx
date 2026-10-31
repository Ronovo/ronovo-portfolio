import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AccountCallout from "../src/components/AccountCallout";
import CategoryTiles from "../src/components/CategoryTiles";
import Footer from "../src/components/Footer";
import Hero from "../src/components/Hero";
import Nav from "../src/components/Nav";
import ProjectCard from "../src/components/ProjectCard";
import SectionHead from "../src/components/SectionHead";
import Typewriter from "../src/components/Typewriter";
import { makeSite, project, reducedMotion } from "./fakes";

const inRouter = (element: JSX.Element) => render(<MemoryRouter>{element}</MemoryRouter>);

describe("ProjectCard", () => {
  it("shows the thumbnail, tags and every link, opening outside links in a new tab", () => {
    const card = project({
      title: "Casino", thumb: "/static/casino.png", tags: ["Python", "Flask"],
      links: [{ label: "Play", href: "https://casino.ronovo.io/", external: true },
        { label: "Try it", href: "/projects/plugin/run", external: false }],
    });
    render(<ProjectCard project={card} index={2} />);
    const article = screen.getByRole("article");
    expect(article.style.getPropertyValue("--i")).toBe("2");
    expect(article.querySelector("img")!.getAttribute("src")).toBe("/static/casino.png");
    expect(within(article).getAllByRole("listitem").map((tag) => tag.textContent)).toEqual(["Python", "Flask"]);
    expect(screen.getByText("Source").getAttribute("href")).toBe("https://github.com/Ronovo/project");
    expect(screen.getByText("About").getAttribute("href")).toBe("/projects/project/");
    expect(screen.getByText("Play").getAttribute("target")).toBe("_blank");
    expect(screen.getByText("Play").getAttribute("rel")).toBe("noopener");
    expect(screen.getByText("Try it").hasAttribute("target")).toBe(false);
  });

  it("says coming soon when there is nothing to link to", () => {
    render(<ProjectCard project={project({ source: null, about: null })} index={0} />);
    expect(screen.getByText("Coming soon")).toBeTruthy();
    expect(screen.getByRole("article").querySelector("img")).toBeNull();
  });

  it("links just the source or just the about page", () => {
    render(<ProjectCard project={project({ about: null })} index={0} />);
    expect(screen.queryByText("About")).toBeNull();
    expect(screen.getByText("Source")).toBeTruthy();
  });
});

describe("CategoryTiles", () => {
  it("counts each category's projects", () => {
    inRouter(<CategoryTiles site={makeSite()} />);
    const tile = (name: string) => screen.getByRole("heading", { name }).closest("a")!;
    expect(tile("Games").textContent).toContain("1 project");
    expect(tile("Games").getAttribute("href")).toBe("/projects?category=games");
    expect(tile("TTRPG").textContent).toContain("0 projects");
  });
});

describe("Nav", () => {
  function Go({ to }: { to: string }) {
    const navigate = useNavigate();
    return <button onClick={() => navigate(to)}>go</button>;
  }

  it("opens the menu and closes it on navigation", () => {
    inRouter(
      <>
        <Nav site={makeSite()} />
        <Go to="/about" />
      </>,
    );
    const toggle = screen.getByText("Menu");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("navigation").className).toBe("site-nav open");
    act(() => {
      fireEvent.click(screen.getByText("go"));
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("links the account by name, or offers to log in", () => {
    inRouter(<Nav site={makeSite()} />);
    expect(screen.getByText("Log in").getAttribute("href")).toBe("/account");
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toContain("Projects");
    render(
      <MemoryRouter>
        <Nav site={makeSite({ account: "ronovo" })} />
      </MemoryRouter>,
    );
    expect(screen.getByText("ronovo").getAttribute("href")).toBe("/account");
  });
});

describe("AccountCallout", () => {
  it("offers to make an account or log in", () => {
    render(<AccountCallout site={makeSite()} />);
    expect(screen.getByText("Create an account").getAttribute("href")).toBe("/account/register");
    expect(screen.getByText("Log in").getAttribute("href")).toBe("/account/login");
  });

  it("names the logged-in account", () => {
    render(<AccountCallout site={makeSite({ account: "ronovo" })} />);
    expect(screen.getByText("ronovo").getAttribute("href")).toBe("/account");
    expect(screen.queryByText("Log in")).toBeNull();
  });
});

describe("small pieces", () => {
  it("draws the footer with this year", () => {
    render(<Footer site={makeSite()} />);
    expect(screen.getByText(new RegExp(`${new Date().getFullYear()} Ronovo`))).toBeTruthy();
  });

  it("draws a hero with and without a kicker", () => {
    const { container } = render(<Hero title="Home" subtitle="Hi" kicker="// online" home />);
    expect(container.querySelector("header")!.className).toBe("hero hero-home");
    expect(screen.getByText("// online")).toBeTruthy();
    render(<Hero title="About" subtitle="Me" />);
    expect(screen.getAllByRole("banner")[1].className).toBe("hero");
  });

  it("draws a section head with an optional link", () => {
    inRouter(<SectionHead title="Featured" link="/projects" linkText="All projects" />);
    expect(screen.getByText(/All projects/).getAttribute("href")).toBe("/projects");
    render(<SectionHead title="Plain" />);
    expect(screen.getByRole("heading", { name: "Plain" }).parentElement!.querySelector("a")).toBeNull();
  });
});

describe("Typewriter", () => {
  it("types one letter at a time, then says it is done", () => {
    vi.useFakeTimers();
    const done = vi.fn();
    const { container } = render(<Typewriter text="abc" speed={10} onDone={done} />);
    const typed = () => container.querySelector('[aria-hidden="true"]')!.textContent;
    expect(screen.getByText("abc").className).toBe("sr-only");
    expect(typed()).toBe("");
    act(() => vi.advanceTimersByTime(10));
    expect(typed()).toBe("a");
    act(() => vi.advanceTimersByTime(10));
    act(() => vi.advanceTimersByTime(10));
    expect(typed()).toBe("abc");
    expect(done).toHaveBeenCalledOnce();
  });

  it("shows the whole text at once for reduced motion", () => {
    reducedMotion().set(true);
    const { container } = render(<Typewriter text="abc" />);
    expect(container.querySelector('[aria-hidden="true"]')!.textContent).toBe("abc");
  });
});
