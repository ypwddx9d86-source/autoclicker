import React, { useState, useEffect, useRef } from 'react';
import { ClickConfig, LogEntry } from '../types';
import { 
  Compass, 
  RefreshCw, 
  ArrowLeft, 
  ArrowRight, 
  HelpCircle,
  Wifi,
  Battery,
  Signal,
  Coins,
  Play,
  Square,
  Sparkles,
  Search,
  CheckCircle,
  Target
} from 'lucide-react';

interface IosSimulatorProps {
  config: ClickConfig;
  isActive: boolean;
  onCoordinateChange: (x: number, y: number) => void;
  onAddLog: (message: string, type: 'info' | 'success' | 'warn' | 'click') => void;
  onAutoStop: () => void;
}

type SandboxPage = 'cookie' | 'reaction' | 'balloon';

export const IosSimulator: React.FC<IosSimulatorProps> = ({
  config,
  isActive,
  onCoordinateChange,
  onAddLog,
  onAutoStop
}) => {
  const [currentPage, setCurrentPage] = useState<SandboxPage>('cookie');
  const [browserUrl, setBrowserUrl] = useState<string>('http://sandbox.clicker/cookie-tapper');
  
  // Cookie Sandbox State
  const [cookiesCount, setCookiesCount] = useState<number>(0);
  
  // Reaction Sandbox State
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [reactionState, setReactionState] = useState<'idle' | 'waiting' | 'click' | 'result'>('idle');
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [reactionStart, setReactionStart] = useState<number>(0);

  // Balloon Sandbox State
  const [balloons, setBalloons] = useState<{ id: number; x: number; y: number; popped: boolean }[]>([
    { id: 1, x: 50, y: 150, popped: false },
    { id: 2, x: 190, y: 120, popped: false },
    { id: 3, x: 120, y: 220, popped: false },
    { id: 4, x: 220, y: 280, popped: false },
    { id: 5, x: 70, y: 320, popped: false },
  ]);

  const [triggerPulse, setTriggerPulse] = useState<boolean>(false);
  const [pulsePos, setPulsePos] = useState({ x: 0, y: 0 });

  const clickCountRef = useRef<number>(0);
  const durationStartRef = useRef<number>(0);

  // Handle URL searches to simulate navigating web endpoints
  const handleUrlNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    const url = browserUrl.toLowerCase();
    if (url.includes('reaction') || url.includes('speed')) {
      setCurrentPage('reaction');
      setBrowserUrl('http://sandbox.clicker/reaction-test');
      onAddLog("[iOS webview] Navigated sandbox to Reaction Speed Test API.", "info");
    } else if (url.includes('balloon') || url.includes('pop')) {
      setCurrentPage('balloon');
      setBrowserUrl('http://sandbox.clicker/balloon-pop');
      onAddLog("[iOS webview] Navigated sandbox to Balloon Popper Game page.", "info");
    } else {
      setCurrentPage('cookie');
      setBrowserUrl('http://sandbox.clicker/cookie-tapper');
      onAddLog("[iOS webview] Navigated sandbox web crawler to Cookie Clicker Engine.", "info");
    }
  };

  // Stop conditions validation
  useEffect(() => {
    if (isActive) {
      clickCountRef.current = 0;
      durationStartRef.current = Date.now();
    }
  }, [isActive]);

  // Automatic click engine simulation loop (hybrid iframe click strategy sandbox)
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // 1. Evaluate termination bounds
      if (config.stopOnCount) {
        if (clickCountRef.current >= config.stopCountValue) {
          onAddLog(`[Stop Condition met] iOS sandbox Clicker stopped after reaching ${config.stopCountValue} clicks limit.`, 'info');
          onAutoStop();
          return;
        }
      }

      if (config.stopOnDuration) {
        const elapsed = (Date.now() - durationStartRef.current) / 1052;
        if (elapsed >= config.stopDurationValue) {
          onAddLog(`[Stop Condition met] iOS sandbox Clicker stopped after exceeding ${config.stopDurationValue}s time limit.`, 'info');
          onAutoStop();
          return;
        }
      }

      // 2. Resolve tap spot coordinates on simulator layout
      let px = config.customX;
      let py = config.customY;

      if (config.coordinateMode === 'current') {
        // Drift coordinates over main interactive target center arrays
        if (currentPage === 'cookie') {
          px = 150 + Math.floor(Math.sin(Date.now() / 100) * 10);
          py = 220 + Math.floor(Math.cos(Date.now() / 100) * 10);
        } else if (currentPage === 'reaction') {
          px = 150;
          py = 250;
        } else {
          // balloon click tracking selects first un-popped balloon coordinate
          const currentTarget = balloons.find(b => !b.popped);
          if (currentTarget) {
            px = currentTarget.x;
            py = currentTarget.y + 40; // adjusting for layout offsets
          } else {
            px = 150;
            py = 220;
          }
        }
      }

      const multiplier = config.clickType === 'double' ? 2 : 1;

      for (let i = 0; i < multiplier; i++) {
        setTimeout(() => {
          clickCountRef.current += 1;
          setPulsePos({ x: px, y: py });
          setTriggerPulse(true);
          setTimeout(() => setTriggerPulse(false), 250);

          // 3. Dispatch specific actions depending on the sandbox page loaded
          if (currentPage === 'cookie') {
            // Target coordinates ranges: X(70px to 230px) Y(145px to 310px) relative to inner web container
            const hitCookie = px >= 70 && px <= 230 && py >= 145 && py <= 310;
            if (hitCookie) {
              setCookiesCount(prev => prev + (config.clickType === 'hold' ? 8 : 1));
            }
          } else if (currentPage === 'reaction') {
            // Target coordinates: inside reaction panel bounds
            const insidePanel = px >= 30 && px <= 270 && py >= 130 && py <= 370;
            if (insidePanel) {
              handleReactionClick();
            }
          } else if (currentPage === 'balloon') {
            // Check balloon proximity
            setBalloons(prev => prev.map(balloon => {
              const distance = Math.sqrt(Math.pow(balloon.x - px, 2) + Math.pow((balloon.y + 110) - py, 2));
              if (distance < 36 && !balloon.popped) {
                return { ...balloon, popped: true };
              }
              return balloon;
            }));
          }

          onAddLog(`[iOS Hybrid Clicker] Webview executing synthetic JS tap at coordinates X:${px}px, Y:${py}px`, 'click');
        }, i * 150);
      }

    }, config.intervalMs);

    return () => clearInterval(interval);
  }, [isActive, config, currentPage, balloons, onAddLog, onAutoStop]);

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (config.coordinateMode !== 'custom') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = Math.round(e.clientX - rect.left);
    const relativeY = Math.round(e.clientY - rect.top);

    const fitX = Math.max(0, Math.min(300, relativeX));
    const fitY = Math.max(0, Math.min(560, relativeY));

    onCoordinateChange(fitX, fitY);
    onAddLog(`iOS in-app browser target coordinate assigned to X:${fitX}px, Y:${fitY}px`, 'info');
  };

  // Reaction Game Engine Controllers
  const startReactionSetup = () => {
    if (timerId) clearTimeout(timerId);
    setReactionState('waiting');
    setReactionMs(null);
    onAddLog("[iOS Web] Instantiated reaction stopwatch ticker. Prepare to click green box.", 'info');

    const randomMs = 1500 + Math.random() * 3000;
    const tid = setTimeout(() => {
      setReactionState('click');
      setReactionStart(Date.now());
    }, randomMs);
    setTimerId(tid);
  };

  const handleReactionClick = () => {
    if (reactionState === 'waiting') {
      if (timerId) clearTimeout(timerId);
      setReactionState('idle');
      onAddLog("[iOS Web Alert] Triggered too early! Resetting test metrics.", 'warn');
    } else if (reactionState === 'click') {
      const elapsed = Date.now() - reactionStart;
      setReactionMs(elapsed);
      setReactionState('result');
      onAddLog(`[iOS Web Accuracy Dashboard] Hit target in ${elapsed} ms using automated tapping intervals!`, 'success');
    }
  };

  return (
    <div className="flex flex-col items-center">
      
      {/* Smartphone frame shell */}
      <div className="w-[330px] h-[630px] bg-slate-900 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-850 relative flex flex-col justify-between overflow-hidden">
        
        {/* Dynamic coordinate marker indicator overlay */}
        {config.coordinateMode === 'custom' && (
          <div 
            className="absolute z-40 flex flex-col items-center pointer-events-none transition-all duration-100"
            style={{ 
              left: `${config.customX + 14}px`, 
              top: `${config.customY + 14}px` 
            }}
          >
            <div className="w-5 h-5 border border-dashed border-red-500 rounded-full flex items-center justify-center bg-red-500/15">
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Pulse effect animation container */}
        {triggerPulse && (
          <div 
            className="absolute z-40 w-10 h-10 border-4 border-teal-500 rounded-full pointer-events-none animate-ping opacity-75"
            style={{ left: `${pulsePos.x - 6}px`, top: `${pulsePos.y - 6}px` }}
          ></div>
        )}

        {/* Device screen viewport */}
        <div 
          onClick={handleScreenClick}
          className="w-full flex-1 bg-white rounded-[30px] border border-slate-200 flex flex-col overflow-hidden relative cursor-crosshair"
        >
          {/* iOS top Status bar bar */}
          <div className="h-9 px-6 flex items-center justify-between text-slate-800 text-[10px] select-none font-sans z-30">
            <span className="font-bold">22:01</span>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3 text-slate-800" />
              <Wifi className="w-3 h-3 text-slate-800" />
              <Battery className="w-3.5 h-3.5 rotate-90 ml-0.5 text-slate-800" />
            </div>
          </div>

          {/* iOS Safari Top Address bar controllers block */}
          <div className="bg-[#f2f2f7] border-b border-slate-200 p-2 flex flex-col gap-1.5 select-none font-sans">
            <form onSubmit={handleUrlNavigate} className="flex gap-1.5 items-center bg-white px-2.5 py-1.5 rounded-xl shadow-sm border border-slate-100">
              <Compass className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={browserUrl}
                onChange={(e) => setBrowserUrl(e.target.value)}
                className="flex-1 text-[10px] font-medium text-slate-705 outline-none font-sans"
              />
              <button type="submit" className="cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </form>

            <div className="flex items-center justify-between px-2 text-[10px] text-slate-500 pt-0.5">
              <div className="flex gap-4">
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              
              <div className="flex gap-1.5 font-sans">
                <button 
                  onClick={() => {
                    setCurrentPage('cookie');
                    setBrowserUrl('http://sandbox.clicker/cookie-tapper');
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold ${currentPage === 'cookie' ? 'bg-slate-200 text-slate-800' : 'text-slate-500'}`}
                >
                  Cookies
                </button>
                <button 
                  onClick={() => {
                    setCurrentPage('reaction');
                    setBrowserUrl('http://sandbox.clicker/reaction-test');
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold ${currentPage === 'reaction' ? 'bg-slate-200 text-slate-800' : 'text-slate-500'}`}
                >
                  Reaction
                </button>
                <button 
                  onClick={() => {
                    setCurrentPage('balloon');
                    setBrowserUrl('http://sandbox.clicker/balloon-pop');
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold ${currentPage === 'balloon' ? 'bg-slate-200 text-slate-800' : 'text-slate-500'}`}
                >
                  Balloons
                </button>
              </div>
            </div>
          </div>

          {/* Web Sandbox Container View viewport based on selected simulated tabs */}
          <div className="flex-1 bg-slate-50 relative flex flex-col justify-start overflow-hidden p-3 font-sans">
            
            {/* Tab A: Cookie Tapper Sandbox page */}
            {currentPage === 'cookie' && (
              <div className="flex-1 flex flex-col justify-between items-center py-4">
                <div className="text-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cookie Production Sandbox</span>
                  <h6 className="font-extrabold text-2xl text-slate-800 mt-1">{cookiesCount} Cookies</h6>
                </div>

                {/* Spinning physical Cookie asset target */}
                <div 
                  className={`w-32 h-32 rounded-full bg-amber-800 shadow-xl border-4 border-amber-950 flex items-center justify-center cursor-pointer transition-transform ${
                    isActive ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '12s' }}
                >
                  <div className="w-24 h-24 bg-amber-600 rounded-full border-4 border-amber-850 flex items-center justify-center relative overflow-hidden select-none">
                    {/* Chocolate chips decorations */}
                    <div className="absolute top-4 left-6 w-3 h-3 bg-amber-900 rounded-full"></div>
                    <div className="absolute top-12 left-10/12 w-2.5 h-2.5 bg-amber-950 rounded-full"></div>
                    <div className="absolute bottom-6 left-5 w-3.5 h-3.5 bg-amber-900 rounded-full"></div>
                    <div className="absolute bottom-12 left-14 w-2.5 h-2.5 bg-amber-950 rounded-full"></div>
                    <div className="absolute top-14 left-14 w-3.5 h-3.5 bg-amber-900 rounded-full"></div>
                    <div className="absolute bottom-4 left-24 w-3 h-3 bg-amber-950 rounded-full"></div>

                    <Sparkles className="w-8 h-8 text-amber-200 fill-amber-140/10 drop-shadow" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-[10px] text-slate-400">Position coordinates or use current finger location to tap cookie.</p>
                  <button 
                    onClick={() => {
                      setCookiesCount(0);
                      onAddLog("[iOS Cookie Sandbox] Counter values successfully cleared.", "info");
                    }} 
                    className="text-[9px] font-bold text-teal-600 hover:underline. cursor-pointer bg-transparent border-none py-1 block w-full"
                  >
                    Reset Count
                  </button>
                </div>
              </div>
            )}

            {/* Tab B: Speed Reaction Test page */}
            {currentPage === 'reaction' && (
              <div className="flex-1 flex flex-col justify-between items-center py-2.5">
                <div className="text-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Speed Test Sandbox</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Measures Clicker execution delays</p>
                </div>

                {/* Reaction Panel frame */}
                <div 
                  onClick={handleReactionClick}
                  className={`w-full max-w-[240px] h-48 rounded-2xl border flex flex-col items-center justify-center text-center p-4 transition-colors cursor-pointer ${
                    reactionState === 'idle' ? 'bg-indigo-50 border-indigo-150 text-indigo-900' : ''
                  } ${
                    reactionState === 'waiting' ? 'bg-amber-500 border-amber-600 text-amber-950 animate-pulse' : ''
                  } ${
                    reactionState === 'click' ? 'bg-emerald-500 border-emerald-600 text-white animate-bounce' : ''
                  } ${
                    reactionState === 'result' ? 'bg-slate-900 border-slate-950 text-slate-200' : ''
                  }`}
                >
                  {reactionState === 'idle' && (
                    <div className="space-y-2">
                      <Target className="w-8 h-8 mx-auto text-indigo-500" />
                      <p className="text-xs font-bold">Fast-Tapper Portal</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          startReactionSetup();
                        }}
                        className="bg-indigo-600 font-bold hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] cursor-pointer"
                      >
                        Launch test
                      </button>
                    </div>
                  )}

                  {reactionState === 'waiting' && (
                    <p className="text-xs font-black uppercase tracking-wide">Await Green Screen...</p>
                  )}

                  {reactionState === 'click' && (
                    <p className="text-xs font-black uppercase tracking-wide">TAP TARGET NOW!</p>
                  )}

                  {reactionState === 'result' && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Reaction Timing</p>
                      <p className="text-2xl font-black text-teal-400 font-mono">{reactionMs} ms</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          startReactionSetup();
                        }}
                        className="text-[9px] font-bold text-teal-300 hover:underline"
                      >
                        Retry test
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-[9px] text-slate-400 text-center max-w-[220px]">
                  Setting rapid click intervals ensures hyper-fast reaction records when clicker intercepts the green signal!
                </p>
              </div>
            )}

            {/* Tab C: Balloon popping challenge */}
            {currentPage === 'balloon' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="text-between flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Balloon Popper</span>
                  <span className="text-[9px] font-bold font-mono text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                    Popped: {balloons.filter(b => b.popped).length} / {balloons.length}
                  </span>
                </div>

                {/* Sky Area where balloons float */}
                <div className="flex-1 relative bg-gradient-to-b from-sky-100 to-indigo-50/20 border border-slate-100 rounded-xl mt-2 overflow-hidden select-none">
                  {balloons.map(balloon => (
                    <div
                      key={balloon.id}
                      className={`absolute w-10 h-14 rounded-full flex items-center justify-center transition-all ${
                        balloon.popped 
                          ? 'animate-ping scale-150 opacity-0 pointer-events-none text-emerald-505' 
                          : 'bg-red-500 border border-red-600 shadow-md cursor-pointer hover:scale-105'
                      }`}
                      style={{ 
                        left: `${balloon.x}px`, 
                        top: `${balloon.y}px` 
                      }}
                    >
                      {!balloon.popped && (
                        <div className="w-0.5 h-5 bg-slate-400 absolute bottom-[-4px] left-1/2 -translate-x-1/2"></div>
                      )}
                    </div>
                  ))}

                  {balloons.every(b => b.popped) && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-3">
                      <CheckCircle className="w-8 h-8 text-teal-650 mb-1" />
                      <p className="text-xs font-bold text-slate-700">Clear sweep!</p>
                      <button 
                        onClick={() => setBalloons(prev => prev.map(b => ({ ...b, popped: false })))}
                        className="text-[9px] text-teal-600 font-bold hover:underline mt-1 cursor-pointer"
                      >
                        Regenerate balloons
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* iPhone physical home tab bar indicator */}
          <div className="h-6 flex items-center justify-center z-30 select-none bg-slate-50">
            <div className="w-28 h-1 bg-slate-800 rounded-full"></div>
          </div>

        </div>

      </div>

      <div className="mt-4 flex flex-col items-center max-w-sm text-center px-4">
        <span className="text-xs font-black text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider mb-2">iOS sandbox mode</span>
        <p className="text-xs text-slate-500 leading-normal">
          In iOS, the native auto clicker runs as an isolated sandbox web crawler using WebKit context injection to perform automated client-side testing safely.
        </p>
      </div>

    </div>
  );
};
