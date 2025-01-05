import { MatchmoveBot } from "./bot/bot.service";

export class App {
    matchmoveBot: MatchmoveBot;

    constructor() {
        this.matchmoveBot = new MatchmoveBot();
    }

    async init() {
        this.matchmoveBot.listen();
    }
}
