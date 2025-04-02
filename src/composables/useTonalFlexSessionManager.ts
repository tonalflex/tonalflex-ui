// src/composables/useTonalFlexSessionManager.ts
import { ref } from 'vue';
import {
  audioGraph,
  audioRouting,
  connectCvAndGateToTrackVolume,
  addPluginToTrackByName,
  getPluginParameters,
  setPluginParameters,
  saveNamedSession,
  loadNamedSession,
  listSavedSessions,
  deleteSavedSession,
  BASE_TRACKS,
  MAIN_OUTPUT_TRACK_NAME
} from '@/backend/tonalflexBackend';
import type { AudioConnection } from '@/proto/sushi/sushi_rpc';

export interface SavedSession {
  name: string;
  created: string;
  version: number;
  tracks: {
    name: string;
    plugins: {
      id: string;
      parameters?: Record<string, number>;
    }[];
    next?: string;
    sendsToMain?: boolean;
  }[];
  cv?: {
    trackName: string;
    parameterId: number;
  };
  gate?: {
    trackName: string;
    processorName: string;
  };
}

const LOCAL_SESSION_KEY = 'tonalflex_saved_full_session';

export const useTonalFlexSessionManager = () => {
  const currentSession = ref<SavedSession | null>(null);

  const persistLocalSession = (session: SavedSession) => {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  };

  const saveFullSession = async (sessionName: string): Promise<void> => {
    const tracks = await audioGraph.getAllTracks();

    const savedTracks = await Promise.all(
      tracks.map(async (track) => {
        const processors = await audioGraph.getTrackProcessors(track.id);

        const plugins = await Promise.all(
          processors.map(async (proc) => {
            const parameters = await getPluginParameters(proc.id);
            return { id: proc.name, parameters };
          })
        );

        return {
          name: track.name,
          plugins,
          sendsToMain: true,
        };
      })
    );

    const saved: SavedSession = {
      name: sessionName,
      created: new Date().toISOString(),
      version: 1,
      tracks: savedTracks,
      cv: {
        trackName: MAIN_OUTPUT_TRACK_NAME,
        parameterId: 0,
      },
      gate: {
        trackName: MAIN_OUTPUT_TRACK_NAME,
        processorName: 'volume',
      },
    };

    currentSession.value = saved;
    await saveNamedSession(sessionName, JSON.stringify(saved));
    persistLocalSession(saved);
  };

  const loadFullSession = async (name: string): Promise<void> => {
    const loaded = await loadNamedSession(name);
    if (!loaded) return;

    const session: SavedSession = JSON.parse(loaded);
    currentSession.value = session;
    persistLocalSession(session);

    const existing = await audioGraph.getAllTracks();
    for (const t of existing) {
      if (!BASE_TRACKS.includes(t.name)) {
        await audioGraph.deleteTrack(t.id);
      }
    }

    for (const trackData of session.tracks) {
      await audioGraph.createTrack(trackData.name, 2);

      for (const plugin of trackData.plugins) {
        await addPluginToTrackByName(trackData.name, plugin.id);

        if (plugin.parameters) {
          const track = (await audioGraph.getAllTracks()).find(t => t.name === trackData.name);
          const processors = await audioGraph.getTrackProcessors(track!.id);
          const processor = processors.find(p => p.name === plugin.id);
          if (processor) {
            await setPluginParameters(processor.id, plugin.parameters);
          }
        }
      }

      if (trackData.sendsToMain) {
        const track = (await audioGraph.getAllTracks()).find(t => t.name === trackData.name);
        const conn: AudioConnection = {
          track: { id: track!.id },
          trackChannel: 0,
          engineChannel: 0,
        };
        await audioRouting.connectOutputChannelFromTrack(conn);
      }
    }

    if (session.cv) {
      const track = (await audioGraph.getAllTracks()).find(t => t.name === session.cv!.trackName);
      if (track) await connectCvAndGateToTrackVolume(track.id);
    }

    console.log(`[Session] Restored session '${session.name}'`);
  };

  const listSessions = async (): Promise<string[]> => {
    return await listSavedSessions();
  };

  const deleteSession = async (name: string): Promise<void> => {
    await deleteSavedSession(name);
  };

  return {
    currentSession,
    saveFullSession,
    loadFullSession,
    listSessions,
    deleteSession,
  };
};
