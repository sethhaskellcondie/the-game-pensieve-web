import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { IconService } from '../../services/icon.service';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  constructor(public iconService: IconService, private router: Router) {}

  getIconHtml(iconName: string): SafeHtml {
    return this.iconService.getIcon(iconName);
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }
}
