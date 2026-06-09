# Real-time Bus Tracking — Static Code & Control Flow Analysis

This document provides a rigorous static analysis of four critical functions in the BusSphere Malaysia Real-time Tracking codebase. For each function, we segment the source code into numbered execution nodes, provide structural control flow mapping tables, and present their corresponding high-fidelity Control Flow Graphs (CFGs).

---

## 1. Passenger GPS Realtime Subscription (`LiveBusTracking.tsx` — `useEffect` block)

Source File: [LiveBusTracking.tsx](file:///c:/Users/shivar/OneDrive/Desktop/redbus/src/components/realtime/LiveBusTracking.tsx#L118-L151)

This effect initiates client-side mounts, handles initial GPS data loading asynchronously, and establishes a real-time Postgres changes channel to capture live telemetry broadcasts from Supabase.

### 1.1 Code Segmentation

```typescript
1     useEffect(() => {
        let isMounted = true;
        const loadData = async () => { ... };
        loadData();

2       const channel = supabase
          .channel(`bus_locations_passenger_${scheduleId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'bus_locations',
              filter: `schedule_id=eq.${scheduleId}`,
            },
            (payload) => {

3             if (isMounted) {

4               const newLoc = payload.new as BusLocation;
                setLocation(newLoc);
              }
            }
          )
          .subscribe();

5       return () => {
          isMounted = false;
          supabase.removeChannel(channel);
        };
      }, [scheduleId, supabase]);
```

### 1.2 Control Flow Mapping Table

| Node | Type | Description | Outgoing Flows |
|------|------|-------------|----------------|
| **1** | Entry | Initialize `isMounted` flag and invoke `loadData()` for initial position fetch. | Node 2 |
| **2** | Action | Subscribe to Supabase Realtime channel for table inserts on `bus_locations`. | Node 3 (upon event tick) |
| **3** | Decision | Check if the component is active: `if (isMounted)`. | **True** → Node 4<br>**False** → Exit callback |
| **4** | Action | Parse payload as `BusLocation` and update coordinates state via `setLocation`. | Exit callback |
| **5** | Cleanup | Unmount hook callback: reset `isMounted` to prevent memory leaks and close channel. | Exit Effect lifecycle |

### 1.3 Control Flow Graph (CFG)

![CFG for Passenger Realtime Subscription](file:///C:/Users/shivar/.gemini/antigravity-ide/brain/ff528ee6-1d44-415f-8a1b-43cb3c96c322/cfg_passenger_realtime_1779776530737.png)

---

## 2. Telemetry & Dynamic ETA Computation (`LiveBusTracking.tsx` — `telemetry` useMemo)

Source File: [LiveBusTracking.tsx](file:///c:/Users/shivar/OneDrive/Desktop/redbus/src/components/realtime/LiveBusTracking.tsx#L182-L210)

This selector computes structural distance and transit completion metrics between the geocoded city start/endpoints, applying the Haversine formula and dynamically estimating ETA.

### 2.1 Code Segmentation

```typescript
1   const telemetry = useMemo(() => {

2     if (!routeCoords) return null;

3     const { start, end } = routeCoords;
      const current = location ? { lat: location.latitude, lng: location.longitude } : start;
      const totalDistance = getDistance(start, end);
      const remainingDistance = getDistance(current, end);
      const progress = Math.min(Math.max(100 - (remainingDistance / totalDistance) * 100, 0), 100);
      const speed = location?.speed_kmh ?? 0;

4     const speedForETA = speed > 5 ? speed : 70;

5     const etaHours = remainingDistance / speedForETA;
      const etaMinutes = Math.round(etaHours * 60);
      return {
        totalDistance: totalDistance.toFixed(1),
        remainingDistance: remainingDistance.toFixed(1),
        progress: Math.round(progress),
        etaMinutes,
      };
    }, [routeCoords, location]);
```

### 2.2 Control Flow Mapping Table

| Node | Type | Description | Outgoing Flows |
|------|------|-------------|----------------|
| **1** | Entry | Enter `useMemo` computation block. | Node 2 |
| **2** | Decision | Pre-condition guard check: `if (!routeCoords)`. | **True** → Return null<br>**False** → Node 3 |
| **3** | Action | Compute structural coordinates, Haversine total/remaining distances, progress ratio, and current speed. | Node 4 |
| **4** | Decision | Speed threshold guard check: `if (speed > 5)`. | **True** → Set speedForETA = speed → Node 5<br>**False** → Set speedForETA = 70 (fallback) → Node 5 |
| **5** | Return | Calculate active ETA hours/minutes, and return final telemetry object. | Exit useMemo |

### 2.3 Control Flow Graph (CFG)

![CFG for Telemetry & ETA Selector](file:///C:/Users/shivar/.gemini/antigravity-ide/brain/ff528ee6-1d44-415f-8a1b-43cb3c96c322/cfg_telemetry_eta_1779776547178.png)

---

## 3. GPS Telemetry Route Simulator Loop (`operator/tracking/page.tsx` — `useEffect` Simulator)

Source File: [tracking/page.tsx](file:///c:/Users/shivar/OneDrive/Desktop/redbus/src/app/operator/tracking/page.tsx#L320-L382)

This master simulator loop acts as the telemetry broadcaster, periodically calculating transit checkpoints along the route, computing bearings, and publishing updates.

### 3.1 Code Segmentation

```typescript
1   useEffect(() => {

2     if (!isPlaying || !selectedSchedule || !activeRoute) return;

3     const interval = setInterval(async () => {
        const { start, end } = activeRoute;
        const nextPercent = Math.min(simPercent + (0.5 * simSpeed), 100);
        const nextLat = start.lat + (end.lat - start.lat) * (nextPercent / 100);
        const nextLng = start.lng + (end.lng - start.lng) * (nextPercent / 100);
        const heading = getBearing(nextLat, nextLng, end.lat, end.lng);
        const speed = nextPercent >= 100 ? 0 : Math.round(85 + (Math.random() * 15));
        setSimPercent(nextPercent);
        setSimLocation([nextLat, nextLng]);
        setSimHeading(heading);
        setSimSpeedKmh(speed);
        try {
          await publishBusLocation({ ... });

4         if (nextPercent >= 100) {

5           setIsPlaying(false);
            await publishScheduleUpdate({ status: 'arrived' });
            toast.success('Simulation Completed! Trip set to arrived.');
            await loadSchedules();
          } else {

6           await publishScheduleUpdate({ status: 'en_route' });
          }
        } catch (err) {
          console.error(err);
        }
      }, 5000);

7     return () => clearInterval(interval);
    }, [isPlaying, simPercent, simSpeed, selectedSchedule, activeRoute, user]);
