import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertaService {

  constructor(
    public toast: ToastController
  ) { }

  async enviarAlerta(msj: string, tipo: string) {
    const toast = await this.toast.create({
      message: msj,
      duration: 3000,
      position: 'top',
      color: tipo
    });
    toast.present();
  }
}
