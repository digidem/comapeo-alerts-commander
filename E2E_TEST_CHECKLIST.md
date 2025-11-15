# CoMapeo Alerts Commander - E2E Testing Checklist

Quick reference for critical test scenarios and acceptance criteria.

## Test Environment Setup

- [ ] Mock CoMapeo API server with test endpoints
- [ ] Valid bearer token for testing
- [ ] Invalid bearer token for error testing
- [ ] Multiple test projects (1, 3, 10+)
- [ ] Network simulation tools (slow/offline modes)
- [ ] Mapbox token (optional, for satellite imagery testing)

---

## SMOKE TESTS (Baseline)

### 1. App Initialization
- [ ] App loads without errors
- [ ] No console errors on load
- [ ] UI visible and responsive

### 2. Login Screen
- [ ] Login form displays all fields (serverName, bearerToken, rememberMe)
- [ ] Required fields validated (submit disabled when empty)
- [ ] Loading state shows during submission
- [ ] Success message appears on valid credentials

### 3. Map Display
- [ ] Map renders after login
- [ ] Map controls visible (zoom, navigation)
- [ ] Navbar displays with language switcher and logout
- [ ] Instruction text visible ("Tap to select")

---

## CRITICAL PATH TESTS

### Test Scenario 1: Complete Alert Creation Flow

**Setup:**
- User: Valid credentials
- Projects: 2 projects available
- Location: Known coordinates (London: 51.5074, -0.1278)

**Steps:**
1. [ ] Login with valid server URL and bearer token
2. [ ] Click on map to select location (51.5074, -0.1278)
3. [ ] Verify marker appears and coordinates display
4. [ ] Click "Continue" button
5. [ ] Verify ProjectSelection screen loads
6. [ ] Verify both projects appear in list
7. [ ] Select 1st project
8. [ ] Click "Continue to Alert Form"
9. [ ] Verify AlertForm loads with:
   - [ ] Coordinates displayed
   - [ ] Detection times pre-filled (current → +1 month)
10. [ ] Fill in alert details:
    - [ ] Source ID: valid UUID
    - [ ] Alert Name: "fire-detection" (slug format)
11. [ ] Click "Submit Alert to 1 Project"
12. [ ] Verify loading state shows
13. [ ] Verify success notification appears
14. [ ] Verify auto-return to map after 2s
15. [ ] Verify coordinates cleared from map

**Expected Result:** Alert created successfully, user returned to map

---

### Test Scenario 2: Multi-Project Alert Submission

**Setup:**
- User: Valid credentials
- Projects: 3 projects available

**Steps:**
1. [ ] Complete steps 1-7 from Scenario 1
2. [ ] Select all 3 projects (checkboxes)
3. [ ] Verify selected count shows "Selected 3 projects"
4. [ ] Click "Continue to Alert Form (3 selected)"
5. [ ] Verify AlertForm shows correct project count
6. [ ] Submit with valid data
7. [ ] Verify success message: "Successfully created alert for 3 projects"

**Expected Result:** Single alert created across all 3 projects

---

### Test Scenario 3: Partial Failure Handling

**Setup:**
- User: Valid credentials
- Projects: 3 projects available
- Server: Configured to fail for 2nd project

**Steps:**
1. [ ] Select all 3 projects
2. [ ] Submit alert form
3. [ ] Verify partial state shows (not all succeed)
4. [ ] Verify error message: "Created alert for X project, failed for Y"
5. [ ] Click "Try Again" button
6. [ ] Verify submission state resets to idle
7. [ ] Form still contains previous data

**Expected Result:** Partial failure handled gracefully, user can retry

---

### Test Scenario 4: Form Validation

**Alert Name (Slug Format)**
- [ ] ✅ Valid: "fire-detection"
- [ ] ✅ Valid: "alert-2024-forest"
- [ ] ❌ Invalid: "Fire Detection" (spaces) → red border + error message
- [ ] ❌ Invalid: "alert_name" (underscore) → red border + error message
- [ ] ❌ Invalid: "ALERT" (uppercase) → red border + error message

**Date Range**
- [ ] Submit disabled if start date >= end date
- [ ] Error message: "End time must be after start time"
- [ ] Default: start=now, end=now+1month (handle month-end edge case)

**Required Fields**
- [ ] All fields required before submit
- [ ] Submit button disabled if any field empty
- [ ] Error toast: "Please fill in all fields"

---

### Test Scenario 5: Coordinate Selection Methods

