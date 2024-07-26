import { Client, Collection } from 'discord.js';
import { existsSync, mkdirSync } from 'fs';
import Utils from '@utils';
import { Logger } from '@utils';
import { Command, Expansion, Leaderboard, Plugin } from '@itsmybot'
import { ClientOptions, ManagerOptions, Services, ManagerConfigs, BaseConfig } from '@contracts';

import EventService, { EventExecutor } from './services/events/eventService.js';
import UserService from './services/users/userService.js';
import CommandService from './services/commands/commandService.js';
import EngineService from './services/engine/engineService.js';
import PluginService from './services/plugins/pluginService.js';
import DatabaseService from './services/database/databaseService.js';
import ExpansionService from './services/expansions/expansionService.js';
import ComponentService from './services/components/componentService.js';
import LeaderboardService from './services/leaderboards/leaderboardService.js';
import DefaultConfig from 'core/resources/config.js';
import CommandConfig from 'core/resources/commands.js';
import LangConfig from 'core/resources/lang.js';

export class Manager {
  public client: Client;
  public services: Services = {} as Services;
  public configs: ManagerConfigs = {} as ManagerConfigs;

  public managerOptions: ManagerOptions;
  public commands = new Collection<string, Command>();
  public events = new Collection<string, EventExecutor>();
  public plugins = new Collection<string, Plugin>();
  public expansions = new Collection<string, Expansion>();
  public leaderboards = new Collection<string, Leaderboard>();
  public components = {
    buttons: new Collection<string, any>(),
    selectMenus: new Collection<string, any>(),
    modals: new Collection<string, any>()
  }
  public logger = new Logger();
  public primaryGuildId: string;

  constructor(clientOptions: ClientOptions, managerOptions: ManagerOptions) {
    this.client = new Client(clientOptions);

    this.managerOptions = managerOptions;

    if (!existsSync(managerOptions.dir.configs)) mkdirSync(managerOptions.dir.configs);
    if (!existsSync(managerOptions.dir.plugins)) mkdirSync(managerOptions.dir.plugins);
    if (!existsSync(managerOptions.dir.logs)) mkdirSync(managerOptions.dir.logs);
  }

  public async initialize(): Promise<void> {
    this.configs.config = await new BaseConfig({ logger: this.logger, configFilePath: "configs/config.yml", defaultFilePath: "build/core/resources/config.yml", ConfigClass: DefaultConfig }).initialize()
    this.configs.commands = await new BaseConfig({ logger: this.logger, configFilePath: "configs/commands.yml", defaultFilePath: "build/core/resources/commands.yml", ConfigClass: CommandConfig }).initialize()
    this.configs.lang = await new BaseConfig({ logger: this.logger, configFilePath: "configs/lang.yml", defaultFilePath: "build/core/resources/lang.yml", ConfigClass: LangConfig }).initialize()

    this.primaryGuildId = this.configs.config.getString("primary-guild");

    this.services.engine = await Utils.serviceFactory.createService(EngineService, this);
    this.services.database = await Utils.serviceFactory.createService(DatabaseService, this);
    this.services.expansion = await Utils.serviceFactory.createService(ExpansionService, this);
    this.services.user = await Utils.serviceFactory.createService(UserService, this);
    this.services.event = await Utils.serviceFactory.createService(EventService, this);
    this.services.command = await Utils.serviceFactory.createService(CommandService, this);
    this.services.component = await Utils.serviceFactory.createService(ComponentService, this);
    this.services.leaderboard = await Utils.serviceFactory.createService(LeaderboardService, this);
    this.services.plugin = await Utils.serviceFactory.createService(PluginService, this);

    await this.services.engine.loadCustomCommands();
    this.services.event.initializeEvents();
    this.services.leaderboard.registerLeaderboards();

    this.client.login(this.configs.config.getString("token"));
  }
}