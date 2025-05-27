import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  startTime?: number;
  endTime?: number;
  remainingBurstTime?: number; // Added for RR to track remaining time
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
  process: Process = { id: '', arrivalTime: 0, burstTime: 0, priority: 0 };
  processList: Process[] = [];

  // Updated for animation and final display
  animatedGanttChart: { id: string, start: number, end: number }[] = [];
  totalTime: number = 0; // Max time on the Gantt chart for scaling
  animationPlaying: boolean = false; // Flag to disable buttons during animation

  avgWT: number = 0;
  avgTAT: number = 0;
  timeQuantum: number = 2; // For Round Robin

  // --- New properties for calculation logs ---
  waitingTimeCalculations: string[] = [];
  turnaroundTimeCalculations: string[] = [];
  overallCalculations: string[] = [];
  // --- End new properties ---

  addProcess() {
    if (this.animationPlaying) {
      alert('Cannot add processes while simulation is running.');
      return;
    }
    // Input validation for process data
    if (!this.process.id.trim()) {
      alert('Process ID cannot be empty.');
      return;
    }
    if (this.processList.some(p => p.id === this.process.id.trim())) {
      alert(`Process with ID '${this.process.id.trim()}' already exists.`);
      return;
    }
    if (this.process.arrivalTime < 0 || isNaN(this.process.arrivalTime)) {
      alert('Arrival Time must be a non-negative number.');
      return;
    }
    if (this.process.burstTime <= 0 || isNaN(this.process.burstTime)) {
      alert('Burst Time must be a positive number.');
      return;
    }
    // Priority is optional for some algos, but good to validate if provided
    if (this.selectedAlgorithm === 'Priority Scheduling' && (this.process.priority < 0 || isNaN(this.process.priority))) {
        alert('Priority must be a non-negative number for Priority Scheduling.');
        return;
    }

    this.processList.push({ ...this.process });
    this.process = { id: '', arrivalTime: 0, burstTime: 0, priority: 0 }; // Reset for next input
  }

  // Clear all processes and simulation results
  clearAll() {
    if (this.animationPlaying) {
      alert('Cannot clear processes while simulation is running.');
      return;
    }
    this.processList = [];
    this.animatedGanttChart = [];
    this.avgWT = 0;
    this.avgTAT = 0;
    this.waitingTimeCalculations = [];
    this.turnaroundTimeCalculations = [];
    this.overallCalculations = [];
    this.totalTime = 0; // Reset total time
  }

  async runSimulation() {
    if (this.animationPlaying) {
      alert('Simulation is already running.');
      return;
    }
    // Clear previous calculation logs and animation
    this.waitingTimeCalculations = [];
    this.turnaroundTimeCalculations = [];
    this.overallCalculations = [];
    this.animatedGanttChart = [];
    this.totalTime = 0; // Reset total time at start of new simulation
    this.avgWT = 0;
    this.avgTAT = 0;
    this.animationPlaying = true; // Set flag to true

    if (this.processList.length === 0) {
      alert('Please add processes to run the simulation.');
      this.animationPlaying = false;
      return;
    }

    try {
      switch (this.selectedAlgorithm) {
        case 'First Come First Served (FCFS)':
          await this.runFCFSAnimated();
          break;
        case 'Shortest Job First (SJF)':
          await this.runSJFAnimated();
          break;
        case 'Priority Scheduling':
          await this.runPriorityAnimated();
          break;
        case 'Round Robin (RR)':
          // Validate Time Quantum for RR
          if (this.timeQuantum <= 0 || isNaN(this.timeQuantum)) {
              alert('Time Quantum for Round Robin must be a positive number.');
              this.animationPlaying = false;
              return;
          }
          await this.runRRAnimated();
          break;
      }
    } finally {
      this.animationPlaying = false; // Ensure flag is reset even if an error occurs
    }
  }

  // Helper for animation delay
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async runFCFSAnimated() {
    const processes = [...this.processList].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    let totalWT = 0, totalTAT = 0;

    this.overallCalculations.push("--- FCFS Calculation Steps ---");

    for (const p of processes) { // Use for...of for async iteration
      // If CPU is idle until process arrival
      if (currentTime < p.arrivalTime) {
        const idleStart = currentTime;
        const idleEnd = p.arrivalTime;
        this.overallCalculations.push(`CPU idle from ${idleStart} to ${idleEnd}.`);
        this.animatedGanttChart.push({ id: 'Idle', start: idleStart, end: idleEnd }); // Add Idle segment
        this.totalTime = Math.max(this.totalTime, idleEnd); // Update total time
        await this.delay(500); // Short pause for idle
        currentTime = p.arrivalTime;
      }

      const start = currentTime;
      const end = currentTime + p.burstTime;

      this.animatedGanttChart.push({ id: p.id, start, end });
      this.totalTime = Math.max(this.totalTime, end); // Update total time for chart scaling

      this.overallCalculations.push(`P(${p.id}) executes from ${start} to ${end}.`);
      await this.delay(1000); // 1-second delay for each process execution

      // Calculate Waiting Time (WT)
      const wt = start - p.arrivalTime;
      totalWT += wt;
      this.waitingTimeCalculations.push(`WT(${p.id}) = Start Time (${start}) - Arrival Time (${p.arrivalTime}) = ${wt}`);

      // Calculate Turnaround Time (TAT)
      const tat = end - p.arrivalTime;
      totalTAT += tat;
      this.turnaroundTimeCalculations.push(`TAT(${p.id}) = Completion Time (${end}) - Arrival Time (${p.arrivalTime}) = ${tat}`);

      currentTime = end; // Update current time
    }

    this.avgWT = totalWT / processes.length;
    this.avgTAT = totalTAT / processes.length;

    this.overallCalculations.push(`\nTotal Waiting Time: ${totalWT}`);
    this.overallCalculations.push(`Average Waiting Time (Total WT / Num Processes): ${totalWT} / ${processes.length} = ${this.avgWT.toFixed(2)}`);
    this.overallCalculations.push(`\nTotal Turnaround Time: ${totalTAT}`);
    this.overallCalculations.push(`Average Turnaround Time (Total TAT / Num Processes): ${totalTAT} / ${processes.length} = ${this.avgTAT.toFixed(2)}`);
  }

  private async runSJFAnimated() {
    const processes = this.processList.map(p => ({ ...p, remainingBurstTime: p.burstTime }));
    const n = processes.length;
    let currentTime = 0;
    let completedCount = 0;
    let totalWT = 0, totalTAT = 0;

    const completionTime: { [id: string]: number } = {};

    this.overallCalculations.push("--- SJF (Non-Preemptive) Calculation Steps ---");

    while (completedCount < n) {
      const arrivedAndNotCompleted = processes
        .filter(p => p.arrivalTime <= currentTime && p.remainingBurstTime! > 0);

      if (arrivedAndNotCompleted.length === 0) {
        let nextArrivalTime = Infinity;
        processes.forEach(p => {
          if (p.remainingBurstTime! > 0 && p.arrivalTime > currentTime) {
            nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
          }
        });
        if (nextArrivalTime === Infinity) break;
        this.overallCalculations.push(`CPU idle from ${currentTime} to ${nextArrivalTime}.`);
        this.animatedGanttChart.push({ id: 'Idle', start: currentTime, end: nextArrivalTime }); // Add Idle segment
        this.totalTime = Math.max(this.totalTime, nextArrivalTime);
        await this.delay(500); // Short pause for idle
        currentTime = nextArrivalTime;
        continue;
      }

      // Sort by burst time (shortest job first)
      arrivedAndNotCompleted.sort((a, b) => a.remainingBurstTime! - b.remainingBurstTime!);

      const currentProcess = arrivedAndNotCompleted[0];

      const start = currentTime;
      const end = start + currentProcess.remainingBurstTime!;
      currentProcess.remainingBurstTime = 0; // Mark as finished

      this.animatedGanttChart.push({ id: currentProcess.id, start, end });
      this.totalTime = Math.max(this.totalTime, end);
      this.overallCalculations.push(`P(${currentProcess.id}) executes from ${start} to ${end}.`);
      await this.delay(1000); // 1-second delay

      completionTime[currentProcess.id] = end;
      currentTime = end;
      completedCount++;
    }

    // Calculate WT and TAT for each process based on completion times
    processes.forEach(p => {
      const tat = completionTime[p.id] - p.arrivalTime;
      const wt = tat - p.burstTime;

      totalWT += wt;
      totalTAT += tat;

      this.waitingTimeCalculations.push(`WT(${p.id}) = (Completion Time ${completionTime[p.id]}) - (Arrival Time ${p.arrivalTime}) - (Burst Time ${p.burstTime}) = ${wt}`);
      this.turnaroundTimeCalculations.push(`TAT(${p.id}) = (Completion Time ${completionTime[p.id]}) - (Arrival Time ${p.arrivalTime}) = ${tat}`);
    });

    this.avgWT = totalWT / n;
    this.avgTAT = totalTAT / n;

    this.overallCalculations.push(`\nTotal Waiting Time: ${totalWT}`);
    this.overallCalculations.push(`Average Waiting Time (Total WT / Num Processes): ${totalWT} / ${n} = ${this.avgWT.toFixed(2)}`);
    this.overallCalculations.push(`\nTotal Turnaround Time: ${totalTAT}`);
    this.overallCalculations.push(`Average Turnaround Time (Total TAT / Num Processes): ${totalTAT} / ${n} = ${this.avgTAT.toFixed(2)}`);
  }

  private async runPriorityAnimated() {
    const processes = this.processList.map(p => ({ ...p, remainingBurstTime: p.burstTime }));
    const n = processes.length;
    let currentTime = 0;
    let completedCount = 0;
    let totalWT = 0, totalTAT = 0;

    const completionTime: { [id: string]: number } = {};

    this.overallCalculations.push("--- Priority (Non-Preemptive) Calculation Steps ---");

    while (completedCount < n) {
      const arrivedAndNotCompleted = processes
        .filter(p => p.arrivalTime <= currentTime && p.remainingBurstTime! > 0);

      if (arrivedAndNotCompleted.length === 0) {
        let nextArrivalTime = Infinity;
        processes.forEach(p => {
          if (p.remainingBurstTime! > 0 && p.arrivalTime > currentTime) {
            nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
          }
        });
        if (nextArrivalTime === Infinity) break;
        this.overallCalculations.push(`CPU idle from ${currentTime} to ${nextArrivalTime}.`);
        this.animatedGanttChart.push({ id: 'Idle', start: currentTime, end: nextArrivalTime }); // Add Idle segment
        this.totalTime = Math.max(this.totalTime, nextArrivalTime);
        await this.delay(500); // Short pause for idle
        currentTime = nextArrivalTime;
        continue;
      }

      // Sort by priority (lower number = higher priority), then by arrival time for tie-break
      arrivedAndNotCompleted.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.arrivalTime - b.arrivalTime;
      });

      const currentProcess = arrivedAndNotCompleted[0];

      const start = currentTime;
      const end = start + currentProcess.remainingBurstTime!;
      currentProcess.remainingBurstTime = 0; // Mark as finished

      this.animatedGanttChart.push({ id: currentProcess.id, start, end });
      this.totalTime = Math.max(this.totalTime, end);
      this.overallCalculations.push(`P(${currentProcess.id}) executes from ${start} to ${end}.`);
      await this.delay(1000); // 1-second delay

      completionTime[currentProcess.id] = end;
      currentTime = end;
      completedCount++;
    }

    // Calculate WT and TAT for each process based on completion times
    processes.forEach(p => {
      const tat = completionTime[p.id] - p.arrivalTime;
      const wt = tat - p.burstTime;

      totalWT += wt;
      totalTAT += tat;

      this.waitingTimeCalculations.push(`WT(${p.id}) = (Completion Time ${completionTime[p.id]}) - (Arrival Time ${p.arrivalTime}) - (Burst Time ${p.burstTime}) = ${wt}`);
      this.turnaroundTimeCalculations.push(`TAT(${p.id}) = (Completion Time ${completionTime[p.id]}) - (Arrival Time ${p.arrivalTime}) = ${tat}`);
    });

    this.avgWT = totalWT / n;
    this.avgTAT = totalTAT / n;

    this.overallCalculations.push(`\nTotal Waiting Time: ${totalWT}`);
    this.overallCalculations.push(`Average Waiting Time (Total WT / Num Processes): ${totalWT} / ${n} = ${this.avgWT.toFixed(2)}`);
    this.overallCalculations.push(`\nTotal Turnaround Time: ${totalTAT}`);
    this.overallCalculations.push(`Average Turnaround Time (Total TAT / Num Processes): ${totalTAT} / ${n} = ${this.avgTAT.toFixed(2)}`);
  }

  private async runRRAnimated() {
    const processes = this.processList.map(p => ({ ...p, remainingBurstTime: p.burstTime }));
    const n = processes.length;

    const originalBurstTimeMap: { [id: string]: number } = {};
    processes.forEach(p => originalBurstTimeMap[p.id] = p.burstTime);

    const queue: Process[] = [];
    let currentTime = 0;
    let completedCount = 0;
    const completionTime: { [id: string]: number } = {};

    this.overallCalculations.push("--- Round Robin Calculation Steps ---");
    this.overallCalculations.push(`Time Quantum (TQ): ${this.timeQuantum}`);

    const sortedArrivalProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let processIndex = 0;

    // Add initial processes that arrive at time 0
    while (processIndex < n && sortedArrivalProcesses[processIndex].arrivalTime <= currentTime) {
      queue.push(sortedArrivalProcesses[processIndex]);
      this.overallCalculations.push(`Time ${currentTime}: P(${sortedArrivalProcesses[processIndex].id}) arrived. Added to queue.`);
      processIndex++;
    }
    // Small delay after initial queue setup
    if (queue.length > 0) await this.delay(500);


    while (completedCount < n) {
      if (queue.length === 0) {
        let nextArrivalTime = Infinity;
        for (let k = processIndex; k < n; k++) {
          nextArrivalTime = Math.min(nextArrivalTime, sortedArrivalProcesses[k].arrivalTime);
        }
        if (nextArrivalTime === Infinity) break;
        this.overallCalculations.push(`CPU idle from ${currentTime} to ${nextArrivalTime}.`);
        this.animatedGanttChart.push({ id: 'Idle', start: currentTime, end: nextArrivalTime }); // Add Idle segment
        this.totalTime = Math.max(this.totalTime, nextArrivalTime);
        await this.delay(500); // Short pause for idle
        currentTime = nextArrivalTime;

        while (processIndex < n && sortedArrivalProcesses[processIndex].arrivalTime <= currentTime) {
          queue.push(sortedArrivalProcesses[processIndex]);
          this.overallCalculations.push(`Time ${currentTime}: P(${sortedArrivalProcesses[processIndex].id}) arrived. Added to queue.`);
          processIndex++;
        }
        continue;
      }

      const current = queue.shift();
      if (!current) continue;

      const timeSlice = Math.min(this.timeQuantum, current.remainingBurstTime!);
      const start = currentTime;
      const end = start + timeSlice;

      this.animatedGanttChart.push({ id: current.id, start, end });
      this.totalTime = Math.max(this.totalTime, end);
      this.overallCalculations.push(`P(${current.id}) executes from ${start} to ${end}. Remaining Burst: ${current.remainingBurstTime!} - ${timeSlice} = ${current.remainingBurstTime! - timeSlice}`);
      await this.delay(1000); // 1-second delay for each slice

      currentTime = end;
      current.remainingBurstTime! -= timeSlice;

      // Enqueue new arrivals during this time slice
      // Important: Add processes that arrived *during* the execution of the current slice
      // This loop is slightly tricky because processIndex might not cover all future arrivals
      // A more robust way would be to re-check all non-completed processes for arrival
      for (let k = 0; k < n; k++) { // Iterate through all original processes
          const processToCheck = sortedArrivalProcesses[k];
          // Check if it has arrived, is not yet completed, and is not already in the queue
          if (processToCheck.arrivalTime <= currentTime && processToCheck.remainingBurstTime! > 0 && !queue.includes(processToCheck) && processToCheck.id !== current.id) {
              queue.push(processToCheck);
              this.overallCalculations.push(`Time ${currentTime}: P(${processToCheck.id}) arrived. Added to queue.`);
              // No need to increment processIndex here as we are iterating all processes
          }
      }
      // Re-sort queue based on some criteria if necessary for RR (e.g., just FIFO)
      // For standard RR, new arrivals go to the end of the queue.

      if (current.remainingBurstTime! > 0) {
        queue.push(current);
        this.overallCalculations.push(`P(${current.id}) not finished. Re-queued. Remaining Burst: ${current.remainingBurstTime!}`);
      } else {
        completedCount++;
        completionTime[current.id] = currentTime;
        this.overallCalculations.push(`P(${current.id}) completed at Time ${currentTime}.`);
      }
    }

    let totalWT = 0;
    let totalTAT = 0;

    processes.forEach(p => {
      const originalP = this.processList.find(op => op.id === p.id);
      if (!originalP) return;

      const tat = completionTime[p.id] - originalP.arrivalTime;
      const wt = tat - originalP.burstTime;

      totalTAT += tat;
      totalWT += wt;

      this.waitingTimeCalculations.push(`WT(${p.id}) = (Completion Time ${completionTime[p.id]}) - (Arrival Time ${originalP.arrivalTime}) - (Burst Time ${originalP.burstTime}) = ${wt}`);
      this.turnaroundTimeCalculations.push(`TAT(${p.id}) = (Completion Time ${completionTime[p.id]}) - (Arrival Time ${originalP.arrivalTime}) = ${tat}`);
    });

    this.avgWT = totalWT / n;
    this.avgTAT = totalTAT / n;

    this.overallCalculations.push(`\nTotal Waiting Time: ${totalWT}`);
    this.overallCalculations.push(`Average Waiting Time (Total WT / Num Processes): ${totalWT} / ${n} = ${this.avgWT.toFixed(2)}`);
    this.overallCalculations.push(`\nTotal Turnaround Time: ${totalTAT}`);
    this.overallCalculations.push(`Average Turnaround Time (Total TAT / Num Processes): ${totalTAT} / ${n} = ${this.avgTAT.toFixed(2)}`);
  }

  // Helper function for generating time markers for the Gantt chart axis
  getTimeMarkers(): number[] {
    const markers = [];
    if (this.totalTime === 0) return [0]; // Handle empty chart
    // Determine interval for markers based on total time to avoid clutter
    let interval = 1;
    if (this.totalTime > 10) interval = 2;
    if (this.totalTime > 20) interval = 5;
    if (this.totalTime > 50) interval = 10;
    if (this.totalTime > 100) interval = 20;

    for (let i = 0; i <= this.totalTime + interval; i += interval) {
      markers.push(i);
    }
    return markers;
  }

  // Helper function to assign consistent colors to processes
  getProcessColor(id: string): string {
    const colors = [
      '#00BFFF', '#FFD700', '#FF4500', '#32CD32', '#9370DB',
      '#FF69B4', '#1E90FF', '#ADFF2F', '#FFA07A', '#BA55D3',
      '#F0E68C', '#8A2BE2', '#7FFF00', '#D2B48C', '#B0C4DE'
    ];
    if (id === 'Idle') {
      return '#A9A9A9'; // DarkGray for idle time
    }
    // Simple hashing to get a somewhat consistent color based on ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  }
}