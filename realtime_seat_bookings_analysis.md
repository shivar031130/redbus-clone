# Real-time Seat Occupancy & Booking — Static Code & Control Flow Analysis

This document presents a detailed static analysis of four critical functions in the redBusMalaysia Real-time Seat Booking and Occupancy tracking module (`LiveSeatLoad.tsx`). It provides code segmentations into numbered execution nodes, structural control flow mapping tables, and embeds their corresponding high-fidelity Control Flow Graphs (CFGs).

---

## 1. Query Raw Seat Calculations (`fetchSeatCounts()`)

Source File: [LiveSeatLoad.tsx](file:///c:/Users/shivar/OneDrive/Desktop/redbus/src/components/realtime/LiveSeatLoad.tsx#L32-L46)

This internal asynchronous function queries the raw `seats` database table to perform a client-side recount, calculating total, booked, locked, and available seats when aggregated tables are missing or out-of-sync.

### 1.1 Code Segmentation

```typescript
1     const fetchSeatCounts = async () => {
        const { data: seats, error } = await supabase
          .from('seats')
          .select('status')
          .eq('schedule_id', scheduleId);

2       if (error || !isMounted || !seats) return;

3       const seatRows = seats as SeatStatusRow[];
        const total = seatRows.length;
        const booked = seatRows.filter((seat) => seat.status === 'booked').length;
        const locked = seatRows.filter((seat) => seat.status === 'locked').length;
        const available = Math.max(total - booked - locked, 0);

4       setMetrics({ total_seats: total, booked_seats: booked, locked_seats: locked, available_seats: available });
      };
```

### 1.2 Control Flow Mapping Table

| Node | Type | Description | Outgoing Flows |
|------|------|-------------|----------------|
| **1** | Entry | Enter `fetchSeatCounts()`, and query the `seats` table for this schedule. | Node 2 |
| **2** | Decision | Pre-condition guard check: `if (error \|\| !isMounted \|\| !seats)`. | **True** → Exit function (early return)<br>**False** → Node 3 |
| **3** | Action | Extract data, count total, and filter booked/locked seats to calculate available counts. | Node 4 |
| **4** | Action | Update state via `setMetrics` with calculated seat load values. | Exit function |

### 1.3 Control Flow Graph (CFG)

![CFG for Raw Seat Calculations](file:///C:/Users/shivar/.gemini/antigravity-ide/brain/ff528ee6-1d44-415f-8a1b-43cb3c96c322/cfg_fetch_seat_counts_1779777102315.png)

---

## 2. Query Aggregated Metrics (`fetchMetrics()`)

Source File: [LiveSeatLoad.tsx](file:///c:/Users/shivar/OneDrive/Desktop/redbus/src/components/realtime/LiveSeatLoad.tsx#L48-L61)

This function acts as the primary data retriever, attempting to fetch pre-calculated aggregated metrics from the database and falling back to raw recount calculations on failure.

### 2.1 Code Segmentation

```typescript
1     const fetchMetrics = async () => {
        const { data, error } = await supabase
          .from('schedule_metrics')
          .select('total_seats, booked_seats, locked_seats, available_seats')
          .eq('schedule_id', scheduleId)
          .maybeSingle();

2       if (!error && data && isMounted) {

3         setMetrics(data as SeatMetrics);
          return;
        }

4       await fetchSeatCounts();
      };
```

### 2.2 Control Flow Mapping Table

| Node | Type | Description | Outgoing Flows |
|------|------|-------------|----------------|
| **1** | Entry | Enter `fetchMetrics()`, and query `schedule_metrics` for pre-calculated numbers. | Node 2 |
| **2** | Decision | Pre-aggregated metrics guard check: `if (!error && data && isMounted)`. | **True** → Node 3<br>**False** → Node 4 |
| **3** | Action | Direct state update: set metrics directly from database row and return. | Exit function |
| **4** | Fallback | Call raw recounting function `fetchSeatCounts()` to compute aggregates client-side. | Exit function |

### 2.3 Control Flow Graph (CFG)

![CFG for Aggregated Metrics Query](file:///C:/Users/shivar/.gemini/antigravity-ide/brain/ff528ee6-1d44-415f-8a1b-43cb3c96c322/cfg_fetch_metrics_1779777121036.png)

---

## 3. Dual-Table Realtime Subscription (`useEffect` block)

Source File: [LiveSeatLoad.tsx](file:///c:/Users/shivar/OneDrive/Desktop/redbus/src/components/realtime/LiveSeatLoad.tsx#L29-L97)

This effect initiates state-mounting, handles initial queries, and registers a single channel to capture dynamic updates on both aggregated tables and raw seat states.

### 3.1 Code Segmentation

```typescript
1     useEffect(() => {
        let isMounted = true;
        fetchMetrics();

2       const channel = supabase
          .channel(`live_seat_load_${scheduleId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'schedule_metrics',
              filter: `schedule_id=eq.${scheduleId}`,
            },
            (payload) => {

3             if (payload.new) setMetrics(payload.new as SeatMetrics);
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'seats',
              filter: `schedule_id=eq.${scheduleId}`,
            },
            () => {

4             fetchSeatCounts();
            }
          )
          .subscribe();

5       return () => {
          isMounted = false;
          supabase.removeChannel(channel);
        };
      }, [scheduleId, supabase]);
```

### 3.2 Control Flow Mapping Table

| Node | Type | Description | Outgoing Flows |
|------|------|-------------|----------------|
| **1** | Entry | Mount effect, declare `isMounted = true`, and load initial load data via `fetchMetrics()`. | Node 2 |
| **2** | Action | Establish active Supabase Realtime channel and register callbacks for dual-tables. | Node 3 (metrics event)<br>Node 4 (seats event) |
| **3** | Action | `schedule_metrics` insert/update callback: set metrics directly from payload. | Wait for event |
| **4** | Action | `seats` table transaction callback: invoke `fetchSeatCounts()` for live recounts. | Wait for event |
| **5** | Cleanup | Unmount hook: set `isMounted = false` and remove WebSocket subscription. | Exit Effect |

### 3.3 Control Flow Graph (CFG)

![CFG for Dual-Table Subscription](file:///C:/Users/shivar/.gemini/antigravity-ide/brain/ff528ee6-1d44-415f-8a1b-43cb3c96c322/cfg_seat_subscription_1779777135443.png)

---

## 4. Occupancy Render Computations

Source File: [LiveSeatLoad.tsx](file:///c:/Users/shivar/OneDrive/Desktop/redbus/src/components/realtime/LiveSeatLoad.tsx#L99-L127)

This computation block runs on every render tick, determining the total passenger seat load, summing occupied statuses, and calculating percentage with division-by-zero guards.

### 4.1 Code Segmentation

```typescript
1   const total = metrics?.total_seats ?? 0;
    const occupied = (metrics?.booked_seats ?? 0) + (metrics?.locked_seats ?? 0);

2   const percent = total > 0 ? Math.round((occupied / total) * 100) : 0;

3   return (
      <div className="...">
        ...
      </div>
    );
```

### 4.2 Control Flow Mapping Table

| Node | Type | Description | Outgoing Flows |
|------|------|-------------|----------------|
| **1** | Entry | Extract total seat capability and sum occupied seats (booked + locked). | Node 2 |
| **2** | Decision | Division guard check: `total > 0`. | **True** → Compute percentage ratio → Node 3<br>**False** → Default percentage = 0 → Node 3 |
| **3** | Return | Render visual progress bar containing occupancy metrics and exit render loop. | Exit render |

### 4.3 Control Flow Graph (CFG)

![CFG for Occupancy Render Computations](file:///C:/Users/shivar/.gemini/antigravity-ide/brain/ff528ee6-1d44-415f-8a1b-43cb3c96c322/cfg_seat_render_1779777151043.png)
