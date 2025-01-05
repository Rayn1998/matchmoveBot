import TelegramBot from "node-telegram-bot-api";
import { botKey, registeredCommands } from "../constant";
import { IMatchmoveBot } from "./bot.interface";
import { Requests } from "../requests/requests.service";

// FUNCTIONS
import {
    startFunc,
    matchmoveRequestFunc,
    queryHanlderFunc,
    getRequestsFunc,
    clearRequestsFunc,
    helpFunc,
} from "./bot.service.funcs";

export class MatchmoveBot implements IMatchmoveBot {
    bot: TelegramBot;
    userRequests: Requests;

    constructor() {
        this.bot = new TelegramBot(botKey, { polling: true });
        this.userRequests = new Requests();

        this.bot.setMyCommands([
            {
                command: "/start",
                description: "Начать взаимодействие с ботом",
            },
            {
                command: "/help",
                description: "Доступные команды",
            },
        ]);
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

        this.bot.onText(/\/help/, async (msg) => {
            await helpFunc(this, msg.chat.id);
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
            const msgText = msg.text;

            if (
                msgText &&
                registeredCommands.some((regex) => regex.test(msgText))
            ) {
                return;
            }

            const isRequestProcessed = await matchmoveRequestFunc(this, msg);

            if (!isRequestProcessed) {
                await this.sendMessage(
                    msg.chat.id,
                    "Данный бот может только обрабатывать запрос на трек. Все лишние сообщения, что вы отправляете только мусорят этот чат)",
                );
            }
        });

        this.bot.on("callback_query", async (query) => {
            await queryHanlderFunc(this, query);
        });
    }
}
