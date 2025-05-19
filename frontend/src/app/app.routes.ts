import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ProcessComponent } from './process/process.component';
import { DeadlockComponent } from './deadlock/deadlock.component';
import { FileComponent } from './file/file.component';
import { DiskComponent } from './disk/disk.component';
import { AboutComponent } from './about/about.component';

export const routes: Routes = [
  { path: '', component: HomeComponent }, 
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'process', component: ProcessComponent },
  { path: 'deadlock', component: DeadlockComponent },
  { path: 'file', component: FileComponent },
  { path: 'disk', component: DiskComponent },
  { path: '', redirectTo: '', pathMatch: 'full' }
];