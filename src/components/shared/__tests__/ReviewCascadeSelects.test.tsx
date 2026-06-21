/**
 * ReviewCascadeSelects — Campus → Faculty → Program + Start/End Year selects.
 *
 * Traced behaviour (src/components/shared/ReviewCascadeSelects.tsx):
 *   - Renders 5 SelectFields (campus, faculty, program, startYear, endYear).
 *     Each SelectField trigger has accessibilityRole="combobox" with
 *     accessibilityLabel = its placeholder.
 *   - Labels are t() keys: campus_attend, faculty, program_studied,
 *     start_date, end_date (mocked t returns the key string).
 *   - Field-required errors (t("fieldRequired")) render PER missing field
 *     ONLY when `submitted` is true and that field's value is empty.
 *   - Faculty placeholder = "faculty" when a campus is selected, else
 *     "selectCampusFirst"; Program placeholder = "program_studied" when a
 *     faculty is selected, else "selectFacultyFirst"; End-year placeholder =
 *     "year" when startYear set, else "start_date".
 *   - SelectField shows the selected option's LABEL inside the trigger.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { ReviewCascadeSelects } from "@/components/shared/ReviewCascadeSelects";

const baseProps = {
  campusOpts: [
    { label: "Main Campus", value: "10" },
    { label: "North Campus", value: "11" },
  ],
  facultyOpts: [{ label: "Engineering", value: "20" }],
  programOpts: [{ label: "Computer Science", value: "doc-1" }],
  startYearOpts: [
    { label: "2025", value: "2025" },
    { label: "2024", value: "2024" },
  ],
  endYearOpts: [{ label: "2026", value: "2026" }],
  selectedCampus: "",
  selectedFaculty: "",
  selectedProgram: "",
  startYear: "",
  endYear: "",
  loadingFaculties: false,
  loadingPrograms: false,
  submitted: false,
  onCampusChange: jest.fn(),
  onFacultyChange: jest.fn(),
  onProgramChange: jest.fn(),
  onStartYearChange: jest.fn(),
  onEndYearChange: jest.fn(),
};

describe("ReviewCascadeSelects", () => {
  it("renders the 5 field labels (campus/faculty/program/start/end)", () => {
    render(<ReviewCascadeSelects {...baseProps} />);
    expect(screen.getByText("campus_attend *")).toBeTruthy();
    expect(screen.getByText("faculty *")).toBeTruthy();
    expect(screen.getByText("program_studied *")).toBeTruthy();
    expect(screen.getByText("start_date *")).toBeTruthy();
    expect(screen.getByText("end_date *")).toBeTruthy();
  });

  it("renders 5 select-field triggers (comboboxes)", () => {
    render(<ReviewCascadeSelects {...baseProps} />);
    expect(screen.getAllByRole("combobox")).toHaveLength(5);
  });

  it("does NOT show any fieldRequired error before submission", () => {
    render(<ReviewCascadeSelects {...baseProps} submitted={false} />);
    expect(screen.queryAllByText("fieldRequired")).toHaveLength(0);
  });

  it("shows a fieldRequired error for every empty field after submission", () => {
    render(<ReviewCascadeSelects {...baseProps} submitted />);
    // all 5 fields empty -> 5 error messages
    expect(screen.getAllByText("fieldRequired")).toHaveLength(5);
  });

  it("shows fewer fieldRequired errors when some fields are filled", () => {
    render(
      <ReviewCascadeSelects
        {...baseProps}
        submitted
        selectedCampus="10"
        selectedFaculty="20"
      />
    );
    // campus + faculty filled -> 3 still-empty fields
    expect(screen.getAllByText("fieldRequired")).toHaveLength(3);
  });

  it("uses 'selectCampusFirst' as the faculty placeholder when no campus is selected", () => {
    render(<ReviewCascadeSelects {...baseProps} selectedCampus="" />);
    // placeholder text renders inside the trigger
    expect(screen.getByText("selectCampusFirst")).toBeTruthy();
  });

  it("uses 'selectFacultyFirst' as the program placeholder when no faculty is selected", () => {
    render(<ReviewCascadeSelects {...baseProps} selectedFaculty="" />);
    expect(screen.getByText("selectFacultyFirst")).toBeTruthy();
  });

  it("shows the selected campus option label inside its trigger", () => {
    render(<ReviewCascadeSelects {...baseProps} selectedCampus="11" />);
    expect(screen.getByText("North Campus")).toBeTruthy();
  });

  it("forwards a campus selection to onCampusChange", () => {
    const onCampusChange = jest.fn();
    render(<ReviewCascadeSelects {...baseProps} onCampusChange={onCampusChange} />);
    // open the campus actionsheet via its combobox trigger (accessibilityLabel = placeholder)
    fireEvent.press(screen.getByLabelText("campus_attend"));
    // tap the option inside the opened sheet
    fireEvent.press(screen.getByText("Main Campus"));
    expect(onCampusChange).toHaveBeenCalledWith("10");
  });

  it("forwards a start-year selection to onStartYearChange", () => {
    const onStartYearChange = jest.fn();
    render(
      <ReviewCascadeSelects {...baseProps} onStartYearChange={onStartYearChange} />
    );
    // start-year placeholder is "year"; open via its trigger
    fireEvent.press(screen.getByLabelText("year"));
    fireEvent.press(screen.getByText("2024"));
    expect(onStartYearChange).toHaveBeenCalledWith("2024");
  });
});
