import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getSeverityBand, SEVERITY_BANDS } from "@/lib/aqi/severity";

import { AqiBadge } from "@/components/aqi/AqiBadge";

describe("AqiBadge", () => {
  it("names the band in text, so colour is never the only signal", () => {
    render(<AqiBadge aqi={175} />);
    expect(screen.getByText("Unhealthy")).toBeInTheDocument();
  });

  it("shows the value alongside the band when asked", () => {
    render(<AqiBadge aqi={42} showValue />);
    expect(screen.getByText("42 · Good")).toBeInTheDocument();
  });

  it("carries the band's colour class rather than a hard-coded colour", () => {
    const { container } = render(<AqiBadge aqi={250} />);
    const badge = container.firstElementChild;

    expect(badge?.className).toContain("bg-aqi-very-unhealthy");
    expect(badge?.className).not.toMatch(/#[0-9a-f]{3,6}/i);
  });

  it("renders a readable label at every band boundary", () => {
    for (const band of SEVERITY_BANDS) {
      const { unmount } = render(<AqiBadge aqi={band.min} />);
      expect(screen.getByText(band.label)).toBeInTheDocument();
      unmount();
    }
  });

  it("labels an over-scale reading as hazardous, not good", () => {
    render(<AqiBadge aqi={Number.POSITIVE_INFINITY} />);
    expect(
      screen.getByText(getSeverityBand(Number.POSITIVE_INFINITY).label),
    ).toBeInTheDocument();
    expect(screen.getByText("Hazardous")).toBeInTheDocument();
  });
});
