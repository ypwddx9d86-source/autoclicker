import React, { useState } from 'react';
import { ClickConfig, ClickType } from '../types';
import { 
  Play, 
  Square, 
  Settings2, 
  MousePointer, 
  Crosshair, 
  Clock, 
  HelpCircle,
  Hash,
  AlertCircle
} from 'lucide-react';

interface SettingsPanelProps {
  config: ClickConfig;
  onChange: (updater: Partial<ClickConfig>) => void;
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  permissionGranted: boolean;
  onRequestPermission: () => void;
  platform: 'android' | 'macos' | 'ios';
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  onChange,
  isActive,
  onStart,
  onStop,
  permissionGranted,
  onRequestPermission,
  platform
}) => {
  const [intervalUnit, setIntervalUnit] = useState<'ms' | 'sec' | 'min'>('ms');
  const [inputValue, setInputValue] = useState<number>(config.intervalMs);

  const handleUnitChange = (unit: 'ms' | 'sec' | 'min') => {
    setIntervalUnit(unit);
    // Convert current value
    let baseMs = inputValue;
    if (intervalUnit === 'sec') baseMs = inputValue * 1000;
    if (intervalUnit === 'min') baseMs = inputValue * 60 * 1000;

    let newVal = baseMs;
    if (unit === 'ms') newVal = baseMs;
    if (unit === 'sec') newVal = Math.max(1, Math.round(baseMs / 100)) / 10;
    if (unit === 'min') newVal = Math.max(1, Math.round(baseMs / 6000)) / 10;

    setInputValue(newVal);
  };

  const handleIntervalNumberChange = (num: number) => {
    const val = isNaN(num) || num <= 0 ? 1 : num;
    setInputValue(val);
    
    // update parent
    let ms = val;
    if (intervalUnit === 'sec') ms = val * 1000;
    if (intervalUnit === 'min') ms = val * 60 * 1000;
    onChange({ intervalMs: Math.round(ms) });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-slate-800 text-lg">Clicker Configuration</h3>
        </div>
        <span className="text-xs font-medium text-slate-400 font-mono uppercase bg-slate-50 px-2 py-1 rounded">
          {platform} controller
        </span>
      </div>

      {/* Permission Check & Status Wizard */}
      {platform !== 'ios' && (
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
          permissionGranted 
            ? 'bg-teal-50/50 border-teal-100 text-teal-800' 
            : 'bg-amber-50/70 border-amber-100 text-amber-800'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${permissionGranted ? 'text-teal-600' : 'text-amber-600'}`} />
            <div>
              <p className="font-semibold text-sm">
                {permissionGranted ? 'System Accessibility Hooked' : 'Accessibility Permission Required'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {permissionGranted 
                  ? 'Permission successfully verified! Clicker is fully authorized to trigger global tapping events across device applications.' 
                  : `Please authorize accessibility permission in system context to dispatch simulate gestures globally for ${platform}.`
                }
              </p>
            </div>
          </div>
          {!permissionGranted && (
            <button
              onClick={onRequestPermission}
              className="bg-amber-600 text-white font-medium hover:bg-amber-700 text-xs px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap self-stretch md:self-center"
            >
              Configure Service
            </button>
          )}
        </div>
      )}

      {/* 1. Click Interval Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Click Interval</label>
        <div className="flex rounded-lg shadow-sm border border-slate-200 p-1 bg-slate-50 justify-between gap-1">
          <button
            type="button"
            onClick={() => handleUnitChange('ms')}
            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
              intervalUnit === 'ms' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Milliseconds
          </button>
          <button
            type="button"
            onClick={() => handleUnitChange('sec')}
            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
              intervalUnit === 'sec' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Seconds
          </button>
          <button
            type="button"
            onClick={() => handleUnitChange('min')}
            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
              intervalUnit === 'min' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Minutes
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <input
            type="number"
            min="1"
            value={inputValue}
            onChange={(e) => handleIntervalNumberChange(parseFloat(e.target.value))}
            className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 font-mono transition-all text-sm"
          />
          <span className="text-slate-500 font-medium text-xs font-mono w-12 text-center bg-slate-100 rounded py-2">
            {intervalUnit}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-mono">
          Resolves to: <strong className="text-slate-600">{config.intervalMs} ms</strong> between triggers
        </p>
      </div>

      {/* 2. Click Type Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Click Style & Gesture</label>
        <div className="grid grid-cols-3 gap-2">
          {(['single', 'double', 'hold'] as ClickType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ clickType: type })}
              className={`py-2 px-3 border rounded-xl text-xs font-semibold text-center transition-all ${
                config.clickType === type
                  ? 'border-teal-600 bg-teal-50/40 text-teal-700 font-bold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="capitalize">{type === 'hold' ? 'Click & Hold' : `${type} Click`}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          {config.clickType === 'single' && 'Executes standard down/up event cycle of 70ms duration.'}
          {config.clickType === 'double' && 'Queues continuous sequence of dual clicks spaced by 120ms.'}
          {config.clickType === 'hold' && 'Executes solid down hold state sustained for 1.5 seconds.'}
        </p>
      </div>

      {/* 3. Coordinate Mode */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Trigger Location</label>
        <div className="space-y-2.5">
          <label className="flex items-start gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors cursor-pointer">
            <input
              type="radio"
              name="coordinateMode"
              checked={config.coordinateMode === 'current'}
              onChange={() => onChange({ coordinateMode: 'current' })}
              className="mt-1 accent-teal-600"
            />
            <div>
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5 text-slate-400" /> Current Pointer Position
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Tracks current hardware mouse index cursor to click relative to real fingers or pointer location.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors cursor-pointer">
            <input
              type="radio"
              name="coordinateMode"
              checked={config.coordinateMode === 'custom'}
              onChange={() => onChange({ coordinateMode: 'custom' })}
              className="mt-1 accent-teal-600"
            />
            <div className="flex-1">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-slate-400" /> Fixed Screen Coordinates
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5 mb-2">
                Coordinates are bound in rigid X and Y limits. Click or drag targets in the simulated device to set!
              </p>

              {config.coordinateMode === 'custom' && (
                <div className="grid grid-cols-2 gap-3 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">X Pixels</span>
                    <input
                      type="number"
                      value={config.customX}
                      onChange={(e) => onChange({ customX: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white px-2 py-1 rounded text-xs font-mono border border-slate-200 outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">Y Pixels</span>
                    <input
                      type="number"
                      value={config.customY}
                      onChange={(e) => onChange({ customY: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white px-2 py-1 rounded text-xs font-mono border border-slate-200 outline-none focus:border-teal-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* 4. Termination / Stop Conditions */}
      <div className="border-t border-slate-100 pt-5 space-y-4">
        <label className="block text-sm font-semibold text-slate-700">Termination Controls</label>
        
        <div className="space-y-3">
          {/* Infinite */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.stopOnInfinite}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({
                    stopOnInfinite: true,
                    stopOnCount: false,
                    stopOnDuration: false
                  });
                }
              }}
              className="accent-teal-600 rounded"
            />
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Loop Infinitely (until manually toggled)
            </span>
          </label>

          {/* Counts */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.stopOnCount}
                onChange={(e) => {
                  onChange({
                    stopOnCount: e.target.checked,
                    stopOnInfinite: !e.target.checked && !config.stopOnDuration ? true : false
                  });
                }}
                className="accent-teal-600 rounded"
              />
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> Stop after a target amount of clicks
              </span>
            </label>
            {config.stopOnCount && (
              <div className="pl-6 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={config.stopCountValue}
                  onChange={(e) => onChange({ stopCountValue: parseInt(e.target.value) || 50 })}
                  className="w-32 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 outline-none"
                />
                <span className="text-xs text-slate-400">clicks</span>
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.stopOnDuration}
                onChange={(e) => {
                  onChange({
                    stopOnDuration: e.target.checked,
                    stopOnInfinite: !e.target.checked && !config.stopOnCount ? true : false
                  });
                }}
                className="accent-teal-600 rounded"
              />
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Stop after a specific period of time
              </span>
            </label>
            {config.stopOnDuration && (
              <div className="pl-6 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={config.stopDurationValue}
                  onChange={(e) => onChange({ stopDurationValue: parseInt(e.target.value) || 60 })}
                  className="w-32 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 outline-none"
                />
                <span className="text-xs text-slate-400">seconds</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start / Stop Execution buttons */}
      <div className="border-t border-slate-100 pt-5 flex gap-3">
        {isActive ? (
          <button
            onClick={onStop}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-red-100 border border-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Square className="w-4 h-4 fill-white" /> Stop Auto Clicker
          </button>
        ) : (
          <button
            onClick={onStart}
            className={`flex-1 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              platform !== 'ios' && !permissionGranted
                ? 'bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-100 border border-teal-700'
            }`}
          >
            <Play className="w-4 h-4 fill-white" /> Start Auto Clicker
          </button>
        )}
      </div>
    </div>
  );
};
