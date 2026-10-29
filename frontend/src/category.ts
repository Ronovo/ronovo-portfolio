export const categoryKey = (name: string) => name.toLowerCase();

export const categoryHref = (name: string) => `/projects?category=${categoryKey(name)}`;
