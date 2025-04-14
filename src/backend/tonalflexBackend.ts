import { ref, computed, markRaw } from 'vue';
import SushiAudioGraphController from '@/backend/sushi/audioGraphController';
import ButlerController from '@/backend/butler/butler-functions';
import type { Plugin, Track, PluginMeta, PluginModule } from '@/types/tonalflex';
import { PluginType_Type } from '@/proto/sushi/sushi_rpc';
import SushiParameterController from './sushi/parameterController';

export const BASE_URL = 'http://elk-pi.local:8081';
const audioGraph = new SushiAudioGraphController(BASE_URL + "/sushi");
const parameterController = new SushiParameterController(BASE_URL + "/sushi");
const butler = new ButlerController(BASE_URL + "/butler");

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
export const activePluginUIMap = ref<Record<number, string[]>>({});

//
// Read/Load Plugins meta etc
//
const uiModules: Record<string, () => Promise<PluginModule>> =
  import.meta.glob('../../node_modules/@tonalflex/*/dist/plugin-ui.es.js') as Record<string, () => Promise<PluginModule>>;

export const loadAvailablePlugins = async () => {
  const plugins: PluginMeta[] = [];

  for (const path in uiModules) {
    try {
      const basePath = path.replace('/plugin-ui.es.js', '');

      const [module, metadata, image] = await Promise.all([
        uiModules[path](),
        fetch(`${basePath}/metadata.json`).then(res => res.json()).catch(() => ({})),
        fetch(`${basePath}/logo.svg`).then(res => res.ok ? `${basePath}/logo.svg` : '/tonalflex.svg').catch(() => '/tonalflex.svg')
      ]);

      console.log('[PluginLoader] metadata for', path, metadata);

      if (!module.Plugin) {
        console.warn(`[PluginLoader] Plugin module missing named export 'Plugin': ${path}`);
        continue;
      }

      const meta: PluginMeta = {
        id: metadata.id || path,
        name: metadata.name,
        type: metadata.type || 'vst3x',
        uid: metadata.uid,
        path: metadata.path,
        image,
        description: metadata.description || '',
        isSystem: metadata["system-plugin"] === "true",
        component: markRaw(module.Plugin),
      };

      plugins.push(meta);
    } catch (e) {
      console.warn(`[PluginLoader] Failed to load ${path}:`, e);
    }
  }

  console.log("plugins: ", plugins.filter(p => !p.isSystem))
  userPluginList.value = plugins.filter(p => !p.isSystem);
  systemPluginList.value = plugins.filter(p => p.isSystem);
};

//
// Something track blabla
//
export const selectPluginOnTrack = (trackId: number, pluginId: string) => {
  if (!activePluginUIMap.value[trackId]) {
    activePluginUIMap.value[trackId] = [];
  }
  if (!activePluginUIMap.value[trackId].includes(pluginId)) {
    activePluginUIMap.value[trackId].push(pluginId);
  }
};

export const deselectPluginOnTrack = (trackId: number, pluginId: string) => {
  const list = activePluginUIMap.value[trackId];
  if (list) {
    activePluginUIMap.value[trackId] = list.filter(id => id !== pluginId);
    if (activePluginUIMap.value[trackId].length === 0) {
      delete activePluginUIMap.value[trackId];
    }
  }
};

