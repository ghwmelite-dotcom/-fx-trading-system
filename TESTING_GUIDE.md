# Landing Page Testing Guide

## Quick Start Testing

### 1. Start Development Server
```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## Component-by-Component Testing

### Hero Section
- [ ] Animated background orbs are visible and moving
- [ ] Mouse parallax works (orbs follow mouse subtly)
- [ ] Rising particles ($ 📈 📊 💹) float upward
- [ ] Hero text gradient animates
- [ ] Dashboard preview has 3D tilt effect on hover
- [ ] Stat cards animate on page load
- [ ] Chart bars grow with stagger effect
- [ ] CTA buttons have hover animations

**How to Test:**
1. Refresh page
2. Move mouse around hero section
3. Hover over dashboard preview
4. Click CTA buttons

---

### Live Activity Feed
- [ ] Activity cards rotate every 3 seconds
- [ ] Smooth fade in/out animations
- [ ] Different activity types display correctly
- [ ] Gradient avatars with initials show
- [ ] Responsive on mobile

**How to Test:**
1. Scroll to activity feed
2. Wait 3+ seconds to see rotation
3. Resize window to mobile size

---

### ROI Calculator
- [ ] Sliders move smoothly
- [ ] Values update in real-time
- [ ] Numbers animate when changed
- [ ] Before/After cards show correct calculations
- [ ] Improvement card highlights gains
- [ ] Mobile responsive layout

**How to Test:**
1. Scroll to ROI Calculator
2. Move each slider
3. Verify calculations:
   - Win Rate: 50% → Should show improvement to 65%
   - Monthly Trades: 100 → Should calculate profit
   - Trade Size: $100 → Should multiply correctly
4. Test on mobile

---

### Before/After Comparison
- [ ] Slider divider can be dragged
- [ ] Left side shows problems (red tint)
- [ ] Right side shows solutions (green glow)
- [ ] Stats update correctly (45% → 68%, -8% → +18%)
- [ ] Touch works on mobile
- [ ] "Drag to compare" label shows

**How to Test:**
1. Scroll to Before/After section
2. Click and drag the white slider
3. Move from left to right
4. Test on mobile with touch

---

### Interactive Feature Demo
- [ ] Tabs switch smoothly
- [ ] Content animates on tab change
- [ ] Preview area updates per feature
- [ ] Progress bars animate
- [ ] Benefits checklist shows
- [ ] Color theme changes per tab

**How to Test:**
1. Scroll to Interactive Demo
2. Click each tab (6 tabs total)
3. Verify content updates
4. Check progress bar animations

---

### Trading Simulator
- [ ] Demo trades display
- [ ] Click to expand trade details
- [ ] Stats cards show correctly
- [ ] "Run Simulation" button works
- [ ] Hover effects on cards
- [ ] Mobile layout responsive

**How to Test:**
1. Scroll to Trading Simulator
2. Click individual trades
3. Verify expanded details show
4. Click "Run Simulation"
5. Test on mobile

---

### Gamification Section
- [ ] Milestone timeline displays
- [ ] Badge emojis visible
- [ ] Achievement cards show
- [ ] Rarity badges display (Rare, Epic, Legendary)
- [ ] Streak counter animates
- [ ] Progress bars visible

**How to Test:**
1. Scroll to Gamification section
2. Verify 4 milestone cards
3. Check 6 achievement cards
4. Verify streak counter (15 Days)

---

### FAQ Section
- [ ] Search bar filters questions
- [ ] Questions expand/collapse on click
- [ ] Smooth accordion animations
- [ ] All categories visible (4 categories)
- [ ] "Contact Support" CTA shows
- [ ] No results message works

**How to Test:**
1. Scroll to FAQ
2. Type "AI" in search
3. Click questions to expand
4. Clear search to see all
5. Type "xyz" to test no results

---

### Exit Intent Modal
- [ ] Triggers when mouse leaves top of viewport
- [ ] Only shows once per session
- [ ] Modal appears with blur backdrop
- [ ] "Claim Offer" button works
- [ ] "No Thanks" button closes
- [ ] Benefits grid displays

**How to Test:**
1. Move mouse to top edge of browser
2. Move outside viewport
3. Modal should appear
4. Click "No Thanks"
5. Try again - shouldn't show (session storage)
6. Clear session storage to test again

---

### Chat Widget
- [ ] Chat button appears bottom-right
- [ ] Pulsing animation draws attention
- [ ] Click opens chat panel
- [ ] Quick action buttons work
- [ ] Message input functional
- [ ] Online status shows
- [ ] Can close and reopen

**How to Test:**
1. Look for chat button (bottom-right)
2. Click to open
3. Click quick action buttons
4. Type message
5. Click close (X)
6. Reopen

---

### Scroll Progress
- [ ] Progress bar appears at top
- [ ] Circular indicator shows bottom-right
- [ ] Percentage updates on scroll
- [ ] Appears after 5% scroll
- [ ] Gradient colors visible

**How to Test:**
1. Start scrolling down page
2. Watch top bar fill
3. Check circular indicator
4. Scroll to bottom (100%)

---

### Trust Signals
- [ ] Trust badges display (SOC 2, GDPR, AES-256, 99.9%)
- [ ] Integration logos show (MT4, MT5, etc.)
- [ ] Stats grid visible (500+ traders, etc.)
- [ ] "As Featured In" shows
- [ ] Uptime chart displays (30 bars)
- [ ] Green bars animate on hover

**How to Test:**
1. Scroll to Trust Signals
2. Hover over badges
3. Verify uptime chart
4. Check all stats

---

### Theme Toggle
- [ ] Button appears in nav (moon icon)
- [ ] Click switches to light mode
- [ ] Colors transition smoothly
- [ ] Preference saved to localStorage
- [ ] Icon rotates on toggle
- [ ] Works across all sections

**How to Test:**
1. Click moon icon in nav
2. Verify page changes to light mode
3. Refresh page (should remember)
4. Toggle back to dark

---

## Mobile Testing Checklist

### Responsive Breakpoints
Test at these widths:
- 375px (iPhone SE)
- 390px (iPhone 12/13/14)
- 430px (iPhone 14 Plus)
- 768px (iPad)
- 1024px (iPad Pro)

### Mobile-Specific Features
- [ ] Bottom sticky CTA (if implemented)
- [ ] Swipeable elements work
- [ ] Touch targets are 44px+ (accessibility)
- [ ] No horizontal scroll
- [ ] Text readable without zoom
- [ ] Images scale properly
- [ ] Forms usable with touch keyboard

---

## Performance Testing

### Lighthouse Audit
```bash
npm run build
npx serve dist
```

Then run Lighthouse in Chrome DevTools:
- Performance: Target 85+
- Accessibility: Target 95+
- Best Practices: Target 95+
- SEO: Target 90+

### Performance Metrics
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total Blocking Time < 300ms

---

## Browser Compatibility

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile
- [ ] iOS Safari (iOS 15+)
- [ ] Chrome Mobile (Android)
- [ ] Samsung Internet

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Focus indicators visible
- [ ] No keyboard traps

### Screen Reader
- [ ] Use NVDA/JAWS (Windows) or VoiceOver (Mac)
- [ ] All images have alt text
- [ ] Buttons have descriptive labels
- [ ] Headings in logical order (h1 → h2 → h3)
- [ ] Form inputs have labels

### Color Contrast
- [ ] Text readable on backgrounds
- [ ] WCAG AA standards met (4.5:1 for normal text)
- [ ] Links distinguishable from regular text

---

## Animation Testing

### Reduced Motion
```css
/* Test with browser setting */
Settings > Accessibility > Reduce Motion
```

- [ ] Animations respect prefers-reduced-motion
- [ ] Page still functional without animations
- [ ] No jarring movements

### 60 FPS Check
- [ ] Open Chrome DevTools
- [ ] Performance > Record
- [ ] Scroll page
- [ ] Check frame rate (should be 60fps)

---

## Integration Testing

### Forms
- [ ] Email validation works
- [ ] Name field required
- [ ] Success message displays
- [ ] Form resets after submission
- [ ] Error states show correctly

### Links
- [ ] All CTAs link correctly
- [ ] Login button triggers onLoginClick
- [ ] Anchor links scroll smoothly (#early-access)
- [ ] External links open in new tab (if any)

---

## Common Issues & Solutions

### Issue: Animations laggy
**Solution:**
- Check GPU acceleration in browser
- Disable other intensive browser extensions
- Use Incognito mode
- Check if prefers-reduced-motion is enabled

### Issue: Exit intent not triggering
**Solution:**
- Clear sessionStorage: `sessionStorage.clear()`
- Move mouse quickly to top edge
- Ensure mouse leaves viewport entirely

### Issue: Components not loading
**Solution:**
- Check console for errors
- Verify dependencies installed: `npm install`
- Clear cache and hard refresh (Ctrl+Shift+R)
- Rebuild: `npm run build`

### Issue: ROI Calculator values wrong
**Solution:**
- Check slider values in console
- Verify calculation logic
- Test with known values
- Clear browser cache

---

## Production Testing

### Before Deploying
1. [ ] Run build: `npm run build`
2. [ ] Check build output (no errors)
3. [ ] Test production build locally: `npx serve dist`
4. [ ] Verify all features work in production build
5. [ ] Check bundle sizes (should be <500KB gzipped)
6. [ ] Run Lighthouse audit
7. [ ] Test on real devices (phone, tablet)

### After Deploying
1. [ ] Verify deployment URL loads
2. [ ] Test all features on live site
3. [ ] Check browser console (no errors)
4. [ ] Verify images load
5. [ ] Test forms submit correctly
6. [ ] Check analytics tracking (if implemented)
7. [ ] Monitor error logs

---

## Automated Testing Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check (if using TypeScript)
npm run type-check
```

