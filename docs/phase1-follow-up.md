# Phase 1 Follow-up: Resolved Issues and Phase 2 Preparation

This document captures issues identified after Phase 1 completion and tracks their resolution status.

## Resolved Issues

### Issue 1: Geocoding Error Mocks Not Overriding Default Handlers (RESOLVED)

**Problem:**
The `setupGeocodingErrorMock` function in `tests/fixtures/mockRoutes.ts` registered new route handlers after `setupDefaultMocks` had already installed success handlers for the same patterns (`**/geocoding/**` and `**/nominatim.openstreetmap.org/**`).

Since Playwright evaluates routes in the order they were added (first wins), the success handlers always won and fulfilled requests before the error handlers could respond. This meant that calling `setupGeocodingErrorMock(page)` in tests still returned success (200) responses instead of the expected error (503) responses.

**Affected Tests:**
- `tests/e2e/alerts/create-alert.spec.ts` - Error Handling suite
  - `should handle search errors gracefully`
  - `should handle map loading errors`

**Resolution:**
Updated all error mock functions in `tests/fixtures/mockRoutes.ts` to call `page.unroute()` before adding new error handlers:
- `setupNetworkErrorMock`
- `setupServerErrorMock`
- `setupInvalidCredentialsMock`
- `setupGeocodingErrorMock`
- `setupAlertCreationErrorMock`

Each function now properly removes the default success handlers before registering error handlers, ensuring the error routes take precedence.

**Files Modified:**
- `tests/fixtures/mockRoutes.ts` (lines 128-260)

---

## Documentation Updates Needed

### Issue 2: SKIPPED_TESTS_ROADMAP References Outdated MSW Approach

**Problem:**
The `docs/SKIPPED_TESTS_ROADMAP.md` documentation (lines 141-220) still describes the original MSW (Mock Service Worker) Node.js approach that was proposed but not implemented. The actual Phase 1 implementation uses Playwright's native `page.route()` API instead.

**Sections to Update:**
- Step 1.1: Mentions `npm install -D msw@latest` (not needed)
- Step 1.2-1.4: Shows MSW-specific code with `rest`, `setupServer`, etc.
- References to `msw/node` and `rest` imports

**Resolution Status:** Pending - Will be updated in this PR

---

## Phase 2 Readiness Checklist

### Infrastructure Ready
- [x] API mocking infrastructure complete
- [x] Authentication tests passing (9/9)
- [x] Mock validation tests passing (2/2)
- [x] Error mock functions properly override defaults
- [x] Alert mocks match real API GeoJSON format

### Phase 2 Requirements (Map Component Stabilization)
- [ ] Add `data-map-loaded` attribute for reliable map load detection
- [ ] Add `data-testid` attributes to map markers
- [ ] Create test-specific map configuration (simplified styles, no animations)
- [ ] Update MapPage test helpers with reliable wait strategies
- [ ] Enable Alert Creation Flow tests (4 tests)
- [ ] Enable Map Interactions tests (2 tests)
- [ ] Enable Error Handling tests (2 tests)
- [ ] Enable Logout tests (2 tests)

### Tests to Enable in Phase 2

**File:** `tests/e2e/alerts/create-alert.spec.ts`
1. `Alert Creation Flow` suite (4 tests)
   - `should create alert for single project`
   - `should create alert via location search`
   - `should validate form before enabling continue`
   - `should persist map state after language change`

2. `Map Interactions` suite (2 tests)
   - `should show instruction text when no location selected`
   - `should clear previous marker when selecting new location`

3. `Error Handling` suite (2 tests)
   - `should handle search errors gracefully`
   - `should handle map loading errors`

**File:** `tests/e2e/auth/login.spec.ts`
4. `Logout` suite (2 tests)
   - `should logout and return to login page`
   - `should clear localStorage on logout`

**Total Phase 2 Target:** 10 tests

---

## Timeline

- **Phase 1 Completed:** 2025-11-18
- **Phase 1 Follow-up:** 2025-11-19 (This PR)
- **Phase 2 Target:** TBD

---

## References

- [SKIPPED_TESTS_ROADMAP.md](./SKIPPED_TESTS_ROADMAP.md) - Main roadmap document
- [tests/fixtures/mockRoutes.ts](../tests/fixtures/mockRoutes.ts) - Mock route handlers
- [tests/e2e/alerts/create-alert.spec.ts](../tests/e2e/alerts/create-alert.spec.ts) - Alert creation tests
