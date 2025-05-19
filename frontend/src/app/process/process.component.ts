import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
}

@Component({
  selector: 'app-process',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './process.component.html',
  styleUrls: ['./process.component.css']
})
export class ProcessComponent {
  algorithms = [
    'First Come First Served (FCFS)',
    'Shortest Job First (SJF)',
    'Priority Scheduling',
    'Round Robin (RR)'
  ];
  selectedAlgorithm = this.algorithms[0];

  process: Process = {
    id: '',
    arrivalTime: 0,
    burstTime: 0,
    priority: 0
  };

  processList: Process[] = [];

  addProcess() {
    if (this.process.id.trim()) {
      this.processList.push({ ...this.process });
      this.process = { id: '', arrivalTime: 0, burstTime: 0, priority: 0 };
    }
  }

  runSimulation() {
    alert(`Running simulation for: ${this.selectedAlgorithm}`);
  }
}
