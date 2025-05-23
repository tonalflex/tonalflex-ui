// src/types/tonalflex.ts
import type { Component } from 'vue';

export interface Plugin {
  id: string;
  instanceId: string;
  parameters: Record<string, number>;
  processorId?: number;
}

export interface PluginModule {
  Plugin: Component;
  metadata: PluginMeta
}

export interface Track {
  id: number;               
  name: string;
  alias: string;
  plugins: Plugin[];
}

export interface PluginMeta {
  id: string;
  name: string;
  type: 'vst3x' | 'vst2x' | 'lv2' | 'internal';
  uid: string;
  path: string;
  image: string;
  description: string;
  isSystem: boolean;
  component?: Component;
  parameters?: Record<string, string>;
}