#### Method A: Direct Map Click
- [ ] Click anywhere on map
- [ ] Red marker appears
- [ ] Coordinates display (lat, lng)
- [ ] Map animates to location (zoom: 14, duration: 1s)
- [ ] Toast notification: "Location selected: {{lat}}, {{lng}}"
- [ ] Haptic feedback on mobile

#### Method B: Location Search
- [ ] Enter "London" in search bar
- [ ] Click "Go" or press Enter
- [ ] Verify Mapbox (if token) OR Nominatim (if no token) used
- [ ] Map centers on result
- [ ] Marker placed at result location
- [ ] Toast: "Found London: {{lat}}, {{lng}}"
- [ ] "London" saved to recent searches

#### Method C: Manual Coordinate Entry
- [ ] Click manual entry button
- [ ] Bottom sheet opens
- [ ] Enter latitude: 51.5074
- [ ] Enter longitude: -0.1278
- [ ] Click "Set Coordinates"
- [ ] Marker updates on map
- [ ] Bottom sheet closes
- [ ] Validation for bounds: lat ∈ [-90, 90], lng ∈ [-180, 180]

---

### Test Scenario 6: Authentication & Session Management

#### Login with Remember Me
- [ ] Check "Remember me"
- [ ] Login with valid credentials
- [ ] Refresh page (Ctrl+R)
- [ ] Verify credentials auto-restored
- [ ] No login screen shown (goes straight to map)
- [ ] Projects list still available

#### Login without Remember Me
- [ ] Uncheck "Remember me" (default)
- [ ] Login
- [ ] Refresh page
- [ ] Verify back at login screen
- [ ] Credentials NOT in localStorage

#### Logout
- [ ] Click logout button
- [ ] Verify:
  - [ ] Credentials cleared from memory
  - [ ] `mapAlert_credentials` removed from localStorage
  - [ ] Projects list cleared
  - [ ] Back at login screen
- [ ] Toast notification: "Logged out successfully"

#### Invalid Token
- [ ] Login with invalid/expired token
- [ ] Server returns 401/403
- [ ] Error toast appears: "Failed to fetch projects"
- [ ] Projects list not shown

---

### Test Scenario 7: Project Management

#### Project Switching
- [ ] User logged in with 3 projects
- [ ] Click project dropdown in header
- [ ] Verify all 3 projects listed
- [ ] Click different project
- [ ] Verify alerts reload for new project
- [ ] Verify selection persisted (refresh page, still selected)

#### No Projects Available
- [ ] User has zero projects
- [ ] Show "No Projects Available" screen
- [ ] Provide "Back to Map" button
- [ ] Provide "Logout" button
- [ ] Cannot proceed to alert creation

---

### Test Scenario 8: Language Switching

**English → Portuguese**
- [ ] Click language dropdown
- [ ] Select "Português"
- [ ] Verify all UI updates to Portuguese (no reload)
- [ ] Verify "coMapeoAlert_language" = "pt" in localStorage
- [ ] Refresh page, still in Portuguese
- [ ] Language selector shows "Português" selected

**Interpolation in Different Languages**
- [ ] Submit alert for 3 projects (English)
- [ ] Verify: "Submit Alert to 3 Projects"
- [ ] Change to Portuguese
- [ ] Verify Portuguese equivalent shows
- [ ] All dynamic text ({{count}}, {{query}}) translated

**Missing Translation Fallback**
- [ ] Set language to unsupported: localStorage.setItem("coMapeoAlert_language", "ja")
- [ ] Refresh page
- [ ] Verify falls back to English
- [ ] App still functional

---

### Test Scenario 9: Mobile-Specific Features

#### Bottom Sheets
- [ ] Coordinate display on mobile = bottom sheet (not floating card)
- [ ] Manual entry = bottom sheet
- [ ] Search = bottom sheet (button in header triggers)
- [ ] Sheet can be closed by swiping down

#### Haptic Feedback
- [ ] Map click → vibrate 50ms
- [ ] Coordinate selection → vibrate 50ms
- [ ] Alert submission success → vibrate [50, 100, 50]ms
- [ ] Manual coordinates set → vibrate 100ms

#### Responsive Layout
- [ ] Extra small screen (320px): All buttons have min-h-[44px]
- [ ] Touch targets > 44×44px for accessibility
- [ ] Text doesn't overflow on small screens
- [ ] Navbar shrinks on mobile (logo hidden, text hidden on buttons)

#### Safe Area Padding (Notch Handling)
- [ ] iPhone with notch: Navbar padding top accounts for safe-area-inset
- [ ] Bottom sheet: Uses safe-area-inset-bottom padding
- [ ] Map instruction text: Positioned with safe-area offset