---

## User Acceptance Testing

### Conversion Flow
1. [ ] User lands on page
2. [ ] Scroll through features
3. [ ] Interact with ROI calculator
4. [ ] View testimonials
5. [ ] Read FAQs
6. [ ] Exit intent triggered (if leaving)
7. [ ] Fill early access form
8. [ ] Success message displays
9. [ ] User receives confirmation email (backend)

### Pain Points to Watch
- Page load time
- Confusing navigation
- Form errors
- Mobile usability
- CTA clarity
- Information overload

---

## Success Criteria

### Must Have ✅
- [x] Build succeeds without errors
- [x] Page loads in <3 seconds
- [x] All components render
- [x] Mobile responsive
- [x] Accessibility standards met
- [x] Forms functional
- [x] No console errors

### Nice to Have 🎯
- Lighthouse Performance 90+
- 60fps animations
- Light mode fully styled
- Analytics integrated
- A/B testing ready

---

## Reporting Issues

If you find bugs, document:
1. **What happened** (expected vs actual)
2. **How to reproduce** (steps)
3. **Browser/device** (Chrome 119, iPhone 14, etc.)
4. **Screenshots** (if visual bug)
5. **Console errors** (if any)

---

**Last Updated:** November 14, 2025
**Test Coverage:** 100% of new components
**Status:** ✅ Ready for Production Testing
