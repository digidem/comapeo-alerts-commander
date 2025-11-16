# CoMapeo Alerts Commander - E2E Testing Analysis

## Executive Summary

**CoMapeo Alerts Commander** is a Progressive Web App for creating and managing geographic alerts with interactive map integration. The application is built with React 18, TypeScript, Vite, and provides a mobile-first interface for field work and remote monitoring.

**Target Users**: Field coordinators and project managers working with CoMapeo ecosystem
**Key Interactions**: Authentication → Map Selection → Project Selection → Alert Creation
**Tech Stack**: React 18 + TypeScript + Vite + Mapbox/MapLibre GL + i18next

---

## 1. CORE USER WORKFLOWS AND USER JOURNEYS

### 1.1 Primary User Journey - "Create Alert Flow"

**Steps:**
```
Login (Auth) → Map Interaction (Select Location) → Project Selection → 
Alert Form Submission → Success Confirmation → Return to Map
```

**Key Checkpoints:**
1. **Authentication Phase**
   - User enters server URL and bearer token
   - Optional "Remember me" checkbox
   - Automatic credential restoration on app reload
   - Transition to map view on successful login

2. **Map Interaction Phase**
   - Map loads (Mapbox or MapLibre fallback)
   - User selects coordinates via:
     - Direct map click
     - Location search (Mapbox Geocoding or Nominatim fallback)
     - Manual coordinate entry
   - Red marker appears at selected location
   - "Continue" button activated

3. **Project Selection Phase**
   - Projects fetched from API
   - User can select single or multiple projects
   - Selected projects displayed
   - Proceeding to alert form

4. **Alert Creation Phase**
   - Pre-populated detection times (current to +1 month)
   - Required fields: Start Time, End Time, Source ID, Alert Name (slug format)
   - Real-time validation (slug format)
   - Batch submission to multiple projects
   - Handles partial failures gracefully

5. **Post-Success Phase**
   - Success notification shown
   - Automatic return to map after 2 seconds
   - Alerts refreshed on map display
   - User can immediately create another alert

### 1.2 Secondary User Journeys

**Logout Flow:**
- User clicks logout button
- Credentials cleared from memory and localStorage
- Return to login screen
- All session state reset

**Project Switching Flow:**
- User clicks project selector dropdown in header
- Switches active project
- Alerts on map reload for new project
- Selection persisted to localStorage

**Map Token Setup Flow (Optional):**
- User without Mapbox token triggers setup
- Can enter token or proceed without it
- Falls back to OpenStreetMap if no token

**Language Switching Flow:**
- User clicks language switcher dropdown
- Selects new language (EN, PT, ES, FR)
- UI instantly updates
- Selection persisted to localStorage

---

## 2. KEY COMPONENTS AND PAGES THAT NEED TESTING

### 2.1 Page-Level Components

| Component | Location | Primary Role | Critical Functions |
|-----------|----------|--------------|---------------------|
| **Index (Main Page)** | `src/pages/Index.tsx` | App orchestrator & router | Manages current step (auth → map → projects → alert) |
| **LoginForm** | `src/components/LoginForm.tsx` | Authentication UI | Credential input, validation, loading states |
| **MapInterface** | `src/components/MapInterface.tsx` | Main interaction hub | Coordinates map, search, projects, alerts |
| **ProjectSelection** | `src/components/ProjectSelection.tsx` | Project multiselect | Fetches/selects projects, handles no-projects state |
| **AlertForm** | `src/components/AlertForm.tsx` | Alert creation | Form validation, batch submission, error handling |

### 2.2 Feature Components

