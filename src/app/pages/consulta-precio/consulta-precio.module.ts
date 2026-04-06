import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConsultaPrecioPageRoutingModule } from './consulta-precio-routing.module';

import { ConsultaPrecioPage } from './consulta-precio.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConsultaPrecioPageRoutingModule
  ],
  declarations: [ConsultaPrecioPage]
})
export class ConsultaPrecioPageModule {}
