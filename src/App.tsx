/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Thermometer,
  Wind,
  CloudRain,
  Power,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Sliders,
  Cpu,
  Gauge,
  Sprout,
  Info,
  Play,
  RefreshCw,
} from 'lucide-react';

type RecommendationType = 'IRRIGATE_NOW' | 'DELAY_IRRIGATION' | 'CONTINUE_MONITORING';

interface SensorState {
  soilMoisture: number;
  temperature: number;
  humidity: number;
  rainProbability: number;
}

const INITIAL_SENSORS: SensorState = {
  soilMoisture: 24,
  temperature: 31,
  humidity: 65,
  rainProbability: 20,
};

const SCENARIOS: Record<string, { label: string; description: string; values: SensorState }> = {
  dry: {
    label: 'Dry Soil',
    description: 'Low moisture (16%) & low rain chance (15%)',
    values: {
      soilMoisture: 16,
      temperature: 34,
      humidity: 42,
      rainProbability: 15,
    },
  },
  rain: {
    label: 'Rain Expected',
    description: 'Low moisture (19%) & high rain probability (75%)',
    values: {
      soilMoisture: 19,
      temperature: 26,
      humidity: 82,
      rainProbability: 75,
    },
  },
  wet: {
    label: 'Soil Already Wet',
    description: 'Sufficient moisture (48%) after recent watering',
    values: {
      soilMoisture: 48,
      temperature: 25,
      humidity: 70,
      rainProbability: 25,
    },
  },
};