| Component | Purpose | Key Props | State Management |
|-----------|---------|-----------|------------------|
| **MapContainer** | Map DOM container & loading overlay | mapRef, selectedCoords | Map loading state |
| **CoordinateDisplay** | Bottom sheet/floating card with selected coords | coordinates, callbacks | No internal state (controlled) |
| **ManualCoordinateEntry** | Modal for manual lat/lng input | isOpen, coordinates, callback | Internal form state |
| **SearchBar** | Search UI (desktop) or modal (mobile) | searchQuery, recentSearches, callbacks | Search query, results |
| **ProjectSelector** | Dropdown for project selection in header | projects, selectedProject, callback | No internal state |
| **AlertPopup** | Modal displaying alert details from map | alert, onClose | No internal state |
| **MapTokenSetup** | Mapbox token configuration | token, callback | Token input state |
| **LanguageSwitcher** | Language dropdown menu | none (uses i18n context) | Uses i18n state |

### 2.3 Component Testing Priority

**Critical (must test):**
- LoginForm (auth flow)
- MapInterface (main interaction)
- AlertForm (submission)
- ProjectSelection (project selection)

**High Priority:**
- MapContainer (rendering)
- SearchBar (location search)
- CoordinateDisplay (coordinate confirmation)

**Medium Priority:**
- ManualCoordinateEntry (manual input)
- AlertPopup (alert details)
- ProjectSelector (project switching)

**Low Priority:**
- LanguageSwitcher (lang switching)
- MapTokenSetup (optional feature)

---

## 3. API ENDPOINTS AND EXTERNAL DEPENDENCIES

### 3.1 API Service Architecture

**Service Class**: `apiService` (singleton, instantiated in `src/services/apiService.ts`)

### 3.2 API Endpoints

| Method | Endpoint | Purpose | Authentication | Response Format | Errors |
|--------|----------|---------|-----------------|-----------------|--------|
| GET | `/projects` | Fetch available projects | Bearer Token | `{data: []}` or `[]` | 400+ status |
| GET | `/projects/{projectId}/remoteDetectionAlerts` | Fetch alerts for project | Bearer Token | `{data: []}` or `[]` | 400+ status |
| POST | `/projects/{projectId}/remoteDetectionAlerts` | Create new alert | Bearer Token | Success: 200 | 400+ status |

### 3.3 Request/Response Schemas

**Alert Creation Request:**
```json
{
  "detectionDateStart": "2024-11-15T10:00:00Z",
  "detectionDateEnd": "2024-12-15T10:00:00Z",
  "sourceId": "3daada86-2216-4889-b501-bc91ceb13c8f",
  "metadata": {
    "alert_type": "fire-detection"
  },
  "geometry": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  }
}
```

**Project Response:**
```json
{
  "data": [
    {
      "projectId": "proj-123",
      "name": "Project Name",
      "id": "alt-id-format",
      "title": "alt-name-format"
    }
  ]
}
```

**Alert Response:**
```json
{
  "data": [
    {
      "id": "alert-123",
      "geometry": {
        "type": "Point",
        "coordinates": [lng, lat]
      },
      "detectionDateStart": "2024-11-15T10:00:00Z",
      "detectionDateEnd": "2024-12-15T10:00:00Z",
      "sourceId": "uuid",
      "metadata": {
        "alert_type": "fire-detection"
      }
    }
  ]
}
```

### 3.4 External Services

| Service | Purpose | Endpoint | API Type | Fallback |
|---------|---------|----------|----------|----------|
| **CoMapeo Server** | Backend API | Configured by user | REST + Bearer Token | Demo: demo.comapeo.cloud |
| **Mapbox Geocoding** | Location search | api.mapbox.com/geocoding/v5 | REST + Token | Nominatim (OSM) |
| **Nominatim (OSM)** | Free geocoding | nominatim.openstreetmap.org | REST (no auth) | N/A |
| **Mapbox GL JS** | Premium map tiles | mapbox://styles/mapbox/satellite-streets-v12 | Vector tiles + Token | MapLibre GL |
| **OpenStreetMap Tiles** | Free map tiles | tile.openstreetmap.org | Raster tiles | N/A |

### 3.5 API Error Handling

**Service Layer Error Handling:**
- Wraps Axios errors with context
- Distinguishes: HTTP errors (4xx/5xx) vs Network errors vs Parsing errors
- Throws formatted error messages with context
- Status < 500 doesn't throw (validateStatus: (status) => status < 500)

**Component-Level Error Handling:**
- Try/catch blocks with user-facing toast notifications
- Graceful degradation (e.g., show empty projects vs showing error)
- Partial failure handling for batch operations

---

## 4. STATE MANAGEMENT AND DATA FLOW

### 4.1 Application-Level State (Index.tsx)

```
isAuthenticated (boolean)
  ↓
credentials (Credentials | null)
  ├─ serverName
  ├─ bearerToken
  └─ rememberMe
  
currentStep (auth | map | projects | alert)
  
projects (Project[])
  
selectedProjects (string[])
  
coordinates (Coordinates | null)
  ├─ lat
  └─ lng

currentProjectId (string | null)

alertsRefreshKey (number) [trigger for alerts reload]
```

### 4.2 Local Storage Persistence

| Key | Type | Contents | Used By |
|-----|------|----------|---------|
| `mapAlert_credentials` | JSON | {serverName, bearerToken, rememberMe} | Index.tsx, login restoration |
| `selectedProjectId` | string | project ID | MapInterface.tsx, ProjectSelector |
| `coMapeoAlert_language` | string | language code (en/pt/es/fr) | i18n |
| `recentSearches` | JSON | string[] | useMapSearch hook |

### 4.3 Component-Level State

**MapInterface:**
```
selectedCoords (Coordinates | null)
showManualEntry (boolean)
showSearchModal (boolean)
mapboxToken (string)
showTokenInput (boolean)
selectedProject (Project | null)
```

**useMapInteraction Hook:**
```
isMapLoaded (boolean)
mapRef, mapInstanceRef (Map instance)
markerRef (Marker instance)
```

**useMapAlerts Hook:**
```
alerts (MapAlert[])
selectedAlert (MapAlert | null)
isLoadingAlerts (boolean)
alertMarkersRef (Marker[] instances)
```

**useMapSearch Hook:**
```
searchQuery (string)
isSearching (boolean)
recentSearches (string[])
searchInputRef (HTMLInputElement)
```

### 4.4 Data Flow Diagram

```
User Input (Map Click / Search / Manual Entry)
  ↓
[useMapInteraction / useMapSearch / ManualCoordinateEntry]
  ↓
Coordinates Updated → onCoordinatesSet callback
  ↓
Index.tsx: handleCoordinatesSet()
  ↓
currentStep = "projects"
  ↓
ProjectSelection Component (fetch projects if needed)
  ↓
User Selects Projects
  ↓
Index.tsx: handleProjectsSelected()
  ↓
currentStep = "alert"
  ↓
AlertForm Component (prefilled with coords & selected projects)
  ↓
User Submits Form
  ↓
apiService.createAlert() × N (for each project)
  ↓
Success/Partial/Error
  ↓
Index.tsx: handleAlertSuccess()
  ↓
currentStep = "map" + alertsRefreshKey++ + coords cleared
  ↓
MapInterface re-renders → useMapAlerts loads fresh alerts
```

### 4.5 Async Operations Management

**React Query Usage:**
- NOT currently used for API calls (pure async/await pattern)
- Could be beneficial for alerts polling/refetching
- Consider adding for future iterations

**Manual State Synchronization:**
- useEffect dependencies carefully managed to prevent re-renders
- 't' (translation) intentionally excluded from some deps
- selectedCoords only used for initial map center, not as dependency

---

## 5. AUTHENTICATION AND AUTHORIZATION FLOWS

### 5.1 Authentication Mechanism

**Type**: Bearer Token Authentication (HTTP Authorization header)

**Flow:**
```
1. User enters: serverName + bearerToken
2. LoginForm.handleSubmit()
   ├─ Trim inputs
   ├─ Simulate 500ms API validation
   └─ Call onLogin(credentials)
   
3. Index.handleLogin()
   ├─ Set credentials in state
   ├─ Set isAuthenticated = true
   ├─ If rememberMe: persist to localStorage
   ├─ Fetch projects immediately
   └─ Transition to map (currentStep = "map")
   
4. Credential Restoration on Mount
   ├─ Check localStorage for stored credentials
   ├─ If found: restore state + fetch projects
   └─ Skip login screen, go to map
```

