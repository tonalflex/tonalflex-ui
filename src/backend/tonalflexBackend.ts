import { ref, computed, defineAsyncComponent } from 'vue';
import SushiAudioGraphController from '@/backend/sushi/audioGraphController';
import SushiSessionController from '@/backend/sushi/sessionController';
import ButlerController from '@/backend/butler/butler-functions';
import type { Plugin, Track, PluginMeta, PluginModule } from '@/types/tonalflex';

const BASE_URL = 'http://192.168.0.10:8081';

const audioGraph = new SushiAudioGraphController(BASE_URL + "/sushi");
const sessionController = new SushiSessionController(BASE_URL + "/sushi");
const butler = new ButlerController(BASE_URL + "/butler");

const SESSION_KEY = 'tonalflex_session';
const INTERNAL_SESSION_KEY = 'sushi_internal_session';

export const pluginTracks = ref<Track[]>([]);
export const currentTrackIndex = ref(0);
export const sessionReady = ref(false);
export const visibleTrackCount = ref(1);

export const sushiTrackRoles = {
  pre: ref<number | null>(null),
  post: ref<number | null>(null),
  user: ref<{ id: number; name: string }[]>([])
};

const internalPluginIds = ['send', 'return'];
export const userPluginList = ref<PluginMeta[]>([]);
export const systemPluginList = ref<PluginMeta[]>([]);

const uiModules: Record<string, () => Promise<PluginModule>> =
  import.meta.glob('../../node_modules/@tonalflex/*/dist/plugin-ui.es.js') as Record<string, () => Promise<PluginModule>>;

  export const loadAvailablePlugins = async () => {
    const plugins: PluginMeta[] = [];
  
    for (const path in uiModules) {
      try {
        const basePath = path.replace('/plugin-ui.es.js', '');
  
        const [metadata, image] = await Promise.all([
          fetch(`${basePath}/metadata.json`).then(res => res.json()).catch(() => ({})),
          fetch(`${basePath}/log.svg`)
            .then(res => res.ok ? `${basePath}/logo.svg` : '/tonalflex.svg')
            .catch(() => '/tonalflex.svg'),
        ]);
  
        const meta: PluginMeta = {
          id: metadata.id || path,
          name: metadata.name,
          type: metadata.type || 'vst3x',
          uid: metadata.uid,
          path: metadata.path,
          image,
          description: metadata.description || '',
          isSystem: metadata["system-plugin"] === "true",
          component: defineAsyncComponent(() => uiModules[path]()),
        };
  
        plugins.push(meta);
      } catch (e) {
        console.warn(`[PluginLoader] Failed to load ${path}:`, e);
      }
    }
  
    userPluginList.value = plugins.filter(p => !p.isSystem);
    systemPluginList.value = plugins.filter(p => p.isSystem);
  };

export const trackNames = computed(() => visibleTracks.value.map(t => t.alias));
export const currentTrack = computed(() => visibleTracks.value[currentTrackIndex.value]);

export const pluginTrackIds = computed(() =>
  sushiTrackRoles.user.value.map(t => t.id)
);

export const trackListItems = computed(() =>
  visibleTracks.value.map(track => ({
    name: track.alias || track.name
  }))
);

