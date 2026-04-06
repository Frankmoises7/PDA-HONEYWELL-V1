import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InventariosDisponiblesPageRoutingModule } from './inventarios-disponibles-routing.module';

import { InventariosDisponiblesPage } from './inventarios-disponibles.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InventariosDisponiblesPageRoutingModule
  ],
  declarations: [InventariosDisponiblesPage]
})
export class InventariosDisponiblesPageModule {}
