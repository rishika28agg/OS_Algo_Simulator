import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';  // <-- Import FormsModule

@Component({
  selector: 'app-deadlock',
  standalone: true,                          // <-- Standalone component
  imports: [FormsModule],                    // <-- Add FormsModule here
  templateUrl: './deadlock.component.html',
  styleUrls: ['./deadlock.component.css']
})
export class DeadlockComponent {
  totalResourcesInput = '';
  pid: number = 0;
  maxResourcesInput = '';
  requestPid: number = 0;
  requestInput = '';
  safeSequenceMessage = '';

  setTotalResources() {
    const resources = this.totalResourcesInput.trim().split(' ').map(Number);
    console.log('Total resources set:', resources);
  }

  addProcess() {
    const maxResources = this.maxResourcesInput.trim().split(' ').map(Number);
    console.log(`Adding Process ${this.pid} with Max Resources:`, maxResources);
  }

  requestResources() {
    const request = this.requestInput.trim().split(' ').map(Number);
    console.log(`Process ${this.requestPid} requests:`, request);
  }
}
