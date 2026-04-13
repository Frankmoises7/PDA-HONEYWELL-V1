import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { DeviceProfileService } from './device-profile.service';

/**
 * Servicio centralizado de scanner para Honeywell EDA51 y Netum Q500.
 *
 * El modo se elige según el dispositivo detectado por DeviceProfileService:
 * - 'honeywell' → Plugin nativo (window.plugins.honeywell)
 * - 'q500' / 'unknown' → HID: input oculto + keydown global
 *
 * IMPORTANTE: el plugin de Honeywell puede estar presente en el APK
 * incluso cuando se corre en una Q500, por eso NO se usa solo la existencia
 * de window.plugins.honeywell para decidir el modo.
 */
@Injectable({
  providedIn: 'root'
})
export class HoneywellScannerService implements OnDestroy {

  private scanSubject = new Subject<string>();
  scan$ = this.scanSubject.asObservable();

  private modoActivo: 'plugin' | 'hid' | null = null;
  private escuchandoPlugin = false;

  // --- HID via input oculto ---
  private hidInput: HTMLInputElement | null = null;
  private hidInputTimeout: any = null;

  // --- HID via keydown global (fallback) ---
  private hidBuffer = '';
  private hidTimeout: any = null;
  private readonly HID_DELAY_MS = 80;
  private hidListener = (ev: KeyboardEvent) => this.onHidKey(ev);

  constructor(
    private ngZone: NgZone,
    private deviceProfile: DeviceProfileService
  ) {}

  /**
   * Inicia la escucha de escaneos.
   * Detecta el dispositivo y elige el modo correcto.
   * Llamar en ngOnInit / ionViewWillEnter.
   */
  iniciar(): void {
    this.deviceProfile.getProfile().then(perfil => {
      console.log('[Scanner] iniciar() — perfil detectado:', perfil);

      if (perfil === 'honeywell') {
        const pluginDisponible = !!(window as any).plugins?.honeywell;
        console.log('[Scanner] Modo Honeywell — plugin disponible:', pluginDisponible);
        if (pluginDisponible) {
          this.modoActivo = 'plugin';
          this.iniciarPlugin();
          return;
        }
        // Plugin no disponible aunque sea Honeywell → fallback HID
        console.warn('[Scanner] Plugin no disponible en Honeywell, usando HID');
      }

      // Q500, unknown, o Honeywell sin plugin → HID
      console.log('[Scanner] Modo HID activado para:', perfil);
      this.modoActivo = 'hid';
      this.iniciarHidInput();
      this.iniciarHidKeydown();
    });
  }

  /** Detiene la escucha. Llamar en ngOnDestroy / ionViewWillLeave. */
  detener(): void {
    console.log('[Scanner] detener() — modo era:', this.modoActivo);
    this.detenerPlugin();
    this.detenerHidInput();
    this.detenerHidKeydown();
    this.modoActivo = null;
  }

  /** Solo disponible en Honeywell: dispara el trigger por software. */
  dispararTrigger(): void {
    if (this.modoActivo !== 'plugin') return;
    const plugin = (window as any).plugins?.honeywell;
    if (!plugin) return;
    plugin.softwareTriggerStart(
      (data: string) => {
        console.log('[Scanner] Trigger Honeywell →', data);
        this.emitir(data);
      },
      (err: any) => console.warn('[Scanner] Error trigger:', err)
    );
    setTimeout(() => plugin.softwareTriggerStop?.(), 400);
  }

  // ─── Plugin Honeywell ───────────────────────────────────────────────────────

  private iniciarPlugin(): void {
    if (this.escuchandoPlugin) return;
    const plugin = (window as any).plugins?.honeywell;
    if (!plugin) return;

    console.log('[Scanner] Iniciando plugin Honeywell nativo');
    this.escuchandoPlugin = true;
    plugin.listen(
      (data: string) => {
        console.log('[Scanner] Plugin Honeywell recibió:', data);
        this.emitir(data);
      },
      (err: any) => {
        console.warn('[Scanner] Error en plugin, cambiando a HID:', err);
        this.escuchandoPlugin = false;
        this.modoActivo = 'hid';
        this.iniciarHidInput();
        this.iniciarHidKeydown();
      }
    );
  }

  private detenerPlugin(): void {
    if (!this.escuchandoPlugin) return;
    const plugin = (window as any).plugins?.honeywell;
    plugin?.softwareTriggerStop?.();
    this.escuchandoPlugin = false;
  }

  // ─── HID via input oculto ───────────────────────────────────────────────────

