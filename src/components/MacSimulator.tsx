import React, { useState, useEffect, useRef } from 'react';
import { ClickConfig, LogEntry } from '../types';
import { 
  Monitor, 
  Settings2, 
  MousePointer2, 
  SlidersHorizontal, 
  Maximize2,
  ChevronRight,
  Info,
  Apple,
  Clock,
  Play,
  Square,
  Sparkles,
  Award
} from 'lucide-react';

interface MacSimulatorProps {
  config: ClickConfig;
  isActive: boolean;
  permissionGranted: boolean;
  onGrantPermission: () => void;
  onCoordinateChange: (x: number, y: number) => void;
  onAddLog: (message: string, type: 'info' | 'success' | 'warn' | 'click') => void;
  onAutoStop: () => void;
}

export const MacSimulator: React.FC<MacSimulatorProps> = ({
  config,
  isActive,
  permissionGranted,
  onGrantPermission,
  onCoordinateChange,
  onAddLog,
  onAutoStop
}) => {
  const [showSettingsPopover, setShowSettingsPopover] = useState<boolean>(false);
  const [pixelScore, setPixelScore] = useState<number>(0);
  const [clickCount, setClickCount] = useState<number>(0);
  const [cursorPos, setCursorPos] = useState({ x: 120, y: 150 });
  const [pulsePos, setPulsePos] = useState({ x: 0, y: 0 });
  const [triggerPulse, setTriggerPulse] = useState<boolean>(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const clickCountRef = useRef<number>(0);
  const durationStartRef = useRef<number>(0);

  // Stop conditions evaluation
  useEffect(() => {
    if (isActive) {
      clickCountRef.current = 0;
      durationStartRef.current = Date.now();
    }
  }, [isActive]);

  // Simulate cursor movement and auto clicking inside macOS Simulator
  useEffect(() => {
    if (!isActive || !permissionGranted) return;

    const interval = setInterval(() => {
      // 1. Evaluate termination bounds
      if (config.stopOnCount) {
        if (clickCountRef.current >= config.stopCountValue) {
          onAddLog(`[Stop Condition met] macOS Auto-clicker stopped after triggering ${config.stopCountValue} clicks limit.`, 'info');
          onAutoStop();
          return;
        }
      }

      if (config.stopOnDuration) {
        const elapsed = (Date.now() - durationStartRef.current) / 1000;
        if (elapsed >= config.stopDurationValue) {
          onAddLog(`[Stop Condition met] macOS Auto-clicker stopped after exceeding ${config.stopDurationValue}s time limit.`, 'info');
          onAutoStop();
          return;
        }
      }

      // 2. Resolve tap spot coordinates on simulator layout
      let px = config.customX;
      let py = config.customY;

      if (config.coordinateMode === 'current') {
        // Drift position simulation
        px = 320 + Math.floor(Math.sin(Date.now() / 1000) * 80);
        py = 180 + Math.floor(Math.cos(Date.now() / 1200) * 40);
      }

      // Smoothly animate virtual cursor slide towards click coordinates
      setCursorPos({ x: px, y: py });

      // Check if click hits target desk widget board
      // Widget dimensions relative bounds: X (280 to 480), Y (100 to 250)
      const targetMinX = 260;
      const targetMaxX = 460;
      const targetMinY = 90;
      const targetMaxY = 230;

      const hitTarget = px >= targetMinX && px <= targetMaxX && py >= targetMinY && py <= targetMaxY;
      const multiplier = config.clickType === 'double' ? 2 : 1;

      for (let i = 0; i < multiplier; i++) {
        setTimeout(() => {
          clickCountRef.current += 1;
          setPulsePos({ x: px, y: py });
          setTriggerPulse(true);
          setTimeout(() => setTriggerPulse(false), 250);

          if (hitTarget) {
            setPixelScore(prev => prev + (config.clickType === 'hold' ? 10 : 5));
            setClickCount(prev => prev + 1);
          }

          onAddLog(`[macOS AX Swift] Dispatching virtual CGMouseEvent at coordinate Cartesian position (${px}, ${py})`, 'click');
        }, i * 150);
      }

    }, config.intervalMs);

    return () => clearInterval(interval);
  }, [isActive, permissionGranted, config, onAddLog, onAutoStop]);

  const handleDesktopClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (config.coordinateMode !== 'custom') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = Math.round(e.clientX - rect.left);
    const relativeY = Math.round(e.clientY - rect.top);

    // Limit layout boundaries: width=530, height=340
    const clampedY = Math.max(0, Math.min(340, relativeY));
    const clampedX = Math.max(0, Math.min(530, relativeX));

    onCoordinateChange(clampedX, clampedY);
    setCursorPos({ x: clampedX, y: clampedY });
    onAddLog(`Manually targeted coordinates inside macOS wallpaper layout at X:${clampedX} Y:${clampedY}`, 'info');
  };

  const handleGrantPermissionAndNotify = () => {
    onGrantPermission();
    onAddLog("[macOS Swift] Accessibility trust granted via AXIsProcessTrustedWithOptions query verification.", "success");
  };

  return (
    <div className="flex flex-col items-center w-full">
      
      {/* Heavy Desktop monitor workstation visual shell */}
      <div className="w-full max-w-[550px] bg-slate-900 rounded-2xl p-2.5 shadow-2xl border-4 border-slate-700 relative overflow-hidden flex flex-col justify-start">
        
        {/* macOS Top System MenuBar */}
        <div className="h-6 bg-[#0c0d11]/90 backdrop-blur text-white flex items-center justify-between px-3 select-none text-[10px] sm:text-xs z-30 border-b border-white/5 font-sans">
          <div className="flex items-center gap-3">
            <Apple className="w-3 h-3 fill-white text-white mt-[-1px]" />
            <span className="font-bold cursor-pointer">AutoClicker</span>
            <span className="text-slate-400 font-medium hidden sm:inline">File</span>
            <span className="text-slate-400 font-medium hidden sm:inline">Edit</span>
            <span className="text-slate-400 font-medium hidden md:inline">Window</span>
            <span className="text-slate-400 font-medium hidden md:inline">Help</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] hidden sm:inline">Accessibility Trusted:</span>
            <span className={`w-1.5 h-1.5 rounded-full ${permissionGranted ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`}></span>
            <span className="font-medium mr-1.5">22:01 PM</span>
          </div>
        </div>

        {/* Desktop Screen Canvas Workspace */}
        <div 
          ref={containerRef}
          onClick={handleDesktopClick}
          className="w-full h-[320px] bg-gradient-to-tr from-cyan-900 via-indigo-950 to-pink-900 relative overflow-hidden cursor-crosshair"
        >
          {/* Animated custom visual tapping cursor */}
          <div 
            className="absolute z-40 pointer-events-none transition-all duration-300"
            style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
          >
            <MousePointer2 className="w-5 h-5 text-teal-300 fill-teal-100 drop-shadow shadow-teal-500/50" />
            <div className="absolute top-4 left-4 bg-slate-950/85 text-[8px] font-mono px-1 border border-slate-700 rounded text-slate-300 shadow">
              {cursorPos.x},{cursorPos.y}
            </div>
          </div>

          {/* Visual crosshair target indicator if custom coordinates set */}
          {config.coordinateMode === 'custom' && (
            <div 
              className="absolute pointer-events-none z-30"
              style={{ left: `${config.customX - 10}px`, top: `${config.customY - 10}px` }}
            >
              <div className="w-5 h-5 border border-dashed border-red-400 rounded-full flex items-center justify-center animate-spin">
                <div className="w-1 h-1 bg-red-400 rounded-full"></div>
              </div>
            </div>
          )}

          {/* Expanded Pulse wave tap visualization */}
          {triggerPulse && (
            <div 
              className="absolute z-40 w-12 h-12 border border-teal-400 rounded-full pointer-events-none animate-ping opacity-70"
              style={{ left: `${pulsePos.x - 20}px`, top: `${pulsePos.y - 20}px` }}
            ></div>
          )}

          {/* 1. Simulated App window inside macOS: "Cursor Speed-Tapper Widget" */}
          <div className="absolute top-10 left-6 w-[200px] bg-slate-900/90 text-white rounded-xl shadow-lg border border-slate-800 backdrop-blur p-3 select-none z-20 font-sans">
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2">
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 ml-1">Speed-Tapper Widget</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                <span className="text-slate-400">Score</span>
                <span className="font-bold text-teal-400">{pixelScore} pts</span>
              </div>

              <div className="flex justify-between items-center text-[10px] bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                <span className="text-slate-400">Ticks</span>
                <span className="font-bold text-amber-400">{clickCount} clicks</span>
              </div>

              <div className="text-[9px] text-slate-500 leading-normal text-center">
                Configure coordinates to target this widget window and score points at the specified intervals!
              </div>
            </div>
          </div>

          {/* 2. Floating macOS Auto Clicker Controller overlay widget matching native structure */}
          <div className="absolute top-8 right-6 w-[210px] bg-slate-950/95 border border-teal-900/50 rounded-xl shadow-2xl p-3 z-20 font-sans backdrop-blur">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
              <span className="text-[10px] font-black tracking-wide text-teal-400 font-mono uppercase">Control Widget</span>
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${
                permissionGranted ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-red-950 text-red-400 border border-red-900'
              }`}>
                {permissionGranted ? 'AX ACTIVE' : 'AX REQUIRED'}
              </span>
            </div>

            <div className="space-y-2.5">
              {!permissionGranted ? (
                <div className="p-2 bg-red-950/20 border border-red-900/30 rounded-lg space-y-2">
                  <p className="text-[9px] text-slate-400">AX trust is missing. Please authorize client permissions first.</p>
                  <button
                    onClick={handleGrantPermissionAndNotify}
                    className="w-full bg-red-650 hover:bg-red-700 text-white font-bold text-[9px] py-1.5 rounded cursor-pointer transition-all"
                  >
                    Grant AX Trust
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-1 text-[9px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Interval</span>
                      <span className="text-white font-mono">{config.intervalMs}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mode</span>
                      <span className="text-white capitalize">{config.clickType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className={`font-mono font-bold ${isActive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`}>
                        {isActive ? 'AUTO CLICKING...' : 'STOPPED'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-850 pt-2 flex justify-between items-center text-[10px] font-sans">
                    <span className="text-slate-500">Auto Stop limit:</span>
                    <span className="text-slate-350 font-bold font-mono">
                      {config.stopOnCount ? `${config.stopCountValue}c` : config.stopOnDuration ? `${config.stopDurationValue}s` : '∞'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom App launcher Dock mimicking classic macOS interface */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-2xl px-3 py-1 flex gap-2 border border-white/20 select-none z-10">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg shadow-md flex items-center justify-center text-xs font-bold text-white cursor-pointer relative group">
              <span>Fi</span>
              <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">Finder</div>
            </div>
            <div className="w-7 h-7 bg-cyan-500 rounded-lg shadow-md flex items-center justify-center text-xs font-bold text-white cursor-pointer relative group">
              <span>Sa</span>
              <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">Safari</div>
            </div>
            <div className="w-7 h-7 bg-slate-700 border border-slate-600 rounded-lg shadow-md flex items-center justify-center text-xs font-bold text-white cursor-pointer relative group">
              <span>Te</span>
              <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">Terminal</div>
            </div>
            <div className="w-7 h-7 bg-teal-600 rounded-lg shadow-md flex items-center justify-center text-xs font-bold text-white cursor-pointer relative group border border-teal-500">
              <Sparkles className="w-4 h-4 text-white" />
              <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">Clicker</div>
            </div>
          </div>

        </div>

      </div>

      <div className="mt-4 flex flex-col items-center max-w-sm text-center px-4">
        <span className="text-xs font-black text-slate-750 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider mb-2">macOS events service mode</span>
        <p className="text-xs text-slate-500 leading-normal">
          In macOS, the utility registers with system Accessibility APIs to hook the CoreGraphics framework and programmatically generate hardware mouse clicks down/up globally.
        </p>
      </div>

    </div>
  );
};
