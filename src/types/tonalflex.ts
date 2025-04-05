// src/types/tonalflex.ts
export interface Plugin {
    id: string;
    parameters: Record<string, number>;
  }
  
  export interface Track {
    name: string;
    plugins: Plugin[];
  }
  