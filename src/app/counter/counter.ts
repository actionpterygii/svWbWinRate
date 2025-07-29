import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './counter.html',
  styleUrl: './counter.less'
})
export class Counter implements OnInit {
  @Input() title!: string;
  @Input() win!: number;   // ← 追加
  @Input() lose!: number;  // ← 追加
  @Input() storageKey!: string;

  @Output() remove = new EventEmitter<void>();
  @Output() dragStart = new EventEmitter<MouseEvent | TouchEvent>();
  @Output() dragOver = new EventEmitter<void>();

  ngOnInit() {
    if (this.storageKey && typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.win = data.win ?? 0;
        this.lose = data.lose ?? 0;
      }
    }
  }

  incrementWin() {
    this.win++;
    this.save();
  }

  decrementWin() {
    if (this.win > 0) {
      this.win--;
      this.save();
    }
  }

  incrementLose() {
    this.lose++;
    this.save();
  }

  decrementLose() {
    if (this.lose > 0) {
      this.lose--;
      this.save();
    }
  }

  get rate(): number {
    const total = this.win + this.lose;
    return total === 0 ? 0 : Math.round((this.win / total) * 1000) / 10;
  }

  get rateDisplay(): string {
    const total = this.win + this.lose;
    if (total === 0) return '0.0';
    return ((this.win / total) * 100).toFixed(1);
  }

  save() {
    if (this.storageKey && typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.storageKey, JSON.stringify({ win: this.win, lose: this.lose }));
    }
  }

  // ドラッグ開始
  startDrag(event: MouseEvent | TouchEvent) {
    this.dragStart.emit(event);
  }
}