export default function App() {
  const [sensors, setSensors] = useState<SensorState>(INITIAL_SENSORS);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [pumpOn, setPumpOn] = useState<boolean>(false);
  const [manualOverride, setManualOverride] = useState<boolean>(false);
  const [waterUsedLitres, setWaterUsedLitres] = useState<number>(0);
  const [pumpRuntimeSeconds, setPumpRuntimeSeconds] = useState<number>(0);
  const [lastAppliedMessage, setLastAppliedMessage] = useState<string | null>(null);

  // Rule-based Irrigation Decision Engine
  const getRecommendation = (state: SensorState): RecommendationType => {
    if (state.soilMoisture < 25 && state.rainProbability < 60) {
      return 'IRRIGATE_NOW';
    }
    if (state.soilMoisture < 25 && state.rainProbability >= 60) {
      return 'DELAY_IRRIGATION';
    }
    return 'CONTINUE_MONITORING';
  };

  const recommendation = getRecommendation(sensors);

  // Dynamic explanation using actual input values
  const getExplanationText = (state: SensorState, rec: RecommendationType): string => {
    if (rec === 'IRRIGATE_NOW') {
      return `Soil moisture is ${state.soilMoisture}%, which is below the demonstration threshold of 25%. Rain probability is ${state.rainProbability}% (below the 60% rain threshold), so irrigation is recommended.`;
    }
    if (rec === 'DELAY_IRRIGATION') {
      return `Soil moisture is ${state.soilMoisture}%, which is below the demonstration threshold of 25%. However, rain probability is ${state.rainProbability}% (60% or higher), so delaying irrigation is recommended to wait for expected rainfall.`;
    }
    return `Soil moisture is ${state.soilMoisture}%, which is at or above the demonstration threshold of 25% (with air temperature at ${state.temperature}°C, humidity at ${state.humidity}%, and rain probability at ${state.rainProbability}%). No irrigation is required right now; continue monitoring.`;
  };

  // Gradual water usage counter when simulated pump runs
  useEffect(() => {
    if (!pumpOn) return;

    const interval = window.setInterval(() => {
      setWaterUsedLitres((prev) => Number((prev + 0.35).toFixed(2)));
      setPumpRuntimeSeconds((prev) => prev + 1);
    }, 500);

    return () => window.clearInterval(interval);
  }, [pumpOn]);

  const handleSliderChange = (key: keyof SensorState, value: number) => {
    setSensors((prev) => ({ ...prev, [key]: value }));
    setActiveScenario(null);
    setLastAppliedMessage(null);
  };

  const handleSelectScenario = (key: string) => {
    const preset = SCENARIOS[key];
    if (!preset) return;
    setSensors(preset.values);
    setActiveScenario(key);
    setLastAppliedMessage(null);
  };

  const handleApplyRecommendation = () => {
    if (recommendation === 'IRRIGATE_NOW') {
      setPumpOn(true);
      setManualOverride(false);
      setLastAppliedMessage('Applied recommendation: Simulated irrigation pump turned ON.');
    } else if (recommendation === 'DELAY_IRRIGATION') {
      setPumpOn(false);
      setManualOverride(false);
      setLastAppliedMessage('Applied recommendation: Pump kept OFF to wait for forecasted rain.');
    } else {
      setPumpOn(false);
      setManualOverride(false);
      setLastAppliedMessage('Applied recommendation: Pump kept OFF while soil moisture remains sufficient.');
    }
  };

  const handleTogglePump = () => {
    const nextState = !pumpOn;
    setPumpOn(nextState);
    setManualOverride(nextState);
    setLastAppliedMessage(null);
  };

  const handleSimulatePostIrrigationRecheck = () => {
    const boostedMoisture = Math.min(100, Math.max(38, sensors.soilMoisture + 18));
    setSensors((prev) => ({
      ...prev,
      soilMoisture: boostedMoisture,
    }));
    setPumpOn(false);
    setManualOverride(false);
    setActiveScenario(null);
    setLastAppliedMessage(
      `Post-irrigation recheck complete: Simulated soil moisture updated to ${boostedMoisture}%, and pump turned OFF.`
    );
  };

  const handleResetDemo = () => {
    setPumpOn(false);
    setManualOverride(false);
    setWaterUsedLitres(0);
    setPumpRuntimeSeconds(0);
    setLastAppliedMessage('Pump state and simulated water counter reset to 0.00 L.');
  };

  const handleResetAll = () => {
    setSensors(INITIAL_SENSORS);
    setActiveScenario(null);
    setPumpOn(false);
    setManualOverride(false);
    setWaterUsedLitres(0);
    setPumpRuntimeSeconds(0);
    setLastAppliedMessage(null);
  };

  const showHighMoistureSafetyWarning = pumpOn && sensors.soilMoisture >= 25;

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8f6] text-[#0f291e]">
      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-emerald-900/10 px-6 py-3.5">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-[#143d2d] whitespace-nowrap shrink-0"
          >
            AgriMind AI
          </a>

          {/* Zone 2: 4–5 single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a
              href="#dashboard"
              className="hover:text-[#143d2d] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Dashboard
            </a>
            <a
              href="#controls"
              className="hover:text-[#143d2d] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Controls
            </a>
            <a
              href="#pump-simulation"
              className="hover:text-[#143d2d] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Pump &amp; Water
            </a>
            <a
              href="#architecture"
              className="hover:text-[#143d2d] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Architecture
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#143d2d] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1b4d3e] hover:bg-[#143d2d] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="top" className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Page Title & Indicator Legend Header */}
        <section className="bg-white rounded-xl border border-emerald-950/10 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-800/80">
                <span>Agricultural Technology Demonstration</span>
                <span aria-hidden="true">·</span>
                <span>Simulated Sensor Data</span>
                <span aria-hidden="true">·</span>
                <span>Rule-Based Decision Engine</span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0f291e]"
                style={{ textWrap: 'balance' }}
              >
                AgriMind AI
              </h1>
              <p className="text-lg sm:text-xl font-semibold text-[#1b4d3e]">
                Smart Irrigation for a Sustainable Tomorrow
              </p>
              <p className="text-sm text-slate-600 leading-relaxed pt-1">
                Interactive demonstration dashboard illustrating how environmental telemetry and
                weather probability thresholds guide irrigation scheduling decisions.
              </p>
            </div>

            {/* Dashboard Indicator Legend */}
            <div className="bg-[#f6f8f6] rounded-lg border border-emerald-950/10 p-4 lg:max-w-md w-full">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#143d2d] mb-2.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Decision Indicator Legend (Demonstration Rules)</span>
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-semibold text-red-700 whitespace-nowrap">
                    Irrigate Now:
                  </span>
                  <span className="text-right font-mono">
                    Moisture &lt; 25% · Rain &lt; 60%
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4 border-t border-emerald-950/5 pt-1.5">
                  <span className="font-semibold text-amber-800 whitespace-nowrap">
                    Delay Irrigation:
                  </span>
                  <span className="text-right font-mono">
                    Moisture &lt; 25% · Rain ≥ 60%
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4 border-t border-emerald-950/5 pt-1.5">
                  <span className="font-semibold text-emerald-800 whitespace-nowrap">
                    Continue Monitoring:
                  </span>
                  <span className="text-right font-mono">Moisture ≥ 25% (Any Rain %)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1. DASHBOARD: Four Simulated Metric Cards */}
        <section id="dashboard" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#0f291e]">
                01. Environmental Sensor Dashboard
              </h2>
              <p className="text-sm text-slate-600">
                Real-time readout of field parameters used by the irrigation decision rules.
              </p>
            </div>
            <div className="text-xs font-mono font-semibold text-emerald-900">
              DATA SOURCE: SIMULATED DATA · LOCAL STATE
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Soil Moisture Card */}
            <div className="bg-white rounded-xl border border-emerald-950/10 p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    SIMULATED DATA · SENSOR 01
                  </div>
                  <h3 className="text-base font-bold text-[#0f291e] mt-0.5">Soil Moisture</h3>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 text-[#1b4d3e]">
                  <Droplets className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-mono text-[#0f291e]">
                    {sensors.soilMoisture}%
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    {sensors.soilMoisture < 25 ? 'Below 25% threshold' : 'Optimal / Sufficient'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-transform duration-150 origin-left ${
                      sensors.soilMoisture < 25 ? 'bg-red-600' : 'bg-[#1b4d3e]'
                    }`}
                    style={{ transform: `scaleX(${sensors.soilMoisture / 100})` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>0% (Bone Dry)</span>
                  <span>Threshold: 25%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Air Temperature Card */}
            <div className="bg-white rounded-xl border border-emerald-950/10 p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    SIMULATED DATA · SENSOR 02
                  </div>
                  <h3 className="text-base font-bold text-[#0f291e] mt-0.5">Air Temperature</h3>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
                  <Thermometer className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-mono text-[#0f291e]">
                    {sensors.temperature}°C
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    {sensors.temperature >= 35
                      ? 'High Evapotranspiration'
                      : sensors.temperature <= 18
                      ? 'Cool Conditions'
                      : 'Moderate Warmth'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 transition-transform duration-150 origin-left"
                    style={{
                      transform: `scaleX(${Math.max(0, Math.min(1, (sensors.temperature - 10) / 40))})`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>10°C</span>
                  <span>Range: 10–50°C</span>
                  <span>50°C</span>
                </div>
              </div>
            </div>

            {/* Humidity Card */}
            <div className="bg-white rounded-xl border border-emerald-950/10 p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    SIMULATED DATA · SENSOR 03
                  </div>
                  <h3 className="text-base font-bold text-[#0f291e] mt-0.5">Relative Humidity</h3>
                </div>
                <div className="p-2 rounded-lg bg-teal-50 text-teal-800">
                  <Wind className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-mono text-[#0f291e]">
                    {sensors.humidity}%
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    {sensors.humidity < 40
                      ? 'Dry Air'
                      : sensors.humidity > 75
                      ? 'Humid Air'
                      : 'Balanced Humidity'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-700 transition-transform duration-150 origin-left"
                    style={{ transform: `scaleX(${sensors.humidity / 100})` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>0%</span>
                  <span>Atmospheric</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Rain Probability Card */}
            <div className="bg-white rounded-xl border border-emerald-950/10 p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    SIMULATED DATA · FORECAST
                  </div>
                  <h3 className="text-base font-bold text-[#0f291e] mt-0.5">Rain Probability</h3>
                </div>
                <div className="p-2 rounded-lg bg-sky-50 text-sky-800">
                  <CloudRain className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-mono text-[#0f291e]">
                    {sensors.rainProbability}%
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    {sensors.rainProbability >= 60 ? '≥ 60% Delay Threshold' : 'Below 60% Threshold'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-transform duration-150 origin-left ${
                      sensors.rainProbability >= 60 ? 'bg-amber-600' : 'bg-sky-700'
                    }`}
                    style={{ transform: `scaleX(${sensors.rainProbability / 100})` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>0%</span>
                  <span>Threshold: 60%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. INTERACTIVE SENSOR CONTROLS & 3. IRRIGATION DECISION ENGINE */}
        <section id="controls" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Interactive Sensor Controls (Left 6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-emerald-950/10 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#1b4d3e]" />
                  <h2 className="text-xl font-bold text-[#0f291e]">
                    02. Interactive Sensor Controls
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500">SIMULATED INPUTS</span>
              </div>

              <p className="text-sm text-slate-600">
                Adjust the sliders or select a preset field scenario to test how the irrigation
                decision engine responds in real time.
              </p>

              {/* Preset Scenario Buttons */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-slate-700">
                  Quick Field Scenarios:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {Object.entries(SCENARIOS).map(([key, scenario]) => {
                    const isSelected = activeScenario === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectScenario(key)}
                        className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#1b4d3e] text-white border-[#1b4d3e]'
                            : 'bg-[#f6f8f6] text-[#0f291e] border-emerald-950/10 hover:bg-emerald-950/5'
                        }`}
                      >
                        <div className="text-xs font-bold whitespace-nowrap shrink-0">
                          {scenario.label}
                        </div>
                        <div
                          className={`text-[11px] mt-1 leading-snug ${
                            isSelected ? 'text-emerald-100' : 'text-slate-600'
                          }`}
                        >
                          {scenario.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Four Sliders */}
              <div className="space-y-4 pt-2 border-t border-emerald-950/10">
                {/* Soil Moisture Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <label htmlFor="slider-moisture" className="font-semibold text-[#0f291e]">
                      Soil Moisture (0–100%)
                    </label>
                    <span className="font-mono font-bold text-[#1b4d3e]">
                      {sensors.soilMoisture}%
                    </span>
                  </div>
                  <input
                    id="slider-moisture"
                    type="range"
                    min={0}
                    max={100}
                    value={sensors.soilMoisture}
                    onChange={(e) => handleSliderChange('soilMoisture', Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>0%</span>
                    <span>Critical Cutoff: 25%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Air Temperature Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <label htmlFor="slider-temp" className="font-semibold text-[#0f291e]">
                      Air Temperature (10–50°C)
                    </label>
                    <span className="font-mono font-bold text-[#1b4d3e]">
                      {sensors.temperature}°C
                    </span>
                  </div>
                  <input
                    id="slider-temp"
                    type="range"
                    min={10}
                    max={50}
                    value={sensors.temperature}
                    onChange={(e) => handleSliderChange('temperature', Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>10°C</span>
                    <span>30°C</span>
                    <span>50°C</span>
                  </div>
                </div>

                {/* Humidity Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <label htmlFor="slider-humidity" className="font-semibold text-[#0f291e]">
                      Humidity (0–100%)
                    </label>
                    <span className="font-mono font-bold text-[#1b4d3e]">
                      {sensors.humidity}%
                    </span>
                  </div>
                  <input
                    id="slider-humidity"
                    type="range"
                    min={0}
                    max={100}
                    value={sensors.humidity}
                    onChange={(e) => handleSliderChange('humidity', Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Rain Probability Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <label htmlFor="slider-rain" className="font-semibold text-[#0f291e]">
                      Rain Probability (0–100%)
                    </label>
                    <span className="font-mono font-bold text-[#1b4d3e]">
                      {sensors.rainProbability}%
                    </span>
                  </div>
                  <input
                    id="slider-rain"
                    type="range"
                    min={0}
                    max={100}
                    value={sensors.rainProbability}
                    onChange={(e) => handleSliderChange('rainProbability', Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>0%</span>
                    <span>Delay Cutoff: 60%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-950/10 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Initial values: 24% moisture · 31°C · 65% humidity · 20% rain
              </span>
              <button
                type="button"
                onClick={handleResetAll}
                className="px-3.5 py-2 text-xs font-semibold text-[#1b4d3e] bg-[#f6f8f6] hover:bg-emerald-950/10 rounded-lg border border-emerald-950/15 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Restore Initial Values
              </button>
            </div>
          </div>

          {/* 3. Irrigation Decision Engine (Right 6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-emerald-950/10 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-[#1b4d3e]" />
                  <h2 className="text-xl font-bold text-[#0f291e]">
                    03. Irrigation Decision Engine
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500">RULE-BASED LOGIC</span>
              </div>

              {/* Large Coloured Recommendation Card */}
              <div
                className={`rounded-xl p-6 border transition-colors ${
                  recommendation === 'IRRIGATE_NOW'
                    ? 'bg-red-50/90 border-red-300 text-red-950'
                    : recommendation === 'DELAY_IRRIGATION'
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                    : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-semibold opacity-80">
                      CURRENT RECOMMENDATION
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
                      {recommendation === 'IRRIGATE_NOW' && (
                        <>
                          <Droplets className="w-7 h-7 text-red-700 shrink-0" />
                          <span>IRRIGATE NOW</span>
                        </>
                      )}
                      {recommendation === 'DELAY_IRRIGATION' && (
                        <>
                          <Clock className="w-7 h-7 text-amber-700 shrink-0" />
                          <span>DELAY IRRIGATION</span>
                        </>
                      )}
                      {recommendation === 'CONTINUE_MONITORING' && (
                        <>
                          <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0" />
                          <span>CONTINUE MONITORING</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explanation with actual input values */}
                <p className="mt-4 text-sm sm:text-base leading-relaxed font-medium">
                  {getExplanationText(sensors, recommendation)}
                </p>

                {/* Active Rule Breakdown */}
                <div className="mt-4 pt-3 border-t border-black/10 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono">
                  <span>Soil Moisture: {sensors.soilMoisture}% (Threshold: 25%)</span>
                  <span aria-hidden="true">·</span>
                  <span>Rain Probability: {sensors.rainProbability}% (Threshold: 60%)</span>
                </div>
              </div>

              {/* Apply Recommendation Action */}
              <div className="bg-[#f6f8f6] rounded-lg border border-emerald-950/10 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-[#0f291e]">
                      Execute Recommended Pump Action
                    </div>
                    <div className="text-xs text-slate-600">
                      {recommendation === 'IRRIGATE_NOW'
                        ? 'Turns ON the simulated irrigation pump immediately.'
                        : 'Keeps the simulated irrigation pump OFF to conserve water.'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyRecommendation}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      recommendation === 'IRRIGATE_NOW'
                        ? 'bg-red-700 hover:bg-red-800'
                        : 'bg-[#1b4d3e] hover:bg-[#143d2d]'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Apply Recommendation
                  </button>
                </div>

                {lastAppliedMessage && (
                  <div className="text-xs font-medium text-[#143d2d] bg-emerald-100/70 border border-emerald-900/15 rounded-md px-3 py-2">
                    {lastAppliedMessage}
                  </div>
                )}
              </div>
            </div>

            {/* Mandatory Rule-Based Demonstration Disclaimer */}
            <div className="pt-3 border-t border-emerald-950/10 text-xs text-slate-600 leading-relaxed">
              <strong className="font-semibold text-[#0f291e]">Methodological Note:</strong> These
              are deterministic demonstration rules (Soil Moisture &lt; 25% and Rain Probability
              &lt; 60%), not a trained AI model or validated agronomic advice.
            </div>
          </div>
        </section>

        {/* 4. PUMP SIMULATION & 5. WATER USAGE */}
        <section id="pump-simulation" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 4. Simulated Irrigation Pump (Left 7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-emerald-950/10 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Power className="w-5 h-5 text-[#1b4d3e]" />
                  <h2 className="text-xl font-bold text-[#0f291e]">
                    04. Irrigation Pump Simulation
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500">NO PHYSICAL HARDWARE</span>
              </div>

              <p className="text-sm text-slate-600">
                Simulate pump activation manually or via the Decision Engine. When active, virtual
                water flow is animated and the water usage counter increments.
              </p>

              {/* Pump Control Bar & Status */}
              <div className="bg-[#f6f8f6] rounded-xl border border-emerald-950/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-slate-500">SIMULATED PUMP CONTROLLER</div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-lg font-bold font-mono ${
                        pumpOn ? 'text-emerald-800' : 'text-slate-700'
                      }`}
                    >
                      STATUS: {pumpOn ? 'PUMP ON (FLOWING)' : 'PUMP OFF (STANDBY)'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {pumpOn
                      ? manualOverride
                        ? 'Manually activated by operator.'
                        : 'Activated via Decision Engine recommendation.'
                      : 'Valve closed. Zero flow rate.'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleTogglePump}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      pumpOn
                        ? 'bg-red-700 text-white hover:bg-red-800'
                        : 'bg-[#1b4d3e] text-white hover:bg-[#143d2d]'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    {pumpOn ? 'Turn Pump OFF' : 'Turn Pump ON'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulatePostIrrigationRecheck}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-[#1b4d3e] bg-white hover:bg-emerald-50 border border-emerald-950/15 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    title="Simulate Step 5: Recheck soil moisture after watering"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Recheck Soil Moisture (+18%)
                  </button>
                </div>
              </div>

              {/* Safety Warning if manually activated when soil moisture is already high (>= 25%) */}
              {showHighMoistureSafetyWarning && (
                <div
                  role="alert"
                  className="rounded-lg bg-amber-50 border border-amber-300 p-4 flex items-start gap-3 text-amber-950"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="font-bold">
                      Safety Alert: High Soil Moisture Detected ({sensors.soilMoisture}%)
                    </div>
                    <p className="text-amber-900 leading-relaxed">
                      The simulated pump is currently ON even though soil moisture is already at{' '}
                      <span className="font-mono font-semibold">{sensors.soilMoisture}%</span> (at or
                      above the 25% sufficiency threshold). Irrigating wet soil risks root waterlogging
                      and unnecessary water consumption.
                    </p>
                  </div>
                </div>
              )}

              {/* Water Flow Animation Pipeline */}
              <div className="rounded-xl border border-emerald-950/10 bg-[#f6f8f6] p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-600">
                  <span>MAINLINE PIPE VISUALIZATION</span>
                  <span>FLOW RATE: {pumpOn ? '42.0 L/min (Simulated)' : '0.0 L/min'}</span>
                </div>

                {/* Pipe track */}
                <div className="relative h-10 rounded-lg bg-slate-200/90 border border-slate-300 overflow-hidden flex items-center px-4">
                  {pumpOn ? (
                    <>
                      <div className="absolute inset-0 bg-sky-500/20" />
                      <div className="absolute inset-y-1 left-0 right-0 bg-gradient-to-r from-transparent via-sky-500/70 to-transparent animate-water-stream" />
                      <div className="relative z-10 w-full flex items-center justify-between text-xs font-mono font-bold text-sky-950">
                        <span>PUMP INLET</span>
                        <span className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-sky-700 animate-droplet-1" />
                          <span>WATER FLOWING TO DRIP LINES</span>
                          <Droplets className="w-4 h-4 text-sky-700 animate-droplet-2" />
                        </span>
                        <span>FIELD EMITTERS</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs font-mono text-slate-500">
                      <span>PUMP INLET</span>
                      <span>VALVE CLOSED — NO WATER FLOW</span>
                      <span>FIELD EMITTERS</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-950/10 text-xs text-slate-500">
              Hardware Isolation: This toggle operates purely in browser memory and does not control
              any physical relay or irrigation valve.
            </div>
          </div>

          {/* 5. Water Usage Counter (Right 5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-emerald-950/10 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-[#1b4d3e]" />
                  <h2 className="text-xl font-bold text-[#0f291e]">
                    05. Simulated Water Usage
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500">LITRE COUNTER</span>
              </div>

              <p className="text-sm text-slate-600">
                Tracks cumulative simulated water volume dispensed while the virtual pump is active.
              </p>

              {/* Digital Volume Display */}
              <div className="bg-[#f6f8f6] rounded-xl border border-emerald-950/10 p-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      CUMULATIVE VOLUME DISPENSED
                    </div>
                    <div className="text-4xl sm:text-5xl font-bold font-mono text-[#0f291e] mt-1">
                      {waterUsedLitres.toFixed(2)} <span className="text-xl font-semibold">L</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs text-slate-500">ACTIVE DURATION</div>
                    <div className="text-lg font-bold text-[#1b4d3e] mt-1">
                      {pumpRuntimeSeconds}s
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-950/10 flex items-center justify-between text-xs text-slate-600">
                  <span>Increment rate: +0.35 L per 0.5s while pump is ON</span>
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-[#1b4d3e] bg-white hover:bg-emerald-50 border border-emerald-950/15 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Demonstration
                  </button>
                </div>
              </div>

              {/* Mandatory Water Savings Disclaimer */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <div className="font-bold text-slate-800">
                  Water Measurement &amp; Baseline Note
                </div>
                <p>
                  This counter displays simulated volume dispensed during the session and does not
                  claim verified water savings. In field deployment, real water savings must be
                  measured experimentally against a baseline conventional irrigation system over a
                  full crop cycle.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-950/10 flex items-center justify-between text-xs text-slate-500">
              <span>Session Status: {pumpOn ? 'Dispensing Water' : 'Idle'}</span>
              <span className="font-mono">SIMULATED METER</span>
            </div>
          </div>
        </section>

        {/* 6. SYSTEM ARCHITECTURE */}
        <section
          id="architecture"
          className="bg-white rounded-xl border border-emerald-950/10 p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#0f291e]">06. System Architecture</h2>
              <p className="text-sm text-slate-600">
                End-to-end data flow showing how proposed field hardware and weather services
                connect to the decision engine and farmer dashboard.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600">
              PROPOSED HARDWARE &amp; API INTEGRATIONS
            </div>
          </div>

          {/* Visual Flow Diagram */}
          <div className="bg-[#f6f8f6] rounded-xl border border-emerald-950/10 p-6">
            <div className="max-w-3xl mx-auto flex flex-col items-center space-y-3">
              {/* Node 1: Capacitive Soil Moisture Sensor */}
              <div className="w-full max-w-md bg-white rounded-lg border border-emerald-950/15 p-4 text-center">
                <div className="text-[11px] font-mono text-amber-800 font-semibold">
                  PROPOSED INTEGRATION · NOT CONNECTED HARDWARE
                </div>
                <div className="text-base font-bold text-[#0f291e] mt-0.5">
                  Capacitive Soil Moisture Sensor
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Measures volumetric water content in the root zone using dielectric capacitance.
                </p>
              </div>

              <ArrowDown className="w-5 h-5 text-[#1b4d3e]" />

              {/* Node 2: ESP32 */}
              <div className="w-full max-w-md bg-white rounded-lg border border-emerald-950/15 p-4 text-center">
                <div className="text-[11px] font-mono text-amber-800 font-semibold">
                  PROPOSED INTEGRATION · NOT CONNECTED HARDWARE
                </div>
                <div className="text-base font-bold text-[#0f291e] mt-0.5">
                  ESP32 Microcontroller
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Reads analog/digital sensor signals and transmits field telemetry over Wi-Fi.
                </p>
              </div>

              <ArrowDown className="w-5 h-5 text-[#1b4d3e]" />

              {/* Row with Weather Forecast API -> Decision Engine */}
              <div className="w-full grid grid-cols-1 md:grid-cols-11 items-center gap-3">
                {/* Weather Forecast API */}
                <div className="md:col-span-5 bg-white rounded-lg border border-emerald-950/15 p-4 text-center">
                  <div className="text-[11px] font-mono text-amber-800 font-semibold">
                    PROPOSED INTEGRATION · SIMULATED IN DEMO
                  </div>
                  <div className="text-base font-bold text-[#0f291e] mt-0.5">
                    Weather Forecast API
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Supplies local precipitation probability and atmospheric forecast data.
                  </p>
                </div>

                {/* Arrow Connecting Weather API to Decision Engine */}
                <div className="md:col-span-1 flex justify-center">
                  <ArrowRight className="hidden md:block w-5 h-5 text-[#1b4d3e]" />
                  <ArrowDown className="md:hidden w-5 h-5 text-[#1b4d3e]" />
                </div>

                {/* Decision Engine */}
                <div className="md:col-span-5 bg-[#1b4d3e] text-white rounded-lg border border-[#143d2d] p-4 text-center">
                  <div className="text-[11px] font-mono text-emerald-200 font-semibold">
                    ACTIVE IN DEMONSTRATION
                  </div>
                  <div className="text-base font-bold mt-0.5">Decision Engine</div>
                  <p className="text-xs text-emerald-100 mt-1">
                    Evaluates soil moisture and rain probability against threshold rules to select an
                    irrigation action.
                  </p>
                </div>
              </div>

              <ArrowDown className="w-5 h-5 text-[#1b4d3e]" />

              {/* Node 5: Farmer Dashboard */}
              <div className="w-full max-w-md bg-[#1b4d3e] text-white rounded-lg border border-[#143d2d] p-4 text-center">
                <div className="text-[11px] font-mono text-emerald-200 font-semibold">
                  ACTIVE IN DEMONSTRATION
                </div>
                <div className="text-base font-bold mt-0.5">Farmer Dashboard</div>
                <p className="text-xs text-emerald-100 mt-1">
                  Displays sensor metrics, transparent rule explanations, and manual or automated
                  pump controls.
                </p>
              </div>

              <ArrowDown className="w-5 h-5 text-[#1b4d3e]" />

              {/* Node 6: Pump Controller */}
              <div className="w-full max-w-md bg-white rounded-lg border border-emerald-950/15 p-4 text-center">
                <div className="text-[11px] font-mono text-amber-800 font-semibold">
                  PROPOSED INTEGRATION · NOT CONNECTED HARDWARE
                </div>
                <div className="text-base font-bold text-[#0f291e] mt-0.5">Pump Controller</div>
                <p className="text-xs text-slate-600 mt-1">
                  Actuates the relay switch to start or stop the physical water pump in a full
                  hardware deployment.
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2 pt-1">
            <span>
              <strong>Hardware Status Note:</strong> Physical sensors, the ESP32 microcontroller,
              external Weather Forecast APIs, and the physical Pump Controller are proposed
              integrations and are not connected to this web application.
            </span>
          </div>
        </section>

        {/* 7. PROJECT INFORMATION: How It Works & Future Development */}
        <section id="how-it-works" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* How It Works (5 Steps) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-emerald-950/10 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-[#1b4d3e]" />
                <h2 className="text-xl font-bold text-[#0f291e]">
                  07. How It Works (Operational Workflow)
                </h2>
              </div>

              <ol className="space-y-3">
                {[
                  {
                    step: '01',
                    title: 'Read soil moisture and environmental conditions.',
                    detail:
                      'Simulated capacitive moisture, temperature, and humidity values are sampled.',
                  },
                  {
                    step: '02',
                    title: 'Obtain weather forecast information.',
                    detail:
                      'Rain probability percentage is retrieved to anticipate upcoming natural precipitation.',
                  },
                  {
                    step: '03',
                    title: 'Analyse the inputs using the irrigation decision engine.',
                    detail:
                      'Inputs are compared against the 25% soil moisture and 60% rain probability thresholds.',
                  },
                  {
                    step: '04',
                    title: 'Recommend irrigation, delay, or monitoring.',
                    detail:
                      'The dashboard highlights the recommended action alongside a plain-language explanation.',
                  },
                  {
                    step: '05',
                    title: 'Recheck soil moisture after irrigation.',
                    detail:
                      'Following pump operation, soil moisture is re-evaluated to return the system to monitoring mode.',
                  },
                ].map((item) => (
                  <li
                    key={item.step}
                    className="flex items-start gap-3.5 p-3.5 rounded-lg bg-[#f6f8f6] border border-emerald-950/10"
                  >
                    <span className="font-mono text-sm font-bold text-[#1b4d3e] shrink-0 mt-0.5">
                      {item.step}.
                    </span>
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-[#0f291e]">{item.title}</div>
                      <div className="text-xs text-slate-600">{item.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Future Development: Random Forest Note */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-emerald-950/10 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#1b4d3e]" />
                <h2 className="text-xl font-bold text-[#0f291e]">Future Development</h2>
              </div>

              <div className="p-5 rounded-xl bg-[#f6f8f6] border border-emerald-950/10 space-y-3">
                <div className="text-xs font-mono font-semibold text-[#1b4d3e]">
                  ROADMAP · MACHINE LEARNING UPGRADE
                </div>
                <h3 className="text-base font-bold text-[#0f291e]">
                  Random Forest Classification &amp; Regression
                </h3>
                <p className="text-sm text-[#0f291e] font-medium leading-relaxed bg-white p-3.5 rounded-lg border border-emerald-950/10">
                  &ldquo;A trained Random Forest model may replace the demonstration rules after
                  suitable training data has been collected and evaluated.&rdquo;
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Currently, AgriMind AI uses transparent, deterministic threshold rules so every
                  recommendation can be verified during project demonstrations. No Random Forest
                  model is currently implemented. Future iterations aim to incorporate multi-season
                  agronomic datasets, soil type profiles, and crop growth stages.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-950/10 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Reset all sensors, scenarios, and counters to default state:
              </div>
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#1b4d3e] hover:bg-[#143d2d] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-emerald-950/10 py-5 px-6 mt-12">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            AgriMind AI – Smart Irrigation for a Sustainable Tomorrow · College Project Demonstration
          </div>
          <div className="flex items-center gap-3">
            <span>100% Simulated Sensor Telemetry</span>
            <span aria-hidden="true">·</span>
            <span>Rule-Based Decision Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
