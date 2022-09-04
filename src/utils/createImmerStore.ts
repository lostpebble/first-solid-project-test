import { Draft, enablePatches, Patch, produceWithPatches } from "immer";
import { createStore, produce } from "solid-js/store";
import { createSignal, Signal } from "solid-js";
import DeepProxy from "proxy-deep";

enablePatches();
type NotWrappable = string | number | bigint | symbol | boolean | Function | null | undefined;

type TUpdater<T> = (draft: Draft<T>, original: T) => void;

type TFunctionified<O extends object> = {
  [K in keyof O]: (() => O[K]) & (O[K] extends object ? TFunctionified<O[K]> : () => O[K]);
};

interface IImmerStore<T extends object> {
  state: TFunctionified<T>;
  update: (updater: TUpdater<T>) => void;
}

interface ISignals {
  [key: number | string]: {
    sig: Signal<any>;
  };
}

let ord = 0;
const sigs: unique symbol = Symbol();

interface IStoredSymbol {
  // proxyId: number;
  signal: Signal<any>;
}

// type OtherKeys<T extends number|string|symbol = number|string|symbol> = T extends typeof sigs ? never : T;

interface IDeepSignalStorage {
  [sigs]?: IStoredSymbol;

  [key: number | string]: IDeepSignalStorage;
}

export function createImmerStore<T extends object>(
  initialValue: T extends NotWrappable ? never : T,
): IImmerStore<T> {
  const getInitialValue = (): T => initialValue;
  let currentState: T = initialValue;

  // const [state, setState] = createStore(initialValue);
  const signals: {
    [proxyId: number]: {
      path: (string | number)[];
      signal: Signal<any>;
    };
  } = {};

  const deepSignalStorage: {
    [key: number | string]: IDeepSignalStorage;
  } = {};

  console.log(signals);
  console.log(deepSignalStorage);

  function addSignalPathId(path: (string | number)[]): [signal: Signal<any>, signalState: any] {
    let curState: any = (currentState as any)[path[0]];

    if (deepSignalStorage[path[0]] == null) {
      deepSignalStorage[path[0]] = {};
    }

    let curObj = deepSignalStorage[path[0]];
    let signal: Signal<any>;
    for (let i = 0; i < path.length; i += 1) {
      if (i === path.length - 1) {
        // We are at the final index

        if (curObj[sigs] == null) {
          signal = createSignal(curState);
          curObj[sigs] = { signal };
        } else {
          signal = curObj[sigs].signal;
        }
      } else {
        if (curState != null) {
          curState = curState[path[i + 1]];
        }

        if (curObj[path[i + 1]] == null) {
          curObj[path[i + 1]] = {};
        }

        curObj = curObj[path[i + 1]];
      }
    }

    return [signal!, curState];
  }

  /*function addSignal(
    proxyId: number,
    path: (string | number)[],
  ): [signal: Signal<any>, signalState: any] {
    const prev = signals[proxyId];
    if (prev != null) {
      let curObj: IDeepSignalStorage = deepSignalStorage[prev.path[0]];

      for (let i = 1; i < prev.path.length; i += 1) {
        curObj = curObj[prev.path[i]];
      }

      curObj[sigs] = curObj[sigs].filter((s) => s.proxyId !== proxyId);
    }

    let curState: any = (currentState as any)[path[0]];

    if (deepSignalStorage[path[0]] == null) {
      deepSignalStorage[path[0]] = {
        [sigs]: [],
      };
    }

    let curObj = deepSignalStorage[path[0]];
    let signal: Signal<any>;
    for (let i = 0; i < path.length; i += 1) {
      if (i === path.length - 1) {
        // We are at the final index
        signal = createSignal(curState);

        curObj[sigs].push({
          signal,
          proxyId,
        });
      } else {
        if (curState != null) {
          curState = curState[path[i + 1]];
        }

        if (curObj[path[i + 1]] == null) {
          curObj[path[i + 1]] = {
            [sigs]: [],
          };
        }

        curObj = curObj[path[i + 1]];
      }
    }

    signals[proxyId] = {
      path,
      signal: signal!,
    };

    console.log(`Added a signal with proxy ID: ${proxyId}`);

    return [signal!, curState];
  }*/

  function updateSignals(patches: Patch[]) {
    for (const patch of patches) {
      let curSigObj: IDeepSignalStorage = deepSignalStorage[patch.path[0]];
      let curState: any = (currentState as any)[patch.path[0]];

      for (let i = 0; i < patch.path.length; i += 1) {
        if (curSigObj == null) {
          break;
        }

        if (i < patch.path.length - 1) {
          // We're still making our way towards the last index
          /*for (const sig of curSigObj[sigs]) {
            sig.signal[1](curState);
          }*/
          curSigObj[sigs]?.signal[1](curState);

          if (curState != null) {
            curState = curState[patch.path[i + 1]];
          }

          curSigObj = curSigObj[patch.path[i + 1]];
        } else {
          // We're on the last index
          /*for (const sig of curSigObj[sigs]) {

          }*/
          if (patch.op === "remove") {
            curSigObj[sigs]?.signal[1](undefined);
          } else {
            curSigObj[sigs]?.signal[1](patch.value);
          }

          break;
        }
      }
    }
  }

  const update = (updater: TUpdater<T>) => {
    const [nextState, patches, inversePatches] = produceWithPatches(currentState, (s: Draft<T>) => {
      updater(s, currentState);
    });

    currentState = nextState;
    updateSignals(patches);
  };

  /*function innerProxy(
    [signal, signalState]: [Signal<any>, any],
    proxyId: number,
    currentPath: (string | number | Symbol)[],
  ) {
    if (typeof signalState !== "object") {
      return signalState;
    } else {
      return new Proxy(signalState, {
        get(target: {}, p: string | number | symbol, receiver: any): any {
          const path = [...currentPath, p];
          console.log(`Trying to get path`, path);
          // const signal = addSignal(proxyId, path as any);
          // const signalValue = signal[0]();
          // console.log(`Signal value`, signalValue);
          // const newProxy = innerProxy(signalValue, proxyId, path);
          // console.log("New proxy", newProxy);
          // return newProxy;
          const output = addSignal(proxyId, path as any);
          return innerProxy(output, proxyId, path);
        },
        apply(target: any, thisArg: any, argArray: any[]): any {
          return signals[proxyId].signal[0]();
        },
      });
    }
  }*/

  /*const stateProxy = new Proxy(
    {},
    {
      get(target: {}, p: string | number | symbol): any {
        const proxyId = ord++;
        const path = [p];
        const output = addSignal(proxyId, path as any);
        return innerProxy(output, proxyId, path);
      },
    },
  );*/

  const storeInternal = {
    ord: 0,
  };

  const db = new DeepProxy(
    {},
    {
      get(target, path, receiver) {
        console.log(`Getting proxied things`, { target, path });
        return this.nest(function () {});
      },
      apply(target, thisArg, argList) {
        const [signal] = addSignalPathId(this.path as any);
        return signal[0]();
      },
    },
  );

  return {
    state: db as TFunctionified<T>,
    update,
  };
}