---

### Test Scenario 10: Error Recovery

#### Network Error During Alert Submission
- [ ] Simulate network offline
- [ ] Submit alert form
- [ ] Verify error toast: "Failed to create alert"
- [ ] Submission state = "error"
- [ ] Form data preserved
- [ ] "Try Again" button available

#### API Timeout
- [ ] Simulate slow network (>30s delay)
- [ ] Submit alert
- [ ] Verify timeout error
- [ ] No infinite loading state

#### Partial Project Failure
- [ ] Submit to 3 projects, 2 succeed, 1 fails
- [ ] Submission state = "partial"
- [ ] Error message shows: "Created alert for 2 projects, failed for 1"
- [ ] "Try Again" button resets form
- [ ] Can resubmit to retry failed projects

---

## EDGE CASES & BOUNDARY TESTS

### Coordinate Boundaries
- [ ] Latitude: -90 (South Pole)
- [ ] Latitude: 90 (North Pole)
- [ ] Latitude: 0 (Equator)
- [ ] Longitude: -180 (International Date Line)
- [ ] Longitude: 180 (International Date Line)
- [ ] Longitude: 0 (Prime Meridian)
- [ ] Invalid: lat = 91 (rejected)
- [ ] Invalid: lng = 181 (rejected)

### Time Range
- [ ] Start time = current time (should allow)
- [ ] End time = start time + 1 minute (minimum duration)
- [ ] End time = start time + 1 year (maximum duration)
- [ ] End time < start time (rejected)
- [ ] Different timezones (browser default used)

### Alert Name (Slug Format)
- [ ] Max length: 255 chars (no validation limit specified)
- [ ] Min length: 1 char
- [ ] Only lowercase a-z, 0-9, hyphens
- [ ] Cannot start/end with hyphen

### Search Results
- [ ] Mapbox: Returns 1 result (limit=1)
- [ ] Nominatim: Returns 1 result (limit=1)
- [ ] No results found → Toast: "Location not found"
- [ ] Rate limit hit → "Search failed"

### Large Project Lists
- [ ] 1 project (minimum)
- [ ] 50+ projects (scroll list, select multiple)
- [ ] Verify no performance degradation
- [ ] Verify all checkboxes selectable

### Recent Searches
- [ ] Store max 3 recent searches
- [ ] Oldest search removed when 4th added
- [ ] Clear search clears input
- [ ] Click recent search auto-triggers search

---

## PERFORMANCE & LOAD TESTS

### Map Rendering
- [ ] Map loads in <3s on good connection
- [ ] Pan/zoom responsive (no lag)
- [ ] 50+ alert markers render without freezing

### API Calls
- [ ] `/projects` call completes in <5s
- [ ] `/alerts` call completes in <5s
- [ ] Batch alert creation (3 projects) completes in <10s

### Bundle Size
- [ ] Initial load: <500KB (without maps)
- [ ] Map libraries load on demand (lazy loaded)

---

## ACCESSIBILITY TESTS

- [ ] All buttons have min-h-[44px] (touch-friendly)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Labels associated with form inputs
- [ ] Color contrast meets WCAG AA standard
- [ ] Aria labels on icon-only buttons
- [ ] Form error messages announced to screen readers

---

## SECURITY TESTS

- [ ] Credentials NOT logged to console
- [ ] Token NOT visible in Network tab URLs
- [ ] Bearer token in Authorization header (not query param)
- [ ] HTTPS enforced in production (warn if not)
- [ ] No plaintext secrets in console warnings
- [ ] localStorage cleared on logout

---

## PWA FEATURES (Optional)

- [ ] Install button visible when installable
- [ ] App installs successfully
- [ ] Service worker registered
- [ ] Offline caching works
- [ ] Manifest.json properly configured
- [ ] Icons display in app
- [ ] App shortcuts available

---

## BROWSER COMPATIBILITY

Test on:
- [ ] Chrome/Edge (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android 10+)

---

## REGRESSION TEST SUITE

**After any code changes, verify:**
1. [ ] Full alert creation flow works
2. [ ] No new console errors
3. [ ] Existing translations still work
4. [ ] Responsive layout intact
5. [ ] No broken API calls
6. [ ] Form validation still enforced

---

## SIGN-OFF CRITERIA

E2E tests pass when:
- [x] All smoke tests pass
- [x] All critical path tests pass
- [x] All validation tests pass
- [x] Mobile features work correctly
- [x] No critical errors in console
- [x] Performance acceptable (<5s page loads)
- [x] Accessibility baseline met

