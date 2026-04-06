import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InventariosDisponiblesPage } from './inventarios-disponibles.page';

const routes: Routes = [
  {
    path: '',
    component: InventariosDisponiblesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventariosDisponiblesPageRoutingModule {}
