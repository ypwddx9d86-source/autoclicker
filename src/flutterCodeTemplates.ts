import { CodeFile } from './types';

export const flutterCodeFiles: CodeFile[] = [
  {
    name: 'pubspec.yaml',
    path: 'pubspec.yaml',
    language: 'yaml',
    content: `name: flutter_auto_clicker
description: "A production-grade, cross-platform Auto Clicker application for Android, macOS, and iOS."
version: 1.0.0+1

environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.5
  provider: ^6.1.1
  webview_flutter: ^4.4.2     # iOS webview sandbox auto-clicker
  shared_preferences: ^2.2.2  # Persistent state

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`
  },
  {
    name: 'main.dart',
    path: 'lib/main.dart',
    language: 'dart',
    content: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:io' show Platform;
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'embedded_browser_clicker.dart'; // iOS sandbox implementation

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (context) => ClickerProvider(),
      child: const AutoClickerApp(),
    ),
  );
}

class AutoClickerApp extends StatelessWidget {
  const AutoClickerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Auto Clicker Pro',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.teal,
          brightness: Brightness.light,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.teal,
          brightness: Brightness.dark,
        ),
      ),
      themeMode: ThemeMode.system,
      home: const MainLayoutScreen(),
    );
  }
}

// Global State Management
class ClickerProvider extends ChangeNotifier {
  static const MethodChannel _channel = MethodChannel('com.example.autoclicker/clicker_control');

  int _intervalMs = 1000;
  String _clickType = 'single'; // 'single', 'double', 'hold'
  String _coordMode = 'current'; // 'current', 'custom'
  double _customX = 100.0;
  double _customY = 200.0;
  String _stopCondition = 'infinite'; // 'infinite', 'count', 'duration'
  int _stopCount = 50;
  int _stopDurationSeconds = 60;
  bool _isActive = false;
  bool _permissionGranted = false;

  int get intervalMs => _intervalMs;
  String get clickType => _clickType;
  String get coordMode => _coordMode;
  double get customX => _customX;
  double get customY => _customY;
  String get stopCondition => _stopCondition;
  int get stopCount => _stopCount;
  int get stopDurationSeconds => _stopDurationSeconds;
  bool get isActive => _isActive;
  bool get permissionGranted => _permissionGranted;

  ClickerProvider() {
    _loadSavedSettings();
    checkPermissions();
  }

  Future<void> _loadSavedSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _intervalMs = prefs.getInt('intervalMs') ?? 1000;
    _clickType = prefs.getString('clickType') ?? 'single';
    _coordMode = prefs.getString('coordMode') ?? 'current';
    _customX = prefs.getDouble('customX') ?? 100.0;
    _customY = prefs.getDouble('customY') ?? 200.0;
    _stopCondition = prefs.getString('stopCondition') ?? 'infinite';
    _stopCount = prefs.getInt('stopCount') ?? 50;
    _stopDurationSeconds = prefs.getInt('stopDurationSeconds') ?? 60;
    notifyListeners();
  }

  Future<void> saveSetting(String key, dynamic value) async {
    final prefs = await SharedPreferences.getInstance();
    if (value is int) {
      await prefs.setInt(key, value);
    } else if (value is double) {
      await prefs.setDouble(key, value);
    } else if (value is String) {
      await prefs.setString(key, value);
    }
    _loadSavedSettings();
  }

  Future<void> checkPermissions() async {
    if (Platform.isAndroid || Platform.isMacOS) {
      try {
        final bool status = await _channel.invokeMethod('checkPermissions');
        _permissionGranted = status;
      } on PlatformException catch (_) {
        _permissionGranted = false;
      }
    } else {
      _permissionGranted = true; // iOS features fallback custom embedded browser
    }
    notifyListeners();
  }

  Future<void> requestPermissions() async {
    try {
      await _channel.invokeMethod('requestPermissions');
      // Re-evaluate permissions after redirecting user
      Future.delayed(const Duration(seconds: 4), () => checkPermissions());
    } on PlatformException catch (e) {
      debugPrint("Error requesting permissions: \${e.message}");
    }
  }

  Future<void> startClicker() async {
    if (!_permissionGranted && (Platform.isAndroid || Platform.isMacOS)) {
      await checkPermissions();
      if (!_permissionGranted) return;
    }

    _isActive = true;
    notifyListeners();

    try {
      await _channel.invokeMethod('startClicker', {
        'intervalMs': _intervalMs,
        'clickType': _clickType,
        'coordMode': _coordMode,
        'x': _customX,
        'y': _customY,
        'stopCondition': _stopCondition,
        'stopCount': _stopCount,
        'stopDuration': _stopDurationSeconds,
      });
    } on PlatformException catch (e) {
      _isActive = false;
      notifyListeners();
      debugPrint("Failed to start native clicker: \${e.message}");
    }
  }

  Future<void> stopClicker() async {
    _isActive = false;
    notifyListeners();

    try {
      await _channel.invokeMethod('stopClicker');
    } on PlatformException catch (e) {
      debugPrint("Failed to stop native clicker: \${e.message}");
    }
  }
}

