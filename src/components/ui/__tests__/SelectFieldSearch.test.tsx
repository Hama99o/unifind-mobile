/**
 * SelectField `searchable` — web parity with UFSearchableDropDown (profile
 * Country and dial code). QA 2026-11-10: mobile showed ~250 countries in API
 * order with no way to search.
 */
import { render, screen, fireEvent } from "@testing-library/react-native";
import { SelectField } from "@/components/ui/select-field";

const options = [
  { label: "Aruba", value: "Aruba" },
  { label: "Lebanon", value: "Lebanon" },
  { label: "Åland Islands", value: "Åland Islands" },
  { label: "Latvia", value: "Latvia" },
];

const open = (props: Partial<React.ComponentProps<typeof SelectField>> = {}) => {
  const onChange = jest.fn();
  render(<SelectField placeholder="Country" options={options} value="" onChange={onChange} {...props} />);
  fireEvent.press(screen.getByLabelText("Country"));
  return onChange;
};

describe("SelectField searchable", () => {
  it("has no search box unless searchable", () => {
    open();
    expect(screen.queryByTestId("select-search")).toBeNull();
  });

  it("filters options as the user types (case-insensitive)", () => {
    open({ searchable: true });
    fireEvent.changeText(screen.getByTestId("select-search"), "LEB");
    expect(screen.getByText("Lebanon")).toBeTruthy();
    expect(screen.queryByText("Aruba")).toBeNull();
    expect(screen.queryByText("Latvia")).toBeNull();
  });

  it("ignores accents (aland finds Åland Islands)", () => {
    open({ searchable: true });
    fireEvent.changeText(screen.getByTestId("select-search"), "aland");
    expect(screen.getByText("Åland Islands")).toBeTruthy();
  });

  it("shows the empty text when nothing matches, and picking a result selects it", () => {
    const onChange = open({ searchable: true });
    fireEvent.changeText(screen.getByTestId("select-search"), "zzz");
    expect(screen.getByText("common.empty")).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("select-search"), "lat");
    fireEvent.press(screen.getByText("Latvia"));
    expect(onChange).toHaveBeenCalledWith("Latvia");
  });
});
