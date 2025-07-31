import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CommonModule } from '@angular/common';

import { Counter } from './counter/counter';
import * as yaml from 'js-yaml';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { HowToDialogComponent } from './howto-dialog.component';

// 共通の初期カウンター
const DEFAULT_COUNTERS = [
  { title: 'エルフ(リノ)', storageKey: 'counter1', win: 0, lose: 0 },
  { title: 'エルフ(テンポ)', storageKey: 'counter2', win: 0, lose: 0 },
  { title: 'ロイヤル(早め)', storageKey: 'counter3', win: 0, lose: 0 },
  { title: 'ロイヤル(遅め)', storageKey: 'counter4', win: 0, lose: 0 },
  { title: 'ウィッチ(スペル強め)', storageKey: 'counter5', win: 0, lose: 0 },
  { title: 'ウィッチ(秘術強め)', storageKey: 'counter6', win: 0, lose: 0 },
  { title: 'ウィッチ(どっちつかず)', storageKey: 'counter7', win: 0, lose: 0 },
  { title: 'ドラゴン(早め)', storageKey: 'counter8', win: 0, lose: 0 },
  { title: 'ドラゴン(遅め)', storageKey: 'counter9', win: 0, lose: 0 },
  { title: 'ナイトメア(早め)', storageKey: 'counter10', win: 0, lose: 0 },
  { title: 'ナイトメア(遅め)', storageKey: 'counter11', win: 0, lose: 0 },
  { title: 'ビショップ(早め)', storageKey: 'counter12', win: 0, lose: 0 },
  { title: 'ビショップ(遅め)', storageKey: 'counter13', win: 0, lose: 0 },
  { title: 'ネメシス(AF)', storageKey: 'counter14', win: 0, lose: 0 },
  { title: 'ネメシス(人形)', storageKey: 'counter15', win: 0, lose: 0 },
  { title: 'ネメシス(どっちつかず)', storageKey: 'counter16', win: 0, lose: 0 }
];

interface CounterData {
  title: string;
  storageKey: string;
  win: number;
  lose: number;
}

interface CounterSet {
  name: string;
  id?: string;
  counters: CounterData[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Counter, RouterOutlet, MatTabsModule, MatCardModule, MatIconModule, MatButtonModule, MatDividerModule, MatToolbarModule, MatDialogModule],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
  counterSets: CounterSet[] = [];
  activeTab = 0;
  draggingIndex: number | null = null;
  overIndex: number | null = null;

  // クラスプロパティとして追加
  private _touchMoveHandler?: (e: TouchEvent) => void;

  constructor(private dialog: MatDialog) {
    this.load();
  }

  addTab() {
    const name = prompt('新しいデッキ名を入力してください', `デッキ${this.counterSets.length + 1}`);
    if (name) {
      // 既存デッキがあれば、そのカウンター構成をコピー（win/loseは0で初期化）
      let counters;
      if (this.counterSets.length > 0) {
        counters = this.counterSets[0].counters.map((c, i) => ({
          title: c.title,
          storageKey: this.generateKey(Date.now() + '_' + Math.random(), i + 1),
          win: 0,
          lose: 0
        }));
      } else {
        counters = DEFAULT_COUNTERS.map((c, i) => ({
          ...c,
          storageKey: this.generateKey(Date.now() + '_' + Math.random(), i + 1),
          win: 0,
          lose: 0
        }));
      }
      const deckId = Date.now() + '_' + Math.random();
      const newSet: CounterSet = {
        name,
        id: deckId,
        counters
      };
      this.counterSets.push(newSet);
      this.activeTab = this.counterSets.length - 1;
      this.save();
    }
  }

  selectTab(idx: number) {
    this.activeTab = idx;
  }

  // storageKey生成
  generateKey(deckId: string, counterIdx: number) {
    return `counter_${deckId}_${counterIdx}`;
  }

  save() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('counterSets', JSON.stringify(this.counterSets));
      localStorage.setItem('activeTab', this.activeTab.toString());
    }
  }

  load() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const sets = localStorage.getItem('counterSets');
      // const tab = localStorage.getItem('activeTab'); ← これを使わない
      if (sets) {
        this.counterSets = JSON.parse(sets);
      } else {
        // 初期デッキ
        this.counterSets = [
          {
            name: 'デッキ1',
            counters: DEFAULT_COUNTERS.map((c, i) => ({ ...c, storageKey: this.generateKey('デッキ1', i + 1) }))
          }
        ];
      }
      this.activeTab = 0; // ← 必ず一番左のタブに
    } else {
      // SSR時も同様に
      this.counterSets = [
        {
          name: 'デッキ1',
          counters: DEFAULT_COUNTERS.map((c, i) => ({ ...c, storageKey: this.generateKey('デッキ1', i + 1) }))
        }
      ];
      this.activeTab = 0;
    }
  }

  exportYaml() {
    // カウンターの値も含めてエクスポート
    const data = this.counterSets.map(set => ({
      name: set.name,
      counters: set.counters.map(c => {
        let win = 0, lose = 0;
        if (typeof window !== 'undefined' && window.localStorage) {
          const saved = localStorage.getItem(c.storageKey);
          if (saved) {
            const d = JSON.parse(saved);
            win = d.win ?? 0;
            lose = d.lose ?? 0;
          }
        }
        return { title: c.title, win, lose };
      })
    }));
    const yml = yaml.dump(data);
    const blob = new Blob([yml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'counter-data.yml';
    a.click();
    URL.revokeObjectURL(url);
  }

  async importYaml(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const text = await file.text();
    const data = yaml.load(text) as any[];
    if (!Array.isArray(data)) return;

    // 上書き
    this.counterSets = data.map((set: any, setIdx: number) => ({
      name: set.name,
      counters: (set.counters || []).map((c: any, cIdx: number) => {
        const storageKey = this.generateKey(set.name, cIdx + 1);
        // localStorageにも反映
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(storageKey, JSON.stringify({ win: c.win ?? 0, lose: c.lose ?? 0 }));
        }
        return { title: c.title, storageKey };
      })
    }));
    this.activeTab = 0;
    this.save();
  }

  removeTab(idx: number) {
    if (confirm(`「${this.counterSets[idx].name}」タブを削除しますか？`)) {
      // カウンターの勝敗データも削除
      for (const c of this.counterSets[idx].counters) {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(c.storageKey);
        }
      }
      this.counterSets.splice(idx, 1);
      if (this.activeTab >= this.counterSets.length) {
        this.activeTab = Math.max(0, this.counterSets.length - 1);
      }
      this.save();
    }
  }

  addCounter() {
    const name = window.prompt('追加するカウンター名を入力してください', `カウンター${this.counterSets[0]?.counters.length + 1 || 1}`);
    if (!name) return;
    for (const set of this.counterSets) {
      set.counters.push({
        title: name,
        storageKey: `counter${Date.now()}_${Math.random()}`,
        win: 0,
        lose: 0
      });
    }
  }

  removeCounter(counterIndex: number) {
    if (confirm('このカウンターを全デッキから削除します。よろしいですか？')) {
      for (const set of this.counterSets) {
        set.counters.splice(counterIndex, 1);
      }
      this.save();
    }
  }

  // カウンターリストの並び替え・ドラッグアンドドロップ自前実装
  // ドラッグ開始
  onDragStart(idx: number, event: MouseEvent | TouchEvent) {
    this.draggingIndex = idx;

    if (event instanceof TouchEvent) {
      // スマホ対応: スクロールを防ぎつつドラッグ
      this._touchMoveHandler = (e: TouchEvent) => {
        e.preventDefault();
        this.onDragMove(e);
      };
      document.addEventListener('touchmove', this._touchMoveHandler, { passive: false });
      document.addEventListener('touchend', this.onDragEnd);
    } else {
      document.addEventListener('mousemove', this.onDragMove);
      document.addEventListener('mouseup', this.onDragEnd);
    }
  }

  // ドラッグ移動
  onDragMove = (event: MouseEvent | TouchEvent) => {
    let clientY: number;
    if (event instanceof MouseEvent) {
      clientY = event.clientY;
    } else if (event.touches && event.touches.length > 0) {
      clientY = event.touches[0].clientY;
    } else {
      return;
    }

    // カウンター行のDOMリストを取得
    const rows = Array.from(document.querySelectorAll('.counter-row')) as HTMLElement[];
    // 現在のマウス/タッチ位置に一番近い行を探す
    let closestIdx = 0;
    let minDist = Infinity;
    rows.forEach((row, idx) => {
      const rect = row.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const dist = Math.abs(centerY - clientY);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });
    this.overIndex = closestIdx;
  };

  // ドラッグ終了
  onDragEnd = (event: MouseEvent | TouchEvent) => {
    if (this.draggingIndex !== null && this.overIndex !== null && this.draggingIndex !== this.overIndex) {
      this.moveCounter(this.draggingIndex, this.overIndex);
    }
    this.draggingIndex = null;
    this.overIndex = null;

    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);

    if (this._touchMoveHandler) {
      document.removeEventListener('touchmove', this._touchMoveHandler);
      this._touchMoveHandler = undefined;
    }
    document.removeEventListener('touchend', this.onDragEnd);
  };

  // ドラッグオーバー（各カウンター行で呼ぶ）
  onDragOver(idx: number) {
    if (this.draggingIndex !== null) {
      this.overIndex = idx;
    }
  }

  // 並び替え＆ローカルストレージ保存
  moveCounter(fromIndex: number, toIndex: number) {
    const set = this.counterSets[this.activeTab];
    const moved = set.counters.splice(fromIndex, 1)[0];
    set.counters.splice(toIndex, 0, moved);
    this.counterSets.forEach(deck => {
      deck.counters = set.counters.slice();
    });
    localStorage.setItem('counterSets', JSON.stringify(this.counterSets));
  }

  get totalWin(): number {
    return this.counterSets
      .flatMap(set => set.counters ?? [])
      .reduce((sum, c) => sum + this.getCounterData(c.storageKey).win, 0);
  }

  get totalLose(): number {
    return this.counterSets
      .flatMap(set => set.counters ?? [])
      .reduce((sum, c) => sum + this.getCounterData(c.storageKey).lose, 0);
  }

  get totalRate(): number {
    const totalWin = this.totalWin;
    const totalLose = this.totalLose;
    const total = totalWin + totalLose;
    return total === 0 ? 0 : Math.round((totalWin / total) * 1000) / 10;
  }

  tabWin(idx: number): number {
    let sum = 0;
    for (const c of this.counterSets[idx].counters) {
      const data = this.getCounterData(c.storageKey);
      sum += data.win;
    }
    return sum;
  }

  tabLose(idx: number): number {
    let sum = 0;
    for (const c of this.counterSets[idx].counters) {
      const data = this.getCounterData(c.storageKey);
      sum += data.lose;
    }
    return sum;
  }

  tabRate(idx: number): number {
    const win = this.tabWin(idx);
    const lose = this.tabLose(idx);
    const total = win + lose;
    return total === 0 ? 0 : Math.round((win / total) * 1000) / 10;
  }

  getCounterData(storageKey: string): { win: number; lose: number } {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const d = JSON.parse(saved);
        return { win: d.win ?? 0, lose: d.lose ?? 0 };
      }
    }
    return { win: 0, lose: 0 };
  }

  openHowToDialog() {
    this.dialog.open(HowToDialogComponent);
  }

  resetAll() {
    if (confirm('すべてのデータを初期化します。よろしいですか？')) {
      // ローカルストレージのカウンター関連データを削除
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear();
      }
      // 初期状態に戻す
      this.counterSets = [
        {
          name: 'デッキ1',
          counters: DEFAULT_COUNTERS.map((c, i) => ({ ...c, storageKey: this.generateKey('デッキ1', i + 1) }))
        }
      ];
      this.activeTab = 0;
      this.save();
    }
  }
}
