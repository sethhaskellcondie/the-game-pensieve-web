import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="box">
      <img src="../../../assets/images/game_pensive_icon.png" alt="game_pensive_icon" height="144px">
      <h1>The Game Pensive</h1>
    </div>
  `,
  styles: `
  .box {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
  }
  `
})
export class HeaderComponent {

//This is a code snippet that I need to study again after working on it for Loveland
  //I'm going to store it here for reference

  //---------How to chain http requests with observables -------------

  //This is what I came up with after a day of research

  // functionThatMakesTheFirstCallAndReturnsObservable<A>.pipe( //Pipe will take the observable and change it into a stream-like state and emit the values in the observable as they are received
  // 	tap((result: A) => {    //here tap() is used to take part of the result and save it to the class this is unneeded when that value can just be passed to the next function
  // 		this.A = result.A;
  // 	}),
  // 	  mergeMap(() => functionThatMakesTheSecondCallAndReturnsObservable<B>(this.A).pipe(    //mergeMap will take an observable and subscribe to an 'inner' observable and then return the values of the inner observable to the outer observable
  // 		tap((result: B) => this.B = result)
  // )))
  //   .subscribe(
  //     () => { this.C = A + B; }
  //   );

  //This is how it should work

  // functionThatMakesTheFirstCallAndReturnsObservable<A>() //We don't need pipe() because we can just call map on the observable itself instead of changing it to a stream-like state first
  //   .mergeMap((result: A) => functionThatMakesTheSecondCallAndReturnsObservable<B>(A)) //We don't need tap because we can pass the result of A into the function that returns B
  //   .subscribe( //Then when we subscribe we have access to both A and B thanks to mergeMap
  //     (result: B) => {
  //       this.C = A + B;;
  //     }
  //   );

  //Note mergeMap is also a function in Angular, I was getting an error 'mergeMap is not a function' at runtime this was solved by adding
  //import "rxjs/add/operator/mergeMap";
  //at the start of the file

}
