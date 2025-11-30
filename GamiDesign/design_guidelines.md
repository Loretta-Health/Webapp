# Loretta Gamified Health Dashboard - Design Guidelines

## Design Philosophy
**Reference-Based Approach**: Duolingo's playful gamification + health-specific adaptations
- Maximum screen utilization with immersive interfaces
- Instant visual feedback for all interactions
- Celebration-first design with progressive disclosure through unlocks

---

## Visual System

### Color Palette
**Primary**: Lime green `#58CC02`, Electric purple `#CE82FF`, Sky blue `#1CB0F6`, Sunset orange `#FF9600`  
**Accents**: Gold `#FFC800` (rewards), Red `#FF4B4B` (lives), Soft pink `#FFE5E5` (warnings)  
**Backgrounds**: Gradient overlays (purple-to-blue, green-to-teal), no flat white  
**Surfaces**: Frosted glass cards with colored borders + matching vibrant shadows

### Typography
**Primary**: "Nunito" (Google Fonts) - rounded, friendly  
- Hero numbers: 900 weight, 4xl-6xl (XP/scores/levels)
- Headlines: 800 weight, 2xl-4xl  
- Body: 600-700 weight, base-lg  

**Monospace**: "DM Mono" for stats/timers (500 weight, xl-2xl)

**Hierarchy**:
- Levels: Bold, all-caps, gradient effects
- Missions: Semi-bold, title-case
- Body: Regular, line-height 1.6
- Hints: Smaller, playful italic

### Spacing & Layout
**Spacing**: Tailwind units - 2, 4, 6, 8, 12, 16  
**Grid**: 
- Persistent side panel (280px) + masonry card grid (2-3 cols desktop, 1 mobile)
- Cards have varying heights by importance

**Z-Index**: Background → Content cards → Floating actions → Modals → Animated mascot

---

## Core Components

### Side Panel (Always Visible)
```
- Animated health mascot (top)
- User avatar with circular XP ring
- Level display + next level preview
- Streak counter (flame icon, large number)
- Lives indicator (5 hearts)
- Quick stats: Today's XP, missions completed
```

### Top Bar (60px)
Treasure chest (shake animation) | Energy bar (gradient fill) | Settings | Leaderboard

### Risk Score Card (Hero)
```jsx
<Card className="rounded-3xl p-8 bg-gradient-to-br from-[score-color] shadow-[color]">
  <CircularProgress diameter="280px" animated />
  <CenterText className="text-6xl font-black">{score}/100</CenterText>
  <MascotPeek corner="bottom-right" speech="Great progress!" />
  <FloatingIcons items={['heart', 'shield', 'star']} />
</Card>
```

### Daily Check-In Card
```jsx
<Card className="relative">
  <PulseButton size="large" glow>Start</PulseButton>
  <Badge position="top-right">🔥 {streakDays} Day Streak</Badge>
  <XPPreview>+50 XP</XPPreview>
  <Mascot pose="clipboard" />
  <Progress label={`Day ${dayNumber} of your journey`} />
</Card>
```

### Quest Board
```jsx
<QuestCard 
  checkbox // transforms to checkmark with animation
  progressBar // with % and XP reward
  category="daily|weekly|bonus"
  onComplete={() => confettiBurst()}
  legendary={isLegendary} // golden border
/>
// Completion: confetti + coin flip + sparkle trail
```

### Medications Tracker
```jsx
<PillButton 
  animated // checkmark + success sound
  streak={14} // "14-day perfect streak!"
  reminder // time-based gentle shake
/>
<Mascot pose="medicine-bottle" />
```

### Activity Dashboard (4 Quadrants)
Steps | Sleep | Heart Rate | Calories  
- Circular progress per metric
- Icon-based visuals
- Comparative: "12% more than yesterday!" ⬆️
- Mini-celebrations on goal completion (sparkles)

### Modals

**Level-Up** (Full-screen):
```jsx
<Modal fullscreen gradient animate>
  <LevelNumber burst size="hero">{newLevel}</LevelNumber>
  <Rewards reveal>
    <Badge /><BonusXP /><UnlockedFeatures />
  </Rewards>
  <Mascot animation="celebrate" />
  <Confetti duration={2000} particles={50} />
</Modal>
```

**Achievement** (Slide-in, 3s auto-dismiss):
```jsx
<Toast slideFrom="right" rarity="common|rare|epic|legendary">
  <BadgeIcon /><ProgressBar />
  <SoundIndicator />
</Toast>
```

