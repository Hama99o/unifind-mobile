/**
 * faIconToLucide — maps FontAwesome icon names (used in Strapi) to lucide-react-native
 * component references.
 *
 * Only the icons that appear in Strapi fields/degrees data are mapped.
 * Any unknown name falls back to the `Layers` icon.
 *
 * Usage:
 *   const Icon = faIconToLucide(fieldOfStudy.icon);
 *   <Icon size={20} color={...} />
 */

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
  Landmark,
  Scale,
  Leaf,
  Music,
  Wrench,
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
  type LucideIcon,
} from "lucide-react-native";

// Map FA icon name → lucide component
const FA_MAP: Record<string, LucideIcon> = {
  // Arts & Humanities
  "palette":          Palette,
  "paint-brush":      PenTool,
  "paint-roller":     PenTool,
  "pen-nib":          PenTool,
  "pen":              PenTool,
  "camera":           Camera,
  "film":             Camera,
  "music":            Music,
  "theater-masks":    Drama,
  "masks-theater":    Drama,
  "drama":            Drama,
  "book":             BookOpen,
  "book-open":        BookOpen,
  "books":            BookOpen,
  "language":         Globe,
  "globe":            Globe,
  "globe-americas":   Globe,
  "cross":            Church,
  "church":           Church,
  "praying-hands":    Church,

  // Business & Economics
  "briefcase":        Briefcase,
  "chart-bar":        ChartBar,
  "chart-line":       ChartBar,
  "chart-pie":        ChartBar,
  "dollar-sign":      DollarSign,
  "money-bill":       DollarSign,
  "money-bill-wave":  DollarSign,
  "coins":            DollarSign,
  "piggy-bank":       DollarSign,
  "handshake":        Users,
  "bullhorn":         Megaphone,
  "ad":               Megaphone,
  "megaphone":        Megaphone,
  "building":         Building2,
  "city":             Building2,
  "store":            Building2,
  "industry":         Building2,
  "landmark":         Landmark,

  // Science & Research
  "flask":            FlaskConical,
  "vial":             FlaskConical,
  "atom":             Atom,
  "dna":              Microscope,
  "microscope":       Microscope,
  "bacteria":         Microscope,
  "leaf":             Leaf,
  "seedling":         Leaf,
  "tree":             Leaf,
  "cannabis":         Leaf,

  // Technology & Engineering
  "microchip":        Cpu,
  "cpu":              Cpu,
  "laptop":           Cpu,
  "laptop-code":      Code2,
  "code":             Code2,
  "code-branch":      Code2,
  "terminal":         Code2,
  "robot":            Cpu,
  "cogs":             Settings,
  "cog":              Settings,
  "gear":             Settings,
  "tools":            Wrench,
  "wrench":           Wrench,
  "hammer":           Hammer,
  "hard-hat":         Hammer,

  // Health & Medicine
  "stethoscope":      Stethoscope,
  "heartbeat":        HeartPulse,
  "heart":            HeartPulse,
  "hospital":         Stethoscope,
  "hospital-alt":     Stethoscope,
  "pills":            Stethoscope,
  "syringe":          Stethoscope,
  "tooth":            Stethoscope,
  "eye":              Stethoscope,

  // Law & Social Sciences
  "gavel":            Gavel,
  "balance-scale":    Scale,
  "scale-balanced":   Scale,
  "users":            Users,
  "user-tie":         Users,
  "user-graduate":    GraduationCap,
  "graduation-cap":   GraduationCap,
  "shield":           Shield,
  "shield-alt":       Shield,
  "shield-halved":    Shield,

  // Math & Statistics
  "calculator":       Calculator,
  "square-root-alt":  Calculator,
  "infinity":         Calculator,
  "function":         Calculator,

  // Travel & Logistics
  "plane":            Plane,
  "ship":             Plane,
  "truck":            Truck,
  "car":              Truck,
  "bus":              Truck,

  // Education & Academic
  "school":           GraduationCap,
  "chalkboard-teacher": GraduationCap,
  "chalkboard":       GraduationCap,
  "diploma":          GraduationCap,

  // Fallback
  "layer-group":      Layers,
  "layers":           Layers,
};

/**
 * Returns a lucide icon component for the given FA icon name.
 * Falls back to `Layers` for any unmapped name.
 */
export function faIconToLucide(faName?: string | null): LucideIcon {
  if (!faName) return Layers;
  // Strip "fa-" prefix if present
  const name = faName.replace(/^fa-/, "").toLowerCase();
  return FA_MAP[name] ?? Layers;
}
