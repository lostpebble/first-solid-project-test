import { applyPatches, Draft, enablePatches, Patch, produceWithPatches } from "immer";
import { createSignal, Signal } from "solid-js";
import DeepProxy from "proxy-deep";

enablePatches();
type NotWrappable = string | number | bigint | symbol | boolean | Function | null | undefined;

type TUpdater<T> = (draft: Draft<T>, original: T) => void;

export type TFunctionified<O extends any> = O extends Array<infer T> ? ({
  [ind: number]: (() => T) & Required<TFunctionified<T>>;
  length: () => number;
}) : {
  [K in keyof O]: Required<TFunctionified<O[K]>> & (() => O[K]);
};

interface IImmerStore<T extends object> {
  state: TFunctionified<T>;
  update: (updater: TUpdater<T>) => void;
  undo: () => void;
  redo: () => void;
}

const sigs: unique symbol = Symbol("sigs");
const childSigs: unique symbol = Symbol("child_sigs");

interface IStoredSymbol {
  signal: Signal<any>;
}

interface IDeepSignalStorage {
  [sigs]?: IStoredSymbol;
  [childSigs]?: IStoredSymbol;

  [key: number | string]: IDeepSignalStorage;
}

export function createImmerStore<T extends object>(
  initialValue: T extends NotWrappable ? never : T,
): IImmerStore<T> {
  const getInitialValue = (): T => initialValue;
  let currentState: T = initialValue;

  const storePatches: { forward: Patch[][]; reverse: Patch[][]; head: number } = {
    head: 0,
    forward: [],
    reverse: [],
  };

  const deepSignalStorage: {
    [key: number | string]: IDeepSignalStorage;
  } = {};

  console.log(deepSignalStorage);
  console.log(storePatches);

  function addSignalPathId(path: (string | number)[]): [signal: Signal<any>, signalState: any] {
    let curState: any = (currentState as any)[path[0]];

    if (deepSignalStorage[path[0]] === undefined) {
      deepSignalStorage[path[0]] = {};
    }

    let sigStore = deepSignalStorage[path[0]];
    let signal: Signal<any>;
    for (let i = 0; i < path.length; i += 1) {
      if (i === path.length - 1) {
        // We are at the final index
        if (sigStore[sigs] === undefined) {
          signal = createSignal(curState);
          sigStore[sigs] = { signal };
        } else {
          signal = sigStore[sigs].signal;
        }
      } else {
        if (curState != null) {
          curState = curState[path[i + 1]];
        }

        if (sigStore[path[i + 1]] === undefined) {
          sigStore[path[i + 1]] = {};
        }

        sigStore = sigStore[path[i + 1]];
      }
    }

    return [signal!, curState];
  }

  function replaceAllDeepSignals(deepSignals: IDeepSignalStorage, newState: any) {
    deepSignals[sigs]?.signal[1](newState);

    for (const key in deepSignals) {
      replaceAllDeepSignals(deepSignals[key], newState[key]);
    }
  }

  function updateSignals(patches: Patch[]) {
    for (const patch of patches) {
      console.log("Need to apply patch", patch);
      let curSigObj: IDeepSignalStorage = deepSignalStorage[patch.path[0]];
      let curState: any = (currentState as any)[patch.path[0]];

      for (let i = 0; i < patch.path.length; i += 1) {
        if (curSigObj === undefined) {
          break;
        }

        if (i < patch.path.length - 1) {
          // We're still making our way towards the last index
          curSigObj[sigs]?.signal[1](curState);

          if (i === patch.path.length - 2) {
            // We're at the second last place
            if (patch.op === "remove" || patch.op === "add") {
              if (typeof patch.path[i + 1] === "number") {
                const newLength = curState.length;
                // We're looking at an array item probably, attempt to signal to length as well
                curSigObj["length"]?.[sigs]?.signal[1](newLength);
              }
            }
          }

          if (curState != null) {
            curState = curState[patch.path[i + 1]];
          }
          curSigObj = curSigObj[patch.path[i + 1]];
        } else {
          // We're on the last index
          if (patch.op === "remove") {
            curSigObj[sigs]?.signal[1](undefined);
          } else {
            if (patch.op === "replace") {
              // Need to go deeper to make sure all signals are updated (if there are any)
              replaceAllDeepSignals(curSigObj, patch.value);
            } else {
              curSigObj[sigs]?.signal[1](patch.value);
            }
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

    if (storePatches.head < 0) {
      storePatches.forward = storePatches.forward.slice(0, storePatches.head);
      storePatches.reverse = storePatches.reverse.slice(0, storePatches.head);
    }

    storePatches.forward.push(patches);
    storePatches.reverse.push(inversePatches);
    storePatches.head = 0;

    currentState = nextState;
    updateSignals(patches);
  };

  const undo = () => {
    const currentIndex = storePatches.reverse.length - 1 + storePatches.head;
    if (currentIndex >= 0) {
      const reversePatches = storePatches.reverse[currentIndex];
      currentState = applyPatches(currentState, reversePatches);
      updateSignals(reversePatches);
      storePatches.head -= 1;
    }
  };

  const redo = () => {
    const currentIndex = storePatches.forward.length - 1 + (storePatches.head + 1);
    if (currentIndex >= 0 && currentIndex < storePatches.forward.length) {
      const forwardPatches = storePatches.forward[currentIndex];
      currentState = applyPatches(currentState, forwardPatches);
      updateSignals(forwardPatches);
      storePatches.head += 1;
    }
  };

  const stateProxy = new DeepProxy(
    {},
    {
      get(target, path, receiver) {
        console.log(`Getting path: ${String(path)}`);
        return this.nest(function () {});
      },
      apply(target, thisArg, argList) {
        console.log(`running func ${this.path.join(", ")}`);
        const [signal] = addSignalPathId(this.path as any);
        return signal[0]();
      },
    },
  );

  return {
    state: stateProxy as TFunctionified<T>,
    update,
    undo,
    redo,
  };
}
