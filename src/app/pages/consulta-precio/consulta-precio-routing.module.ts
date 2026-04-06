import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConsultaPrecioPage } from './consulta-precio.page';

const routes: Routes = [
  {
    path: '',
    component: ConsultaPrecioPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConsultaPrecioPageRoutingModule {}
