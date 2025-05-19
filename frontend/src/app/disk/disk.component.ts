import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-disk',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './disk.component.html',
  styleUrls: ['./disk.component.css']
})
export class DiskComponent {
  algorithm = 'FCFS';
  head = 0;
  requests = '';
  diskSize = 200;
  direction = 'right';

  result: number[] = [];

  runSimulation() {
    const requestList = this.requests.trim().split(/\s+/).map(Number);
    console.log('Running Simulation');
    console.log('Algorithm:', this.algorithm);
    console.log('Head Position:', this.head);
    console.log('Requests:', requestList);
    if (this.algorithm === 'SCAN' || this.algorithm === 'C-SCAN') {
      console.log('Disk Size:', this.diskSize);
      if (this.algorithm === 'SCAN') {
        console.log('Direction:', this.direction);
      }
    }

    // Placeholder: replace with backend integration
    this.result = [this.head, ...requestList];  // Simulated output
  }
}
