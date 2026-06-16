# Gluestack UI — component install / conversion checklist

`unifind-mobile` uses **Gluestack UI v2** as its only UI library. Add a component with:

```bash
npx gluestack-ui add <component>
```

Tick a box when the component has been added to `src/components/ui/` and verified (renders, themed in light + dark, RTL-safe). When you build a screen that needs an unchecked component, add it and tick it as part of the task.

## Primitives & layout
- [ ] Box
- [ ] HStack
- [ ] VStack
- [ ] Center
- [ ] Divider
- [ ] Pressable
- [ ] Text
- [ ] Heading
- [ ] Icon
- [ ] Image
- [x] Spinner

## Inputs & forms
- [ ] Button
- [x] Input
- [ ] Textarea
- [ ] Select
- [ ] Checkbox
- [ ] Radio
- [ ] Switch
- [ ] Slider            ← needed for range filters (tuition, duration)
- [ ] FormControl       ← labels, errors, required markers

## Surfaces & overlays
- [ ] Card
- [ ] Badge
- [ ] Avatar
- [x] Actionsheet       ← FilterDrawer, SignInSheet, sort/option pickers, UFBottomSheet equivalent
- [ ] Modal
- [ ] AlertDialog       ← confirmAlert helper (never raw Alert.alert)
- [ ] Toast             ← errors / success feedback
- [ ] Accordion         ← accordion filters, FAQ sections
- [ ] Popover / Tooltip
- [ ] Progress          ← progress bars / rating distribution

## Navigation-ish
- [ ] Tabs / SegmentedControl   ← academic tabs, compare Programs/Institutions, profile tabs
- [ ] Skeleton                  ← loading states (compose if not first-class)

## App-specific compositions (built on the above — track here too)
- [ ] ScreenContainer
- [ ] AppHeader
- [ ] EmptyState
- [ ] UniversalList
- [x] SelectField       ← single-select Actionsheet-based picker (DRY; reused by filters)
- [ ] FilterDrawer
- [ ] FilterTags
- [ ] SignInSheet
- [ ] FavoriteButton
- [ ] CompareButton
- [ ] CompareBar
- [ ] ProgramCard
- [ ] InstitutionCard
- [ ] OfferingCard
- [ ] SpecialistCard
- [ ] ReviewSection
- [ ] RatingStars
- [ ] DayTimeSlots
- [ ] confirmAlert (helper over AlertDialog)

> Keep this list current. A screen that hand-rolls a primitive instead of adding the Gluestack one is a bug — add it here and use it.
