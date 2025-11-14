"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Presence tracking hook
 *
 * Updates user's last_seen timestamp periodically to track online status
 * - Updates every 60 seconds while user is active
 * - Sets status to 'online' when active
 * - Status is calculated in UI based on last_seen timestamp
 */
export function usePresence() {
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const supabase = createClient();

    const updatePresence = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Update last_seen timestamp and set status to online
          await supabase
            .from("profiles")
            .update({
              last_seen: new Date().toISOString(),
              status: "online"
            })
            .eq("id", user.id);
        }
      } catch (error) {
        console.error("Error updating presence:", error);
      }
    };

    // Update immediately
    updatePresence();

    // Then update every 60 seconds
    intervalRef.current = setInterval(updatePresence, 60000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
