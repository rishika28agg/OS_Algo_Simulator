import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagingvComponent } from './pagingv/pagingv.component';
import { ContiguousComponent } from './contiguous/contiguous.component';

@Component({
  selector: 'app-file',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PagingvComponent,
    ContiguousComponent
  ],
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.css']
})
export class FileComponent {
  tab: 'paging' | 'contiguous' = 'paging';

  selectTab(tabName: 'paging' | 'contiguous') {
    this.tab = tabName;
  }
}