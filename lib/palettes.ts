/** Trial brand palettes, picked from the navbar; the CSS for each lives in app/globals.css. */
export const palettes = [
  { id: "saffron", name: "Saffron", primary: "#ff9933", secondary: "#138808" },
  { id: "indigo", name: "Indigo", primary: "#6366f1", secondary: "#d97706" },
  { id: "ocean", name: "Ocean Blue", primary: "#2563eb", secondary: "#0d9488" },
  { id: "teal", name: "Teal", primary: "#0d9488", secondary: "#ea580c" },
  { id: "violet", name: "Violet", primary: "#7c3aed", secondary: "#db2777" },
  { id: "emerald", name: "Emerald", primary: "#059669", secondary: "#0284c7" },
  { id: "coral", name: "Coral", primary: "#f43f5e", secondary: "#0891b2" },
] as const;

export const PALETTE_KEY = "joblay-palette";

/** Runs before paint (see app/layout.tsx) so a saved palette never flashes. */
export const paletteInitScript = `try{var p=localStorage.getItem("${PALETTE_KEY}");if(p&&p!=="saffron")document.documentElement.dataset.palette=p}catch(e){}`;