  private iniciarHidInput(): void {
    if (this.hidInput) return;

    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'none');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('inputmode', 'none');
    Object.assign(input.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      width: '1px',
      height: '1px',
      opacity: '0',
      pointerEvents: 'none',
    });

    input.addEventListener('keydown', (ev: KeyboardEvent) => {
      console.log('[Scanner][HID-input] keydown →', {
        key: ev.key,
        keyCode: ev.keyCode,
        code: ev.code,
        value: (ev.target as HTMLInputElement)?.value
      });
      if (ev.key === 'Enter' || ev.keyCode === 13) {
        const codigo = input.value.trim();
        console.log('[Scanner][HID-input] Enter → código:', codigo);
        input.value = '';
        clearTimeout(this.hidInputTimeout);
        if (codigo) {
          this.ngZone.run(() => this.emitir(codigo));
        }
      }
    });

    input.addEventListener('input', () => {
      const valor = input.value;
      console.log('[Scanner][HID-input] input event, valor actual:', valor);
      clearTimeout(this.hidInputTimeout);
      this.hidInputTimeout = setTimeout(() => {
        const codigo = input.value.trim();
        input.value = '';
        console.log('[Scanner][HID-input] timeout → código:', codigo);
        if (codigo) {
          this.ngZone.run(() => this.emitir(codigo));
        }
      }, this.HID_DELAY_MS + 50);
    });

    document.body.appendChild(input);
    this.hidInput = input;

    this.enfocarHidInput();
    document.addEventListener('click', this.refocarHidInput, true);
    document.addEventListener('touchend', this.refocarHidInput, true);

    console.log('[Scanner] HID input oculto creado');
  }

  private refocarHidInput = () => {
    setTimeout(() => {
      const activo = document.activeElement;
      const esInputVisible = activo
        && activo !== this.hidInput
        && activo.tagName === 'INPUT'
        && (activo as HTMLElement).offsetParent !== null;

      if (!esInputVisible && this.hidInput) {
        this.hidInput.focus({ preventScroll: true });
      }
    }, 100);
  };

  private enfocarHidInput(): void {
    setTimeout(() => {
      this.hidInput?.focus({ preventScroll: true });
      console.log('[Scanner] Focus en HID input, activeElement:', document.activeElement?.tagName);
    }, 200);
  }

  private detenerHidInput(): void {
    clearTimeout(this.hidInputTimeout);
    document.removeEventListener('click', this.refocarHidInput, true);
    document.removeEventListener('touchend', this.refocarHidInput, true);
    if (this.hidInput) {
      this.hidInput.remove();
      this.hidInput = null;
      console.log('[Scanner] HID input oculto eliminado');
    }
  }

  // ─── HID via keydown global (fallback) ─────────────────────────────────────

  private iniciarHidKeydown(): void {
    console.log('[Scanner] Activando keydown global (fallback HID)');
    window.addEventListener('keydown', this.hidListener, true);
  }

  private detenerHidKeydown(): void {
    window.removeEventListener('keydown', this.hidListener, true);
    clearTimeout(this.hidTimeout);
    this.hidBuffer = '';
  }

  private onHidKey(ev: KeyboardEvent): void {
    if (ev.target === this.hidInput) return;

    const key = ev.key;
    const keyCode = ev.keyCode;
    console.log('[Scanner][keydown-global]', { key, keyCode, code: ev.code });

    if (key === 'Enter' || keyCode === 13) {
      const code = this.hidBuffer.trim();
      this.hidBuffer = '';
      clearTimeout(this.hidTimeout);
      console.log('[Scanner][keydown-global] Enter → código:', code);
      if (code) {
        this.ngZone.run(() => this.emitir(code));
      }
      return;
    }

    let char = '';
    if (key && key.length === 1) {
      char = key;
    } else if (keyCode >= 32 && keyCode <= 126) {
      char = String.fromCharCode(keyCode);
    }

    if (char) {
      this.hidBuffer += char;
      clearTimeout(this.hidTimeout);
      this.hidTimeout = setTimeout(() => {
        const code = this.hidBuffer.trim();
        this.hidBuffer = '';
        console.log('[Scanner][keydown-global] timeout → código:', code);
        if (code) {
          this.ngZone.run(() => this.emitir(code));
        }
      }, this.HID_DELAY_MS);
    }
  }

  // ─── Emisión ────────────────────────────────────────────────────────────────

  private emitir(codigo: string): void {
    const codigoLimpio = String(codigo || '').trim();
    if (!codigoLimpio) return;
    console.log('[Scanner] ✅ Emitiendo código:', codigoLimpio);
    this.ngZone.run(() => this.scanSubject.next(codigoLimpio));
  }

  ngOnDestroy(): void {
    this.detener();
    this.scanSubject.complete();
  }
}
