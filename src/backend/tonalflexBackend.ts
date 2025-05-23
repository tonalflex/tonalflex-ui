import { ref, computed, markRaw, watch } from 'vue';
import type { Component, Ref } from 'vue';
import SushiAudioGraphController from '@/backend/sushi/audioGraphController';
import SushiTransportController from "@/backend/sushi/transportController";
import NotificationController from '@/backend/sushi/notificationController';
import { removeProcessorSubscription, ensureProcessorSubscription} from "@/backend/parameterSubscriptionService"
import ButlerController from '@/backend/butler/butler-functions';
import type { Plugin, Track, PluginMeta, PluginModule } from '@/types/tonalflex';
import { PluginType_Type } from '@/proto/sushi/sushi_rpc';
import SushiParameterController from './sushi/parameterController';
import {BASE_URL, DEBUG} from '@/backend/settings'

const audioGraph = new SushiAudioGraphController(BASE_URL + "/sushi");
const transportController = new SushiTransportController(BASE_URL + "/sushi");
const parameterController = new SushiParameterController(BASE_URL + "/sushi");
const notificationController = new NotificationController(BASE_URL + "/sushi");
const butler = new ButlerController(BASE_URL + "/butler");

//PLuginChain watchers
export const pluginTracks = ref<Track[]>([]);
export const currentTrackIndex = ref(0);
export const sessionReady = ref(false);
export const loadingMessage = ref("Connecting")
export const updatePluginReady = ref(false);
export const visibleTrackCount = ref(1);
export const sushiTrackRoles = {
  pre: ref<number | null>(null),
  post: ref<number | null>(null),
  user: ref<{ id: number; name: string }[]>([])
};
const internalPluginIds = ['send', 'return'];
const manualMuteState = ref<Record<number, boolean>>({});

// Plugin Collectors
export const userPluginList = ref<PluginMeta[]>([]);
export const systemPluginList = ref<PluginMeta[]>([]);
export const activePluginUIMap = ref<Record<number, Plugin[]>>({});

//
// Read/Load Plugins meta etc
//
const uiModules: Record<string, () => Promise<PluginModule>> =
  import.meta.glob('../../node_modules/@tonalflex/*/dist/plugin-ui.es.js') as Record<string, () => Promise<PluginModule>>;

const logoSvgs = import.meta.glob('../../node_modules/@tonalflex/*/dist/logo.svg', {
  query: '?url',
  import: 'default',
  eager: true
}) as Record<string, string>;

const metadatas = import.meta.glob('../../node_modules/@tonalflex/*/dist/metadata.json', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

export const loadAvailablePlugins = async () => {
  const plugins: PluginMeta[] = [];

  for (const path in uiModules) {
    try {
      const basePath = path.replace('/plugin-ui.es.js', '');
      const metaPath = `${basePath}/metadata.json`;
      const logoPath = `${basePath}/logo.svg`;

      const module = await uiModules[path]();

      const metadataRaw = metadatas[metaPath];
      const metadata = metadataRaw ? JSON.parse(metadataRaw) : {};

      const image = logoSvgs[logoPath] || '/tonalflex.svg';

      if(DEBUG)console.log('[PluginLoader] metadata for', path, metadata);

      if (!module.Plugin) {
        console.warn(`[PluginLoader] Plugin module missing named export 'Plugin': ${path}`);
        continue;
      }

      const meta: PluginMeta = {
        id: metadata.id || path,
        name: metadata.name,
        
        type: metadata.type || 'vst3x',
        uid: metadata.name,
        path: metadata.path,
        image,
        description: metadata.description || '',
        isSystem: metadata["system-plugin"] === "true",
        component: markRaw(module.Plugin),
        parameters: metadata.parameters || {},
      };

      plugins.push(meta);
    } catch (e) {
      console.warn(`[PluginLoader] Failed to load ${path}:`, e);
    }
  }

  if(DEBUG)console.log("plugins: ", plugins.filter(p => !p.isSystem))
  userPluginList.value = plugins.filter(p => !p.isSystem);
  systemPluginList.value = plugins.filter(p => p.isSystem);
};

//
// Something track blabla
//
export const selectPluginOnTrack = (trackId: number, plugin: Plugin) => {
  if(DEBUG)console.log('[selectPluginOnTrack] incoming plugin:', plugin);

  if (!plugin || typeof plugin !== 'object' || !plugin.id) {
    console.warn('[selectPluginOnTrack] Invalid plugin passed:', plugin);
    return;
  }

  if (plugin.processorId == null) {
    console.warn(`[selectPluginOnTrack] Plugin '${plugin.id}' missing processorId — not adding to UI map.`);
    return;
  }

  if (!activePluginUIMap.value[trackId]) {
    activePluginUIMap.value[trackId] = [];
  }

  const exists = activePluginUIMap.value[trackId].some(
    p => p.instanceId === plugin.instanceId
  );

  if (!exists) {
    activePluginUIMap.value[trackId].push(plugin);
    if(DEBUG)console.log('[selectPluginOnTrack] Added plugin with processorId:', plugin.processorId);
  } else {
    if(DEBUG)console.log('[selectPluginOnTrack] Plugin already present in UI map:', plugin.id);
  }
};

export const deselectPluginOnTrack = (trackId: number, instanceId: string) => {
  const list = activePluginUIMap.value[trackId];
  if (list) {
    activePluginUIMap.value[trackId] = list.filter(plugin => plugin.instanceId !== instanceId);
    if (activePluginUIMap.value[trackId].length === 0) {
      delete activePluginUIMap.value[trackId];
    }
  }
};

export const getActivePluginsForTrack = (trackId: number): Plugin[] => {
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
        plugins.push({
          id: '',
          instanceId: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
          parameters: {}
        });
      }
      return { ...track, plugins };
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, visibleTrackCount.value)
);

