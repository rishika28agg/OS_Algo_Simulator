import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Process {
  id: number;
  maxDemand: number[];
  allocation: number[];
}

interface SafeSequenceStep {
  processId: number | null; // The process being considered/added
  work: number[]; // State of the Work array at this step
  finish: boolean[]; // State of the Finish array at this step
  message: string; // Explanation of the step
}

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
  requestInput: string = ''; // Used for 'allocation' input

  totalResources: number[] = [];
  available: number[] = []; // Stores the initial actual available resources
  processes: Process[] = [];
  
  // Animation-related properties
  animationPlaying: boolean = false;
  safeSequence: number[] = []; // Final safe sequence
  safeSequenceSteps: SafeSequenceStep[] = []; // Steps for animation
  highlightedProcessId: number | null = null; // Process ID currently being checked
  currentWork: number[] = []; // Current state of the 'Work' array during animation
  currentFinish: boolean[] = []; // Current state of the 'Finish' array during animation
  
  waitForGraph: string[] = [];
  processCounter: number = 0; // Increments for unique PIDs

  // For calculation logs, similar to the CPU scheduler
  overallCalculations: string[] = [];
  
  // Animation delay in milliseconds
  animationDelayMs: number = 1000; 

  constructor() { }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setResources() {
    if (this.animationPlaying) {
      alert('Cannot set resources while simulation is running.');
      return;
    }
    const parsedResources = this.totalInput.split(' ').map(Number);
    // Input validation: Ensure all total resources are non-negative numbers
    if (parsedResources.some(r => isNaN(r) || r < 0) || parsedResources.length === 0) {
      alert('Error: Total Resources must be space-separated non-negative numbers (e.g., "10 5 7").');
      this.totalResources = [];
      this.totalInput = '';
      return;
    }
    this.totalResources = parsedResources;
    this.available = [...this.totalResources];
    this.processes = []; // Clear processes when resources are reset
    this.processCounter = 0; // Reset process ID counter
    this.resetSimulationState(); // Reset results and animation
  }

  addProcess() {
    if (this.animationPlaying) {
      alert('Cannot add processes while simulation is running.');
      return;
    }
    if (this.totalResources.length === 0) {
      alert('Error: Please set total resources first.');
      return;
    }

    const max = this.maxDemandInput.split(' ').map(Number);
    const alloc = this.requestInput.split(' ').map(Number);

    // Input validation: Check for non-negative numbers and correct dimensions
    if (
      max.some(val => isNaN(val) || val < 0) || max.length === 0 ||
      alloc.some(val => isNaN(val) || val < 0) || alloc.length === 0
    ) {
      alert('Error: Max Demand and Allocated must be space-separated non-negative numbers (e.g., "7 5 3").');
      return;
    }

    if (
      max.length !== this.totalResources.length ||
      alloc.length !== this.totalResources.length
    ) {
      alert(`Error: Input mismatch in dimensions! Max Demand and Allocated must match the number of total resources (${this.totalResources.length}).`);
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

    // Input validation: Check if current allocation + available > total (shouldn't happen with proper setup but a safeguard)
    // Sum all current allocations to calculate the current total allocated
    let currentTotalAllocated = Array(this.totalResources.length).fill(0);
    for (const p of this.processes) {
        p.allocation.forEach((val, i) => currentTotalAllocated[i] += val);
    }
    alloc.forEach((val, i) => currentTotalAllocated[i] += val); // Add new process's allocation

    for (let i = 0; i < currentTotalAllocated.length; i++) {
        if (currentTotalAllocated[i] > this.totalResources[i]) {
            alert(`Error: Adding this process would cause total allocated resource ${i+1} to exceed total system resource ${i+1}.`);
            return;
        }
    }


    this.processes.push({ id: this.processCounter++, maxDemand: max, allocation: alloc });

    // Clear input fields for next process
    this.maxDemandInput = '';
    this.requestInput = '';

    // Recalculate everything after adding a new process
    this.recalculateAvailable();
    this.resetSimulationState(); // Clear previous simulation results
  }

  // Resets all simulation results and animation states
  resetSimulationState() {
    this.safeSequence = [];
    this.safeSequenceSteps = [];
    this.waitForGraph = [];
    this.overallCalculations = [];
    this.highlightedProcessId = null;
    this.currentWork = [];
    this.currentFinish = [];
  }

  recalculateAvailable() {
    if (this.totalResources.length === 0) {
      this.available = [];
      return;
    }
    // Reset available resources to total resources
    this.available = [...this.totalResources];
    // Subtract currently allocated resources by all processes
    for (let process of this.processes) {
      for (let i = 0; i < process.allocation.length; i++) {
        this.available[i] -= process.allocation[i];
      }
    }
  }

  async runBankersAlgorithm() {
    if (this.animationPlaying) {
      alert('Simulation is already running.');
      return;
    }
    if (this.processes.length === 0 || this.totalResources.length === 0) {
      alert('Please set resources and add processes first.');
      return;
    }

    this.animationPlaying = true;
    this.resetSimulationState(); // Clear previous run's results

    const n = this.processes.length; // Number of processes
    const m = this.totalResources.length; // Number of resource types
    let finish = Array(n).fill(false); // Tracks if a process has finished
    let work = [...this.available]; // Current available resources (copy for simulation)
    const sequence: number[] = []; // Stores the safe sequence

    this.overallCalculations.push("--- Banker's Algorithm Simulation Started ---");
    this.overallCalculations.push(`Initial Available: [${this.available.join(' ')}]`);
    
    // Initialize animation state
    this.currentWork = [...work];
    this.currentFinish = [...finish];
    this.safeSequenceSteps.push({
      processId: null,
      work: [...work],
      finish: [...finish],
      message: `Initial state: Work = [${work.join(' ')}], All processes unfinished.`
    });
    await this.delay(this.animationDelayMs);

    let changedThisIteration = true; // Flag to check if any process finished in an iteration
    let loopCounter = 0;
    const MAX_ITERATIONS = n * n; // A safety net to prevent infinite loops

    while (sequence.length < n && changedThisIteration && loopCounter < MAX_ITERATIONS) {
      changedThisIteration = false;
      loopCounter++;

      this.overallCalculations.push(`\nIteration ${loopCounter}: Current Work = [${work.join(' ')}]`);

      for (let i = 0; i < n; i++) { // Iterate through all processes
        const process = this.processes[i];
        if (!finish[i]) { // If process i has not finished yet
          this.highlightedProcessId = process.id;
          const need = process.maxDemand.map((val, j) => val - process.allocation[j]);

          this.overallCalculations.push(`  Checking P${process.id}: Need = [${need.join(' ')}] vs Work = [${work.join(' ')}]`);
          this.safeSequenceSteps.push({
            processId: process.id,
            work: [...work],
            finish: [...finish],
            message: `Checking P${process.id} (Need: [${need.join(' ')}}])`
          });
          await this.delay(this.animationDelayMs);

          // Check if process i's need can be satisfied by current 'work' resources
          if (need.every((val, j) => val <= work[j])) {
            // If yes, simulate resource allocation and release
            let prevWork = [...work];
            for (let j = 0; j < m; j++) {
              work[j] += process.allocation[j]; // Process finishes and releases its allocated resources
            }
            finish[i] = true; // Mark process as finished
            sequence.push(process.id); // Add to the safe sequence
            changedThisIteration = true; // A process finished, so we might be able to finish more

            this.overallCalculations.push(`  P${process.id} CAN be satisfied. Work becomes [${prevWork.join(' ')}] + Allocation P${process.id} ([${process.allocation.join(' ')}]) = [${work.join(' ')}]. P${process.id} added to sequence.`);
            this.currentWork = [...work]; // Update live work display
            this.currentFinish = [...finish]; // Update live finish display
            this.safeSequenceSteps.push({
              processId: process.id,
              work: [...work],
              finish: [...finish],
              message: `P${process.id} satisfied. Work updated to [${work.join(' ')}]. Added to sequence.`
            });
            await this.delay(this.animationDelayMs * 1.5); // Slightly longer delay for completion
          } else {
            this.overallCalculations.push(`  P${process.id} CANNOT be satisfied. Remaining in queue.`);
            this.safeSequenceSteps.push({
              processId: process.id,
              work: [...work],
              finish: [...finish],
              message: `P${process.id} cannot be satisfied yet. Waiting.`
            });
            await this.delay(this.animationDelayMs);
          }
        }
      }
      this.highlightedProcessId = null; // Clear highlight after iteration
      this.safeSequenceSteps.push({
        processId: null,
        work: [...work],
        finish: [...finish],
        message: `End of Iteration ${loopCounter}.`
      });
      await this.delay(this.animationDelayMs / 2); // Short delay between iterations
    }

    // Determine if a full safe sequence was found
    this.safeSequence = (sequence.length === n) ? sequence : [];

    if (this.safeSequence.length === n) {
      this.overallCalculations.push(`\n--- Safe Sequence Found: <${this.getSafeSequenceString()}> ---`);
    } else {
      this.overallCalculations.push(`\n--- No Safe Sequence Found. System is in an unsafe state. ---`);
    }

    this.generateWaitForGraph(); // Generate wait-for graph based on final state

    this.animationPlaying = false;
  }

  generateWaitForGraph() {
    this.waitForGraph = []; // Clear previous graph before generating new one
    const n = this.processes.length;
    const m = this.totalResources.length;
    const finishedProcessesIDs = new Set(this.safeSequence); // Using Set for efficient lookup

    // If a safe sequence was found, there's no deadlock, hence no wait-for graph indicating deadlock
    if (finishedProcessesIDs.size === n) {
        this.overallCalculations.push("\nSystem is in a safe state. No wait-for graph (deadlock) found.");
        return;
    }
    
    this.overallCalculations.push("\n--- Generating Wait-For Graph (for unsafe state) ---");


    // Identify processes that are currently 'waiting' for resources
    // A process is waiting if its current need cannot be met by the global available resources
    const waitingProcesses: Process[] = [];
    for (let i = 0; i < n; i++) {
        const process = this.processes[i];
        if (!finishedProcessesIDs.has(process.id)) { // Only consider processes not in safe sequence
            const need_i = process.maxDemand.map((val, k) => val - process.allocation[k]);
            let canMeetNeed = true;
            for (let k = 0; k < m; k++) {
                // Compare need with the initial 'available' resources (not the 'work' from simulation)
                // because the wait-for graph is based on current state before any process runs.
                if (need_i[k] > this.available[k]) {
                    canMeetNeed = false;
                    break;
                }
            }
            if (!canMeetNeed) {
                waitingProcesses.push(process);
                this.overallCalculations.push(`  P${process.id} is waiting as its Need [${need_i.join(' ')}] cannot be met by Available [${this.available.join(' ')}].`);
            }
        }
    }

    if (waitingProcesses.length === 0 && finishedProcessesIDs.size < n) {
      this.overallCalculations.push("  No explicit waiting processes identified that cannot be satisfied by current available resources. This might indicate a more complex deadlock or that processes are waiting on each other's release.");
    }


    // Build the wait-for graph edges between waiting processes
    for (const p_i of waitingProcesses) {
      const need_i = p_i.maxDemand.map((val, k) => val - p_i.allocation[k]);

      for (const p_j of waitingProcesses) {
        if (p_i.id === p_j.id) continue; // Skip self-loops

        const allocation_j = p_j.allocation;

        // Check if process 'i' needs any resource currently held by process 'j'
        for (let k = 0; k < m; k++) {
          if (need_i[k] > 0 && allocation_j[k] > 0) {
            // An edge Pi -> Pj exists if Pi needs resource k and Pj is holding resource k
            const edge = `P${p_i.id} → P${p_j.id} (P${p_i.id} needs R${k+1} held by P${p_j.id})`;
            if (!this.waitForGraph.includes(edge)) { // Prevent duplicate edges
                this.waitForGraph.push(edge);
                this.overallCalculations.push(`  Added edge: ${edge}`);
            }
          }
        }
      }
    }
    if (this.waitForGraph.length === 0 && finishedProcessesIDs.size < n) {
      this.overallCalculations.push("  No explicit wait-for graph edges (Pj holding Pi's needed resource) found among waiting processes. This might imply a circular wait is not directly observable this way, or that other factors contribute to the unsafe state.");
    }
  }

  // Helper function to format the 'Need' column (e.g., "7 4 3")
  getNeed(process: Process): string {
    return process.maxDemand.map((v, j) => Math.max(0, v - process.allocation[j])).join(' ');
  }

  // Helper function to format the Safe Sequence string (e.g., "P1 → P2 → P0")
  getSafeSequenceString(): string {
    return this.safeSequence.map(pid => 'P' + pid).join(' → ');
  }
}