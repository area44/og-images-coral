import geistNormalUrl from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import React, { useState, useEffect } from "react";
import satori from "satori";
import { transform } from "sucrase";
import { woff2Decode } from "woff-lib/woff2/decode";

import { ConfigPanel } from "@/components/ConfigPanel";
import { EditorPanel } from "@/components/EditorPanel";
import { Header } from "@/components/Header";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Sidebar, TEMPLATES, TemplateId } from "@/components/Sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import blogCode from "./template/blog.tsx?raw";
import EarthTemplate from "./template/earth";
import earthCode from "./template/earth.tsx?raw";
import minimalCode from "./template/minimal.tsx?raw";
import portfolioCode from "./template/portfolio.tsx?raw";

const TEMPLATE_CODES = {
  earth: earthCode,
  blog: blogCode,
  minimal: minimalCode,
  portfolio: portfolioCode,
};

interface LoadedFonts {
  regular: ArrayBuffer;
  bold: ArrayBuffer;
}

function evalCompiledCode(compiledCode: string): React.ComponentType<any> {
  const exports: { default?: any; [key: string]: any } = {};
  const mockRequire = (name: string) => {
    if (name === "react") {
      return React;
    }
    throw new Error(`Module "${name}" is not supported in playground.`);
  };

  const runCode = new Function("exports", "require", "React", compiledCode);
  runCode(exports, mockRequire, React);

  const component =
    exports.default || Object.values(exports).find((val) => typeof val === "function");
  if (!component) {
    throw new Error(
      "No default export or React component found. Ensure you have 'export default function OGImage' or similar.",
    );
  }

  return component;
}

