import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Servicio centralizado para el scanner del Honeywell EDA51.
 *
 * Soporta dos vías de integración (en orden de prioridad):
 * 1. Plugin nativo cordova-honeywell-scanner-simplified (window.plugins.honeywell)
 * 2. Fallback HID: el scanner emite teclas como teclado físico terminando en Enter
 *    (compatible con DataWedge configurado en modo "keystroke output")
 */
@Injectable({
  providedIn: 'root'
})
export class HoneywellScannerService implements OnDestroy {

  private scanSubject = new Subject<string>();

  /** Observable que emite cada código escaneado */
  scan$ = this.scanSubject.asObservable();

  private pluginDisponible = false;
  private escuchandoPlugin = false;

  private hidBuffer = '';
  private hidTimeout: any = null;
  private readonly HID_DELAY_MS = 80;

  private hidListener = (ev: KeyboardEvent) => this.onHidKey(ev);

  constructor(private ngZone: NgZone) {
    this.detectarPlugin();
  }

  /**
   * Inicia la escucha de escaneos.
   * Llamar en ngOnInit/ionViewWillEnter de cada página que necesite escaneo.
   */
  iniciar(): void {
    if (this.pluginDisponible) {
      this.iniciarPlugin();
    } else {
      this.iniciarHid();
    }
  }

  /**
   * Detiene la escucha. Llamar en ngOnDestroy/ionViewWillLeave.
   */
  detener(): void {
    this.detenerPlugin();
    this.detenerHid();
  }

  /**
   * Dispara el trigger de escaneo por software (solo modo plugin).
   * Útil si querés disparar un escaneo desde un botón de la UI.
   */
  dispararTrigger(): void {
    if (!this.pluginDisponible) return;
    const plugin = (window as any).plugins?.honeywell;
    if (!plugin) return;
    plugin.softwareTriggerStart(
      (data: string) => this.emitir(data),
      (err: any) => console.warn('[Honeywell] Error trigger:', err)
    );
    setTimeout(() => plugin.softwareTriggerStop?.(), 400);
  }

  private detectarPlugin(): void {
    // El plugin puede tardar en estar disponible (deviceready)
    const check = () => {
      this.pluginDisponible = !!(window as any).plugins?.honeywell;
    };
    check();
    document.addEventListener('deviceready', () => {
      check();
      console.log('[HoneywellScanner] Plugin disponible:', this.pluginDisponible);
    }, { once: true });
  }

  private iniciarPlugin(): void {
    if (this.escuchandoPlugin) return;
    const plugin = (window as any).plugins?.honeywell;
    if (!plugin) return;

    this.escuchandoPlugin = true;
    plugin.listen(
      (data: string) => this.emitir(data),
      (err: any) => {
        console.warn('[Honeywell] Error listener:', err);
        // Fallback a HID si el plugin falla
        this.escuchandoPlugin = false;
        this.iniciarHid();
      }
    );
  }

  private detenerPlugin(): void {
    if (!this.escuchandoPlugin) return;
    const plugin = (window as any).plugins?.honeywell;
    plugin?.softwareTriggerStop?.();
    this.escuchandoPlugin = false;
  }

  private iniciarHid(): void {
    window.addEventListener('keydown', this.hidListener, true);
  }

  private detenerHid(): void {
    window.removeEventListener('keydown', this.hidListener, true);
    clearTimeout(this.hidTimeout);
    this.hidBuffer = '';
  }

  private onHidKey(ev: KeyboardEvent): void {
    const key = ev.key;

    if (key === 'Enter') {
      const code = this.hidBuffer.trim();
      this.hidBuffer = '';
      clearTimeout(this.hidTimeout);
      if (code) {
        this.ngZone.run(() => this.emitir(code));
      }
      return;
    }

    if (key.length === 1) {
      this.hidBuffer += key;
      clearTimeout(this.hidTimeout);
      this.hidTimeout = setTimeout(() => {
        const code = this.hidBuffer.trim();
        this.hidBuffer = '';
        if (code) {
          this.ngZone.run(() => this.emitir(code));
        }
      }, this.HID_DELAY_MS);
    }
  }

  private emitir(codigo: string): void {
    const codigoLimpio = String(codigo || '').trim();
    if (!codigoLimpio) return;
    this.ngZone.run(() => this.scanSubject.next(codigoLimpio));
  }

  ngOnDestroy(): void {
    this.detener();
    this.scanSubject.complete();
  }
}
