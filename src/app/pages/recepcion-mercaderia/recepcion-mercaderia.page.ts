import { Component, ViewChild, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonInput, Platform } from '@ionic/angular';
import { Keyboard } from '@capacitor/keyboard';
import { AlertaService } from 'src/app/services/alerta.service';
import { InventarioService } from 'src/app/services/inventario.service';
import { UserService } from 'src/app/services/user.service';
import { RecepcionService } from 'src/app/services/recepcion.service';

@Component({
  selector: 'app-recepcion-mercaderia',
  templateUrl: './recepcion-mercaderia.page.html',
  styleUrls: ['./recepcion-mercaderia.page.scss'],
  standalone: false
})
export class RecepcionMercaderiaPage implements OnInit {

  usuario: any;
  idRecepcion: number;
  recepcionesPorSucursal: any[] = [];
  recepcionSeleccionada: any = null;

  productosRecepcionArray: any[] = [];

  codigo: string = '';
  cantidad: number = null;
  precio: number = 0;

  productoSeleccionadoNombre: string;
  productoSeleccionadoId: string;

  mostrarModal = false;
  editando = false;
  productoEditando: string = null;

  @ViewChild('codigoInputRef') codigoInputRef: IonInput;
  @ViewChild('cantidadInputRef') cantidadInputRef: IonInput;
  @ViewChild('scanInputRef') scanInputRef: IonInput;

  constructor(
    private route: ActivatedRoute,
    private alertas: AlertaService,
    private inventS: InventarioService,
    private user: UserService,
    private ngZone: NgZone,
    private platform: Platform,
    private router: Router,
    private recepcionService: RecepcionService
  ) {
    const usuario = this.user.getUsuario();
    this.usuario = usuario?.datos || {};
  }

  ngOnInit(): void {
    if (!this.usuario?.id) {
      this.alertas.enviarAlerta('Usuario no válido.', 'danger');
      return;
    }

    // Cargar todas las recepciones asignadas al usuario
    this.recepcionService.getRecepciones({ id_usuario: this.usuario.id }).subscribe({
      next: (res) => {
        this.recepcionesPorSucursal = res;
      },
      error: () => {
        this.alertas.enviarAlerta('Error al cargar recepciones.', 'danger');
      }
    });

    // Botón atrás físico
    this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.mostrarModal) {

      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  irAEscanearRecepcion(recepcion: any) {
    this.router.navigate(['/recepcion-escaneo'], {
      queryParams: { idRecepcion: recepcion.id }
    });
  }
}


