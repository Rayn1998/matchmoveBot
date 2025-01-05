import TelegramBot from "node-telegram-bot-api";
import { botKey } from "../constant";
import { IMatchmoveBot } from "./bot.interface";
import { Requests } from "../requests/requests.service";

// FUNCTIONS
import {
    startFunc,
    matchmoveRequestFunc,
    queryHanlderFunc,
    getRequestsFunc,
    clearRequestsFunc,
} from "./bot.service.funcs";

export class MatchmoveBot implements IMatchmoveBot {
    bot: TelegramBot;
    userRequests: Requests;

    constructor() {
        this.bot = new TelegramBot(botKey, { polling: true });
        this.userRequests = new Requests();
    }

    async sendMessage(chatId: number, message: string, options?: any) {
        try {
            await this.bot.sendMessage(chatId, message, options);
        } catch (err) {
            throw err;
        }
    }

    async listen() {
        this.bot.onText(/\/start/, async (msg) => {
            await startFunc(this.bot, msg);
        });

        this.bot.onText(/Посмотреть запросы/, async (msg) => {
            await getRequestsFunc(this, msg);
        });

        this.bot.onText(/Удалить все сохранённые запросы/, async (msg) => {
            await clearRequestsFunc(this, msg);
        });

        this.bot.onText(/Запрос на трек/, async (msg) => {
            await this.userRequests.createRequest(this, msg.chat.id);
        });

        this.bot.on("message", async (msg) => {
            await matchmoveRequestFunc(this, msg);
        });

        this.bot.on("callback_query", async (query) => {
            await queryHanlderFunc(this, query);
        });
    }
}
