/**
 * faIconToLucide.test.ts — unit tests for the FontAwesome → lucide mapping.
 *
 * faIconToLucide(faName?):
 *   - null/undefined/empty → Layers (fallback).
 *   - Strips a leading "fa-" prefix, then lowercases, then looks up FA_MAP.
 *   - Unknown name → Layers.
 *
 * We assert by identity against the actual lucide component references that the
 * module imports, so the test stays in lockstep with the real mapping table.
 */

import { faIconToLucide } from "@/utils/faIconToLucide";
import {
  Layers,
  GraduationCap,
  BookOpen,
  Stethoscope,
  Calculator,
  Cpu,
  Globe,
  Palette,
  Briefcase,
  FlaskConical,
  Leaf,
  Scale,
  Music,
  HeartPulse,
  Building2,
  Gavel,
  Code2,
  Atom,
  PenTool,
  Camera,
  ChartBar,
  Megaphone,
  Users,
  Microscope,
  Plane,
  Truck,
  Hammer,
  Drama,
  Church,
  DollarSign,
  Shield,
  Settings,
} from "lucide-react-native";

describe("faIconToLucide — fallback handling", () => {
  it("returns Layers for undefined", () => {
    expect(faIconToLucide(undefined)).toBe(Layers);
  });

  it("returns Layers for null", () => {
    expect(faIconToLucide(null)).toBe(Layers);
  });

  it("returns Layers for empty string (falsy)", () => {
    expect(faIconToLucide("")).toBe(Layers);
  });

  it("returns Layers for an unmapped icon name", () => {
    expect(faIconToLucide("totally-unknown-icon")).toBe(Layers);
  });

  it('maps the literal "layers"/"layer-group" names to Layers', () => {
    expect(faIconToLucide("layers")).toBe(Layers);
    expect(faIconToLucide("layer-group")).toBe(Layers);
  });
});

describe("faIconToLucide — prefix & casing normalization", () => {
  it('strips a leading "fa-" prefix before lookup', () => {
    expect(faIconToLucide("fa-palette")).toBe(Palette);
  });

  it("lowercases the name before lookup", () => {
    expect(faIconToLucide("PALETTE")).toBe(Palette);
    expect(faIconToLucide("Briefcase")).toBe(Briefcase);
  });

  it('handles "fa-" prefix together with mixed casing', () => {
    expect(faIconToLucide("fa-Graduation-Cap")).toBe(GraduationCap);
  });

  it('only strips a single leading "fa-" (e.g. "fa-fa-x" → "fa-x" → unknown → Layers)', () => {
    // replace(/^fa-/, "") removes only the first occurrence; "fa-x" remains unmapped.
    expect(faIconToLucide("fa-fa-x")).toBe(Layers);
  });
});

