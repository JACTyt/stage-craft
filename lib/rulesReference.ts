export interface RuleEntry {
  title: string;
  body: string;
}

/** Static D&D 5e SRD quick-reference — not campaign data, ships with the app. */
export const SRD_QUICK_REFERENCE: RuleEntry[] = [
  {
    title: 'Advantage & Disadvantage',
    body: 'Roll two d20s. With advantage, take the higher; with disadvantage, take the lower. They never stack — with both, roll normally.',
  },
  {
    title: 'Cover',
    body: 'Half cover: +2 AC and +2 Dex saves. Three-quarters cover: +5 AC and +5 Dex saves. Full cover: cannot be targeted directly.',
  },
  {
    title: 'Common Conditions',
    body: "Prone: melee attacks against you have advantage, ranged have disadvantage; your attacks have disadvantage. Grappled/Restrained: speed 0 (Restrained also gives attackers advantage against you and disadvantage on your attacks and Dex saves). Stunned: incapacitated, auto-fails Str/Dex saves, attacks against you have advantage.",
  },
  {
    title: 'Actions in Combat',
    body: 'On your turn: one action, one move up to your speed, one bonus action (if granted), and free object interaction. Reactions (like opportunity attacks) trigger off specific events and can be used on any turn, including others’.',
  },
  {
    title: 'Death Saves',
    body: 'At 0 HP you are unconscious. On your turn, roll a d20: 10+ succeeds, below 10 fails. Three failures means death. A natural 20 regains 1 HP. Taking damage at 0 HP causes one failure (two if it’s a critical hit).',
  },
];
