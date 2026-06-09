# BusSphere — Real-time Features Analysis

---

## 2.0 New Requirements for BusSphere

To enhance BusSphere's bus-booking platform, three new real-time functionalities are proposed to improve user experience and operational efficiency: **real-time messaging**, **real-time seat availability tracking**, and **real-time schedule & ETA updates**. All three features are powered by Supabase Realtime's Postgres Changes mechanism, which broadcasts database row-level events (INSERT, UPDATE, DELETE) to subscribed browser clients over WebSocket channels.

---

## 2.1 Real-time Messaging

This feature addresses the fundamental communication gap that exists in current bus-booking systems. The proposed real-time messaging interface enables instantaneous bidirectional communication between passengers (clients) and bus operators through an integrated chat system within the BusSphere application.

It works by processing client text inputs and presenting them directly on the operator's interface, while operator responses are immediately transmitted back to clients. This creates a seamless communication channel that eliminates the need for external communication methods such as phone calls or third-party messaging apps. The system also maintains message continuity by checking for existing conversation threads tied to a specific booking. If no thread exists, the system automatically initializes one by resolving the client and operator identities from the booking record. All message history data is stored persistently in the `chat_messages` table for future reference.

The feature enhances the application by reducing boarding confusion, enabling real-time coordination for schedule changes or platform clarifications, and building trust through transparent communication. It solves the problem of communication delays that often result in missed buses, passenger anxiety, and operator frustration during peak operational periods, ultimately improving service reliability and user satisfaction.

### Figure 2.1 — Functional Flow Diagram: Real-time Messaging

![Functional flow diagram showing bidirectional message flow between operator and client through the chat thread database, with message history persistence](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/chat_flow_diagram_1779755621896.png)

---

## 2.2 Real-time Seat Availability Tracking

This feature addresses the critical problem of stale seat availability information in bus-booking platforms. The proposed real-time seat availability tracker provides passengers with a live, continuously-updated view of seat occupancy for any given bus schedule, eliminating the frustration of selecting a seat only to find it has already been booked by another user.

It works by subscribing to two database tables simultaneously. The primary data source is the `schedule_metrics` table, which holds pre-aggregated seat counts (total, booked, locked, available). As a fault-tolerant fallback, the system also subscribes to the raw `seats` table — when individual seat status changes are detected, it recalculates the aggregate metrics client-side by filtering and counting each seat's status (available, booked, locked). This dual-subscription approach ensures data accuracy even when the metrics table has not yet been updated by backend triggers.

The feature renders a visual progress bar showing occupancy percentage, alongside numeric counts of available versus occupied seats. It is displayed on both the search results page (in compact mode) and the seat selection page (in full mode), giving passengers real-time visibility into seat availability before and during the booking process. This reduces double-booking conflicts, improves booking conversion rates, and creates a sense of urgency that drives faster decision-making.

### Figure 2.2 — Functional Flow Diagram: Real-time Seat Availability Tracking

![Functional flow diagram showing seat status change events being detected, metrics recalculated from two table sources, and broadcast to update occupancy displays on search and booking pages](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/seat_load_flow_diagram_1779755633095.png)

---

## 2.3 Real-time Schedule & ETA Updates

This feature addresses the lack of live operational visibility that passengers face after completing a booking. The proposed real-time schedule and ETA updates panel provides passengers with a continuously-updated feed of schedule status changes, delay notifications, and revised estimated arrival times — all delivered instantly without requiring a page refresh.

It works by subscribing to the `schedule_updates` table, which stores timestamped status records including the current service status (e.g., "Scheduled", "Departed", "Delayed", "Arrived"), estimated departure and arrival times, delay duration in minutes, and optional operator messages. When the operator inserts a new update record into the database, the Supabase Realtime channel detects the INSERT event and pushes the new record to all subscribed clients. The client-side component prepends the new update to the existing timeline feed (capped at the 10 most recent entries) and refreshes the latest-status display panel.

The feature renders a dashboard card containing the latest status headline, updated departure/arrival ETAs, delay duration highlighted in amber for visibility, and a chronological timeline of all recent updates. It is displayed on the booking confirmation page, ensuring passengers receive proactive notifications about service disruptions. This reduces call-center load, decreases passenger anxiety during delays, and provides operators with a structured channel for communicating service changes to their customers.

### Figure 2.3 — Functional Flow Diagram: Real-time Schedule & ETA Updates

![Functional flow diagram showing operator status updates being inserted into the database, broadcast via realtime channel, and rendered as status display, updated ETAs, and timeline feed on the client interface](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/schedule_updates_flow_1779755647095.png)

---

---

## 3.0 Static Analysis of Implemented Features

This section presents the source code of each feature's core functions along with their corresponding Control Flow Graphs (CFGs). Each function's code is annotated with numbered nodes that group related statements. The CFG maps these numbered nodes into a directed graph showing all possible execution paths, branching decisions (True/False), and convergence points.

---

## 3.1 Real-time Messaging — `ChatPanel.tsx`

