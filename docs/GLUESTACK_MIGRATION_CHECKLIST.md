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
- [x] Divider           ← institution-detail (simple h-px bg-border wrapper)
- [ ] Pressable
- [ ] Text
- [ ] Heading
- [ ] Icon
- [ ] Image
- [x] Spinner

## Inputs & forms
- [x] Button            ← institution-detail (HeroDetailCard, ReviewForm action buttons)
- [x] Input
- [x] Textarea
- [ ] Select
- [x] Checkbox
- [ ] Radio
- [ ] Switch
- [ ] Slider            ← needed for range filters (tuition, duration)
- [x] FormControl       ← institution-detail (custom wrapper; labels, errors, required markers)

## Surfaces & overlays
- [ ] Card
- [x] Badge             ← institution-detail/academic section (small label chip)
- [ ] Avatar
- [x] Actionsheet       ← FilterDrawer, SignInSheet, sort/option pickers, UFBottomSheet equivalent
- [ ] Modal
- [x] AlertDialog       ← confirmAlert helper (never raw Alert.alert)
- [ ] Toast             ← errors / success feedback
- [ ] Accordion         ← accordion filters, FAQ sections
- [ ] Popover / Tooltip
- [ ] Progress          ← progress bars / rating distribution

## Navigation-ish
- [ ] Tabs / SegmentedControl   ← academic tabs, compare Programs/Institutions, profile tabs
- [ ] Skeleton                  ← loading states (compose if not first-class)

## App-specific compositions (built on the above — track here too)
- [x] ScreenContainer
- [x] AppHeader
- [x] EmptyState
- [x] UniversalList    ← find-institutions (generic, reusable for all list screens)
- [x] SelectField       ← single-select Actionsheet-based picker (DRY; reused by filters)
- [x] FilterDrawer      ← find-institutions (multiSelect, singleSelect, accordion)
- [x] FilterTags        ← find-institutions (removable chips)
- [x] SignInSheet
- [ ] FavoriteButton
- [ ] CompareButton
- [x] CompareBar        ← find-institutions (generic for Institution/Program)
- [x] SubNavBar         ← find-institutions (Programs | Institutions | Offerings)
- [ ] ProgramCard
- [x] InstitutionCard   ← updated with ranking badges, rating, fees parity
- [ ] OfferingCard
- [ ] SpecialistCard
- [x] ReviewSection     ← institution-detail (distribution bars, category cards, paginated reviews)
- [x] RatingStars
- [ ] DayTimeSlots
- [x] confirmAlert (helper over AlertDialog)

> Keep this list current. A screen that hand-rolls a primitive instead of adding the Gluestack one is a bug — add it here and use it.
