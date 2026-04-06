import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonInput, Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { Subscription } from 'rxjs';
import { Location } from '@angular/common';

import { RecepcionService } from 'src/app/services/recepcion.service';
import { InventarioService } from 'src/app/services/inventario.service';
import { AlertaService } from 'src/app/services/alerta.service';
import { UserService } from 'src/app/services/user.service';
import { HoneywellScannerService } from 'src/app/services/honeywell-scanner.service';

@Component({
  selector: 'app-recepcion-escaneo',
  templateUrl: './recepcion-escaneo.page.html',
  styleUrls: ['./recepcion-escaneo.page.scss'],
  standalone: false
})
export class RecepcionEscaneoPage implements OnInit, OnDestroy {

  idRecepcion: number;
  usuario: any;

  productosPedidos: any[] = [];
  productosEscaneados: any[] = [];

  codigo = '';
  cantidad: number = null;
  mostrarModal = false;
  editando = false;
  productoSeleccionado: any = null;
  cantidadEscaneada = 0;

  sumarOEditar = false;
  cantidadSoE: number = null;
  productoEditando: string = null;
  productoSeleccionadoNombre = '';
  precio: number = null;

  agregarManual = false;
  idProductoManual = '';
  cantidadManual: number = null;

  escaneoActivo = true;
  keyboardOffset = 0;
  private readonly usarOffsetTeclado = Capacitor.getPlatform() === 'ios';

  private scanSub: Subscription;
  private backSub: any;
  private kbShowSub: any;
  private kbHideSub: any;
  private appStateSub: any;
  private abrirManualAlEntrar = false;

  @ViewChild('cantidadInputRef') cantidadInputRef: IonInput;
  @ViewChild('cantidadSoEInputRef') cantidadSoEInputRef: IonInput;

  constructor(
    private route: ActivatedRoute,
    private recepcionS: RecepcionService,
    private inventS: InventarioService,
    private alertas: AlertaService,
    private user: UserService,
    private ngZone: NgZone,
    private platform: Platform,
    private location: Location,
    private scanner: HoneywellScannerService
  ) { }

