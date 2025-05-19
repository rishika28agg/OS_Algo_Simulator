import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.css']
})
export class FileComponent {
  selectedAlgo = '';
  totalMemoryInput = '';
  blockSizeInput = '';
  processName = '';
  processSizeInput = '';
  pageInput = '';
  framesInput = '';
  resultLog: any[] = [];
  memoryBlocks: string[] = []; // Declare and initialize memoryBlocks as an array of strings

  selectAlgorithm() {
    console.log('Selected Algorithm:', this.selectedAlgo);
  }

  allocateMemory() {
    const totalMemory = Number(this.totalMemoryInput);
    const blockSize = Number(this.blockSizeInput);
    const processSize = Number(this.processSizeInput);
    console.log(`Allocating memory for process "${this.processName}"`);
    console.log({ totalMemory, blockSize, processSize });

    // Here you would implement the logic to populate the memoryBlocks array
    // based on totalMemory, blockSize, and the allocated process.
    // For now, let's just log the values.
  }

  simulatePageReplacement() {
    const pages = this.pageInput.trim().split(' ').map(Number);
    const frames = Number(this.framesInput);
    console.log(`Simulating ${this.selectedAlgo} with pages:`, pages, 'and frames:', frames);
  }
}