// Mute Boolean for Automatic or Manual mute mode
export const autoMuteEnabled = ref(true);

// Mute watcher
watch(currentTrackIndex, async (newIndex) => {
  if (!autoMuteEnabled.value) return;

  const visible = visibleTracks.value;
  for (let i = 0; i < visible.length; i++) {
    const trackId = visible[i].id;
    const isActive = i === newIndex;
    await setTrackMute(trackId, !isActive);
    manualMuteState.value[trackId] = !isActive;
  }
});

export const isCurrentTrackMuted = computed(() => {
  const track = currentTrack.value;
 
  if (!track) return false;
  return manualMuteState.value[track.id] ?? false;
});

export const toggleCurrentTrackMute = async () => {
  const track = currentTrack.value;
  if (!track) return;
  await toggleManualMute(track.id);
};

async function muteUserTracks(): Promise<void> {
  const tracks = sushiTrackRoles.user.value;

  for (let i = 0; i < tracks.length; i++) {
    const { id } = tracks[i];
    const shouldMute = i !== 0;
    await setManualMute(id, shouldMute);
  }

  if(DEBUG)console.log("[Init] Muted all user tracks except index 0");
}

export const getPluginImage = (pluginId: string): string => {
  const match = userPluginList.value.find(p => p.id === pluginId)
    ?? systemPluginList.value.find(p => p.id === pluginId);
  return match?.image ?? '';
};

export function getPluginName(pluginId: string): string {
  const plugin = userPluginList.value.find(p => p.id === pluginId);
  return plugin?.name ?? pluginId;
}

export const getPluginComponent = (pluginId: string | null) => {
  return userPluginList.value.find(p => p.id === pluginId)?.component
    ?? systemPluginList.value.find(p => p.id === pluginId)?.component
    ?? null;
};

export const getPluginMetaByComponent = (component: Component): PluginMeta | undefined => {
  return userPluginList.value.find(p => p.component === component)
      ?? systemPluginList.value.find(p => p.component === component);
};

