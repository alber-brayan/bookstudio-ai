import { create } from "zustand";
import {
  makeProject,
  totalFrames,
  type Project,
  type Book,
  type Scene,
} from "./schema";
type State = {
  project: Project;
  selectedBook: string;
  selectedScene: number;
  frame: number;
  mode: "inspect" | "cinema";
  saved: "loading" | "saved" | "saving" | "error";
  setProject: (p: Project) => void;
  patchProject: (p: Partial<Project>) => void;
  patchBook: (id: string, p: Partial<Book>) => void;
  patchScene: (p: Partial<Scene>) => void;
  selectBook: (id: string) => void;
  selectScene: (i: number) => void;
  setFrame: (n: number) => void;
  setMode: (v: State["mode"]) => void;
  setSaved: (v: State["saved"]) => void;
};
export const useStudio = create<State>((set) => ({
  project: makeProject(),
  selectedBook: "",
  selectedScene: 0,
  frame: 0,
  mode: "cinema",
  saved: "loading",
  setProject: (p) =>
    set({
      project: p,
      selectedBook: p.books[0]?.id || "",
      selectedScene: 0,
      frame: Math.min(20, totalFrames(p) - 1),
    }),
  patchProject: (p) =>
    set((s) => ({
      project: { ...s.project, ...p, updatedAt: new Date().toISOString() },
      saved: "saving",
    })),
  patchBook: (id, p) =>
    set((s) => ({
      project: {
        ...s.project,
        books: s.project.books.map((b) => (b.id === id ? { ...b, ...p } : b)),
      },
      saved: "saving",
    })),
  patchScene: (p) =>
    set((s) => ({
      project: {
        ...s.project,
        scenes: s.project.scenes.map((v, i) =>
          i === s.selectedScene ? { ...v, ...p } : v,
        ),
      },
      saved: "saving",
    })),
  selectBook: (id) => set({ selectedBook: id }),
  selectScene: (i) =>
    set((s) => ({
      selectedScene: i,
      frame: s.project.scenes
        .slice(0, i)
        .reduce((n, v) => n + Math.round(v.duration * s.project.fps), 0),
    })),
  setFrame: (frame) => set({ frame }),
  setMode: (mode) => set({ mode }),
  setSaved: (saved) => set({ saved }),
}));
