
export interface SimulationParams {
  L: number;       // Container side length
  N: number;       // Number of particles
  r: number;       // Particle radius
  m: number;       // Particle mass
  k: number;       // Boltzmann constant (normalized)
  dt: number;      // Time step
  nu: number;      // Andersen collision frequency
  equilibriumTime: number; // Time to wait before collecting stats
  statsDuration: number;   // Duration to collect stats
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  speed: number;
  energy: number;
}

export interface SimulationStats {
  time: number;
  temperature: number;
  pressure: number;
  meanSpeed: number;
  rmsSpeed: number;
  isEquilibrated: boolean;
  progress: number; // 0 to 1 based on total duration
  phase: 'idle' | 'equilibrating' | 'collecting' | 'finished';
}

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  count: number;
  probability: number; // Normalized
  theoretical?: number; // Theoretical value
}

export interface ChartData {
  speed: HistogramBin[];
  energy: HistogramBin[];
  energyLog: { energy: number; logProb: number; theoreticalLog: number }[];
  tempHistory: { time: number; error: number; totalEnergy: number }[]; // Added totalEnergy
}

// Translation Types
export type LanguageCode = 'zh-CN' | 'zh-TW' | 'en-GB' | 'en-US';

export interface Translation {
  title: string;
  subtitle: string;
  controls: {
    title: string;
    particles: string;
    radius: string;
    boxSize: string;
    equilTime: string;
    statsDuration: string;
    start: string;
    pause: string;
    reset: string;
    resetNote: string;
  };
  views: {
    mdView: string;
    realtimeCharts: string;
    finalStats: string;
    completed: string;
    stackMode: string;
  };
  charts: {
    avgSpeed: string;
    instSpeed: string;
    avgEnergy: string;
    instEnergy: string;
    semilog: string;
    tempError: string;
    totalEnergy: string; // New
    speedX: string;
    energyX: string;
    probY: string;
    timeX: string;
    errorY: string;
    energyY: string; // New
    theory: string;
    simulation: string;
  };
  stats: {
    temperature: string;
    pressure: string;
    meanSpeed: string;
    rmsSpeed: string;
    status: string;
    idle: string;
    equilibrating: string;
    collecting: string;
    finished: string;
    done: string;
  };
  canvas: {
    locked: string;
    unlocked: string;
    scrollEnabled: string;
    clickToRelease: string;
    clickToInteract: string;
    resetView: string;
    instructionsFocused: string;
    instructionsIdle: string;
    scrollWarning: string;
    foldingLocked: string;
  };
  common: {
    expandDetails: string;
    prev: string;
    next: string;
    expandAll: string;
    collapse: string;
  };
  footer: {
    about: string;
    team: string;
    supervisor: string;
    references: string;
    visitorCount: string;
    school: string;
    version: string;
    // Roles
    role_leader: string;
    role_algo: string;
    role_research: string;
  }
}
