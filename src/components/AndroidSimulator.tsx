import React, { useState, useEffect, useRef } from 'react';
import { ClickConfig, LogEntry } from '../types';
import { 
  Wifi, 
  Battery, 
  Signal, 
  Settings, 
  ShieldAlert, 
  Coins, 
  Info,
  Sliders,
  Sparkles,
  Trophy,
  Maximize2
} from 'lucide-react';

interface AndroidSimulatorProps {
  config: ClickConfig;
  isActive: boolean;
  permissionGranted: boolean;
  onGrantPermission: () => void;
  onCoordinateChange: (x: number, y: number) => void;
  onAddLog: (message: string, type: 'info' | 'success' | 'warn' | 'click') => void;
  onAutoStop: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  amount: number;
}

export const AndroidSimulator: React.FC<AndroidSimulatorProps> = ({
  config,
  isActive,
  permissionGranted,
  onGrantPermission,
  onCoordinateChange,
  onAddLog,
  onAutoStop
}) => {
  const [showSettingsWizard, setShowSettingsWizard] = useState<boolean>(false);
  const [goldScore, setGoldScore] = useState<number>(0);
  const [tapCount, setTapCount] = useState<number>(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [triggerPulse, setTriggerPulse] = useState<boolean>(false);
  const [pulsePos, setPulsePos] = useState({ x: 0, y: 0 });
  const [accessibilityStep, setAccessibilityStep] = useState<'intro' | 'list' | 'toggle' | 'confirm'>('intro');

  const containerRef = useRef<HTMLDivElement>(null);
  const clickCountRef = useRef<number>(0);
  const durationStartRef = useRef<number>(0);

  // Stop conditions validation
  useEffect(() => {
    if (isActive) {
      clickCountRef.current = 0;
      durationStartRef.current = Date.now();
    }
  }, [isActive]);

  // Simulated click process loop based on configuration interval
  useEffect(() => {
    if (!isActive || !permissionGranted) return;

    const interval = setInterval(() => {
      // 1. Evaluate termination bounds
      if (config.stopOnCount) {
        if (clickCountRef.current >= config.stopCountValue) {
          onAddLog(`[Stop Condition met] Auto-clicker stopped after triggering ${config.stopCountValue} clicks limit.`, 'info');
          onAutoStop();
          return;
        }
      }

      if (config.stopOnDuration) {
        const elapsed = (Date.now() - durationStartRef.current) / 1000;
        if (elapsed >= config.stopDurationValue) {
          onAddLog(`[Stop Condition met] Auto-clicker stopped after exceeding ${config.stopDurationValue}s time limit.`, 'info');
          onAutoStop();
          return;
        }
      }

      // 2. Resolve tap spot coordinates on simulator layout
      let px = config.customX;
      let py = config.customY;

      if (config.coordinateMode === 'current') {
        // Randomly drifts standard pointer location to emulate typical physical focus coordinate range
        px = 140 + Math.floor(Math.random() * 60);
        py = 280 + Math.floor(Math.random() * 80);
      }

      // Check if tap fell inside the click gold target area
      // Target area ranges: X(40px to 260px) Y(230px to 410px) relative to simulated screen offset sizes
      const targetMinX = 50;
      const targetMaxX = 250;
      const targetMinY = 240;
      const targetMaxY = 400;

      const isInsideTarget = px >= targetMinX && px <= targetMaxX && py >= targetMinY && py <= targetMaxY;
      
      // Determine click multiplier values 
      const clickMultiplier = config.clickType === 'double' ? 2 : 1;
      const amountOfClicks = clickMultiplier;

      // Process trigger clicks
      for (let i = 0; i < amountOfClicks; i++) {
        setTimeout(() => {
          clickCountRef.current += 1;
          
          // Trigger animations
          setPulsePos({ x: px, y: py });
          setTriggerPulse(true);
          setTimeout(() => setTriggerPulse(false), 300);

          if (isInsideTarget) {
            const addedGold = config.clickType === 'hold' ? 12 : 3;
            setGoldScore(prev => prev + addedGold);
            setTapCount(prev => prev + 1);

            // spawn particle
            const newParticle: Particle = {
              id: Date.now() + Math.random(),
              x: px,
              y: py - 20,
              amount: addedGold
            };
            setParticles(prev => [...prev, newParticle].slice(-10)); // cap particles count
          }

          onAddLog(`[Android OS] Emulated ${config.clickType} click gesture at coordinate index (${px}px, ${py}px)`, 'click');
        }, i * 120); // space double clicks
      }

    }, config.intervalMs);

    return () => clearInterval(interval);
  }, [isActive, permissionGranted, config, onAddLog, onAutoStop]);

  // Clean-up particle animations
  useEffect(() => {
    if (particles.length > 0) {
      const timer = setTimeout(() => {
        setParticles(prev => prev.filter(p => Date.now() - p.id < 1200));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [particles]);

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (config.coordinateMode !== 'custom' || showSettingsWizard) return;
    
    // Calculate coordinates relative to screen block container
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = Math.round(e.clientX - rect.left);
    const relativeY = Math.round(e.clientY - rect.top);

    // Limit within real screen aspect bounds (300px width, 560px height)
    const fitX = Math.max(0, Math.min(300, relativeX));
    const fitY = Math.max(0, Math.min(560, relativeY));

    onCoordinateChange(fitX, fitY);
    onAddLog(`Coordinate pointer set manually to Android screen (X: ${fitX}px, Y: ${fitY}px)`, 'info');
  };

  const handleToggleAccessibilityPermission = () => {
    setAccessibilityStep('toggle');
  };

  const handleConfirmAccessibility = () => {
    setAccessibilityStep('confirm');
    setTimeout(() => {
      onGrantPermission();
      setShowSettingsWizard(false);
      onAddLog("[Android System] Accessibility permission verified. AutoClickerAccessibilityService is now active.", "success");
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center">
      
      {/* Smartphone hardware outer frame shell with responsive dimensions */}
      <div className="w-[330px] h-[630px] bg-slate-900 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-850 relative flex flex-col justify-between overflow-hidden">
        
        {/* Notch details / front-facing cam */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-3.5 h-3.5 bg-slate-950 rounded-full border-2 border-slate-800"></div>
          <div className="w-12 h-1 bg-slate-800 rounded-full ml-3"></div>
        </div>

        {/* Floating coordinate highlight indicator targeting crosshair */}
        {config.coordinateMode === 'custom' && !showSettingsWizard && (
          <div 
            className="absolute z-40 flex flex-col items-center pointer-events-none transition-all duration-100"
            style={{ 
              left: `${config.customX + 14}px`, // adjustments for margins padding
              top: `${config.customY + 14}px` 
            }}
          >
            <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center shadow-lg relative bg-red-500/10">
              <div className="w-1.5 h-1.5 bg-red-650 rounded-full"></div>
            </div>
            <span className="bg-slate-950/80 text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded border border-slate-700 mt-1 shadow-md whitespace-nowrap">
              X:{config.customX}, Y:{config.customY}
            </span>
          </div>
        )}

        {/* Pulse Tap effect generator animation */}
        {triggerPulse && (
          <div 
            className="absolute z-40 w-10 h-10 border-4 border-teal-500 rounded-full pointer-events-none animate-ping opacity-75"
            style={{ 
              left: `${pulsePos.x - 6}px`, 
              top: `${pulsePos.y - 6}px` 
            }}
          ></div>
        )}

        {/* Screen inner displays and viewport wrapper */}
        <div 
          ref={containerRef}
          onClick={handleScreenClick}
          className="w-full flex-1 bg-slate-950 rounded-[30px] border border-slate-800 flex flex-col justify-between overflow-hidden relative cursor-crosshair"
        >
          {/* A. Android top System Status Bar */}
          <div className="h-9 px-6 flex items-center justify-between text-white text-[10px] select-none font-sans z-35">
            <span className="font-bold">22:01</span>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5 rotate-90 ml-0.5" />
            </div>
          </div>

          {/* B. Core Android Screen Contents */}
          <div className="flex-1 flex flex-col relative overflow-hidden text-slate-100 p-4">
            
            {/* 1. Android Permission Wizard Layer Overlay */}
            {showSettingsWizard ? (
              <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col justify-between p-4 animate-fade-in font-sans">
                
                {accessibilityStep === 'intro' && (
                  <div className="space-y-4 flex-1 flex flex-col justify-center text-center">
                    <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-2 text-amber-500 animate-pulse">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h5 className="font-bold text-slate-100 text-sm">System Permission Hub</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-[240px] mx-auto">
                      Auto Clicker needs Accessibility Permissions to dispatch tap events at simulated coordinate targets system-wide.
                    </p>
                    <button
                      onClick={() => setAccessibilityStep('list')}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2 px-4 rounded-lg self-center cursor-pointer transition-all"
                    >
                      Authorize Access
                    </button>
                  </div>
                )}

                {accessibilityStep === 'list' && (
                  <div className="space-y-4 flex-1 flex flex-col justify-start">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-400 font-sans">Settings &gt; Accessibility</span>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 pr-2">
                      Locate <strong className="text-white">Auto Clicker Studio</strong> under Downloaded Apps on your device screen and enable it:
                    </p>

                    <div className="space-y-1.5">
                      <div className="p-2.5 bg-slate-800/10 border border-slate-800/50 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <p className="text-slate-400 text-[10px]">TalkBack</p>
                          <p className="text-slate-500 text-[9px]">Off</p>
                        </div>
                      </div>
                      
                      <div 
                        onClick={handleToggleAccessibilityPermission}
                        className="p-2.5 bg-teal-950/20 border border-teal-800/40 rounded-lg flex items-center justify-between text-xs cursor-pointer hover:bg-teal-950/40 transition-colors animate-pulse"
                      >
                        <div>
                          <p className="font-bold text-teal-300">Auto Clicker Pro</p>
                          <p className="text-teal-500 text-[9px]">Tap to turn ON</p>
                        </div>
                        <span className="text-[10px] text-teal-400 font-bold font-sans">Action →</span>
                      </div>

                      <div className="p-2.5 bg-slate-800/10 border border-slate-800/50 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <p className="text-slate-400 text-[10px]">Accessibility Menu</p>
                          <p className="text-slate-500 text-[9px]">Off</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {accessibilityStep === 'toggle' && (
                  <div className="space-y-5 flex-1 flex flex-col justify-center p-3 text-center">
                    <h6 className="font-bold text-slate-200 text-xs">Acknowledge Security Context</h6>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-left space-y-2">
                      <p className="text-[9px] text-slate-500 leading-normal">
                        By system protocols, enabling this service grants permission to evaluate screen fields, simulate target gestures, and automate UI inputs globally.
                      </p>
                      <p className="text-[9px] text-amber-500/90 font-bold font-sans flex gap-1 items-start">
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        Permissions apply strictly locally to dispatch custom user tapping intervals. No telemetry leaves the local device storage.
                      </p>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setAccessibilityStep('list')}
                        className="flex-1 bg-slate-800/80 text-slate-300 font-semibold text-[11px] py-2 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmAccessibility}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] py-1.5 rounded transition-all cursor-pointer"
                      >
                        Grant API Access
                      </button>
                    </div>
                  </div>
                )}

                {accessibilityStep === 'confirm' && (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-center">
                    <div className="w-12 h-12 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
                    <p className="text-xs text-teal-400 font-medium font-sans">Authorizing Android Service...</p>
                  </div>
                )}

                <button
                  onClick={() => setShowSettingsWizard(false)}
                  className="mt-4 text-[10px] text-slate-500 hover:text-slate-400 text-center font-semibold tracking-wide cursor-pointer py-1 block"
                >
                  ← Return to Simulator App
                </button>
              </div>
            ) : null}

            {/* 2. Standard Active App inside Android: "Gold Mine Clicker Tracker" */}
            <div className="flex-1 flex flex-col justify-between">
              
              {/* Challenge Header info dashboard */}
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-850">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  <div>
                    <span className="text-[9px] text-slate-500 font-semibold uppercase block">Score Reserve</span>
                    <span className="text-xs font-black text-amber-400">{goldScore} Gold</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                  <div>
                    <span className="text-[9px] text-slate-500 font-semibold uppercase block">Tap Total</span>
                    <span className="text-xs font-black text-teal-300">{tapCount} clicks</span>
                  </div>
                </div>
              </div>

              {/* Main Interactive tap gold target zone */}
              <div className="flex-1 flex flex-col justify-center items-center py-4 relative">
                
                {/* Floating Resource Gain popup animations */}
                {particles.map(p => (
                  <div
                    key={p.id}
                    className="absolute text-amber-400 font-bold text-xs flex items-center gap-1 font-mono animate-bounce opacity-0 pointer-events-none"
                    style={{
                      left: `${p.x}px`,
                      top: `${p.y}px`,
                      animation: 'floatAndSlideUp 1s ease-out forwards'
                    }}
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                    <span>+{p.amount}!</span>
                  </div>
                ))}

                {/* Simulated Golden Mine Target asset block */}
                <div className="w-36 h-36 relative select-none group flex items-center justify-center">
                  {/* Glowing halo context */}
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
                  
                  {/* Floating click help indicator */}
                  <div className="absolute -top-4 bg-slate-900 border border-slate-800 text-[9px] text-slate-300 font-semibold py-0.5 px-2 rounded-full shadow flex items-center gap-1 animate-pulse z-20">
                    <Trophy className="w-3 h-3 text-amber-500" />
                    <span>Mine Target Center</span>
                  </div>

                  {/* Golden Rock base */}
                  <div className="w-28 h-28 bg-gradient-to-tr from-yellow-700 via-amber-500 to-yellow-300 rounded-[28px] shadow-lg border-2 border-yellow-405 flex items-center justify-center hover:scale-[1.03] transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-2 border border-yellow-200/30 rounded-[20px] pointer-events-none"></div>
                    <Coins className="w-12 h-12 text-yellow-100 drop-shadow-md fill-yellow-100/10" />
                  </div>
                </div>

                <p className="text-[9px] text-slate-500 text-center max-w-[210px] leading-relaxed mt-2.5">
                  Configure coordinates to hit the gold target above to farm points with the simulated Clicker.
                </p>
              </div>

              {/* Settings / Actions shortcut drawer inside android app */}
              <div className="mt-auto space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowSettingsWizard(true)}
                    className="py-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-850 text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
                  >
                    <Settings className="w-3.5 h-3.5" /> Service Wizard
                  </button>
                  
                  <button
                    onClick={() => {
                      setGoldScore(0);
                      setTapCount(0);
                      onAddLog("[Android Simulator] Score challenge values successfully reset.", "info");
                    }}
                    className="py-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-850 text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
                  >
                    Reset Challenge
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* C. Android Virtual system keys (Back, Home, Menu) */}
          <div className="h-10 border-t border-slate-900 flex items-center justify-between px-16 text-slate-500 select-none bg-slate-950 z-35 text-[10px]">
            <button className="hover:text-white px-2 cursor-pointer py-1 text-slate-600 font-sans tracking-wide">◀</button>
            <button className="hover:text-white px-3 cursor-pointer py-1 font-bold text-slate-600 font-sans">●</button>
            <button className="hover:text-white px-2 cursor-pointer py-1 text-slate-600 font-sans">■</button>
          </div>

        </div>

      </div>

      <div className="mt-4 flex flex-col items-center max-w-sm text-center px-4">
        <span className="text-xs font-black text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider mb-2">Android accessibility mode</span>
        <p className="text-xs text-slate-500 leading-normal">
          In Android, the clicker runs in a native background system thread and dispatches virtual pointer input globally to trigger clicks even when the user minimizes the UI.
        </p>
      </div>

    </div>
  );
};
