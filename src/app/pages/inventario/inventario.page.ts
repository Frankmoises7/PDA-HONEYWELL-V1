import {
  Component, ViewChild, ElementRef, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef, NgZone
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { Subscription } from 'rxjs';

import { InventarioService } from 'src/app/services/inventario.service';
import { AlertaService } from 'src/app/services/alerta.service';
import { UserService } from 'src/app/services/user.service';
import { HoneywellScannerService } from 'src/app/services/honeywell-scanner.service';
import { DeviceProfileService } from 'src/app/services/device-profile.service';

/** Altura en px que sube el modal cuando aparece el teclado */

(window as any).plugins = (window as any).plugins || {};

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventarioPage implements OnInit, OnDestroy {

  usuario: any;
  idInventario: string;
  codigo: string = '';
  cantidad: number | null = null;
  precio: number | null = null;
  productoSeleccionado: any = null;
  productoSeleccionadoId: any = null;
  productoSeleccionadoNombre: string = '';

  inventario: any[] = [];
  inventarioMap: Map<string, any> = new Map();
  inventarioArray: any[] = [];
  inventarioArrayMap: Map<string, any> = new Map();
  displayedInventarioArray: any[] = [];
  pageSize = 20;
  pageIndex = 1;

  mostrarModal = false;
  editando = false;
  productoEditando: any = null;
  escaneoActivo = true;

  nuevoCodigo = false;
  codigoParaAsociar = '';
  idProductoManual = '';

  sumarOEditar = false;
  cantidadSoE: number = null;

  nombreProducto = '';
  mensajeError = '';
  id_producto = '';

  agregarManual = false;
  cantidadManual: number | '' = '';
  esQ500 = true;

  keyboardOffset = 0;
  private readonly usarOffsetTeclado = Capacitor.getPlatform() === 'ios';

  private scanSub: Subscription;
  private backSub: any;
  private kbShowSub: any;
  private kbHideSub: any;
  private appStateSub: any;

  @ViewChild('cantidadInputRef') cantidadInputRef: ElementRef<HTMLInputElement>;
  @ViewChild('idProductoInput') idProductoInput: ElementRef<HTMLInputElement>;
  @ViewChild('cantidadSoEInputRef') cantidadSoEInputRef: ElementRef<HTMLInputElement>;

  constructor(
    private route: ActivatedRoute,
    private inventS: InventarioService,
    private alertas: AlertaService,
    private user: UserService,
    private location: Location,
    private platform: Platform,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private scanner: HoneywellScannerService,
    private deviceProfile: DeviceProfileService
  ) {
    const storedUser = this.user.getUsuario();
    this.usuario = storedUser?.datos;
    this.idInventario = this.route.snapshot.queryParams['idInventario'];

    this.inventS.get(this.idInventario).subscribe(data => {
      this.inventario = data;
      this.inventarioMap = new Map((this.inventario || []).map((p: any) => [String(p.id_producto), p]));
      this.cdr.markForCheck();
    });

    this.refrescarProductos();
  }

  async ngOnInit(): Promise<void> {
    const perfil = await this.deviceProfile.getProfile();
    this.esQ500 = perfil !== 'honeywell';
    this.cdr.markForCheck();

    this.backSub = this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.mostrarModal || this.sumarOEditar || this.nuevoCodigo || this.agregarManual) {
        this.cancelarModal();
        this.limpiarCampos();
      } else {
        this.volverAtras();
      }
    });

    this.scanSub = this.scanner.scan$.subscribe(codigo => {
      if (!this.escaneoActivo) return;
      if (this.mostrarModal || this.sumarOEditar || this.nuevoCodigo || this.agregarManual) return;
      this.abrirModalDesdeEscaneo(codigo);
    });

    this.scanner.iniciar();

    // Detectar teclado para subir el modal y que no quede tapado
    Keyboard.addListener('keyboardWillShow', (info) => {
      this.ngZone.run(() => {
        if (!this.usarOffsetTeclado) {
          this.keyboardOffset = 0;
          this.cdr.markForCheck();
          return;
        }
        const maxSafeOffset = Math.floor(window.innerHeight * 0.45);
        this.keyboardOffset = Math.max(0, Math.min(info.keyboardHeight || 0, maxSafeOffset));
        this.cdr.markForCheck();
      });
    }).then(h => this.kbShowSub = h);

    Keyboard.addListener('keyboardWillHide', () => {
      this.ngZone.run(() => {
        this.keyboardOffset = 0;
        this.cdr.markForCheck();
      });
    }).then(h => this.kbHideSub = h);

    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return;
      this.ngZone.run(() => {
        this.refrescarProductos();
      });
    }).then(h => this.appStateSub = h);
  }

  ionViewWillEnter(): void {
    if (!this.idInventario || !this.usuario?.id) return;
    this.refrescarProductos();
  }

  ngOnDestroy(): void {
    this.scanner.detener();
    this.scanSub?.unsubscribe();
    this.backSub?.unsubscribe();
    this.kbShowSub?.remove?.();
    this.kbHideSub?.remove?.();
    this.appStateSub?.remove?.();
  }

  ngAfterViewInit(): void {
    // Sin input oculto — el scanner usa el servicio centralizado
  }

  volverAtras(): void {
    this.location.back();
  }

  abrirModalDesdeEscaneo(codigo: string): void {
    const datos = new FormData();
    datos.append('codigoBarra', codigo);

    this.inventS.checkCodigoBarra(datos).subscribe({
      next: data => {
        this.ngZone.run(() => {
          if (data?.resultado === 'noex') {
            this.nuevoCodigo = true;
            this.codigoParaAsociar = codigo;
            setTimeout(() => this.idProductoInput?.nativeElement?.focus(), 400);
            this.cdr.markForCheck();
            return;
          }

          const idProd = data?.idProducto ?? data?.id_producto;
          if (idProd == null || idProd === '') {
            this.alertas.enviarAlerta('Respuesta del servidor incompleta al verificar el código.', 'danger');
            this.cdr.markForCheck();
            return;
          }

          const idKey = String(idProd);
          const yaExiste = this.inventarioArrayMap.get(idKey);
          const productoEncontrado = this.inventarioMap.get(idKey);

          if (yaExiste) {
            this.nombreProducto = data.nombre || '';
            this.precio = data.precio ? parseFloat(data.precio) : null;
            this.id_producto = data.id_producto || idKey;
            this.sumarOEditar = true;
            this.productoEditando = idProd;
            this.productoSeleccionadoNombre = productoEncontrado?.nombre || data.nombre || '';
            this.cantidadSoE = null;
            this.focusCantidadConTeclado(() => this.cantidadSoEInputRef);
            this.cdr.markForCheck();
            return;
          }

          if (productoEncontrado) {
            this.nombreProducto = data.nombre || productoEncontrado.nombre || '';
            this.precio = data.precio ? parseFloat(data.precio) : (productoEncontrado.precio_venta || 0);
            this.id_producto = data.id_producto || idKey;
            this.productoSeleccionado = productoEncontrado;
            this.mostrarModal = true;
            this.editando = false;
            this.codigo = codigo;
            this.cantidad = null;
            this.focusCantidadConTeclado(() => this.cantidadInputRef);
            this.cdr.markForCheck();
            return;
          }

          this.alertas.enviarAlerta(`Producto ${codigo} no registrado en este inventario.`, 'danger');
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.alertas.enviarAlerta('No se pudo verificar el código escaneado. Revisa la conexión o vuelve a intentar.', 'danger');
          this.cdr.markForCheck();
        });
      }
    });
  }

  guardarModal(): void {
    if (!this.cantidad || this.cantidad <= 0) {
      this.alertas.enviarAlerta('Cantidad no válida.', 'danger');
      return;
    }

    const idProducto = this.editando
      ? this.productoEditando
      : (this.productoSeleccionado?.id_producto ?? this.productoSeleccionado?.idProducto);

    if (!idProducto) {
      this.alertas.enviarAlerta('ID de producto no válido.', 'danger');
      return;
    }

    const datos = new FormData();
    datos.append('idProducto', idProducto);
    datos.append('cantidad', this.cantidad.toString());
    datos.append('idInventario', this.idInventario);
    datos.append('editar', this.editando ? '1' : '0');

    this.inventS.guardarCantidadInventario(datos).subscribe(() => {
      this.alertas.enviarAlerta('Cantidad guardada.', 'success');
      this.refrescarProductos(String(idProducto));
      this.resetModal();
      this.cdr.markForCheck();
    });
  }

  guardarSumarOEditar(accion: 'sumar' | 'editar'): void {
    const producto = this.inventarioArrayMap.get(String(this.productoEditando));
    let nuevaCantidad = this.cantidadSoE;

    if (!nuevaCantidad || nuevaCantidad <= 0) {
      this.alertas.enviarAlerta('Cantidad no válida.', 'danger');
      return;
    }

    if (accion === 'sumar' && producto) {
      nuevaCantidad = parseInt(producto.cantidad, 10) + this.cantidadSoE;
    }

    const editedId = String(this.productoEditando);
    const datos = new FormData();
    datos.append('idProducto', editedId);
    datos.append('cantidad', nuevaCantidad.toString());
    datos.append('idInventario', this.idInventario);
    datos.append('editar', '1');

    this.inventS.guardarCantidadInventario(datos).subscribe(() => {
      this.refrescarProductos(editedId);
      this.sumarOEditar = false;
      this.cantidadSoE = null;
      this.productoEditando = null;
      this.alertas.enviarAlerta('Cantidad actualizada.', 'success');
      this.limpiarCampos();
      this.cdr.markForCheck();
    });
  }

  guardarCodigo(): void {
    if (!this.idProductoManual) {
      this.alertas.enviarAlerta('Debes ingresar el ID del Producto.', 'danger');
      return;
    }

    const prioridadId = String(this.idProductoManual);
    const datos = new FormData();
    datos.append('codigoBarra', this.codigoParaAsociar);
    datos.append('idProducto', prioridadId);

    this.inventS.guardarCodigoBarra(datos).subscribe(data => {
      if (data.resultado === 'yaAsociado') {
        this.alertas.enviarAlerta('El producto existe pero no está en este inventario.', 'warning');
      } else {
        this.alertas.enviarAlerta(data.msj, 'success');
        this.refrescarProductos(prioridadId);
      }
      this.cancelarModal();
      this.limpiarCampos();
    });
  }

  abrirAgregarManual(): void {
    this.escaneoActivo = false;
    this.agregarManual = true;
    this.idProductoManual = '';
    this.cantidadManual = '';
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

        const prioridadId = String(this.idProductoManual);
        const productoEnInventario = this.inventarioArrayMap.get(prioridadId);

        if (productoEnInventario) {
          this.agregarManual = false;
          this.sumarOEditar = true;
          this.productoEditando = this.idProductoManual;
          this.productoSeleccionadoNombre = producto.nombre;
          this.precio = producto.precio_venta || 0;
          this.cantidadSoE = null;
          this.focusCantidadConTeclado(() => this.cantidadSoEInputRef, 400);
          this.cdr.markForCheck();
          return;
        }

        const datos = new FormData();
        datos.append('idProducto', this.idProductoManual);
        datos.append('cantidad', this.cantidadManual.toString());
        datos.append('idInventario', this.idInventario);
        datos.append('editar', '0');

        this.inventS.guardarCantidadInventario(datos).subscribe({
          next: () => {
            this.alertas.enviarAlerta('Producto agregado manualmente.', 'success');
            this.refrescarProductos(prioridadId);
            this.resetModal();
            this.cdr.markForCheck();
          },
          error: () => this.alertas.enviarAlerta('Error al guardar producto manual.', 'danger')
        });
        this.agregarManual = false;
      },
      error: () => this.alertas.enviarAlerta('Error al verificar el producto.', 'danger')
    });
  }

  editarCantidad(producto: any): void {
    let prod = this.inventarioMap.get(String(producto.idProducto));
    if (!prod) prod = this.inventarioArrayMap.get(String(producto.idProducto));
    if (!prod) {
      this.alertas.enviarAlerta('Producto no encontrado.', 'danger');
      return;
    }

    this.editando = true;
    this.mostrarModal = true;
    this.codigo = prod.idProducto || prod.id_producto;
    this.cantidad = parseInt(producto.cantidad, 10);
    this.productoEditando = prod.idProducto || prod.id_producto;
    this.precio = prod.precio_venta || prod.precio || 0;
    this.productoSeleccionadoNombre = prod.nombre || 'Producto Manual';
    this.productoSeleccionadoId = prod.idProducto || prod.id_producto;
    // Evita arrastrar el nombre del último escaneo al editar manuales.
    this.nombreProducto = this.productoSeleccionadoNombre;
    this.id_producto = this.productoSeleccionadoId;

    this.focusCantidadConTeclado(() => this.cantidadInputRef);
    this.cdr.markForCheck();
  }

  refrescarProductos(prioritizeId?: string): void {
    if (!this.idInventario || !this.usuario?.id) {
      return;
    }
    const datos = new FormData();
    datos.append('idInventario', this.idInventario);
    datos.append('idUsuario', String(this.usuario.id));

    this.inventS.getInventariosProductos(datos).subscribe(data => {
      this.inventarioArray = data || [];
      if (prioritizeId) {
        const pid = String(prioritizeId);
        const idx = this.inventarioArray.findIndex((p: any) => String(p.idProducto) === pid);
        if (idx > 0) {
          const [item] = this.inventarioArray.splice(idx, 1);
          this.inventarioArray.unshift(item);
        }
      }
      this.inventarioArrayMap = new Map(this.inventarioArray.map((p: any) => [String(p.idProducto), p]));
      this.pageIndex = 1;
      this.displayedInventarioArray = this.inventarioArray.slice(0, this.pageSize);
      this.cdr.markForCheck();
    });
  }

  cancelarModal(): void {
    this.resetModal();
  }

  loadMore(event: any): void {
    this.pageIndex += 1;
    this.displayedInventarioArray = this.inventarioArray.slice(0, this.pageSize * this.pageIndex);
    event?.target?.complete();
    if (this.displayedInventarioArray.length >= this.inventarioArray.length) {
      event.target.disabled = true;
    }
    this.cdr.markForCheck();
  }

  trackByIdProducto(index: number, item: any): any {
    return item?.idProducto ?? index;
  }

  enableInput(event: any): void {
    const input = event.target as HTMLInputElement;
    input.removeAttribute('readonly');
  }

  /**
   * Foco en el input nativo. Espera a que Angular renderice el modal.
   */
  private async focusCantidadConTeclado(getRef: () => ElementRef<HTMLInputElement> | undefined, delayMs = 80): Promise<void> {
    this.cdr.markForCheck();
    await new Promise(r => setTimeout(r, delayMs));
    for (let i = 0; i < 8; i++) {
      const el = getRef()?.nativeElement;
      if (el) {
        el.focus();
        el.select?.();
        return;
      }
      await new Promise(r => setTimeout(r, 60));
    }
  }

  private limpiarCampos(): void {
    this.codigo = '';
    this.cantidad = null;
    this.precio = null;
    this.productoSeleccionado = null;
    this.productoSeleccionadoId = null;
    this.productoSeleccionadoNombre = '';
    this.nombreProducto = '';
    this.productoEditando = null;
    this.codigoParaAsociar = '';
    this.idProductoManual = '';
    this.id_producto = '';
    this.cantidadSoE = null;
    this.cantidadManual = '';
  }

  private resetModal(): void {
    this.agregarManual = false;
    this.mostrarModal = false;
    this.nuevoCodigo = false;
    this.sumarOEditar = false;
    this.editando = false;
    this.escaneoActivo = true;
    this.keyboardOffset = 0;
    Keyboard.hide().catch(() => {});
    this.limpiarCampos();
    this.cdr.markForCheck();
  }
}