describe("faIconToLucide — known mappings", () => {
  const cases: Array<[string, unknown]> = [
    ["palette", Palette],
    ["paint-brush", PenTool],
    ["pen-nib", PenTool],
    ["camera", Camera],
    ["film", Camera],
    ["music", Music],
    ["theater-masks", Drama],
    ["masks-theater", Drama],
    ["book", BookOpen],
    ["book-open", BookOpen],
    ["books", BookOpen],
    ["language", Globe],
    ["globe", Globe],
    ["globe-americas", Globe],
    ["cross", Church],
    ["church", Church],
    ["briefcase", Briefcase],
    ["chart-bar", ChartBar],
    ["chart-line", ChartBar],
    ["chart-pie", ChartBar],
    ["dollar-sign", DollarSign],
    ["money-bill", DollarSign],
    ["coins", DollarSign],
    ["piggy-bank", DollarSign],
    ["handshake", Users],
    ["bullhorn", Megaphone],
    ["megaphone", Megaphone],
    ["building", Building2],
    ["city", Building2],
    ["store", Building2],
    ["industry", Building2],
  ];
  it.each(cases)('maps "%s" to its lucide component', (name: string, expected: unknown) => {
    expect(faIconToLucide(name)).toBe(expected);
  });

  it("maps science icons", () => {
    expect(faIconToLucide("flask")).toBe(FlaskConical);
    expect(faIconToLucide("vial")).toBe(FlaskConical);
    expect(faIconToLucide("atom")).toBe(Atom);
    expect(faIconToLucide("dna")).toBe(Microscope);
    expect(faIconToLucide("microscope")).toBe(Microscope);
    expect(faIconToLucide("leaf")).toBe(Leaf);
    expect(faIconToLucide("seedling")).toBe(Leaf);
    expect(faIconToLucide("tree")).toBe(Leaf);
    expect(faIconToLucide("cannabis")).toBe(Leaf);
  });

  it("maps technology & engineering icons", () => {
    expect(faIconToLucide("microchip")).toBe(Cpu);
    expect(faIconToLucide("cpu")).toBe(Cpu);
    expect(faIconToLucide("laptop")).toBe(Cpu);
    expect(faIconToLucide("robot")).toBe(Cpu);
    expect(faIconToLucide("laptop-code")).toBe(Code2);
    expect(faIconToLucide("code")).toBe(Code2);
    expect(faIconToLucide("terminal")).toBe(Code2);
    expect(faIconToLucide("cogs")).toBe(Settings);
    expect(faIconToLucide("gear")).toBe(Settings);
    expect(faIconToLucide("hammer")).toBe(Hammer);
    expect(faIconToLucide("hard-hat")).toBe(Hammer);
  });

  it("maps health & medicine icons (several share Stethoscope)", () => {
    expect(faIconToLucide("stethoscope")).toBe(Stethoscope);
    expect(faIconToLucide("heartbeat")).toBe(HeartPulse);
    expect(faIconToLucide("heart")).toBe(HeartPulse);
    expect(faIconToLucide("hospital")).toBe(Stethoscope);
    expect(faIconToLucide("pills")).toBe(Stethoscope);
    expect(faIconToLucide("tooth")).toBe(Stethoscope);
  });

  it("maps law & social science icons", () => {
    expect(faIconToLucide("gavel")).toBe(Gavel);
    expect(faIconToLucide("balance-scale")).toBe(Scale);
    expect(faIconToLucide("scale-balanced")).toBe(Scale);
    expect(faIconToLucide("users")).toBe(Users);
    expect(faIconToLucide("user-tie")).toBe(Users);
    expect(faIconToLucide("user-graduate")).toBe(GraduationCap);
    expect(faIconToLucide("graduation-cap")).toBe(GraduationCap);
    expect(faIconToLucide("shield")).toBe(Shield);
    expect(faIconToLucide("shield-halved")).toBe(Shield);
  });

  it("maps math & statistics icons to Calculator", () => {
    expect(faIconToLucide("calculator")).toBe(Calculator);
    expect(faIconToLucide("square-root-alt")).toBe(Calculator);
    expect(faIconToLucide("infinity")).toBe(Calculator);
    expect(faIconToLucide("function")).toBe(Calculator);
  });

  it("maps travel & logistics icons", () => {
    expect(faIconToLucide("plane")).toBe(Plane);
    expect(faIconToLucide("ship")).toBe(Plane);
    expect(faIconToLucide("truck")).toBe(Truck);
    expect(faIconToLucide("car")).toBe(Truck);
    expect(faIconToLucide("bus")).toBe(Truck);
  });

  it("maps education/academic icons to GraduationCap", () => {
    expect(faIconToLucide("school")).toBe(GraduationCap);
    expect(faIconToLucide("chalkboard-teacher")).toBe(GraduationCap);
    expect(faIconToLucide("chalkboard")).toBe(GraduationCap);
    expect(faIconToLucide("diploma")).toBe(GraduationCap);
  });

  it("returns a callable React component reference for any input", () => {
    // Whether mapped or fallback, the result is always a function/object usable as a component.
    const Mapped = faIconToLucide("palette");
    const Fallback = faIconToLucide("nope");
    expect(Mapped).toBeDefined();
    expect(Fallback).toBe(Layers);
  });
});
