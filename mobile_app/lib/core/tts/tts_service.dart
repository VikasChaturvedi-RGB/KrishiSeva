import 'package:flutter_tts/flutter_tts.dart';

class TtsService {
  static final TtsService _instance = TtsService._internal();
  factory TtsService() => _instance;

  final FlutterTts flutterTts = FlutterTts();
  bool isPlaying = false;

  TtsService._internal() {
    _initTts();
  }

  Future<void> _initTts() async {
    await flutterTts.setVolume(1.0);
    await flutterTts.setSpeechRate(0.45); // Slightly slower speech for clear agrarian instructions
    await flutterTts.setPitch(1.0);

    flutterTts.setStartHandler(() {
      isPlaying = true;
    });

    flutterTts.setCompletionHandler(() {
      isPlaying = false;
    });

    flutterTts.setErrorHandler((msg) {
      isPlaying = false;
    });
  }

  Future<void> speak(String text, String languageCode) async {
    if (isPlaying) {
      await stop();
    }
    final localeMap = {
      'hi': 'hi-IN',
      'en': 'en-IN',
      'te': 'te-IN',
      'ta': 'ta-IN',
      'kn': 'kn-IN',
      'mr': 'mr-IN',
      'bn': 'bn-IN',
      'pa': 'pa-IN',
      'gu': 'gu-IN',
      'ml': 'ml-IN'
    };
    final locale = localeMap[languageCode] ?? 'hi-IN';
    await flutterTts.setLanguage(locale);
    await flutterTts.speak(text);
  }

  Future<void> stop() async {
    await flutterTts.stop();
    isPlaying = false;
  }
}
