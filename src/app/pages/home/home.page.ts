import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InventarioService } from '../../services/inventario.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  nombreCompleto: string = '';
  inicial: string = '';
  sucursales: any[] = [];
  inventarios: any[] = [];
  inventariosPlanos: any[] = [];
  sucursalesConInventario: any[] = [];


  constructor(
    private router: Router,
    private inventarioService: InventarioService,
    private user: UserService
  ) { }

  ngOnInit() {
    const usuario = this.user.getUsuario();
    const nombre = usuario?.datos?.nombre || '';
    const apellido = usuario?.datos?.apellido || '';
    this.nombreCompleto = `${nombre} ${apellido}`;
    this.inicial = nombre.charAt(0).toUpperCase();

    const todasSucursales = usuario?.sucursales?.filter(s => s.nombre_sucursal?.trim()) || [];

    this.inventarioService.getInventarios().subscribe(data => {
      this.inventarios = data;
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

  irAConsultaPrecio() {
    this.router.navigate(['/consulta-precio']);
  }

  irAInventarios() {
    this.router.navigate(['/inventarios-disponibles']);
  }

  irARecepcionMercaderia() {
    this.router.navigate(['/recepcion-mercaderia']);
  }

  cerrarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
