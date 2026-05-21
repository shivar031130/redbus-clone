import { createClient } from './client';

export async function seedDatabase() {
  const supabase = createClient();

  try {
    console.log("Starting DB seeding...");

    // 1. Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Please log in first to seed data associated with your profile.");
    }
    console.log("1. Authenticated user verified:", user.email);

    // 2. Ensure profile exists and has role
    const { data: profile, error: profileGetError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileGetError) {
      console.error("Failed to fetch profile:", profileGetError);
      throw new Error(`Profile fetch failed: ${profileGetError.message}`);
    }

    if (!profile) {
      console.log("Profile missing. Creating profile record...");
      const { error: profileInsertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email!,
        role: 'admin',
        full_name: 'Superb Admin'
      });
      if (profileInsertError) {
        console.error("Failed to insert profile:", profileInsertError);
        throw new Error(`Profile creation failed: ${profileInsertError.message}`);
      }
    } else {
      console.log("Profile exists. Elevating to admin...");
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);
        
      if (profileUpdateError) {
        console.error("Failed to update profile role:", profileUpdateError);
        throw new Error(`Profile elevation failed: ${profileUpdateError.message}`);
      }
    }
    console.log("2. Profile role elevated successfully");

    // 3. Create operator entry in operators table
    let operatorId = null;
    const { data: opData, error: opGetError } = await supabase
      .from('operators')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (opGetError) {
      console.error("Failed to query operators:", opGetError);
      throw new Error(`Operator fetch failed: ${opGetError.message}`);
    }

    if (opData) {
      operatorId = opData.id;
      console.log("Operator record already exists:", operatorId);
    } else {
      console.log("Creating new operator record...");
      const { data: newOp, error: newOpError } = await supabase
        .from('operators')
        .insert({
          profile_id: user.id,
          company_name: 'Aeroline Malaysia VIP',
          status: 'approved'
        })
        .select('id')
        .single();
      
      if (newOpError) {
        console.error("Failed to create operator:", newOpError);
        throw new Error(`Operator registration failed: ${newOpError.message}`);
      }
      operatorId = newOp.id;
    }
    console.log("3. Operator reference linked:", operatorId);

    // 4. Create Buses
    console.log("Creating buses...");
    const { data: bus, error: busError } = await supabase
      .from('buses')
      .insert([
        {
          plate_number: `VWY ${Math.floor(1000 + Math.random() * 9000)}`,
          bus_type: 'Executive VIP',
          total_seats: 30,
          amenities: ['Wifi', 'Charging Ports', 'Meals'],
          is_active: true,
          operator_id: operatorId
        },
        {
          plate_number: `JQM ${Math.floor(1000 + Math.random() * 9000)}`,
          bus_type: 'Economy Standard',
          total_seats: 44,
          amenities: ['Charging Ports'],
          is_active: true,
          operator_id: operatorId
        }
      ])
      .select();

    if (busError) {
      console.error("Failed to create buses:", busError);
      throw new Error(`Bus creation failed: ${busError.message}`);
    }
    const busId = bus[0].id;
    const busId2 = bus[1].id;
    const busSeatMap = new Map<string, number>([
      [busId, Number(bus[0].total_seats) || 0],
      [busId2, Number(bus[1].total_seats) || 0],
    ]);
    console.log("4. Buses registered successfully:", busId, busId2);

    // 5. Create Routes
    console.log("Creating routes...");
    const { data: routes, error: routeError } = await supabase
      .from('routes')
      .insert([
        {
          operator_id: operatorId,
          origin: 'Kuala Lumpur',
          destination: 'Penang',
          estimated_duration: '5 hours',
          boarding_points: ['TBS (Terminal Bersepadu Selatan)', 'KL Sentral', '1 Utama Bus Terminal'],
          dropoff_points: ['Sungai Nibong Terminal', 'Penang Sentral (Butterworth)', 'Juru Toll'],
          is_active: true
        },
        {
          operator_id: operatorId,
          origin: 'Kuala Lumpur',
          destination: 'Johor Bahru',
          estimated_duration: '4 hours',
          boarding_points: ['TBS (Terminal Bersepadu Selatan)', 'KL Sentral'],
          dropoff_points: ['Larkin Sentral', 'Tampoi Bus Stop', 'Skudai Toll'],
          is_active: true
        }
      ])
      .select();

    if (routeError) {
      console.error("Failed to create routes:", routeError);
      throw new Error(`Route creation failed: ${routeError.message}`);
    }
    const routeId = routes[0].id;
    const routeId2 = routes[1].id;
    console.log("5. Routes created successfully:", routeId, routeId2);

    // 6. Create Schedules
    console.log("Creating schedules...");
    const { data: schedules, error: schedError } = await supabase
      .from('schedules')
      .insert([
        {
          bus_id: busId,
          route_id: routeId,
          departure_time: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
          arrival_time: new Date(Date.now() + 86400000 * 2 + 18000000).toISOString(),
          base_price: 60.00,
          status: 'scheduled'
        },
        {
          bus_id: busId2,
          route_id: routeId2,
          departure_time: new Date(Date.now() + 86400000 * 2).toISOString(),
          arrival_time: new Date(Date.now() + 86400000 * 2 + 14400000).toISOString(),
          base_price: 35.00,
          status: 'scheduled'
        }
      ])
      .select();

    if (schedError) {
      console.error("Failed to create schedules:", schedError);
      throw new Error(`Schedule creation failed: ${schedError.message}`);
    }
    console.log("6. Schedules registered successfully");

    // 7. Populate live seats for each schedule
    console.log("Populating seat grid database...");
    const columns = ['A', 'B', 'C'];

    for (const schedule of schedules) {
      const seatsToInsert = [];
      const seatCount = busSeatMap.get(schedule.bus_id) ?? 0;

      for (let i = 0; i < seatCount; i += 1) {
        const row = Math.floor(i / columns.length) + 1;
        const column = columns[i % columns.length];
        seatsToInsert.push({
          schedule_id: schedule.id,
          bus_id: schedule.bus_id,
          seat_number: `${row}${column}`,
          status: Math.random() > 0.85 ? 'booked' : 'available'
        });
      }
      
      const { error: seatInsertError } = await supabase
        .from('seats')
        .insert(seatsToInsert);
        
      if (seatInsertError) {
        console.error("Failed to insert seat layout:", seatInsertError);
      }
    }
    console.log("7. Seat grids created successfully!");

    // 8. Seed live schedule updates & bus tracking (best-effort)
    try {
      const nowIso = new Date().toISOString();
      const scheduleIds = schedules.map((s: any) => s.id);

      const scheduleUpdates = schedules.map((s: any) => ({
        schedule_id: s.id,
        status: 'scheduled',
        message: 'On time. Live tracking enabled.',
        estimated_departure_time: s.departure_time,
        estimated_arrival_time: s.arrival_time,
        delay_minutes: 0,
        created_by: user.id,
      }));

      await supabase.from('schedule_updates').insert(scheduleUpdates);
      for (const s of schedules) {
        await supabase
          .from('schedules')
          .update({
            estimated_departure_time: s.departure_time ?? null,
            estimated_arrival_time: s.arrival_time ?? null,
            delay_minutes: 0,
            live_status: 'scheduled',
            last_update_at: nowIso,
          })
          .eq('id', s.id);
      }

      const locationSeed = [
        { lat: 3.139, lng: 101.6869 }, // Kuala Lumpur
        { lat: 1.4927, lng: 103.7414 }, // Johor Bahru
      ];

      const busLocations = schedules.map((s: any, idx: number) => ({
        schedule_id: s.id,
        bus_id: s.bus_id,
        latitude: locationSeed[idx % locationSeed.length].lat,
        longitude: locationSeed[idx % locationSeed.length].lng,
        heading: 90,
        speed_kmh: 60,
      }));

      await supabase.from('bus_locations').insert(busLocations);
      console.log("8. Live updates and tracking seeded.");
    } catch (seedErr: any) {
      console.warn('Live updates seed skipped:', seedErr?.message ?? seedErr);
    }

    return { success: true, message: "Database successfully seeded with live buses, schedules, routes, seat layouts, and realtime updates!" };

  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.error("Seeding failed with critical error:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
