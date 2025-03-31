export interface SavedSession {
    name: string;
    created: string;
    version: number;
  
    tracks: {
      name: string;
      plugins: {
        id: string;
        parameters?: Record<string, number>; // param ID or name → value
      }[];
      next?: string; // for chaining (serial)
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
  
  export const saveFullSession = async (sessionName: string): Promise<SavedSession> => {
    const tracks = await audioGraph.getAllTracks();
  
    const savedTracks = await Promise.all(
      tracks.map(async (track) => {
        const processors = await audioGraph.getTrackProcessors(track.id);
  
        const plugins = await Promise.all(
          processors.map(async (proc) => {
            const parameters = await audioGraph.getProcessorParameters(track.id, proc.id);
            const paramValues: Record<string, number> = {};
  
            parameters.forEach(param => {
              paramValues[param.name || `param${param.id}`] = param.normalizedValue ?? 0;
            });
  
            return {
              id: proc.name,
              parameters: paramValues
            };
          })
        );
  
        return {
          name: track.name,
          plugins,
          sendsToMain: true, // TODO: Replace with real routing logic
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
        parameterId: 0
      },
      gate: {
        trackName: MAIN_OUTPUT_TRACK_NAME,
        processorName: 'volume'
      }
    };
  
    console.log(`[Session] Saved full session '${sessionName}'`);
    return saved;
  };
  
  export const loadFullSession = async (session: SavedSession): Promise<void> => {
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
            for (const [name, value] of Object.entries(plugin.parameters)) {
              await audioGraph.setProcessorParameterValue(track!.id, processor.id, name, value);
            }
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
  