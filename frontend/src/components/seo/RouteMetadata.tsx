import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { getRouteMetadata } from "@/lib/seo/routeMetadata";

function ensureMeta(selector: string, create: () => HTMLMetaElement) {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) {
    return existing;
  }

  const meta = create();
  document.head.appendChild(meta);
  return meta;
}

function ensureCanonical() {
  const existing = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (existing) {
    return existing;
  }

  const link = document.createElement("link");
  link.setAttribute("rel", "canonical");
  document.head.appendChild(link);
  return link;
}

export const RouteMetadata = () => {
  const location = useLocation();

  useEffect(() => {
    const metadata = getRouteMetadata(location.pathname);
    const absoluteUrl = new URL(
      metadata.canonicalPath,
      window.location.origin,
    ).toString();

    document.title = metadata.title;

    ensureMeta('meta[name="description"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      return meta;
    }).setAttribute("content", metadata.description);

    ensureMeta('meta[name="robots"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      return meta;
    }).setAttribute("content", metadata.robots ?? "noindex, nofollow");

    ensureMeta('meta[property="og:title"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:title");
      return meta;
    }).setAttribute("content", metadata.title);

    ensureMeta('meta[property="og:description"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:description");
      return meta;
    }).setAttribute("content", metadata.description);

    ensureMeta('meta[property="og:type"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:type");
      return meta;
    }).setAttribute("content", "website");

    ensureMeta('meta[property="og:url"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:url");
      return meta;
    }).setAttribute("content", absoluteUrl);

    ensureMeta('meta[name="twitter:card"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "twitter:card");
      return meta;
    }).setAttribute("content", "summary");

    ensureMeta('meta[name="twitter:title"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "twitter:title");
      return meta;
    }).setAttribute("content", metadata.title);

    ensureMeta('meta[name="twitter:description"]', () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "twitter:description");
      return meta;
    }).setAttribute("content", metadata.description);

    ensureCanonical().setAttribute("href", absoluteUrl);
  }, [location.pathname]);

  return null;
};
