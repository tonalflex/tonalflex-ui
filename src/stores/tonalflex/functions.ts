// src/stores/tonalflex/functions.ts
import SushiAudioGraphController from '@/stores/sushi/audioGraphController';
import SushiAudioRoutingController from '@/stores/sushi/audioRoutingController';
import type { Track, Plugin, TrackInfo, ProcessorInfo, AudioConnection } from '@/types/sushiTypes';
import { PluginType_Type } from '@/proto/sushi/sushi_rpc';

const SUSHI_BASE_URL = 'http://sushi-pi.local:8081';

const audioGraphController = new SushiAudioGraphController(SUSHI_BASE_URL);
const audioRoutingController = new SushiAudioRoutingController(SUSHI_BASE_URL);

const DEFAULT_CHANNELS = 2;

export const fetchChannels = async (): Promise<Track[]> => {
  try {
    const tracks: TrackInfo[] = await audioGraphController.getAllTracks();
    return tracks.map((track, index) => ({
      id: track.id.toString(),
      name: track.name || `Channel ${index + 1}`,
      plugins: [], // Populate if needed
    }));
  } catch (error) {
    console.error('Error fetching channels from Sushi:', error);
    return [];
  }
};

export const addChannel = async (channelName: string): Promise<void> => {
  try {
    await audioGraphController.createTrack(channelName, DEFAULT_CHANNELS);
    console.log(`Added channel '${channelName}'`);
  } catch (error) {
    console.error('Error adding channel to Sushi:', error);
    throw error;
  }
};

export const removeChannel = async (trackIndex: number): Promise<void> => {
  try {
    const tracks: TrackInfo[] = await audioGraphController.getAllTracks();
    if (trackIndex >= tracks.length || trackIndex < 0) {
      throw new Error(`Invalid track index: ${trackIndex}`);
    }
    const trackId = tracks[trackIndex].id;
    await audioGraphController.deleteTrack(trackId);
    console.log(`Removed channel at index ${trackIndex} (ID: ${trackId})`);
  } catch (error) {
    console.error('Error removing channel from Sushi:', error);
    throw error;
  }
};

export const addPluginToChannel = async (trackIndex: number, pluginId: string): Promise<void> => {
  try {
    const tracks: TrackInfo[] = await audioGraphController.getAllTracks();
    if (trackIndex >= tracks.length || trackIndex < 0) {
      throw new Error(`Invalid track index: ${trackIndex}`);
    }
    const trackId = tracks[trackIndex].id;

    const pluginMap: Record<string, { name: string; type: string; uid?: string; path?: string }> = {
      'reverb': { name: 'reverb', type: 'internal', uid: 'sushi.effects.reverb' },
      'delay': { name: 'delay', type: 'internal', uid: 'sushi.effects.delay' },
      'distortion': { name: 'distortion', type: 'internal', uid: 'sushi.effects.distortion' },
      'chorus': { name: 'chorus', type: 'internal', uid: 'sushi.effects.chorus' },
      'neuralamp': { name: 'neuralamp', type: 'vst3x', path: '/path/to/neuralamp.vst3' },
    };

    const pluginConfig = pluginMap[pluginId];
    if (!pluginConfig) throw new Error(`Unknown plugin ID: ${pluginId}`);

    const typeMap: Record<string, PluginType_Type> = {
      'internal': PluginType_Type.INTERNAL, // 1
      'vst2x': PluginType_Type.VST2X,       // 2
      'vst3x': PluginType_Type.VST3X,       // 3
      'lv2': PluginType_Type.LV2,           // 4
    };
    const pluginType = typeMap[pluginConfig.type.toLowerCase()];
    if (pluginType === undefined) throw new Error(`Invalid plugin type: ${pluginConfig.type}`);

    await audioGraphController.createProcessorOnTrack(
      trackId,
      pluginConfig.name,
      pluginType,
      pluginConfig.uid,
      pluginConfig.path
    );
    console.log(`Added plugin '${pluginId}' to track ID ${trackId}`);
  } catch (error) {
    console.error('Error adding plugin to Sushi:', error);
    throw error;
  }
};

export const reorderPluginsOnChannel = async (trackIndex: number, processorId: number, newPosition: number): Promise<void> => {
  try {
    const tracks: TrackInfo[] = await audioGraphController.getAllTracks();
    if (trackIndex >= tracks.length || trackIndex < 0) {
      throw new Error(`Invalid track index: ${trackIndex}`);
    }
    const trackId = tracks[trackIndex].id;
    const processors = await audioGraphController.getTrackProcessors(trackId);

    // Filter out null processors if any
    const validProcessors = processors.filter((p) => p.id !== undefined);

    if (!validProcessors.some(p => p.id === processorId)) {
      throw new Error(`Invalid processor ID: ${processorId}`);
    }
    if (newPosition < 0 || newPosition >= validProcessors.length) {
      throw new Error(`Invalid new position: ${newPosition}`);
    }

    let position: { addToBack?: boolean; beforeProcessorId?: number } = {};
    if (newPosition === validProcessors.length - 1) {
      // Move to the end
      position = { addToBack: true };
    } else {
      // Move before the processor currently at newPosition + 1
      const beforeProcessor = validProcessors[newPosition + 1];
      position = { beforeProcessorId: beforeProcessor.id };
    }

    await audioGraphController.moveProcessorOnTrack(processorId, trackId, trackId, position);
    console.log(`Reordered processor ID ${processorId} to position ${newPosition} on track ID ${trackId}`);
  } catch (error) {
    console.error('Error reordering plugins in Sushi:', error);
    throw error;
  }
};

export const removePluginFromChannel = async (trackIndex: number, processorId: number): Promise<void> => {
  try {
    const tracks: TrackInfo[] = await audioGraphController.getAllTracks();
    if (trackIndex >= tracks.length || trackIndex < 0) {
      throw new Error(`Invalid track index: ${trackIndex}`);
    }
    const trackId = tracks[trackIndex].id;
    await audioGraphController.deleteProcessorFromTrack({ processor: { id: processorId }, track: { id: trackId } });
    console.log(`Removed processor ID ${processorId} from track ID ${trackId}`);
  } catch (error) {
    console.error('Error removing plugin from Sushi:', error);
    throw error;
  }
};