  ngOnInit(): void {
    this.usuario = this.user.getUsuario()?.datos || {};

    this.route.queryParams.subscribe(params => {
      this.idRecepcion = parseInt(params['idRecepcion'], 10);
      this.abrirManualAlEntrar = String(params['manual'] || '') === '1';
      if (!this.idRecepcion || isNaN(this.idRecepcion)) {
        this.alertas.enviarAlerta('ID de recepción inválido.', 'danger');
        return;
      }
      this.cargarProductosPedidos();
      this.refrescarProductosEscaneados();
      if (this.abrirManualAlEntrar) {
        setTimeout(() => {
          this.abrirAgregarManual();
          this.abrirManualAlEntrar = false;
        }, 120);
      }
    });

    this.backSub = this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.mostrarModal || this.sumarOEditar || this.agregarManual) {
        this.cancelarModal();
      } else {
        this.volverAtras();
      }
    });

    this.scanSub = this.scanner.scan$.subscribe(codigo => {
      if (!this.escaneoActivo) return;
      if (this.mostrarModal || this.sumarOEditar || this.agregarManual) return;
      this.procesarCodigo(codigo);
    });

    this.scanner.iniciar();

    // Detectar teclado para evitar que tape el modal
    Keyboard.addListener('keyboardWillShow', (info) => {
      this.ngZone.run(() => {
        if (!this.usarOffsetTeclado) {
          this.keyboardOffset = 0;
          return;
        }
        const maxSafeOffset = Math.floor(window.innerHeight * 0.45);
        this.keyboardOffset = Math.max(0, Math.min(info.keyboardHeight || 0, maxSafeOffset));
      });
    }).then(h => this.kbShowSub = h);

    Keyboard.addListener('keyboardWillHide', () => {
      this.ngZone.run(() => {
        this.keyboardOffset = 0;
      });
    }).then(h => this.kbHideSub = h);

    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return;
      this.ngZone.run(() => {
        if (this.idRecepcion) {
          this.refrescarProductosEscaneados();
        }
      });
    }).then(h => this.appStateSub = h);
  }

  ionViewWillEnter(): void {
    if (!this.idRecepcion) return;
    this.refrescarProductosEscaneados();
  }

  ngOnDestroy(): void {
    this.scanner.detener();
    this.scanSub?.unsubscribe();
    this.backSub?.unsubscribe();
    this.kbShowSub?.remove?.();
    this.kbHideSub?.remove?.();
    this.appStateSub?.remove?.();
    Keyboard.removeAllListeners();
  }

  ngAfterViewInit(): void {
    Keyboard.hide().catch(() => {});
  }

  volverAtras(): void {
    this.location.back();
  }

  cargarProductosPedidos(): void {
    this.recepcionS.getProductosRecepcion(this.idRecepcion).subscribe({
      next: (data) => this.productosPedidos = data || [],
      error: () => this.alertas.enviarAlerta('Error al obtener productos pedidos.', 'danger')
    });
  }

  refrescarProductosEscaneados(): void {
    this.recepcionS.getProductosEscaneados(this.idRecepcion).subscribe({
      next: (data) => {
        this.productosEscaneados = (data || []).map((d: any) => ({
          id_producto: this.getIdStr(d),
          nombre: d.nombre || '',
          cantidad: d.cantidad,
          precio_venta: d.precio_venta || d.precio || null
        }));
      },
      error: () => this.alertas.enviarAlerta('Error al refrescar productos escaneados.', 'danger')
    });
  }

  procesarCodigo(codigo: string): void {
    const datos = new FormData();
    datos.append('codigoBarra', codigo);

    this.inventS.checkCodigoBarra(datos).subscribe(data => {
      this.ngZone.run(() => {
        if (data.resultado === 'noex') {
          this.alertas.enviarAlerta(`Código ${codigo} sin producto asociado.`, 'danger');
          return;
        }

        const idProd = String(data.idProducto);
        const nombreProd = String(data.nombre || 'Producto sin nombre');
        const precioProd = data.precio || null;

        const productoPedido = this.productosPedidos.find(p => String(p.id_producto) === idProd);
        const yaEscaneado = this.productosEscaneados.find(p => this.getIdStr(p) === idProd);
        this.cantidadEscaneada = Number(yaEscaneado?.cantidad || 0);

        if (yaEscaneado) {
          this.sumarOEditar = true;
          this.editando = false;
          this.productoEditando = idProd;
          this.productoSeleccionadoNombre = yaEscaneado?.nombre || nombreProd;
          this.precio = yaEscaneado?.precio_venta || precioProd;
          this.cantidadSoE = null;
        this.focusCantidadInmediato(this.cantidadSoEInputRef);
          return;
        }

        // Sin toast: el modal ya indica "EXTRA" y evita doble mensaje visual.

        this.editando = false;
        this.productoSeleccionado = {
          id_producto: idProd,
          nombre: productoPedido?.nombre || nombreProd,
          precio: precioProd,
          fueraRecepcion: !productoPedido
        };
        this.cantidad = null;
        this.mostrarModal = true;

        this.focusCantidadInmediato(this.cantidadInputRef);
      });
    });
  }

  guardarCantidad(): void {
    if (this.cantidad == null || Number(this.cantidad) <= 0) {
      this.alertas.enviarAlerta('Cantidad no válida.', 'danger');
      return;
    }

    const idProducto = this.editando
      ? this.productoEditando || this.getIdStr(this.productoSeleccionado)
      : this.getIdStr(this.productoSeleccionado);

    if (!idProducto) {
      this.alertas.enviarAlerta('ID de producto inválido.', 'danger');
      return;
    }

    const fueraRecepcion = !!(this.productoSeleccionado as any)?.fueraRecepcion;
    const observacion = fueraRecepcion
      ? `FUERA_RECEPCION: producto no estaba en la lista (id=${idProducto}).`
      : '';

    const datos = {
      id_recepcion: this.idRecepcion,
      id_producto: idProducto,
      cantidad: this.cantidad,
      observacion,
      editar: this.editando ? 1 : 0
    };

    this.recepcionS.guardarEscaneoRecepcion(datos).subscribe({
      next: (res) => {
        if (this.editando) {
          const idx = this.productosEscaneados.findIndex(p => this.getIdStr(p) === idProducto);
          if (idx > -1) this.productosEscaneados[idx].cantidad = Number(this.cantidad);
        } else {
          const yaExiste = this.productosEscaneados.find(p => this.getIdStr(p) === idProducto);
          if (yaExiste) {
            yaExiste.cantidad = Number(this.cantidad);
          } else {
            this.productosEscaneados.push({
              id_producto: idProducto,
              nombre: this.productoSeleccionado?.nombre ?? idProducto,
              cantidad: Number(this.cantidad),
              fueraRecepcion
            });
          }
        }

        this.alertas.enviarAlerta(res?.msg || 'Escaneo guardado.', 'success');
        this.refrescarProductosEscaneados();
        this.cancelarModal();
      },
      error: () => this.alertas.enviarAlerta('Error al guardar escaneo.', 'danger')
    });
  }

  guardarSumarOEditar(accion: 'sumar' | 'editar'): void {
    const producto = this.productosEscaneados.find(p => this.getIdStr(p) === this.productoEditando);
    let nuevaCantidad = Number(this.cantidadSoE);

    if (!nuevaCantidad || nuevaCantidad <= 0) {
      this.alertas.enviarAlerta('Cantidad no válida.', 'danger');
      return;
    }

    if (accion === 'sumar') {
      nuevaCantidad = Number(producto?.cantidad ?? 0) + Number(this.cantidadSoE);
    }

    const datos = {
      id_recepcion: this.idRecepcion,
      id_producto: this.productoEditando,
      cantidad: nuevaCantidad,
      observacion: '',
      editar: 1
    };

    this.recepcionS.guardarEscaneoRecepcion(datos).subscribe({
      next: (res) => {
        this.alertas.enviarAlerta(res?.msg || 'Cantidad actualizada.', 'success');
        this.refrescarProductosEscaneados();
        this.cancelarModal();
      },
      error: () => this.alertas.enviarAlerta('Error al actualizar producto.', 'danger')
    });
  }

  abrirAgregarManual(): void {
    this.escaneoActivo = false;
    this.agregarManual = true;
    this.mostrarModal = false;
    this.sumarOEditar = false;
    this.idProductoManual = '';
    this.cantidadManual = null;
  }

  guardarProductoManual(): void {
    if (!this.idProductoManual || !this.cantidadManual || Number(this.cantidadManual) <= 0) {
      this.alertas.enviarAlerta('Debes ingresar el ID del producto y una cantidad válida.', 'danger');
      return;
    }

    this.inventS.getProducto(this.idProductoManual).subscribe({
      next: (producto: any) => {
        if (!producto?.id_producto) {
          this.alertas.enviarAlerta('ID no corresponde a un producto válido.', 'danger');
          return;
        }

        const productoEscaneado = this.productosEscaneados.find(
          p => this.getIdStr(p) === String(this.idProductoManual)
        );

        if (productoEscaneado) {
          this.agregarManual = false;
          this.sumarOEditar = true;
          this.productoEditando = String(this.idProductoManual);
          this.productoSeleccionadoNombre = producto.nombre;
          this.precio = producto.precio_venta || 0;
          this.cantidadEscaneada = Number(productoEscaneado.cantidad);
          this.cantidadSoE = null;
          this.focusCantidadInmediato(this.cantidadSoEInputRef);
          return;
        }

        const datos = {
          id_recepcion: this.idRecepcion,
          id_producto: this.idProductoManual,
          cantidad: this.cantidadManual,
          observacion: 'AGREGADO_MANUAL',
          editar: 0
        };

        this.recepcionS.guardarEscaneoRecepcion(datos).subscribe({
          next: () => {
            this.alertas.enviarAlerta('Producto agregado manualmente.', 'success');
            this.refrescarProductosEscaneados();
            this.cancelarModal();
          },
          error: () => this.alertas.enviarAlerta('Error al guardar producto manual.', 'danger')
        });
      },
      error: () => this.alertas.enviarAlerta('Error al verificar el producto.', 'danger')
    });
  }

  async editarCantidad(producto: any): Promise<void> {
    this.editando = true;
    this.sumarOEditar = false;
    this.mostrarModal = true;
    this.agregarManual = false;
    this.escaneoActivo = false;

    const id = this.getIdStr(producto);
    const prodEscaneado = this.productosEscaneados.find(p => this.getIdStr(p) === id);

    this.productoEditando = id;
    this.productoSeleccionadoNombre = prodEscaneado?.nombre || producto?.nombre || '';
    this.precio = (producto as any)?.precio_venta ?? (prodEscaneado as any)?.precio_venta ?? null;
    this.productoSeleccionado = {
      id_producto: id,
      nombre: this.productoSeleccionadoNombre,
      cantidad: Number(prodEscaneado?.cantidad ?? producto?.cantidad ?? 0),
      precio: this.precio
    };
    this.cantidad = Number(this.productoSeleccionado.cantidad ?? 0);

        this.focusCantidadInmediato(this.cantidadInputRef);
  }

  obtenerCantidadPedida(idProducto: string | number): number {
    const prod = this.productosPedidos.find(p => String(p.id_producto) === String(idProducto));
    return Number(prod?.cantidad_pedida || 0);
  }

  cancelarModal(): void {
    this.mostrarModal = false;
    this.sumarOEditar = false;
    this.agregarManual = false;
    this.editando = false;
    this.escaneoActivo = true;
    this.keyboardOffset = 0;
    Keyboard.hide().catch(() => {});
    this.codigo = '';
    this.cantidad = null;
    this.cantidadSoE = null;
    this.productoSeleccionado = null;
    this.productoEditando = null;
    this.productoSeleccionadoNombre = '';
    this.precio = null;
    this.idProductoManual = '';
    this.cantidadManual = null;
  }

  enableInput(event: any): void {
    const input = event?.target as HTMLInputElement;
    if (!input) return;
    input.removeAttribute('readonly');
  }

  private getIdStr(p: any): string {
    const id = p?.id_producto ?? p?.idProducto ?? p?.id ?? '';
    return id != null ? String(id) : '';
  }

  /** Foco + teclado en ~80ms, mínimo delay para que Angular renderice el modal */
  private async focusCantidadInmediato(ref?: IonInput): Promise<void> {
    await new Promise(r => setTimeout(r, 80));
    try {
      await ref?.setFocus();
    } catch { /* noop */ }
  }
}
