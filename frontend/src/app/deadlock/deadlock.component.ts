import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-deadlock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deadlock.component.html',
  styleUrls: ['./deadlock.component.css']
})
export class DeadlockComponent {
  totalInput: string = '';
  maxDemandInput: string = '';
  requestInput: string = '';

  totalResources: number[] = [];
  available: number[] = [];
  processes: { id: number; maxDemand: number[]; allocation: number[] }[] = [];
  safeSequence: number[] = [];
  waitForGraph: string[] = [];
  processCounter: number = 0;

  constructor() { }

  setResources() {
    this.totalResources = this.totalInput.split(' ').map(Number);
    // Input validation: Ensure all total resources are non-negative
    if (this.totalResources.some(r => isNaN(r) || r < 0)) {
      alert('Error: Total Resources must be space-separated non-negative numbers (e.g., "10 5 7").');
      this.totalResources = []; // Clear invalid input
      this.totalInput = '';
      return;
    }
    this.available = [...this.totalResources];
    this.processes = []; // Clear processes when resources are reset
    this.safeSequence = [];
    this.waitForGraph = [];
    this.processCounter = 0; // Reset process ID counter
  }

  addProcess() {
    if (this.totalResources.length === 0) {
      alert('Error: Please set total resources first.');
      return;
    }

    const max = this.maxDemandInput.split(' ').map(Number);
    const alloc = this.requestInput.split(' ').map(Number);

    // Input validation: Check for non-negative numbers and correct dimensions
    if (
      max.some(val => isNaN(val) || val < 0) ||
      alloc.some(val => isNaN(val) || val < 0)
    ) {
      alert('Error: Max Demand and Allocated must be space-separated non-negative numbers.');
      return;
    }

    if (
      max.length !== this.totalResources.length ||
      alloc.length !== this.totalResources.length
    ) {
      alert('Error: Input mismatch in dimensions! Max Demand and Allocated must match the number of total resources.');
      return;
    }

    // Input validation: Check if allocated resources exceed total resources
    for (let i = 0; i < alloc.length; i++) {
      if (alloc[i] > this.totalResources[i]) {
        alert(`Error: Allocated resource ${i + 1} (${alloc[i]}) cannot exceed total system resource ${i + 1} (${this.totalResources[i]}).`);
        return;
      }
    }

    // Input validation: Check if max demand is less than allocated
    for (let i = 0; i < max.length; i++) {
      if (max[i] < alloc[i]) {
        alert(`Error: Max demand for resource ${i + 1} (${max[i]}) cannot be less than allocated resource ${i + 1} (${alloc[i]}).`);
        return;
      }
    }

    this.processes.push({ id: this.processCounter++, maxDemand: max, allocation: alloc });

    // Clear input fields for next process
    this.maxDemandInput = '';
    this.requestInput = '';

    // Recalculate everything after adding a new process
    this.recalculateAvailable();
    this.calculateSafeSequence();
    this.generateWaitForGraph();
  }

  recalculateAvailable() {
    // Reset available resources to total resources
    this.available = [...this.totalResources];
    // Subtract currently allocated resources by all processes
    for (let process of this.processes) {
      for (let i = 0; i < process.allocation.length; i++) {
        this.available[i] -= process.allocation[i];
      }
    }
  }

  calculateSafeSequence() {
    const n = this.processes.length; // Number of processes
    const m = this.totalResources.length; // Number of resource types
    const finish = Array(n).fill(false); // Tracks if a process has finished
    let work = [...this.available]; // Current available resources (copy for simulation)
    const sequence: number[] = []; // Stores the safe sequence

    // Edge case: if no processes, no sequence
    if (n === 0) {
        this.safeSequence = [];
        return;
    }

    let changedThisIteration = true; // Flag to check if any process finished in an iteration
    let loopCounter = 0; // Prevent infinite loops in case of logic errors (max n iterations)
    const MAX_ITERATIONS = n * 2; // A safety net, typically n iterations are enough

    while (sequence.length < n && changedThisIteration && loopCounter < MAX_ITERATIONS) {
        changedThisIteration = false; // Assume no process finishes in this pass
        loopCounter++;

        for (let i = 0; i < n; i++) { // Iterate through all processes
            if (!finish[i]) { // If process i has not finished yet
                const need = this.processes[i].maxDemand.map((val, j) => val - this.processes[i].allocation[j]);

                // Check if process i's need can be satisfied by current 'work' resources
                if (need.every((val, j) => val <= work[j])) {
                    // If yes, simulate resource allocation and release
                    for (let j = 0; j < m; j++) {
                        work[j] += this.processes[i].allocation[j]; // Process finishes and releases its allocated resources
                    }
                    finish[i] = true; // Mark process as finished
                    sequence.push(this.processes[i].id); // Add to the safe sequence
                    changedThisIteration = true; // A process finished, so we might be able to finish more
                }
            }
        }
    }

    // Determine if a full safe sequence was found
    // A safe sequence exists only if all processes could finish.
    this.safeSequence = (sequence.length === n) ? sequence : [];
  }

  generateWaitForGraph() {
    this.waitForGraph = []; // Clear previous graph before generating new one
    const n = this.processes.length;
    const m = this.totalResources.length;
    const finishedProcessesIDs = new Set(this.safeSequence); // Using Set for efficient lookup

    // If no processes, or all processes are in safe sequence, no deadlock graph
    if (n === 0 || finishedProcessesIDs.size === n) {
        return;
    }

    // Identify processes that are currently 'waiting' for resources
    // A process is waiting if its current need cannot be met by the global available resources
    const waitingProcessesIndices: number[] = [];
    for (let i = 0; i < n; i++) {
        if (!finishedProcessesIDs.has(this.processes[i].id)) { // Only consider processes not in safe sequence
            const need_i = this.processes[i].maxDemand.map((val, k) => val - this.processes[i].allocation[k]);
            let canMeetNeed = true;
            for (let k = 0; k < m; k++) {
                if (need_i[k] > this.available[k]) { // Compare need with globally available resources
                    canMeetNeed = false;
                    break;
                }
            }
            if (!canMeetNeed) {
                waitingProcessesIndices.push(i);
            }
        }
    }

    // Build the wait-for graph edges between waiting processes
    for (const i of waitingProcessesIndices) {
      const need_i = this.processes[i].maxDemand.map((val, k) => val - this.processes[i].allocation[k]);

      for (const j of waitingProcessesIndices) {
        if (i === j) continue; // Skip self-loops

        const allocation_j = this.processes[j].allocation;

        // Check if process 'i' needs any resource currently held by process 'j'
        for (let k = 0; k < m; k++) {
          if (need_i[k] > 0 && allocation_j[k] > 0) {
            // An edge Pi -> Pj exists if Pi needs resource k and Pj is holding resource k
            this.waitForGraph.push(`P${this.processes[i].id} → P${this.processes[j].id}`);
            break; // Add edge only once if any needed resource is held by Pj
          }
        }
      }
    }
  }

  // Helper function to format the 'Need' column (e.g., "7 4 3")
  getNeed(process: { id: number, maxDemand: number[], allocation: number[] }): string {
    // Ensure calculation handles cases where allocation might be larger than max (though validation should prevent this)
    return process.maxDemand.map((v, j) => Math.max(0, v - process.allocation[j])).join(' ');
  }

  // Helper function to format the Safe Sequence string (e.g., "P1 → P2 → P0")
  getSafeSequenceString(): string {
    return this.safeSequence.map(pid => 'P' + pid).join(' → ');
  }
}