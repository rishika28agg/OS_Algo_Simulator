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
  ganttChart: { id: string, start: number, end: number }[] = [];
  avgWT: number = 0;
  avgTAT: number = 0;
  timeQuantum: number = 2; // For Round Robin

  // --- New properties for calculation logs ---
  waitingTimeCalculations: string[] = [];
  turnaroundTimeCalculations: string[] = [];
  overallCalculations: string[] = [];
  // --- End new properties ---

  addProcess() {
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

  runSimulation() {
    // Clear previous calculation logs
    this.waitingTimeCalculations = [];
    this.turnaroundTimeCalculations = [];
    this.overallCalculations = [];

    if (this.processList.length === 0) {
      alert('Please add processes to run the simulation.');
      return;
    }

    switch (this.selectedAlgorithm) {
      case 'First Come First Served (FCFS)':
        this.runFCFS();
        break;
      case 'Shortest Job First (SJF)':
        this.runSJF();
        break;
      case 'Priority Scheduling':
        this.runPriority();
        break;
      case 'Round Robin (RR)':
        // Validate Time Quantum for RR
        if (this.timeQuantum <= 0 || isNaN(this.timeQuantum)) {
            alert('Time Quantum for Round Robin must be a positive number.');
            return;
        }
        this.runRR();
        break;
    }
  }

  private runFCFS() {
    // Create a deep copy and sort by arrival time
    const processes = [...this.processList].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    let totalWT = 0, totalTAT = 0;
    this.ganttChart = [];

    this.overallCalculations.push("--- FCFS Calculation Steps ---");

    processes.forEach(p => {
      // If CPU is idle until process arrival
      if (currentTime < p.arrivalTime) {
        this.overallCalculations.push(`CPU idle from ${currentTime} to ${p.arrivalTime}`);
        currentTime = p.arrivalTime;
      }

      const start = currentTime;
      const end = currentTime + p.burstTime;
      this.ganttChart.push({ id: p.id, start, end });

      // Calculate Waiting Time (WT)
      const wt = start - p.arrivalTime;
      totalWT += wt;
      this.waitingTimeCalculations.push(`WT(${p.id}) = Start Time (${start}) - Arrival Time (${p.arrivalTime}) = ${wt}`);

      // Calculate Turnaround Time (TAT)
      const tat = end - p.arrivalTime;
      totalTAT += tat;
      this.turnaroundTimeCalculations.push(`TAT(${p.id}) = Completion Time (${end}) - Arrival Time (${p.arrivalTime}) = ${tat}`);

      currentTime = end; // Update current time
    });

    this.avgWT = totalWT / processes.length;
    this.avgTAT = totalTAT / processes.length;

    this.overallCalculations.push(`\nTotal Waiting Time: ${totalWT}`);
    this.overallCalculations.push(`Average Waiting Time (Total WT / Num Processes): ${totalWT} / ${processes.length} = ${this.avgWT.toFixed(2)}`);
    this.overallCalculations.push(`\nTotal Turnaround Time: ${totalTAT}`);
    this.overallCalculations.push(`Average Turnaround Time (Total TAT / Num Processes): ${totalTAT} / ${processes.length} = ${this.avgTAT.toFixed(2)}`);
  }

  private runSJF() {
    // Create a deep copy for modification and track remaining burst time
    const processes = this.processList.map(p => ({ ...p, remainingBurstTime: p.burstTime }));
    const n = processes.length;
    let currentTime = 0;
    let completedCount = 0; // Renamed to avoid confusion with `completed` object
    let totalWT = 0, totalTAT = 0;
    this.ganttChart = [];

    // Store completion time for each process to calculate TAT/WT
    const completionTime: { [id: string]: number } = {};
    const hasArrived: { [id: string]: boolean } = {}; // To prevent re-adding processes if they haven't arrived yet
    const processedSegments: { id: string, start: number, end: number }[] = []; // To build simplified Gantt chart

    this.overallCalculations.push("--- SJF (Non-Preemptive) Calculation Steps ---");

    while (completedCount < n) {
      // Filter for processes that have arrived and are not yet completed
      const arrivedAndNotCompleted = processes
        .filter(p => p.arrivalTime <= currentTime && p.remainingBurstTime! > 0); // Use `!` for non-null assertion

      if (arrivedAndNotCompleted.length === 0) {
        // If no processes available, increment time until next arrival or all completed
        let nextArrivalTime = Infinity;
        processes.forEach(p => {
          if (p.remainingBurstTime! > 0 && p.arrivalTime > currentTime) {
            nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
          }
        });
        if (nextArrivalTime === Infinity) break; // All processes completed or no more will arrive
        this.overallCalculations.push(`CPU idle from ${currentTime} to ${nextArrivalTime}`);
        currentTime = nextArrivalTime;
        continue;
      }

      // Sort by burst time (shortest job first)
      arrivedAndNotCompleted.sort((a, b) => a.remainingBurstTime! - b.remainingBurstTime!);

      const currentProcess = arrivedAndNotCompleted[0];

      const start = currentTime;
      const end = currentTime + currentProcess.remainingBurstTime!; // Execute fully
      currentProcess.remainingBurstTime = 0; // Mark as finished

      // Add segment to gantt chart
      processedSegments.push({ id: currentProcess.id, start, end });

      completionTime[currentProcess.id] = end;
      currentTime = end;
      completedCount++;

      this.overallCalculations.push(`P(${currentProcess.id}) executes from ${start} to ${end}.`);
    }

    // Build consolidated Gantt Chart after simulation
    if (processedSegments.length > 0) {
        let lastId = processedSegments[0].id;
        let lastStart = processedSegments[0].start;
        let lastEnd = processedSegments[0].end;

        for (let k = 1; k < processedSegments.length; k++) {
            const currentSegment = processedSegments[k];
            if (currentSegment.id === lastId) {
                // Consolidate if same process runs consecutively
                lastEnd = currentSegment.end;
            } else {
                this.ganttChart.push({ id: lastId, start: lastStart, end: lastEnd });
                lastId = currentSegment.id;
                lastStart = currentSegment.start;
                lastEnd = currentSegment.end;
            }
        }
        this.ganttChart.push({ id: lastId, start: lastStart, end: lastEnd });
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

  private runPriority() {
    // Create a deep copy for modification and track remaining burst time
    const processes = this.processList.map(p => ({ ...p, remainingBurstTime: p.burstTime }));
    const n = processes.length;
    let currentTime = 0;
    let completedCount = 0;
    let totalWT = 0, totalTAT = 0;
    this.ganttChart = [];

    const completionTime: { [id: string]: number } = {};
    const processedSegments: { id: string, start: number, end: number }[] = [];

    this.overallCalculations.push("--- Priority (Non-Preemptive) Calculation Steps ---");

    while (completedCount < n) {
      // Filter for processes that have arrived and are not yet completed
      const arrivedAndNotCompleted = processes
        .filter(p => p.arrivalTime <= currentTime && p.remainingBurstTime! > 0);

      if (arrivedAndNotCompleted.length === 0) {
        // If no processes available, increment time until next arrival or all completed
        let nextArrivalTime = Infinity;
        processes.forEach(p => {
          if (p.remainingBurstTime! > 0 && p.arrivalTime > currentTime) {
            nextArrivalTime = Math.min(nextArrivalTime, p.arrivalTime);
          }
        });
        if (nextArrivalTime === Infinity) break;
        this.overallCalculations.push(`CPU idle from ${currentTime} to ${nextArrivalTime}`);
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
      const end = start + currentProcess.remainingBurstTime!; // Execute fully
      currentProcess.remainingBurstTime = 0; // Mark as finished

      // Add segment to gantt chart
      processedSegments.push({ id: currentProcess.id, start, end });

      completionTime[currentProcess.id] = end;
      currentTime = end;
      completedCount++;

      this.overallCalculations.push(`P(${currentProcess.id}) executes from ${start} to ${end}.`);
    }

    // Build consolidated Gantt Chart after simulation
    if (processedSegments.length > 0) {
        let lastId = processedSegments[0].id;
        let lastStart = processedSegments[0].start;
        let lastEnd = processedSegments[0].end;

        for (let k = 1; k < processedSegments.length; k++) {
            const currentSegment = processedSegments[k];
            if (currentSegment.id === lastId) {
                lastEnd = currentSegment.end;
            } else {
                this.ganttChart.push({ id: lastId, start: lastStart, end: lastEnd });
                lastId = currentSegment.id;
                lastStart = currentSegment.start;
                lastEnd = currentSegment.end;
            }
        }
        this.ganttChart.push({ id: lastId, start: lastStart, end: lastEnd });
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

  private runRR() {
    // Deep copy processes and initialize remainingBurstTime
    const processes = this.processList.map(p => ({ ...p, remainingBurstTime: p.burstTime }));
    const n = processes.length;

    // Track the actual arrival time as original burst time might be needed for WT/TAT later
    const originalBurstTimeMap: { [id: string]: number } = {};
    processes.forEach(p => originalBurstTimeMap[p.id] = p.burstTime);

    const queue: Process[] = []; // Ready queue
    let currentTime = 0;
    let completedCount = 0;
    this.ganttChart = []; // Raw segments for Gantt chart
    const completionTime: { [id: string]: number } = {}; // To store the final completion time of each process

    this.overallCalculations.push("--- Round Robin Calculation Steps ---");
    this.overallCalculations.push(`Time Quantum (TQ): ${this.timeQuantum}`);

    // Sort processes by arrival time for initial enqueueing
    const sortedArrivalProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let processIndex = 0; // Index for processes that haven't arrived yet

    // Add initial processes that arrive at time 0
    while (processIndex < n && sortedArrivalProcesses[processIndex].arrivalTime <= currentTime) {
        queue.push(sortedArrivalProcesses[processIndex]);
        this.overallCalculations.push(`Time ${currentTime}: P(${sortedArrivalProcesses[processIndex].id}) arrived. Added to queue.`);
        processIndex++;
    }

    while (completedCount < n) {
        if (queue.length === 0) {
            // CPU is idle, advance time to the next process arrival
            let nextArrivalTime = Infinity;
            for (let k = processIndex; k < n; k++) {
                nextArrivalTime = Math.min(nextArrivalTime, sortedArrivalProcesses[k].arrivalTime);
            }
            if (nextArrivalTime === Infinity) break; // All processes completed or no more to arrive
            this.overallCalculations.push(`CPU idle from ${currentTime} to ${nextArrivalTime}.`);
            currentTime = nextArrivalTime;

            // Enqueue processes that arrive at the new current time
            while (processIndex < n && sortedArrivalProcesses[processIndex].arrivalTime <= currentTime) {
                queue.push(sortedArrivalProcesses[processIndex]);
                this.overallCalculations.push(`Time ${currentTime}: P(${sortedArrivalProcesses[processIndex].id}) arrived. Added to queue.`);
                processIndex++;
            }
            continue; // Go to next iteration to pick from queue
        }

        const current = queue.shift(); // Get process from front of queue
        if (!current) continue; // Should not happen if queue.length > 0

        const timeSlice = Math.min(this.timeQuantum, current.remainingBurstTime!);
        const start = currentTime;
        const end = start + timeSlice;

        this.ganttChart.push({ id: current.id, start, end });
        this.overallCalculations.push(`P(${current.id}) executes from ${start} to ${end}. Remaining Burst: ${current.remainingBurstTime!} - ${timeSlice} = ${current.remainingBurstTime! - timeSlice}`);

        currentTime = end;
        current.remainingBurstTime! -= timeSlice;

        // Enqueue new arrivals during this time slice
        while (processIndex < n && sortedArrivalProcesses[processIndex].arrivalTime <= currentTime) {
            queue.push(sortedArrivalProcesses[processIndex]);
            this.overallCalculations.push(`Time ${currentTime}: P(${sortedArrivalProcesses[processIndex].id}) arrived. Added to queue.`);
            processIndex++;
        }

        // If process not finished, re-enqueue
        if (current.remainingBurstTime! > 0) {
            queue.push(current);
            this.overallCalculations.push(`P(${current.id}) not finished. Re-queued. Remaining Burst: ${current.remainingBurstTime!}`);
        } else {
            // Process completed
            completedCount++;
            completionTime[current.id] = currentTime;
            this.overallCalculations.push(`P(${current.id}) completed at Time ${currentTime}.`);
        }
    }

    // Calculate WT and TAT for each process after simulation
    let totalWT = 0;
    let totalTAT = 0;

    processes.forEach(p => {
      const originalP = this.processList.find(op => op.id === p.id); // Get original burst time
      if (!originalP) return; // Should not happen

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
}
