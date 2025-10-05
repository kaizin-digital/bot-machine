import { z } from 'zod';
import { format, Keyboard, MessagePayload } from '../../../src';
import { processVpnOrderCommand } from '../logic/vpn';
import { InfoPanel, SuccessMessage } from '../../../src/ui-kit';

// The props for this component are inferred from the output of the command that led to this state.
type Props = z.infer<typeof processVpnOrderCommand.output>;

export const CompleteComponent = async (props: Props): Promise<MessagePayload> => {
  const text = format(() => [
    SuccessMessage({ title: 'Payment Successful!', details: 'Your VPN configuration file is ready.' }),
    InfoPanel({
      keyValues: {
        'File Name': props.fileName,
        'Config': props.fileContent,
      },
    }),
  ]);

  const keyboard = new Keyboard().text('Start Over', 'start_over');

  return {
    ...text,
    reply_markup: keyboard.inline(),
  };
};
