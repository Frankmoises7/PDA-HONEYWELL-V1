import { Component } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor() {}

  async ngOnInit() {
    Keyboard.setScroll({ isDisabled: false });

    if (Capacitor.isNativePlatform()) {
      // Evita doble desplazamiento cuando usamos ajuste manual de modal con keyboardOffset.
      await Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {});
      // El header no se superpone con la barra de estado del sistema
      await StatusBar.setOverlaysWebView({ overlay: false });
      // Barra estable: íconos claros sobre fondo azul fijo (sin alternar claro/oscuro).
      await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      await StatusBar.setBackgroundColor({ color: '#1a237e' }).catch(() => {});
    }
  }
}