export const updatePluginSlot = async (
  trackId: number,
  slotIndex: number,
  pluginId: string
): Promise<void> => {
  const track = pluginTracks.value.find(t => t.id === trackId);
  if (!track) return;

  // Prevent adding the same plugin twice
  const alreadyUsed = track.plugins.some((p, i) => p.id === pluginId && i !== slotIndex);
  if (alreadyUsed) {
    if(DEBUG)console.warn(`[updatePluginSlot] Plugin '${pluginId}' already exists on track ${trackId}`);
    return;
  }

  const updated = [...track.plugins];

  // Assign pluginId and new instanceId
  updated[slotIndex] = {
    id: pluginId,
    instanceId: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    parameters: {}
  };

  // Always append new empty slot at end if we just filled the last one
  if (slotIndex === updated.length - 1) {
    updated.push({
      id: '',
      instanceId: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      parameters: {}
    });
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

  let retries = 0;
  let sushiTracks = null;

  while (!sushiTracks && retries < 10) {
    try {
      sushiTracks = await audioGraph.getAllTracks();
    } catch (err) {
      retries++;
      loadingMessage.value = `Connection failed. Retrying (${retries}/10)...`;
      await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
    }
  }

  if (!sushiTracks) {
    loadingMessage.value = "Connection Lost, restart device!";
    return;
  }

  sushiTrackRoles.pre.value = sushiTracks.find(t => t.name === 'pre')?.id ?? null;
  sushiTrackRoles.post.value = sushiTracks.find(t => t.name === 'post')?.id ?? null;
  sushiTrackRoles.user.value = sushiTracks
    .filter(t => /^Track[1-8]$/.test(t.name))
    .map(t => ({ id: t.id, name: t.name }));

  muteUserTracks();

  const snapshot = await loadSessionSnapshot();

  if (snapshot && snapshot.tracks && await isSessionAligned(snapshot.tracks)) {
    if(DEBUG)console.log('[Init] Snapshot matches Sushi — restoring UI state');

    pluginTracks.value = snapshot.tracks.map(track => {
      const plugins = [...track.plugins].map(p => ({
        ...p,
        instanceId: p.instanceId ?? (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
      }));

      if (!plugins.length || plugins[plugins.length - 1].id !== '') {
        plugins.push({
          id: '',
          instanceId: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
          parameters: {}
        });
      }

      return { ...track, plugins };
    });

    visibleTrackCount.value =
    snapshot.visibleTrackCount
    ?? snapshot.tracks.length
    ?? 1;

    // Hydrate processorId
    for (const track of pluginTracks.value) {
      const processors = await audioGraph.getTrackProcessors(track.id);

      for (const plugin of track.plugins) {
        if (!plugin.id || internalPluginIds.includes(plugin.id)) continue;

        const def = userPluginList.value.find(p => p.id === plugin.id)
          ?? systemPluginList.value.find(p => p.id === plugin.id);

        const uniqueName = def?.name + "-" + track.id;
        const matching = processors.find(p => p.name === uniqueName);
        if (matching) {
          plugin.processorId = matching.id;
          selectPluginOnTrack(track.id, plugin);
        } else {
          console.warn(`[SessionRestore] Failed to match processor for plugin '${plugin.id}'`);
        }
      }
    }

  } else {
    console.warn('[Init] No valid snapshot or misalignment — resetting session');

    pluginTracks.value = sushiTrackRoles.user.value.map(t => ({
      id: t.id,
      name: t.name,
      alias: t.name,
      plugins: [{
        id: '',
        instanceId: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        parameters: {}
      }]
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
// Delete/remove plugin in pluginChain
//
// TODO: Tell parameterSubsctiption to unsubscribe the plugin params
export const deletePluginFromChain = async (
  trackId: number,
  instanceId: string
): Promise<void> => {
  const track = pluginTracks.value.find(t => t.id === trackId);
  if (!track) return;

  const slotIndex = track.plugins.findIndex(p => p.instanceId === instanceId);
  if (slotIndex === -1) {
    console.warn(`[DeletePlugin] Plugin with instanceId '${instanceId}' not found`);
    return;
  }

  const pluginToDelete = track.plugins[slotIndex];
  if (!pluginToDelete.processorId) return;

  removeProcessorSubscription(pluginToDelete.processorId);

  // Delete processor first
  await audioGraph.deleteProcessorFromTrack({
    processor: { id: pluginToDelete.processorId },
    track: { id: trackId },
  });

  // Remove plugin from list
  const updated = [...track.plugins];
  updated.splice(slotIndex, 1);

  // Ensure trailing empty slot exists
  if (updated.length === 0 || updated[updated.length - 1].id !== '') {
    updated.push({
      id: '',
      instanceId: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      parameters: {},
    });
  }

  // Save updated list and trigger UI
  track.plugins = updated;
  pluginTracks.value = [...pluginTracks.value];

  if(DEBUG)console.log(`[DeletePlugin] Removed plugin '${pluginToDelete.id}' from slot ${slotIndex}`);

  await rebuildPluginChain(trackId, updated);
  await saveSessionSnapshot();
};

//
// Rearange Plugins in PluginChains
//
export const rebuildPluginChain = async (
  trackId: number,
  plugins: Plugin[]
): Promise<void> => {
  if(DEBUG)console.log("🔄 [Rebuild] Starting plugin chain rebuild on track", trackId);
  const allProcessors = await audioGraph.getTrackProcessors(trackId);

  // Delete all non-internal processors
  for (const p of allProcessors) {
    const name = p.name.toLowerCase();
    if (!internalPluginIds.includes(name)) {
      await audioGraph.deleteProcessorFromTrack({
        processor: { id: p.id },
        track: { id: trackId },
      });
    }
  }

  const track = pluginTracks.value.find(t => t.id === trackId);
  if (!track) return;

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    if (!plugin.id || internalPluginIds.includes(plugin.id)) continue;

    const def = userPluginList.value.find(p => p.id === plugin.id);
    if (!def) {
      console.warn(`[Rebuild] Missing plugin definition for ID '${plugin.id}'`);
      continue;
    }

    const uniqueName = def.name + "-" + track.id;

    await audioGraph.createProcessorOnTrack(
      trackId,
      uniqueName,
      {
        internal: PluginType_Type.INTERNAL,
        vst2x: PluginType_Type.VST2X,
        vst3x: PluginType_Type.VST3X,
        lv2: PluginType_Type.LV2,
      }[def.type],
      def.uid,
      def.path
    );

    // Find the new processor
    let newProc;
    for (let attempt = 0; attempt < 10; attempt++) {
      const updatedProcessors = await audioGraph.getTrackProcessors(trackId);
      newProc = updatedProcessors
        .filter(p => !internalPluginIds.includes(p.name.toLowerCase()))
        .find(p => p.name === uniqueName);

      if (newProc) break;
      await new Promise(r => setTimeout(r, 100));
    }

    if (!newProc) {
      console.warn(`[Rebuild] Failed to find processor '${def.name}' on track ${trackId}`);
      continue;
    }

    // Match slot by instanceId
    const slotIndex = track.plugins.findIndex(p => p.instanceId === plugin.instanceId);
    if (slotIndex === -1) {
      console.warn(`[Rebuild] No matching plugin slot for instanceId: ${plugin.instanceId}`);
      continue;
    }

    track.plugins[slotIndex].processorId = newProc.id;
    pluginTracks.value = [...pluginTracks.value];

    // Restore parameters
    const savedParams = plugin.parameters ?? {};
    const paramInfos = await parameterController.getProcessorParameters(newProc.id);

    for (const param of paramInfos.parameters) {
      const val = savedParams[param.id];
      if (val != null) {
        await parameterController.setParameterValue(newProc.id, param.id, val);
      }
    }

    selectPluginOnTrack(trackId, track.plugins[slotIndex]);
    if(DEBUG)console.log(`[Rebuild] Recreated plugin '${plugin.id}' at slot ${slotIndex}, processorId=${newProc.id}`);
  }

  if(DEBUG)console.log(`[Rebuild] Completed plugin chain rebuild for track ${trackId}`);
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

  track.plugins = [{
    id: '',
    instanceId: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    parameters: {}
  }];

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
  if(DEBUG)console.log(`[Track] Cleared and hid track: ${track.name}`);
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
  if(DEBUG)console.log("[snapshot] - saving snapshot!");
  for (const track of pluginTracks.value) {
    const pluginsWithParams: Plugin[] = [];

    for (const plugin of track.plugins) {
      if (!plugin.id) {
        pluginsWithParams.push({
          id: '',
          instanceId: plugin.instanceId ?? (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
          parameters: {}
        });
        continue;
      }

      const def = userPluginList.value.find(p => p.id === plugin.id)
        ?? systemPluginList.value.find(p => p.id === plugin.id);
      if (!def) continue;

      const processors = await audioGraph.getTrackProcessors(track.id);
      const uniqueName = def.name + "-" + track.id;
      const proc = processors.find(p => p.name === uniqueName);
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
        instanceId: plugin.instanceId ?? (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
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
    const snapshot = {
    tracks: sessionTracks,
    visibleTrackCount: visibleTrackCount.value,
  };
    await butler.saveSnapshot(JSON.stringify(snapshot));
  } catch (e) {
    console.warn('[Session] Failed to save full snapshot:', e);
  }
};

export const loadSessionSnapshot = async (): Promise<{ tracks: Track[], visibleTrackCount?: number } | null> => {
  const res = await butler.loadSnapshot();

  if (!res.found) {
    if(DEBUG)console.log('[Session] No snapshot available.');
    return null;
  }

  try {
    const parsed = JSON.parse(res.jsonData);
    return {
      tracks: parsed.tracks,
      visibleTrackCount: parsed.visibleTrackCount,
    };
  } catch (e) {
    console.warn('[Session] Snapshot JSON was found but failed to parse:', e);
    return null;
  }
};

export const restoreFrontendSession = async (data: { tracks: Track[] }): Promise<void> => {
  pluginTracks.value = data.tracks.map(track => ({
    ...track,
    plugins: track.plugins.map(plugin => ({
      ...plugin,
      instanceId: plugin.instanceId ?? (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
    }))
  }));
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

// Get global BPM
export const getCurrentBpm = async (): Promise<number> => {
  try {
    const bpm = await transportController.getTempo();
    if(DEBUG)console.log(`[BPM] Current tempo: ${bpm}`);
    return bpm;
  } catch (err) {
    console.error("[BPM] Failed to get tempo", err);
    return 0; // fallback/default
  }
};

// Set  global BPM
export const setCurrentBpm = async (newBpm: number): Promise<void> => {
  try {
    await transportController.setTempo(newBpm);
    if(DEBUG)console.log(`[BPM] Tempo updated to ${newBpm}`);
  } catch (err) {
    console.error("[BPM] Failed to set tempo", err);
  }
};

// fetch NAM and IR file Names
export async function listFilesWrapper(folder: string): Promise<string[]> {
  const result = await butler.listFiles(folder);
  return result.filenames ?? [];
}

// Upload files to device
export async function uploadToFolder(folder: string, file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  await butler.uploadFile(folder, file.name, bytes);
}

// download files from device
export async function downloadFromFolder(folder: string, file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  await butler.downloadFile(folder, file.name);
}

//
// Track Controllers
//
// Helper function to get correct param id between pre/post and regular tracks
async function getParamId(trackId: number, name: string): Promise<number> {
  const list = await parameterController.getTrackParameters(trackId);
  const entry = list.parameters.find(p => p.name === name);
  if (!entry) throw new Error(`[getParamId] Parameter '${name}' not found on track ${trackId}`);
  return entry.id;
}

// Manual setter and getters
//
// Get track Gain 
export async function getTrackGain(trackId: number): Promise<number> {
  const id = await getParamId(trackId, "gain");
  return await parameterController.getParameterValue({ processorId: trackId, parameterId: id });
}

// Set track Gain
export async function setTrackGain(trackId: number, value: number): Promise<void> {
  const id = await getParamId(trackId, "gain");
  await parameterController.setParameterValue(trackId, id, value);
}

// Get track Pan
export async function getTrackPan(trackId: number): Promise<number> {
  const id = await getParamId(trackId, "pan");
  return await parameterController.getParameterValue({ processorId: trackId, parameterId: id });
}

// Set track Pan
export async function setTrackPan(trackId: number, value: number): Promise<void> {
  const id = await getParamId(trackId, "pan");
  await parameterController.setParameterValue(trackId, id, value);
}

export async function getTrackMute(trackId: number): Promise<boolean> {
  const id = await getParamId(trackId, "mute");
  const val = await parameterController.getParameterValue({ processorId: trackId, parameterId: id });
  return val > 0;
}

export async function setTrackMute(trackId: number, mute: boolean): Promise<void> {
  const id = await getParamId(trackId, "mute");
  await parameterController.setParameterValue(trackId, id, mute ? 1 : 0);
  manualMuteState.value[trackId] = mute;
}

export const toggleManualMute = async (trackId: number): Promise<void> => {
  const currentlyMuted = manualMuteState.value[trackId] ?? false;
  const next = !currentlyMuted;

  manualMuteState.value[trackId] = next;
  await setTrackMute(trackId, next);
};

export const setManualMute = async (trackId: number, mute: boolean): Promise<void> => {
  manualMuteState.value[trackId] = mute;
  await setTrackMute(trackId, mute);
};

export const isTrackManuallyMuted = (trackId: number): boolean => {
  return manualMuteState.value[trackId] ?? false;
};

// Subscribe to params outside of user plugins
//
// Subscibe to peakmeter level
const MIN_DB = -120;
const MAX_DB = 24;

export async function subscribeToPeakLevel(channelIndex: number): Promise<Ref<number>> {
  const peakLevel = ref(0);

  const postTrackId = sushiTrackRoles.post.value;
  if (postTrackId == null) {
    console.warn(`[PeakMeter] sushiTrackRoles.post is null`);
    return peakLevel;
  }

  // ✅ manually fetch processors on the post track
  const processors = await audioGraph.getTrackProcessors(postTrackId);
  const peakProc = processors.find(p => p.name === "peakmeter");

  if (!peakProc) {
    console.warn(`[PeakMeter] PeakMeter plugin not found on track ${postTrackId}`);
    return peakLevel;
  }

  const processorId = peakProc.id;
  const subscription = await ensureProcessorSubscription(processorId);
  const param = subscription.paramInfo.find(p => p.name === `level_${channelIndex}`);

  if (!param) {
    console.warn(`[PeakMeter] Param 'level_${channelIndex}' not found on processor ${processorId}`);
    return peakLevel;
  }

  const key = `${processorId}:${param.id}`;
  const listener = (value: number) => {
    const normalized = (value - MIN_DB) / (MAX_DB - MIN_DB);
    peakLevel.value = Math.min(1, Math.max(0, normalized));
  };

  if (!subscription.listeners.has(key)) subscription.listeners.set(key, new Set());
  subscription.listeners.get(key)!.add(listener);

  return peakLevel;
}