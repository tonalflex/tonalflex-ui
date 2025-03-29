// src/plugins/pluginIndex.ts
export interface PluginMeta {
    id: string;
    name: string;
    image: string;
    type: 'internal' | 'vst2x' | 'vst3x' | 'lv2';
    uid?: string;
    path?: string;
  }
  
  export const pluginList: PluginMeta[] = [
    {
      id: 'reverb',
      name: 'Reverb',
      image: '/images/reverb.png',
      type: 'vst3x',
      uid: '/path/to/.reverb.vst3',
    },
    {
      id: 'neuralamp',
      name: 'Neural Amp',
      image: '/images/neuralamp.png',
      type: 'vst3x',
      path: '/path/to/neuralamp.vst3',
    },
    // ... other plugins
  ];
  
  export const getPluginById = (id: string) => pluginList.find(p => p.id === id);
  