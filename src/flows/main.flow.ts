
import { createFlow } from '../flow';
import { CounterComponent } from './Counter.component';
import { RenameComponent } from './Rename.component';
import { getCounterQuery, incrementCounterCommand, decrementCounterCommand, renameCounterCommand } from '../core/counter';
import { noopCommand } from '../core/common';

export const mainFlow = createFlow('main', {
  'counter': {
    component: CounterComponent,
    onEnter: getCounterQuery,
    onAction: {
      'increment': {
        command: incrementCounterCommand,
        refresh: true,
      },
      'decrement': {
        command: decrementCounterCommand,
        refresh: true,
      },
      'rename': {
        command: noopCommand, // Use no-op for simple state transition
        // Use a function to avoid circular reference issue on module load
        nextState: () => mainFlow.states.rename,
      },
    },
  },
  'rename': {
    component: RenameComponent,
    onEnter: getCounterQuery, // Also get current data for the view
    onAction: {
      // Go back to the previous screen
      'back': {
        command: noopCommand, // Use no-op for simple state transition
        nextState: () => mainFlow.states.counter,
      },
    },
    onText: {
      // The framework handles parameter mapping from the pattern to the command's input schema.
      ':newName': {
        command: renameCounterCommand, // Pass the command directly
        nextState: () => mainFlow.states.counter,
      },
    },
  },
});
