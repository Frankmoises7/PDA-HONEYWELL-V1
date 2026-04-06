import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login', // 👈 Redirige al login al iniciar
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
    {
    path: 'inventarios-disponibles',
    loadChildren: () => import('./pages/inventarios-disponibles/inventarios-disponibles.module').then( m => m.InventariosDisponiblesPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'inventario',
    loadChildren: () => import('./pages/inventario/inventario.module').then( m => m.InventarioPageModule)
  },
  {
    path: 'consulta-precio',
    loadChildren: () => import('./pages/consulta-precio/consulta-precio.module').then( m => m.ConsultaPrecioPageModule)
  },
  {
    path: 'recepcion-mercaderia',
    loadChildren: () => import('./pages/recepcion-mercaderia/recepcion-mercaderia.module').then( m => m.RecepcionMercaderiaPageModule)
  },
  {
    path: 'recepcion-escaneo',
    loadChildren: () => import('./pages/recepcion-escaneo/recepcion-escaneo.module').then( m => m.RecepcionEscaneoPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
