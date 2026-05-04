# Graph Report - /Users/antoninmarcon/Documents/Projects/RB CAPSO  (2026-05-04)

## Corpus Check
- 2 files · ~167,517 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 9 nodes · 12 edges · 3 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]

## God Nodes (most connected - your core abstractions)
1. `init()` - 4 edges
2. `syncFromSupabase()` - 3 edges
3. `overrideSubmitBooking()` - 3 edges
4. `loadSupabaseSDK()` - 2 edges
5. `mapStatus()` - 2 edges
6. `sendNotificationEmail()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `init()` --calls--> `overrideSubmitBooking()`  [EXTRACTED]
  /Users/antoninmarcon/Documents/Projects/RB CAPSO/web/booking-bridge.js → /Users/antoninmarcon/Documents/Projects/RB CAPSO/web/booking-bridge.js  _Bridges community 0 → community 1_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.7
Nodes (4): init(), loadSupabaseSDK(), mapStatus(), syncFromSupabase()

### Community 1 - "Community 1"
Cohesion: 1.0
Nodes (2): overrideSubmitBooking(), sendNotificationEmail()

### Community 2 - "Community 2"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 1`** (2 nodes): `overrideSubmitBooking()`, `sendNotificationEmail()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 2`** (2 nodes): `esc()`, `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `init()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `overrideSubmitBooking()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._