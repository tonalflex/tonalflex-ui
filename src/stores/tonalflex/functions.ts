// src/stores/tonalflex/functions.ts
import SushiAudioGraphController from '@/stores/sushi/audioGraphController';
import SushiAudioRoutingController from '@/stores/sushi/audioRoutingController';
import SushiSessionController from '@/stores/sushi/sessionController';
import SushiCvGateController from '@/stores/sushi/cvGateController';
import { pluginList } from '@/components/plugins/pluginIndex';
import { 
  PluginType_Type, 
  TrackInfo, 
  AudioConnection, 
  ProcessorInfo, 
  CvConnection,
  GateConnection,
} from '@/proto/sushi/sushi_rpc';

const BASE_URL = 'http://sushi-pi.local:8081';

const audioGraph = new SushiAudioGraphController(BASE_URL);
const audioRouting = new SushiAudioRoutingController(BASE_URL);
const sessionController = new SushiSessionController(BASE_URL);
const cvGateController = new SushiCvGateController(BASE_URL);

const MAIN_OUTPUT_TRACK_NAME = 'MainOut';
const SESSION_KEY = 'tonalflex_session';
const INTERNAL_SESSION_KEY = 'sushi_internal_session';

const BASE_TRACKS = ['MainOut', 'Tuner', 'Looper', 'Metronome'];

export const initializeTonalflexSession = async (): Promise<void> => {
  const tracks = await audioGraph.getAllTracks();

  if (tracks.length === 0) {
    console.log('[Init] No existing tracks — cold start');
    await initializeSushi();
    await saveSessionSnapshot();
    return;
  }

  const savedUI = loadFrontendSession();
  if (savedUI) {
    console.log('[Init] Restoring frontend state...');
    await restoreFrontendSession(savedUI);
  }

  try {
    const sushiSavedRaw = localStorage.getItem(INTERNAL_SESSION_KEY);
    if (sushiSavedRaw) {
      const sushiSaved = JSON.parse(sushiSavedRaw);
      if (sushiSaved.tracks) {
        console.log('[Init] Restoring internal Sushi graph...');
        await sessionController.restoreSession(sushiSaved);
      }
    }
  } catch {
    console.warn('[Init] No valid Sushi session found or failed to restore');
  }
};

export const initializeSushi = async (): Promise<void> => {
  const existing = await audioGraph.getAllTracks();
  const existingNames = existing.map(t => t.name);
  const missing = BASE_TRACKS.filter(name => !existingNames.includes(name));

  for (const name of missing) {
    await audioGraph.createTrack(name, 2);
    console.log(`[Init] Created missing track: '${name}'`);
  }

  const updated = await audioGraph.getAllTracks();
  const mainOut = updated.find(t => t.name === MAIN_OUTPUT_TRACK_NAME);

  if (mainOut) {
    await connectCvAndGateToTrackVolume(mainOut.id);
  } else {
    console.warn(`[Init] Could not find '${MAIN_OUTPUT_TRACK_NAME}' for CV/Gate connection`);
  }
};

export const createNewPluginChain = async (baseName: string): Promise<string> => {
  const tracks = await audioGraph.getAllTracks();
  let name = baseName;
  let suffix = 2;

  while (tracks.some(t => t.name === name)) {
    name = `${baseName} (${suffix++})`;
  }

  await audioGraph.createTrack(name, 2);
  console.log(`[Chain] Created new plugin chain '${name}'`);

  const mainOut = tracks.find(t => t.name === MAIN_OUTPUT_TRACK_NAME);
  const newTrack = (await audioGraph.getAllTracks()).find(t => t.name === name);

  if (mainOut && newTrack) {
    const conn: AudioConnection = {
      track: { id: newTrack.id },
      trackChannel: 0,
      engineChannel: 0,
    };
    await audioRouting.connectOutputChannelFromTrack(conn);
    console.log(`[Chain] Routed '${name}' to '${MAIN_OUTPUT_TRACK_NAME}'`);
  }

  return name;
};

export const createTrackAndRouteToMain = async (name: string): Promise<TrackInfo> => {
  await audioGraph.createTrack(name, 2);
  const tracks = await audioGraph.getAllTracks();

  const track = tracks.find(t => t.name === name);
  const mainOut = tracks.find(t => t.name === MAIN_OUTPUT_TRACK_NAME);

  if (track && mainOut) {
    const connToMainOut: AudioConnection = {
      track: { id: track.id },
      trackChannel: 0,
      engineChannel: 0,
    };
    await audioRouting.connectOutputChannelFromTrack(connToMainOut);
    console.log(`Track '${name}' routed to '${MAIN_OUTPUT_TRACK_NAME}'`);
    return track;
  }

  throw new Error(`Missing track(s): ${name} or ${MAIN_OUTPUT_TRACK_NAME}`);
};

