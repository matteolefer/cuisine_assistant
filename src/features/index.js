import StockComponent from './stock/StockComponent';
import EquipementComponent from './equipement/EquipementComponent';
import RecettesComponent from './recettes/RecettesComponent';
import FavorisComponent from './favoris/FavorisComponent';
import CoursesComponent from './courses/CoursesComponent';
import PlanificationComponent from './planification/PlanificationComponent';
import { VIEWS } from '../constants';

export const featureComponents = {
  [VIEWS.STOCK]: StockComponent,
  [VIEWS.EQUIPEMENT]: EquipementComponent,
  [VIEWS.RECETTES]: RecettesComponent,
  [VIEWS.FAVORIS]: FavorisComponent,
  [VIEWS.COURSES]: CoursesComponent,
  [VIEWS.PLANIFICATION]: PlanificationComponent,
};

export {
  StockComponent,
  EquipementComponent,
  RecettesComponent,
  FavorisComponent,
  CoursesComponent,
  PlanificationComponent,
};
