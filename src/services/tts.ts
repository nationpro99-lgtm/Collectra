// Text-to-Speech service using Web Speech Synthesis API
class TTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<(speaking: boolean) => void> = new Set();
  public isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public subscribe(listener: (speaking: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isSpeaking);
    return () => this.listeners.delete(listener);
  }

  private notify(speaking: boolean) {
    this.isSpeaking = speaking;
    this.listeners.forEach((l) => l(speaking));
  }

  public speak(text: string, onEnd?: () => void): void {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this environment');
      onEnd?.();
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Pick best available English voice
    const voices = this.synth.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india')) ||
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google'))) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      this.notify(true);
    };

    utterance.onend = () => {
      this.notify(false);
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('TTS error', e);
      this.notify(false);
      this.currentUtterance = null;
      onEnd?.();
    };

    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.notify(false);
      this.currentUtterance = null;
    }
  }

  public toggle(text: string, onEnd?: () => void): void {
    if (this.isSpeaking) {
      this.stop();
    } else {
      this.speak(text, onEnd);
    }
  }
}

export const ttsService = new TTSService();
