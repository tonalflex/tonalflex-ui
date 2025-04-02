// src/composables/useTonalFlexSession.ts
import {
    initializeTonalflexSession,
    saveSessionSnapshot,
    createNewPluginChain,
    removeChannelFromPluginChain,
    addPluginToTrackByName,
    addPluginToChain,
    connectCvAndGateToTrackVolume,
  } from '@/backend/tonalflexBackend';
  
  export const useTonalFlexSession = () => {
    /**
     * Initialize Sushi + Frontend Session State
     */
    const initialize = async (): Promise<void> => {
      await initializeTonalflexSession();
    };
  
    /**
     * Save full session state to localStorage
     */
    const save = async (): Promise<void> => {
      await saveSessionSnapshot();
    };
  
    /**
     * Add a plugin to a specific track
     */
    const addPlugin = async (trackName: string, pluginId: string): Promise<void> => {
      await addPluginToTrackByName(trackName, pluginId);
    };
  
    /**
     * Insert plugin track into chain after a given track
     */
    const insertPluginInChain = async (pluginId: string, afterTrack: string): Promise<string> => {
      return await addPluginToChain(pluginId, afterTrack);
    };
  
    /**
     * Create a new independent plugin chain
     */
    const createChain = async (baseName: string): Promise<string> => {
      return await createNewPluginChain(baseName);
    };
  
    /**
     * Remove a plugin track and reconnect chain if needed
     */
    const removePluginTrack = async (trackName: string): Promise<void> => {
      await removeChannelFromPluginChain(trackName);
    };
  
    /**
     * Connect CV + Gate to volume processor on a track
     */
    const connectCvGateToVolume = async (trackId: number): Promise<void> => {
      await connectCvAndGateToTrackVolume(trackId);
    };
  
    return {
      initialize,
      save,
      addPlugin,
      insertPluginInChain,
      createChain,
      removePluginTrack,
      connectCvGateToVolume,
    };
  };
  