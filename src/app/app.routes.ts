import { Routes } from '@angular/router';
import { VideoGamesComponent } from './pages/video-games/video-games.component';
import { VideoGameBoxesComponent } from './pages/video-game-boxes/video-game-boxes.component';
import { BoardGamesComponent } from './pages/board-games/board-games.component';
import { BoardGameBoxesComponent } from './pages/board-game-boxes/board-game-boxes.component';
import { BoardGameBoxDetailComponent } from './pages/board-game-box-detail/board-game-box-detail.component';
import { BoardGameDetailComponent } from './pages/board-game-detail/board-game-detail.component';
import { VideoGameDetailComponent } from './pages/video-game-detail/video-game-detail.component';
import { VideoGameBoxDetailComponent } from './pages/video-game-box-detail/video-game-box-detail.component';
import { SystemsComponent } from './pages/systems/systems.component';
import { ToysComponent } from './pages/toys/toys.component';
import { CustomFieldsComponent } from './pages/custom-fields/custom-fields.component';
import { OptionsComponent } from './pages/options/options.component';

export const routes: Routes = [
  { path: '', redirectTo: '/video-game-boxes', pathMatch: 'full' },
  { path: 'video-games', component: VideoGamesComponent },
  { path: 'video-game/:id', component: VideoGameDetailComponent },
  { path: 'video-game-boxes', component: VideoGameBoxesComponent },
  { path: 'video-game-box/:id', component: VideoGameBoxDetailComponent },
  { path: 'board-games', component: BoardGamesComponent },
  { path: 'board-game/:id', component: BoardGameDetailComponent },
  { path: 'board-game-boxes', component: BoardGameBoxesComponent },
  { path: 'board-game-box/:id', component: BoardGameBoxDetailComponent },
  { path: 'systems', component: SystemsComponent },
  { path: 'toys', component: ToysComponent },
  { path: 'custom-fields', component: CustomFieldsComponent },
  { path: 'options', component: OptionsComponent }
];
