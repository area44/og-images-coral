import { Button } from "@/components/ui/button";

import BlogTemplate from "../template/blog";
import EarthTemplate from "../template/earth";
import MinimalTemplate from "../template/minimal";
import PortfolioTemplate from "../template/portfolio";

export const TEMPLATES = {
  earth: {
    id: "earth",
    name: "Earth Template",
    component: EarthTemplate,
  },
  blog: {
    id: "blog",
    name: "Blog Template",
    component: BlogTemplate,
  },
  minimal: {
    id: "minimal",
    name: "Minimal Template",
    component: MinimalTemplate,
  },
  portfolio: {
    id: "portfolio",
    name: "Portfolio Template",
    component: PortfolioTemplate,
  },
} as const;

export type TemplateId = keyof typeof TEMPLATES;

interface SidebarProps {
  selectedTemplate: TemplateId;
  onTemplateSelect: (id: TemplateId) => void;
  isSidebarOpen: boolean;
}

export function Sidebar({ selectedTemplate, onTemplateSelect, isSidebarOpen }: SidebarProps) {
  return (
    <aside
      className={`fixed top-14 bottom-0 left-0 z-40 flex shrink-0 flex-col border-r border-zinc-900 bg-zinc-950 transition-all duration-300 ease-in-out select-none lg:static lg:h-[calc(100vh-56px)] lg:bg-zinc-950/30 ${
        isSidebarOpen
          ? "w-64 translate-x-0 opacity-100"
          : "pointer-events-none w-0 -translate-x-full opacity-0 lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:border-r-0"
      }`}
    >
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 pt-6">
        <div className="space-y-2">
          <h3 className="px-3 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
            Playground Templates
          </h3>
          <div className="space-y-1">
            {(Object.keys(TEMPLATES) as TemplateId[]).map((key) => {
              const t = TEMPLATES[key];
              const active = selectedTemplate === key;
              return (
                <Button
                  key={key}
                  onClick={() => onTemplateSelect(key)}
                  variant="ghost"
                  className={`flex h-auto w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                    active
                      ? "border-l-2 border-coral-500 bg-coral-500/10 pl-2.5 text-coral-400 hover:bg-coral-500/15 hover:text-coral-400"
                      : "border-l-2 border-transparent pl-2.5 text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                  }`}
                >
                  <span>{t.name}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-900 p-4">
        <div className="flex items-center justify-between px-1 text-[11px] text-zinc-500">
          <span>By AREA44</span>
        </div>
      </div>
    </aside>
  );
}
