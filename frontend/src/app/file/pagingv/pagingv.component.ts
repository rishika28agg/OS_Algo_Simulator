import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faBook, 
  faQuestionCircle, 
  faTasks, 
  faChevronLeft, 
  faChevronRight, 
  faCheckCircle, 
  faTimesCircle, 
  faRedo, 
  faLightbulb
} from '@fortawesome/free-solid-svg-icons';

interface StepInfo {
  step: number;
  page: number;
  action: 'hit' | 'fault';
  evicted?: number;
  memory: number[];
  page_table: { [key: string]: string };
  explanation?: string;
  detailedExplanation?: string;  // More detailed explanation for educational purposes
  processState?: {
    virtualAddress?: string;
    pageNumber?: number;
    offset?: number;
    physicalAddress?: string;
    frameNumber?: number;
  };
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  type: 'concept' | 'process' | 'algorithm';
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
}

interface ChartDataset {
  data: number[];
  label: string;
  backgroundColor: string[];
}

interface ProcessState {
  virtualAddress: string;
  pageNumber: number;
  offset: number;
  physicalAddress: string;
  frameNumber: number;
}

interface QuizResult {
  question: string;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
}

interface AnimationState {
  cpuActive: boolean;
  pageTableActive: boolean;
  memoryActive: boolean;
  diskActive: boolean;
  arrowStates: {
    cpuToPageTable: boolean;
    pageTableToMemory: boolean;
    memoryToCpu: boolean;
    diskToMemory: boolean;
    cpuToDisk: boolean;
  };
  highlightElements: string[];
}

interface ProcessStep {
  title: string;
  description: string;
  details: string;
  animationState: AnimationState;
}

@Component({
  selector: 'app-pagingv',
  templateUrl: './pagingv.component.html',
  styleUrls: ['./pagingv.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgChartsModule,
    DecimalPipe,
    FontAwesomeModule
  ]
})
export class PagingvComponent implements OnInit, OnDestroy {
  // Constants for address calculations
  private readonly PAGE_SIZE = 4096; // 4KB page size
  private readonly MAX_VIRTUAL_ADDRESS = 0xFFFFFF; // 24-bit virtual address space

  // Update icons object to include only required icons
  readonly icons = {
    faBook,
    faQuestionCircle,
    faTasks,
    faChevronLeft,
    faChevronRight,
    faCheckCircle,
    faTimesCircle,
    faRedo,
    faLightbulb
  };

  // Simulation properties
  numFrames = 3;
  pageRequests: number[] = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
  pageRequestInput = this.pageRequests.join(',');
  algorithm = 'FIFO';
  currentStep = 0;
  simulationSteps: StepInfo[] = [];
  displayStep?: StepInfo;
  pageFaults = 0;
  pageHits = 0;
  isRunning = false;
  simulationSpeed = 1000; // Default speed in milliseconds
  private simulationInterval: any;

