import React, { useState } from 'react';
import { flutterCodeFiles } from '../flutterCodeTemplates';
import { CodeFile } from '../types';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  Copy, 
  Check, 
  Terminal, 
  Cpu, 
  Layers, 
  ChevronRight, 
  ChevronDown,
  Info
} from 'lucide-react';

export const FlutterCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(flutterCodeFiles[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'root': true,
    'lib': true,
    'android': true,
    'android-kotlin': true,
    'android-res': true,
    'macos': true,
    'macos-swift': true,
  });

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey]
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Directory Tree Helper to organize items hierarchically
  const renderTreeItem = (
    label: string, 
    folderKey: string, 
    level: number, 
    children: React.ReactNode
  ) => {
    const isExpanded = expandedFolders[folderKey];
    return (
      <div className="select-none text-slate-300">
        <button
          onClick={() => toggleFolder(folderKey)}
          className="w-full flex items-center gap-1.5 py-1 px-2 hover:bg-slate-800/60 rounded text-left font-mono text-xs text-slate-300 cursor-pointer transition-colors"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          {isExpanded ? <FolderOpen className="w-4 h-4 text-amber-400 fill-amber-400/20" /> : <Folder className="w-4 h-4 text-amber-500 fill-amber-500/10" />}
          <span className="font-medium text-slate-200">{label}</span>
        </button>
        {isExpanded && <div className="mt-0.5">{children}</div>}
      </div>
    );
  };

  const renderFileLink = (filePath: string, label: string, level: number) => {
    const file = flutterCodeFiles.find(f => f.path === filePath);
    if (!file) return null;
    const isSelected = selectedFile.path === file.path;

    return (
      <button
        onClick={() => setSelectedFile(file)}
        className={`w-full flex items-center gap-2 py-1 px-3 hover:bg-slate-800/80 rounded text-left font-mono text-xs transition-all cursor-pointer ${
          isSelected 
            ? 'bg-teal-950/50 border border-teal-800/30 text-teal-300 font-semibold' 
            : 'text-slate-400 border border-transparent'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 border border-slate-800 bg-[#0c1015] rounded-2xl shadow-2xl overflow-hidden min-h-[640px]">
      
      {/* 1. Sidebar Project File System Navigator */}
      <div className="lg:col-span-4 border-r border-slate-800 bg-[#0a0d11] p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <Layers className="w-4 h-4 text-teal-500" />
            <h4 className="font-bold text-xs text-slate-400 tracking-wider uppercase font-sans">
              Flutter Workspace Tree
            </h4>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[480px] pr-1">
            {/* pubspec.yaml */}
            {renderFileLink('pubspec.yaml', 'pubspec.yaml', 0)}

            {/* lib Folder */}
            {renderTreeItem('lib', 'lib', 0, (
              <>
                {renderFileLink('lib/main.dart', 'main.dart', 1)}
                {renderFileLink('lib/embedded_browser_clicker.dart', 'embedded_browser_clicker.dart', 1)}
              </>
            ))}

            {/* android Folder */}
            {renderTreeItem('android', 'android', 0, (
              <>
                {renderTreeItem('app', 'android-app', 1, (
                  <>
                    {renderTreeItem('src/main/kotlin', 'android-kotlin', 2, (
                      <>
                        {renderFileLink(
                          'android/app/src/main/kotlin/com/example/autoclicker/MainActivity.kt',
                          'MainActivity.kt',
                          3
                        )}
                        {renderFileLink(
                          'android/app/src/main/kotlin/com/example/autoclicker/AutoClickerAccessibilityService.kt',
                          'AutoClickerAccessibilityService.kt',
                          3
                        )}
                      </>
                    ))}
                    {renderTreeItem('src/main/res/xml', 'android-res', 2, (
                      <>
                        {renderFileLink(
                          'android/app/src/main/res/xml/accessibility_service_config.xml',
                          'accessibility_service_config.xml',
                          3
                        )}
                      </>
                    ))}
                    {renderFileLink('android/app/src/main/AndroidManifest.xml', 'AndroidManifest.xml', 2)}
                  </>
                ))}
              </>
            ))}

            {/* macos Folder */}
            {renderTreeItem('macos', 'macos', 0, (
              <>
                {renderTreeItem('Runner', 'macos-runner', 1, (
                  <>
                    {renderFileLink('macos/Runner/AppDelegate.swift', 'AppDelegate.swift', 2)}
                    {renderFileLink('macos/Runner/ClickerService.swift', 'ClickerService.swift', 2)}
                  </>
                ))}
              </>
            ))}
          </div>
        </div>

        {/* Informative Build Guide */}
        <div className="mt-6 p-3 bg-teal-950/20 border border-teal-900/40 rounded-xl space-y-2">
          <div className="flex gap-2 text-teal-400">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-[11px] font-bold uppercase font-sans tracking-wide">Developer Tip</span>
          </div>
          <p className="text-[10px] text-teal-300/80 leading-relaxed font-sans">
            This code compiles right inside your Flutter framework. Android intercepts gestures using Accessibility Services, macOS uses CoreGraphics events, and iOS runs an isolated secure in-app iframe engine.
          </p>
        </div>
      </div>

      {/* 2. Interactive Code display and configuration details */}
      <div className="lg:col-span-8 flex flex-col bg-[#0d1117] relative">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-[#0a0d11]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-mono text-slate-400 font-medium">
              {selectedFile.path}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-slate-800/85 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border border-slate-700/50"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 p-5 overflow-auto max-h-[500px] font-mono text-xs leading-relaxed text-slate-300">
          <pre className="whitespace-pre">{selectedFile.content}</pre>
        </div>

        {/* Footer info showing file tags */}
        <div className="border-t border-slate-850 px-5 py-3 bg-[#0a0d11]/80 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span>Language: <strong className="text-slate-400 capitalize">{selectedFile.language}</strong></span>
          <span>Size: <strong className="text-slate-400">{selectedFile.content.split('\n').length} lines</strong></span>
        </div>
      </div>

    </div>
  );
};
