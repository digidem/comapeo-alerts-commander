# Visual Regression Tests

These tests ensure visual consistency across different browsers, viewports, and UI states.

## What They Test

- **login.visual.spec.ts**: Login page across different viewports and states
- **components.visual.spec.ts**: Individual UI components (buttons, inputs, checkboxes, cards)
- **responsive.visual.spec.ts**: Responsive design across 8+ viewport sizes
- **cross-browser.visual.spec.ts**: Browser-specific rendering differences

## How Visual Tests Work

Playwright takes screenshots and compares them against baseline snapshots stored in:
```
tests/e2e/visual/*.spec.ts-snapshots/
```

Each browser maintains its own baselines because rendering differs slightly between Chromium, Firefox, and WebKit.

## Running Visual Tests

### In CI (GitHub Actions)
Visual tests run automatically in the `visual-regression` job after E2E tests complete.

### Locally (Not Recommended)
Due to browser stability issues in the local environment, all tests are skipped locally. Visual tests should be run in CI.

## Updating Baselines

When UI changes are intentional and visual tests fail:

### Option 1: Update via CI
1. Push your changes to trigger the workflow
2. Visual tests will fail
3. Download the `visual-test-results-{browser}` artifacts from GitHub Actions
4. Extract the `-actual.png` files
5. Move them to `tests/e2e/visual/*.spec.ts-snapshots/` replacing the old baselines
6. Commit and push the updated snapshots

### Option 2: Use Workflow Dispatch with Update Flag
(Future enhancement - currently not implemented)

## Understanding Test Failures

When visual tests fail, GitHub Actions uploads:

1. **visual-regression-diffs-{browser}**: Diff images showing what changed
2. **visual-regression-actual-{browser}**: New screenshots that don't match baselines
3. **visual-test-results-{browser}**: Full test results

Compare these to determine if changes are:
- ✅ **Expected**: Update baselines
- ❌ **Unexpected**: Fix the CSS/styling bug

## Best Practices

1. **Review diffs carefully** - Small pixel differences can indicate real bugs
2. **Test across all browsers** - What looks good in Chrome might break in Firefox
3. **Update baselines sparingly** - Only when UI changes are intentional
4. **Keep snapshots in git** - They're the source of truth for visual consistency
5. **Test responsive design** - Different viewports can reveal layout issues

## Snapshot Storage

Baseline snapshots are stored in git because:
- They're the source of truth for visual consistency
- Changes to UI are tracked in version control
- No external storage service needed
- Easy to review in PRs

## Troubleshooting

**Q: All visual tests failing with "no baseline found"**
A: This is expected on first run. Generate baselines by downloading actual screenshots from CI and committing them.

**Q: Tests pass in one browser but fail in another**
A: Expected - each browser renders differently. Each browser has its own baseline snapshots.

**Q: Small pixel differences causing failures**
A: Adjust the `threshold` option in `toHaveScreenshot()` calls if needed, but be conservative - small differences can indicate real issues.

**Q: Can I run visual tests locally?**
A: Not recommended due to browser stability issues. Use CI instead.
