import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventariosDisponiblesPage } from './inventarios-disponibles.page';

describe('InventariosDisponiblesPage', () => {
  let component: InventariosDisponiblesPage;
  let fixture: ComponentFixture<InventariosDisponiblesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InventariosDisponiblesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
