import { Injectable, signal } from '@angular/core';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

@Injectable({
  providedIn: 'root'
})
export class GestureService {

  private readonly minSwipeDistance = 30; 
  private readonly maxSwipeTime = 500;

  private touchStart = signal<{ x: number; y: number; time: number } | null>(null);

  handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.touchStart.set({ 
      x: touch.clientX, 
      y: touch.clientY, 
      time: Date.now() });
  }

  handleTouchEnd(event: TouchEvent): SwipeDirection | null {
    const startTouch = this.touchStart();
    if (!startTouch || event.changedTouches.length !== 1) {
      this.touchStart.set(null);
      return null;
    }
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startTouch.x;
    const deltaY = touch.clientY - startTouch.y;
    const deltaTime = Date.now() - startTouch.time;

    this.touchStart.set(null);
    
    if (deltaTime > this.maxSwipeTime) {
      return null; 
    }
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (absDeltaX < this.minSwipeDistance && absDeltaY < this.minSwipeDistance) {
      return null;
    }
    
    if(absDeltaX > absDeltaY){
      return deltaX > 0 ? 'right' : 'left'
    }else{
      return deltaY > 0 ? 'down' : 'up'
    }
  }

  handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
  }

}
