/**
 * StatusPill — render test.
 *
 * The status label is rendered verbatim (the RAW status string, not translated).
 * Class names are inert under jest, so we assert only on the displayed text.
 * Each branch (completed/refunded, requested/paid, scheduled, pending/unpaid,
 * canceled/failed, fallback) is exercised by passing a representative status.
 */

import { render, screen } from "@testing-library/react-native";
import { StatusPill } from "@/components/shared/StatusPill";

describe("StatusPill", () => {
  it("renders the raw status text verbatim (success: Completed)", () => {
    render(<StatusPill status="Completed" />);
    expect(screen.getByText("Completed")).toBeTruthy();
  });

  it("renders refunded (success branch)", () => {
    render(<StatusPill status="refunded" />);
    expect(screen.getByText("refunded")).toBeTruthy();
  });

  it("renders in-progress statuses (Requested / paid)", () => {
    render(<StatusPill status="Requested" />);
    expect(screen.getByText("Requested")).toBeTruthy();
  });

  it("renders the scheduled status", () => {
    render(<StatusPill status="Scheduled" />);
    expect(screen.getByText("Scheduled")).toBeTruthy();
  });

  it("renders warning statuses (Pending / unpaid)", () => {
    render(<StatusPill status="unpaid" />);
    expect(screen.getByText("unpaid")).toBeTruthy();
  });

  it("renders destructive statuses (Canceled / failed)", () => {
    render(<StatusPill status="Canceled" />);
    expect(screen.getByText("Canceled")).toBeTruthy();
  });

  it("renders an unknown status via the neutral fallback branch", () => {
    render(<StatusPill status="SomethingElse" />);
    expect(screen.getByText("SomethingElse")).toBeTruthy();
  });

  it("matches statuses case-insensitively but still displays the original casing", () => {
    // getStatusClasses lowercases internally; the displayed text is unchanged.
    render(<StatusPill status="COMPLETED" />);
    expect(screen.getByText("COMPLETED")).toBeTruthy();
  });
});
