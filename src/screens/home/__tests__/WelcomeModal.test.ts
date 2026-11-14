/**
 * WelcomeModal — issue #10: with payments off, the welcome dialog must not
 * advertise Whish (store review rejects a payment method the app lacks).
 */
import { welcomeBullets } from "@/screens/home/WelcomeModal";

const WHISH = "welcome_popup.whish_integration";
const keys = (on: boolean) => welcomeBullets(on).map((b) => b.textKey);

describe("welcomeBullets", () => {
  it("hides the Whish bullet when payments are off", () => {
    expect(keys(false)).not.toContain(WHISH);
    expect(keys(false)).toHaveLength(3);
  });

  it("shows the Whish bullet when payments are on", () => {
    expect(keys(true)).toContain(WHISH);
    expect(keys(true)).toHaveLength(4);
  });

  it("follows EXPO_PUBLIC_PAYMENTS_ENABLED by default (off in tests)", () => {
    expect(welcomeBullets().map((b) => b.textKey)).not.toContain(WHISH);
  });
});
