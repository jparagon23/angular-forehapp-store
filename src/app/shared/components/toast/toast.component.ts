import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `<div class="toast" [class.show]="visible">{{ message }}</div>`,
  styles: [`
    .toast {
      position: fixed;
      bottom: 30px; left: 50%;
      transform: translateX(-50%) translateY(80px);
      background: var(--dark);
      color: #fff;
      padding: 12px 28px;
      border-radius: 30px;
      font-weight: 600;
      font-size: .95rem;
      border-left: 4px solid var(--green);
      transition: transform .3s;
      z-index: 400;
      pointer-events: none;
    }
    .toast.show { transform: translateX(-50%) translateY(0); }
  `]
})
export class ToastComponent implements OnChanges {
  @Input() message = '';
  visible = false;
  private timer: any;

  ngOnChanges() {
    if (!this.message) return;
    this.visible = true;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.visible = false; }, 2400);
  }
}
