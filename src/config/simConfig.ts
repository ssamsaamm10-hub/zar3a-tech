// ALL tunables live here.
export const CFG = {
  stepMs: 100, tankMl: 1500,
  moistureLow: 30, moistureStop: 45, moistureSaturated: 60, moistureWaterlog: 80, moistureWaterlogRelease: 70,
  rhOn: 75, rhOff: 68, tempOn: 32, tempOff: 29, lowWater: 10, lowWaterClear: 15, dryRun: 3,
  burstSec: 5, soakSec: 20, minIntervalSec: 120, maxBursts: 6,
  kBase: 0.35, a: 0.5, b: 0.6, c: 0.3, fanDryBoost: 1.25, fanRhPullPerMin: 0.6, soilTau: 1200, rhRelaxPerMin: 0.2,
  pumpGainPerSec: 0.9, pumpGainCap: 85, pumpMlPerSec: 6,
  batteryDrainPerMin: 1, lowBattery: 15,
  defaults: { moisture: 42, soilTemp: 23, airTemp: 24, humidity: 55, lux: 12000, waterLevel: 78, battery: 100, ambientRH: 55 },
  manualMaxSec: 10,
  luxToPpfd: 0.0185, noise: 0.15, risk: { w: [40, 25, 15, 20], bands: [25, 50, 75], labels: ['Low', 'Moderate', 'High', 'Critical'] },
  anchors: { // normalized offsets in model bbox; model is scaled to ~2 units, world = n*2
    assembled: { tank: [-0.22, -0.29, 0], bay: [0.22, -0.22, 0], pump: [-0.02, -0.46, 0], fan: [0.22, -0.14, 0], soil: [-0.12, -0.07, 0], probe: [0.1, -0.07, 0], ds18: [-0.02, -0.12, 0], dht: [0.3, -0.02, 0], ldr: [0.09, 0.5, 0], oled: [0.3, 0.15, 0.4], lens: [0.09, 0.5, 0], refill: [-0.25, -0.2, 0] },
    cutaway: { tank: [-0.35, 0, 0], bay: [0.35, 0, 0], pump: [-0.1, -0.35, 0], fan: [0.1, -0.35, 0], soil: [0, 0.15, 0], probe: [0.05, 0.1, 0], ds18: [-0.05, 0.05, 0.1], dht: [0.2, 0.35, 0], ldr: [0, 0.45, 0.1], refill: [-0.45, 0.4, 0], oled: [0.3, 0.2, 0.3], lens: [0, 0.5, 0] },
  },
} as const
