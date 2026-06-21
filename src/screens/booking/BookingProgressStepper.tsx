/**
 * BookingProgressStepper — 4-step progress indicator.
 * Steps: Requested → Pending → Scheduled → Completed
 *
 * Each step has: icon, label, state (completed | current | upcoming).
 * Completed steps show solid teal fill + connecting line.
 * Current step shows teal border (hollow).
 * Upcoming steps show grey border.
 *
 * RTL note: ConnectorLine is a flex sibling (flex:1, height:2) so it naturally
 * mirrors in RTL — no position:absolute left/right hard-coding.
 */

import { View } from "react-native";
import {
  Send,
  Circle,
  CalendarDays,
  CheckCircle,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useColors } from "@/hooks/useColors";

export type StepState = "completed" | "current" | "upcoming";

export interface BookingStep {
  /** Internal key — do NOT display directly; use i18n label from buildSteps. */
  key: string;
  label: string;
  state: StepState;
}

const STEP_ICONS = [Send, Circle, CalendarDays, CheckCircle];

function StepCircle({ state, IconComp }: { state: StepState; IconComp: typeof Send }) {
  const colors = useColors();
  const bg =
    state === "completed"
      ? colors.secondary
      : state === "current"
      ? colors.background
      : colors.muted;
  const borderColor =
    state === "completed" || state === "current"
      ? colors.secondary
      : colors.border;
  const iconColor =
    state === "completed"
      ? colors.onOverlay
      : state === "current"
      ? colors.secondary
      : colors.mutedForeground;

  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: bg,
        borderWidth: 2,
        borderColor,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
      }}
    >
      <IconComp size={18} color={iconColor} />
    </View>
  );
}

/**
 * ConnectorLine — a flex sibling that expands to fill space between step nodes.
 * Using flex:1 (not position:absolute) means it naturally mirrors in RTL.
 */
function ConnectorLine({ completed }: { completed: boolean }) {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        height: 2,
        backgroundColor: completed ? colors.secondary : colors.border,
        alignSelf: "center",
        marginTop: -22, // pull up to vertically align with circle centres
        zIndex: 1,
      }}
    />
  );
}

export function BookingProgressStepper({ steps }: { steps: BookingStep[] }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {steps.map((step, idx) => {
        const IconComp = STEP_ICONS[idx] ?? CheckCircle;
        const isLast = idx === steps.length - 1;
        const lineCompleted = step.state === "completed";

        return (
          <View
            key={step.key}
            style={{ flex: 1, flexDirection: "column", alignItems: "center" }}
          >
            {/* Row: circle + connector (connector is a flex sibling not absolute) */}
            <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
              {/* Spacer before the circle so the circle stays centred in its column */}
              <View style={{ flex: 1 }} />
              <StepCircle state={step.state} IconComp={IconComp} />
              {/* Connector after the circle — expands to fill space toward next step */}
              {!isLast ? (
                <ConnectorLine completed={lineCompleted} />
              ) : (
                <View style={{ flex: 1 }} />
              )}
            </View>

            <Text
              style={{
                marginTop: 6,
                fontSize: 11,
                textAlign: "center",
                color:
                  step.state === "upcoming"
                    ? colors.mutedForeground
                    : colors.foreground,
                fontWeight: step.state === "current" ? "700" : "500",
              }}
              numberOfLines={2}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Build steps array from a booking status string. Uses i18n labels. */
export function buildSteps(status: string, t: (key: string) => string): BookingStep[] {
  const STEP_KEYS = ["requested", "pending", "scheduled", "completed"] as const;
  const normalised = status.toLowerCase();
  const currentIdx = STEP_KEYS.indexOf(normalised as typeof STEP_KEYS[number]);

  return STEP_KEYS.map((key, idx) => ({
    key,
    label: t(`bookingStep.${key}`),
    state:
      idx < currentIdx
        ? "completed"
        : idx === currentIdx
        ? "current"
        : "upcoming",
  }));
}
