import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBook, faQuestionCircle, faCheckCircle, faTimesCircle, faRedo } from '@fortawesome/free-solid-svg-icons';
import { Nl2brPipe } from '../../shared/pipes/nl2br.pipe';

interface ProcessInfo {
  requested: number;
  allocated: number;
  internal: number;
  color: string;
  startBlock: number;
  status: 'allocated' | 'failed';
  failureReason?: 'external_fragmentation' | 'insufficient_memory' | 'deallocated';
  timestamp: Date;
}

interface MemoryBlock {
  id: number;
  size: number;
  process: string;
  isFree: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  type: 'concept' | 'allocation' | 'fragmentation';
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizResult {
  question: string;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
}

@Component({
  selector: 'app-contiguous',
  templateUrl: './contiguous.component.html',
  styleUrls: ['./contiguous.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, Nl2brPipe]
})
export class ContiguousComponent implements OnInit {
  totalMemory = 0;
  memory: MemoryBlock[] = [];
  processInfo: { [key: string]: ProcessInfo } = {};
  fitType: 'first' | 'best' | 'worst' = 'first';
  newProcess = { name: '', size: 0 };
  message = '';
  messageType: 'info' | 'error' | 'success' = 'info';
  isInitialized = false;
  processColors = [
    '#4299E1', '#48BB78', '#ED8936', '#F56565', '#9F7AEA',
    '#4FD1C5', '#F6AD55', '#FC8181', '#63B3ED', '#68D391'
  ];
  currentColorIndex = 0;
  newBlockSize = 0;

  // Educational Features
  showTheoryPanel = false;
  isQuizMode = false;
  currentQuizQuestion?: QuizQuestion;
  quizAnswer?: number;
  showQuizExplanation = false;
  quizScore = 0;
  totalQuizQuestions = 0;
  currentQuizQuestions: QuizQuestion[] = [];
  quizResults: QuizResult[] = [];
  showQuizResults = false;
  readonly QUESTIONS_PER_QUIZ = 3;
  currentQuestionIndex = 0;

  // Icons
  icons = {
    faBook,
    faQuestionCircle,
    faCheckCircle,
    faTimesCircle,
    faRedo
  };

  // Quiz Questions
  readonly quizQuestions: QuizQuestion[] = [
    // Concept Questions
    {
      type: 'concept',
      difficulty: 'easy',
      question: 'What is contiguous memory allocation?',
      options: [
        'A method where memory is allocated in non-contiguous blocks',
        'A method where memory is allocated in continuous blocks',
        'A method that uses virtual memory',
        'A method that uses paging'
      ],
      correctAnswer: 1,
      explanation: 'Contiguous memory allocation is a memory management technique where each process is allocated a continuous block of memory.'
    },
    {
      type: 'concept',
      difficulty: 'medium',
      question: 'What is the main advantage of contiguous memory allocation?',
      options: [
        'Easy memory management',
        'No external fragmentation',
        'Simple address translation',
        'Dynamic memory allocation'
      ],
      correctAnswer: 2,
      explanation: 'Contiguous allocation provides simple address translation since the process is stored in a continuous block of memory.'
    },
    // Allocation Questions
    {
      type: 'allocation',
      difficulty: 'medium',
      question: 'Which allocation strategy is best for minimizing external fragmentation?',
      options: [
        'First Fit',
        'Best Fit',
        'Worst Fit',
        'None of the above'
      ],
      correctAnswer: 1,
      explanation: 'Best Fit strategy tries to find the smallest free block that can accommodate the process, which helps minimize external fragmentation.'
    },
    {
      type: 'allocation',
      difficulty: 'hard',
      question: 'What happens when a process requests memory in contiguous allocation?',
      options: [
        'Memory is always allocated regardless of size',
        'Memory is allocated only if a single block of sufficient size is available',
        'Memory can be allocated across multiple blocks',
        'Memory is allocated using virtual addresses'
      ],
      correctAnswer: 1,
      explanation: 'In contiguous allocation, a process can only be allocated if there is a single continuous block of memory large enough to hold it.'
    },
    // Fragmentation Questions
    {
      type: 'fragmentation',
      difficulty: 'easy',
      question: 'What is external fragmentation?',
      options: [
        'Unused memory within allocated blocks',
        'Free memory that is too fragmented to be used',
        'Memory lost due to system overhead',
        'Memory used by the operating system'
      ],
      correctAnswer: 1,
      explanation: 'External fragmentation occurs when free memory is available but is divided into small, non-contiguous blocks that cannot be used for allocation.'
    },
    {
      type: 'fragmentation',
      difficulty: 'hard',
      question: 'How can external fragmentation be reduced?',
      options: [
        'By using smaller block sizes',
        'By using larger block sizes',
        'By compacting memory periodically',
        'By using virtual memory'
      ],
      correctAnswer: 2,
      explanation: 'Memory compaction can reduce external fragmentation by moving allocated blocks together to create larger free blocks.'
    }
  ];

  // Theory content
  readonly theoryContent = {
    contiguous: {
      title: 'Understanding Contiguous Memory Allocation',
      content: `Contiguous memory allocation is a memory management technique where each process is allocated a continuous block of memory.

      Key Concepts:
      • Each process gets a single continuous block of memory
      • Memory is divided into fixed or variable-sized blocks
      • Processes cannot be split across multiple blocks
      • External fragmentation is a major challenge
      
      Advantages:
      • Simple to implement
      • Easy address translation
      • Efficient memory access
      
      Disadvantages:
      • External fragmentation
      • Memory compaction needed
      • Fixed size limitations`
    },
    fragmentation: {
      title: 'Understanding Fragmentation',
      content: `Fragmentation is a key concept in memory management that affects system efficiency.

      Types of Fragmentation:
      1. External Fragmentation
         • Occurs when free memory is available but in non-contiguous blocks
         • Can prevent allocation of new processes even when total free memory is sufficient
         • Can be reduced through memory compaction
      
      2. Internal Fragmentation
         • Occurs when allocated memory is larger than requested
         • Wastes memory within allocated blocks
         • More common with fixed-size blocks
      
      Memory Compaction:
      • Process of moving allocated blocks to create larger free blocks
      • Helps reduce external fragmentation
      • Requires significant system resources
      • May not be possible for all processes`
    }
  };

  ngOnInit(): void {
    // ... existing initialization ...
  }

  validateInputs(): boolean {
    if (!this.isInitialized) {
      this.showMessage('Please initialize memory first', 'error');
      return false;
    }
    if (!this.newProcess.name.trim()) {
      this.showMessage('Process name is required', 'error');
      return false;
    }
    if (this.newProcess.size <= 0) {
      this.showMessage('Process size must be greater than 0', 'error');
      return false;
    }
    if (this.processInfo[this.newProcess.name]) {
      this.showMessage('Process with this name already exists', 'error');
      return false;
    }
    return true;
  }

  showMessage(msg: string, type: 'info' | 'error' | 'success' = 'info') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  getNextColor(): string {
    const color = this.processColors[this.currentColorIndex];
    this.currentColorIndex = (this.currentColorIndex + 1) % this.processColors.length;
    return color;
  }

  initializeMemory() {
    if (this.totalMemory <= 0) {
      this.showMessage('Total memory must be greater than 0', 'error');
      return;
    }
    this.memory = [];
    this.processInfo = {};
    this.isInitialized = true;
    this.currentColorIndex = 0;
    this.showMessage('Memory initialized successfully', 'success');
  }

  addBlock() {
    if (!this.isInitialized) {
      this.showMessage('Please initialize memory first', 'error');
      return;
    }
    if (this.newBlockSize <= 0) {
      this.showMessage('Block size must be greater than 0', 'error');
      return;
    }
    const currentTotal = this.memory.reduce((sum, block) => sum + block.size, 0);
    if (currentTotal + this.newBlockSize > this.totalMemory) {
      this.showMessage('Adding this block would exceed total memory', 'error');
      return;
    }

    this.memory.push({
      id: this.memory.length,
      size: this.newBlockSize,
      process: '',
      isFree: true
    });
    this.newBlockSize = 0;
    this.showMessage('Block added successfully', 'success');
  }

  removeBlock(blockId: number) {
    if (this.memory[blockId].process) {
      this.showMessage('Cannot remove block that contains a process', 'error');
      return;
    }
    this.memory = this.memory.filter(block => block.id !== blockId);
    // Reassign IDs to maintain continuity
    this.memory.forEach((block, index) => block.id = index);
    this.showMessage('Block removed successfully', 'success');
  }

  getFreeBlocks(): [number, number][] {
    const blocks: [number, number][] = [];
    let i = 0;
    while (i < this.memory.length) {
      if (this.memory[i].isFree) {
        // In contiguous allocation, we only consider individual blocks
        blocks.push([i, this.memory[i].size]);
      }
      i++;
    }
    return blocks;
  }

  allocateProcess() {
    if (!this.validateInputs()) return;

    const name = this.newProcess.name.trim();
    const size = this.newProcess.size;
    const freeBlocks = this.getFreeBlocks();

    // Find a suitable single block based on the fit type
    let chosenBlock: [number, number] | null = null;

    if (this.fitType === 'first') {
      chosenBlock = freeBlocks.find(([_, blockSize]) => blockSize >= size) || null;
    } else if (this.fitType === 'best') {
      chosenBlock = freeBlocks
        .filter(([_, blockSize]) => blockSize >= size)
        .sort((a, b) => a[1] - b[1])[0] || null;
    } else if (this.fitType === 'worst') {
      chosenBlock = freeBlocks
        .filter(([_, blockSize]) => blockSize >= size)
        .sort((a, b) => b[1] - a[1])[0] || null;
    }

    if (chosenBlock) {
      const [blockIndex, blockSize] = chosenBlock;
      
      // Allocate the process to the single block
      this.memory[blockIndex].process = name;
      this.memory[blockIndex].isFree = false;
      
      this.processInfo[name] = {
        requested: size,
        allocated: 1,
        internal: blockSize - size,
        color: this.getNextColor(),
        startBlock: this.memory[blockIndex].id,
        status: 'allocated',
        timestamp: new Date()
      };
      
      this.showMessage(`Process ${name} allocated successfully`, 'success');
      this.newProcess = { name: '', size: 0 }; // Reset form
    } else {
      // Check if we have enough total free memory
      const totalFree = this.memory
        .filter(block => block.isFree)
        .reduce((sum, block) => sum + block.size, 0);

      // Record the failed allocation attempt
      this.processInfo[name] = {
        requested: size,
        allocated: 0,
        internal: 0,
        color: this.getNextColor(),
        startBlock: -1,
        status: 'failed',
        failureReason: totalFree >= size ? 'external_fragmentation' : 'insufficient_memory',
        timestamp: new Date()
      };

      if (totalFree >= size) {
        this.showMessage('Allocation failed: External fragmentation - No single block large enough', 'error');
      } else {
        this.showMessage('Not enough memory to allocate the process', 'error');
      }
    }
  }

  canRetryAllocation(name: string): boolean {
    const info = this.processInfo[name];
    if (!info || info.status !== 'failed') return false;

    // Check if we have enough total free memory
    const totalFree = this.memory
      .filter(block => block.isFree)
      .reduce((sum, block) => sum + block.size, 0);

    return totalFree >= info.requested;
  }

  retryAllocation(name: string) {
    const info = this.processInfo[name];
    if (!info || info.status !== 'failed') {
      this.showMessage('Cannot retry allocation for this process', 'error');
      return;
    }

    // Store the process details
    const size = info.requested;
    
    // Remove the failed process from history
    delete this.processInfo[name];

    // Try to allocate again
    this.newProcess = { name, size };
    this.allocateProcess();
  }

  deallocateProcess(name: string) {
    if (!this.processInfo[name]) {
      this.showMessage('Process not found', 'error');
      return;
    }

    // Only allow deallocation of active processes
    if (this.processInfo[name].status !== 'allocated') {
      this.showMessage('Cannot deallocate a failed process', 'error');
      return;
    }

    this.memory.forEach(block => {
      if (block.process === name) {
        block.process = '';
        block.isFree = true;
      }
    });

    // Update process status to failed with a new timestamp
    this.processInfo[name] = {
      ...this.processInfo[name],
      status: 'failed',
      failureReason: 'deallocated',
      allocated: 0,
      internal: 0,
      startBlock: -1,
      timestamp: new Date()
    };

    this.showMessage(`Process ${name} deallocated successfully`, 'success');
  }

  getProcessColor(name: string): string {
    return this.processInfo[name]?.color || '#E2E8F0';
  }

  getProcessPosition(name: string): number {
    return this.processInfo[name]?.startBlock || 0;
  }

  get memoryUtilization(): number {
    const usedMemory = this.memory
      .filter(block => !block.isFree)
      .reduce((sum, block) => sum + block.size, 0);
    return (usedMemory / this.totalMemory) * 100;
  }

  get internalFragmentation(): number {
    return Object.values(this.processInfo).reduce((acc, p) => acc + p.internal, 0);
  }

  get externalFragmentation(): number {
    const freeBlocks = this.getFreeBlocks();
    const totalFree = freeBlocks.reduce((sum, [_, size]) => sum + size, 0);
    const largestBlock = Math.max(...freeBlocks.map(([_, size]) => size), 0);
    
    // External fragmentation is the total free memory minus the largest free block
    // This represents memory that is free but cannot be used because it's fragmented
    return totalFree - largestBlock;
  }

  get activeProcesses(): string[] {
    return Object.entries(this.processInfo)
      .filter(([_, info]) => info.status === 'allocated')
      .map(([name]) => name);
  }

  get failedProcesses(): string[] {
    return Object.entries(this.processInfo)
      .filter(([_, info]) => info.status === 'failed')
      .map(([name]) => name);
  }

  getProcessStatus(name: string): string {
    const info = this.processInfo[name];
    if (!info) return 'Unknown';
    
    if (info.status === 'allocated') {
      return 'Allocated';
    } else {
      return info.failureReason === 'external_fragmentation' 
        ? 'Failed (External Fragmentation)' 
        : 'Failed (Insufficient Memory)';
    }
  }

  getProcessTimestamp(name: string): string {
    return this.processInfo[name]?.timestamp.toLocaleString() || 'Unknown';
  }

  get totalFreeBlocks(): number {
    return this.memory.filter(block => block.isFree).length;
  }

  get totalFreeMemory(): number {
    return this.memory
      .filter(block => block.isFree)
      .reduce((sum, block) => sum + block.size, 0);
  }

  get largestFreeBlock(): number {
    const freeBlocks = this.getFreeBlocks();
    return Math.max(...freeBlocks.map(([_, size]) => size), 0);
  }

  // Educational Mode Methods
  toggleTheoryPanel(): void {
    this.showTheoryPanel = !this.showTheoryPanel;
  }

  toggleQuizMode(): void {
    this.isQuizMode = !this.isQuizMode;
    if (this.isQuizMode) {
      this.resetQuiz();
      this.prepareNextQuizQuestion();
    }
  }

  getQuizScore(): string {
    return `${this.quizScore}/${this.totalQuizQuestions}`;
  }

  resetQuiz(): void {
    this.quizScore = 0;
    this.totalQuizQuestions = 0;
    this.currentQuizQuestions = [];
    this.currentQuestionIndex = 0;
    this.quizAnswer = undefined;
    this.showQuizExplanation = false;
    this.quizResults = [];
    this.showQuizResults = false;
  }

  private prepareNextQuizQuestion(): void {
    if (!this.quizQuestions.length) return;

    // Generate random questions
    this.currentQuizQuestions = [];
    const availableQuestions = [...this.quizQuestions];
    
    for (let i = 0; i < this.QUESTIONS_PER_QUIZ; i++) {
      if (availableQuestions.length === 0) break;
      
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const question = { ...availableQuestions[randomIndex] };
      this.currentQuizQuestions.push(question);
      availableQuestions.splice(randomIndex, 1);
    }

    this.currentQuestionIndex = 0;
    this.currentQuizQuestion = this.currentQuizQuestions[0];
    this.quizAnswer = undefined;
    this.showQuizExplanation = false;
  }

  nextQuizQuestion(): void {
    if (this.currentQuestionIndex < this.QUESTIONS_PER_QUIZ - 1) {
      this.currentQuestionIndex++;
      this.currentQuizQuestion = this.currentQuizQuestions[this.currentQuestionIndex];
      this.quizAnswer = undefined;
      this.showQuizExplanation = false;
    } else {
      this.showQuizResults = true;
    }
  }

  submitQuizAnswer(answer: number): void {
    if (!this.currentQuizQuestion || this.showQuizExplanation) return;
    
    this.quizAnswer = answer;
    this.showQuizExplanation = true;
    this.totalQuizQuestions++;
    
    const isCorrect = answer === this.currentQuizQuestion.correctAnswer;
    if (isCorrect) {
      this.quizScore++;
    }

    const result: QuizResult = {
      question: this.currentQuizQuestion.question,
      correct: isCorrect,
      userAnswer: this.currentQuizQuestion.options[answer],
      correctAnswer: this.currentQuizQuestion.options[this.currentQuizQuestion.correctAnswer]
    };

    this.quizResults.push(result);
  }

  restartQuiz(): void {
    this.resetQuiz();
    this.prepareNextQuizQuestion();
  }

  getQuizProgress(): string {
    return `${this.currentQuestionIndex + 1}/${this.QUESTIONS_PER_QUIZ}`;
  }
}