  // Chart properties
  chartData: ChartData<'bar'> = {
    datasets: [{
      data: [0, 0],
      label: 'Count',
      backgroundColor: ['#ff6b6b', '#4ecdc4']
    }],
    labels: ['Page Faults', 'Page Hits']
  };
  chartType: ChartType = 'bar';
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          stepSize: 1
        }
      },
      x: {
        title: {
          display: true,
          text: 'Event Type',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            const total = this.simulationSteps.length;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  objectKeys = Object.keys;

  // Educational Features
  showTheoryPanel = false;
  isQuizMode = false;
  currentQuizQuestion?: QuizQuestion;
  quizAnswer?: number;
  showQuizExplanation = false;
  quizScore = 0;
  totalQuizQuestions = 0;

  // Quiz State
  quizMode: 'interactive' = 'interactive';
  currentQuizIndex = 0;
  quizResults: QuizResult[] = [];
  showQuizResults = false;
  currentQuizQuestions: QuizQuestion[] = [];
  readonly QUESTIONS_PER_QUIZ = 3;
  currentQuestionIndex = 0;

  // Quiz Questions
  readonly quizQuestions: QuizQuestion[] = [
    // Process Questions
    {
      type: 'process',
      difficulty: 'easy',
      question: 'What happens first in the paging process?',
      options: [
        'Page table lookup',
        'Virtual address generation',
        'Physical address calculation',
        'Page fault handling'
      ],
      correctAnswer: 1,
      explanation: 'The process begins when the CPU generates a virtual address to access memory.'
    },
    {
      type: 'process',
      difficulty: 'medium',
      question: 'How is a virtual address converted to a physical address?',
      options: [
        'Direct mapping without page table',
        'Using page table to find frame number, then adding offset',
        'Random allocation in physical memory',
        'Sequential allocation in physical memory'
      ],
      correctAnswer: 1,
      explanation: 'The page table maps the virtual page number to a frame number, and the offset is added to get the physical address.'
    },
    // Concept Questions
    {
      type: 'concept',
      difficulty: 'easy',
      question: 'What is the purpose of the page table?',
      options: [
        'To store program instructions',
        'To map virtual pages to physical frames',
        'To manage disk space',
        'To handle CPU scheduling'
      ],
      correctAnswer: 1,
      explanation: 'The page table is a data structure that maps virtual page numbers to physical frame numbers.'
    },
    {
      type: 'concept',
      difficulty: 'hard',
      question: 'What is the difference between a minor and major page fault?',
      options: [
        'Minor faults are more serious than major faults',
        'Major faults require disk I/O, minor faults don\'t',
        'Minor faults occur in user space, major faults in kernel space',
        'There is no difference between them'
      ],
      correctAnswer: 1,
      explanation: 'A major page fault requires loading the page from disk, while a minor page fault can be resolved without disk I/O.'
    },
    // Algorithm Questions
    {
      type: 'algorithm',
      difficulty: 'medium',
      question: 'In FIFO, which page is replaced when memory is full?',
      options: [
        'The most recently used page',
        'The least recently used page',
        'The page that has been in memory the longest',
        'A random page'
      ],
      correctAnswer: 2,
      explanation: 'FIFO replaces the page that has been in memory the longest, regardless of how frequently it has been used.'
    },
    {
      type: 'algorithm',
      difficulty: 'hard',
      question: 'What is Belady\'s anomaly in the context of page replacement?',
      options: [
        'A page fault that cannot be resolved',
        'When increasing frames leads to more page faults',
        'When the page table becomes corrupted',
        'When physical memory is completely full'
      ],
      correctAnswer: 1,
      explanation: 'Belady\'s anomaly is a phenomenon where increasing the number of frames can actually increase the number of page faults.'
    }
  ];

  // Theory content
  readonly theoryContent = {
    paging: {
      title: 'Understanding Paging',
      content: `Paging is a memory management scheme that eliminates the need for contiguous allocation of physical memory. 
      The process is divided into fixed-size blocks called pages, and physical memory is divided into frames of the same size.
      
      Key Concepts:
      • Pages: Fixed-size blocks of logical memory
      • Frames: Fixed-size blocks of physical memory
      • Page Table: Maps logical pages to physical frames
      • Page Fault: Occurs when a requested page is not in memory`,
      diagram: 'assets/paging-diagram.png'
    },
    algorithms: {
      title: 'Page Replacement Algorithms',
      content: {
        FIFO: `First-In-First-Out (FIFO)
        • Replaces the page that has been in memory the longest
        • Simple to implement but doesn't consider page usage
        • Can suffer from Belady's anomaly
        • Best for: Simple systems with uniform page access patterns`,
        LRU: `Least Recently Used (LRU)
        • Replaces the page that hasn't been used for the longest time
        • More efficient than FIFO as it considers page usage patterns
        • Requires tracking of page usage
        • Best for: Systems with temporal locality in page access`
      }
    }
  };

  ngOnInit(): void {
    this.reset();
  }

  onAlgorithmChange(): void {
    if (this.simulationSteps.length > 0) {
      this.runSimulation();
    }
  }

  runCustomSimulation(): void {
    const input = this.pageRequestInput.trim();
    if (!input) {
      alert('Please enter a page request sequence');
      return;
    }

    this.pageRequests = input.split(',')
      .map(p => parseInt(p.trim(), 10))
      .filter(n => !isNaN(n));
    
    if (this.pageRequests.length === 0) {
      alert('Please enter valid page numbers separated by commas');
      return;
    }

    this.runSimulation();
  }

  runSimulation(): void {
    // Reset the simulation state
    this.reset();
    
    // Generate simulation steps
    this.simulationSteps = this.algorithm === 'FIFO'
      ? this.runFIFO()
      : this.runLRU();
    
    // Add process state information
    this.addProcessStateToSteps();
    
    // Set initial display step
    this.displayStep = this.simulationSteps[0];
    
    // Start automatic simulation
    this.startStepByStepDisplay();
  }

  private runFIFO(): StepInfo[] {
    const steps: StepInfo[] = [];
    const frames: number[] = Array(this.numFrames).fill(-1);
    const queue: number[] = [];
    this.pageFaults = 0;
    this.pageHits = 0;

    this.pageRequests.forEach((page, i) => {
      const stepInfo: StepInfo = {
        step: i + 1,
        page,
        action: 'fault',
        memory: [],
        page_table: {},
        explanation: ''
      };

      if (frames.includes(page)) {
        this.pageHits++;
        stepInfo.action = 'hit';
        stepInfo.explanation = `Page ${page} is already in memory (Frame ${frames.indexOf(page)})`;
      } else {
        this.pageFaults++;
        if (frames.includes(-1)) {
          const idx = frames.indexOf(-1);
          frames[idx] = page;
          queue.push(page);
          stepInfo.explanation = `Page ${page} loaded into empty Frame ${idx}`;
        } else {
          const evicted = queue.shift()!;
          const idx = frames.indexOf(evicted);
          frames[idx] = page;
          queue.push(page);
          stepInfo.evicted = evicted;
          stepInfo.explanation = `Page ${page} loaded into Frame ${idx}, evicting Page ${evicted} (FIFO)`;
        }
      }

      stepInfo.memory = [...frames];
      stepInfo.page_table = this.generatePageTable(frames);
      steps.push(stepInfo);
    });

    return steps;
  }

  private runLRU(): StepInfo[] {
    const steps: StepInfo[] = [];
    const frames: number[] = Array(this.numFrames).fill(-1);
    const usageOrder: number[] = [];
    this.pageFaults = 0;
    this.pageHits = 0;

    this.pageRequests.forEach((page, i) => {
      const stepInfo: StepInfo = {
        step: i + 1,
        page,
        action: 'fault',
        memory: [],
        page_table: {},
        explanation: ''
      };

      if (frames.includes(page)) {
        this.pageHits++;
        usageOrder.splice(usageOrder.indexOf(page), 1);
        stepInfo.action = 'hit';
        stepInfo.explanation = `Page ${page} is already in memory (Frame ${frames.indexOf(page)})`;
      } else {
        this.pageFaults++;
        if (frames.includes(-1)) {
          const idx = frames.indexOf(-1);
          frames[idx] = page;
          stepInfo.explanation = `Page ${page} loaded into empty Frame ${idx}`;
        } else {
          const lruPage = usageOrder.shift()!;
          const idx = frames.indexOf(lruPage);
          frames[idx] = page;
          stepInfo.evicted = lruPage;
          stepInfo.explanation = `Page ${page} loaded into Frame ${idx}, evicting Page ${lruPage} (LRU)`;
        }
      }

      usageOrder.push(page);
      stepInfo.memory = [...frames];
      stepInfo.page_table = this.generatePageTable(frames);
      steps.push(stepInfo);
    });

    return steps;
  }

  generatePageTable(frames: number[]): { [key: string]: string } {
    const table: { [key: string]: string } = {};
    frames.forEach((p, i) => {
      if (p !== -1) table[`P${p}`] = `F${i}`;
    });
    return table;
  }

  startStepByStepDisplay(): void {
    this.currentStep = 0;
    this.isRunning = true;
    this.displayStep = this.simulationSteps[0];
    
    this.simulationInterval = setInterval(() => {
      if (this.currentStep < this.simulationSteps.length - 1) {
        this.currentStep++;
        this.displayStep = this.simulationSteps[this.currentStep];
        this.updateChart(); // Update chart after each step
      } else {
        this.stopSimulation();
      }
    }, this.simulationSpeed);
  }

  stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
    this.updateChart(); // Final chart update
  }

  updateSimulationSpeed(): void {
    if (this.isRunning && this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.startStepByStepDisplay();
    }
  }

  nextStep(): void {
    if (this.currentStep < this.simulationSteps.length - 1) {
      this.currentStep++;
      this.displayStep = this.simulationSteps[this.currentStep];
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.displayStep = this.simulationSteps[this.currentStep];
    }
  }

  reset(): void {
    this.stopSimulation();
    this.currentStep = 0;
    this.pageFaults = 0;
    this.pageHits = 0;
    this.simulationSteps = [];
    this.displayStep = undefined;
    this.isRunning = false;
    
    this.chartData = {
      datasets: [{
        data: [0, 0],
        label: 'Count',
        backgroundColor: ['#ff6b6b', '#4ecdc4']
      }],
      labels: ['Page Faults', 'Page Hits']
    };
  }

  getStepExplanation(step: StepInfo): string {
    const baseExplanation = step.explanation || '';
    if (this.isQuizMode) {
      return `Step ${step.step}: ${baseExplanation}\n\nWhat do you think will happen next?`;
    }
    return baseExplanation;
  }

  updateChart(): void {
    if (!this.simulationSteps.length) return;

    const dataset: ChartDataset = {
      data: [this.pageFaults, this.pageHits],
      label: 'Count',
      backgroundColor: ['#ff6b6b', '#4ecdc4']
    };

    this.chartData = {
      datasets: [dataset],
      labels: ['Page Faults', 'Page Hits']
    };
  }

  getPageStatus(pageKey: string, step: StepInfo): string {
    const pageNumber = parseInt(pageKey.substring(1));
    
    if (pageNumber === step.page) {
      return step.action === 'hit' ? 'Hit' : 'Fault';
    }
    if (pageNumber === step.evicted) {
      return 'Evicted';
    }
    if (step.page_table[pageKey]) {
      return 'In Memory';
    }
    return 'Not Loaded';
  }

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

  ngOnDestroy(): void {
    this.stopSimulation();
  }

  private addProcessStateToSteps(): void {
    this.simulationSteps.forEach(step => {
      // Generate a random virtual address within the address space
      const virtualAddress = Math.floor(Math.random() * this.MAX_VIRTUAL_ADDRESS);
      const pageNumber = Math.floor(virtualAddress / this.PAGE_SIZE);
      const offset = virtualAddress % this.PAGE_SIZE;
      
      const frameNumber = step.page_table[`P${step.page}`] ? 
        parseInt(step.page_table[`P${step.page}`].substring(1)) : 
        -1;

      const physicalAddress = frameNumber !== -1 ? 
        (frameNumber * this.PAGE_SIZE + offset).toString(16) : 
        'N/A';

      step.processState = {
        virtualAddress: virtualAddress.toString(16).padStart(6, '0'),
        pageNumber,
        offset,
        physicalAddress,
        frameNumber
      };
    });
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

    // Generate 3 random questions
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

  // Helper methods for address calculations
  private calculatePageNumber(address: number): number {
    return Math.floor(address / this.PAGE_SIZE);
  }

  private calculateOffset(address: number): number {
    return address % this.PAGE_SIZE;
  }

  private calculatePhysicalAddress(frameNumber: number, offset: number): number {
    return (frameNumber * this.PAGE_SIZE) + offset;
  }

  private validateAddress(address: number): boolean {
    return address >= 0 && address <= this.MAX_VIRTUAL_ADDRESS;
  }
}
