import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecepcionMercaderiaPage } from './recepcion-mercaderia.page';

const routes: Routes = [
  {
    path: '',
    component: RecepcionMercaderiaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecepcionMercaderiaPageRoutingModule {}
