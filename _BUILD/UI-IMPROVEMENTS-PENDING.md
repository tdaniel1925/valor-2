# UI Improvements - Pending Tasks

**Date:** April 12, 2026
**Status:** In Progress

---

## 🎯 Tasks to Complete

### 1. **Collapsible Sidebar** (In Progress)
**Status:** 50% Complete

**What's Done:**
- ✅ Added `sidebarCollapsed` state to AppLayout
- ✅ Modified desktop sidebar width to be dynamic (64px collapsed, 256px expanded)
- ✅ Updated logo section to adapt to collapsed state
- ✅ Added localStorage persistence for collapsed state
- ✅ Created toggle function

**What's Left:**
- ⬜ Update `renderNavItem` function to show only icons when collapsed
- ⬜ Add tooltip/hover popups for collapsed nav items
- ⬜ Add toggle button to sidebar (hamburger/arrow icon)
- ⬜ Update all navigation sections to hide labels when collapsed
- ⬜ Test responsive behavior

---

### 2. **IntelliSheets Layout Fix**
**Issue:** Horizontal scrolling due to category menu on left side

**Solution:** Move category selection to top horizontal tabs instead of left sidebar

**Changes Needed:**
- Update `app/intellisheets/page.tsx`
- Change grid layout from `lg:grid-cols-4` to single column
- Create horizontal tab navigation for categories
- Make table fully responsive without horizontal scroll

---

### 3. **XRAE Integration Page**
**Issue:** XRAE button currently on iPipeline integrations page

**Solution:** Create dedicated XRAE Integration page

**Changes Needed:**
- Create `app/integrations/xrae/page.tsx`
- Move XRAE integration code from iPipeline page
- Update sidebar to link to new XRAE page
- Keep iPipeline page for iPipeline-specific integrations only

---

### 4. **Catalog PDF Links**
**Issue:**
- "View" button shows dead page
- "Download" button doesn't open/download file

**Root Cause:** PDF paths likely incorrect or files need proper serving

**Solution:**
- Check PDF file paths in `/public/catalog/`
- Update view/download handlers
- Ensure PDFs are accessible
- Add proper MIME types for PDF serving

---

## 📋 Implementation Order

1. **First:** Complete collapsible sidebar (highest impact, affects entire app)
2. **Second:** Fix catalog PDFs (blocking user functionality)
3. **Third:** Create XRAE Integration page (organizational improvement)
4. **Fourth:** Fix IntelliSheets layout (UX improvement)

---

## 🔧 Technical Notes

### Collapsible Sidebar Implementation

**Collapsed State (w-16):**
- Show only icons
- Hide all text labels
- Hide section headers
- Add tooltips on hover
- Collapse button shows expand arrow

**Expanded State (w-64):**
- Show icons + labels
- Show section headers
- Show dropdown indicators
- Collapse button shows collapse arrow

**Toggle Button Location:**
- Bottom of sidebar (floating)
- Or top right of sidebar header

---

## Next Steps

1. Complete sidebar collapse functionality
2. Test all nav items in collapsed state
3. Fix catalog PDF serving
4. Create XRAE page
5. Redesign IntelliSheets layout
6. Test all changes
7. Commit and deploy

---

*Last Updated: April 12, 2026 - 8:10 PM*
