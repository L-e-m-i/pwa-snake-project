import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hard',
  imports: [],
  template: `<p>hard works!</p>`,
  styleUrl: './hard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HardComponent { }