// Layout Router for platform differences
class MainLayoutScreen extends StatelessWidget {
  const MainLayoutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    if (Platform.isIOS) {
      return const IosSandboxBrowserPage();
    }
    return const MobileOrDesktopDashboard();
  }
}

// Controller dashboard for Android and Desktop macOS
class MobileOrDesktopDashboard extends StatelessWidget {
  const MobileOrDesktopDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    final model = Provider.of<ClickerProvider>(context);
    final isDesktop = Platform.isMacOS;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Auto Clicker Studio'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => model.checkPermissions(),
          )
        ],
      ),
      body: Center(
        child: Container(
          constraints: BoxConstraints(maxWidth: isDesktop ? 600 : double.infinity),
          padding: const EdgeInsets.all(16.0),
          child: ListView(
            children: [
              // Wizard: Permission Status Card
              _buildPermissionCard(context, model),
              const SizedBox(height: 16),

              // Configuration Card
              _buildIntervalCard(context, model),
              const SizedBox(height: 16),

              // Coordinates Settings
              _buildLocationCard(context, model),
              const SizedBox(height: 16),

              // Click Action Configuration
              _buildClickTypeCard(context, model),
              const SizedBox(height: 16),

              // Stop Conditions Configuration
              _buildStopConditionCard(context, model),
              const SizedBox(height: 24),

              // Large Start/Stop Button group
              _buildControlButtons(context, model),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPermissionCard(BuildContext context, ClickerProvider model) {
    return Card(
      elevation: 2,
      color: model.permissionGranted ? Colors.teal.shade50 : Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Icon(
              model.permissionGranted ? Icons.check_circle : Icons.warning_rounded,
              color: model.permissionGranted ? Colors.teal : Colors.red,
              size: 36,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    model.permissionGranted ? 'Accessibility Active' : 'Accessibility Required',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: model.permissionGranted ? Colors.teal.shade900 : Colors.red.shade900,
                    ),
                  ),
                  Text(
                    model.permissionGranted
                        ? 'System clicks are ready to trigger.'
                        : Platform.isAndroid
                            ? 'Enable this service in accessibility settings to dispatch gestures globally.'
                            : 'Enable AX permissions in Privacy & Security settings to control pointer globally.',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                  ),
                ],
              ),
            ),
            if (!model.permissionGranted)
              ElevatedButton(
                onPressed: () => model.requestPermissions(),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                child: const Text('Setup', style: TextStyle(color: Colors.white)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildIntervalCard(BuildContext context, ClickerProvider model) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Click Interval', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.remove),
                        onPressed: () {
                          if (model.intervalMs > 100) {
                            model.saveSetting('intervalMs', model.intervalMs - 100);
                          }
                        },
                      ),
                      Expanded(
                        child: TextField(
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            labelText: 'Milliseconds',
                          ),
                          keyboardType: TextInputType.number,
                          controller: TextEditingController(text: model.intervalMs.toString())
                            ..selection = TextSelection.fromPosition(
                              TextPosition(offset: model.intervalMs.toString().length),
                            ),
                          onSubmitted: (val) {
                            final mapped = int.tryParse(val) ?? 1000;
                            model.saveSetting('intervalMs', mapped);
                          },
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add),
                        onPressed: () {
                          model.saveSetting('intervalMs', model.intervalMs + 100);
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationCard(BuildContext context, ClickerProvider model) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Tap Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Current physical position'),
              subtitle: const Text('Simulate click at current pointer position'),
              leading: Radio<String>(
                value: 'current',
                groupValue: model.coordMode,
                onChanged: (val) => model.saveSetting('coordMode', val),
              ),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Specific coordinates'),
              subtitle: Text('Click at user-defined cursor (X: \${model.customX.toInt()}, Y: \${model.customY.toInt()})'),
              leading: Radio<String>(
                value: 'custom',
                groupValue: model.coordMode,
                onChanged: (val) => model.saveSetting('coordMode', val),
              ),
            ),
            if (model.coordMode == 'custom')
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        initialValue: model.customX.toInt().toString(),
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'X Coordinate'),
                        onChanged: (v) {
                          final parsed = double.tryParse(v) ?? 100.0;
                          model.saveSetting('customX', parsed);
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        initialValue: model.customY.toInt().toString(),
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Y Coordinate'),
                        onChanged: (v) {
                          final parsed = double.tryParse(v) ?? 200.0;
                          model.saveSetting('customY', parsed);
                        },
                      ),
                    ),
                  ],
                ),
              )
          ],
        ),
      ),
    );
  }

  Widget _buildClickTypeCard(BuildContext context, ClickerProvider model) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Click Type & Behavior', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _clickOptionButton(model, 'single', 'Single Click'),
                _clickOptionButton(model, 'double', 'Double Click'),
                _clickOptionButton(model, 'hold', 'Click & Hold'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _clickOptionButton(ClickerProvider model, String type, String label) {
    final active = model.clickType == type;
    return ChoiceChip(
      label: Text(label),
      selected: active,
      onSelected: (selected) {
        if (selected) model.saveSetting('clickType', type);
      },
    );
  }

  Widget _buildStopConditionCard(BuildContext context, ClickerProvider model) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Stop Condition', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: model.stopCondition,
              decoration: const InputDecoration(border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: 'infinite', child: Text('Run Infinitely')),
                DropdownMenuItem(value: 'count', child: Text('Amount of clicks')),
                DropdownMenuItem(value: 'duration', child: Text('After period of time')),
              ],
              onChanged: (val) => model.saveSetting('stopCondition', val),
            ),
            if (model.stopCondition == 'count') ...[
              const SizedBox(height: 12),
              TextFormField(
                initialValue: model.stopCount.toString(),
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Limit of trigger count'),
                onChanged: (v) => model.saveSetting('stopCount', int.tryParse(v) ?? 50),
              ),
            ],
            if (model.stopCondition == 'duration') ...[
              const SizedBox(height: 12),
              TextFormField(
                initialValue: model.stopDurationSeconds.toString(),
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Period limit in seconds'),
                onChanged: (v) => model.saveSetting('stopDurationSeconds', int.tryParse(v) ?? 60),
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildControlButtons(BuildContext context, ClickerProvider model) {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton(
            onPressed: model.isActive ? null : () => model.startClicker(),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.teal,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              elevation: 4,
            ),
            child: const Text('Start Clicker', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: ElevatedButton(
            onPressed: model.isActive ? () => model.stopClicker() : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              elevation: 4,
            ),
            child: const Text('Stop Clicker', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }
}
`
  },
  {
    name: 'AutoClickerAccessibilityService.kt',
    path: 'android/app/src/main/kotlin/com/example/autoclicker/AutoClickerAccessibilityService.kt',
    language: 'kotlin',
    content: `package com.example.autoclicker

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Path
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.util.Log

class AutoClickerAccessibilityService : AccessibilityService() {

    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private var clickRunnable: Runnable? = null

    companion object {
        const val ACTION_START = "com.example.autoclicker.START"
        const val ACTION_STOP = "com.example.autoclicker.STOP"
        private const val TAG = "AutoClickerService"
        
        var isServiceConnected = false
            private set
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        isServiceConnected = true
        Log.d(TAG, "Accessibility service connected successfully.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Not implementing trigger on window state change
    }

    override fun onInterrupt() {
        stopClicker()
        isServiceConnected = false
    }

    override fun onDestroy() {
        super.onDestroy()
        stopClicker()
        isServiceConnected = false
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) return START_STICKY

        when (intent.action) {
            ACTION_START -> {
                val intervalMs = intent.getIntExtra("intervalMs", 1000)
                val clickType = intent.getStringExtra("clickType") ?: "single"
                val x = intent.getFloatExtra("x", 200f)
                val y = intent.getFloatExtra("y", 400f)
                val stopCondition = intent.getStringExtra("stopCondition") ?: "infinite"
                val limitCount = intent.getIntExtra("stopCount", 50)
                val limitDuration = intent.getIntExtra("stopDuration", 60)

                startClicker(intervalMs, clickType, x, y, stopCondition, limitCount, limitDuration)
            }
            ACTION_STOP -> {
                stopClicker()
            }
        }
        return START_STICKY
    }

    private fun startClicker(
        intervalMs: Int, 
        clickType: String, 
        x: Float, 
        y: Float, 
        stopCondition: String, 
        limitCount: Int, 
        limitDuration: Int
    ) {
        stopClicker()
        isRunning = true
        var executionCount = 0
        val startTime = System.currentTimeMillis()

        clickRunnable = object : Runnable {
            override fun run() {
                if (!isRunning) return

                // Check stop conditions
                if (stopCondition == "count" && executionCount >= limitCount) {
                    stopSelf()
                    return
                }
                if (stopCondition == "duration" && (System.currentTimeMillis() - startTime) >= (limitDuration * 1000)) {
                    stopSelf()
                    return
                }

                // Simulate down/up click gesture
                triggerClick(x, y, clickType)
                executionCount++

                // Schedule next trigger
                handler.postDelayed(this, intervalMs.toLong())
            }
        }

        handler.post(clickRunnable!!)
    }

    private fun stopClicker() {
        isRunning = false
        clickRunnable?.let { handler.removeCallbacks(it) }
        clickRunnable = null
    }

    private fun triggerClick(x: Float, y: Float, clickType: String) {
        val strokeDescription = when (clickType) {
            "double" -> {
                // To double click, we create a stroke, wait, and draw another, 
                // or we configure multiple touches in one gesture
                createClickGesture(x, y, 50)
            }
            "hold" -> {
                // Click and hold for 1.5 seconds
                createClickGesture(x, y, 1500)
            }
            else -> {
                // Standard quick tap of 70ms
                createClickGesture(x, y, 70)
            }
        }

        val gestureBuilder = GestureDescription.Builder()
        gestureBuilder.addStroke(strokeDescription)

        // For double tap secondary gesture sequence:
        if (clickType == "double") {
            dispatchGesture(gestureBuilder.build(), object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription?) {
                    super.onCompleted(gestureDescription)
                    // Fire secondary tap after 120ms gap
                    handler.postDelayed({
                        val secBuilder = GestureDescription.Builder()
                        secBuilder.addStroke(createClickGesture(x, y, 70))
                        dispatchGesture(secBuilder.build(), null, null)
                    }, 120)
                }
            }, null)
        } else {
            dispatchGesture(gestureBuilder.build(), null, null)
        }
    }

    private fun createClickGesture(x: Float, y: Float, durationMs: Long): GestureDescription.StrokeDescription {
        val path = Path()
        path.moveTo(x, y)
        // Draw exact path point without movement to represent coordinate Tap
        return GestureDescription.StrokeDescription(path, 0, durationMs)
    }
}
`
  },
  {
    name: 'MainActivity.kt',
    path: 'android/app/src/main/kotlin/com/example/autoclicker/MainActivity.kt',
    language: 'kotlin',
    content: `package com.example.autoclicker

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import androidx.annotation.NonNull
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.example.autoclicker/clicker_control"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "checkPermissions" -> {
                    val status = isAccessibilityServiceEnabled(this, AutoClickerAccessibilityService::class.java)
                    result.success(status)
                }
                "requestPermissions" -> {
                    val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    startActivity(intent)
                    result.success(true)
                }
                "startClicker" -> {
                    val intervalMs = call.argument<Int>("intervalMs") ?: 1000
                    val clickType = call.argument<String>("clickType") ?: "single"
                    val x = call.argument<Double>("x")?.toFloat() ?: 0f
                    val y = call.argument<Double>("y")?.toFloat() ?: 0f
                    val stopCondition = call.argument<String>("stopCondition") ?: "infinite"
                    val limitCount = call.argument<Int>("stopCount") ?: 50
                    val limitDuration = call.argument<Int>("stopDuration") ?: 60

                    val intent = Intent(this, AutoClickerAccessibilityService::class.java).apply {
                        action = AutoClickerAccessibilityService.ACTION_START
                        putExtra("intervalMs", intervalMs)
                        putExtra("clickType", clickType)
                        putExtra("x", x)
                        putExtra("y", y)
                        putExtra("stopCondition", stopCondition)
                        putExtra("stopCount", limitCount)
                        putExtra("stopDuration", limitDuration)
                    }
                    startService(intent)
                    result.success(true)
                }
                "stopClicker" -> {
                    val intent = Intent(this, AutoClickerAccessibilityService::class.java).apply {
                        action = AutoClickerAccessibilityService.ACTION_STOP
                    }
                    startService(intent)
                    result.success(true)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun isAccessibilityServiceEnabled(context: Context, service: Class<*>): Boolean {
        val expectedComponentName = "\${context.packageName}/\${service.name}"
        var accessibilityEnabled = 0
        try {
            accessibilityEnabled = Settings.Secure.getInt(
                context.contentResolver,
                Settings.Secure.ACCESSIBILITY_ENABLED
            )
        } catch (e: Settings.SettingNotFoundException) {
            // Unrecoverable
        }

        val settingValue = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        )
        if (settingValue != null) {
            val splitter = TextUtils.SimpleStringSplitter(':')
            splitter.setString(settingValue)
            while (splitter.hasNext()) {
                val componentName = splitter.next()
                if (componentName.equals(expectedComponentName, ignoreCase = true)) {
                    return accessibilityEnabled == 1
                }
            }
        }
        return false
    }
}
`
  },
  {
    name: 'accessibility_service_config.xml',
    path: 'android/app/src/main/res/xml/accessibility_service_config.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_desc"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows|flagTranslateRequestTouchExplorationMode"
    android:canPerformGestures="true"
    android:canRetrieveWindowContent="true" />
`
  },
  {
    name: 'AndroidManifest.xml',
    path: 'android/app/src/main/AndroidManifest.xml',
    language: 'xml',
    content: `<!-- accessibility permission must be requested underneath the application block -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
   <application android:label="Auto Clicker Studio">
        
        <!-- UI Flutter activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/LaunchTheme">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>

        <!-- Node Accessibility Dispatch Service -->
        <service
            android:name=".AutoClickerAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>
   </application>
</manifest>
`
  },
  {
    name: 'AppDelegate.swift',
    path: 'macos/Runner/AppDelegate.swift',
    language: 'swift',
    content: `import Cocoa
import FlutterMacOS

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {
    
    private var clickerService: ClickerService?

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        let controller : FlutterViewController = NSApplication.shared.windows.first!.contentViewController as! FlutterViewController
        
        let controlChannel = FlutterMethodChannel(name: "com.example.autoclicker/clicker_control",
                                                  binaryMessenger: controller.engine.binaryMessenger)
        
        clickerService = ClickerService()
        
        controlChannel.setMethodCallHandler({
            [weak self] (call: FlutterMethodCall, result: @escaping FlutterResult) -> Void in
            switch call.method {
            case "checkPermissions":
                // Check if system accessibility trust has been granted
                let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: false]
                let isTrusted = AXIsProcessTrustedWithOptions(options as CFDictionary)
                result(isTrusted)
                
            case "requestPermissions":
                // Show standard macOS dialog requesting permission
                let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true]
                _ = AXIsProcessTrustedWithOptions(options as CFDictionary)
                result(true)
                
            case "startClicker":
                guard let args = call.arguments as? [String: Any] else {
                    result(FlutterError(code: "INVALID_ARGS", message: "Arguments corrupted", details: nil))
                    return
                }
                
                let intervalDouble = (args["intervalMs"] as? Double ?? 1000.0) / 1000.0
                let clickType = args["clickType"] as? String ?? "single"
                let coordMode = args["coordMode"] as? String ?? "current"
                let targetX = args["x"] as? Double ?? 0.0
                let targetY = args["y"] as? Double ?? 0.0
                let stopCondition = args["stopCondition"] as? String ?? "infinite"
                let stopCount = args["stopCount"] as? Int ?? 50
                let stopDuration = args["stopDuration"] as? Int ?? 60
                
                self?.clickerService?.start(
                    interval: intervalDouble,
                    clickType: clickType,
                    coordMode: coordMode,
                    x: CGFloat(targetX),
                    y: CGFloat(targetY),
                    stopCondition: stopCondition,
                    stopCount: stopCount,
                    stopDuration: stopDuration
                )
                result(true)
                
            case "stopClicker":
                self?.clickerService?.stop()
                result(true)
                
            default:
                result(FlutterMethodNotImplemented)
            }
        })
    }
}
`
  },
  {
    name: 'ClickerService.swift',
    path: 'macos/Runner/ClickerService.swift',
    language: 'swift',
    content: `import Foundation
import Cocoa

class ClickerService {
    private var timer: Timer?
    private var isRunning = false
    
    func start(
        interval: Double,
        clickType: String,
        coordMode: String,
        x: CGFloat,
        y: CGFloat,
        stopCondition: String,
        stopCount: Int,
        stopDuration: Int
    ) {
        stop()
        isRunning = true
        var executionCounter = 0
        let triggerStartTime = Date()
        
        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] t in
            guard let self = self, self.isRunning else { return }
            
            // Validate stop limits
            if stopCondition == "count" && executionCounter >= stopCount {
                self.stop()
                return
            }
            if stopCondition == "duration" {
                let diff = Date().timeIntervalSince(triggerStartTime)
                if diff >= Double(stopDuration) {
                    self.stop()
                    return
                }
            }
            
            // Retrieve pointer position
            var targetPoint = NSEvent.mouseLocation
            
            // Adjust coordinates from macOS origin (bottom-left) to screen layout coordinate
            if let mainScreen = NSScreen.main {
                targetPoint.y = mainScreen.frame.height - targetPoint.y
            }
            
            if coordMode == "custom" {
                targetPoint = CGPoint(x: x, y: y)
            }
            
            self.dispatchMouseClicks(at: targetPoint, clickType: clickType)
            executionCounter += 1
        }
    }
    
    func stop() {
        isRunning = false
        timer?.invalidate()
        timer = nil
    }
    
    private func dispatchMouseClicks(at point: CGPoint, clickType: String) {
        // macOS CGEvent-based native virtual tap events down and up
        let source = CGEventSource(stateID: .combinedSessionState)
        
        guard let mouseMove = CGEvent(mouseEventSource: source, mouseType: .mouseMoved, mouseCursorPosition: point, mouseButton: .left) else { return }
        guard let mouseDown = CGEvent(mouseEventSource: source, mouseType: .leftMouseDown, mouseCursorPosition: point, mouseButton: .left) else { return }
        guard let mouseUp = CGEvent(mouseEventSource: source, mouseType: .leftMouseUp, mouseCursorPosition: point, mouseButton: .left) else { return }
        
        // Relocate screen hardware pointer
        mouseMove.post(tap: .cghidEventTap)
        
        if clickType == "double" {
            // Set event click state to 2 to declare native double click action
            mouseDown.setIntegerValueField(.mouseEventClickState, value: 1)
            mouseDown.post(tap: .cghidEventTap)
            
            mouseUp.setIntegerValueField(.mouseEventClickState, value: 1)
            mouseUp.post(tap: .cghidEventTap)
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
                let down2 = CGEvent(mouseEventSource: source, mouseType: .leftMouseDown, mouseCursorPosition: point, mouseButton: .left)
                let up2 = CGEvent(mouseEventSource: source, mouseType: .leftMouseUp, mouseCursorPosition: point, mouseButton: .left)
                
                down2?.setIntegerValueField(.mouseEventClickState, value: 2)
                down2?.post(tap: .cghidEventTap)
                
                up2?.setIntegerValueField(.mouseEventClickState, value: 2)
                up2?.post(tap: .cghidEventTap)
            }
        } else if clickType == "hold" {
            mouseDown.post(tap: .cghidEventTap)
            // Schedule the Up release after long duration
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
                if self?.isRunning == true {
                    mouseUp.post(tap: .cghidEventTap)
                }
            }
        } else {
            // Standard single mouse click down & up
            mouseDown.setIntegerValueField(.mouseEventClickState, value: 1)
            mouseDown.post(tap: .cghidEventTap)
            
            mouseUp.setIntegerValueField(.mouseEventClickState, value: 1)
            mouseUp.post(tap: .cghidEventTap)
        }
    }
}
`
  },
  {
    name: 'embedded_browser_clicker.dart',
    path: 'lib/embedded_browser_clicker.dart',
    language: 'dart',
    content: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'main.dart'; // import state manager

class IosSandboxBrowserPage extends StatefulWidget {
  const IosSandboxBrowserPage({super.key});

  @override
  State<IosSandboxBrowserPage> createState() => _IosSandboxBrowserPageState();
}

class _IosSandboxBrowserPageState extends State<IosSandboxBrowserPage> {
  late final WebViewController _controller;
  final TextEditingController _urlInput = TextEditingController(text: 'https://orteil.dashnet.org/cookieclicker/');
  bool _isLoading = true;
  double _browserTargetX = 150.0;
  double _browserTargetY = 250.0;
  bool _showOverlayCrosshair = false;
  
  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) => setState(() => _isLoading = true),
          onPageFinished: (url) => setState(() => _isLoading = false),
        ),
      )
      ..loadRequest(Uri.parse('https://orteil.dashnet.org/cookieclicker/'));
  }

  void _triggerInBrowserClick(ClickerProvider model) {
    // Coordinate click relative to web element inside iframe via Javascript execution
    final double targetX = model.coordMode == 'custom' ? model.customX : _browserTargetX;
    final double targetY = model.coordMode == 'custom' ? model.customY : _browserTargetY;

    final String jsCode = """
      (function() {
        var el = document.elementFromPoint(\$targetX, \$targetY);
        if (el) {
          var evDown = new MouseEvent('mousedown', {clientX: \$targetX, clientY: \$targetY, bubbles: true});
          var evUp = new MouseEvent('mouseup', {clientX: \$targetX, clientY: \$targetY, bubbles: true});
          var evClick = new MouseEvent('click', {clientX: \$targetX, clientY: \$targetY, bubbles: true});
          el.dispatchEvent(evDown);
          el.dispatchEvent(evUp);
          el.dispatchEvent(evClick);
        }
      })();
    """;

    _controller.runJavaScript(jsCode);
  }

  @override
  Widget build(BuildContext context) {
    final model = Provider.of<ClickerProvider>(context);

    // If auto-clicker active, fire local timer ticks on iOS embedded browser
    if (model.isActive) {
      Future.delayed(Duration(milliseconds: model.intervalMs), () {
        if (model.isActive && mounted) {
          _triggerInBrowserClick(model);
        }
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('iOS Sandbox Browser Clicker'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _urlInput,
                    decoration: const InputDecoration(
                      hintText: 'Enter URL to click',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (url) {
                      var target = url;
                      if (!target.startsWith('http')) target = 'https://' + target;
                      _controller.loadRequest(Uri.parse(target));
                    },
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.arrow_forward),
                  onPressed: () {
                    var target = _urlInput.text;
                    if (!target.startsWith('http')) target = 'https://' + target;
                    _controller.loadRequest(Uri.parse(target));
                  },
                )
              ],
            ),
          ),
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          
          if (_isLoading)
            const Center(child: CircularProgressIndicator()),

          // Floating Draggable Configuration Widget matching user intent
          Positioned(
            bottom: 20,
            left: 20,
            right: 20,
            child: Card(
              color: Theme.of(context).cardColor.withOpacity(0.92),
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            model.isActive ? 'Simulator Status: ACTIVE' : 'Simulator Status: STOPPED',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: model.isActive ? Colors.teal : Colors.grey,
                            ),
                          ),
                          Text(
                            'Interval: \${model.intervalMs}ms • Style: \${model.clickType.toUpperCase()}',
                            style: const TextStyle(fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _showOverlayCrosshair = !_showOverlayCrosshair;
                        });
                      },
                      child: Text(_showOverlayCrosshair ? 'Hide Target' : 'Position Target'),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: model.isActive ? Colors.red : Colors.teal,
                      ),
                      onPressed: () {
                        if (model.isActive) {
                          model.stopClicker();
                        } else {
                          model.startClicker();
                        }
                      },
                      child: Text(
                        model.isActive ? 'Stop' : 'Start',
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Custom crosshair Target Overlay for sandbox testing
          if (_showOverlayCrosshair)
            Positioned(
              left: _browserTargetX - 25,
              top: _browserTargetY - 25,
              child: GestureDetector(
                onPanUpdate: (details) {
                  setState(() {
                    _browserTargetX += details.delta.dx;
                    _browserTargetY += details.delta.dy;
                  });
                },
                child: Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.red, width: 2),
                    color: Colors.red.withOpacity(0.2),
                  ),
                  child: const Center(
                    child: Icon(Icons.add, color: Colors.red, size: 24),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
`
  }
];
