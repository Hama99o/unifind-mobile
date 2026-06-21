/**
 * BackgroundCard — render + edit/delete press test.
 *
 * Renders title, optional subtitle/dateStr/description, and optional edit/delete
 * icon buttons. Edit button a11y label = t("common.edit"); delete = t("common.delete")
 * (mock t returns the key string unchanged). Icon is a component type.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { GraduationCap } from "lucide-react-native";
import { BackgroundCard } from "@/components/shared/BackgroundCard";

describe("BackgroundCard", () => {
  it("renders the title only when optional fields are omitted", () => {
    render(<BackgroundCard icon={GraduationCap} title="MIT" />);
    expect(screen.getByText("MIT")).toBeTruthy();
  });

  it("renders subtitle, dateStr and description when provided", () => {
    render(
      <BackgroundCard
        icon={GraduationCap}
        title="MIT"
        subtitle="BSc Computer Science"
        dateStr="Sep 2020 – Jun 2024"
        description="Studied algorithms and systems."
      />
    );
    expect(screen.getByText("MIT")).toBeTruthy();
    expect(screen.getByText("BSc Computer Science")).toBeTruthy();
    expect(screen.getByText("Sep 2020 – Jun 2024")).toBeTruthy();
    expect(screen.getByText("Studied algorithms and systems.")).toBeTruthy();
  });

  it("renders no action buttons when neither onEdit nor onDelete is given", () => {
    render(<BackgroundCard icon={GraduationCap} title="MIT" />);
    expect(screen.queryByLabelText("common.edit")).toBeNull();
    expect(screen.queryByLabelText("common.delete")).toBeNull();
  });

  it("fires onEdit when the edit button is pressed", () => {
    const onEdit = jest.fn();
    render(<BackgroundCard icon={GraduationCap} title="MIT" onEdit={onEdit} />);
    fireEvent.press(screen.getByLabelText("common.edit"));
    expect(onEdit).toHaveBeenCalledTimes(1);
    // delete button should not exist
    expect(screen.queryByLabelText("common.delete")).toBeNull();
  });

  it("fires onDelete when the delete button is pressed", () => {
    const onDelete = jest.fn();
    render(
      <BackgroundCard icon={GraduationCap} title="MIT" onDelete={onDelete} />
    );
    fireEvent.press(screen.getByLabelText("common.delete"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("renders both action buttons when both callbacks are given", () => {
    render(
      <BackgroundCard
        icon={GraduationCap}
        title="MIT"
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByLabelText("common.edit")).toBeTruthy();
    expect(screen.getByLabelText("common.delete")).toBeTruthy();
  });
});
