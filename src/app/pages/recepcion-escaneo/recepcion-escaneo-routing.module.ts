import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecepcionEscaneoPage } from './recepcion-escaneo.page';

const routes: Routes = [
  {
    path: '',
    component: RecepcionEscaneoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecepcionEscaneoPageRoutingModule {}
