import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InventarioService } from '../../services/inventario.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-inventarios-disponibles',
  templateUrl: './inventarios-disponibles.page.html',
  styleUrls: ['./inventarios-disponibles.page.scss'],
  standalone: false
})
export class InventariosDisponiblesPage implements OnInit {

  nombreCompleto = '';
  inicial = '';
  sucursalesConInventario: any[] = [];
  inventariosPlanos: any[] = [];

  constructor(
    private router: Router,
    private inventarioService: InventarioService,
    private user: UserService
  ) {}

  ngOnInit() {
    const usuario = this.user.getUsuario();
    const nombre = usuario?.datos?.nombre || '';
    const apellido = usuario?.datos?.apellido || '';
    this.nombreCompleto = `${nombre} ${apellido}`;
    this.inicial = nombre.charAt(0).toUpperCase();

    const todasSucursales = usuario?.sucursales?.filter(s => s.nombre_sucursal?.trim()) || [];

    this.inventarioService.getInventarios().subscribe(data => {
      this.inventariosPlanos = [];

      data.forEach(grupo => {
        grupo.datos.forEach((inv: any) => {
          this.inventariosPlanos.push({
            datos: inv,
            sucursal: grupo.sucursal
          });
        });
      });

      const idsConInventario = this.inventariosPlanos.map(i => i.sucursal.id_sucursal);
      this.sucursalesConInventario = todasSucursales.filter(s => idsConInventario.includes(s.id_sucursal));
    });
  }

  getInventariosDeSucursal(idSucursal: number) {
    return this.inventariosPlanos.filter(i => i.sucursal.id_sucursal === idSucursal);
  }

  abrirInventario(inv: any, sucursal: any) {
    this.router.navigate(['inventario'], {
      queryParams: {
        idInventario: inv.datos.id,
        nombre_sucursal: sucursal.nombre_sucursal,
        id_sucursal: sucursal.id_sucursal
      }
    });
  }

  cerrarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
