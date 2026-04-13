import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';

/**
 * Perfiles de dispositivo soportados:
 * - 'honeywell' : Honeywell EDA51 (scanner nativo via plugin)
 * - 'q500'      : Netum Q500 (scanner HID/wedge, teclado físico)
 * - 'unknown'   : Otro dispositivo (usa HID por defecto)
 */
export type DeviceProfile = 'honeywell' | 'q500' | 'unknown';

@Injectable({
  providedIn: 'root'
})
export class DeviceProfileService {
  private cachedProfile: DeviceProfile | null = null;

  async getProfile(): Promise<DeviceProfile> {
    if (this.cachedProfile) {
      return this.cachedProfile;
    }

    try {
      const info = await Device.getInfo();
      const model = String(info.model ?? '').toLowerCase();
      const manufacturer = String(info.manufacturer ?? '').toLowerCase();

      // Honeywell EDA51 y variantes
      if (manufacturer.includes('honeywell') || model.includes('eda51') || model.includes('eda52')) {
        this.cachedProfile = 'honeywell';
        return this.cachedProfile;
      }

      // Netum Q500 y variantes
      if (model.includes('q500') || (manufacturer.includes('netum') && model.includes('q5'))) {
        this.cachedProfile = 'q500';
        return this.cachedProfile;
      }

    } catch {
      // Si falla la detección por Device API, usar fallback por viewport
    }

    // Fallback por tamaño de pantalla:
    // Honeywell EDA51 tiene pantalla estrecha (~360px ancho)
    // Netum Q500 tiene pantalla más ancha (~400px+)
    const width = window.innerWidth || 0;
    this.cachedProfile = width >= 400 ? 'q500' : 'honeywell';
    return this.cachedProfile;
  }

  async getCssClass(): Promise<string> {
    const profile = await this.getProfile();
    if (profile === 'honeywell') return 'device-honeywell';
    if (profile === 'q500') return 'device-q500';
    return 'device-generic';
  }

  /**
   * Retorna true si el dispositivo usa el plugin nativo de Honeywell.
   * Útil para condicionar lógica de UI sin await.
   */
  async isHoneywell(): Promise<boolean> {
    return (await this.getProfile()) === 'honeywell';
  }

  /**
   * Retorna true si el dispositivo es una Netum Q500 (HID/wedge).
   */
  async isQ500(): Promise<boolean> {
    return (await this.getProfile()) === 'q500';
  }
}
