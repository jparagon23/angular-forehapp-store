import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-thanks',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './thanks.component.html',
  styleUrl: './thanks.component.scss',
})
export class ThanksComponent {
  orderNumber = 'FH-' + Math.floor(100000 + Math.random() * 900000);
}
