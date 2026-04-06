import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RecepcionMercaderiaPageRoutingModule } from './recepcion-mercaderia-routing.module';

import { RecepcionMercaderiaPage } from './recepcion-mercaderia.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RecepcionMercaderiaPageRoutingModule
  ],
  declarations: [RecepcionMercaderiaPage]
})
export class RecepcionMercaderiaPageModule {}
