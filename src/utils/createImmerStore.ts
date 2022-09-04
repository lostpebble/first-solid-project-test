import { applyPatches, Draft, enablePatches, Patch, produceWithPatches } from "immer";
import { createSignal, Signal } from "solid-js";
import DeepProxy from "proxy-deep";

enablePatches();
type NotWrappable = string | number | bigint | symbol | boolean | Function | null | undefined;

type TUpdater<T> = (draft: Draft<T>, original: T) => void;

type TFunctionified<O extends any> = {
  [K in keyof O]: O[K] extends string | number | bigint | boolean | symbol | null | undefined
    ? () => O[K]
    : (() => O[K]) & TFunctionified<O[K]>;
};

interface IImmerStore<T extends object> {
  state: TFunctionified<T>;
  update: (updater: TUpdater<T>) => void;
  undo: () => void;
  redo: () => void;
}

const sigs: unique symbol = Symbol("sigs");

interface IStoredSymbol {
  signal: Signal<any>;
}

interface IDeepSignalStorage {
  [sigs]?: IStoredSymbol;

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
  console.log(storePatches);

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
          curSigObj[sigs]?.signal[1](curState);

          if (curState != null) {
            curState = curState[patch.path[i + 1]];
          }

          curSigObj = curSigObj[patch.path[i + 1]];
        } else {
          // We're on the last index
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
        return this.nest(function () {});
      },
      apply(target, thisArg, argList) {
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
