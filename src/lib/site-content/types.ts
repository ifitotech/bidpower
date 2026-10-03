export type Block = string; // a paragraph; a line starting with "- " is a list item (consecutive ones form one list)
export type DocSection = { id: string; title: string; body: Block[] };
export type LegalDoc = { title: string; summaryTitle: string; summary: string[]; sections: DocSection[] };
export type HelpArticle = { id: string; q: string; a: Block[]; keywords?: string };
export type HelpTopic = { id: string; title: string; blurb: string; articles: HelpArticle[] };
export type SiteContent = {
  ui: {
    back: string; updated: string; onThisPage: string; contactTitle: string; contactBody: string; contactInApp: string;
    emailUs: string; operator: string; helpTitle: string; helpIntro: string; searchPh: string; noResults: string;
    startTitle: string; startSteps: string[]; legalLinks: string; terms: string; privacy: string; help: string;
    acceptNote: string; helpHere: string; footerRights: string; print: string; topics: string; related: string;
  };
  terms: LegalDoc;
  privacy: LegalDoc;
  help: HelpTopic[];
};
export const LEGAL_UPDATED = "2026-10-03";
