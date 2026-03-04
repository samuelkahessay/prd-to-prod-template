import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PipelineSkeleton } from "@/components/skeletons/pipeline-skeleton";
import { StatusCardsSkeleton } from "@/components/skeletons/status-cards-skeleton";
import { ActivityFeedSkeleton } from "@/components/skeletons/activity-feed-skeleton";
import { MetricsBarSkeleton } from "@/components/skeletons/metrics-bar-skeleton";

describe("Skeleton Components", () => {
  describe("PipelineSkeleton", () => {
    it("renders with correct data-testid", () => {
      render(<PipelineSkeleton />);
      expect(screen.getByTestId("skeleton-pipeline-dag")).toBeInTheDocument();
    });

    it("contains Skeleton elements with animate-pulse", () => {
      const { container } = render(<PipelineSkeleton />);
      const skeletonElements = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
      skeletonElements.forEach((el) => {
        expect(el.className).toMatch(/animate-pulse/);
      });
    });
  });

  describe("StatusCardsSkeleton", () => {
    it("renders with correct data-testid", () => {
      render(<StatusCardsSkeleton />);
      expect(screen.getByTestId("skeleton-status-cards")).toBeInTheDocument();
    });

    it("renders 5 skeleton cards", () => {
      const { container } = render(<StatusCardsSkeleton />);
      const cards = container.querySelectorAll(
        '[data-testid="skeleton-status-cards"] > div'
      );
      expect(cards).toHaveLength(5);
    });

    it("contains Skeleton elements with animate-pulse", () => {
      const { container } = render(<StatusCardsSkeleton />);
      const skeletonElements = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
      skeletonElements.forEach((el) => {
        expect(el.className).toMatch(/animate-pulse/);
      });
    });
  });

  describe("ActivityFeedSkeleton", () => {
    it("renders with correct data-testid", () => {
      render(<ActivityFeedSkeleton />);
      expect(screen.getByTestId("skeleton-activity-feed")).toBeInTheDocument();
    });

    it("renders 5 skeleton items", () => {
      const { container } = render(<ActivityFeedSkeleton />);
      const items = container.querySelectorAll(
        '[data-testid="skeleton-activity-feed"] > div'
      );
      expect(items).toHaveLength(5);
    });

    it("contains Skeleton elements with animate-pulse", () => {
      const { container } = render(<ActivityFeedSkeleton />);
      const skeletonElements = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
      skeletonElements.forEach((el) => {
        expect(el.className).toMatch(/animate-pulse/);
      });
    });
  });

  describe("MetricsBarSkeleton", () => {
    it("renders with correct data-testid", () => {
      render(<MetricsBarSkeleton />);
      expect(screen.getByTestId("skeleton-metrics-bar")).toBeInTheDocument();
    });

    it("contains Skeleton elements with animate-pulse", () => {
      const { container } = render(<MetricsBarSkeleton />);
      const skeletonElements = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
      skeletonElements.forEach((el) => {
        expect(el.className).toMatch(/animate-pulse/);
      });
    });
  });
});