Source file: [ChatPanel.tsx](file:///c:/Users/shivar/OneDrive/Desktop/redbus/src/components/realtime/ChatPanel.tsx)

---

### 3.1.1 Function: `loadThread()` — Initialize Chat Thread

This asynchronous function initializes the chat session. It queries for an existing chat thread, creates a new one if none exists, and loads the full message history.

```
loadThread() – Initialize Chat Thread

1       setLoading(true);
        try {
          const { data: existing, error } = await supabase
            .from('chat_threads')
            .select('id, client_id, operator_id')
            .eq('booking_id', bookingId)
            .maybeSingle();

2       if (error) throw error;
        let resolvedThread = existing as ChatThread | null;

3       if (!resolvedThread) {

4         const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('client_id, schedules(routes(operator_id))')
            .eq('id', bookingId)
            .single();
          if (bookingError) throw bookingError;
          const operatorId = (booking as any)?.schedules?.routes?.operator_id;
          const clientId = booking?.client_id;
          if (!operatorId || !clientId) throw new Error('...');
          const { data: created, error: createError } = await supabase
            .from('chat_threads')
            .insert({ booking_id: bookingId, client_id: clientId, operator_id: operatorId })
            .select('id, client_id, operator_id')
            .single();
          if (createError) throw createError;
          resolvedThread = created as ChatThread;
        }

5       setThread(resolvedThread);
        const { data: history, error: historyError } = await supabase
          .from('chat_messages')
          .select('id, sender_id, body, created_at')
          .eq('thread_id', resolvedThread.id)
          .order('created_at', { ascending: true });
        if (historyError) throw historyError;
        setMessages((history ?? []) as ChatMessage[]);

6       } catch (err: any) {
          toast.error(err.message || 'Failed to load chat.');
        } finally {
          setLoading(false);
        }
```

#### Control Flow Graph — `loadThread()`

![Control flow graph for loadThread function with 6 nodes](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/cfg_loadthread_1779756105414.png)

**Node descriptions:**
| Node | Description |
|------|-------------|
| 1 | Set loading state, query `chat_threads` by bookingId |
| 2 | Check for query error — if error, throw to node 6 |
| 3 | Decision: does a thread already exist? |
| 4 | (True) Query booking for operator/client IDs, insert new chat thread |
| 5 | Set thread state, query and load message history |
| 6 | Catch errors with toast notification, set loading false |

---

### 3.1.2 Function: `handleSend()` — Send Chat Message

This asynchronous function handles sending a new chat message. It validates inputs, inserts the message into the database, and clears the draft input field.

```
handleSend() – Send Chat Message

1       if (!draft.trim() || !user || !thread) return;

2       setSending(true);
        const payload = {
          thread_id: thread.id,
          sender_id: user.id,
          body: draft.trim(),
        };

3       const { error } = await supabase.from('chat_messages').insert(payload);

4       if (error) throw error;
        setDraft('');

5       } catch (err: any) {
          toast.error(err.message || 'Failed to send message.');
        } finally {
          setSending(false);
        }
```

#### Control Flow Graph — `handleSend()`

![Control flow graph for handleSend function with 5 nodes](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/cfg_handlesend_1779756116713.png)

**Node descriptions:**
| Node | Description |
|------|-------------|
| 1 | Guard: check draft, user, thread are valid — if False, return early |
| 2 | (True) Set sending state, build message payload |
| 3 | Insert message into `chat_messages` table |
| 4 | Check for insert error — if True (error), go to catch in node 5; if False, clear draft |
| 5 | Catch errors with toast, finally set sending false |

---

### 3.1.3 Function: `useEffect` — Realtime Channel Subscription

This effect sets up the Supabase Realtime channel. It listens for INSERT events on `chat_messages` filtered by thread ID, deduplicates incoming messages, and appends new ones to state.

```
useEffect – Realtime Channel Subscription

1       if (!thread) return;

2       const channel = supabase
          .channel(`chat_thread_${thread.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
              filter: `thread_id=eq.${thread.id}`,
            },
            (payload) => {
              const next = payload.new as ChatMessage;

3             if (current.some((m) => m.id === next.id)) return current;

4             return [...current, next];
            }
          )
          .subscribe();

5       return () => { supabase.removeChannel(channel); };
```

#### Control Flow Graph — Realtime Subscription

![Control flow graph for realtime subscription with 5 nodes](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/cfg_chat_subscribe_1779756129966.png)

**Node descriptions:**
| Node | Description |
|------|-------------|
| 1 | Guard: check thread exists — if False, return (no subscription) |
| 2 | (True) Create Supabase channel, register INSERT listener, subscribe |
| 3 | On event: check if message ID already exists (deduplication) |
| 4 | (False — not duplicate) Append new message to messages array |
| 5 | Cleanup: remove channel on unmount |

---

### 3.1.4 Function: `useEffect` — Thread Initialization Effect

This effect orchestrates the full chat thread lifecycle. It validates preconditions, invokes `loadThread()`, and sets up unmount cleanup.

```
useEffect – Thread Initialization Effect

1       if (!bookingId || isLoading || !user) return;

2       let isMounted = true;

3       loadThread();

4       return () => { isMounted = false; };
```

#### Control Flow Graph — Thread Initialization

![Control flow graph for thread initialization with 4 nodes](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/cfg_autoscroll_1779756146932.png)

**Node descriptions:**
| Node | Description |
|------|-------------|
| 1 | Guard: check bookingId, isLoading, user — if False, return early |
| 2 | (True) Initialize isMounted flag to true |
| 3 | Call loadThread() to begin chat initialization |
| 4 | Cleanup: set isMounted to false on unmount |

---

---

## 3.2 Real-time Seat Availability — `LiveSeatLoad.tsx`

Source file: [LiveSeatLoad.tsx](file:///c:/Users/shivar/OneDrive/Desktop/redbus/src/components/realtime/LiveSeatLoad.tsx)

---

### 3.2.1 Function: `fetchSeatCounts()` — Query Raw Seats Table

This asynchronous function queries the raw `seats` table and calculates aggregate seat metrics client-side. It serves as the fallback data source when `schedule_metrics` is unavailable.

```
fetchSeatCounts() – Query Raw Seats Table

1       const { data: seats, error } = await supabase
          .from('seats')
          .select('status')
          .eq('schedule_id', scheduleId);

2       if (error || !isMounted || !seats) return;

3       const seatRows = seats as SeatStatusRow[];
        const total = seatRows.length;
        const booked = seatRows.filter((seat) => seat.status === 'booked').length;
        const locked = seatRows.filter((seat) => seat.status === 'locked').length;

4       const available = Math.max(total - booked - locked, 0);

5       setMetrics({ total_seats: total, booked_seats: booked,
          locked_seats: locked, available_seats: available });
```

#### Control Flow Graph — `fetchSeatCounts()`

![Control flow graph for fetchSeatCounts with 5 nodes](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/cfg_fetchseatcounts_1779756171328.png)

**Node descriptions:**
| Node | Description |
|------|-------------|
| 1 | Query `seats` table for all seats matching schedule_id |
| 2 | Guard: check for error, unmounted, or null data — if True, return early |
| 3 | (False) Cast rows, count total, filter booked and locked counts |
| 4 | Calculate available seats: max(total - booked - locked, 0) |
| 5 | Update metrics state with computed values |

---

### 3.2.2 Function: `fetchMetrics()` — Query Aggregated Metrics

This asynchronous function attempts to load pre-aggregated metrics from `schedule_metrics`. If no data is found, it falls back to `fetchSeatCounts()`.

```
fetchMetrics() – Query Aggregated Metrics

1       const { data, error } = await supabase
          .from('schedule_metrics')
          .select('total_seats, booked_seats, locked_seats, available_seats')
          .eq('schedule_id', scheduleId)
          .maybeSingle();

2       if (!error && data && isMounted) {

3         setMetrics(data as SeatMetrics);
          return;
        }

