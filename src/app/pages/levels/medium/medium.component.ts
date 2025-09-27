import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-medium',
  imports: [],
  template: `<p>medium works!</p>`,
  styleUrl: './medium.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediumComponent { }
