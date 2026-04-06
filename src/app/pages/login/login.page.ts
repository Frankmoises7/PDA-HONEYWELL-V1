import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Device } from '@capacitor/device';

import { UserService } from '../../services/user.service';
import { TokenStorageService } from '../../services/token.service';
import { AlertaService } from 'src/app/services/alerta.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  rut = '';
  password = '';
  cargando = false;
  deviceId = '';

  constructor(
    private router: Router,
    private userService: UserService,
    private tokenService: TokenStorageService,
    private alertas: AlertaService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarIdDispositivo();
    if (this.userService.getUsuario()) {
      this.router.navigate(['/home']);
    }
  }

  private async cargarIdDispositivo(): Promise<void> {
    try {
      const { identifier } = await Device.getId();
      this.deviceId = identifier ?? '';
    } catch {
      this.deviceId = '';
    }
  }

  formatearRut(rut: string): string {
    rut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (rut.length <= 1) return rut;

    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);

    let formateado = '';
    let i = cuerpo.length;
    while (i > 3) {
      formateado = '.' + cuerpo.slice(i - 3, i) + formateado;
      i -= 3;
    }
    return cuerpo.slice(0, i) + formateado + '-' + dv;
  }

  async login(): Promise<void> {
    if (!this.rut || !this.password) {
      this.alertas.enviarAlerta('RUT y contraseña son obligatorios.', 'danger');
      return;
    }

    if (!this.deviceId) {
      await this.cargarIdDispositivo();
    }
    if (!this.deviceId) {
      this.alertas.enviarAlerta('No se pudo obtener el ID del dispositivo.', 'danger');
      return;
    }

    this.cargando = true;

    const datos = new FormData();
    datos.append('rut', this.rut);
    datos.append('password', this.password);
    datos.append('IMEI', this.deviceId);

    this.userService.login(datos).subscribe({
      next: (data: any) => {
        if (data.error) {
          this.alertas.enviarAlerta(data.msj, 'danger');
        } else {
          this.userService.almacenarUsuario(data);
          this.tokenService.saveToken(data.token);
          this.tokenService.saveUser(data);
          this.router.navigate(['/home']);
        }
        this.cargando = false;
      },
      error: () => {
        this.alertas.enviarAlerta('Error de conexión. Verificá la red.', 'danger');
        this.cargando = false;
      }
    });
  }
}
