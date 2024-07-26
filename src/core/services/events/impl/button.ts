import { Context, Events } from '@contracts';
import { Event, User } from '@itsmybot';
import { ButtonInteraction } from 'discord.js';

export default class ButtonEvent extends Event {
  name = Events.Button;

  async execute(interaction: ButtonInteraction<'cached'>, user: User) {
    if (!interaction.customId.startsWith("script_")) return;

    const context: Context = {
      guild: interaction.guild || undefined,
      member: interaction.member || undefined,
      user: user,
      channel: interaction.channel || undefined,
      content: interaction.customId.replace("script_", ""),
      interaction: interaction
    };

    this.manager.services.engine.handleEvent('button', context);
  }
};