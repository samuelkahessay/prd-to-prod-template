"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { PipelineDiagram } from "./PipelineDiagram";
import { StagePanel } from "./StagePanel";
import { STAGES } from "./stages/stage-data";
import { PrdStage } from "./stages/PrdStage";
import { DecomposeStage } from "./stages/DecomposeStage";
import { ImplementStage } from "./stages/ImplementStage";
import { ReviewStage } from "./stages/ReviewStage";
import { MergeStage } from "./stages/MergeStage";
import { DeployStage } from "./stages/DeployStage";
import { HealStage } from "./stages/HealStage";

const STAGE_COMPONENTS = [
  PrdStage,
  DecomposeStage,
  ImplementStage,
  ReviewStage,
  MergeStage,
  DeployStage,
  HealStage,
];

const AUTO_PLAY_INTERVAL = 4000;

export function PipelineWalkthrough() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState<number | null>(0);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // IntersectionObserver for desktop scroll-linked highlighting
  useEffect(() => {
    const panels = panelRefs.current.filter(Boolean) as HTMLDivElement[];
    if (panels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible panel
        let maxRatio = 0;
        let maxIndex = activeIndex;
        entries.forEach((entry) => {
          const idx = panels.indexOf(entry.target as HTMLDivElement);
          if (idx !== -1 && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            maxIndex = idx;
          }
        });
        if (maxRatio > 0.2) {
          setActiveIndex(maxIndex);
        }
      },
      {
        root: null,
        rootMargin: "-30% 0px -30% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    panels.forEach((p) => observer.observe(p));
    return () => observer.disconnect();
  }, [activeIndex]);

  // Auto-play logic
  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    setIsAutoPlaying(false);
  }, []);

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    setIsAutoPlaying(true);

    let current = 0;
    setActiveIndex(0);

    // Scroll to the first panel
    panelRefs.current[0]?.scrollIntoView({ behavior: "smooth", block: "center" });

    autoPlayRef.current = setInterval(() => {
      current++;
      if (current >= STAGES.length) {
        stopAutoPlay();
        return;
      }
      setActiveIndex(current);
      panelRefs.current[current]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, AUTO_PLAY_INTERVAL);
  }, [stopAutoPlay]);

  // Stop auto-play on manual scroll
  useEffect(() => {
    if (!isAutoPlaying) return;
    const onWheel = () => stopAutoPlay();
    const onTouch = () => stopAutoPlay();
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouch);
    };
  }, [isAutoPlaying, stopAutoPlay]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  const handleMobileToggle = (index: number) => {
    setExpandedMobile(expandedMobile === index ? null : index);
    setActiveIndex(index);
  };

  return (
    <section id="walkthrough" className="border-t py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How the pipeline works
          </h2>
          <p className="mt-4 text-muted-foreground">
            Seven stages, zero human intervention. From product brief to
            production deployment.
          </p>
          <div className="mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={isAutoPlaying ? stopAutoPlay : startAutoPlay}
              className="gap-2"
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="size-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="size-3.5" /> Watch the flow
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Desktop: sticky diagram + scrolling panels */}
        <div
          ref={sectionRef as React.RefObject<HTMLDivElement>}
          className="mt-16 hidden lg:flex lg:gap-12"
        >
          {/* Left: sticky pipeline diagram */}
          <div className="w-[180px] shrink-0">
            <div className="sticky top-24 h-[560px]">
              <PipelineDiagram activeIndex={activeIndex} />
            </div>
          </div>

          {/* Right: scrolling stage panels */}
          <div className="flex-1 space-y-24">
            {STAGES.map((stage, i) => {
              const StageContent = STAGE_COMPONENTS[i];
              return (
                <div
                  key={stage.id}
                  ref={(el) => {
                    panelRefs.current[i] = el;
                  }}
                >
                  <StagePanel stage={stage}>
                    <StageContent />
                  </StagePanel>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: vertical accordion */}
        <div className="mt-12 space-y-3 lg:hidden">
          {STAGES.map((stage, i) => {
            const StageContent = STAGE_COMPONENTS[i];
            const isExpanded = expandedMobile === i;

            return (
              <div key={stage.id} className="rounded-lg border">
                <button
                  type="button"
                  onClick={() => handleMobileToggle(i)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  aria-expanded={isExpanded}
                >
                  <span
                    className="block size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: stage.colorVar }}
                  />
                  <span className="flex-1 text-sm font-medium">
                    {stage.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {stage.agent}
                  </span>
                  <svg
                    className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="border-t px-4 py-4">
                    <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                      {stage.description}
                    </p>
                    <StageContent />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
