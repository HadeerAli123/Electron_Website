import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-broker-stats',
    standalone: true,
  imports: [CommonModule],
  templateUrl: './broker-stats.html',
  styleUrl: './broker-stats.css',
})
export class BrokerStats {
    @Input() stats!: {
    clients: number;
    balance: number;
    commissions: number;
    monthlySales: number;
  };

}
