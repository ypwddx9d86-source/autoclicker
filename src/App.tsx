import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ClickConfig, LogEntry } from './types';
import { SettingsPanel } from './components/SettingsPanel';
import { AndroidSimulator } from './components/AndroidSimulator';
import { MacSimulator } from './components/MacSimulator';
import { IosSimulator } from './components/IosSimulator';
import { FlutterCodeViewer } from './components/FlutterCodeViewer';
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  Code2, 
  Terminal, 
  Trash2, 
  Activity, 
  Download, 
  ExternalLink,
  Bot
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'android' | 'macos' | 'ios' | 'code'>('android');
  
  // Clicker State configuration
  const [clickConfig, setClickConfig] = useState<ClickConfig>({
    intervalMs: 1000,
    clickType: 'single',
    coordinateMode: 'current',
    customX: 150,
    customY: 220,
    stopOnInfinite: true,
    stopOnCount: false,
    stopCountValue: 50,
    stopOnDuration: false,
    stopDurationValue: 60,
  });

  const [isActive, setIsActive] = useState<boolean>(false);
  
  // Simulated Native OS Trust states
  const [androidPermission, setAndroidPermission] = useState<boolean>(false);
  const [macPermission, setMacPermission] = useState<boolean>(false);

  // Native simulation trace logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init',
      timestamp: new Date().toLocaleTimeString(),
      message: 'Flutter Auto Clicker platform channels successfully initialized.',
      type: 'info'
    },
    {
      id: 'welcome',
      timestamp: new Date().toLocaleTimeString(),
      message: 'Select device platform tab to configure accessibility permissions & launch click challenges.',
      type: 'info'
    }
  ]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Standard callback to append diagnostic logs in real-time
  const addLog = useCallback((message: string, type: 'info' | 'success' | 'warn' | 'click' = 'info') => {
    const timestamp = new Date().toLocaleTimeString() + '.' + String(Date.now() % 1000).padStart(3, '0');
    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp,
        message,
        type
      }
    ].slice(-150)); // cap logs length
  }, []);

  // Scroll logs container to bottom on entry updates
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Handle autoclicker start
  const handleStartClicker = () => {
    setIsActive(true);
    addLog(`Auto-clicker requested. Executing on physical thread at ${clickConfig.intervalMs}ms intervals.`, 'success');
  };

  // Handle autoclicker manual stop
  const handleStopClicker = () => {
    setIsActive(false);
    addLog('Auto-clicker execution halted by user request.', 'warn');
  };

  const handleAutoStop = useCallback(() => {
    setIsActive(false);
  }, []);

  const clearLogs = () => {
    setLogs([
      {
        id: 'cleared',
        timestamp: new Date().toLocaleTimeString(),
        message: 'Logs console console successfully cleared.',
        type: 'info'
      }
    ]);
  };

  const handleUpdateConfig = (updater: Partial<ClickConfig>) => {
    setClickConfig(prev => ({
      ...prev,
      ...updater
    }));
  };

  const handleCoordinateChange = (x: number, y: number) => {
    setClickConfig(prev => ({
      ...prev,
      customX: Math.round(x),
      customY: Math.round(y)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-start">
      
      {/* 1. Header Navigation and Title brand bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand label with premium pairing display typography */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-100 border border-teal-700">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-slate-900">
                Flutter Auto Clicker Pro
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Production-Ready Native Clicker Workspace & Sim
              </p>
            </div>
          </div>

          {/* Quick Stats banner */}
          <div className="flex gap-4 text-xs font-mono">
            <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">Dev Server: Active</span>
            </div>
            <div className="bg-[#e6fffa] border border-[#b2f5ea] px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
              <span className="text-teal-800 font-bold">Port: 3000</span>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Interactive Navigation Workspace Tabs */}
      <nav className="bg-white border-b border-slate-200/60 pb-1 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 p-1 bg-slate-100 rounded-xl max-w-fit mt-3 mb-2">
            
            <button
              onClick={() => {
                setActiveTab('android');
                setIsActive(false);
                addLog("Switched active terminal target workspace to Android OS.", "info");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white shadow-sm text-teal-700 font-black'
                  : 'text-slate-505 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android App</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('macos');
                setIsActive(false);
                addLog("Switched active terminal target workspace to macOS App.", "info");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'macos'
                  ? 'bg-white shadow-sm text-teal-700 font-black'
                  : 'text-slate-505 hover:text-slate-800'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>macOS App</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ios');
                setIsActive(false);
                addLog("Switched active terminal target workspace to iOS App fallback Webview.", "info");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white shadow-sm text-teal-700 font-black'
                  : 'text-slate-505 hover:text-slate-800'
              }`}
            >
              <Tablet className="w-4 h-4" />
              <span>iOS Sandbox</span>
            </button>

            <div className="w-px bg-slate-200 my-1 justify-center self-stretch mx-1"></div>

            <button
              onClick={() => {
                setActiveTab('code');
                setIsActive(false);
                addLog("Switched window layout view to export Flutter Workspace workspace source code.", "info");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-teal-650 text-white shadow-sm'
                  : 'text-slate-505 hover:text-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Flutter Source Code</span>
            </button>

          </div>
        </div>
      </nav>

      {/* 3. Main Workspace Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'code' ? (
          
          /* Code File Viewer view occupies total viewport width */
          <div className="space-y-6">
            <div className="border border-slate-200/50 p-5 rounded-2xl bg-white shadow-sm">
              <h3 className="font-bold text-slate-800 text-lg font-display">Native Flutter SDK Assets</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                Here are the fully completed cross-platform source files to set up this exact functionality on your computer. copy or download any file directly. It manages background processes with Kotlin dispatch Gestures for Android, Swift core graphics Mouse down and up signals for Mac, and an embedded browser sandbox viewport for iOS web targets.
              </p>
            </div>
            
            <FlutterCodeViewer />
          </div>

        ) : (
          
          /* Device Simulator with Config dashboard configuration split layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Control Column */}
            <div className="lg:col-span-5 space-y-6">
              <SettingsPanel
                config={clickConfig}
                onChange={handleUpdateConfig}
                isActive={isActive}
                onStart={handleStartClicker}
                onStop={handleStopClicker}
                permissionGranted={activeTab === 'android' ? androidPermission : macPermission}
                onRequestPermission={() => {
                  if (activeTab === 'android') {
                    // simulate access grant request triggers
                    setAndroidPermission(true);
                    addLog("[Android SDK Hub] Simulating redirecting. AutoClickerAccessibilityService status updated: TRUE.", "success");
                  } else {
                    setMacPermission(true);
                    addLog("[macOS AX API] Accessibility trust updated: TRUE via CGEvent credentials.", "success");
                  }
                }}
                platform={activeTab}
              />
            </div>

            {/* Right Simulator and Real-Time Logs Console Column */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm flex flex-col justify-between min-h-[460px]">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base font-display">
                      {activeTab === 'android' && 'Android 14 Device Simulator'}
                      {activeTab === 'macos' && 'macOS workstation Desktop Simulator'}
                      {activeTab === 'ios' && 'iOS 17 sandbox Webview Simulator'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {activeTab === 'android' && 'Interact, drag and target specific coordinates to click gold targets.'}
                      {activeTab === 'macos' && 'Simulate desktop clicking tests using AX UI Elements.'}
                      {activeTab === 'ios' && 'Automates simulated browser pages safely bypass Apple sandbox limits.'}
                    </p>
                  </div>

                  <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></span>
                </div>

                {/* Device viewport Router */}
                {activeTab === 'android' && (
                  <AndroidSimulator
                    config={clickConfig}
                    isActive={isActive}
                    permissionGranted={androidPermission}
                    onGrantPermission={() => setAndroidPermission(true)}
                    onCoordinateChange={handleCoordinateChange}
                    onAddLog={addLog}
                    onAutoStop={handleAutoStop}
                  />
                )}

                {activeTab === 'macos' && (
                  <MacSimulator
                    config={clickConfig}
                    isActive={isActive}
                    permissionGranted={macPermission}
                    onGrantPermission={() => setMacPermission(true)}
                    onCoordinateChange={handleCoordinateChange}
                    onAddLog={addLog}
                    onAutoStop={handleAutoStop}
                  />
                )}

                {activeTab === 'ios' && (
                  <IosSimulator
                    config={clickConfig}
                    isActive={isActive}
                    onCoordinateChange={handleCoordinateChange}
                    onAddLog={addLog}
                    onAutoStop={handleAutoStop}
                  />
                )}

              </div>

              {/* Unified Real-Time Core Bridge System Logs Output */}
              <div className="border border-slate-200 rounded-2xl bg-[#090d12] shadow-xl overflow-hidden">
                
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-[#0d1218]">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-slate-450 tracking-wide font-sans">
                      OS Tunnel Console Logs
                    </span>
                  </div>
                  
                  <button
                    onClick={clearLogs}
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear logs
                  </button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[140px] font-mono text-xs leading-normal space-y-1.5 text-slate-300">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2.5">
                      <span className="text-[10px] text-slate-600 select-none font-medium flex-shrink-0">
                        [{log.timestamp}]
                      </span>
                      <span className={`
                        ${log.type === 'success' ? 'text-emerald-400 font-semibold' : ''}
                        ${log.type === 'warn' ? 'text-rose-400' : ''}
                        ${log.type === 'click' ? 'text-teal-400' : ''}
                        ${log.type === 'info' ? 'text-slate-400' : ''}
                      `}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef}></div>
                </div>

              </div>

            </div>

          </div>
        )}
      </main>

      {/* Footer detailing project support elements */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-slate-400 text-xs">
        <p>© 2026 Flutter Auto Clicker Studio. Designed for cross-platform app developers.</p>
        <p className="mt-1 text-[11px] text-slate-400/80">Built with pure reactive coordinates and full platform-native event dispatches.</p>
      </footer>

    </div>
  );
}