```

### 3.2 Control Flow Mapping Table

| Node | Type | Description | Outgoing Flows |
|------|------|-------------|----------------|
| **1** | Entry | Enter `useEffect` simulator hook block. | Node 2 |
| **2** | Decision | Guard check: `if (!isPlaying \|\| !selectedSchedule \|\| !activeRoute)`. | **True** → Exit (No action)<br>**False** → Node 3 |
| **3** | Action | Set up interval (5s). Interpolate step position coordinates, heading bearing, fluctuating speeds, and publish new coordinate to DB. | Node 4 (upon interval execution) |
| **4** | Decision | Completion guard check: `if (nextPercent >= 100)`. | **True** → Node 5<br>**False** → Node 6 |
| **5** | Action | Stop simulator, publish `'arrived'` update, trigger toast success, reload schedules list. | Loop cycle wait |
| **6** | Action | Publish `'en_route'` active schedule status timeline log. | Loop cycle wait |
| **7** | Cleanup | Return cleanup hook function clearing interval timer on schedule change or unmount. | Exit Effect |

### 3.3 Control Flow Graph (CFG)

![CFG for Route Simulator Loop](file:///C:/Users/shivar/.gemini/antigravity-ide/brain/ff528ee6-1d44-415f-8a1b-43cb3c96c322/cfg_route_simulator_1779776561935.png)

---

## 4. Admin Fleet Telemetry Aggregator (`admin/tracking/page.tsx` — `loadFleetData()`)

Source File: [tracking/page.tsx](file:///c:/Users/shivar/OneDrive/Desktop/redbus/src/app/admin/tracking/page.tsx#L88-L146)

This asynchronous aggregator queries schedules and telemetry points globally, resolving matching entities and grouping records client-side.

### 4.1 Code Segmentation

```typescript
1   const loadFleetData = async () => {
      try {
        setLoading(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedules')
          .select(...)
          .gte('departure_time', today.toISOString());

2       if (scheduleError) throw scheduleError;

3       setSchedules((scheduleData as unknown as ActiveSchedule[]) ?? []);
        const { data: locationData, error: locationError } = await supabase
          .from('bus_locations')
          .select(...)
          .order('recorded_at', { ascending: false });

4       if (locationError) throw locationError;

5       const latestLocations: Record<string, BusLocation> = {};
        (locationData ?? []).forEach((loc) => {
          if (!latestLocations[loc.schedule_id]) {
            latestLocations[loc.schedule_id] = loc as BusLocation;
          }
        });
        setLocations(latestLocations);

6     } catch (err: any) {
        toast.error('Failed to connect to transit operations network.');
        console.error(err);
      } finally {

7       setLoading(false);
      }
    };
```

### 4.2 Control Flow Mapping Table

| Node | Type | Description | Outgoing Flows |
|------|------|-------------|----------------|
| **1** | Entry | Enter `loadFleetData` routine, toggle loading state, and query today's schedules. | Node 2 |
| **2** | Decision | Error validation: `if (scheduleError)`. | **True** → Node 6 (Catch)<br>**False** → Node 3 |
| **3** | Action | Set schedules state and query raw historical bus locations. | Node 4 |
| **4** | Decision | Error validation: `if (locationError)`. | **True** → Node 6 (Catch)<br>**False** → Node 5 |
| **5** | Action | Group location coordinates client-side to keep only the latest pin, and set locations state. | Node 7 (Finally) |
| **6** | Catch | Execute error handling block, trigger error toast alerts, and print console stack logs. | Node 7 (Finally) |
| **7** | Finally | Reset network operations loading state: `setLoading(false)`. | Exit function |

### 4.3 Control Flow Graph (CFG)

![CFG for Fleet Telemetry Aggregator](file:///C:/Users/shivar/.gemini/antigravity-ide/brain/ff528ee6-1d44-415f-8a1b-43cb3c96c322/cfg_fleet_aggregator_1779776577388.png)
