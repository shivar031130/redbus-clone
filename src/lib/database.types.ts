export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'client' | 'operator'
          avatar_url: string | null
          phone_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'client' | 'operator'
          avatar_url?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'client' | 'operator'
          avatar_url?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      buses: {
        Row: {
          id: string
          operator_id: string
          plate_number: string
          bus_type: string
          total_seats: number
          amenities: Json
          image_url: string | null
          interior_image_url: string | null
          exterior_image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          operator_id: string
          plate_number: string
          bus_type: string
          total_seats: number
          amenities?: Json
          image_url?: string | null
          interior_image_url?: string | null
          exterior_image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          operator_id?: string
          plate_number?: string
          bus_type?: string
          total_seats?: number
          amenities?: Json
          image_url?: string | null
          interior_image_url?: string | null
          exterior_image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      seats: {
        Row: {
          id: string
          schedule_id: string
          bus_id: string
          seat_number: string
          status: 'available' | 'selected' | 'booked' | 'locked'
          locked_by: string | null
          locked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          bus_id: string
          seat_number: string
          status?: 'available' | 'selected' | 'booked' | 'locked'
          locked_by?: string | null
          locked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          bus_id?: string
          seat_number?: string
          status?: 'available' | 'selected' | 'booked' | 'locked'
          locked_by?: string | null
          locked_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          route_id: string
          bus_id: string
          departure_time: string
          arrival_time: string
          base_price: number
          status: string
          estimated_departure_time: string | null
          estimated_arrival_time: string | null
          delay_minutes: number | null
          live_status: string | null
          last_update_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          route_id: string
          bus_id: string
          departure_time: string
          arrival_time: string
          base_price: number
          status?: string
          estimated_departure_time?: string | null
          estimated_arrival_time?: string | null
          delay_minutes?: number | null
          live_status?: string | null
          last_update_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          route_id?: string
          bus_id?: string
          departure_time?: string
          arrival_time?: string
          base_price?: number
          status?: string
          estimated_departure_time?: string | null
          estimated_arrival_time?: string | null
          delay_minutes?: number | null
          live_status?: string | null
          last_update_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schedule_metrics: {
        Row: {
          schedule_id: string
          total_seats: number
          booked_seats: number
          locked_seats: number
          available_seats: number
          updated_at: string
        }
        Insert: {
          schedule_id: string
          total_seats?: number
          booked_seats?: number
          locked_seats?: number
          available_seats?: number
          updated_at?: string
        }
        Update: {
          schedule_id?: string
          total_seats?: number
          booked_seats?: number
          locked_seats?: number
          available_seats?: number
          updated_at?: string
        }
      }
      schedule_updates: {
        Row: {
          id: string
          schedule_id: string
          status: string
          message: string | null
          estimated_departure_time: string | null
          estimated_arrival_time: string | null
          delay_minutes: number | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          status: string
          message?: string | null
          estimated_departure_time?: string | null
          estimated_arrival_time?: string | null
          delay_minutes?: number | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          status?: string
          message?: string | null
          estimated_departure_time?: string | null
          estimated_arrival_time?: string | null
          delay_minutes?: number | null
          created_by?: string | null
          created_at?: string
        }
      }
      bus_locations: {
        Row: {
          id: string
          schedule_id: string
          bus_id: string | null
          latitude: number
          longitude: number
          heading: number | null
          speed_kmh: number | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          bus_id?: string | null
          latitude: number
          longitude: number
          heading?: number | null
          speed_kmh?: number | null
          recorded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          bus_id?: string | null
          latitude?: number
          longitude?: number
          heading?: number | null
          speed_kmh?: number | null
          recorded_at?: string
          created_at?: string
        }
      }
      chat_threads: {
        Row: {
          id: string
          booking_id: string
          client_id: string
          operator_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          client_id: string
          operator_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          client_id?: string
          operator_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          thread_id: string
          sender_id: string | null
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          sender_id?: string | null
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          sender_id?: string | null
          body?: string
          created_at?: string
        }
      }
      // Other tables (routes, bookings, payments, tickets, operators) go here
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'client' | 'operator'
      seat_status: 'available' | 'selected' | 'booked' | 'locked'
      booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
      payment_status: 'pending' | 'success' | 'failed' | 'refunded'
    }
  }
}
