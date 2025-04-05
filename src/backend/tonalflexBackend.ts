import { ref, computed } from 'vue';
import SushiAudioGraphController from '@/backend/sushi/audioGraphController';
import SushiSessionController from '@/backend/sushi/sessionController';
import SushiCvGateController from '@/backend/sushi/cvGateController';
import SushiNotificationController from '@/backend/sushi/notificationController';
import SushiParameterController from '@/backend/sushi/parameterController';
import ButlerController from '@/backend/butler/butler-functions';
import { pluginList } from '@/components/plugins/pluginIndex';
import { PluginType_Type, AudioConnection, ProcessorInfo, CvConnection, GateConnection, ParameterNotificationBlocklist, ParameterUpdate } from '@/proto/sushi/sushi_rpc';
import type { Plugin, Track } from '@/types/tonalflex';

const BASE_URL = 'http://192.168.132.108:8081';

const audioGraph = new SushiAudioGraphController(BASE_URL + "/sushi");
const sessionController = new SushiSessionController(BASE_URL + "/sushi");
const cvGateController = new SushiCvGateController(BASE_URL + "/sushi");
const notificationController = new SushiNotificationController(BASE_URL + "/sushi");
const parameterController = new SushiParameterController(BASE_URL + "/sushi");
const butler = new ButlerController(BASE_URL + "/butler");

const SESSION_KEY = 'tonalflex_session';
const INTERNAL_SESSION_KEY = 'sushi_internal_session';

export const pluginTracks = ref<Track[]>([]);
export const currentTrackIndex = ref(0);
export const sessionReady = ref(false);
export const visibleTrackCount = ref(1);

export const trackNames = computed(() => pluginTracks.value.map(t => t.name));
export const currentTrack = computed(() => pluginTracks.value[currentTrackIndex.value]);
export const visibleTracks = computed(() => pluginTracks.value.slice(0, visibleTrackCount.value));

export const initializeTonalflexSession = async (): Promise<void> => {
  const savedUI = loadFrontendSession();
  const sushiTracks = await audioGraph.getAllTracks();
  const sushiPlugins = await Promise.all(sushiTracks.map(t => audioGraph.getTrackProcessors(t.id)));

  if (!savedUI || savedUI.tracks.length === 0) {
    console.log('[Init] No local frontend session — using default pluginTracks');
    pluginTracks.value = sushiTracks
      .filter(t => t.name.startsWith('Track'))
      .map(t => ({ name: t.name, plugins: [{ id: '', parameters: {} }] }));
    sessionReady.value = true;
    return;
  }

  pluginTracks.value = savedUI.tracks;
  sessionReady.value = true;
};

export const addPluginToTrack = async (trackName: string, pluginId: string): Promise<void> => {
  const allTracks = await audioGraph.getAllTracks();
  const track = allTracks.find(t => t.name === trackName);
  if (!track) throw new Error(`Track '${trackName}' not found`);

  const plugin = pluginList.find(p => p.id === pluginId);
  if (!plugin) throw new Error(`Plugin '${pluginId}' not found`);

  await audioGraph.createProcessorOnTrack(
    track.id,
    plugin.name,
    {
      internal: PluginType_Type.INTERNAL,
      vst2x: PluginType_Type.VST2X,
      vst3x: PluginType_Type.VST3X,
      lv2: PluginType_Type.LV2,
    }[plugin.type],
    plugin.uid,
    plugin.path
  );
};

export const rebuildPluginChain = async (
  trackName: string,
  plugins: Plugin[]
): Promise<void> => {
  const allTracks = await audioGraph.getAllTracks();
  const track = allTracks.find(t => t.name === trackName);
  if (!track) throw new Error(`Track '${trackName}' not found`);

  const processors = await audioGraph.getTrackProcessors(track.id);
  for (const p of processors) {
    if (!['send', 'return'].includes(p.name.toLowerCase())) {
      await audioGraph.deleteProcessorFromTrack({
        processor: { id: p.id },
        track: { id: track.id }
      });
    }
  }

  for (const plugin of plugins.filter(p => p.id !== '')) {
    const def = pluginList.find(p => p.id === plugin.id);
    if (!def) continue;

    await audioGraph.createProcessorOnTrack(
      track.id,
      def.name,
      {
        internal: PluginType_Type.INTERNAL,
        vst2x: PluginType_Type.VST2X,
        vst3x: PluginType_Type.VST3X,
        lv2: PluginType_Type.LV2,
      }[def.type],
      def.uid,
      def.path
    );
  }

  const sendDef = pluginList.find(p => p.id === 'send');
  if (sendDef) {
    await audioGraph.createProcessorOnTrack(
      track.id,
      sendDef.name,
      PluginType_Type.INTERNAL,
      sendDef.uid,
      sendDef.path
    );
  }
};

export const saveSessionSnapshot = async (): Promise<void> => {
  try {
    const sushiState = await sessionController.saveSession();
    localStorage.setItem(INTERNAL_SESSION_KEY, JSON.stringify(sushiState));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ tracks: pluginTracks.value }));
    console.log('[Session] Snapshot saved');
  } catch (error) {
    console.error('[Session] Failed to save session:', error);
  }
};

export const loadFrontendSession = (): { tracks: Track[] } | null => {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

export const restoreFrontendSession = async (data: { tracks: Track[] }): Promise<void> => {
  pluginTracks.value = data.tracks;
};

export const saveNamedSession = async (name: string, json: string): Promise<void> => {
  await butler.saveSession(name, json);
};

export const loadNamedSession = async (name: string): Promise<string | null> => {
  const response = await butler.loadSession(name);
  return response.found ? response.jsonData : null;
};

export const listSavedSessions = async (): Promise<string[]> => {
  const response = await butler.listSessions();
  return response.sessionNames;
};

export const deleteSavedSession = async (name: string): Promise<void> => {
  await butler.deleteSession(name);
};
