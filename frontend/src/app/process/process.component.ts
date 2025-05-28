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
  remainingBurstTime?: number;
}

interface AlgorithmDetail {
  name: string;
  type: string;
  description: string;
  pros: string[];
  cons: string[];
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

  animatedGanttChart: { id: string, start: number, end: number }[] = [];
  totalTime: number = 0;
  animationPlaying: boolean = false;

  avgWT: number = 0;
  avgTAT: number = 0;
  timeQuantum: number = 2;

  waitingTimeCalculations: string[] = [];
  turnaroundTimeCalculations: string[] = [];
  overallCalculations: string[] = [];
  
  showComparisonTable: boolean = false;
  algorithmDetails: AlgorithmDetail[] = [
    {
      name: 'First Come First Served (FCFS)',
      type: 'Non-Preemptive',
      description: 'Processes are executed in the order they arrive in the ready queue. It is the simplest scheduling algorithm.',
      pros: [
        'Simple to understand and implement.',
        'Fair in the sense that processes are served in the order they arrive.'
      ],
      cons: [
        'High average waiting time.',
        'Susceptible to the "Convoy Effect", where a long process can make shorter processes wait for a long time.'
      ]
    },
    {
      name: 'Shortest Job First (SJF)',
      type: 'Non-Preemptive (as implemented)',
      description: 'The process with the smallest burst time is selected next. This implementation is non-preemptive.',
      pros: [
        'Provably optimal in minimizing the average waiting time for a given set of processes.'
      ],
      cons: [
        'Requires knowing the burst time in advance, which is often not possible.',
        'Can lead to starvation for processes with long burst times.'
      ]
    },
    {
      name: 'Priority Scheduling',
      type: 'Non-Preemptive (as implemented)',
      description: 'A priority is associated with each process, and the CPU is allocated to the process with the highest priority (lowest number).',
      pros: [
        'Allows for the execution of critical processes first.'
      ],
      cons: [
        'Can lead to starvation of low-priority processes.',
        'Can be complex to determine appropriate priority levels.'
      ]
    },
    {
      name: 'Round Robin (RR)',
      type: 'Preemptive',
      description: 'Each process is assigned a fixed time slice (time quantum). The CPU executes a process for that quantum, then moves it to the back of the queue.',
      pros: [
        'Fair, as every process gets an equal share of CPU time.',
        'Prevents starvation, as no process waits for too long.'
      ],
      cons: [
        'Performance depends heavily on the size of the time quantum.',
        'High context switching overhead if the time quantum is too small.'
      ]
    }
  ];

  toggleComparisonTable() {
    this.showComparisonTable = !this.showComparisonTable;
  }