---

## Interactive Elements

### Buttons
```css
/* Primary */
.btn-primary {
  @apply rounded-full bg-gradient-to-r text-white;
  box-shadow: 0 4px 12px rgba(color, 0.4);
  transition: transform 200ms, box-shadow 200ms;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(color, 0.5);
}
.btn-primary:active {
  transform: scale(0.98);
}

/* Secondary */
.btn-secondary {
  @apply rounded-full border-2 bg-transparent;
}
```

### Progress Bars
```jsx
<ProgressBar 
  rounded="full" 
  height={12} // or 20 for prominent
  gradient="left-to-right"
  percentageLabel // floats above center
  particleTrail
/>
```

### Cards
```css
.card {
  @apply rounded-3xl p-6 border-2;
  box-shadow: 0 8px 24px rgba(accent-color, 0.3);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(accent-color, 0.4);
}
```

### Icons
- **UI**: Heroicons (outline, 24px inline, 48px headers, 96px empty states)
- **Activities**: Custom illustrated (water drop, shoe, pill, heart)
- **Animations**: Bounce on load, pulse for notifications

---

## Gamification Elements

### XP System
```jsx
<FloatingXP animate="+50" /> // number roll on increment
<XPProgressBar showMilestones={[25, 50, 75]} alwaysVisible />
```

### Treasure Chest
```jsx
<Chest 
  shake={every30s} 
  onOpen={() => revealRewards()} // dramatic animation
  rewards={['XP', 'Avatars', 'Badges', 'Tips']}
/>
```

### Leaderboard
```jsx
<Leaderboard tabs={['weekly', 'monthly', 'allTime']}>
  <Rank position={userRank} special={top3Styling} />
  <Friend avatar xp />
  <PositionChange animated slide />
</Leaderboard>
```

### Achievement Gallery
```jsx
<Grid cols={3-4}>
  <Badge 
    locked // show as silhouette with "???"
    unlocked // glow + unlock date
    progress // for partial completion
    category="daily|milestones|social|health"
  />
</Grid>
```

---

## Animation Specifications

### Micro-interactions
```css
/* Button press */
.btn:active { transform: scale(0.98); transition: 100ms; }

/* Card hover */
.card:hover { transform: translateY(-4px); transition: 200ms ease-out; }

/* Checkmark */
.checkbox-complete { animation: drawCheck 300ms; }

/* Number roll */
.counter { animation: rollNumber 400ms; }
```

### Celebrations
```jsx
// Confetti: 2s, 50+ particles, rainbow
<Confetti duration={2000} particleCount={50} />

// Sparkles: Trail cursor on special elements
<SparkleTrail />

// Glow: 1s infinite on active quests
<Glow pulse duration={1000} infinite />

// Mascot: 500ms pose changes
<Mascot transitionTime={500} />
```

### Transitions
- Page load: Stagger cards (100ms delay each)
- Modal entry: Scale 0.9→1.0 + fade (300ms)
- Tab switch: Slide (250ms)
- Progress: Linear, matches action completion time

---

## Mascot Character

**Design**: Health-themed friendly character (heart/energetic animal)

**Placements**: Side panel header | Risk card corner | Empty states | Celebration modals | Medication reminders

**Expressions**: Neutral/Happy (default) | Celebrating (arms up, confetti) | Encouraging (thumbs up) | Concerned (streak warnings) | Sleeping (off-hours)

**Interactions**: Clickable for tips | Reacts to scroll | Celebrates achievements | Shows emotion based on risk score

---

## Responsive Breakpoints

**Desktop (1280px+)**: Side panel (280px) | 3-col grid | Centered modals (600px max)

**Tablet (768-1279px)**: Icon-only panel (80px) | 2-col grid | Tap to expand overlay

**Mobile (<768px)**: Bottom nav bar | Single col | Mascot as header icon | Full-screen modals | Swipe gestures

---

## Accessibility Requirements

- All interactive elements: min 44×44px touch target
- Color contrast: WCAG AA minimum (4.5:1 text, 3:1 UI)
- Animations: Respect `prefers-reduced-motion`
- Focus indicators: 2px solid outline with accent color
- Screen reader: Proper ARIA labels on all gamification elements
- Keyboard navigation: Full support, logical tab order

---

**Implementation Priority**: Start with core dashboard cards → Add gamification layer → Implement celebrations → Polish animations