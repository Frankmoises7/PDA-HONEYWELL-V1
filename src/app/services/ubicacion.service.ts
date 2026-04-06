import { Injectable } from '@angular/core';
import { TokenStorageService } from './token.service';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { ToastController } from '@ionic/angular';
import { AlertController } from '@ionic/angular';


@Injectable({
  providedIn: 'root'
})
export class UbicacionService {
  private intervalId: any;
  private sesionTerminada: boolean = false;

  constructor(
    private token: TokenStorageService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController // <-- nuevo

  ) {}

  async startMonitoring(ubicacionSucursal: { lat: number, lng: number }) {
    this.sesionTerminada = false;

    // Evaluar inmediatamente
    await this.evaluarDistancia(ubicacionSucursal);

    // Luego continuar evaluando cada 10 segundos
    this.intervalId = setInterval(() => {
      if (!this.sesionTerminada) {
        this.evaluarDistancia(ubicacionSucursal);
      }
    }, 10000);
  }

  stopMonitoring() {
    clearInterval(this.intervalId);
  }

  private async mostrarAlerta(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Atención',
      message: mensaje,
      buttons: ['Aceptar'],
      cssClass: 'alerta-grande'
    });

    await alert.present();
  }

  private async evaluarDistancia(ubicacionSucursal: { lat: number, lng: number }) {
    const ubicacionUsuario = await this.getUserLocation();
    console.log('Ubicación usuario:', ubicacionUsuario);

    const distancia = this.calcularDistancia(
      ubicacionUsuario.lat,
      ubicacionUsuario.lng,
      ubicacionSucursal.lat,
      ubicacionSucursal.lng
    );

    console.log('Distancia a sucursal:', distancia.toFixed(2), 'metros');

    if (distancia > 50000) {
      console.warn('Muy lejos de la sucursal. Cerrando sesión.');
      this.sesionTerminada = true;

      await this.mostrarAlerta('Estás lejos de la sucursal');

      localStorage.clear();
      this.stopMonitoring();
      this.router.navigate(['/login']);
    }
  }

  private async getUserLocation(): Promise<{ lat: number, lng: number }> {
    try {
      const position = await Geolocation.getCurrentPosition();
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (error) {
      console.error('Error al obtener la ubicación', error);
      return { lat: 0, lng: 0 }; // fallback
    }
  }

  private async mostrarMensaje(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 10000,
      position: 'middle',
      color: 'danger',
      cssClass: 'toast-grande'
    });
    toast.present();
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.gradosARadianes(lat2 - lat1);
    const dLon = this.gradosARadianes(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.gradosARadianes(lat1)) *
        Math.cos(this.gradosARadianes(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private gradosARadianes(grados: number): number {
    return grados * (Math.PI / 180);
  }
}
