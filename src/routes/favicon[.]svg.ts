import { createFileRoute } from "@tanstack/react-router";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="#0b0f1a"/><path fill="url(#g)" d="M20 42c0-6 5-11 12-11s12 5 12 11c0 3-2 5-5 5H25c-3 0-5-2-5-5zm3-16a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm18 0a5 5 0 1 1 0-10 5 5 0 0 1 0 10zM16 32a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm32 0a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/></svg>`;

export const Route = createFileRoute("/favicon.svg")({
  server: {
    handlers: {
      GET: () =>
        new Response(SVG, {
          headers: {
            "content-type": "image/svg+xml",
            "cache-control": "public, max-age=86400",
          },
        }),
    },
  },
});