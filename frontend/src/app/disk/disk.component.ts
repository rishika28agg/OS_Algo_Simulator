import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-disk',
  standalone: true,
  templateUrl: './disk.component.html',
  imports: [CommonModule, FormsModule, NgChartsModule],
})
export class DiskComponent {
  algorithm: 'FCFS' | 'SSTF' | 'SCAN' | 'C-SCAN' = 'FCFS';
  head = 0;
  requests = '';
  diskSize = 200;
  direction: 'left' | 'right' = 'right';

  result: number[] = [];
  seekTime = 0;
  detailedSteps: string[] = [];
  errorMessage = '';

  chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Head Movement',
        fill: false,
        tension: 0.25,
        borderColor: '#2563eb',
        pointBackgroundColor: '#2563eb',
      },
    ],
  };
  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: {
      x: { title: { display: true, text: 'Step' } },
      y: { title: { display: true, text: 'Cylinder' } },
    },
  };

  runSimulation(): void {
    /* reset */
    this.errorMessage = '';
    this.result = [];
    this.seekTime = 0;
    this.detailedSteps = [];


    const req = this.requests
      .trim()
      .split(/\s+/)
      .map(n => parseInt(n, 10))
      .filter(n => !isNaN(n));

    if (!req.length) { this.errorMessage = 'Enter at least one valid request.'; return; }
    if (isNaN(this.head)) { this.errorMessage = 'Head position must be a number.'; return; }

    /* run selected algorithm */
    switch (this.algorithm) {
      case 'FCFS':   this.fcfs(req);   break;
      case 'SSTF':   this.sstf(req);   break;
      case 'SCAN':   this.scan(req);   break;
      case 'C-SCAN': this.cscan(req);  break;
    }

    /* refresh chart */
    this.chartData.labels = this.result.map((_, i) => i.toString());
    this.chartData.datasets[0].data = [...this.result];
  }

  /* ───── algorithms ───── */
  private fcfs(requests: number[]): void {
    let cur = this.head, total = 0, seq: number[] = [];
    for (const r of requests) {
      const diff = Math.abs(cur - r);
      this.detailedSteps.push(`Move ${cur} → ${r}  (seek ${diff})`);
      total += diff;
      seq.push(r);
      cur = r;
    }
    this.result = [this.head, ...seq];
    this.seekTime = total;
  }

  private sstf(requests: number[]): void {
    const pending = [...requests];
    let cur = this.head, total = 0, seq: number[] = [];
    while (pending.length) {
      let best = 0, bestDist = Math.abs(pending[0] - cur);
      for (let i = 1; i < pending.length; i++) {
        const d = Math.abs(pending[i] - cur);
        if (d < bestDist) { best = i; bestDist = d; }
      }
      const next = pending.splice(best, 1)[0];
      this.detailedSteps.push(`Move ${cur} → ${next}  (seek ${bestDist})`);
      total += bestDist;
      seq.push(next);
      cur = next;
    }
    this.result = [this.head, ...seq];
    this.seekTime = total;
  }

  private scan(requests: number[]): void {
    const sorted = [...requests, this.head].sort((a, b) => a - b);
    const idx = sorted.indexOf(this.head);
    const seq: number[] = [];

    if (this.direction === 'left') {
      for (let i = idx; i >= 0; i--) seq.push(sorted[i]);
      for (let i = idx + 1; i < sorted.length; i++) seq.push(sorted[i]);
    } else {
      for (let i = idx; i < sorted.length; i++) seq.push(sorted[i]);
      for (let i = idx - 1; i >= 0; i--) seq.push(sorted[i]);
    }

    this.populateStepsFromSequence(seq);
  }

  private cscan(requests: number[]): void {
    const sorted = [...requests, this.head].sort((a, b) => a - b);
    const idx = sorted.indexOf(this.head);
    const seq: number[] = [];

    for (let i = idx; i < sorted.length; i++) seq.push(sorted[i]);
    if (idx > 0) {
      seq.push(this.diskSize - 1, 0);
      for (let i = 0; i < idx; i++) seq.push(sorted[i]);
    }
    this.populateStepsFromSequence(seq);
  }


  private populateStepsFromSequence(seq: number[]): void {
    this.result = seq;
    let total = 0;
    for (let i = 1; i < seq.length; i++) {
      const diff = Math.abs(seq[i] - seq[i - 1]);
      total += diff;
      this.detailedSteps.push(`Move ${seq[i - 1]} → ${seq[i]}  (seek ${diff})`);
    }
    this.seekTime = total;
  }
}