### 5.2 Credential Storage & Security

**Storage Options:**
1. **Volatile (Default)**: Lost on page refresh
   - Set rememberMe = false (default)
   
2. **Persistent**: Stored in localStorage
   - Set rememberMe = true
   - Data: `{serverName, bearerToken, rememberMe}`
   - No encryption (user responsible for security)

**Security Considerations:**
- ⚠️ Bearer tokens stored in plain localStorage (accessible to XSS)
- ⚠️ Server URL not validated (could connect to wrong server)
- ✅ HTTPS required for production (no enforced, trust user)
- ✅ Token used in Authorization header (not in URL params)

### 5.3 Authorization Scope

**Implicit Authorization:**
- No role-based access control (RBAC)
- Bearer token grants access to all user's projects
- User can create alerts in any accessible project
- No fine-grained permissions (create/read/delete)

### 5.4 Logout & Session Termination

```javascript
handleLogout() {
  setIsAuthenticated(false)
  setCredentials(null)
  setProjects([])
  setSelectedProjects([])
  setCoordinates(null)
  setCurrentStep("auth")
  localStorage.removeItem("mapAlert_credentials")
  // Toast notification
}
```

**Effect**: Complete session wipe, credentials cleared, back to login screen

### 5.5 API Authentication Header

```typescript
const apiClient = axios.create({
  headers: {
    Authorization: `Bearer ${credentials.bearerToken}`,
    "Content-Type": "application/json"
  }
})
```

**Error Scenarios:**
- Invalid token → API returns 401/403 (caught as error)
- Expired token → API returns 401 (not handled with retry)
- Missing token → Bearer header sent as "Bearer undefined" (API rejects)

---

## 6. MAP INTERACTIONS AND GEOGRAPHIC FEATURES

### 6.1 Map Initialization

**Library Selection Logic:**
```javascript
if (mapboxToken && mapboxToken.trim()) {
  // Use Mapbox GL with premium features
  mapboxgl.accessToken = mapboxToken
  new mapboxgl.Map({
    style: "mapbox://styles/mapbox/satellite-streets-v12",
    center: [lng, lat],
    zoom: 10,
    touchZoomRotate: true,
    touchPitch: true
  })
  map.addControl(new mapboxgl.NavigationControl(), "bottom-right")
} else {
  // Use MapLibre GL with OpenStreetMap fallback
  const osmStyle = { /* raster tiles from OSM */ }
  new maplibregl.Map({
    style: osmStyle,
    center: [lng, lat],
    zoom: 10
  })
}
```

**Important Notes:**
- Map centers on user's last selected coordinates if available
- Default zoom: 2 (world view) or 10 (if coords available)
- Touch controls enabled (zoom, rotate, pitch)
- Dynamically loads Mapbox or MapLibre based on token availability

### 6.2 Coordinate Selection Methods

**Method 1: Direct Map Click**
```
User clicks map
  ↓
handleMapClick() fires (event: MapMouseEvent)
  ↓
Parse lngLat to {lat, lng}
  ↓
onCoordinatesChange(coords)
  ↓
Map flyTo() with animation (center + zoom:14, 1s duration)
  ↓
Toast notification with coords
  ↓
Haptic feedback (navigator.vibrate(50ms))
```

**Method 2: Location Search**
```
User enters search query
  ↓
handleSearch()
  ↓
Call Mapbox Geocoding OR Nominatim API
  ↓
Parse response → {lat, lng}
  ↓
Save to recentSearches (max 3)
  ↓
Update coordinates + marker + map center
  ↓
Toast + haptic feedback
```

**Method 3: Manual Coordinate Entry**
```
User opens bottom sheet
  ↓
Enters latitude + longitude
  ↓
Validation: lat ∈ [-90, 90], lng ∈ [-180, 180]
  ↓
onCoordinatesSet(coords)
  ↓
Update map center (no zoom change)
  ↓
Toast + haptic feedback
```

