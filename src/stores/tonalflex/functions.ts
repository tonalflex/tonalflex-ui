// src/stores/tonalflex/functions.ts
import AudioGraphController from '@/stores/sushi/audioGraphController'; // Adjust path as needed
import { TrackInfo, ProcessorInfo } from '@/proto/sushi/sushi_rpc'; // Import Sushi types
// Sushi base URL (replace with your dynamic IP solution later)
const SUSHI_BASE_URL = 'http://sushi-pi.local:8081'; // Placeholder

// Instantiate the Sushi AudioGraphController
const audioGraphController = new AudioGraphController(SUSHI_BASE_URL);

// Define the Track type expected by EffectMap.vue
interface Plugin {
  id: string | null;
  slotId: number;
}

interface Track {
  name: string;
  plugins: Plugin[];
}

// Frontend-specific function to fetch channels (tracks)
export const fetchChannels = async (): Promise<Track[]> => {
  try {
    const tracks: TrackInfo[] = await audioGraphController.getAllTracks();
    // Map Sushi TrackInfo to frontend Track format
    return tracks.map((track: TrackInfo, index: number) => ({
      name: track.name || `Track ${index + 1}`, // Use Sushi track name or fallback
      plugins: track.processors?.map((proc: ProcessorInfo, slotIndex: number) => ({
        id: proc.name || null, // Use processor name as plugin ID, null if empty
        slotId: slotIndex + 1, // Assign slot ID based on position (1-based)
      })) || [{ id: null, slotId: 1 }], // Default to one empty slot if no processors
    }));
  } catch (error) {
    console.error('Error fetching channels from Sushi:', error);
    return []; // Return empty array on failure
  }
};

// Frontend-specific function to add a channel (track)
export const addChannel = async (name: string): Promise<void> => {
  try {
    // Sushi requires a channel count; default to 2 (stereo) for simplicity
    await audioGraphController.createTrack(name, 2);
    console.log(`Added track '${name}' to Sushi`);
  } catch (error) {
    console.error('Error adding channel to Sushi:', error);
    throw error; // Let EffectMap.vue handle the fallback
  }
};

// Frontend-specific function to remove a channel (track)
export const removeChannel = async (index: number): Promise<void> => {
  try {
    // Get all tracks to find the track ID at the given index
    const tracks: TrackInfo[] = await audioGraphController.getAllTracks();
    if (index >= tracks.length || index < 0) {
      throw new Error(`Invalid track index: ${index}`);
    }
    const trackId = tracks[index].id;
    await audioGraphController.deleteTrack(trackId);
    console.log(`Removed track at index ${index} (ID: ${trackId}) from Sushi`);
  } catch (error) {
    console.error('Error removing channel from Sushi:', error);
    throw error; // Let EffectMap.vue handle the fallback
  }
};