import { Routes } from '@angular/router';
import { VideoGamesComponent } from './pages/video-games/video-games.component';
import { VideoGameBoxesComponent } from './pages/video-game-boxes/video-game-boxes.component';
import { BoardGamesComponent } from './pages/board-games/board-games.component';
import { BoardGamesIndividualComponent } from './pages/board-games-individual/board-games-individual.component';
import { SystemsComponent } from './pages/systems/systems.component';
import { ToysComponent } from './pages/toys/toys.component';
import { CustomFieldsComponent } from './pages/custom-fields/custom-fields.component';
import { OptionsComponent } from './pages/options/options.component';

export const routes: Routes = [
  { path: '', redirectTo: '/video-games', pathMatch: 'full' },
  { path: 'video-games', component: VideoGamesComponent },
  { path: 'video-game-boxes', component: VideoGameBoxesComponent },
  { path: 'board-games', component: BoardGamesComponent },
  { path: 'board-games-individual', component: BoardGamesIndividualComponent },
  { path: 'systems', component: SystemsComponent },
  { path: 'toys', component: ToysComponent },
  { path: 'custom-fields', component: CustomFieldsComponent },
  { path: 'options', component: OptionsComponent }
];
