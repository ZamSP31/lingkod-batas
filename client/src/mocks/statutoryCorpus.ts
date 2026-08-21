import type { StatutorySource } from "../types/statutoryCorpus.js";

/** Placeholder standing in for GET /api/statutory-sources. */
export const mockStatutorySources: StatutorySource[] = [
  {
    id: "src-civil-code",
    title: "Civil Code of the Philippines",
    category: "Civil law",
    lastUpdatedAt: "2026-06-02",
    sourceUrl: "https://lawphil.net/civil-code",
  },
  {
    id: "src-labor-code",
    title: "Labor Code of the Philippines",
    category: "Labor law",
    lastUpdatedAt: "2026-05-28",
    sourceUrl: "https://lawphil.net/labor-code",
  },
  {
    id: "src-ip-code",
    title: "Intellectual Property Code (RA 8293)",
    category: "IP law",
    lastUpdatedAt: "2026-05-12",
    sourceUrl: "https://lawphil.net/ra-8293",
  },
  {
    id: "src-data-privacy-act",
    title: "Data Privacy Act (RA 10173)",
    category: "Privacy law",
    lastUpdatedAt: "2026-04-30",
    sourceUrl: "https://lawphil.net/ra-10173",
  },
];
