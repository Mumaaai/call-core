export type MenuItem = {
  id: string;
  title: string;
  file: string;
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
};

export const menu: MenuSection[] = [
  {
    title: "Getting Started",
    items: [
      { id: "intro", title: "Introduction", file: "intro.md" },
      { id: "setup", title: "Initial Setup", file: "setup.md" },
    ]
  },
  {
    title: "Architecture",
    items: [
      { id: "backend", title: "Backend API", file: "backend.md" },
      { id: "worker", title: "Processing Worker", file: "worker.md" },
    ]
  }
];
