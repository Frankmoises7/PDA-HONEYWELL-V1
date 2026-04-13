import { Component, OnDestroy } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { DeviceProfileService } from './services/device-profile.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnDestroy {

  private tecladoObserver: MutationObserver | null = null;
  private focusListener: ((ev: FocusEvent) => void) | null = null;
  private pointerListener: ((ev: PointerEvent) => void) | null = null;
  private keydownListener: ((ev: KeyboardEvent) => void) | null = null;

  constructor(private deviceProfile: DeviceProfileService) {}

  async ngOnInit() {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {});
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      await StatusBar.setBackgroundColor({ color: '#1a237e' }).catch(() => {});
    }

    const perfil = await this.deviceProfile.getProfile();
    document.body.classList.add(`device-${perfil}`);

    if (perfil === 'q500') {
      Keyboard.setScroll({ isDisabled: true });
      this.bloquearTecladoDigital();
    } else {
      Keyboard.setScroll({ isDisabled: false });
    }
  }

  /**
   * Q500 — teclado físico + scanner HID vía InputConnection.
   *
   * Estrategia: PREVENIR que el teclado se muestre, no ocultarlo después.
   *
   * 1) inputmode="none" → hint al WebView
   * 2) pointerdown → readonly temporal → cuando el input recibe foco,
   *    Android ve que es readonly y NO abre el teclado. Después de 300ms
   *    se remueve readonly para que el teclado físico funcione.
   * 3) Java: ViewTreeObserver + dispatchTouchEvent como safety net
   *
   * NO usamos keyboardWillShow → Keyboard.hide() porque crea un loop infinito.
   */
  private bloquearTecladoDigital(): void {
    const aplicarInputMode = (el: HTMLElement) => {
      el.setAttribute('inputmode', 'none');
      el.setAttribute('virtualkeyboardpolicy', 'manual');
      (el as any).showSoftInputOnFocus = false;
    };

    const escanear = (raiz: Element | Document) => {
      const ctx = raiz instanceof Document ? raiz.body : raiz;
      ctx.querySelectorAll<HTMLElement>('input, textarea').forEach(aplicarInputMode);
    };

    escanear(document);

    this.tecladoObserver = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (!(node instanceof Element)) return;
          if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
            aplicarInputMode(node);
          }
          escanear(node);
        });
      });
    });
    this.tecladoObserver.observe(document.body, { childList: true, subtree: true });

    this.pointerListener = (ev: PointerEvent) => {
      const el = ev.target as HTMLElement;
      if (!el) return;

      const input = el.closest('input, textarea') as HTMLElement | null;
      if (!input) return;

      // Poner readonly ANTES de que el input reciba foco.
      // Android ve readonly → no intenta mostrar teclado.
      input.setAttribute('readonly', '');

      // Remover readonly después para que el teclado físico funcione.
      setTimeout(() => input.removeAttribute('readonly'), 120);
    };

    this.focusListener = (ev: FocusEvent) => {
      const el = ev.target as HTMLElement;
      if (!el) return;
      const input = el.closest('input, textarea') as HTMLElement | null;
      if (!input) return;
      aplicarInputMode(input);
      Keyboard.hide().catch(() => {});
    };

    this.keydownListener = () => {
      Keyboard.hide().catch(() => {});
    };

    document.addEventListener('pointerdown', this.pointerListener, { capture: true });
    document.addEventListener('focus', this.focusListener, { capture: true });
    document.addEventListener('keydown', this.keydownListener, { capture: true });
  }

  ngOnDestroy(): void {
    this.tecladoObserver?.disconnect();
    if (this.focusListener) {
      document.removeEventListener('focus', this.focusListener, { capture: true });
    }
    if (this.pointerListener) {
      document.removeEventListener('pointerdown', this.pointerListener, { capture: true });
    }
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener, { capture: true });
    }
  }
}