  addProcess() {
    if (this.animationPlaying) {
      alert('Cannot add processes while simulation is running.');
      return;
    }
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
    if (this.selectedAlgorithm === 'Priority Scheduling' && (this.process.priority < 0 || isNaN(this.process.priority))) {
        alert('Priority must be a non-negative number for Priority Scheduling.');
        return;
    }

    this.processList.push({ ...this.process });
    this.process = { id: '', arrivalTime: 0, burstTime: 0, priority: 0 };
  }

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
    this.totalTime = 0;
  }

  async runSimulation() {
    if (this.animationPlaying) {
      alert('Simulation is already running.');
      return;
    }
    this.waitingTimeCalculations = [];
    this.turnaroundTimeCalculations = [];
    this.overallCalculations = [];
    this.animatedGanttChart = [];
    this.totalTime = 0;
    this.avgWT = 0;
    this.avgTAT = 0;
    this.animationPlaying = true;

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
          if (this.timeQuantum <= 0 || isNaN(this.timeQuantum)) {
              alert('Time Quantum for Round Robin must be a positive number.');
              this.animationPlaying = false;
              return;
          }
          await this.runRRAnimated();
          break;
      }
    } finally {
      this.animationPlaying = false;
    }
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async runFCFSAnimated() {
    const processes = [...this.processList].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    let totalWT = 0, totalTAT = 0;

    this.overallCalculations.push("--- FCFS Calculation Steps ---");

    for (const p of processes) {
      if (currentTime < p.arrivalTime) {
        const idleStart = currentTime;
        const idleEnd = p.arrivalTime;
        this.overallCalculations.push(`CPU idle from ${idleStart} to ${idleEnd}.`);
        this.animatedGanttChart.push({ id: 'Idle', start: idleStart, end: idleEnd });
        this.totalTime = Math.max(this.totalTime, idleEnd);
        await this.delay(500);
        currentTime = p.arrivalTime;
      }

      const start = currentTime;
      const end = currentTime + p.burstTime;

      this.animatedGanttChart.push({ id: p.id, start, end });
      this.totalTime = Math.max(this.totalTime, end);

      this.overallCalculations.push(`P(${p.id}) executes from ${start} to ${end}.`);
      await this.delay(1000);

      // --- MODIFIED CALCULATION LOGIC ---
      // Calculate Turnaround Time (TAT) first
      const tat = end - p.arrivalTime;
      totalTAT += tat;
      this.turnaroundTimeCalculations.push(`TAT(${p.id}) = Completion Time (${end}) - Arrival Time (${p.arrivalTime}) = ${tat}`);

      // Then, calculate Waiting Time (WT) from TAT
      const wt = tat - p.burstTime;
      totalWT += wt;
      this.waitingTimeCalculations.push(`WT(${p.id}) = Turnaround Time (${tat}) - Burst Time (${p.burstTime}) = ${wt}`);
      // --- END OF MODIFICATION ---

      currentTime = end;
    }

    this.avgWT = processes.length > 0 ? totalWT / processes.length : 0;
    this.avgTAT = processes.length > 0 ? totalTAT / processes.length : 0;

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
        this.animatedGanttChart.push({ id: 'Idle', start: currentTime, end: nextArrivalTime });
        this.totalTime = Math.max(this.totalTime, nextArrivalTime);
        await this.delay(500);
        currentTime = nextArrivalTime;
        continue;
      }

      arrivedAndNotCompleted.sort((a, b) => a.remainingBurstTime! - b.remainingBurstTime!);
      const currentProcess = arrivedAndNotCompleted[0];

      const start = currentTime;
      const end = start + currentProcess.remainingBurstTime!;
      currentProcess.remainingBurstTime = 0;

      this.animatedGanttChart.push({ id: currentProcess.id, start, end });
      this.totalTime = Math.max(this.totalTime, end);
      this.overallCalculations.push(`P(${currentProcess.id}) executes from ${start} to ${end}.`);
      await this.delay(1000);

      completionTime[currentProcess.id] = end;
      currentTime = end;
      completedCount++;
    }

    // --- MODIFIED CALCULATION LOGIC ---
    processes.forEach(p => {
      const tat = completionTime[p.id] - p.arrivalTime;
      const wt = tat - p.burstTime;
      
      totalWT += wt;
      totalTAT += tat;

      this.turnaroundTimeCalculations.push(`TAT(${p.id}) = Completion Time (${completionTime[p.id]}) - Arrival Time (${p.arrivalTime}) = ${tat}`);
      this.waitingTimeCalculations.push(`WT(${p.id}) = Turnaround Time (${tat}) - Burst Time (${p.burstTime}) = ${wt}`);
    });
    // --- END OF MODIFICATION ---

    this.avgWT = n > 0 ? totalWT / n : 0;
    this.avgTAT = n > 0 ? totalTAT / n : 0;

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
        this.animatedGanttChart.push({ id: 'Idle', start: currentTime, end: nextArrivalTime });
        this.totalTime = Math.max(this.totalTime, nextArrivalTime);
        await this.delay(500);
        currentTime = nextArrivalTime;
        continue;
      }

      arrivedAndNotCompleted.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.arrivalTime - b.arrivalTime;
      });

      const currentProcess = arrivedAndNotCompleted[0];
      const start = currentTime;
      const end = start + currentProcess.remainingBurstTime!;
      currentProcess.remainingBurstTime = 0;

      this.animatedGanttChart.push({ id: currentProcess.id, start, end });
      this.totalTime = Math.max(this.totalTime, end);
      this.overallCalculations.push(`P(${currentProcess.id}) executes from ${start} to ${end}.`);
      await this.delay(1000);

      completionTime[currentProcess.id] = end;
      currentTime = end;
      completedCount++;
    }

    // --- MODIFIED CALCULATION LOGIC ---
    processes.forEach(p => {
      const tat = completionTime[p.id] - p.arrivalTime;
      const wt = tat - p.burstTime;

      totalWT += wt;
      totalTAT += tat;

      this.turnaroundTimeCalculations.push(`TAT(${p.id}) = Completion Time (${completionTime[p.id]}) - Arrival Time (${p.arrivalTime}) = ${tat}`);
      this.waitingTimeCalculations.push(`WT(${p.id}) = Turnaround Time (${tat}) - Burst Time (${p.burstTime}) = ${wt}`);
    });
    // --- END OF MODIFICATION ---

    this.avgWT = n > 0 ? totalWT / n : 0;
    this.avgTAT = n > 0 ? totalTAT / n : 0;

    this.overallCalculations.push(`\nTotal Waiting Time: ${totalWT}`);
    this.overallCalculations.push(`Average Waiting Time (Total WT / Num Processes): ${totalWT} / ${n} = ${this.avgWT.toFixed(2)}`);
    this.overallCalculations.push(`\nTotal Turnaround Time: ${totalTAT}`);
    this.overallCalculations.push(`Average Turnaround Time (Total TAT / Num Processes): ${totalTAT} / ${n} = ${this.avgTAT.toFixed(2)}`);
  }

  private async runRRAnimated() {
    const processes = this.processList.map(p => ({ ...p, remainingBurstTime: p.burstTime }));
    const n = processes.length;
    const queue: Process[] = [];
    let currentTime = 0;
    let completedCount = 0;
    const completionTime: { [id: string]: number } = {};

    this.overallCalculations.push("--- Round Robin Calculation Steps ---");
    this.overallCalculations.push(`Time Quantum (TQ): ${this.timeQuantum}`);

    const sortedArrivalProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let processIndex = 0;

    while (completedCount < n) {
      while (processIndex < n && sortedArrivalProcesses[processIndex].arrivalTime <= currentTime) {
        queue.push(sortedArrivalProcesses[processIndex]);
        this.overallCalculations.push(`Time ${currentTime}: P(${sortedArrivalProcesses[processIndex].id}) arrived. Added to queue.`);
        processIndex++;
      }
      
      if (queue.length === 0) {
          if (processIndex < n) {
              const nextArrivalTime = sortedArrivalProcesses[processIndex].arrivalTime;
              this.overallCalculations.push(`CPU idle from ${currentTime} to ${nextArrivalTime}.`);
              this.animatedGanttChart.push({ id: 'Idle', start: currentTime, end: nextArrivalTime });
              this.totalTime = Math.max(this.totalTime, nextArrivalTime);
              await this.delay(500);
              currentTime = nextArrivalTime;
              continue;
          } else {
              break;
          }
      }

      const current = queue.shift();
      if (!current) continue;

      const timeSlice = Math.min(this.timeQuantum, current.remainingBurstTime!);
      const start = currentTime;
      const end = start + timeSlice;

      this.animatedGanttChart.push({ id: current.id, start, end });
      this.totalTime = Math.max(this.totalTime, end);
      this.overallCalculations.push(`P(${current.id}) executes from ${start} to ${end}. Remaining Burst: ${current.remainingBurstTime!} - ${timeSlice} = ${current.remainingBurstTime! - timeSlice}`);
      await this.delay(1000);

      currentTime = end;
      current.remainingBurstTime! -= timeSlice;

      while (processIndex < n && sortedArrivalProcesses[processIndex].arrivalTime <= currentTime) {
        queue.push(sortedArrivalProcesses[processIndex]);
        this.overallCalculations.push(`Time ${currentTime}: P(${sortedArrivalProcesses[processIndex].id}) arrived. Added to queue.`);
        processIndex++;
      }

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

    // --- MODIFIED CALCULATION LOGIC ---
    processes.forEach(p => {
      const originalP = this.processList.find(op => op.id === p.id);
      if (!originalP) return;

      const tat = completionTime[p.id] - originalP.arrivalTime;
      const wt = tat - originalP.burstTime;

      totalTAT += tat;
      totalWT += wt;
      
      this.turnaroundTimeCalculations.push(`TAT(${p.id}) = Completion Time (${completionTime[p.id]}) - Arrival Time (${originalP.arrivalTime}) = ${tat}`);
      this.waitingTimeCalculations.push(`WT(${p.id}) = Turnaround Time (${tat}) - Burst Time (${originalP.burstTime}) = ${wt}`);
    });
    // --- END OF MODIFICATION ---

    this.avgWT = n > 0 ? totalWT / n : 0;
    this.avgTAT = n > 0 ? totalTAT / n : 0;

    this.overallCalculations.push(`\nTotal Waiting Time: ${totalWT}`);
    this.overallCalculations.push(`Average Waiting Time (Total WT / Num Processes): ${totalWT} / ${n} = ${this.avgWT.toFixed(2)}`);
    this.overallCalculations.push(`\nTotal Turnaround Time: ${totalTAT}`);
    this.overallCalculations.push(`Average Turnaround Time (Total TAT / Num Processes): ${totalTAT} / ${n} = ${this.avgTAT.toFixed(2)}`);
  }
  
  getTimeMarkers(): number[] {
    const markers: number[] = [];
    if (this.totalTime === 0) return [0]; 
    
    let interval = 1;
    if (this.totalTime > 10) interval = 2;
    if (this.totalTime > 20) interval = 5;
    if (this.totalTime > 50) interval = 10;
    if (this.totalTime > 100) interval = 20;

    for (let i = 0; i <= this.totalTime; i += interval) {
        if (!markers.includes(i)) {
          markers.push(i);
        }
    }
    
    const lastTime = Math.ceil(this.totalTime);
    if (!markers.includes(lastTime)) {
        markers.push(lastTime);
    }

    return markers.sort((a,b) => a - b);
  }

  getProcessColor(id: string): string {
    const colors = [
      '#00BFFF', '#FFD700', '#FF4500', '#32CD32', '#9370DB',
      '#FF69B4', '#1E90FF', '#ADFF2F', '#FFA07A', '#BA55D3',
      '#F0E68C', '#8A2BE2', '#7FFF00', '#D2B48C', '#B0C4DE'
    ];
    if (id === 'Idle') {
      return '#A9A9A9';
    }
    
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  }
}