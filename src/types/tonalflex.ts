// src/types/tonalflex.ts
import type { Component } from 'vue';

export interface Plugin {
  id: string;
  parameters: Record<string, number>;
}

export interface PluginModule {
  default: Component
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
}