export const getActivePluginIdsForTrack = (trackId: number): string[] => {
  return activePluginUIMap.value[trackId] ?? [];
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
    .map(track => {
      const plugins = [...track.plugins];
      if (!plugins.length || plugins[plugins.length - 1].id !== '') {
        plugins.push({ id: '', parameters: {} });
      }
      return { ...track, plugins };
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, visibleTrackCount.value)
);

export const getPluginImage = (pluginId: string): string => {
  const match = userPluginList.value.find(p => p.id === pluginId)
    ?? systemPluginList.value.find(p => p.id === pluginId);
  return match?.image ?? '';
};

export const getPluginComponent = (pluginId: string | null) => {
  return userPluginList.value.find(p => p.id === pluginId)?.component
    ?? systemPluginList.value.find(p => p.id === pluginId)?.component
    ?? null;
};

export const updatePluginSlot = async (trackId: number, slotIndex: number, pluginId: string): Promise<void> => {
  const track = pluginTracks.value.find(t => t.id === trackId);
  if (!track) return;

  const updated = [...track.plugins];
  updated[slotIndex].id = pluginId;

  if (slotIndex === updated.length - 1) {
    updated.push({ id: '', parameters: {} });
  }

  track.plugins = updated;
  await rebuildPluginChain(trackId, updated);
  await saveSessionSnapshot();
};

export const filteredPlugins = (plugins: Plugin[]): Plugin[] => {
  return plugins.filter(p => !internalPluginIds.includes(p.id));
};

export const availableEffects = computed(() =>
  userPluginList.value
);

//
// Initiate device <-> ui sync
//
export const initializeTonalflexSession = async (): Promise<void> => {
  await loadAvailablePlugins();

  const sushiTracks = await audioGraph.getAllTracks();

  sushiTrackRoles.pre.value = sushiTracks.find(t => t.name === 'Track_Pre')?.id ?? null;
  sushiTrackRoles.post.value = sushiTracks.find(t => t.name === 'Track_Post')?.id ?? null;
  sushiTrackRoles.user.value = sushiTracks
    .filter(t => /^Track[1-8]$/.test(t.name))
    .map(t => ({ id: t.id, name: t.name }));

  const snapshot = await loadSessionSnapshot();

  if (snapshot && snapshot.tracks && await isSessionAligned(snapshot.tracks)) {
    console.log('[Init] Snapshot matches Sushi — restoring UI state');

    pluginTracks.value = snapshot.tracks.map(track => {
      const plugins = [...track.plugins];
      if (!plugins.length || plugins[plugins.length - 1].id !== '') {
        plugins.push({ id: '', parameters: {} });
      }
      return {
        ...track,
        plugins
      };
    });

  } else {
    console.warn('[Init] No valid snapshot or misalignment — resetting session');

    pluginTracks.value = sushiTrackRoles.user.value.map(t => ({
      id: t.id,
      name: t.name,
      alias: t.name,
      plugins: [{ id: '', parameters: {} }]
    }));

    await saveSessionSnapshot();
  }

  sessionReady.value = true;
};

export const isSessionAligned = async (savedTracks: Track[]): Promise<boolean> => {
  const sushiTracks = await audioGraph.getAllTracks();
  const sushiIds = sushiTracks.map(t => t.id);
  return savedTracks.every(t => sushiIds.includes(t.id));
};

//
// Add, rearange and (delete plugins) not implemented
//
export const rebuildPluginChain = async (
  trackId: number,
  plugins: Plugin[]
): Promise<void> => {
  const allProcessors = await audioGraph.getTrackProcessors(trackId);

  for (const p of allProcessors) {
    const name = p.name.toLowerCase();
    if (name.includes('send') || (!name.includes('return') && !internalPluginIds.includes(name))) {
      await audioGraph.deleteProcessorFromTrack({
        processor: { id: p.id },
        track: { id: trackId },
      });
    }
  }

  for (const plugin of plugins.filter(p => p.id && !internalPluginIds.includes(p.id))) {
    const def = userPluginList.value.find(p => p.id === plugin.id);
    if (!def) {
      console.warn(`[Rebuild] Plugin ID '${plugin.id}' not found in loaded plugin list.`);
      continue;
    }

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

    // Re-fetch processors and match by name to find the new processor ID
    const updatedProcessors = await audioGraph.getTrackProcessors(trackId);
    const newProc = updatedProcessors
      .filter(p => !internalPluginIds.includes(p.name.toLowerCase()))
      .reverse()
      .find(p => p.name === def.name);

    if (newProc) {
      plugin.processorId = newProc.id;
    }
  }

  if (sushiTrackRoles.post.value != null) {
    const track = pluginTracks.value.find(t => t.id === trackId);
    if (!track) {
      console.warn(`[Rebuild] Could not find track with ID ${trackId} to create send`);
      return;
    }

    const processorName = `${track.name}_send`;
    console.log(`[Debug] Creating send processor: ${processorName}`);

    await audioGraph.createProcessorOnTrack(
      trackId,
      processorName,
      PluginType_Type.INTERNAL,
      'sushi.testing.send',
      ''
    );

    const finalProcessors = await audioGraph.getTrackProcessors(trackId);
    const sendProc = finalProcessors.find(p => p.name === processorName);

    if (sendProc) {
      const propList = await parameterController.getProcessorProperties(sendProc.id);
      const destProp = propList.properties.find(p => p.name === 'destination_name');

      if (destProp) {
        await parameterController.setPropertyValue(
          sendProc.id,
          destProp.id,
          'Post_return'
        );
        console.log(`[Routing] ${processorName} now routes to Post_return on track ${trackId}`);
      } else {
        console.warn(`[Routing] 'destination_name' param not found on ${processorName}`);
      }
    } else {
      console.warn(`[Routing] Failed to find created send processor: ${processorName}`);
    }
  }

  console.log(`[Rebuild] Finished plugin chain rebuild for track ${trackId}`);
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

//
// Session functions
//
const saveSessionSnapshot = async (): Promise<void> => {
  const sessionTracks: Track[] = [];

  for (const track of pluginTracks.value) {
    const pluginsWithParams = [];

    for (const plugin of track.plugins) {
      if (!plugin.id) {
        pluginsWithParams.push({ id: '', parameters: {} });
        continue;
      }

      const def = userPluginList.value.find(p => p.id === plugin.id)
        ?? systemPluginList.value.find(p => p.id === plugin.id);
      if (!def) continue;

      // fetch processor ID based on plugin name (assumes unique per track)
      const processors = await audioGraph.getTrackProcessors(track.id);
      const proc = processors.find(p => p.name === def.name);
      if (!proc) continue;

      const paramList = await parameterController.getProcessorParameters(proc.id);

      const paramValues: Record<string, number> = {};
      for (const param of paramList.parameters) {
        const value = await parameterController.getParameterValue({
          processorId: proc.id,
          parameterId: param.id
        });
        paramValues[param.name] = value;
      }

      pluginsWithParams.push({
        id: plugin.id,
        parameters: paramValues
      });
    }

    sessionTracks.push({
      id: track.id,
      name: track.name,
      alias: track.alias,
      plugins: pluginsWithParams
    });
  }

  try {
    await butler.saveSnapshot(JSON.stringify({ tracks: sessionTracks }));
  } catch (e) {
    console.warn('[Session] Failed to save full snapshot:', e);
  }
};

export const loadSessionSnapshot = async (): Promise<{ tracks: Track[] } | null> => {
  try {
    const raw = await butler.loadSnapshot();
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[Session] Failed to parse snapshot JSON:', e);
    return null;
  }
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
