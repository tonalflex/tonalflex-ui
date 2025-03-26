export type PluginControl = {
  id: string;
  name: string;
  type: 'slider' | 'toggle';
  value: number | boolean;
  min?: number;
  max?: number;
  step?: number;
};

export type Plugin = {
  id: string;
  name: string;
  status: string;
  controls: PluginControl[];
};
