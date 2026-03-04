"use client";

import { STAGES } from "./stages/stage-data";

interface PipelineDiagramProps {
  activeIndex: number;
}

const NODE_GAP = 72;
const NODE_R = 14;
const SVG_WIDTH = 180;
const START_Y = 40;

export function PipelineDiagram({ activeIndex }: PipelineDiagramProps) {
  const totalHeight = START_Y + (STAGES.length - 1) * NODE_GAP + 40;

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
      className="h-full w-full"
      aria-hidden="true"
    >
      {/* Connecting lines */}
      {STAGES.map((_, i) => {
        if (i === STAGES.length - 1) return null;
        const y1 = START_Y + i * NODE_GAP + NODE_R;
        const y2 = START_Y + (i + 1) * NODE_GAP - NODE_R;
        const completed = i < activeIndex;
        return (
          <line
            key={`line-${i}`}
            x1={SVG_WIDTH / 2}
            y1={y1}
            x2={SVG_WIDTH / 2}
            y2={y2}
            stroke={completed ? STAGES[i].colorVar : "var(--border)"}
            strokeWidth={completed ? 2 : 1.5}
            strokeDasharray={completed ? "none" : "4 3"}
            className="transition-all duration-500"
          />
        );
      })}

      {/* Nodes */}
      {STAGES.map((stage, i) => {
        const cy = START_Y + i * NODE_GAP;
        const isActive = i === activeIndex;
        const isCompleted = i < activeIndex;
        const isFuture = i > activeIndex;

        return (
          <g key={stage.id}>
            {/* Glow ring for active node */}
            {isActive && (
              <circle
                cx={SVG_WIDTH / 2}
                cy={cy}
                r={NODE_R + 6}
                fill="none"
                stroke={stage.colorVar}
                strokeWidth={1.5}
                opacity={0.3}
                className="animate-pulse"
              />
            )}

            {/* Node circle */}
            <circle
              cx={SVG_WIDTH / 2}
              cy={cy}
              r={NODE_R}
              fill={
                isActive
                  ? stage.colorVar
                  : isCompleted
                    ? stage.colorVar
                    : "var(--muted)"
              }
              stroke={
                isFuture ? "var(--border)" : stage.colorVar
              }
              strokeWidth={isFuture ? 1.5 : 2}
              opacity={isCompleted ? 0.6 : 1}
              className="transition-all duration-500"
            />

            {/* Stage label */}
            <text
              x={SVG_WIDTH / 2 + NODE_R + 12}
              y={cy}
              dy="0.35em"
              className={`text-[11px] font-medium transition-opacity duration-500 ${
                isActive
                  ? "fill-foreground"
                  : isCompleted
                    ? "fill-muted-foreground"
                    : "fill-muted-foreground/50"
              }`}
              style={{
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              {stage.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