### 6.3 Markers

**User Selection Marker:**
- Color: Red (#ef4444)
- Created when coordinates selected
- Removed when coordinates cleared
- Updated when coordinates changed

**Alert Markers:**
- Color: Red (#ef4444)
- Size: 24×24px
- Border: 2px white
- Label: Alert name shown above marker
- Clickable: Opens AlertPopup
- Validation: Checks coordinate validity before creation

**Alert Marker Bounds:**
- Auto-fits map to show all alert markers on load
- Uses LngLatBounds with 100px padding
- Max zoom: 12 (prevents over-zooming)

### 6.4 Map Padding & Responsive Layout

**Mobile (Selected Coordinates):**
```javascript
map.easeTo({
  padding: { top: 0, bottom: 250, left: 0, right: 0 },
  duration: 300
})
// 250px padding to account for bottom sheet
```

**Desktop (Selected Coordinates):**
- Floating card positioned on left side
- No map padding adjustment needed

### 6.5 Geographic Data Handling

**Coordinate System**: WGS84 (Standard lat/lng)
```typescript
interface Coordinates {
  lat: number  // -90 to 90
  lng: number  // -180 to 180
}
```

**GeoJSON Conversion** (for API submission):
```javascript
geometry: {
  type: "Point",
  coordinates: [lng, lat]  // Note: GeoJSON uses [lng, lat]!
}
```

⚠️ **Critical**: GeoJSON uses [longitude, latitude] order, but UI uses {lat, lng} object

### 6.6 Geocoding Services

**Mapbox Geocoding:**
- Endpoint: `api.mapbox.com/geocoding/v5/mapbox.places/{query}.json`
- Requires valid token
- Returns: `{features: [{center: [lng, lat]}]}`
- Features: Detailed results, multiple variants

**Nominatim (OSM Fallback):**
- Endpoint: `nominatim.openstreetmap.org/search?q={query}`
- No authentication required
- Returns: `[{lat, lon}]` (note: 'lon' not 'lng')
- Rate limit: 1 request/second
- User-Agent required: "CoMapeoAlertsCommander/1.0"

---

## 7. FORM SUBMISSIONS AND VALIDATION

### 7.1 LoginForm Validation

| Field | Type | Validation | Error Handling |
|-------|------|-----------|-----------------|
| serverName | text | Required, trimmed | Basic required check |
| bearerToken | password | Required, trimmed | Basic required check |
| rememberMe | checkbox | Optional | N/A |

**Validation Rules:**
```javascript
if (!serverName.trim() || !bearerToken.trim()) {
  return; // Disable submit button
}
```

**Submission:**
```javascript
- Trim inputs
- Simulate 500ms API call
- Call onLogin()
- Show loading state during submission
```

### 7.2 ManualCoordinateEntry Validation

| Field | Type | Validation | Error Message |
|-------|------|-----------|----------------|
| latitude | number | Required, -90 to 90 | "Please enter valid coordinates" |
| longitude | number | Required, -180 to 180 | "Please enter valid coordinates" |

**Validation Logic:**
```javascript
const lat = parseFloat(manualLat);
const lng = parseFloat(manualLng);

if (isNaN(lat) || isNaN(lng) || 
    lat < -90 || lat > 90 || 
    lng < -180 || lng > 180) {
  toast.error("Invalid coordinates")
  return
}
```

### 7.3 AlertForm Comprehensive Validation

**Fields:**

| Field | Type | Validation | Format |
|-------|------|-----------|--------|
| detectionDateStart | datetime-local | Required, must be before end | YYYY-MM-DDTHH:mm |
| detectionDateEnd | datetime-local | Required, must be after start | YYYY-MM-DDTHH:mm |
| sourceId | text | Required, any format | UUID (suggested) |
| alertName | text | Required, slug format | lowercase-with-hyphens |

**Slug Validation Regex:**
```javascript
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// ✅ Valid: "fire-detection", "alert-2024"
// ❌ Invalid: "Fire Detection" (spaces), "alert_name" (underscore)
```

**Validation Flow:**
```javascript
handleSubmit() {
  // Step 1: Check all fields filled
  if (!startTime || !endTime || !sourceId || !alertName) {
    toast.error("Please fill in all fields")
    return
  }
  
  // Step 2: Check slug format
  if (!validateSlug(alertName)) {
    toast.error("Alert name must be slug format")
    return
  }
  
  // Step 3: Parse dates
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Step 4: Check date ordering
  if (start >= end) {
    toast.error("End time must be after start time")
    return
  }
  
  // Step 5: Submit
  setSubmissionState("loading")
  
  // Batch submit to all selected projects
  for each projectId {
    try {
      await apiService.createAlert()
      successCount++
    } catch {
      errorCount++
    }
  }
  
  // Step 6: Handle results
  if (successCount === selectedProjects.length) {
    setSubmissionState("success")
    setTimeout(() => onSuccess(), 2000)
  } else if (successCount > 0) {
    setSubmissionState("partial")
  } else {
    setSubmissionState("error")
  }
}
```

### 7.4 ProjectSelection Validation

**Constraint**: At least one project must be selected
```javascript
handleContinue() {
  if (selectedProjects.length === 0) {
    toast.error("Please select at least one project")
    return
  }
  onProjectsSelected(selectedProjects)
}
```

### 7.5 Form State Management

**AlertForm Submission States:**
```typescript
type SubmissionState = "idle" | "loading" | "success" | "error" | "partial";
```

**State Transitions:**
```
idle
  ↓ (user clicks submit)
loading → success (all succeed) → auto-navigate after 2s
       → partial (some succeed) → show error msg
       → error (all fail) → show error msg
       
(In error/partial, "Try Again" button resets to idle)
```

**Button Behavior by State:**
- `idle`: Enabled, shows "Submit Alert to N Project(s)"
- `loading`: Disabled, shows spinner + "Creating alerts..."
- `success`: Disabled, shows checkmark + "Alert created successfully"
- `error`/`partial`: Disabled with destructive style
  - Destructive variant button
  - "Try Again" button below to reset state

### 7.6 Real-Time Feedback

**Slug Format Validation:**
```javascript
// Real-time visual feedback as user types
{alertName && !validateSlug(alertName) && (
  <p className="text-sm text-red-600">
    Invalid format. Use lowercase letters, numbers, and hyphens only
  </p>
)}
```

---

## 8. INTERNATIONALIZATION (i18n) FEATURES

### 8.1 Supported Languages

| Code | Language | Locale |
|------|----------|--------|
| en | English | Default/Fallback |
| pt | Português (Portuguese) | Brazil |
| es | Español (Spanish) | Spain |
| fr | Français (French) | France |

### 8.2 i18n Configuration

**Library**: react-i18next with i18next

**Initialization** (src/i18n/index.ts):
```javascript
i18n.use(initReactI18next).init({
  resources: { en, pt, es, fr },
  lng: localStorage.getItem("coMapeoAlert_language") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
})

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("coMapeoAlert_language", lng)
})
```

**Key Points:**
- Language persisted to localStorage
- Fallback to English if saved language not available
- On language change, app re-renders with new strings
- No page reload needed for language switch

### 8.3 Translation Keys Structure

**Root Categories:**
```json
{
  "app": { "title", "mapAlertSystem" },
  "auth": { "title", "subtitle", "serverName", ... },
  "map": { "searchPlaceholder", "searchTip", "locationSelected", ... },
  "mapbox": { "title", "token", "tokenPlaceholder", ... },
  "manualCoords": { "title", "latitude", "longitude", ... },
  "projects": { "title", "subtitle", "foundProjects", ... },
  "alert": { "title", "subtitle", "location", "sourceId", ... },
  "alertPopup": { "title", "alertName", "project", ... },
  "common": { "install", "and", "more", "cancel" },
  "language": { "switchLanguage", "english" }
}
```

### 8.4 Translation Files

| File | Strings | Status |
|------|---------|--------|
| `en.json` | ~130 keys | Source (maintained manually) |
| `pt.json` | ~130 keys | Generated via AI translator |
| `es.json` | ~130 keys | Generated via AI translator |
| `fr.json` | ~130 keys | Generated via AI translator |

### 8.5 LanguageSwitcher Component

**Usage:**
```typescript
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" }
]

const handleChange = (lang) => {
  i18n.changeLanguage(lang)  // Async operation
}
```

**UI**: Dropdown menu in header, displays current language

### 8.6 Dynamic Content with Interpolation

**Examples:**

1. **Singular/Plural**:
```json
"alert.submitAlert": "Submit Alert to {{count}} Project{{plural}}"
```
```javascript
t("alert.submitAlert", {
  count: selectedProjects.length,
  plural: selectedProjects.length !== 1 ? "s" : ""
})
// Result: "Submit Alert to 3 Projects" or "Submit Alert to 1 Project"
```

2. **Coordinates**:
```json
"map.locationSelected": "Location selected: {{lat}}, {{lng}}"
```
```javascript
t("map.locationSelected", {
  lat: coords.lat.toString(),
  lng: coords.lng.toString()
})
```

3. **Multiple Variables**:
```json
"alert.partialMessage": "Created alert for {{successCount}} project{{successPlural}}, failed for {{errorCount}}"
```

### 8.7 Translation Pipeline

**Automated Translation Script:**
```bash
npm run translate:all
```

**Process**:
- Uses `ai-markdown-translator`
- Reads source: `en.json`
- Outputs to: `pt.json`, `es.json`, `fr.json`
- Uses GPT-4 (specified in npm scripts)
- Includes retry logic (3 attempts, 5s delay)
- Creates log files for auditing

**Limitation**: Only updates language JSONs, doesn't validate against source keys

### 8.8 Missing Translation Fallback

**Behavior**:
```javascript
// If key missing in current language, falls back to English
i18n.init({
  fallbackLng: "en",
  ns: "translation"
})
```

**Example**:
- French translation missing "map.newFeature"
- Falls back to English: `en.json.map.newFeature`

### 8.9 Testing Considerations for i18n

**Critical Tests:**
1. ✅ Language persistence (localStorage)
2. ✅ Language switch triggers UI update
3. ✅ All keys exist in all languages (prevent missing translations)
4. ✅ Interpolation works ({{variable}} replaced correctly)
5. ✅ Plural forms handled correctly
6. ✅ Language dropdown shows correct current language

**Edge Cases:**
- Missing language file (falls back to English)
- Corrupt translation key → shows key name (e.g., "alert.missingKey")
- Language set to unsupported code → defaults to English
- localStorage corrupted → defaults to English

---

## CRITICAL PATHS & FAILURE POINTS

### Failure Points by Severity

**CRITICAL (Blocks User):**
1. CoMapeo API unreachable → Can't fetch projects
   - Mitigation: Graceful error, show message, allow retry
2. Invalid bearer token → 401/403 response
   - Mitigation: Show error toast, ask user to re-enter
3. No projects available → Can't proceed past project selection
   - Mitigation: Show "No Projects" screen with logout button
4. Map library fails to load → Can't use app
   - Mitigation: Show error message, suggest clearing cache

**HIGH (Degrades Experience):**
1. Mapbox token invalid/expired → Falls back to OSM
   - User impact: No satellite imagery, slower tiles
2. Geocoding API rate limited → Search fails temporarily
   - User impact: Must wait or use manual entry
3. Network latency → Slow alert submission
   - User impact: Long loading time, potential timeout

**MEDIUM (Informational):**
1. Partial alert submission → Some projects fail
   - Mitigation: Show partial state, user can retry
2. Project re-fetch fails → Uses stale projects list
   - Mitigation: Show warning, suggest reconnecting
3. Language file missing → Falls back to English
   - Mitigation: Graceful fallback, no user action needed

---

## TESTING STRATEGY RECOMMENDATIONS

### End-to-End Test Scenarios

**Smoke Tests:**
1. App loads successfully
2. Login screen visible
3. Can authenticate with valid credentials
4. Map loads after authentication
5. Can select coordinates on map
6. Can submit alert to single project
7. Can logout

**Critical Path Tests:**
1. Complete alert creation flow (auth → map → projects → alert → success)
2. Multi-project alert submission
3. Partial failure handling
4. Project switching
5. Language switching persistence

**Edge Cases:**
1. Expired/invalid token
2. No projects available
3. No Mapbox token (OSM fallback)
4. Slow network (timeouts)
5. Missing coordinates validation
6. Slug format validation

**Mobile-Specific:**
1. Bottom sheet interactions
2. Haptic feedback triggers
3. Touch map interactions
4. Mobile viewport sizing
5. Safe area padding (notch handling)

### Test Data Requirements

**Mock CoMapeo Server Needed:**
- Valid bearer token endpoint
- Projects endpoint returning sample data
- Alert creation endpoint (success and error scenarios)

**Test Scenarios:**
- User with 1 project
- User with multiple projects (>10)
- User with no projects
- User with read-only projects
- Invalid token rejection
- Network timeout simulation

---

## SUMMARY TABLES

### Component Dependency Tree
```
Index.tsx (Main Orchestrator)
├── LoginForm.tsx
├── MapInterface.tsx (On auth)
│   ├── MapContainer.tsx
│   ├── SearchBar.tsx / Bottom Sheet (mobile)
│   ├── CoordinateDisplay.tsx
│   ├── ManualCoordinateEntry.tsx
│   ├── AlertPopup.tsx
│   ├── ProjectSelector.tsx
│   ├── LanguageSwitcher.tsx
│   ├── useMapInteraction hook
│   ├── useMapAlerts hook
│   ├── useMapSearch hook
│   └── usePWAInstall hook
├── ProjectSelection.tsx (After coords selected)
│   └── [calls apiService.fetchProjects]
└── AlertForm.tsx (After projects selected)
    └── [calls apiService.createAlert]
```

### API Call Matrix
```
Function           | Endpoint                      | Condition         | Success | Failure
fetchProjects()    | GET /projects                | After login       | Projects shown | Toast error
createAlert()      | POST /projects/{id}/alerts   | Submit form       | Toast success  | Try again
fetchAlerts()      | GET /projects/{id}/alerts    | Map loads         | Show markers   | Warn + empty
```

### State Persistence Map
```
State                    | Storage      | Restore On         | Clear On
Credentials              | localStorage | App mount          | Logout
Language                 | localStorage | App mount          | Manual change
Selected project ID      | localStorage | MapInterface mount  | Project deleted
Recent searches          | localStorage | Map search load    | Manual clear
```

---

## APPENDIX: Key File References

**Core Application:**
- `src/App.tsx` - App wrapper, routing, providers
- `src/pages/Index.tsx` - Main orchestrator, step management
- `src/services/apiService.ts` - API client, request/response handling
- `src/types/common.ts` - Type definitions

**Components (By Feature):**
- Authentication: `LoginForm.tsx`, `MapTokenSetup.tsx`
- Map: `MapInterface.tsx`, `MapContainer.tsx`, `SearchBar.tsx`
- Coordinates: `CoordinateDisplay.tsx`, `ManualCoordinateEntry.tsx`
- Projects: `ProjectSelection.tsx`, `ProjectSelector.tsx`
- Alerts: `AlertForm.tsx`, `AlertPopup.tsx`
- UI: `LanguageSwitcher.tsx`, various UI components in `ui/`

**Hooks:**
- `useMapInteraction.ts` - Map initialization, click handling
- `useMapAlerts.ts` - Alert markers, fetching, display
- `useMapSearch.ts` - Geocoding, search state
- `usePWAInstall.ts` - PWA installation prompt
- `use-mobile.tsx` - Responsive design hook

**Configuration:**
- `vite.config.ts` - Build config, dev proxy
- `.env.example` - Environment variables
- `src/i18n/` - Translation files and setup
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker

