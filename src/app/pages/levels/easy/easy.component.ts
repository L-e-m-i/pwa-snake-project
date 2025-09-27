import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-easy',
  imports: [],
  template: `<p>easy works!</p>`,
  styleUrl: './easy.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EasyComponent { }