4       await fetchSeatCounts();
```

#### Control Flow Graph — `fetchMetrics()`

![Control flow graph for fetchMetrics with 4 nodes](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/cfg_fetchmetrics_1779756183406.png)

**Node descriptions:**
| Node | Description |
|------|-------------|
| 1 | Query `schedule_metrics` for aggregated seat data |
| 2 | Decision: no error AND data exists AND component mounted? |
| 3 | (True) Set metrics from aggregated data, return early |
| 4 | (False) Fallback: call fetchSeatCounts() for raw calculation |

---

### 3.2.3 Function: `useEffect` — Dual-Table Realtime Subscription

This effect subscribes to two tables on a single Supabase channel. Changes to `schedule_metrics` update state directly; changes to `seats` trigger a client-side recalculation via `fetchSeatCounts()`.

```
useEffect – Dual-Table Realtime Subscription

1       let isMounted = true;
        fetchMetrics();

2       const channel = supabase
          .channel(`live_seat_load_${scheduleId}`)

3         .on('postgres_changes',
            { event: '*', schema: 'public', table: 'schedule_metrics',
              filter: `schedule_id=eq.${scheduleId}` },
            (payload) => {

4           if (payload.new) setMetrics(payload.new as SeatMetrics);
          })

5         .on('postgres_changes',
            { event: '*', schema: 'public', table: 'seats',
              filter: `schedule_id=eq.${scheduleId}` },
            () => { fetchSeatCounts(); })
          .subscribe();

6       return () => { isMounted = false; supabase.removeChannel(channel); };
```

#### Control Flow Graph — Dual-Table Subscription

![Control flow graph for dual-table subscription with 6 nodes](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/cfg_seat_subscribe_1779756196008.png)

**Node descriptions:**
| Node | Description |
|------|-------------|
| 1 | Initialize isMounted, call fetchMetrics() for initial data |
| 2 | Create Supabase channel for this schedule |
| 3 | Event received — determine source table |
| 4 | (schedule_metrics) Set metrics directly from payload |
| 5 | (seats) Call fetchSeatCounts() to recalculate client-side |
| 6 | Cleanup: set isMounted false, remove channel |

---

### 3.2.4 Function: Occupancy Computation & Render Logic

This block computes the occupancy percentage from raw metrics and conditionally renders the progress bar based on whether data is available.

```
Occupancy Computation & Render

1       const total = metrics?.total_seats ?? 0;
        const occupied = (metrics?.booked_seats ?? 0) + (metrics?.locked_seats ?? 0);

2       const percent = total > 0 ? Math.round((occupied / total) * 100) : 0;

3       if (total > 0) {

4         render progress bar with width = percent%
          render "{occupied}/{total}" label
        }

5       render "Available: {available_seats}" and "Occupied: {percent}%"
```

#### Control Flow Graph — Occupancy Render

![Control flow graph for occupancy render with 5 nodes](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/cfg_seat_render_1779756208180.png)

**Node descriptions:**
| Node | Description |
|------|-------------|
| 1 | Extract total and occupied counts from metrics state |
| 2 | Compute occupancy percentage (guard division by zero) |
| 3 | Decision: total > 0 (has seat data)? |
| 4 | (True) Render progress bar at computed width, show occupied/total label |
| 5 | Render available count and occupancy percentage text |

---

---

## 3.3 Real-time Schedule & ETA Updates — `ScheduleUpdatesPanel.tsx`

Source file: [ScheduleUpdatesPanel.tsx](file:///c:/Users/shivar/OneDrive/Desktop/redbus/src/components/realtime/ScheduleUpdatesPanel.tsx)

---

### 3.3.1 Function: `formatTime()` — Format ISO Timestamps

This utility function converts ISO timestamp strings into human-readable 12-hour time format with error handling.

```
formatTime() – Format ISO Timestamps

1       if (!iso) return 'TBA';

2       return 'TBA'

3       try {
          return new Date(iso).toLocaleTimeString('en-US',
            { hour: '2-digit', minute: '2-digit' });

4         return formatted time string;
        } catch {

5         return iso;
        }
```

#### Control Flow Graph — `formatTime()`

![Control flow graph for formatTime with 5 nodes](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/cfg_formattime_1779756228126.png)

**Node descriptions:**
| Node | Description |
|------|-------------|
| 1 | Guard: is iso null or undefined? |
| 2 | (True) Return 'TBA' string |
| 3 | (False) Try: parse ISO string and format with toLocaleTimeString |
| 4 | (True — parse success) Return formatted time string |
| 5 | (False — catch) Return raw iso string as fallback |

---

### 3.3.2 Function: `load()` — Fetch Schedule Updates

This asynchronous function queries the 10 most recent schedule updates from the database, ordered by creation time descending.

```
load() – Fetch Schedule Updates

1       setLoading(true);

2       const { data, error } = await supabase
          .from('schedule_updates')
          .select('id, status, message, estimated_departure_time,
            estimated_arrival_time, delay_minutes, created_at')
          .eq('schedule_id', scheduleId)
          .order('created_at', { ascending: false })
          .limit(10);

3       if (!error && isMounted) {

4         setUpdates((data ?? []) as ScheduleUpdate[]);
        }

5       if (isMounted) setLoading(false);
```

#### Control Flow Graph — `load()`

![Control flow graph for load function with 5 nodes](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/cfg_load_1779756241371.png)

**Node descriptions:**
| Node | Description |
|------|-------------|
| 1 | Set loading state to true |
| 2 | Query `schedule_updates` table, order desc, limit 10 |
| 3 | Decision: no error AND component is mounted? |
| 4 | (True) Set updates state with fetched data |
| 5 | If mounted, set loading to false |

---

### 3.3.3 Function: `useEffect` — Realtime Subscription

This effect calls `load()` for initial data, then sets up a Supabase Realtime channel that listens for INSERT events on `schedule_updates`. New updates are prepended to the array (capped at 10).

```
useEffect – Realtime Subscription

1       let isMounted = true;
        load();

2       const channel = supabase
          .channel(`schedule_updates_${scheduleId}`)
          .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'schedule_updates',
              filter: `schedule_id=eq.${scheduleId}` },

3           (payload) => {

4             setUpdates((current) =>
                [payload.new as ScheduleUpdate, ...current].slice(0, 10));
            })
          .subscribe();