export const visibleTracks = computed(() =>
  pluginTracks.value
    .filter(t => /^Track[0-9]+$/.test(t.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, visibleTrackCount.value)
);

export const filteredPlugins = (plugins: Plugin[]): Plugin[] => {
  return plugins.filter(p => !internalPluginIds.includes(p.id));
};

export const availableEffects = computed(() =>
  userPluginList.value
);

export const initializeTonalflexSession = async (): Promise<void> => {
  await loadAvailablePlugins();

  const savedUI = loadFrontendSession();
  const sushiTracks = await audioGraph.getAllTracks();

  sushiTrackRoles.pre.value = sushiTracks.find(t => t.name === 'Track_Pre')?.id ?? null;
  sushiTrackRoles.post.value = sushiTracks.find(t => t.name === 'Track_Post')?.id ?? null;
  sushiTrackRoles.user.value = sushiTracks
    .filter(t => /^Track[1-8]$/.test(t.name))
    .map(t => ({ id: t.id, name: t.name }));

  const defaultState = sushiTrackRoles.user.value.map(t => ({
    id: t.id,
    name: t.name,
    alias: t.name,
    plugins: [{ id: '', parameters: {} }]
  }));

  if (!savedUI || savedUI.tracks.length === 0) {
    console.log('[Init] No local frontend session — using Sushi base tracks');
    pluginTracks.value = defaultState;
    await saveSessionSnapshot();
    sessionReady.value = true;
    return;
  }

  const aligned = await isSessionAligned(savedUI.tracks);
  if (aligned) {
    const result: Track[] = [];
    for (const sushi of sushiTrackRoles.user.value) {
      const saved = savedUI.tracks.find(t => t.id === sushi.id);
      result.push({
        id: sushi.id,
        name: sushi.name,
        alias: saved?.alias ?? sushi.name,
        plugins: saved?.plugins ?? [{ id: '', parameters: {} }]
      });
    }
    pluginTracks.value = result;
  } else {
    pluginTracks.value = defaultState;
  }

  await saveSessionSnapshot();
  sessionReady.value = true;
};

export const isSessionAligned = async (savedTracks: Track[]): Promise<boolean> => {
  const sushiTracks = await audioGraph.getAllTracks();
  const sushiIds = sushiTracks.map(t => t.id);
  return savedTracks.every(t => sushiIds.includes(t.id));
};

export const addPluginToTrack = async (trackId: number, pluginId: string): Promise<void> => {
  const plugin = userPluginList.value.find(p => p.id === pluginId);
  if (!plugin) throw new Error(`Plugin '${pluginId}' not found`);

  await audioGraph.createProcessorOnTrack(
    trackId,
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
  trackId: number,
  plugins: Plugin[]
): Promise<void> => {
  const processors = await audioGraph.getTrackProcessors(trackId);
  for (const p of processors) {
    if (!internalPluginIds.includes(p.name.toLowerCase())) {
      await audioGraph.deleteProcessorFromTrack({
        processor: { id: p.id },
        track: { id: trackId }
      });
    }
  }

  for (const plugin of plugins.filter(p => p.id !== '')) {
    const def = userPluginList.value.find(p => p.id === plugin.id);
    if (!def) continue;

    await audioGraph.createProcessorOnTrack(
      trackId,
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

  const sendDef = userPluginList.value.find(p => p.id === 'send');
  if (sendDef) {
    await audioGraph.createProcessorOnTrack(
      trackId,
      sendDef.name,
      PluginType_Type.INTERNAL,
      sendDef.uid,
      sendDef.path
    );
  }
};

export const deleteTrackByIndex = async (index: number): Promise<void> => {
  const track = visibleTracks.value[index];
  if (!track) return;

  const processors = await audioGraph.getTrackProcessors(track.id);
  for (const proc of processors) {
    if (!internalPluginIds.includes(proc.name.toLowerCase())) {
      await audioGraph.deleteProcessorFromTrack({
        processor: { id: proc.id },
        track: { id: track.id }
      });
    }
  }

  track.plugins = [{ id: '', parameters: {} }];
  const trackIndexInAll = pluginTracks.value.findIndex(t => t.id === track.id);
  if (trackIndexInAll !== -1) {
    pluginTracks.value[trackIndexInAll].name = `Track${index + 1}`;
  }

  pluginTracks.value = [...pluginTracks.value];

  visibleTrackCount.value = Math.max(visibleTrackCount.value - 1, 1);
  if (currentTrackIndex.value >= visibleTrackCount.value) {
    currentTrackIndex.value = visibleTrackCount.value - 1;
  }

  await saveSessionSnapshot();
  console.log(`[Track] Cleared and hid track: ${track.name}`);
};

export const renameTrack = (index: number, newAlias: string): void => {
  if (pluginTracks.value[index]) {
    pluginTracks.value[index].alias = newAlias;
    saveSessionSnapshot();
  }
};

export const showNextTrack = (): void => {
  if (visibleTrackCount.value < pluginTracks.value.filter(t => /^Track[0-9]+$/.test(t.name)).length) {
    visibleTrackCount.value++;
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
