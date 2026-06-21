/**
 * Route: /(main)/(tabs)/growth-center
 *
 * The Growth Center tab shows the offerings list DIRECTLY (all offerings, no
 * pre-applied filter, no category-tile click required). The filter button
 * provides optional category / field-of-study / price filtering.
 *
 * `asTabRoot` = no back button (bottom-tab root). The old category/field tile
 * hub (GrowthCenterScreen) is no longer the landing — those become optional
 * filters in the filter drawer.
 */
import FindOfferingsScreen from "@/screens/find/FindOfferingsScreen";

export default function GrowthCenterTab() {
  return <FindOfferingsScreen asTabRoot />;
}
