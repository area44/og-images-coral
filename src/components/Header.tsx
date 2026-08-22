import { Menu, X } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Header({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between border-b border-zinc-900 bg-zinc-950/80 px-6 backdrop-blur-md select-none">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="mr-1 text-zinc-400 hover:text-zinc-200"
          aria-label="Toggle Menu"
        >
          {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <svg className="h-6 w-6 shrink-0" viewBox="0 0 256 257" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="header-vite-a" x1="-0.828%" x2="57.636%" y1="7.652%" y2="78.411%">
              <stop offset="0%" stopColor="#41D1FF" />
              <stop offset="100%" stopColor="#BD34FE" />
            </linearGradient>
            <linearGradient id="header-vite-b" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%">
              <stop offset="0%" stopColor="#FFEA83" />
              <stop offset="8.333%" stopColor="#FFDD35" />
              <stop offset="100%" stopColor="#FFA800" />
            </linearGradient>
          </defs>
          <path
            fill="url(#header-vite-a)"
            d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"
          />
          <path
            fill="url(#header-vite-b)"
            d="M185.432 13.808l-132.3 24.116c-2.583.47-4.257 3.003-3.75 5.581l14.86 75.393c.47 2.388 2.651 4.084 5.08 3.931l29.882-1.882c2.784-.175 4.805 2.488 4.083 5.182l-10.4 38.8c-.808 3.018 2.15 5.64 5.068 4.757l27.172-8.219c2.732-.826 5.343 1.517 4.722 4.258l-10.222 45.162c-.933 4.12 4.32 6.82 7.025 3.621l65.867-77.822c2.083-2.463.308-6.26-2.91-6.236l-31.127.235c-2.716.02-4.757-2.433-4.103-5.071l13.116-52.909c.677-2.731-1.423-5.267-4.225-5.022l-23.82 2.082c-2.753.24-4.823-2.39-4.137-5.06l12.57-48.91c.712-2.771-1.464-5.385-4.301-4.87z"
          />
        </svg>
        <span className="hidden font-semibold text-zinc-200 sm:inline">OG Image Coral</span>
      </div>
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/area44/og-image-template"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-zinc-400 transition hover:text-zinc-200 hover:underline"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