export const addPluginToTrackByName = async (trackName: string, pluginId: string): Promise<void> => {
  const tracks = await audioGraph.getAllTracks();
  const track = tracks.find(t => t.name === trackName);
  if (!track) throw new Error(`Track '${trackName}' not found`);

  const plugin = pluginList.find(p => p.id === pluginId);
  if (!plugin) throw new Error(`Plugin '${pluginId}' not found`);

  const pluginType = {
    internal: PluginType_Type.INTERNAL,
    vst2x: PluginType_Type.VST2X,
    vst3x: PluginType_Type.VST3X,
    lv2: PluginType_Type.LV2,
  }[plugin.type];

  await audioGraph.createProcessorOnTrack(
    track.id,
    plugin.name,
    pluginType,
    plugin.uid,
    plugin.path
  );
};

export const addPluginToChain = async (pluginId: string, afterTrackName: string): Promise<string> => {
  const allTracks = await audioGraph.getAllTracks();

  const afterTrack = allTracks.find(t => t.name === afterTrackName);
  if (!afterTrack) throw new Error(`Track '${afterTrackName}' not found`);

  // Find next available plugin track name
  let i = 1;
  let newTrackName = `Plugin ${i}`;
  while (allTracks.some(t => t.name === newTrackName)) {
    i++;
    newTrackName = `Plugin ${i}`;
  }

  // Create new track and load plugin
  await audioGraph.createTrack(newTrackName, 2);
  await addPluginToTrackByName(newTrackName, pluginId);

  const newTrack = (await audioGraph.getAllTracks()).find(t => t.name === newTrackName);
  if (!newTrack) throw new Error('Failed to create plugin track');

  // Route afterTrack → newTrack
  const chainConn: AudioConnection = {
    track: { id: afterTrack.id },
    trackChannel: 0,
    engineChannel: 0,
  };
  await audioRouting.connectOutputChannelFromTrack(chainConn);

  // Route newTrack → MainOut
  const mainOut = allTracks.find(t => t.name === MAIN_OUTPUT_TRACK_NAME);
  if (mainOut) {
    const finalConn: AudioConnection = {
      track: { id: newTrack.id },
      trackChannel: 0,
      engineChannel: 0,
    };
    await audioRouting.connectOutputChannelFromTrack(finalConn);
  }

  console.log(`[Chain] Inserted '${pluginId}' after '${afterTrackName}' as '${newTrackName}'`);
  return newTrackName;
};

export const connectCvAndGateToTrackVolume = async (trackId: number): Promise<void> => {
  try {
    const processors = await audioGraph.getTrackProcessors(trackId);

    const volumeProc = processors.find(
      (p) => p.name.toLowerCase().includes('volume')
    );

    if (!volumeProc) {
      throw new Error(`No volume processor found on track ${trackId}`);
    }

    const processorId = volumeProc.id;

    const cvConnection: CvConnection = {
      parameter: {
        processorId,
        parameterId: 0
      },
      cvPortId: 0
    };

    const gateConnection: GateConnection = {
      processor: { id: processorId },
      gatePortId: 0,
      channel: 0,
      noteNo: 0
    };

    await cvGateController.connectCvInputToParameter(cvConnection);
    await cvGateController.connectGateInputToProcessor(gateConnection);

    console.log(`[CV/Gate] Connected to volume processor on track ${trackId}`);
  } catch (error) {
    console.error('[CV/Gate] Failed to connect to volume processor:', error);
  }
};

interface SavedPlugin {
  id: string;
}

interface SavedTrack {
  name: string;
  plugins: SavedPlugin[];
}

interface FrontendSessionData {
  tracks: SavedTrack[];
}

export const saveSessionSnapshot = async (): Promise<void> => {
  try {
    const sushiState = await sessionController.saveSession();
    localStorage.setItem(INTERNAL_SESSION_KEY, JSON.stringify(sushiState));

    const tracks = await audioGraph.getAllTracks();
    const simplified: SavedTrack[] = await Promise.all(tracks.map(async (track) => {
      const plugins: ProcessorInfo[] = await audioGraph.getTrackProcessors(track.id);
      return {
        name: track.name,
        plugins: plugins.map(p => ({ id: p.name }))
      };
    }));

    saveFrontendSession({ tracks: simplified });
    console.log('[Session] Snapshot saved');
  } catch (error) {
    console.error('[Session] Failed to save session:', error);
  }
};

export const saveFrontendSession = (data: FrontendSessionData): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
};

export const loadFrontendSession = (): FrontendSessionData | null => {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) as FrontendSessionData : null;
};

export const restoreFrontendSession = async (data: FrontendSessionData): Promise<void> => {
  for (const track of data.tracks) {
    const exists = (await audioGraph.getAllTracks()).some(t => t.name === track.name);
    if (!exists) await createTrackAndRouteToMain(track.name);

    for (const plugin of track.plugins) {
      await addPluginToTrackByName(track.name, plugin.id);
    }
  }
};