export default function App() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("earth");
  const [width, setWidth] = useState<number | "">(1200);
  const [height, setHeight] = useState<number | "">(630);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"code" | "preview">("code");

  const [fonts, setFonts] = useState<LoadedFonts | null>(null);
  const [fontsLoading, setFontsLoading] = useState(true);
  const [fontsError, setFontsError] = useState<string | null>(null);

  const [svgContent, setSvgContent] = useState<string>("");
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"svg" | "png" | "jpeg" | "jpg">("svg");

  const [draftCodes, setDraftCodes] = useState<Record<TemplateId, string>>({
    earth: earthCode,
    blog: blogCode,
    minimal: minimalCode,
    portfolio: portfolioCode,
  });

  const [dynamicComponent, setDynamicComponent] = useState<React.ComponentType<any> | null>(
    () => EarthTemplate,
  );
  const [compileError, setCompileError] = useState<string | null>(null);
  const [renderTime, setRenderTime] = useState<number>(0);

  // Transpile logic using Sucrase
  useEffect(() => {
    // Fast path: if code matches default template exactly, immediately use the statically imported component
    if (draftCodes[selectedTemplate] === TEMPLATE_CODES[selectedTemplate]) {
      setDynamicComponent(() => TEMPLATES[selectedTemplate].component);
      setCompileError(null);
      return;
    }

    let active = true;

    function transpile() {
      try {
        const rawCode = draftCodes[selectedTemplate];
        const res = transform(rawCode, {
          transforms: ["jsx", "typescript", "imports"],
          production: true,
        });

        if (active) {
          const comp = evalCompiledCode(res.code);
          setDynamicComponent(() => comp);
          setCompileError(null);
        }
      } catch (err: any) {
        if (active) {
          console.error("Transpilation/Eval error:", err);
          setCompileError(err.message || "Failed to compile TSX code");
          setDynamicComponent(null);
        }
      }
    }

    const timeout = setTimeout(transpile, 150);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [selectedTemplate, draftCodes]);

  // Fetch fonts on mount
  useEffect(() => {
    function stripFvar(buffer: Uint8Array): ArrayBuffer {
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const numTables = view.getUint16(4);
      for (let i = 0; i < numTables; i++) {
        const offset = 12 + i * 16;
        const tag = String.fromCharCode(
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3),
        );
        if (tag === "fvar") {
          view.setUint8(offset, "x".charCodeAt(0));
          view.setUint8(offset + 1, "x".charCodeAt(0));
          view.setUint8(offset + 2, "x".charCodeAt(0));
          view.setUint8(offset + 3, "x".charCodeAt(0));
          break;
        }
      }
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer;
    }

    async function loadFonts() {
      try {
        setFontsLoading(true);
        setFontsError(null);

        const regularRes = await fetch(geistNormalUrl);

        if (!regularRes.ok) {
          throw new Error("Failed to fetch local variable font file");
        }

        const regularWoff2 = await regularRes.arrayBuffer();

        const regularTtf = await woff2Decode(new Uint8Array(regularWoff2));

        const regularData = stripFvar(regularTtf);

        setFonts({
          regular: regularData,
          bold: regularData,
        });
      } catch (err: any) {
        console.error("Error loading fonts:", err);
        setFontsError(err.message || "Unknown error occurred while loading fonts.");
      } finally {
        setFontsLoading(false);
      }
    }

    loadFonts();
  }, []);

  // Sync template when changes
  const handleTemplateChange = (id: TemplateId) => {
    setSelectedTemplate(id);
  };

  // Run Satori core in browser to generate the SVG with the selected template
  useEffect(() => {
    if (!fonts || !dynamicComponent) return;
    const { regular, bold } = fonts;

    let isMounted = true;

    async function renderOG() {
      try {
        setRendering(true);
        setRenderError(null);

        const resolvedWidth = typeof width === "number" ? Math.max(100, width) : 1200;
        const resolvedHeight = typeof height === "number" ? Math.max(100, height) : 630;

        // Satori supports custom Tailwind configurations
        const options = {
          width: resolvedWidth,
          height: resolvedHeight,
          fonts: [
            {
              name: "sans-serif",
              data: regular,
              weight: 400 as const,
              style: "normal" as const,
            },
            {
              name: "sans-serif",
              data: bold,
              weight: 700 as const,
              style: "normal" as const,
            },
            {
              name: "Geist Sans",
              data: regular,
              weight: 400 as const,
              style: "normal" as const,
            },
            {
              name: "Geist Sans",
              data: bold,
              weight: 700 as const,
              style: "normal" as const,
            },
          ],
          tailwindConfig: {
            theme: {
              extend: {
                colors: {
                  primary: "#ff7f50", // branded Coral color
                },
              },
            },
          },
        };

        const comp = dynamicComponent;
        if (!comp) return;

        const start = performance.now();
        const element = React.createElement(comp, {});
        const svg = await satori(element, options);
        const elapsed = performance.now() - start;

        if (isMounted) {
          setSvgContent(svg);
          setRenderTime(elapsed);
        }
      } catch (err: any) {
        console.error("Satori render error:", err);
        if (isMounted) {
          setRenderError(err.message || "Failed to render SVG using Satori");
        }
      } finally {
        if (isMounted) {
          setRendering(false);
        }
      }
    }

    // Debounce slightly for better performance when typing
    const timeout = setTimeout(renderOG, 250);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [selectedTemplate, width, height, fonts, dynamicComponent]);

  const handleCopy = async () => {
    if (!svgContent) return;
    try {
      await navigator.clipboard.writeText(svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy SVG:", err);
    }
  };

  const handleDownload = () => {
    if (!svgContent) return;

    const resolvedWidth = typeof width === "number" ? Math.max(100, width) : 1200;
    const resolvedHeight = typeof height === "number" ? Math.max(100, height) : 630;

    if (downloadFormat === "svg") {
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `og-image-${selectedTemplate}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const img = new Image();
      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = resolvedWidth;
        canvas.height = resolvedHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          if (downloadFormat === "jpeg" || downloadFormat === "jpg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, resolvedWidth, resolvedHeight);
          }
          ctx.drawImage(img, 0, 0, resolvedWidth, resolvedHeight);

          const mimeType = downloadFormat === "png" ? "image/png" : "image/jpeg";
          try {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const downloadUrl = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = downloadUrl;
                  a.download = `og-image-${selectedTemplate}.${downloadFormat}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(downloadUrl);
                }
              },
              mimeType,
              0.95,
            );
          } catch (err) {
            console.error("Canvas toBlob error, falling back to toDataURL:", err);
            const dataUrl = canvas.toDataURL(mimeType, 0.95);
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `og-image-${selectedTemplate}.${downloadFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = (err) => {
        console.error("Failed to load SVG into Image for download:", err);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  const handleCodeReset = () => {
    setDraftCodes((prev) => ({
      ...prev,
      [selectedTemplate]: TEMPLATE_CODES[selectedTemplate],
    }));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("share");
    if (shared) {
      try {
        const decoded = decodeURIComponent(escape(atob(shared)));
        const parsed = JSON.parse(decoded);
        if (parsed.code) {
          setDraftCodes((prev) => ({
            ...prev,
            [selectedTemplate]: parsed.code,
          }));
        }
        if (typeof parsed.width === "number") setWidth(parsed.width);
        if (typeof parsed.height === "number") setHeight(parsed.height);
      } catch (err) {
        console.error("Failed to parse shared state from URL:", err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="selection:text-coral-200 flex h-dvh flex-col overflow-hidden bg-background text-foreground selection:bg-coral-500/30">
      {/* Decorative top ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[200px] w-full max-w-7xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(251,113,133,0.15),transparent_50%)]" />

      {/* Header component */}
      <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Main Workspace below header */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {/* Mobile Sidebar Backdrop Overlay */}
        {isSidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 top-14 z-30 cursor-default bg-zinc-950/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        {/* Sidebar Component */}
        <Sidebar
          selectedTemplate={selectedTemplate}
          onTemplateSelect={handleTemplateChange}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Mobile Tab Switcher */}
        <div className="flex w-full shrink-0 border-b border-border bg-zinc-950 p-2 select-none lg:hidden">
          <Tabs
            value={activePanel}
            onValueChange={(val) => setActivePanel(val as "code" | "preview")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="code">Editor</TabsTrigger>
              <TabsTrigger value="preview">Live Preview & Config</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Responsive Workspace Main Content */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
          {/* Left/Upper Panel: TSX/TypeScript Code Editor */}
          <EditorPanel
            selectedTemplate={selectedTemplate}
            value={draftCodes[selectedTemplate]}
            onChange={(val) => {
              setDraftCodes((prev) => ({
                ...prev,
                [selectedTemplate]: val,
              }));
            }}
            onReset={handleCodeReset}
            activePanel={activePanel}
          />

          {/* Right/Lower Panel: Live Preview & Configuration Sidebar */}
          <div
            className={`flex-1 flex-col divide-y divide-zinc-900 overflow-y-auto bg-zinc-950 lg:h-full lg:w-1/2 ${activePanel === "preview" ? "flex" : "hidden lg:flex"}`}
          >
            {/* Live Preview Panel */}
            <PreviewPanel
              width={width}
              height={height}
              rendering={rendering}
              fontsLoading={fontsLoading}
              fontsError={fontsError}
              compileError={compileError}
              renderError={renderError}
              svgContent={svgContent}
              renderTime={renderTime}
            />

            {/* Config Panel */}
            <ConfigPanel
              width={width}
              height={height}
              setWidth={setWidth}
              setHeight={setHeight}
              downloadFormat={downloadFormat}
              setDownloadFormat={setDownloadFormat}
              onCopySvg={handleCopy}
              onDownload={handleDownload}
              svgContent={svgContent}
              rendering={rendering}
              copied={copied}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
