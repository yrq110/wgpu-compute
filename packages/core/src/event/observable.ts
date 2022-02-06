// reference: https://github.com/BabylonJS/Babylon.js/blob/master/src/Misc/observable

export class Observer<T> {
  unregisterOnNextCall: boolean
  mask: number
  scope: any
  callback: (eventData: T) => void
  constructor(callback: (eventData: T) => void, mask = -1, scope = null, unregisterOnNextCall = false) {
    this.callback = callback
    this.mask = mask
    this.scope = scope
    this.unregisterOnNextCall = unregisterOnNextCall
  }
}

export class Observable<T> {
  private _observers: Array<Observer<T>> = []

  get observers() {
    return this._observers
  }

  add(callback: (eventData: T) => void, mask = -1, insertFirst = false, scope = null, unregisterOnFirstCall = false) {
    const observer = new Observer(callback, mask, scope, unregisterOnFirstCall)

    observer.unregisterOnNextCall = unregisterOnFirstCall

    if (insertFirst) {
      this._observers.unshift(observer)
    } else {
      this._observers.push(observer)
    }

    return observer;
  }

  addOnce(callback: (eventData: T) => void) {
    return this.add(callback, undefined, undefined, undefined, true)
  }

  remove(observer: Observer<T>) {
    const index = this._observers.indexOf(observer);

    if (index !== -1) {
      this._deferUnregister(observer);
      return true;
    }

    return false;
  }

  notify(eventData: T, mask: number = -1) {
    if (!this._observers.length) {
      return true;
    }
    for (let obs of this._observers) {
      if (obs.mask & mask) {
        if (obs.scope) {
          obs.callback.apply(obs.scope, [eventData]);
        } else {
          obs.callback(eventData);
        }

        if (obs.unregisterOnNextCall) {
          this._deferUnregister(obs);
        }
      }
    }
    return true;
  }

  notifyObserver(observer: Observer<T>, eventData: T, mask = -1) {
    observer.callback(eventData)

    if (observer.unregisterOnNextCall) {
      this._deferUnregister(observer);
    }
  }

  private _deferUnregister(observer: Observer<T>): void {
    observer.unregisterOnNextCall = false
    setTimeout(() => {
      this._remove(observer)
    }, 0)
  }

  private _remove(observer: Observer<T>) {

    var index = this._observers.indexOf(observer);

    if (index !== -1) {
      this._observers.splice(index, 1);
      return true;
    }

    return false;
  }
}
