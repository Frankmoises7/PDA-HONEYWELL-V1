import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';

import { InventarioService } from 'src/app/services/inventario.service';
import { HoneywellScannerService } from 'src/app/services/honeywell-scanner.service';

@Component({
  selector: 'app-consulta-precio',
  templateUrl: './consulta-precio.page.html',
  styleUrls: ['./consulta-precio.page.scss'],
  standalone: false
})
export class ConsultaPrecioPage implements OnInit, OnDestroy {

  codigo = '';
  precio: number | null = null;
  id_producto = '';
  nombreProducto = '';
  mostrarModal = false;
  mensajeError = '';

  private scanSub: Subscription;

  constructor(
    private inventS: InventarioService,
    private ngZone: NgZone,
    private scanner: HoneywellScannerService
  ) { }

  ngOnInit(): void {
    this.scanSub = this.scanner.scan$.subscribe(codigo => {
      if (this.mostrarModal) return;
      this.consultarPrecio(codigo);
    });
    this.scanner.iniciar();
  }

  ngOnDestroy(): void {
    this.scanner.detener();
    this.scanSub?.unsubscribe();
  }

  consultarPrecio(codigo: string): void {
    this.codigo = codigo;
    this.inventS.getProducto(codigo).subscribe({
      next: (producto: any) => {
        this.ngZone.run(() => {
          if (producto?.nombre) {
            this.nombreProducto = producto.nombre;
            this.precio = parseFloat(producto.precio_venta);
            this.id_producto = producto.id_producto || '';
            this.mensajeError = '';
          } else {
            this.nombreProducto = '';
            this.precio = null;
            this.mensajeError = 'Producto no encontrado.';
          }
          this.mostrarModal = true;
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.nombreProducto = '';
          this.precio = null;
          this.id_producto = '';
          this.mensajeError = 'Error al consultar el producto.';
          this.mostrarModal = true;
        });
      }
    });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.nombreProducto = '';
    this.precio = null;
    this.id_producto = '';
    this.mensajeError = '';
    this.codigo = '';
  }
}
