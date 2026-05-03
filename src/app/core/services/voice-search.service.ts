import { Injectable, signal } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class VoiceSearchService {

  readonly isListening = signal(false);
  readonly isSupported = signal(this.checkSupport());
  readonly error = signal<string | null>(null);

  private recognition: any = null;

  private checkSupport(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  
  start(lang: string = 'ar-SA'): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        const msg = 'المتصفح لا يدعم البحث الصوتي';
        this.error.set(msg);
        reject(msg);
        return;
      }

      // Stop any existing session
      this.stop();

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      this.recognition = new SpeechRecognition();
      this.recognition.lang = lang;
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening.set(true);
        this.error.set(null);
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.isListening.set(false);
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening.set(false);
        const errorMessages: Record<string, string> = {
          'no-speech': 'لم يتم اكتشاف صوت. حاول مرة أخرى',
          'audio-capture': 'لا يمكن الوصول للميكروفون',
          'not-allowed': 'يجب السماح بالوصول للميكروفون',
          'network': 'مشكلة في الاتصال بالانترنت',
          'aborted': '',
        };
        const msg = errorMessages[event.error] ?? 'حدث خطأ في البحث الصوتي';
        if (msg) this.error.set(msg);
        reject(msg);
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
      };

      try {
        this.recognition.start();
      } catch (e) {
        this.isListening.set(false);
        reject('لا يمكن بدء البحث الصوتي');
      }
    });
  }

  /** Stop listening */
  stop(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        /* already stopped */
      }
      this.recognition = null;
    }
    this.isListening.set(false);
  }
}