5       return () => { isMounted = false; supabase.removeChannel(channel); };
```

#### Control Flow Graph — Realtime Subscription

![Control flow graph for schedule realtime subscription with 5 nodes](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/cfg_schedule_subscribe_1779756254671.png)

**Node descriptions:**
| Node | Description |
|------|-------------|
| 1 | Initialize isMounted flag, call load() for initial data |
| 2 | Create Supabase channel, register INSERT listener |
| 3 | Subscribe to channel — waiting for events |
| 4 | On event: prepend new update, slice array to max 10 |
| 5 | Cleanup: set isMounted false, remove channel |

---

### 3.3.4 Function: Status Display & Conditional Render Logic

This render block extracts the latest update, displays the current status with ETA times, and conditionally renders the delay warnings and operator messages.

```
Status Display & Conditional Render

1       const latest = updates[0];

2       render latest?.status ?? 'Scheduled'
        render formatTime(latest?.estimated_departure_time ?? scheduledDeparture)
        render formatTime(latest?.estimated_arrival_time ?? scheduledArrival)

3       if (latest?.delay_minutes) {

4         render "Delay: {latest.delay_minutes} minutes"  (amber highlight)
        }

5       if (latest?.message) {

6         render latest.message  (muted text)
        }

7       render update timeline (map updates → status + timestamp + message)
```

#### Control Flow Graph — Status Render

![Control flow graph for status render with 7 nodes](C:/Users/shivar/.gemini/antigravity/brain/0ef7f0bf-5776-4773-99bc-db948e2eff32/cfg_schedule_render_1779756267020.png)

**Node descriptions:**
| Node | Description |
|------|-------------|
| 1 | Extract latest update from updates array (index 0) |
| 2 | Render status label, departure ETA, arrival ETA |
| 3 | Decision: does latest have delay_minutes? |
| 4 | (True) Render amber delay warning with minutes |
| 5 | Decision: does latest have a message? |
| 6 | (True) Render operator message text |
| 7 | Render full update timeline (map all updates to timeline items) |

---

---

## 3.4 Structural Coverage

Structural coverage metrics are essential for evaluating the thoroughness and quality of code-level testing. By measuring which parts of the source code are executed during test suites, developers can identify untested execution paths, potential edge cases, and hidden bugs in BusSphere's real-time features. 

For this analysis, we define and apply the following four primary coverage criteria to each core function:
- **Statement Coverage (Sc)**: A measure of the percentage of individual statements or lines of code executed during a test.
- **Decision Coverage (Dc)**: A measure of the percentage of decision outcomes (e.g., True and False branches of `if` statements or loops) evaluated by a test case.
- **Path (branch) Coverage (Pc)**: A measure of the percentage of independent execution paths (unique sequences of instructions from function entry to exit) executed by a test case.
- **Condition Coverage (Cc)**: A measure of the percentage of individual logical conditions (Boolean expressions/sub-clauses combined with operators like `&&` or `||`) evaluated by a test case.

---

### Feature 1: Real-time Messaging (`ChatPanel.tsx`)

**1. `loadThread()` — Initialize Chat Thread**

* **Applicable Coverage Metrics:** Statement Coverage (Sc), Decision Coverage (Dc), Path (branch) Coverage (Pc), Condition Coverage (Cc)
* **Overall Target Suite Coverage:**
  - **Statement Coverage (Sc):** **100.0%** (All nodes 1–6 executed across the test suite)
  - **Decision Coverage (Dc):** **100.0%** (All 12 Boolean outcomes for the 6 decisions evaluated)
  - **Path (branch) Coverage (Pc):** **100.0%** (All 6 unique execution routes tested)
  - **Condition Coverage (Cc):** **100.0%** (Both clauses of `!operatorId || !clientId` evaluated to True and False)

* **Statement Coverage (Sc):** Ensures the entire initialization logic executes, including querying the `chat_threads` table for an existing thread, resolving operator/client identities from `bookings` when no thread exists, inserting a new thread record, loading history from `chat_messages`, and invoking state setters.
* **Decision Coverage (Dc):** Focuses on evaluating both True and False outcomes for all decision nodes:
  - `if (error)` (querying threads)
  - `if (!resolvedThread)` (checking thread existence)
  - `if (bookingError)` (querying booking details)
  - `if (!operatorId || !clientId)` (validating identities)
  - `if (createError)` (inserting thread)
  - `if (historyError)` (fetching message history)
* **Path (branch) Coverage (Pc) & Test Case Percentages:** Validates all distinct paths from function start to finish:
  - **Path 1 (Existing Thread Found):** Covers **66.7% Sc** (Nodes 1, 2, 3, 5, finally), **25.0% Dc** (3/12 outcomes: `error` = F, `!resolvedThread` = F, `historyError` = F), and **16.7% Pc** (1/6 paths).
  - **Path 2 (New Thread Created):** Covers **83.3% Sc** (Nodes 1, 2, 3, 4, 5, finally), **50.0% Dc** (6/12 outcomes: `error` = F, `!resolvedThread` = T, `bookingError` = F, `!operatorId || !clientId` = F, `createError` = F, `historyError` = F), and **16.7% Pc** (1/6 paths).
  - **Path 3 (Booking Query Fails):** Covers **66.7% Sc** (Nodes 1, 2, 3, 4 [partial], 6, finally), **33.3% Dc** (4/12 outcomes: `error` = F, `!resolvedThread` = T, `bookingError` = T), and **16.7% Pc** (1/6 paths).
  - **Path 4 (Operator/Client ID Missing):** Covers **66.7% Sc** (Nodes 1, 2, 3, 4 [partial], 6, finally), **33.3% Dc** (4/12 outcomes: `error` = F, `!resolvedThread` = T, `bookingError` = F, `!operatorId || !clientId` = T), and **16.7% Pc** (1/6 paths).
  - **Path 5 (Database operation fails):** Covers **50.0% Sc** (Nodes 1, 2, 6, finally), **16.7% Dc** (2/12 outcomes: `error` = T), and **16.7% Pc** (1/6 paths).
  - **Path 6 (Component unmounts mid-execution):** Covers **33.3% Sc** (isMounted guard), **0.0% Dc**, and **16.7% Pc** (1/6 paths).
* **Condition Coverage (Cc):** Applies to the compound Boolean decision `if (!operatorId || !clientId)`. To achieve Cc, tests must evaluate:
  - Condition A (`!operatorId`) as True and False.
  - Condition B (`!clientId`) as True and False.
  - Scenarios: (1) Operator ID missing, (2) Client ID missing, (3) Both missing, (4) Both present.

---

**2. `handleSend()` — Send Chat Message**

* **Applicable Coverage Metrics:** Statement Coverage (Sc), Decision Coverage (Dc), Path (branch) Coverage (Pc), Condition Coverage (Cc)
* **Overall Target Suite Coverage:**
  - **Statement Coverage (Sc):** **100.0%** (All nodes 1–5 executed across the test suite)
  - **Decision Coverage (Dc):** **100.0%** (All 4 Boolean outcomes of the 2 decisions evaluated)
  - **Path (branch) Coverage (Pc):** **100.0%** (All 5 unique execution paths exercised)
  - **Condition Coverage (Cc):** **100.0%** (All 6 condition outcomes evaluated for `!draft.trim()`, `!user`, and `!thread`)

* **Statement Coverage (Sc):** Ensures all statements run, including the input guard, `setSending(true)`, building the message payload, database insertion, draft clearing, error catching, and the `finally` block resetting sending states.
* **Decision Coverage (Dc):** Verifies both True and False outcomes for the decisions:
  - Guard statement: `if (!draft.trim() || !user || !thread)`
  - Error check: `if (error)`
* **Path (branch) Coverage (Pc) & Test Case Percentages:** Exercises all execution paths:
  - **Path 1 (Empty draft):** Covers **20.0% Sc** (Node 1 only), **25.0% Dc** (1/4 outcomes: guard = T), **20.0% Pc** (1/5 paths), and **16.7% Cc** (1/6 conditions: `!draft.trim()` = T).
  - **Path 2 (Missing User):** Covers **20.0% Sc** (Node 1 only), **25.0% Dc** (1/4 outcomes: guard = T), **20.0% Pc** (1/5 paths), and **33.3% Cc** (2/6 conditions: `!draft.trim()` = F, `!user` = T).
  - **Path 3 (Missing Thread):** Covers **20.0% Sc** (Node 1 only), **25.0% Dc** (1/4 outcomes: guard = T), **20.0% Pc** (1/5 paths), and **50.0% Cc** (3/6 conditions: `!draft.trim()` = F, `!user` = F, `!thread` = T).
  - **Path 4 (Successful Send):** Covers **80.0% Sc** (Nodes 1, 2, 3, 4, finally), **50.0% Dc** (2/4 outcomes: guard = F, `error` = F), **20.0% Pc** (1/5 paths), and **100.0% Cc**.
  - **Path 5 (Database Insert Error):** Covers **80.0% Sc** (Nodes 1, 2, 3, 4, 5, finally), **50.0% Dc** (2/4 outcomes: guard = F, `error` = T), **20.0% Pc** (1/5 paths), and **100.0% Cc**.
* **Condition Coverage (Cc):** Applies to the multi-clause guard `if (!draft.trim() || !user || !thread)`. To satisfy Cc, each constituent Boolean condition must evaluate to True and False:
  - Condition A (`!draft.trim()`) is True (empty message) and False.
  - Condition B (`!user`) is True (unauthenticated) and False.
  - Condition C (`!thread`) is True (no active thread) and False.

---

**3. `useEffect` — Realtime Channel Subscription**

* **Applicable Coverage Metrics:** Statement Coverage (Sc), Decision Coverage (Dc), Path (branch) Coverage (Pc)
* *Condition Coverage (Cc) is **Not Applicable** as there are no compound Boolean expressions.*
* **Overall Target Suite Coverage:**
  - **Statement Coverage (Sc):** **100.0%** (All setup, callback, and cleanup statements executed)
  - **Decision Coverage (Dc):** **100.0%** (All 4 Boolean outcomes of the 2 decisions evaluated)
  - **Path (branch) Coverage (Pc):** **100.0%** (All 4 unique execution paths exercised)

* **Statement Coverage (Sc):** Verifies that the subscription setup runs fully, including channel creation, event listener registration, the subscription callback, and the unmount cleanup returning `removeChannel()`.
* **Decision Coverage (Dc):** Evaluates outcomes of the single-condition decisions:
  - `if (!thread)` (effect guard)
  - `if (current.some((m) => m.id === next.id))` (deduplication check)
* **Path (branch) Coverage (Pc) & Test Case Percentages:** Covers all possible code paths:
  - **Path 1 (Thread is null):** Covers **20.0% Sc** (Node 1), **25.0% Dc** (1/4 outcomes: `!thread` = T), and **25.0% Pc** (1/4 paths).
  - **Path 2 (Duplicate Message Arrives):** Covers **80.0% Sc** (Nodes 1, 2, 3, 5), **75.0% Dc** (3/4 outcomes: `!thread` = F, dup check = T), and **25.0% Pc** (1/4 paths).
  - **Path 3 (New Message Arrives):** Covers **100.0% Sc** (Nodes 1, 2, 3, 4, 5), **75.0% Dc** (3/4 outcomes: `!thread` = F, dup check = F), and **25.0% Pc** (1/4 paths).
  - **Path 4 (Component Unmounts):** Covers **40.0% Sc** (Node 5 cleanup), **0.0% Dc**, and **25.0% Pc** (1/4 paths).

---

**4. `useEffect` — Thread Initialization Effect**

* **Applicable Coverage Metrics:** Statement Coverage (Sc), Decision Coverage (Dc), Path (branch) Coverage (Pc), Condition Coverage (Cc)
* **Overall Target Suite Coverage:**
  - **Statement Coverage (Sc):** **100.0%** (All nodes 1–4 executed across the test suite)
  - **Decision Coverage (Dc):** **100.0%** (Both outcomes of the guard decision evaluated)
  - **Path (branch) Coverage (Pc):** **100.0%** (Both execution paths exercised)
  - **Condition Coverage (Cc):** **100.0%** (All 6 Boolean outcomes of the 3 guard sub-clauses evaluated)

* **Statement Coverage (Sc):** Ensures setup and execution statements run, including the guard, mount flag assignment, calling `loadThread()`, and unmount cleanup setting `isMounted = false`.
* **Decision Coverage (Dc):** Focuses on the guard decision outcome `if (!bookingId || isLoading || !user)`.
* **Path (branch) Coverage (Pc) & Test Case Percentages:** Validates the two execution paths:
  - **Path 1 (Guard fails/Preconditions unmet):** Covers **25.0% Sc** (Node 1), **50.0% Dc** (guard = T), **50.0% Pc**, and up to **50.0% Cc** (depending on which clause triggers early return).
  - **Path 2 (Guard passes/Init & Unmount):** Covers **100.0% Sc** (Nodes 1, 2, 3, 4), **50.0% Dc** (guard = F), **50.0% Pc**, and **100.0% Cc**.
* **Condition Coverage (Cc):** Applies to the compound guard condition `if (!bookingId || isLoading || !user)`. Cc requires evaluating each individual logical clause to True and False:
  - Condition A (`!bookingId`) is True (empty ID) and False.
  - Condition B (`isLoading`) is True (loading auth) and False.
  - Condition C (`!user`) is True (no user) and False.

---

### Feature 2: Real-time Seat Availability (`LiveSeatLoad.tsx`)

**5. `fetchSeatCounts()` — Query Raw Seats Table**

* **Applicable Coverage Metrics:** Statement Coverage (Sc), Decision Coverage (Dc), Path (branch) Coverage (Pc), Condition Coverage (Cc)
* **Overall Target Suite Coverage:**
  - **Statement Coverage (Sc):** **100.0%** (All nodes 1–5 executed across the test suite)
  - **Decision Coverage (Dc):** **100.0%** (Both outcomes of guard evaluated)
  - **Path (branch) Coverage (Pc):** **100.0%** (Both paths executed)
  - **Condition Coverage (Cc):** **100.0%** (All 6 outcomes of `error`, `!isMounted`, and `!seats` evaluated)

* **Statement Coverage (Sc):** Ensures the Supabase seats query executes, followed by type casting, array filtering (for booked/locked seats), available count math, and state updates.
* **Decision Coverage (Dc):** Focuses on evaluating the True and False outcomes of the guard:
  - `if (error || !isMounted || !seats)`
* **Path (branch) Coverage (Pc) & Test Case Percentages:** Tests both execution paths:
  - **Path 1 (Preconditions unmet/early return):** Covers **40.0% Sc** (Nodes 1, 2), **50.0% Dc** (guard = T), **50.0% Pc**, and up to **50.0% Cc** (depending on which clause triggers it).
  - **Path 2 (Successful Calculation):** Covers **100.0% Sc** (Nodes 1, 2, 3, 4, 5), **50.0% Dc** (guard = F), **50.0% Pc**, and **100.0% Cc**.
* **Condition Coverage (Cc):** Applies to the compound guard `if (error || !isMounted || !seats)`. Cc requires evaluating all three logical sub-expressions to both True and False:
  - Condition A (`error`) is True and False.
  - Condition B (`!isMounted`) is True and False.
  - Condition C (`!seats`) is True and False.

---

**6. `fetchMetrics()` — Query Aggregated Metrics**

* **Applicable Coverage Metrics:** Statement Coverage (Sc), Decision Coverage (Dc), Path (branch) Coverage (Pc), Condition Coverage (Cc)
* **Overall Target Suite Coverage:**
  - **Statement Coverage (Sc):** **100.0%** (All nodes 1–4 executed across the test suite)
  - **Decision Coverage (Dc):** **100.0%** (Both outcomes of success check evaluated)
  - **Path (branch) Coverage (Pc):** **100.0%** (Both paths executed)
  - **Condition Coverage (Cc):** **100.0%** (All 6 outcomes of `!error`, `data`, and `isMounted` evaluated)

* **Statement Coverage (Sc):** Ensures execution of the aggregate query, `setMetrics` call, and the fallback invocation of `fetchSeatCounts()`.
* **Decision Coverage (Dc):** Evaluates the True and False branches of the decision:
  - `if (!error && data && isMounted)`
* **Path (branch) Coverage (Pc) & Test Case Percentages:** Validates the execution paths:
  - **Path 1 (Query succeeds & sets metrics):** Covers **75.0% Sc** (Nodes 1, 2, 3), **50.0% Dc** (guard = T), **50.0% Pc**, and **100.0% Cc**.
  - **Path 2 (Query fails / fallback triggered):** Covers **50.0% Sc** (Nodes 1, 2, 4), **50.0% Dc** (guard = F), **50.0% Pc**, and up to **50.0% Cc** (depending on query result).
* **Condition Coverage (Cc):** Applies to the compound check `if (!error && data && isMounted)`. Cc requires evaluating the individual conditions to True and False:
  - Condition A (`!error`) is True and False.
  - Condition B (`data`) is True and False.
  - Condition C (`isMounted`) is True and False.

---

**7. `useEffect` — Dual-Table Realtime Subscription**

* **Applicable Coverage Metrics:** Statement Coverage (Sc), Decision Coverage (Dc), Path (branch) Coverage (Pc)
* *Condition Coverage (Cc) is **Not Applicable** as there are no compound Boolean expressions.*
* **Overall Target Suite Coverage:**
  - **Statement Coverage (Sc):** **100.0%** (All subscription setup, callbacks, and cleanups executed)
  - **Decision Coverage (Dc):** **100.0%** (Both outcomes of payload check evaluated)
  - **Path (branch) Coverage (Pc):** **100.0%** (All 4 unique execution paths exercised)

* **Statement Coverage (Sc):** Verifies the subscription lifecycle, including mounted flag setup, initial `fetchMetrics()` call, channel setup, registering both table callbacks, and cleanup.
* **Decision Coverage (Dc):** Evaluates outcomes of the payload check inside the `schedule_metrics` callback:
  - `if (payload.new)`
* **Path (branch) Coverage (Pc) & Test Case Percentages:** Verifies different execution paths:
  - **Path 1 (Metric changes with payload):** Covers **66.7% Sc** (Nodes 1, 2, 3, 4), **50.0% Dc** (payload check = T), and **25.0% Pc** (1/4 paths).
  - **Path 2 (Metric changes without payload):** Covers **50.0% Sc** (Nodes 1, 2, 3), **50.0% Dc** (payload check = F), and **25.0% Pc** (1/4 paths).
  - **Path 3 (Seat status change):** Covers **66.7% Sc** (Nodes 1, 2, 5), **0.0% Dc**, and **25.0% Pc** (1/4 paths).
  - **Path 4 (Component Unmounts):** Covers **33.3% Sc** (Node 6 cleanup), **0.0% Dc**, and **25.0% Pc** (1/4 paths).

---

**8. Occupancy Computation & Render Logic**

* **Applicable Coverage Metrics:** Statement Coverage (Sc), Decision Coverage (Dc), Path (branch) Coverage (Pc)
* *Condition Coverage (Cc) is **Not Applicable** as there are no compound Boolean expressions.*
* **Overall Target Suite Coverage:**
  - **Statement Coverage (Sc):** **100.0%** (All execution steps and render statements executed)
  - **Decision Coverage (Dc):** **100.0%** (All 4 Boolean outcomes of the division guard and conditional render evaluated)
  - **Path (branch) Coverage (Pc):** **100.0%** (Both execution paths exercised)

* **Statement Coverage (Sc):** Ensures variables (`total`, `occupied`, `percent`) are calculated and render elements (progress bar, labels, texts) execute.
* **Decision Coverage (Dc):** Evaluates True and False outcomes for decisions:
  - Ternary division guard: `total > 0`
  - Conditional progress bar render: `if (total > 0)`
* **Path (branch) Coverage (Pc) & Test Case Percentages:** Validates the distinct rendering flows:
  - **Path 1 (Metrics empty/Total zero):** Covers **60.0% Sc** (Nodes 1, 2, 3, 5), **50.0% Dc** (ternary = F, render guard = F), and **50.0% Pc** (1/2 paths).
  - **Path 2 (Valid metrics/Total > 0):** Covers **100.0% Sc** (Nodes 1, 2, 3, 4, 5), **50.0% Dc** (ternary = T, render guard = T), and **50.0% Pc** (1/2 paths).

---

### Feature 3: Real-time Schedule & ETA Updates (`ScheduleUpdatesPanel.tsx`)

**9. `formatTime()` — Format ISO Timestamps**

* **Applicable Coverage Metrics:** Statement Coverage (Sc), Decision Coverage (Dc), Path (branch) Coverage (Pc)
* *Condition Coverage (Cc) is **Not Applicable** as there are no compound Boolean expressions.*
* **Overall Target Suite Coverage:**
  - **Statement Coverage (Sc):** **100.0%** (All lines and catch blocks executed)
  - **Decision Coverage (Dc):** **100.0%** (Both outcomes of the null check evaluated)
  - **Path (branch) Coverage (Pc):** **100.0%** (All 3 unique execution paths exercised)

* **Statement Coverage (Sc):** Ensures the execution of the null check, time parsing, local string formatting, and the catch block returning the raw ISO.
* **Decision Coverage (Dc):** Evaluates the True and False outcomes of the guard:
  - `if (!iso)`
* **Path (branch) Coverage (Pc) & Test Case Percentages:** Validates all paths:
  - **Path 1 (Null/Undefined Input):** Covers **40.0% Sc** (Nodes 1, 2), **50.0% Dc** (guard = T), and **33.3% Pc** (1/3 paths).
  - **Path 2 (Valid ISO String):** Covers **80.0% Sc** (Nodes 1, 3, 4), **50.0% Dc** (guard = F), and **33.3% Pc** (1/3 paths).
  - **Path 3 (Malformed ISO String):** Covers **80.0% Sc** (Nodes 1, 3, 5), **50.0% Dc** (guard = F), and **33.3% Pc** (1/3 paths).

---

**10. `load()` — Fetch Schedule Updates**

* **Applicable Coverage Metrics:** Statement Coverage (Sc), Decision Coverage (Dc), Path (branch) Coverage (Pc), Condition Coverage (Cc)
* **Overall Target Suite Coverage:**
  - **Statement Coverage (Sc):** **100.0%** (All nodes 1–5 executed across the test suite)
  - **Decision Coverage (Dc):** **100.0%** (All 4 Boolean outcomes of success check and loading reset check evaluated)
  - **Path (branch) Coverage (Pc):** **100.0%** (All 4 unique execution paths exercised)
  - **Condition Coverage (Cc):** **100.0%** (All 4 Boolean outcomes of `!error` and `isMounted` evaluated)

* **Statement Coverage (Sc):** Ensures loading states are updated, Supabase queries execute with filters and limits, updates are set, and loading resets.
* **Decision Coverage (Dc):** Evaluates outcomes of the decisions:
  - `if (!error && isMounted)`
  - `if (isMounted)` (loading state reset)
* **Path (branch) Coverage (Pc) & Test Case Percentages:** Validates the execution paths:
  - **Path 1 (Query Success & Mounted):** Covers **80.0% Sc** (Nodes 1, 2, 3, 4, 5), **50.0% Dc** (success check = T, loading check = T), **25.0% Pc** (1/4 paths), and **100.0% Cc**.
  - **Path 2 (Query Failure & Mounted):** Covers **80.0% Sc** (Nodes 1, 2, 3, 5), **50.0% Dc** (success check = F, loading check = T), **25.0% Pc** (1/4 paths), and **25.0% Cc** (`!error` = F).
  - **Path 3 (Query Success & Unmounted):** Covers **40.0% Sc** (Nodes 1, 2), **50.0% Dc** (success check = F, loading check = F), **25.0% Pc** (1/4 paths), and **25.0% Cc** (`isMounted` = F).
  - **Path 4 (Empty Array Returned):** Covers **80.0% Sc** (Nodes 1, 2, 3, 4, 5), **50.0% Dc** (success check = T, loading check = T), **25.0% Pc** (1/4 paths), and **100.0% Cc**.
* **Condition Coverage (Cc):** Applies to the compound condition `if (!error && isMounted)`. Cc requires evaluating both conditions to True and False:
  - Condition A (`!error`) is True and False.
  - Condition B (`isMounted`) is True and False.

---

**11. `useEffect` — Realtime Subscription**

* **Applicable Coverage Metrics:** Statement Coverage (Sc)
* *Decision Coverage (Dc), Path (branch) Coverage (Pc), and Condition Coverage (Cc) are **Not Applicable** since the subscription setup, callbacks, and cleanups execute unconditionally without branching code.*
* **Overall Target Suite Coverage:**
  - **Statement Coverage (Sc):** **100.0%** (All setup, subscribe, and cleanup statements executed)

* **Statement Coverage (Sc):** Ensures initial database pull via `load()`, channel instantiation, INSERT listener registration, subscription execution, and unmount channel removal are executed.

---

**12. Status Display & Conditional Render Logic**

* **Applicable Coverage Metrics:** Statement Coverage (Sc), Decision Coverage (Dc), Path (branch) Coverage (Pc)
* *Condition Coverage (Cc) is **Not Applicable** as there are no compound Boolean expressions.*
* **Overall Target Suite Coverage:**
  - **Statement Coverage (Sc):** **100.0%** (All display cases, formatting fallbacks, and layout renders executed)
  - **Decision Coverage (Dc):** **100.0%** (All 4 Boolean outcomes of delay and message checks evaluated)
  - **Path (branch) Coverage (Pc):** **100.0%** (All 5 unique render paths exercised)

* **Statement Coverage (Sc):** Ensures rendering statements execute, including extracting the latest status, formatting ETA times, mapping updates to the timeline, and conditionally rendering warnings and messages.
* **Decision Coverage (Dc):** Evaluates both True and False outcomes for each separate conditional render decision:
  - `if (latest?.delay_minutes)`
  - `if (latest?.message)`
* **Path (branch) Coverage (Pc) & Test Case Percentages:** Exercises all independent combinations of the optional display features:
  - **Path 1 (No updates present):** Covers **42.9% Sc** (Nodes 1, 2, 3, 5, 7), **50.0% Dc** (delay check = F, message check = F), and **20.0% Pc** (1/5 paths).
  - **Path 2 (Delay & Message present):** Covers **100.0% Sc** (Nodes 1, 2, 3, 4, 5, 6, 7), **100.0% Dc** (delay check = T, message check = T), and **20.0% Pc** (1/5 paths).
  - **Path 3 (Delay present, Message absent):** Covers **71.4% Sc** (Nodes 1, 2, 3, 4, 5, 7), **50.0% Dc** (delay check = T, message check = F), and **20.0% Pc** (1/5 paths).
  - **Path 4 (Delay absent, Message present):** Covers **71.4% Sc** (Nodes 1, 2, 3, 5, 6, 7), **50.0% Dc** (delay check = F, message check = T), and **20.0% Pc** (1/5 paths).
  - **Path 5 (Delay absent, Message absent):** Covers **57.1% Sc** (Nodes 1, 2, 3, 5, 7), **50.0% Dc** (delay check = F, message check = F), and **20.0% Pc** (1/5 paths).

---

## Summary of Applicable Coverage Metrics per Function

Below is a consolidated summary of which structural coverage metrics are applicable to each analyzed function and logic block in the BusSphere real-time features, along with target suite coverage percentages:

| Function / Logic Block | Statement Coverage (Sc) | Decision Coverage (Dc) | Path (branch) Coverage (Pc) | Condition Coverage (Cc) | Primary Rationale / Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`loadThread()`** | **100.0%** | **100.0%** | **100.0%** | **100.0%** | Has nested logic, multiple DB queries, and compound check `!operatorId \|\| !clientId`. |
| **`handleSend()`** | **100.0%** | **100.0%** | **100.0%** | **100.0%** | Contains multi-clause guard `!draft.trim() \|\| !user \|\| !thread`. |
| **`useEffect`** (Realtime Message Sub) | **100.0%** | **100.0%** | **100.0%** | *N/A* | Simple guards (`!thread`, duplicate ID check); no compound Boolean conditions. |
| **`useEffect`** (Thread Init) | **100.0%** | **100.0%** | **100.0%** | **100.0%** | Contains compound guard condition `!bookingId \|\| isLoading \|\| !user`. |
| **`fetchSeatCounts()`** | **100.0%** | **100.0%** | **100.0%** | **100.0%** | Contains compound guard condition `error \|\| !isMounted \|\| !seats`. |
| **`fetchMetrics()`** | **100.0%** | **100.0%** | **100.0%** | **100.0%** | Contains compound success decision `!error && data && isMounted`. |
| **`useEffect`** (Dual-Table Sub) | **100.0%** | **100.0%** | **100.0%** | *N/A* | Multiple async event triggers, but only simple payload check (`payload.new`). |
| **Occupancy Render Logic** | **100.0%** | **100.0%** | **100.0%** | *N/A* | Single-condition check `total > 0` for division and rendering; no compound conditions. |
| **`formatTime()`** | **100.0%** | **100.0%** | **100.0%** | *N/A* | Error/null guard check and try/catch block; no compound conditions. |
| **`load()`** | **100.0%** | **100.0%** | **100.0%** | **100.0%** | Contains compound success check `!error && isMounted`. |
| **`useEffect`** (Realtime Schedule Sub) | **100.0%** | *N/A* | *N/A* | *N/A* | Entire subscription logic and callback execute unconditionally; no decisions. |
| **Status Render Logic** | **100.0%** | **100.0%** | **100.0%** | *N/A* | Multiple simple render decisions (`delay_minutes`, `message`) mapped sequentially. |

---

## Summary

| Feature | Component | Functions Analyzed | Supabase Channel | DB Tables |
|---|---|---|---|---|
| Real-time Messaging | `ChatPanel.tsx` | `loadThread()`, `handleSend()`, Realtime Subscription, Thread Init Effect | `chat_thread_{id}` | `chat_threads`, `chat_messages` |
| Real-time Seat Availability | `LiveSeatLoad.tsx` | `fetchSeatCounts()`, `fetchMetrics()`, Dual-Table Subscription, Occupancy Render | `live_seat_load_{id}` | `schedule_metrics`, `seats` |
| Real-time Schedule Updates | `ScheduleUpdatesPanel.tsx` | `formatTime()`, `load()`, Realtime Subscription, Status Render | `schedule_updates_{id}` | `schedule_updates` |

---

## 4.0 System Timing Requirements

For a highly interactive, real-time application like BusSphere, the synchronization and latency characteristics of Postgres Changes over WebSockets dictate the overall system timing requirements. Below are the three critical aspects of system timing analyzed across the real-time functionalities:

### 1. Response Requirements
Response timing governs the end-to-end latency of database-to-client propagation. For features like **real-time messaging** and **schedule/ETA updates**, the system must deliver updates from the operator database transaction to the passenger's UI within **500 milliseconds** under normal network loads. This includes Supabase database trigger processing, WebSocket broadcasting, and client-side DOM rendering, ensuring that chat communication and live ETA notifications feel instantaneous and fluid.

### 2. Computation Requirement
Computation timing focuses on the execution time allocated for client-side processing. In **real-time seat availability tracking**, when a seat status change is intercepted from the raw `seats` channel, the client must filter and compute aggregate metrics (total, booked, locked, available) within **16 milliseconds** (matching one 60Hz frame). This computation constraint prevents UI stuttering and locks, ensuring smooth rendering of dynamic seat progress bars.

### 3. Human Factors Requirements
Human factors dictate timing thresholds based on human cognitive limits. In accordance with usability principles, the system must display loading indicator skeletons for asynchronous queries (such as `loadThread()` or `load()`) if network delay exceeds **100 milliseconds**. For critical status changes (e.g., seat lock timeouts or route delay updates), the visual alert or toast notification must persist for at least **3 to 5 seconds** to guarantee passenger awareness before fading out.


