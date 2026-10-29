export interface Link {
  label: string;
  href: string;
  external: boolean;
}

export interface Project {
  title: string;
  category: string;
  desc: string;
  tags: string[];
  featured: boolean;
  thumb: string | null;
  source: string | null;
  about: string | null;
  links: Link[];
}

export interface Category {
  name: string;
  blurb: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface Site {
  name: string;
  tagline: string;
  intro: string;
  nav: NavItem[];
  account: string | null;
  categories: Category[];
  tags: string[];
  projects: Project[];
}
