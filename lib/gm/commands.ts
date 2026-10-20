/** Slash commands recognized by the GM chat input, shown as typing suggestions. */
export interface GmCommand {
  command: string;
  description: string;
}

export const GM_COMMANDS: GmCommand[] = [
  {
    command: '/start_session',
    description: 'Bookmarks the scene as played and asks the GM for a "Previously on..." recap before play resumes.',
  },
  {
    command: '/end_session',
    description: 'Asks the GM for a bullet-point summary of the session and saves it to the campaign\'s session memory.',
  },
];
