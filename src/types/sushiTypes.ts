// src/stores/sushi/sushiTypes.ts
export interface Track {
    id: string;
    name: string;
    plugins: Plugin[];
  }
  export interface Plugin {
    id?: number; // Processor ID from Sushi
    name: string;
  }
  export interface TrackInfo { id: number; name?: string; /* other fields */ }
  export interface ProcessorInfo { id: number; name?: string; /* other fields */ }
  export interface AudioConnection { /* define if needed */ }