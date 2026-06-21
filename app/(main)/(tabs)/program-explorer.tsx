/**
 * Route: /(main)/(tabs)/program-explorer
 *
 * The Program Explorer tab shows the program list DIRECTLY (all programs, no
 * pre-applied filter, no tile-click required). The SubNavBar pill switches
 * between Programs / Institutions / Offerings, and the filter button provides
 * optional field / degree / location / tuition filtering.
 *
 * `asTabRoot` = no back button (this is a bottom-tab root). The old tile hub
 * (ProgramExplorerHubScreen) is no longer the landing — its field/degree tiles
 * are now optional filters inside the filter drawer.
 */
import FindScreen from "@/screens/find/FindScreen";

export default function ProgramExplorerTab() {
  return <FindScreen asTabRoot />;
}
